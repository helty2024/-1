# 中康参芝管理后台

Vue 3 + TypeScript + Vite + TDesign Vue Next 管理后台。

## 启动

先启动 MySQL、Redis 和 `api-server`，再执行：

```powershell
npm install
npm run dev
```

访问 `http://localhost:5173`。

本地默认账号来自 `api-server/.env`：

- 用户名：`admin`
- 密码：`ChangeMe_2026!`

## 构建

```powershell
npm run build
```

阶段 A 已实现登录、主布局、仪表盘和业务菜单骨架。内容、产品、招商、表单、线索、媒体和系统模块将在后续阶段接入 CRUD 接口。
