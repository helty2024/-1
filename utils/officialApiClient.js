const { API_BASE_URL } = require('../config/officialApi');

function request({ path, method = 'GET', data, auth = false }) {
  return new Promise((resolve, reject) => {
    const header = { 'content-type': 'application/json' };
    if (auth) {
      const token = wx.getStorageSync('adminAccessToken');
      if (token) header.Authorization = `Bearer ${token}`;
    }

    wx.request({
      url: `${API_BASE_URL}${path}`,
      method,
      data,
      header,
      timeout: 15000,
      success(response) {
        const body = response.data || {};
        if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }
        reject(new Error(body.message || `接口请求失败（${response.statusCode}）`));
      },
      fail(error) {
        const message = error.errMsg || '';
        if (message.includes('url not in domain list')) {
          reject(new Error('本地接口被开发工具拦截，请重新打开项目后再试'));
          return;
        }
        reject(new Error(message || '网络请求失败，请检查 API 地址和服务器状态'));
      },
    });
  });
}

module.exports = { request };
