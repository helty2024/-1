Page({
  data: {
    heroStats: [
      { value: '10万亩', label: '林下参基地' },
      { value: '38年', label: '产业积累' },
      { value: '4证据', label: '信任体系' },
      { value: '2400万', label: '林地投资' },
    ],
    trustCards: [
      {
        title: '张家新',
        desc: '让参上餐桌，让品牌出圈。',
        image: '/images/brand/authority-person-wide.jpg',
        mode: 'aspectFill',
      },
      {
        title: '中康参芝（通化）生物科技有限公司',
        desc: '跨境电商与实体产业的双向布局',
        image: '/images/brand/authority-office.jpg',
        mode: 'aspectFill',
      },
    ],
    evidenceCards: [
      {
        no: '01',
        title: '真产区',
        desc: '原料来自长白山生态资源。',
      },
      {
        no: '02',
        title: '真年份',
        desc: '二十番寒暑生长规律，原料、数据、品质都是真的',
      },
      {
        no: '03',
        title: '真检测',
        desc: '一参一码，扫码查看全周期权限。',
      },
      {
        no: '04',
        title: '真链路',
        desc: '基地、生产、加工、流通全链路透明。',
      },
    ],
    products: [
      {
        name: '黑参液',
        note: '主打便携饮用与日常调理，适合渠道首推。',
        image: '/images/brand/product-wild-ginseng.jpg',
      },
      {
        name: '西洋参凉茶',
        note: '清润型饮用场景，适合夏季和轻养生人群。',
        image: '/images/brand/product-paste-bottle.jpg',
      },
      {
        name: '鲜人参',
        note: '原材感最强，适合做产地讲解和源头背书。',
        image: '/images/products/image-1.jpeg',
      },
      {
        name: '精品板参',
        note: '礼赠与高客单组合的重点展示款。',
        image: '/images/brand/product-red-paste.jpg',
      },
    ],
    steps: [
      { title: '先看信任', desc: '企业资质、原料基地、品牌实力，让您合作更放心。' },
      { title: '再看产品', desc: '产品卖点、销售方式、消费人群，给您现成卖货思路。' },
      { title: '最后合作', desc: '社群一对一对接，全程跟进落地合作事宜。' },
    ],
    officialLinks: [
      { title: '企业介绍', desc: '公司简介、品牌故事、发展历程', type: 'company' },
      { title: '品牌背书', desc: '基地、科研、非遗、荣誉、合作案例', type: 'brand' },
      { title: '招商政策', desc: '代理对象、合作模式、扶持政策', type: 'join' },
      { title: '投资合作', desc: '项目方向、商业模式、资源需求', type: 'investment' },
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
      data: '我想了解知参堂渠道合作资料和社群入群方式。',
      success: () => {
        wx.showToast({
          title: '合作信息已复制',
          icon: 'success',
        });
      },
    });
  },

  switchToProducts() {
    wx.switchTab({ url: '/pages/category/index' });
  },

  switchToStrength() {
    wx.switchTab({ url: '/pages/cart/index' });
  },

  switchToJoin() {
    wx.switchTab({ url: '/pages/usercenter/index' });
  },

  openOfficial(event) {
    const { type } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/official/content/index?type=${type}`,
    });
  },
});
