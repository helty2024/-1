const { getContent } = require('../../data/officialContent');
const { getContentPage } = require('../../services/official/contentRepository');

const defaultStrength = getContent('strength');

function sectionAt(content, index) {
  return Array.isArray(content.sections) ? content.sections[index] || null : null;
}

function imageCards(section) {
  if (!section || !Array.isArray(section.cards)) return [];
  return section.cards.filter((card) => card.image);
}

Page({
  data: {
    loading: true,
    content: defaultStrength,
    evidenceSection: sectionAt(defaultStrength, 0),
    gallerySection: sectionAt(defaultStrength, 1),
    galleryCards: imageCards(sectionAt(defaultStrength, 1)),
    ctaSection: sectionAt(defaultStrength, 2),
  },

  onLoad() {
    this.loadStrengthContent();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  async loadStrengthContent() {
    this.setData({ loading: true });
    try {
      const content = await getContentPage('strength');
      const gallerySection = sectionAt(content, 1);
      this.setData({
        content,
        evidenceSection: sectionAt(content, 0),
        gallerySection,
        galleryCards: imageCards(gallerySection),
        ctaSection: sectionAt(content, 2),
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '实力内容加载失败',
        icon: 'none',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleAction(event) {
    const { url, tab } = event.currentTarget.dataset;
    if (!url) return;

    if (url.indexOf('copy:') === 0) {
      this.copyInfo();
      return;
    }

    if (tab) {
      wx.switchTab({ url });
      return;
    }

    wx.navigateTo({ url });
  },

  copyInfo() {
    const ctaSection = this.data.ctaSection;
    const copyText =
      (ctaSection && ctaSection.body) ||
      '我想了解中康参芝代理合作资料、渠道政策、产品货盘和素材支持。';

    wx.setClipboardData({
      data: copyText,
      success: () => wx.showToast({ title: '合作信息已复制', icon: 'success' }),
    });
  },
});
