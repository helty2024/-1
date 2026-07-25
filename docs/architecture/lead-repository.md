# 线索数据适配层

线索管理已支持 API 与本地 Mock 双模式，代码入口：

- 数据字段、状态、格式化：`pages/official/data/leads.js`
- 数据读写适配层：`pages/official/repositories/leadsRepository.js`
- 表单提交页：`pages/official/lead-form/index.js`
- 线索列表页：`pages/official/lead-list/index.js`
- 线索详情页：`pages/official/lead-detail/index.js`

## 数据源切换

修改 `config/officialApi.js` 中的 `LEAD_DATA_SOURCE`：

- `api`：从独立 NestJS API 获取动态表单、提交线索，并通过受保护接口管理线索。
- `mock`：继续使用 `wx.getStorageSync` / `wx.setStorageSync` 保存到本地 `officialLeads`。

对页面暴露的接口：

- `listLeads(filters)`
- `getLead(id)`
- `createLeadRecord(payload)`
- `updateLeadRecord(id, patch)`
- `deleteLeadRecord(id)`
- `getLeadSource()`

页面调用保持不变

`leadsRepository.js` 在两种模式下均保留以下方法：

小程序公开接口只包含读取已发布表单和提交线索。列表、详情、修改状态、跟进和删除使用后台接口，必须携带管理员 Token，避免公开客户资料。

API 线索字段包含：

- `id`
- `type`
- `title`
- `values`
- `status`
- `followNote`
- `createdAt`
- `updatedAt`

状态枚举继续沿用：

- `new`
- `contacted`
- `qualified`
- `closed`
- `invalid`
