import { getProduct } from '../data/products';

Page({
  data: {
    product: null,
  },

  onLoad(options) {
    const product = getProduct(options.slug);
    this.setData({ product });
    wx.setNavigationBarTitle({ title: product.shortName || product.name });
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
