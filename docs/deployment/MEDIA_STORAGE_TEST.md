# 媒体存储配置与测试

## 现在实现了什么

媒体库保持原来的后台操作方式，不需要改变页面使用习惯。API 现支持两种存储模式：

- `local`：供当前电脑开发测试使用；
- `cos`：供正式服务器连接腾讯云对象存储 COS 使用。

数据库会记录每个文件的对象键、存储桶和地域，所以旧本地图片与以后上传的 COS 图片可以同时显示。

## 一、本地模式测试

1. 打开 `api-server/.env`，确认以下配置存在：

```env
MEDIA_STORAGE_DRIVER=local
MEDIA_STORAGE_DIR=storage/media
MEDIA_TEMP_DIR=storage/tmp/media
MEDIA_MAX_FILE_SIZE_BYTES=20971520
MEDIA_PUBLIC_BASE_URL=http://localhost:3000/media
```

2. 在项目根目录启动数据库：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\start-local.ps1
```

3. 在 `api-server` 目录启动 API：

```powershell
npm run start:dev
```

4. 在 `admin-web` 目录启动后台：

```powershell
npm run dev
```

5. 浏览器打开 `http://localhost:5173`，登录后进入“媒体资料”。
6. 上传一张 JPG、PNG 或 WebP 图片。
7. 确认上传后能立刻看到缩略图，刷新页面后仍能显示。
8. 到 `api-server/storage/media/年/月` 检查文件是否存在。

## 二、安全校验测试

1. 新建一个普通文本文件，内容随意。
2. 把文件后缀改成 `.png`。
3. 在媒体资料中上传这个文件。
4. 系统应提示“文件内容与文件类型不一致”，媒体列表中不得出现该文件。
5. 上传超过 20MB 的文件，系统应拒绝上传。

允许类型为 JPG、PNG、WebP、GIF、PDF；默认单文件上限为 20MB，可通过 `MEDIA_MAX_FILE_SIZE_BYTES` 调整，代码允许范围为 1MB 至 50MB。

## 三、正式环境切换腾讯云 COS

购买并创建腾讯云 COS 存储桶后，在服务器的 API 环境变量中填写：

```env
MEDIA_STORAGE_DRIVER=cos
MEDIA_TEMP_DIR=storage/tmp/media
MEDIA_MAX_FILE_SIZE_BYTES=20971520
COS_SECRET_ID=服务器专用密钥ID
COS_SECRET_KEY=服务器专用密钥Key
COS_BUCKET=完整存储桶名称-APPID
COS_REGION=存储桶所属地域，例如ap-beijing
COS_PUBLIC_BASE_URL=https://绑定到COS的图片域名
```

`COS_PUBLIC_BASE_URL` 可以暂时留空，此时使用腾讯云默认 COS 域名。密钥只能放在服务器环境变量中，不能写入 Git、管理后台或小程序代码。

建议创建只允许操作指定存储桶的子账号密钥，至少授予上传对象和分块上传所需权限，不使用腾讯云主账号永久密钥。

修改配置后重启 API，然后在后台上传一张测试图片：

1. 媒体列表能显示图片；
2. 图片地址为 COS 默认域名或自定义图片域名；
3. 腾讯云 COS 控制台的 `年/月` 目录中能看到新对象；
4. 小程序引用该媒体地址后能正常显示。

## 四、旧图片处理

切换到 COS 不会修改旧媒体记录。旧图片仍从 `MEDIA_PUBLIC_BASE_URL` 读取，所以部署服务器时必须保留并挂载原 `api-server/storage/media` 目录。

正式切换前再执行一次旧文件迁移：将本地媒体复制到 COS，并批量更新对应记录的 `bucket` 和 `region`。目前没有 COS 账号和正式存储桶时不要提前迁移，也不要删除本地目录。

## 五、自动测试

数据库和 Redis 运行时，在 `api-server` 目录执行：

```powershell
npm run test:e2e -- --runInBand test/media.e2e-spec.ts
```

测试会验证伪造图片被拒绝、本地图片上传、列表读取、说明修改、软删除和审计日志。
