const { getForm } = require('../data/forms');
const { createLeadRecord } = require('../repositories/leadsRepository');

Page({
  data: {
    type: 'consult',
    form: null,
    values: {},
  },

  onLoad(options) {
    const type = options.type || 'consult';
    const form = getForm(type);
    this.setData({ type, form, values: {} });
    wx.setNavigationBarTitle({ title: form.navTitle });
  },

  onInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({
      [`values.${key}`]: event.detail.value,
    });
  },

  onPickerChange(event) {
    const fieldIndex = Number(event.currentTarget.dataset.index);
    const field = this.data.form.fields[fieldIndex];
    const valueIndex = Number(event.detail.value);
    this.setData({
      [`values.${field.key}`]: field.options[valueIndex],
    });
  },

  async submitLead() {
    const { form, type, values } = this.data;
    const missing = form.fields.find((field) => field.required && !values[field.key]);

    if (missing) {
      wx.showToast({
        title: `请填写${missing.label}`,
        icon: 'none',
      });
      return;
    }

    await createLeadRecord({
      type,
      title: form.navTitle,
      values,
    });

    wx.showToast({
      title: form.successText,
      icon: 'success',
    });

    setTimeout(() => {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/usercenter/index' }) });
    }, 600);
  },
});
