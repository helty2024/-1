# 中康参芝企业招商微信小程序

中康参芝企业招商微信小程序是一套“微信小程序前台 + Web 管理后台 + API 服务”的企业展示与合作线索系统。

项目围绕五类核心内容建设：

- 企业展示：公司简介、品牌故事、发展历程和联系方式；
- 品牌背书：资质证书、检测报告、企业荣誉、合作案例和媒体报道；
- 明星产品：产品卖点、原料、工艺、规格、使用场景和招商价值；
- 招商代理：合作模式、代理权益、扶持政策、合作流程和常见问题；
- 投资合作：项目介绍、商业模式、增长规划、合作方向和资源需求。

用户可提交代理申请、投资合作申请和普通咨询；工作人员通过 Web 后台查看、筛选、分配、跟进和导出线索。

## 当前状态

当前仓库已经包含微信小程序展示小样和正式内容原型：

- 首页、产品、实力、合作四个主 Tab；
- 企业介绍、品牌背书、招商政策、投资合作内容页；
- 五类明星产品列表和详情；
- 三类合作申请表单；
- 本地线索管理原型和数据仓储适配层。

当前业务数据主要来自本地 JavaScript 文件，下一阶段将接入 Web 后台、API、MySQL 和 COS。正式环境不以本地静态文件作为业务数据源。

## 技术架构

| 应用 | 技术方案 |
| --- | --- |
| 微信小程序 | 原生 JavaScript、WXML、WXSS、TDesign Miniprogram |
| Web 管理后台 | Vue 3、TypeScript、Vite、TDesign Vue Next、Pinia |
| API 服务 | NestJS、TypeScript、Prisma、OpenAPI |
| 数据 | MySQL 8、Redis 7 |
| 文件 | 腾讯云 COS + CDN |
| 部署 | Docker Compose、Nginx、GitHub Actions |

完整方案见 [技术架构设计](./architecture/system-architecture.md)。

## 目录说明

```text
zhishentang-shop/
├─ app.js / app.json / app.wxss     # 微信小程序入口
├─ pages/                            # 小程序页面
├─ components/                       # 小程序组件
├─ services/                         # 小程序请求与服务层
├─ admin-web/                        # Web 管理后台，待建立
├─ api-server/                       # NestJS API，待建立
├─ packages/contracts/               # 接口契约与共享枚举，待建立
├─ infra/                            # Docker、Nginx 和部署脚本，待建立
├─ docs/                             # 产品、材料和技术文档
└─ project.config.json               # 微信开发者工具配置
```

为避免再次触发微信小程序代码包大小限制，`admin-web`、`api-server`、`packages`、`infra`、`docs` 及其依赖必须加入 `project.config.json` 上传忽略列表。产品图、证书和资料统一存入 COS。

## 本地开发

### 前置环境

- 微信开发者工具稳定版；
- Node.js LTS；
- pnpm；
- Docker Desktop；
- MySQL 8 和 Redis 7，可通过 Docker Compose 启动。

### 微信小程序

1. 在微信开发者工具中导入仓库根目录。
2. 使用项目已配置的 AppID 或开发用测试号。
3. 在开发者工具中执行“工具 -> 构建 npm”。
4. 编译并打开首页进行预览。

当前小程序依赖安装：

```bash
npm install
```

### API 服务（完成服务端骨架后启用）

```bash
cd api-server
pnpm install
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

默认地址：

- API：`http://localhost:3000/api/v1`
- OpenAPI：`http://localhost:3000/docs`

### Web 管理后台（完成后台骨架后启用）

```bash
cd admin-web
pnpm install
cp .env.example .env.local
pnpm dev
```

默认地址：`http://localhost:5173`。

## 环境变量

服务端至少需要：

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@127.0.0.1:3306/zhishentang
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
WECHAT_APP_ID=replace_me
WECHAT_APP_SECRET=replace_me
COS_SECRET_ID=replace_me
COS_SECRET_KEY=replace_me
COS_BUCKET=replace_me
COS_REGION=ap-beijing
COS_PUBLIC_BASE_URL=https://assets.example.com
```

后台至少需要：

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

禁止提交真实 `.env`、微信密钥、COS 密钥、数据库密码和生产 JWT 密钥。

## 数据迁移原则

- `data/officialContent.js`：作为企业、品牌、招商、合作首页和投资内容的首次导入来源；
- `data/officialProducts.js` 与 `pages/official/data/products.js`：作为产品首次导入来源；
- `pages/official/data/forms.js`：作为三类表单字段的首次导入来源；
- `pages/official/repositories/leadsRepository.js`：保持页面调用接口，内部数据源由 `local` 切换为 `api`；
- 小程序本地测试线索默认不迁入生产数据库。

迁移完成后，业务人员只通过 Web 后台维护正式数据。

## 开发规范

- 新接口统一使用 `/api/v1` 前缀并更新 OpenAPI 文档；
- 数据库结构变更必须提交 Prisma migration；
- 页面不直接拼接 API 地址，统一通过 `services` 和 `repositories` 调用；
- 业务图片和附件不提交到小程序代码包；
- 管理写操作必须通过服务端权限检查并记录审计日志；
- 手机号默认脱敏，完整查看与导出使用独立权限；
- 不允许在生产数据库中手工改表或直接删除线索。

## 验证命令

小程序现有代码检查：

```bash
npm run check
```

服务端计划命令：

```bash
cd api-server
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

后台计划命令：

```bash
cd admin-web
pnpm lint
pnpm test
pnpm build
```

发布前还需要在微信开发者工具完成主包/分包体积检查、体验版真机测试和合法域名验证。

## 分支与发布

- 功能分支统一使用 `codex/` 前缀；
- Pull Request 通过检查后合并主分支；
- 测试环境自动部署，生产环境人工确认；
- 小程序版本号、Git Tag 和后台 API 版本保持对应；
- 生产发布前执行数据库备份和迁移检查。

## 近期开发顺序

1. 建立 API、数据库、管理员登录和 RBAC；
2. 建立媒体上传与内容管理；
3. 建立产品管理并将现有产品图片迁移到 COS；
4. 建立招商、投资和动态表单管理；
5. 将小程序数据源从本地文件切换到 API；
6. 完成线索筛选、分配、跟进、导出和审计；
7. 联调、真机验收、部署和上线。

## V1 范围

V1 聚焦企业内容、品牌背书、明星产品、招商代理、投资合作和线索管理。

订单、微信支付、库存、物流和代理佣金不在当前 V1 范围内；后续简版商城阶段通过新增业务模块扩展。
