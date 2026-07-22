Page({
  data: {
    heroStats: [
      { value: '2018', label: '公司成立' },
      { value: '500万', label: '注册资本' },
      { value: '10万亩', label: '林下参基地' },
      { value: '全链路', label: '品质追溯' },
    ],
    evidenceCards: [
      { title: '企业主体清晰', desc: '中康参芝（通化）生物科技有限公司承接代理合作、产品供应、资料对接与售后沟通，合作链路更稳定。' },
      { title: '长白山源头背书', desc: '依托长白山人参产区资源与林下参基地，产品具备明确的产地认知和原料价值表达。' },
      { title: '品质追溯支撑', desc: '围绕原料、生产、检测、溯源建立品质管理链路，为渠道销售提供可展示、可说明的信任依据。' },
      { title: '渠道服务配套', desc: '面向代理商、团长、电商平台和门店，提供产品货盘、卖点素材、合作政策与后续对接支持。' },
    ],
    proofImages: [
      '/images/brand/authority-person-wide.jpg',
      '/images/brand/authority-office.jpg',
      '/images/brand/evidence-trace.jpg',
    ],
    trustLines: [
      '企业主体',
      '源头基地',
      '品质追溯',
      '渠道扶持',
    ],
    detailLinks: [
      { title: '企业介绍', desc: '基础信息、公司简介、发展历程', type: 'company' },
      { title: '品牌背书', desc: '科研、非遗、荣誉资质、合作案例', type: 'brand' },
      { title: '投资合作', desc: '资源、项目、商业模式、合作需求', type: 'investment' },
    ],
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  copyInfo() {
    wx.setClipboardData({
      data: '我想了解中康参芝代理合作资料、渠道政策、产品货盘和素材支持。',
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  switchToProducts() {
    wx.switchTab({ url: '/pages/category/index' });
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

  openConsultForm() {
    wx.navigateTo({
      url: '/pages/official/lead-form/index?type=consult',
    });
  },
});
