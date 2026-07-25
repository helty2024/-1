const { getContentPage } = require('../../services/official/contentRepository');

Page({
  data: {
    loading: true,
    content: null,
    heroImage: '/images/brand/cooperation-bg.jpg',
    overviewSection: null,
    benefitSection: null,
    directionSection: null,
  },

  onLoad() {
    this.loadContent();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  async loadContent() {
    this.setData({ loading: true });
    try {
      const content = await getContentPage('cooperation');
      const sections = Array.isArray(content.sections) ? content.sections : [];
      this.setData({
        content,
        heroImage: content.coverImage || '/images/brand/cooperation-bg.jpg',
        overviewSection: sections[0] || null,
        benefitSection: sections[1] || null,
        directionSection: sections[2] || null,
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '合作内容加载失败',
        icon: 'none',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleAction(event) {
    const { url, tab } = event.currentTarget.dataset;
    if (!url) return;

    if (tab) {
      wx.switchTab({ url });
      return;
    }

    wx.navigateTo({ url });
  },
});
