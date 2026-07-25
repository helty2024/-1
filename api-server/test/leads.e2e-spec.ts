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

interface FormData {
  id: string;
  code: string;
  fields: Array<{ fieldKey: string }>;
}

interface FormSummary {
  code: string;
  leadType: string;
  fieldCount: number;
}

interface LeadData {
  id: string;
  type: string;
  status: string;
  values: Record<string, unknown>;
  followups: Array<{ content: string }>;
}

interface LeadListData {
  items: LeadData[];
  total: number;
}

describe('Dynamic forms and lead workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId = '';
  let formId = '';
  let leadId = '';
  let token = '';

  const suffix = Date.now();
  const username = `e2e_leads_${suffix}`;
  const password = 'LeadTestPass_2026!';
  const formCode = `e2e-consult-${suffix}`;
  const submissionId = `submit_${suffix}_securitytest`;
  const suffixHex = suffix.toString(16).padStart(12, '0');
  const testIp = `2001:db8:${suffixHex.slice(0, 4)}:${suffixHex.slice(4, 8)}:${suffixHex.slice(8, 12)}::1`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
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
        displayName: '线索闭环测试管理员',
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

  it('creates a published dynamic form', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: formCode,
        name: '闭环测试咨询',
        leadType: 'consult',
        title: '提交闭环测试咨询',
        subtitle: '仅用于自动化测试',
        successMessage: '测试线索已提交',
        status: 'published',
        fields: [
          {
            fieldKey: 'name',
            label: '姓名',
            fieldType: 'text',
            placeholder: '请输入姓名',
            options: [],
            required: true,
            validation: { minLength: 2 },
            sortOrder: 0,
            isVisible: true,
          },
          {
            fieldKey: 'phone',
            label: '手机号',
            fieldType: 'phone',
            placeholder: '请输入手机号',
            options: [],
            required: true,
            validation: { pattern: '^1[3-9]\\d{9}$' },
            sortOrder: 1,
            isVisible: true,
          },
          {
            fieldKey: 'topic',
            label: '咨询类型',
            fieldType: 'select',
            placeholder: '请选择',
            options: ['产品咨询', '品牌资质'],
            required: true,
            validation: {},
            sortOrder: 2,
            isVisible: true,
          },
        ],
      })
      .expect(201);
    const form = (response.body as Envelope<FormData>).data;
    formId = form.id;
    expect(form.fields).toHaveLength(3);
  });

  it('rejects unsafe administrator-defined validation patterns', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `${formCode}-unsafe`,
        name: '不安全规则测试',
        leadType: 'consult',
        title: '不安全规则测试',
        status: 'draft',
        fields: [
          {
            fieldKey: 'name',
            label: '姓名',
            fieldType: 'text',
            options: [],
            required: true,
            validation: { pattern: '^(a+)+$' },
            sortOrder: 0,
            isVisible: true,
          },
        ],
      })
      .expect(400);
  });

  it('serves the form publicly and validates required fields', async () => {
    const publicForms = await request(app.getHttpServer())
      .get('/api/v1/public/forms?leadType=consult')
      .expect(200);
    const summaries = (publicForms.body as Envelope<FormSummary[]>).data;
    expect(summaries.some((form) => form.code === formCode)).toBe(true);
    expect(summaries.every((form) => form.leadType === 'consult')).toBe(true);

    const publicForm = await request(app.getHttpServer())
      .get(`/api/v1/public/forms/${formCode}`)
      .expect(200);
    expect((publicForm.body as Envelope<FormData>).data.code).toBe(formCode);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({ formCode, values: { name: '测试客户', topic: '产品咨询' } })
      .expect(400);
  });

  it('submits, filters, updates and follows up a lead', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        submissionId,
        formStartedAt: new Date(Date.now() - 5000).toISOString(),
        values: { name: '测试客户', phone: '13800138000', topic: '产品咨询' },
      })
      .expect(201);
    const createdLead = (create.body as Envelope<LeadData>).data;
    leadId = createdLead.id;
    expect(createdLead.values.phone).toBe('13800138000');

    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
    });
    expect(JSON.stringify(stored.payloadJson)).not.toContain('13800138000');
    expect(JSON.stringify(stored.payloadJson)).not.toContain('测试客户');
    expect(stored.mobileEncrypted).not.toContain('13800138000');
    expect(stored.mobileHash).toHaveLength(64);
    expect(
      (stored.sourceDetail as { submitIpHash?: string }).submitIpHash,
    ).toHaveLength(64);

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        submissionId,
        values: { name: '测试客户', phone: '13800138000', topic: '产品咨询' },
      })
      .expect(201);
    expect((duplicate.body as Envelope<LeadData>).data.id).toBe(leadId);
    expect(await prisma.lead.count({ where: { formId } })).toBe(1);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        website: 'https://spam.example',
        values: { name: '机器人', phone: '13800138001', topic: '产品咨询' },
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        values: {
          name: '未知字段测试',
          phone: '13800138002',
          topic: '产品咨询',
          forgedRole: 'admin',
        },
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        values: {
          name: '超长内容测试',
          phone: '13800138003',
          topic: '产品咨询'.repeat(100),
        },
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        submissionId,
        values: { name: '测试客户', phone: '13800138000', topic: '产品咨询' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .set('X-Forwarded-For', testIp)
      .send({
        formCode,
        source: 'web',
        values: { name: '限流测试', phone: '13800138005', topic: '产品咨询' },
      })
      .expect(429);

    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/leads?type=consult&status=new&page=1&pageSize=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listData = (list.body as Envelope<LeadListData>).data;
    expect(listData.items.some((item) => item.id === leadId)).toBe(true);

    const status = await request(app.getHttpServer())
      .patch(`/api/v1/admin/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'qualified' })
      .expect(200);
    expect((status.body as Envelope<LeadData>).data.status).toBe('qualified');

    const followup = await request(app.getHttpServer())
      .post(`/api/v1/admin/leads/${leadId}/followups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        followType: 'phone',
        content: '已电话沟通，安排下一轮资料确认。',
        nextStatus: 'contacted',
      })
      .expect(201);
    const followedLead = (followup.body as Envelope<LeadData>).data;
    expect(followedLead.status).toBe('contacted');
    expect(followedLead.followups[0]?.content).toContain('电话沟通');

    await request(app.getHttpServer())
      .get(`/api/v1/admin/leads/${leadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('exports all filtered leads as UTF-8 CSV and records an audit log', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/leads/export?type=consult&status=contacted')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /text\/csv/)
      .expect(200);

    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="leads-\d{8}-\d{6}\.csv"$/,
    );
    expect(response.headers['x-export-count']).toBe('1');
    expect(response.text.startsWith('\uFEFF')).toBe(true);
    expect(response.text).toContain('线索编号');
    expect(response.text).toContain('测试客户');
    expect(response.text).toContain('13800138000');
    expect(response.text).toContain('产品咨询');
    expect(response.text).toContain('已电话沟通');

    const auditLog = await prisma.auditLog.findFirst({
      where: { adminUserId: adminId, action: 'lead_export' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLog).not.toBeNull();
    expect(JSON.stringify(auditLog?.afterJson)).toContain('"count":1');
  });

  afterAll(async () => {
    if (leadId) await prisma.lead.delete({ where: { id: leadId } });
    if (formId) await prisma.leadForm.delete({ where: { id: formId } });
    if (adminId) await prisma.adminUser.delete({ where: { id: adminId } });
    await app.close();
  });
});
