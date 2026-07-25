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
- `PATCH /api/v1/admin/auth/profile`：修改当前管理员账号和显示名称。
- `PATCH /api/v1/admin/auth/password`：校验当前密码并设置新密码；成功后旧登录凭证立即失效。

## 动态表单与线索接口

公开接口：

- `GET /api/v1/public/forms/:code`：小程序获取已发布表单结构。
- `POST /api/v1/public/leads`：小程序提交表单并创建线索。

后台表单接口：

- `GET /api/v1/admin/forms`：表单列表。
- `GET /api/v1/admin/forms/:id`：表单详情。
- `POST /api/v1/admin/forms`：创建表单。
- `PUT /api/v1/admin/forms/:id`：更新表单和动态字段。
- `DELETE /api/v1/admin/forms/:id`：下线并软删除表单。

后台线索接口：

- `GET /api/v1/admin/leads`：按类型、状态、起止时间分页筛选。
- `GET /api/v1/admin/leads/:id`：线索详情和跟进记录。
- `PATCH /api/v1/admin/leads/:id/status`：修改线索状态。
- `POST /api/v1/admin/leads/:id/followups`：添加跟进记录。
- `DELETE /api/v1/admin/leads/:id`：软删除线索。

姓名和手机号使用 AES-256-GCM 加密保存，手机号另存 HMAC 检索哈希和脱敏值；原始姓名、手机号不会写入 `payload_json`。

公共表单提交已启用安全保护：

- 同一 IP 和同一表单分别限流，生产环境由 Redis 统一计数；
- 小程序使用 `submissionId` 实现 24 小时幂等重放，同一次提交只创建一条线索；
- Redis 暂不可用时自动使用进程内保护，保证本地开发仍可测试；
- 拒绝未知字段、危险正则、超长内容、超大请求体和反自动提交陷阱命中；
- 日志整体隐藏动态表单值，数据库仅保存提交 IP 的不可逆哈希；
- 可通过 `PUBLIC_FORM_RATE_*`、`PUBLIC_FORM_MAX_BODY_BYTES` 和 `PUBLIC_FORM_ALLOWED_SOURCES` 调整生产策略。

## 内容管理接口

公开接口：

- `GET /api/v1/public/content-pages/:slug`：小程序读取已发布的企业、品牌、招商或投资内容页。

后台接口：

- `GET /api/v1/admin/content-pages`：内容页面列表与结构化详情。
- `POST /api/v1/admin/content-pages`：创建内容草稿。
- `PUT /api/v1/admin/content-pages/:id`：保存页面基础信息、指标、正文板块、历程、案例和问答。
- `PATCH /api/v1/admin/content-pages/:id/status`：发布、下线或转为草稿。
- `DELETE /api/v1/admin/content-pages/:id`：软删除内容页面。

内容创建、编辑、发布、下线和删除均写入审计日志。种子数据只在页面不存在时导入，不会覆盖后台已维护内容。

账号资料修改和密码修改都会写入审计日志。密码仅以 Argon2id 哈希保存，接口响应与审计日志均不记录密码原文。

## 产品管理接口

公开接口：

- `GET /api/v1/public/products`：小程序读取全部已发布产品。
- `GET /api/v1/public/products/:slug`：小程序读取单个已发布产品详情。

后台接口：

- `GET /api/v1/admin/products`：产品列表与结构化详情。
- `POST /api/v1/admin/products`：创建产品草稿。
- `PUT /api/v1/admin/products/:id`：保存产品基础信息、图片、卖点、规格、场景、招商价值及专属板块。
- `PATCH /api/v1/admin/products/:id/status`：发布、下线或转为草稿。
- `DELETE /api/v1/admin/products/:id`：软删除产品。

小程序产品列表与详情默认读取公开接口，接口异常时使用小程序包内的现有产品数据兜底。产品创建、编辑、发布、下线和删除均写入审计日志。

## 媒体资料接口

- `GET /api/v1/admin/media-assets`：按图片、PDF 和关键词筛选媒体资料。
- `POST /api/v1/admin/media-assets/upload`：上传 JPG、PNG、WebP、GIF 或 PDF，单文件不超过 20MB。
- `PATCH /api/v1/admin/media-assets/:id`：修改图片说明或替代文本。
- `DELETE /api/v1/admin/media-assets/:id`：软删除媒体资料记录，保留已被页面引用的物理文件。

媒体上传已使用统一存储服务：

- 本地开发将 `MEDIA_STORAGE_DRIVER` 设为 `local`，文件保存在 `api-server/storage/media`，通过 `/media/*` 访问。
- 正式环境可设为 `cos`，API 使用腾讯云 COS Node.js SDK 上传，并根据存储桶、地域和对象键生成公开地址。
- 上传先进入临时目录，服务端会核验 JPG、PNG、WebP、GIF、PDF 的真实文件头；仅修改扩展名或 MIME 类型的伪造文件会被拒绝。
- 数据库记录创建失败时自动删除刚上传的对象，避免留下无归属文件。
- 已有 `local-media` 数据继续生成本地地址，新 COS 数据生成 COS 地址，两种记录可以同时使用。

环境变量和人工测试步骤见 `docs/deployment/MEDIA_STORAGE_TEST.md`。
