const { getContent } = require('../data/content');

Page({
  data: {
    content: null,
  },

  onLoad(options) {
    const content = getContent(options.type);
    this.setData({ content });
    wx.setNavigationBarTitle({ title: content.navTitle });
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
