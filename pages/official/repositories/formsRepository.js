const { LEAD_DATA_SOURCE } = require('../../../config/officialApi');
const { getForm } = require('../data/forms');
const { request } = require('../../../utils/officialApiClient');

function normalizeForm(form) {
  return {
    ...form,
    navTitle: form.name,
    label: form.name,
    submitText: `提交${form.name}`,
    successText: form.successMessage || `${form.name}已提交`,
    fields: (form.fields || []).map((field) => ({
      ...field,
      key: field.fieldKey,
      type: field.fieldType === 'phone' ? 'number' : field.fieldType,
      options: field.options || [],
    })),
  };
}

async function getFormStructure(code) {
  if (LEAD_DATA_SOURCE === 'mock') return getForm(code);
  const form = await request({
    path: `/public/forms/${encodeURIComponent(code)}?_t=${Date.now()}`,
  });
  return normalizeForm(form);
}

async function listFormStructures(leadType) {
  if (LEAD_DATA_SOURCE === 'mock') {
    const form = getForm(leadType);
    return [{
      code: leadType,
      leadType,
      name: form.label,
      title: form.title,
      subtitle: form.subtitle,
      fieldCount: form.fields.length,
    }];
  }

  return request({
    path: `/public/forms?leadType=${encodeURIComponent(leadType)}&_t=${Date.now()}`,
  });
}

module.exports = { getFormStructure, listFormStructures };
