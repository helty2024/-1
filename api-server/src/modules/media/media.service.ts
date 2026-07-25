import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { extname } from 'node:path';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import type { Prisma } from '../../generated/prisma/client';
import { MediaAccessLevel, MediaStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { MediaKindInput, type MediaQueryDto } from './dto/media-query.dto';
import type { MediaMetadataDto } from './dto/media-metadata.dto';
import { validateMediaFile } from './media-file-validation';
import { createMediaObjectKey } from './media-storage';
import {
  MediaStorageService,
  type StoredMediaObject,
} from './media-storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
  ) {}

  async list(query: MediaQueryDto) {
    const where: Prisma.MediaAssetWhereInput = { deletedAt: null };
    if (query.kind === MediaKindInput.IMAGE)
      where.mimeType = { startsWith: 'image/' };
    if (query.kind === MediaKindInput.DOCUMENT) {
      where.NOT = { mimeType: { startsWith: 'image/' } };
    }
    if (query.search?.trim()) {
      where.OR = [
        { originalName: { contains: query.search.trim() } },
        { altText: { contains: query.search.trim() } },
      ];
    }

    const assets = await this.prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return assets.map((asset) => this.serialize(asset));
  }

  async upload(
    file: Express.Multer.File,
    dto: MediaMetadataDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    let stored: StoredMediaObject | null = null;
    try {
      await validateMediaFile(file);
      const objectKey = createMediaObjectKey(file);
      const sha256 = await this.hashFile(file.path);
      const originalName = this.normalizeOriginalName(file.originalname);
      const storageObject = await this.storage.store(file, objectKey);
      stored = storageObject;

      const asset = await this.prisma.$transaction(async (tx) => {
        const created = await tx.mediaAsset.create({
          data: {
            originalName,
            objectKey: storageObject.objectKey,
            bucket: storageObject.bucket,
            region: storageObject.region,
            mimeType: file.mimetype,
            extension:
              extname(storageObject.objectKey).replace(/^\./, '') || null,
            sizeBytes: BigInt(file.size),
            sha256,
            accessLevel: MediaAccessLevel.PUBLIC,
            status: MediaStatus.READY,
            altText: dto.altText?.trim() || null,
            uploadedById: adminUserId,
          },
        });
        await tx.auditLog.create({
          data: {
            adminUserId,
            action: 'media_upload',
            resource: 'media_asset',
            resourceId: created.id,
            afterJson: {
              originalName,
              objectKey: storageObject.objectKey,
              bucket: storageObject.bucket,
              region: storageObject.region,
              storageDriver: this.storage.activeDriver,
              mimeType: file.mimetype,
              sizeBytes: file.size,
            },
            ...this.auditContext(request),
          },
        });
        return created;
      });
      return this.serialize(asset);
    } catch (error) {
      if (stored) {
        await this.storage.delete(stored).catch(() => undefined);
      } else {
        await rm(file.path, { force: true }).catch(() => undefined);
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: MediaMetadataDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findAsset(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.update({
        where: { id },
        data: { altText: dto.altText?.trim() || null },
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: 'media_update',
          resource: 'media_asset',
          resourceId: id,
          beforeJson: { altText: current.altText },
          afterJson: { altText: dto.altText?.trim() || null },
          ...this.auditContext(request),
        },
      });
      return asset;
    });
    return this.serialize(updated);
  }

  async remove(id: string, adminUserId: string, request: RequestWithId) {
    const current = await this.findAsset(id);
    await this.prisma.$transaction([
      this.prisma.mediaAsset.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'media_delete',
          resource: 'media_asset',
          resourceId: id,
          beforeJson: {
            originalName: current.originalName,
            objectKey: current.objectKey,
          },
          ...this.auditContext(request),
        },
      }),
    ]);
    return { deleted: true };
  }

  private async findAsset(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('媒体文件不存在');
    return asset;
  }

  private serialize(asset: {
    id: string;
    originalName: string;
    objectKey: string;
    bucket: string;
    region: string;
    mimeType: string;
    extension: string | null;
    sizeBytes: bigint;
    width: number | null;
    height: number | null;
    sha256: string | null;
    accessLevel: MediaAccessLevel;
    status: MediaStatus;
    altText: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...asset,
      sizeBytes: Number(asset.sizeBytes),
      accessLevel: asset.accessLevel.toLowerCase(),
      status: asset.status.toLowerCase(),
      url: this.storage.publicUrl(asset),
      isImage: asset.mimeType.startsWith('image/'),
    };
  }

  private normalizeOriginalName(name: string) {
    if (/^[\x00-\x7F]*$/.test(name)) return name;
    try {
      const decoded = Buffer.from(name, 'latin1').toString('utf8');
      return decoded.includes('\uFFFD') ? name : decoded;
    } catch {
      return name;
    }
  }

  private hashFile(path: string) {
    return new Promise<string>((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(path);
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  private auditContext(request: RequestWithId) {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.requestId ?? request.id,
    };
  }
}
