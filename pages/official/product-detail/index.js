import { getProductRecord } from '../repositories/productsRepository';

Page({
  data: {
    product: null,
  },

  async onLoad(options) {
    try {
      const product = await getProductRecord(options.slug);
      if (!product) throw new Error('产品不存在');
      this.setData({ product });
      wx.setNavigationBarTitle({ title: product.shortName || product.name });
    } catch (error) {
      wx.showToast({ title: '产品加载失败', icon: 'none' });
    }
  },

  copyJoinInfo() {
    const { product } = this.data;
    wx.setClipboardData({
      data: `我想了解${product.name}的代理政策、供货价格和渠道合作资料。`,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  switchToJoin() {
    wx.switchTab({ url: '/pages/usercenter/index' });
  },
});
