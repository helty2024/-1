# API 约定

## 本地地址

- API 根地址：`http://localhost:3000/api/v1`
- 健康检查：`http://localhost:3000/health`
- Swagger：`http://localhost:3000/docs`

## 统一响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "request-id",
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

## 阶段 A 已实现接口

- `GET /health`：检查 API、MySQL 和 Redis。
- `GET /api/v1`：查看 API 基础信息。
- `POST /api/v1/admin/auth/login`：管理员登录。
- `GET /api/v1/admin/auth/me`：使用 Bearer Token 获取当前管理员。

内容、产品、表单、线索和媒体 CRUD 将在后续模块逐个实现。
