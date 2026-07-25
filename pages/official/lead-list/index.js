const { formatDate } = require('../data/leads');
const { getLeadSource, listLeads } = require('../repositories/leadsRepository');

const typeFilters = [
  { value: 'all', label: '全部类型' },
  { value: 'agent', label: '代理申请' },
  { value: 'investment', label: '投资合作' },
  { value: 'consult', label: '普通咨询' },
];

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'new', label: '新线索' },
  { value: 'contacted', label: '已联系' },
  { value: 'qualified', label: '重点跟进' },
  { value: 'closed', label: '已结束' },
  { value: 'invalid', label: '无效线索' },
];

Page({
  data: {
    typeFilters,
    statusFilters,
    typeIndex: 0,
    statusIndex: 0,
    leads: [],
    visibleLeads: [],
    summary: {
      total: 0,
      newCount: 0,
      qualifiedCount: 0,
    },
    sourceLabel: getLeadSource().label,
  },

  onShow() {
    this.loadLeads();
  },

  async loadLeads() {
    const leads = (await listLeads()).map((lead) => ({
      ...lead,
      displayTime: formatDate(lead.createdAt),
      displayName: lead.values.name || '未填写姓名',
      displayPhone: lead.values.phone || '未填写手机号',
      displayDesc: this.buildLeadDesc(lead),
    }));

    this.setData({
      leads,
      summary: {
        total: leads.length,
        newCount: leads.filter((lead) => lead.status === 'new').length,
        qualifiedCount: leads.filter((lead) => lead.status === 'qualified').length,
      },
    });
    this.applyFilters();
  },

  buildLeadDesc(lead) {
    const values = lead.values || {};
    return [values.city, values.identity, values.channel, values.direction, values.topic]
      .filter(Boolean)
      .join(' / ');
  },

  onTypeChange(event) {
    this.setData({ typeIndex: Number(event.detail.value) });
    this.applyFilters();
  },

  onStatusChange(event) {
    this.setData({ statusIndex: Number(event.detail.value) });
    this.applyFilters();
  },

  async applyFilters() {
    const type = this.data.typeFilters[this.data.typeIndex].value;
    const status = this.data.statusFilters[this.data.statusIndex].value;
    const visibleLeads = (await listLeads({ type, status })).map((lead) => ({
      ...lead,
      displayTime: formatDate(lead.createdAt),
      displayName: lead.values.name || '未填写姓名',
      displayPhone: lead.values.phone || '未填写手机号',
      displayDesc: this.buildLeadDesc(lead),
    }));

    this.setData({ visibleLeads });
  },

  openLead(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/official/lead-detail/index?id=${id}`,
    });
  },

  openForm() {
    wx.navigateTo({
      url: '/pages/official/form-select/index?type=agent',
    });
  },
});
