const {
  LEAD_STORAGE_KEY,
  createLead,
  normalizeLead,
} = require('../data/leads');

const DATA_SOURCE = 'local';
const sourceLabels = {
  local: '本地存储模式',
  cloud: '微信云开发',
  api: '独立后台接口',
};

function getLeadSource() {
  return {
    value: DATA_SOURCE,
    label: sourceLabels[DATA_SOURCE],
  };
}

function readLocalLeads() {
  const leads = wx.getStorageSync(LEAD_STORAGE_KEY) || [];
  return leads.map(normalizeLead);
}

function writeLocalLeads(leads) {
  wx.setStorageSync(LEAD_STORAGE_KEY, leads.map(normalizeLead));
}

async function listLeads(filters = {}) {
  const leads = readLocalLeads();
  const { type = 'all', status = 'all' } = filters;

  return leads.filter((lead) => {
    const typeMatched = type === 'all' || lead.type === type;
    const statusMatched = status === 'all' || lead.status === status;
    return typeMatched && statusMatched;
  });
}

async function getLead(id) {
  return readLocalLeads().find((lead) => lead.id === id) || null;
}

async function createLeadRecord({ type, title, values }) {
  const leads = readLocalLeads();
  const lead = createLead(type, title, values);
  leads.unshift(lead);
  writeLocalLeads(leads);
  return lead;
}

async function updateLeadRecord(id, patch) {
  const leads = readLocalLeads();
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

  writeLocalLeads(next);
  return next.find((lead) => lead.id === id) || null;
}

async function deleteLeadRecord(id) {
  const next = readLocalLeads().filter((lead) => lead.id !== id);
  writeLocalLeads(next);
}

module.exports = {
  getLeadSource,
  listLeads,
  getLead,
  createLeadRecord,
  updateLeadRecord,
  deleteLeadRecord,
};
