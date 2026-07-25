const { getContentPage } = require('../../../services/official/contentRepository');

function navigateToAction(url, tab) {
  if (!url) return;

  if (tab) {
    wx.switchTab({ url });
    return;
  }

  wx.navigateTo({ url });
}

Page({
  data: {
    content: null,
    loading: true,
  },

  async onLoad(options) {
    try {
      const content = await getContentPage(options.type || 'company');
      this.setData({ content });
      wx.setNavigationBarTitle({ title: content.navTitle });
      const sectionIndex = Number.parseInt(options.section, 10);
      if (Number.isInteger(sectionIndex) && sectionIndex >= 0) {
        wx.nextTick(() => {
          wx.pageScrollTo({
            selector: `#content-section-${sectionIndex}`,
            offsetTop: 16,
            duration: 300,
          });
        });
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '内容加载失败',
        icon: 'none',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleAction(event) {
    const { url, tab } = event.currentTarget.dataset;
    navigateToAction(url, tab);
  },

  handleCardAction(event) {
    const { image, fileUrl, fileName, url, tab } = event.currentTarget.dataset;

    if (fileUrl) {
      wx.showLoading({ title: '正在打开资料', mask: true });
      wx.downloadFile({
        url: fileUrl,
        success(result) {
          if (result.statusCode !== 200) {
            wx.showToast({ title: '资料下载失败', icon: 'none' });
            return;
          }

          wx.openDocument({
            filePath: result.tempFilePath,
            fileType: 'pdf',
            showMenu: true,
            fail() {
              wx.showToast({
                title: fileName ? `${fileName}暂时无法打开` : '资料暂时无法打开',
                icon: 'none',
              });
            },
          });
        },
        fail() {
          wx.showToast({ title: '资料下载失败，请稍后重试', icon: 'none' });
        },
        complete() {
          wx.hideLoading();
        },
      });
      return;
    }

    if (image) {
      wx.previewImage({
        current: image,
        urls: [image],
      });
      return;
    }

    navigateToAction(url, tab);
  },
});
