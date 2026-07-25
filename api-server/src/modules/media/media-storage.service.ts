import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import COS from 'cos-nodejs-sdk-v5';
import { constants } from 'node:fs';
import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getMediaStorageRoot } from './media-storage';

export type MediaStorageDriver = 'local' | 'cos';

export interface StoredMediaObject {
  objectKey: string;
  bucket: string;
  region: string;
}

@Injectable()
export class MediaStorageService {
  private readonly driver: MediaStorageDriver;
  private readonly cos: COS | null;
  private readonly cosBucket: string;
  private readonly cosRegion: string;
  private readonly localBaseUrl: string;
  private readonly cosPublicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.driver = config.get<MediaStorageDriver>(
      'MEDIA_STORAGE_DRIVER',
      'local',
    );
    this.localBaseUrl = config
      .get<string>('MEDIA_PUBLIC_BASE_URL', 'http://localhost:3000/media')
      .replace(/\/$/, '');
    this.cosBucket = config.get<string>('COS_BUCKET', '');
    this.cosRegion = config.get<string>('COS_REGION', '');
    this.cosPublicBaseUrl = config
      .get<string>('COS_PUBLIC_BASE_URL', '')
      .replace(/\/$/, '');

    if (this.driver === 'cos') {
      this.cos = new COS({
        SecretId: config.getOrThrow<string>('COS_SECRET_ID'),
        SecretKey: config.getOrThrow<string>('COS_SECRET_KEY'),
        Protocol: 'https:',
        Timeout: 60_000,
      });
    } else {
      this.cos = null;
    }
  }

  get activeDriver() {
    return this.driver;
  }

  async store(
    file: Express.Multer.File,
    objectKey: string,
  ): Promise<StoredMediaObject> {
    if (this.driver === 'cos') {
      await this.storeInCos(file, objectKey);
      return {
        objectKey,
        bucket: this.cosBucket,
        region: this.cosRegion,
      };
    }

    const destination = resolve(getMediaStorageRoot(), ...objectKey.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    try {
      await rename(file.path, destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
      await copyFile(file.path, destination, constants.COPYFILE_EXCL);
      await rm(file.path, { force: true });
    }
    return { objectKey, bucket: 'local-media', region: 'local' };
  }

  async delete(object: StoredMediaObject) {
    if (object.bucket === 'local-media' || object.region === 'local') {
      const path = resolve(
        getMediaStorageRoot(),
        ...object.objectKey.split('/'),
      );
      await rm(path, { force: true });
      return;
    }
    if (!this.cos) return;
    await this.cos.deleteObject({
      Bucket: object.bucket,
      Region: object.region,
      Key: object.objectKey,
    });
  }

  publicUrl(object: StoredMediaObject) {
    const key = object.objectKey
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    if (object.bucket === 'local-media' || object.region === 'local') {
      return `${this.localBaseUrl}/${key}`;
    }
    const baseUrl =
      this.cosPublicBaseUrl ||
      `https://${object.bucket}.cos.${object.region}.myqcloud.com`;
    return `${baseUrl}/${key}`;
  }

  private async storeInCos(file: Express.Multer.File, objectKey: string) {
    if (!this.cos || !this.cosBucket || !this.cosRegion) {
      throw new Error('COS 存储配置不完整');
    }
    try {
      await this.cos.uploadFile({
        Bucket: this.cosBucket,
        Region: this.cosRegion,
        Key: objectKey,
        FilePath: file.path,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
        SliceSize: 5 * 1024 * 1024,
      });
    } finally {
      await rm(file.path, { force: true });
    }
  }
}
