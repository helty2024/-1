export const auditResourceNames: Record<string, string> = {
  auth: "登录安全",
  dashboard: "工作台",
  content: "页面内容",
  content_page: "页面内容",
  product: "产品管理",
  form: "表单管理",
  lead: "客户线索",
  media: "媒体资料",
  media_asset: "媒体资料",
  admin_user: "管理员",
  role: "角色权限",
  system: "系统管理",
  audit: "操作审计",
};

export const auditActionNames: Record<string, string> = {
  login: "登录后台",
  profile_update: "修改个人账号",
  password_change: "修改个人密码",
  admin_user_create: "新增管理员",
  admin_user_update: "编辑管理员",
  admin_user_enable: "启用管理员",
  admin_user_disable: "停用管理员",
  admin_user_password_reset: "重置管理员密码",
  role_create: "新增角色",
  role_update: "修改角色权限",
  role_delete: "删除角色",
  lead_export: "导出线索",
  lead_status_update: "修改线索状态",
  lead_followup_create: "添加跟进记录",
  lead_delete: "删除线索",
  product_create: "新增产品",
  product_update: "编辑产品",
  product_status_update: "修改产品状态",
  product_delete: "删除产品",
  content_page_create: "新增页面内容",
  content_page_update: "编辑页面内容",
  content_page_status_update: "修改页面状态",
  content_page_delete: "删除页面内容",
  media_upload: "上传媒体资料",
  media_update: "编辑媒体资料",
  media_delete: "删除媒体资料",
};

export function auditActionLabel(action: string) {
  return auditActionNames[action] ?? action;
}

export function auditResourceLabel(resource: string) {
  return auditResourceNames[resource] ?? resource;
}
