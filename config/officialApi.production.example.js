// 将 example.com 替换为已备案并加入微信公众平台白名单的 HTTPS 域名。
const API_BASE_URL = 'https://example.com/api/v1';

// 正式版全部读取后台 API，不使用本地 mock 数据。
const LEAD_DATA_SOURCE = 'api';
const CONTENT_DATA_SOURCE = 'api';
const PRODUCT_DATA_SOURCE = 'api';

module.exports = {
  API_BASE_URL,
  CONTENT_DATA_SOURCE,
  LEAD_DATA_SOURCE,
  PRODUCT_DATA_SOURCE,
};
