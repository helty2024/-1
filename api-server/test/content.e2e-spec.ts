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

interface ContentData {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
  cardActionText: string;
  sections: Array<{
    title: string;
    image: string;
    showProductCards: boolean;
    cards: Array<{
      image?: string;
      fileUrl?: string;
      fileName?: string;
      actionText?: string;
      url?: string;
    }>;
  }>;
}

describe('Content management workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId = '';
  let pageId = '';
  let token = '';

  const suffix = Date.now();
  const username = `e2e_content_${suffix}`;
  const password = 'ContentTestPass_2026!';
  const slug = `e2e-content-${suffix}`;
  const payload = {
    slug,
    pageType: 'company',
    navTitle: '测试内容页',
    label: '测试标签',
    title: '内容管理闭环测试',
    subtitle: '仅用于自动化测试',
    cardActionText: '查看测试介绍',
    stats: [{ value: '1项', label: '测试指标' }],
    sections: [
      {
        title: '测试板块',
        body: '用于验证结构化内容保存。',
        image: '/storage/media/content-test.jpg',
        showProductCards: true,
        actionText: '查看全部',
        actionUrl: '/pages/category/index',
        actionTab: true,
        cards: [
          {
            title: '测试内容项',
            desc: '内容项说明',
            image: '/storage/media/content-card-test.jpg',
            fileUrl: 'http://localhost:3000/media/content-test.pdf',
            fileName: 'content-test.pdf',
            actionText: '查看详情',
            url: '/pages/official/content/index?type=company',
          },
        ],
      },
    ],
    timeline: [],
    cases: [],
    faq: [{ q: '是否为测试数据？', a: '是，测试完成后会自动清理。' }],
    primaryAction: {
      text: '提交咨询',
      url: '/pages/official/form-select/index?type=consult',
    },
  };

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
        displayName: '内容测试管理员',
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

  it('creates a draft that is not publicly visible', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/content-pages')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    const content = (response.body as Envelope<ContentData>).data;
    pageId = content.id;
    expect(content.status).toBe('draft');
    expect(content.sections).toHaveLength(1);
    expect(content.sections[0]?.image).toBe(
      '/storage/media/content-test.jpg',
    );
    expect(content.sections[0]?.showProductCards).toBe(true);
    expect(content.cardActionText).toBe('查看测试介绍');
    expect(content.sections[0]?.cards[0]?.actionText).toBe('查看详情');
    expect(content.sections[0]?.cards[0]?.image).toBe(
      '/storage/media/content-card-test.jpg',
    );
    expect(content.sections[0]?.cards[0]?.fileUrl).toBe(
      'http://localhost:3000/media/content-test.pdf',
    );

    await request(app.getHttpServer())
      .get(`/api/v1/public/content-pages/${slug}`)
      .expect(404);
  });

  it('updates, publishes and serves the structured page', async () => {
    const updated = await request(app.getHttpServer())
      .put(`/api/v1/admin/content-pages/${pageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, title: '更新后的内容标题' })
      .expect(200);
    expect((updated.body as Envelope<ContentData>).data.version).toBe(2);

    const published = await request(app.getHttpServer())
      .patch(`/api/v1/admin/content-pages/${pageId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
      .expect(200);
    expect((published.body as Envelope<ContentData>).data.status).toBe(
      'published',
    );

    const publicPage = await request(app.getHttpServer())
      .get(`/api/v1/public/content-pages/${slug}`)
      .expect(200);
    expect((publicPage.body as Envelope<ContentData>).data.title).toBe(
      '更新后的内容标题',
    );
  });

  it('takes the page offline and records audit logs', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/content-pages/${pageId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'offline' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/public/content-pages/${slug}`)
      .expect(404);

    const auditCount = await prisma.auditLog.count({
      where: { resource: 'content_page', resourceId: pageId },
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });

  afterAll(async () => {
    if (pageId) await prisma.contentPage.delete({ where: { id: pageId } });
    if (adminId) await prisma.adminUser.delete({ where: { id: adminId } });
    await app.close();
  });
});
