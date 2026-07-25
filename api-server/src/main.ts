import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module';
import { getMediaStorageRoot } from './modules/media/media-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');

  app.useLogger(app.get(PinoLogger));
  app.set('trust proxy', config.get<number>('TRUST_PROXY_HOPS', 1));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const mediaStorageRoot = getMediaStorageRoot();
  mkdirSync(mediaStorageRoot, { recursive: true });
  app.useStaticAssets(mediaStorageRoot, { prefix: '/media/' });
  app.enableCors({
    origin: config.get<string>('ADMIN_WEB_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  if (config.get<boolean>('SWAGGER_ENABLED', true)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('中康参芝管理 API')
      .setDescription('企业内容、产品、招商、表单、线索、媒体与权限服务')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://localhost:${port}/${apiPrefix}`);
  Logger.log(`Health check: http://localhost:${port}/health`);
  Logger.log(`Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
