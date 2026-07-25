import officialProducts from '../../data/officialProducts';

const { getContent } = require('../../data/officialContent');
const { getContentPage } = require('../../services/official/contentRepository');
const { listProductRecords } = require('../../services/official/productsRepository');

const defaultContent = getContent('products');

function sectionAt(content, index) {
  return Array.isArray(content.sections) ? content.sections[index] || null : null;
}

function titleLines(title) {
  return String(title || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

Page({
  data: {
    loading: true,
    pageContent: defaultContent,
    heroImage: defaultContent.coverImage,
    titleLines: titleLines(defaultContent.title),
    heroStats: defaultContent.stats,
    productIntroSection: sectionAt(defaultContent, 0),
    scenarioSection: sectionAt(defaultContent, 1),
    ctaSection: sectionAt(defaultContent, 2),
    products: officialProducts,
  },

  onLoad() {
    wx.nextTick(() => {
      wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    });
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
    this.loadPageData();
  },

  async loadPageData() {
    this.setData({ loading: true });
    try {
      const [pageContent, products] = await Promise.all([
        getContentPage('products'),
        listProductRecords(),
      ]);
      const visibleProducts = products.length ? products : officialProducts;
      const heroStats = [...(pageContent.stats || defaultContent.stats)];
      if (heroStats[0]) {
        heroStats[0] = { ...heroStats[0], value: `${visibleProducts.length}款` };
      }

      this.setData({
        pageContent,
        heroImage: pageContent.coverImage || defaultContent.coverImage,
        titleLines: titleLines(pageContent.title),
        heroStats,
        productIntroSection: sectionAt(pageContent, 0),
        scenarioSection: sectionAt(pageContent, 1),
        ctaSection: sectionAt(pageContent, 2),
        products: visibleProducts,
      });
    } catch (error) {
      const heroStats = [...defaultContent.stats];
      heroStats[0] = { ...heroStats[0], value: `${officialProducts.length}款` };
      this.setData({ heroStats, products: officialProducts });
    } finally {
      this.setData({ loading: false });
    }
  },

  openProduct(event) {
    const { slug } = event.currentTarget.dataset;
    if (!slug) return;
    wx.navigateTo({
      url: `/pages/official/product-detail/index?slug=${slug}`,
    });
  },

  handleAction(event) {
    const { url, tab } = event.currentTarget.dataset;
    if (!url) return;

    if (url === 'copy:product-cooperation') {
      wx.setClipboardData({
        data: this.data.ctaSection?.body || '我想了解中康参芝明星产品、代理政策和渠道合作资料。',
        success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      });
      return;
    }

    if (tab) {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },
});
