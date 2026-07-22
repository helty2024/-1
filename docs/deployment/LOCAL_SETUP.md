# 本地环境启动与测试

本文档按“没有代码基础也能照着操作”的方式编写。所有命令均在项目根目录打开 PowerShell 后执行。

## 第一次初始化

### 1. 启动 MySQL 和 Redis

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\start-local.ps1
```

看到 `zhishentang-mysql` 和 `zhishentang-redis` 状态为 `healthy` 即成功。第一次下载镜像通常需要几分钟。

### 2. 准备 API 环境变量

```powershell
Copy-Item .\api-server\.env.example .\api-server\.env
```

`.env` 是本机配置，不会提交到 Git。正式部署前必须更换数据库密码、JWT 密钥和管理员密码。

### 3. 安装 API 依赖

```powershell
Set-Location .\api-server
npm install
```

### 4. 创建数据库表

```powershell
npm run db:deploy
```

### 5. 创建基础权限和超级管理员

```powershell
npm run db:seed
```

默认本地账号：

- 用户名：`admin`
- 密码：`ChangeMe_2026!`

此密码只允许本机开发使用，部署测试或生产环境前必须修改。

### 6. 启动 API

```powershell
npm run start:dev
```

浏览器打开 `http://localhost:3000/health`。页面中应看到 `code` 为 `0`、`database.status` 为 `up`、`redis.status` 为 `up`。

Swagger 接口页面：`http://localhost:3000/docs`。

## 启动管理后台

另开一个 PowerShell 窗口，回到项目根目录后执行：

```powershell
Set-Location .\admin-web
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，使用上面的默认本地账号登录。

## 每天开发时

1. 执行 `powershell -ExecutionPolicy Bypass -File .\infra\scripts\start-local.ps1`。
2. 在 `api-server` 执行 `npm run start:dev`。
3. 在 `admin-web` 执行 `npm run dev`。

## 停止本地数据库

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\stop-local.ps1
```

该命令只停止容器，不删除数据库数据。

## 验收清单

- `http://localhost:3000/health` 可以打开；
- `http://localhost:3000/docs` 可以打开；
- `http://localhost:5173` 显示后台登录页；
- 使用默认账号可以进入后台仪表盘；
- 左侧可以看到内容、产品、招商合作、表单、线索、媒体和系统设置菜单；
- 微信开发者工具仍打开原项目根目录，并且预览页面没有被改动。

## 生产镜像构建示例

以下命令必须在项目根目录执行，因为 Dockerfile 同时需要应用目录和 `infra` 配置：

```powershell
docker build -f .\api-server\Dockerfile -t zhishentang-api:local .
docker build -f .\admin-web\Dockerfile -t zhishentang-admin:local .
```
