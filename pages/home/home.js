import officialProducts from '../../data/officialProducts';

const { getContent } = require('../../data/officialContent');
const { getContentPage } = require('../../services/official/contentRepository');
const { listProductRecords } = require('../../services/official/productsRepository');

const defaultHome = getContent('home');
const defaultCeo = getContent('ceo');
const defaultProductSection = sectionAt(defaultHome, 2);

function sectionAt(content, index) {
  return Array.isArray(content.sections) ? content.sections[index] || null : null;
}

Page({
  data: {
    loading: true,
    homeContent: defaultHome,
    heroImage: defaultHome.coverImage,
    companySection: sectionAt(defaultHome, 0),
    navigationSection: sectionAt(defaultHome, 1),
    productSection: sectionAt(defaultHome, 2),
    showHomeProducts: sectionAt(defaultHome, 2)?.showProductCards === true,
    stepsSection: sectionAt(defaultHome, 3),
    ctaSection: sectionAt(defaultHome, 4),
    ceoCard: {
      title: defaultCeo.title,
      subtitle: defaultCeo.subtitle,
      coverImage: defaultCeo.coverImage,
      actionText: defaultCeo.cardActionText,
    },
    productAction: {
      text: defaultProductSection.actionText,
      url: defaultProductSection.actionUrl,
      tab: defaultProductSection.actionTab,
    },
    products: officialProducts.slice(0, 4),
  },

  onLoad() {
    this.loadHomeContent();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  async loadHomeContent() {
    this.setData({ loading: true });
    try {
      const [homeContent, ceoContent, products] = await Promise.all([
        getContentPage('home'),
        getContentPage('ceo'),
        listProductRecords(),
      ]);
      const visibleProducts = products.length ? products.slice(0, 4) : officialProducts.slice(0, 4);
      const productSection = sectionAt(homeContent, 2);
      const hasProductAction = Boolean(productSection?.actionText && productSection?.actionUrl);

      this.setData({
        homeContent,
        heroImage: homeContent.coverImage || '/images/brand/home-bg.jpeg',
        companySection: sectionAt(homeContent, 0),
        navigationSection: sectionAt(homeContent, 1),
        productSection,
        showHomeProducts: productSection?.showProductCards === true,
        stepsSection: sectionAt(homeContent, 3),
        ctaSection: sectionAt(homeContent, 4),
        ceoCard: {
          title: ceoContent.title || defaultCeo.title,
          subtitle: ceoContent.subtitle || defaultCeo.subtitle,
          coverImage: ceoContent.coverImage || defaultCeo.coverImage,
          actionText: ceoContent.cardActionText || defaultCeo.cardActionText,
        },
        productAction: {
          text: hasProductAction ? productSection.actionText : defaultProductSection.actionText,
          url: hasProductAction ? productSection.actionUrl : defaultProductSection.actionUrl,
          tab: hasProductAction ? productSection.actionTab === true : defaultProductSection.actionTab,
        },
        products: visibleProducts,
      });
    } catch (error) {
      wx.showToast({
        title: '首页内容使用本地版本',
        icon: 'none',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleAction(event) {
    const { url, tab } = event.currentTarget.dataset;
    if (!url) return;

    if (url === 'copy:home-contact') {
      this.copyJoinInfo();
      return;
    }

    if (tab) {
      wx.switchTab({ url });
      return;
    }

    wx.navigateTo({ url });
  },

  copyJoinInfo() {
    const ctaSection = this.data.ctaSection;
    const copyText =
      (ctaSection && ctaSection.body) ||
      '我想了解中康参芝明星产品、代理政策和渠道合作资料。';

    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showToast({ title: '合作信息已复制', icon: 'success' });
      },
    });
  },

  openProduct(event) {
    const { slug } = event.currentTarget.dataset;
    if (!slug) return;
    wx.navigateTo({
      url: `/pages/official/product-detail/index?slug=${slug}`,
    });
  },

  openCeoProfile() {
    wx.navigateTo({
      url: '/pages/official/content/index?type=ceo',
    });
  },
});
