import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AdminUserStatus } from './../src/generated/prisma/enums';
import { PrismaService } from './../src/modules/prisma/prisma.service';

interface Envelope<T> {
  code: number;
  data: T;
}

interface LoginData {
  accessToken: string;
}

interface ProductData {
  id: string;
  slug: string;
  name: string;
  status: string;
  version: number;
  evidence: { title: string } | null;
}

describe('Product management workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId = '';
  let productId = '';
  let token = '';

  const suffix = Date.now();
  const username = `e2e_product_${suffix}`;
  const password = 'ProductTestPass_2026!';
  const slug = `e2e-product-${suffix}`;
  const payload = {
    slug,
    categoryCode: 'test-product',
    name: '测试产品',
    shortName: '测试款',
    subtitle: '产品管理自动化测试',
    category: '测试分类',
    position: '用于验证产品管理闭环。',
    people: '测试人群',
    channels: '测试渠道',
    role: '测试定位',
    listNote: '测试产品列表简介',
    listScene: '适合：自动化测试',
    coverImage: '/images/test-product.jpg',
    images: {
      main: '/images/test/main.jpg',
      detail: '/images/test/detail.jpg',
      scene: '/images/test/scene.jpg',
      material: '/images/test/material.jpg',
      other: '/images/test/other.jpg',
    },
    sellingPoints: ['卖点一', '卖点二'],
    evidence: {
      title: '测试证据',
      intro: '测试专属证据板块',
      image: '/images/test/evidence.jpg',
      items: [{ no: '01', title: '真实', desc: '用于验证结构化保存。' }],
    },
    material: '测试原料',
    craft: '测试工艺',
    specs: [{ label: '规格', value: '1盒' }],
    scenarios: ['测试场景'],
    agencyValue: ['测试招商价值'],
    compliance: '测试合规说明',
    sortOrder: 990,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'super_admin' } });
    const admin = await prisma.adminUser.create({
      data: {
        username,
        displayName: '产品测试管理员',
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

  it('creates a product draft with a product-specific section', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    const product = (response.body as Envelope<ProductData>).data;
    productId = product.id;
    expect(product.status).toBe('draft');
    expect(product.evidence?.title).toBe('测试证据');

    await request(app.getHttpServer())
      .get(`/api/v1/public/products/${slug}`)
      .expect(404);
  });

  it('updates, publishes and exposes the product publicly', async () => {
    const updated = await request(app.getHttpServer())
      .put(`/api/v1/admin/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, name: '更新后的测试产品' })
      .expect(200);
    expect((updated.body as Envelope<ProductData>).data.version).toBe(2);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
      .expect(200);

    const publicProduct = await request(app.getHttpServer())
      .get(`/api/v1/public/products/${slug}`)
      .expect(200);
    expect((publicProduct.body as Envelope<ProductData>).data.name).toBe('更新后的测试产品');
  });

  it('takes the product offline and records audit logs', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'offline' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/public/products/${slug}`)
      .expect(404);

    const auditCount = await prisma.auditLog.count({
      where: { resource: 'product', resourceId: productId },
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });

  afterAll(async () => {
    if (productId) await prisma.product.delete({ where: { id: productId } });
    if (adminId) await prisma.adminUser.delete({ where: { id: adminId } });
    await app.close();
  });
});
