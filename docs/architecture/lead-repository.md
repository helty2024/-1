# 线索数据适配层

当前线索管理使用本地存储，代码入口：

- 数据字段、状态、格式化：`pages/official/data/leads.js`
- 数据读写适配层：`pages/official/repositories/leadsRepository.js`
- 表单提交页：`pages/official/lead-form/index.js`
- 线索列表页：`pages/official/lead-list/index.js`
- 线索详情页：`pages/official/lead-detail/index.js`

## 当前实现

`leadsRepository.js` 当前使用 `wx.getStorageSync` / `wx.setStorageSync` 保存到本地 `officialLeads`。

对页面暴露的接口：

- `listLeads(filters)`
- `getLead(id)`
- `createLeadRecord(payload)`
- `updateLeadRecord(id, patch)`
- `deleteLeadRecord(id)`
- `getLeadSource()`

## 后续切换后台

接微信云开发或独立后台时，优先只替换 `leadsRepository.js` 内部实现，保持页面调用不变。

建议后台字段至少包含：

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
