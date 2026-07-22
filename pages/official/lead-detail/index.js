const {
  statusOptions,
  findLead,
  updateLead,
  deleteLead,
  formatDate,
  leadFields,
  exportLeadText,
} = require('../data/leads');

Page({
  data: {
    id: '',
    lead: null,
    fields: [],
    statusOptions,
    statusIndex: 0,
    followNote: '',
  },

  onLoad(options) {
    this.setData({ id: options.id || '' });
  },

  onShow() {
    this.loadLead();
  },

  loadLead() {
    const lead = findLead(this.data.id);
    if (!lead) {
      wx.showToast({ title: '线索不存在', icon: 'none' });
      return;
    }

    const statusIndex = statusOptions.findIndex((item) => item.value === lead.status);
    this.setData({
      lead: {
        ...lead,
        displayTime: formatDate(lead.createdAt),
        updateTime: formatDate(lead.updatedAt),
      },
      fields: leadFields(lead),
      statusIndex: statusIndex >= 0 ? statusIndex : 0,
      followNote: lead.followNote || '',
    });
  },

  onStatusChange(event) {
    const statusIndex = Number(event.detail.value);
    const status = statusOptions[statusIndex].value;
    const lead = updateLead(this.data.id, { status });
    this.setData({ statusIndex });
    if (lead) this.loadLead();
  },

  onNoteInput(event) {
    this.setData({ followNote: event.detail.value });
  },

  saveNote() {
    updateLead(this.data.id, { followNote: this.data.followNote });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.loadLead();
  },

  copyExport() {
    wx.setClipboardData({
      data: exportLeadText(this.data.lead),
      success: () => wx.showToast({ title: '已复制导出文本', icon: 'success' }),
    });
  },

  deleteLead() {
    wx.showModal({
      title: '删除线索',
      content: '当前是本地测试线索，删除后不可恢复。',
      confirmText: '删除',
      confirmColor: '#d3ad5d',
      success: (res) => {
        if (!res.confirm) return;
        deleteLead(this.data.id);
        wx.navigateBack();
      },
    });
  },
});
