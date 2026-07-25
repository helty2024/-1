const {
  LEAD_STORAGE_KEY,
  createLead,
  normalizeLead,
} = require("../data/leads");
const { LEAD_DATA_SOURCE } = require("../../../config/officialApi");
const { request } = require("../../../utils/officialApiClient");

const sourceLabels = {
  mock: "本地 Mock 模式",
  api: "独立后台接口",
};

function getLeadSource() {
  return {
    value: LEAD_DATA_SOURCE,
    label: sourceLabels[LEAD_DATA_SOURCE],
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
  if (LEAD_DATA_SOURCE === "api") {
    const query = Object.keys(filters)
      .filter((key) => filters[key] && filters[key] !== "all")
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`,
      )
      .join("&");
    const result = await request({
      path: `/admin/leads${query ? `?${query}` : ""}`,
      auth: true,
    });
    return result.items.map(normalizeLead);
  }

  const leads = readLocalLeads();
  const { type = "all", status = "all" } = filters;

  return leads.filter((lead) => {
    const typeMatched = type === "all" || lead.type === type;
    const statusMatched = status === "all" || lead.status === status;
    return typeMatched && statusMatched;
  });
}

async function getLead(id) {
  if (LEAD_DATA_SOURCE === "api") {
    return normalizeLead(
      await request({
        path: `/admin/leads/${encodeURIComponent(id)}`,
        auth: true,
      }),
    );
  }
  return readLocalLeads().find((lead) => lead.id === id) || null;
}

async function createLeadRecord({
  type,
  formCode = type,
  title,
  values,
  submissionId,
  formStartedAt,
}) {
  if (LEAD_DATA_SOURCE === "api") {
    return normalizeLead(
      await request({
        path: "/public/leads",
        method: "POST",
        data: {
          formCode,
          values,
          source: "wechat_miniprogram",
          submissionId,
          formStartedAt,
        },
      }),
    );
  }

  const leads = readLocalLeads();
  const lead = createLead(type, title, values);
  leads.unshift(lead);
  writeLocalLeads(leads);
  return lead;
}

async function updateLeadRecord(id, patch) {
  if (LEAD_DATA_SOURCE === "api") {
    if (patch.status) {
      await request({
        path: `/admin/leads/${encodeURIComponent(id)}/status`,
        method: "PATCH",
        data: { status: patch.status },
        auth: true,
      });
    }
    if (typeof patch.followNote === "string" && patch.followNote.trim()) {
      await request({
        path: `/admin/leads/${encodeURIComponent(id)}/followups`,
        method: "POST",
        data: { followType: "note", content: patch.followNote.trim() },
        auth: true,
      });
    }
    return getLead(id);
  }

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
  if (LEAD_DATA_SOURCE === "api") {
    await request({
      path: `/admin/leads/${encodeURIComponent(id)}`,
      method: "DELETE",
      auth: true,
    });
    return;
  }
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
