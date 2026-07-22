import officialProducts from '../../data/officialProducts';

Page({
  data: {
    heroStats: [
      { value: '5款', label: '明星产品' },
      { value: '6类', label: '动销场景' },
      { value: '源头', label: '长白山参源' },
      { value: '招商', label: '渠道合作' },
    ],
    products: officialProducts,
    scenarioCards: [
      {
        title: '私域社群',
        desc: '用产品卖点、场景话术和复购节奏承接社群种草、团购转化和老客复购。',
      },
      {
        title: '电商平台',
        desc: '适合上架平台店铺和直播间，用源头背书、产品差异和礼赠场景提升转化。',
      },
      {
        title: '门店陈列',
        desc: '适合滋补品店、特产店、烟酒礼品店和康养门店做高信任现场讲解。',
      },
      {
        title: '企业团购',
        desc: '承接员工福利、商务答谢、会议礼品和节庆采购，拉高单次订单金额。',
      },
    ],
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  openProduct(event) {
    const { slug } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/official/product-detail/index?slug=${slug}`,
    });
  },

  copyJoinInfo() {
    wx.setClipboardData({
      data: '我想了解中康参芝明星产品、代理政策和渠道合作资料。',
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
    });
  },

  switchToStrength() {
    wx.switchTab({ url: '/pages/cart/index' });
  },

  switchToJoin() {
    wx.switchTab({ url: '/pages/usercenter/index' });
  },
});
