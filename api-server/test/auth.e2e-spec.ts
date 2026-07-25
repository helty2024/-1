import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AdminUserStatus } from './../src/generated/prisma/enums';
import { PrismaService } from './../src/modules/prisma/prisma.service';

interface LoginResponseBody {
  data: {
    accessToken: string;
    user: { displayName: string };
  };
}

interface ProfileResponseBody {
  data: {
    username: string;
    displayName: string;
  };
}

interface PasswordResponseBody {
  data: {
    reloginRequired: boolean;
  };
}

describe('Admin authentication settings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId = '';

  const originalUsername = `e2e_admin_${Date.now()}`;
  const changedUsername = `${originalUsername}_changed`;
  const originalPassword = 'InitialPass_2026!';
  const changedPassword = 'ChangedPass_2026!';

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
        username: originalUsername,
        displayName: '端到端测试管理员',
        passwordHash: await argon2.hash(originalPassword, {
          type: argon2.argon2id,
        }),
        status: AdminUserStatus.ACTIVE,
        roles: { create: { roleId: role.id } },
      },
    });
    adminId = admin.id;
  });

  it('updates profile, changes password and invalidates the old token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: originalUsername, password: originalPassword })
      .expect(201);
    const loginBody = login.body as LoginResponseBody;
    const firstToken = loginBody.data.accessToken;

    const profile = await request(app.getHttpServer())
      .patch('/api/v1/admin/auth/profile')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ username: changedUsername, displayName: '新的显示名称' })
      .expect(200);
    const profileBody = profile.body as ProfileResponseBody;
    expect(profileBody.data.username).toBe(changedUsername);
    expect(profileBody.data.displayName).toBe('新的显示名称');

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: originalUsername, password: originalPassword })
      .expect(401);

    const relogin = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: changedUsername, password: originalPassword })
      .expect(201);
    const reloginBody = relogin.body as LoginResponseBody;
    const profileToken = reloginBody.data.accessToken;

    await request(app.getHttpServer())
      .patch('/api/v1/admin/auth/password')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({
        currentPassword: 'WrongPass_2026!',
        newPassword: changedPassword,
      })
      .expect(401);

    const passwordResult = await request(app.getHttpServer())
      .patch('/api/v1/admin/auth/password')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ currentPassword: originalPassword, newPassword: changedPassword })
      .expect(200);
    const passwordBody = passwordResult.body as PasswordResponseBody;
    expect(passwordBody.data.reloginRequired).toBe(true);

    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${profileToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: changedUsername, password: originalPassword })
      .expect(401);

    const finalLogin = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ username: changedUsername, password: changedPassword })
      .expect(201);
    const finalLoginBody = finalLogin.body as LoginResponseBody;
    expect(finalLoginBody.data.user.displayName).toBe('新的显示名称');
  });

  afterAll(async () => {
    if (adminId) {
      await prisma.adminUser.delete({ where: { id: adminId } });
    }
    await app.close();
  });
});
