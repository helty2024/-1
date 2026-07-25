# 线索系统 V1 完整测试

以下步骤按没有代码基础也能操作的方式编写。

## 一、启动服务

1. 在项目根目录打开 PowerShell。
2. 启动 MySQL 和 Redis：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\start-local.ps1
```

3. 初始化默认表单和管理员：

```powershell
Set-Location .\api-server
npm run db:deploy
npm run db:seed
```

4. 启动 API：

```powershell
npm run start:dev
```

5. 另开 PowerShell，启动后台：

```powershell
Set-Location .\admin-web
npm run dev
```

6. 确认以下地址可以打开：

- API 健康检查：`http://localhost:3000/health`
- API 文档：`http://localhost:3000/docs`
- 管理后台：`http://localhost:5173`

## 二、测试动态表单

1. 使用本地账号 `admin`、密码 `ChangeMe_2026!` 登录后台。
2. 点击左侧“表单管理”。
3. 应看到“代理申请”“投资合作”“普通咨询”三个已发布表单。
4. 点击编辑按钮，修改页面说明或增加一个非必填字段。
5. 点击“保存表单”。
6. 刷新页面，确认修改仍然存在。
7. 浏览器打开 `http://localhost:3000/api/v1/public/forms/agent`，应看到刚保存的表单结构。

## 三、测试小程序提交

1. 打开 `config/officialApi.js`，确认：

```js
const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';
const LEAD_DATA_SOURCE = 'api';
```

2. 在微信开发者工具的“详情 → 本地设置”中勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。该设置只用于本机开发。
3. 编译小程序，打开代理申请、投资合作或普通咨询表单。
4. 确认后台修改的标题、说明、字段和选项已经同步到小程序。
5. 故意漏填一个必填项并提交，应提示填写对应字段。
6. 完整填写姓名、手机号和其他必填项，再次提交。
7. 应看到后台配置的提交成功提示。

注意：真机无法使用 `127.0.0.1`。真机和上线测试必须把 `API_BASE_URL` 改为已部署的 HTTPS API 域名，并在微信公众平台配置 request 合法域名。

## 四、测试后台线索闭环

1. 回到后台并点击“线索管理”。
2. 点击“刷新”，刚才的小程序提交应出现在列表第一行。
3. 分别使用“类型”“状态”“日期范围”筛选，确认列表结果正确。
4. 保持筛选条件不变，点击“导出当前结果”，浏览器应下载一个 `.csv` 文件。
5. 用 Excel 或 WPS 打开文件，确认中文正常显示，导出数量与筛选结果总数一致，而不是只包含当前页。
6. 确认文件包含姓名、手机号、地区、状态、来源、提交时间、动态表单字段和最近跟进内容。
7. 点击“查看详情”，确认姓名、手机号及动态字段完整显示。
8. 将状态修改为“重点跟进”，点击“保存状态”。
9. 在“添加跟进”中选择沟通方式，填写跟进内容，可同时选择下一状态和下次跟进时间。
10. 点击“添加跟进记录”，确认记录出现在下方，操作人和时间正确。
11. 关闭详情后再次筛选“重点跟进”或刚设置的状态，确认线索可被筛出。

导出说明：单次最多导出 10,000 条。超过上限时请缩小日期范围或增加类型、状态筛选后再导出。每次导出都会写入后台审计日志。

## 五、测试 Mock 模式

1. 将 `config/officialApi.js` 中的配置改为：

```js
const LEAD_DATA_SOURCE = 'mock';
```

2. 重新编译小程序。
3. 提交一条测试申请。
4. 打开小程序原有线索列表，应显示“本地 Mock 模式”，并能查看、修改和删除本地测试线索。
5. 测试完成后改回 `api`，否则正式提交不会进入后台。

## 六、自动化回归

在 `api-server` 目录执行：

```powershell
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

通过标准：全部测试显示 `passed`。端到端测试会自动创建并清理独立测试表单和线索，不会污染正式数据。
