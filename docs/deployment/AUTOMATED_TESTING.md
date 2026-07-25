# 自动化测试说明

## 一、本机一键测试

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\test-all.ps1
```

首次运行会下载 Chromium 浏览器，时间会稍长。后续运行会复用已安装浏览器。

测试脚本会自动：

1. 启动本地 MySQL 和 Redis；
2. 检查小程序页面注册、关键文件、API 数据源配置和 JS 语法；
3. 编译共享接口类型；
4. 编译 API，运行单元测试和全部接口回归测试；
5. 编译管理后台；
6. 创建临时测试管理员；
7. 使用 Chromium 真实登录后台并逐个打开全部管理模块；
8. 检查页面脚本错误和 API 500 错误；
9. 删除临时测试管理员；
10. 校验正式部署 Compose 配置。

最后出现 `All automated tests passed.` 才表示整套测试通过。

## 二、GitHub 自动测试

工作流文件为 `.github/workflows/quality.yml`。推送到 `main`、`codex/**` 分支，创建 Pull Request，或在 GitHub 手动触发时都会运行。

GitHub 页面进入 `Actions -> Quality Gate` 可以查看结果。绿色表示通过，红色表示至少一个环节失败。浏览器测试失败时会上传 `playwright-report`，下载后打开其中的 HTML 报告即可查看失败页面、截图和操作轨迹。

## 三、测试通过标准

- 小程序关键文件齐全且 JavaScript 可解析；
- API 编译成功；
- API 单元测试通过；
- API 全部端到端测试通过；
- 后台 TypeScript 检查和生产构建通过；
- 后台可以真实登录并打开全部十个管理模块；
- 浏览器控制台没有未处理脚本异常；
- 后台请求没有 HTTP 500；
- 生产 Docker Compose 可以正确解析。

自动化测试通过不代替微信真机验收。小程序发布前仍需在微信开发者工具中完成体验版、合法域名、弱网和真机表单测试。
