# 正式部署操作手册

这套部署包用于当前 V1：企业展示、品牌背书、明星产品、招商代理、投资合作、动态表单、线索、媒体、权限和审计。商城、订单、支付等不在本次部署范围内。

需要重新生成压缩包时，在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\build-deployment-package.ps1
```

生成结果位于 `release` 目录，并同时生成 SHA-256 校验文件。

## 一、上线前需要准备

1. 一台 Linux 云服务器，建议至少 2 核 CPU、4GB 内存、80GB 系统盘。
2. 一个已备案域名，并将域名解析到服务器公网 IP。
3. 域名 HTTPS 证书，包含 `fullchain.pem` 和 `privkey.pem`。
4. 腾讯云 COS 存储桶和服务器专用子账号密钥；暂时不用 COS 也可先使用本地存储。
5. 微信公众平台小程序管理员权限，用于配置服务器域名和上传正式版。

服务器只需对公网开放 TCP 端口 `80` 和 `443`。MySQL、Redis、API 的容器端口不映射到公网。

## 二、服务器基础环境

推荐使用腾讯云 Ubuntu 24.04 LTS。安装 Docker Engine 与 Docker Compose 插件，并确认下面两条命令可以执行：

```bash
docker --version
docker compose version
```

把正式部署压缩包上传到服务器，例如 `/opt/zhishentang`，然后解压并进入项目目录。

## 三、填写生产配置

执行：

```bash
cp infra/env/.env.production.example infra/env/.env.production
```

编辑 `infra/env/.env.production`，必须修改：

- `ADMIN_WEB_ORIGIN`：正式 HTTPS 域名，例如 `https://admin.company.com`；
- `MYSQL_ROOT_PASSWORD`、`DATABASE_PASSWORD`、`DATABASE_URL`：数据库密码；
- `REDIS_PASSWORD`、`REDIS_URL`：Redis 密码；
- `JWT_ACCESS_SECRET`：至少 32 位独立随机字符串；
- `APP_DATA_ENCRYPTION_KEY`：至少 32 位独立随机字符串，丢失后历史手机号无法解密；
- `ADMIN_SEED_PASSWORD`：首次登录密码；
- `MEDIA_PUBLIC_BASE_URL`：正式域名加 `/media`；
- COS 相关配置：使用 COS 时填写真实值。

数据库密码建议只使用大小写字母和数字，且 `DATABASE_URL` 和 `DATABASE_PASSWORD` 中的密码必须完全一致。配置文件不能上传到 GitHub。

## 四、放置 HTTPS 证书

把证书放到：

```text
infra/certs/fullchain.pem
infra/certs/privkey.pem
```

文件名必须完全一致。

## 五、首次部署

Linux 服务器执行：

```bash
chmod +x infra/scripts/*.sh
./infra/scripts/deploy-production.sh --initialize
./infra/scripts/verify-production.sh
```

Windows 测试环境执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\deploy-production.ps1 -Initialize
powershell -ExecutionPolicy Bypass -File .\infra\scripts\verify-production.ps1
```

`--initialize` 只在全新数据库首次部署时使用。它会创建数据表、基础权限、默认表单、初始内容和超级管理员。

以后更新版本时不要再加 `--initialize`，只执行：

```bash
./infra/scripts/deploy-production.sh
./infra/scripts/verify-production.sh
```

数据库迁移会在业务容器启动前执行，迁移失败时 API 不会继续启动。

## 六、首次登录与后台验收

1. 浏览器打开 `ADMIN_WEB_ORIGIN` 配置的 HTTPS 地址。
2. 使用 `ADMIN_SEED_USERNAME` 和 `ADMIN_SEED_PASSWORD` 登录。
3. 立即在“系统设置”修改管理员账号和密码。
4. 检查首页内容、产品页内容、实力页内容、合作页内容。
5. 上传一张媒体图片并刷新页面。
6. 提交一条测试咨询，在后台修改状态并添加跟进。
7. 导出测试线索。
8. 在审计日志中确认上述后台操作有记录。

## 七、小程序正式 API 配置

1. 参考 `config/officialApi.production.example.js` 修改 `config/officialApi.js`。
2. 把 `API_BASE_URL` 改为正式 HTTPS 地址，例如 `https://admin.company.com/api/v1`。
3. 保持三个数据源都是 `api`。
4. 微信公众平台进入“开发管理 -> 开发设置 -> 服务器域名”。
5. 将正式域名加入 `request` 合法域名；如直接展示 COS 图片，也把 COS 图片域名加入 `downloadFile` 合法域名。
6. 在微信开发者工具中重新编译、真机预览，再上传体验版验收。

正式上传前必须把微信开发者工具的“不校验合法域名”关闭，确认真机仍可读取内容、产品并提交表单。

## 八、备份

每天至少执行一次：

```bash
./infra/scripts/backup-production.sh
```

备份位于 `infra/backups`，包括 MySQL 压缩文件和本地媒体目录。COS 文件还应开启版本控制或生命周期策略。备份完成后必须再同步到服务器之外的位置。

## 九、故障排查

查看所有容器：

```bash
docker compose --env-file infra/env/.env.production -f infra/docker/docker-compose.production.yml ps
```

查看 API 日志：

```bash
docker compose --env-file infra/env/.env.production -f infra/docker/docker-compose.production.yml logs --tail=200 api-server
```

查看 Nginx 日志：

```bash
docker compose --env-file infra/env/.env.production -f infra/docker/docker-compose.production.yml logs --tail=200 admin-web
```

不要通过删除数据库卷来解决启动问题。需要恢复数据库时，先停止写入并保留当前数据，再使用已验证的备份操作。

## 十、正式验收标准

- HTTP 自动跳转 HTTPS，证书有效且没有浏览器警告；
- 后台登录、权限、内容、产品、表单、线索、媒体和审计功能正常；
- 小程序真机可读取后台已发布内容并提交三类表单；
- 数据库和 Redis 没有公网端口；
- 上传文件类型校验、表单限流、手机号加密和审计日志正常；
- 数据库备份可生成，并已复制到服务器外；
- 微信体验版完整走查通过后再提交正式审核。
