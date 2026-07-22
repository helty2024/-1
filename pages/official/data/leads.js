const LEAD_STORAGE_KEY = 'officialLeads';
const { getForm } = require('./forms');

const typeLabels = {
  agent: '代理申请',
  investment: '投资合作',
  consult: '普通咨询',
};

const statusOptions = [
  { value: 'new', label: '新线索' },
  { value: 'contacted', label: '已联系' },
  { value: 'qualified', label: '重点跟进' },
  { value: 'closed', label: '已结束' },
];

const statusLabels = statusOptions.reduce((labels, item) => {
  labels[item.value] = item.label;
  return labels;
}, {});

function createLead(type, title, values) {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    typeLabel: typeLabels[type] || title || '咨询线索',
    title,
    values,
    status: 'new',
    statusLabel: statusLabels.new,
    followNote: '',
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeLead(lead, index) {
  const status = lead.status || 'new';
  const typeLabel = typeLabels[lead.type] || lead.title || '咨询线索';
  const id = lead.id || `${lead.createdAt || Date.now()}-${index}`;

  return {
    ...lead,
    id,
    typeLabel,
    status,
    statusLabel: statusLabels[status] || status,
    values: lead.values || {},
    followNote: lead.followNote || '',
  };
}

function readLeads() {
  const leads = wx.getStorageSync(LEAD_STORAGE_KEY) || [];
  return leads.map(normalizeLead);
}

function writeLeads(leads) {
  wx.setStorageSync(LEAD_STORAGE_KEY, leads.map(normalizeLead));
}

function addLead(type, title, values) {
  const leads = readLeads();
  const lead = createLead(type, title, values);
  leads.unshift(lead);
  writeLeads(leads);
  return lead;
}

function findLead(id) {
  return readLeads().find((lead) => lead.id === id) || null;
}

function updateLead(id, patch) {
  const leads = readLeads();
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    const status = patch.status || lead.status;
    return normalizeLead({
      ...lead,
      ...patch,
      status,
      updatedAt: new Date().toISOString(),
    });
  });
  writeLeads(next);
  return next.find((lead) => lead.id === id) || null;
}

function deleteLead(id) {
  const next = readLeads().filter((lead) => lead.id !== id);
  writeLeads(next);
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function leadFields(lead) {
  const values = lead.values || {};
  const form = getForm(lead.type);
  const labelMap = form.fields.reduce((labels, field) => {
    labels[field.key] = field.label;
    return labels;
  }, {});

  return Object.keys(values)
    .filter((key) => values[key])
    .map((key) => ({
      key,
      label: labelMap[key] || key,
      value: values[key],
    }));
}

function exportLeadText(lead) {
  const lines = [
    `线索类型：${lead.typeLabel}`,
    `跟进状态：${lead.statusLabel}`,
    `提交时间：${formatDate(lead.createdAt)}`,
  ];

  leadFields(lead).forEach((field) => {
    lines.push(`${field.label}：${field.value}`);
  });

  if (lead.followNote) {
    lines.push(`跟进备注：${lead.followNote}`);
  }

  return lines.join('\n');
}

module.exports = {
  LEAD_STORAGE_KEY,
  typeLabels,
  statusOptions,
  statusLabels,
  addLead,
  readLeads,
  findLead,
  updateLead,
  deleteLead,
  formatDate,
  leadFields,
  exportLeadText,
};
