Page({
  data: {
    heroStats: [
      { value: '4款', label: '主推单品' },
      { value: '3类', label: '动销场景' },
      { value: '源头', label: '产地背书' },
      { value: '资料', label: '渠道支持' },
    ],
    products: [
      {
        name: '黑参液',
        role: '复购引流款',
        note: '小规格、低决策门槛，适合代理商做首单转化和日常复购。',
        scene: '适合：私域社群、门店试饮、日常伴手礼',
        image: '/images/brand/product-wild-ginseng.jpg',
      },
      {
        name: '西洋参凉茶',
        role: '季节动销款',
        note: '清润饮用属性更容易打开年轻客群和办公室消费场景。',
        scene: '适合：夏季活动、办公室团购、轻养生人群',
        image: '/images/brand/product-paste-bottle.jpg',
      },
      {
        name: '鲜人参',
        role: '源头背书款',
        note: '原材感强，适合做产地故事、品质展示和高信任转化。',
        scene: '适合：门店展示、直播讲解、品质背书',
        image: '/images/products/image-1.jpeg',
      },
      {
        name: '精品板参',
        role: '礼赠利润款',
        note: '礼盒属性强，适合承接节礼、商务拜访和高客单团购需求。',
        scene: '适合：商务礼赠、节礼团购、企业客户',
        image: '/images/brand/product-red-paste.jpg',
      },
    ],
    scenarioCards: [
      { title: '代理起盘', desc: '从低门槛产品起步，快速出首单，再用复购产品持续承接。' },
      { title: '团长带货', desc: '产品卖点清晰、场景明确，适合社群讲解、朋友圈种草和团购转化。' },
      { title: '电商平台', desc: '适合上架平台店铺和直播间，用源头背书、产品卖点和礼赠场景提升转化。' },
    ],
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  copyJoinInfo() {
    wx.setClipboardData({
      data: '我想了解中康参芝代理合作、渠道政策、产品货盘和拿货资料。',
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
