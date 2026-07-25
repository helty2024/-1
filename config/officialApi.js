// 开发者工具使用本机 API；上线前替换为已备案并配置到微信公众平台的 HTTPS 域名。
const API_BASE_URL = 'http://192.168.3.9:3000/api/v1';

// api: 独立后台接口；mock: 微信本地存储。
const LEAD_DATA_SOURCE = 'api';
const CONTENT_DATA_SOURCE = 'api';
const PRODUCT_DATA_SOURCE = 'api';

module.exports = {
  API_BASE_URL,
  CONTENT_DATA_SOURCE,
  LEAD_DATA_SOURCE,
  PRODUCT_DATA_SOURCE,
};
