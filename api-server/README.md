# 中康参芝 API Server

NestJS + TypeScript + Prisma + MySQL + Redis API 服务。

## 第一次启动

```powershell
Copy-Item .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run start:dev
```

需要先从项目根目录启动本地 MySQL 和 Redis：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\start-local.ps1
```

## 地址

- API：`http://localhost:3000/api/v1`
- 健康检查：`http://localhost:3000/health`
- Swagger：`http://localhost:3000/docs`

## 检查

```powershell
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

完整本地操作说明见 `docs/deployment/LOCAL_SETUP.md`。
