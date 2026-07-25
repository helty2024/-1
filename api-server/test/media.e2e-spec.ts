import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AdminUserStatus } from './../src/generated/prisma/enums';
import { PrismaService } from './../src/modules/prisma/prisma.service';
import { getMediaStorageRoot } from './../src/modules/media/media-storage';

interface Envelope<T> {
  code: number;
  data: T;
}

interface LoginData {
  accessToken: string;
}

interface MediaData {
  id: string;
  originalName: string;
  objectKey: string;
  bucket: string;
  region: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  url: string;
}

describe('Media management workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId = '';
  let assetId = '';
  let objectKey = '';
  let token = '';

  const suffix = Date.now();
  const username = `e2e_media_${suffix}`;
  const password = 'MediaTestPass_2026!';
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: 'super_admin' },
    });
    const admin = await prisma.adminUser.create({
      data: {
        username,
        displayName: '媒体测试管理员',
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        status: AdminUserStatus.ACTIVE,
        roles: { create: { roleId: role.id } },
      },
    });
    adminId = admin.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username, password })
      .expect(201);
    token = (login.body as Envelope<LoginData>).data.accessToken;
  });

  it('rejects a spoofed image before it enters storage', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/media-assets/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not-a-real-png'), {
        filename: 'spoofed.png',
        contentType: 'image/png',
      })
      .expect(400);

    const count = await prisma.mediaAsset.count({
      where: { originalName: 'spoofed.png' },
    });
    expect(count).toBe(0);
  });

  it('uploads and lists an image', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/media-assets/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, {
        filename: 'media-test.png',
        contentType: 'image/png',
      })
      .expect(201);
    const asset = (response.body as Envelope<MediaData>).data;
    assetId = asset.id;
    objectKey = asset.objectKey;
    expect(asset.mimeType).toBe('image/png');
    expect(asset.bucket).toBe('local-media');
    expect(asset.region).toBe('local');
    expect(asset.sizeBytes).toBe(png.length);
    expect(asset.url).toContain(asset.objectKey);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/media-assets?kind=image&search=media-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((listResponse.body as Envelope<MediaData[]>).data).toHaveLength(1);
  });

  it('updates the file description', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/admin/media-assets/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ altText: '测试图片说明' })
      .expect(200);
    expect((response.body as Envelope<MediaData>).data.altText).toBe(
      '测试图片说明',
    );
  });

  it('soft deletes the record and writes audit logs', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/admin/media-assets/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const auditCount = await prisma.auditLog.count({
      where: { resource: 'media_asset', resourceId: assetId },
    });
    expect(auditCount).toBeGreaterThanOrEqual(3);
  });

  afterAll(async () => {
    if (assetId) await prisma.mediaAsset.delete({ where: { id: assetId } });
    if (objectKey)
      await rm(join(getMediaStorageRoot(), objectKey), { force: true });
    if (adminId) await prisma.adminUser.delete({ where: { id: adminId } });
    await app.close();
  });
});
