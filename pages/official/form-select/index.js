const { listFormStructures } = require('../repositories/formsRepository');

const typeLabels = {
  agent: '代理申请',
  investment: '投资合作',
  consult: '普通咨询',
};

Page({
  data: {
    type: 'agent',
    typeLabel: '代理申请',
    forms: [],
    loading: true,
    loadError: '',
  },

  onLoad(options) {
    const type = typeLabels[options.type] ? options.type : 'agent';
    const typeLabel = typeLabels[type];
    this.setData({ type, typeLabel });
    wx.setNavigationBarTitle({ title: `选择${typeLabel}` });
    this.loadForms();
  },

  async loadForms() {
    this.setData({ loading: true, loadError: '' });
    try {
      const forms = await listFormStructures(this.data.type);
      this.setData({ forms, loading: false });
    } catch (error) {
      this.setData({
        forms: [],
        loading: false,
        loadError: error.message || '表单列表加载失败，请稍后重试',
      });
    }
  },

  retryLoad() {
    this.loadForms();
  },

  openForm(event) {
    const code = event.currentTarget.dataset.code;
    if (!code) return;
    wx.navigateTo({
      url: `/pages/official/lead-form/index?type=${encodeURIComponent(this.data.type)}&code=${encodeURIComponent(code)}`,
    });
  },
});
