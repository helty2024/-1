Page({
  data: {
    contactCards: [
      { title: '代理合作', desc: '面向区域代理、私域团长、门店渠道和电商运营者开放合作咨询。' },
      { title: '渠道政策', desc: '了解产品货盘、拿货方式、渠道价格、授权规则和合作支持。' },
      { title: '专人对接', desc: '提交合作意向后，由对接人员沟通经营渠道、合作需求和适配产品。' },
    ],
    benefitCards: [
      { title: '产品资料包', desc: '获取主推产品卖点、产品图、场景话术和基础宣传素材。' },
      { title: '合作政策说明', desc: '了解代理门槛、拿货政策、渠道权益和后续支持方式。' },
      { title: '销售素材支持', desc: '提供适合朋友圈、社群、直播间和平台详情页使用的内容素材。' },
    ],
    applicationLinks: [
      { title: '代理申请', desc: '区域代理、渠道代理、私域团长、电商运营', formType: 'agent' },
      { title: '投资合作', desc: '项目投资、资源合作、渠道共建、品牌运营', formType: 'investment' },
      { title: '普通咨询', desc: '产品、品牌背书、资质、合作案例咨询', formType: 'consult' },
      { title: '招商政策', desc: '查看合作模式、代理权益、扶持政策、常见问题', contentType: 'join' },
    ],
    contactText: '我想申请中康参芝代理合作资料，了解产品货盘、拿货政策、授权方式和渠道支持。',
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  copyContact() {
    wx.setClipboardData({
      data: this.data.contactText,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  switchToHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  switchToProducts() {
    wx.switchTab({ url: '/pages/category/index' });
  },

  openApplication(event) {
    const { formType, contentType } = event.currentTarget.dataset;
    if (formType) {
      wx.navigateTo({
        url: `/pages/official/lead-form/index?type=${formType}`,
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/official/content/index?type=${contentType}`,
    });
  },
});
