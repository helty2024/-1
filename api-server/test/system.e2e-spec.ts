import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AdminUserStatus } from './../src/generated/prisma/enums';
import { PrismaService } from './../src/modules/prisma/prisma.service';

interface LoginBody {
  data: { accessToken: string };
}

interface PermissionBody {
  data: Array<{ id: string; code: string }>;
}

interface RoleBody {
  data: { id: string };
}

interface UserBody {
  data: { id: string; status: string };
}

describe('Admin users and role permissions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let operatorId = '';
  let managedUserId = '';
  let roleId = '';
  let superAdminRoleId = '';
  let operatorToken = '';

  const suffix = Date.now();
  const operatorUsername = `e2e_system_operator_${suffix}`;
  const managedUsername = `e2e_limited_admin_${suffix}`;
  const operatorPassword = 'OperatorPass_2026!';
  const initialPassword = 'InitialPass_2026!';
  const resetPassword = 'ResetPass_2026!';

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
    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: { code: 'super_admin' },
    });
    superAdminRoleId = superAdminRole.id;
    const operator = await prisma.adminUser.create({
      data: {
        username: operatorUsername,
        displayName: '权限测试操作员',
        passwordHash: await argon2.hash(operatorPassword, {
          type: argon2.argon2id,
        }),
        status: AdminUserStatus.ACTIVE,
        roles: { create: { roleId: superAdminRole.id } },
      },
    });
    operatorId = operator.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: operatorUsername, password: operatorPassword })
      .expect(201);
    operatorToken = (login.body as LoginBody).data.accessToken;
  });

  it('creates a limited admin and applies role permission changes immediately', async () => {
    const permissionResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/system/permissions')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    const permissionBody = permissionResponse.body as PermissionBody;
    const dashboardPermission = permissionBody.data.find(
      (item) => item.code === 'dashboard:read',
    );
    const userManagePermission = permissionBody.data.find(
      (item) => item.code === 'system:user_manage',
    );
    expect(dashboardPermission).toBeDefined();
    expect(userManagePermission).toBeDefined();

    const roleResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/system/roles')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        code: `e2e_limited_${suffix}`,
        name: '端到端受限角色',
        description: '自动化测试角色',
        permissionIds: [dashboardPermission!.id],
      })
      .expect(201);
    roleId = (roleResponse.body as RoleBody).data.id;

    const userResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/system/users')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        username: managedUsername,
        displayName: '受限测试管理员',
        password: initialPassword,
        roleIds: [roleId],
      })
      .expect(201);
    managedUserId = (userResponse.body as UserBody).data.id;

    const limitedLogin = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: managedUsername, password: initialPassword })
      .expect(201);
    const limitedToken = (limitedLogin.body as LoginBody).data.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/admin/system/users')
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/system/roles/${roleId}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: '端到端受限角色',
        description: '已增加管理员查看权限',
        permissionIds: [dashboardPermission!.id, userManagePermission!.id],
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(401);

    const relogin = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: managedUsername, password: initialPassword })
      .expect(201);
    const updatedToken = (relogin.body as LoginBody).data.accessToken;
    await request(app.getHttpServer())
      .get('/api/v1/admin/system/users')
      .set('Authorization', `Bearer ${updatedToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/admin/system/role-options')
      .set('Authorization', `Bearer ${updatedToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system/users/${managedUserId}/password`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ newPassword: resetPassword })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: managedUsername, password: initialPassword })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: managedUsername, password: resetPassword })
      .expect(201);

    const disabled = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system/users/${managedUserId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'disabled' })
      .expect(200);
    expect((disabled.body as UserBody).data.status).toBe('disabled');
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: managedUsername, password: resetPassword })
      .expect(401);
  });

  it('protects the current account and exposes audit records', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/admin/system/users/${operatorId}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        username: operatorUsername,
        displayName: '权限测试操作员',
        roleIds: [superAdminRoleId],
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system/users/${operatorId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'disabled' })
      .expect(400);

    const auditResponse = await request(app.getHttpServer())
      .get(
        '/api/v1/admin/system/audit-logs?resource=admin_user&action=admin_user_disable&page=1&pageSize=100',
      )
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    const actions = (
      auditResponse.body as { data: { items: Array<{ action: string }> } }
    ).data.items.map((item) => item.action);
    expect(actions).toEqual(['admin_user_disable']);

    const optionsResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/system/audit-options')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    const options = optionsResponse.body as {
      data: {
        actions: string[];
        resources: string[];
        admins: Array<{ id: string }>;
      };
    };
    expect(options.data.actions).toContain('admin_user_disable');
    expect(options.data.resources).toContain('admin_user');
    expect(options.data.admins.some((item) => item.id === operatorId)).toBe(
      true,
    );
  });

  afterAll(async () => {
    const ids = [operatorId, managedUserId].filter(Boolean);
    if (ids.length) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { adminUserId: { in: ids } },
            { resourceId: { in: ids } },
            roleId ? { resourceId: roleId } : { id: '__none__' },
          ],
        },
      });
      await prisma.adminUser.deleteMany({ where: { id: { in: ids } } });
    }
    if (roleId) await prisma.role.delete({ where: { id: roleId } });
    await app.close();
  });
});
