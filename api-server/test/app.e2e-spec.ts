import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          code: number;
          data: { name: string };
          requestId: string;
        };
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('zhishentang-api');
        expect(body.requestId).toBeTruthy();
      });
  });

  it('/health (GET)', async () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          code: number;
          data: { database: { status: string } };
        };
        expect(body.code).toBe(0);
        expect(body.data.database.status).toBe('up');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
