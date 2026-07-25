const { createLeadRecord } = require("../repositories/leadsRepository");
const { getFormStructure } = require("../repositories/formsRepository");

function createSubmissionId() {
  const random = Math.random().toString(36).slice(2, 12);
  return `submit_${Date.now()}_${random}`;
}

Page({
  data: {
    type: "consult",
    formCode: "",
    form: null,
    values: {},
    loading: true,
    loadError: "",
    submitting: false,
    submissionId: "",
    formStartedAt: "",
  },

  onLoad(options) {
    const type = options.type || "consult";
    const formCode = options.code || "";
    if (!formCode) {
      wx.redirectTo({
        url: `/pages/official/form-select/index?type=${encodeURIComponent(type)}`,
      });
      return;
    }
    this.setData({
      type,
      formCode,
      submissionId: createSubmissionId(),
      formStartedAt: new Date().toISOString(),
    });
    this.loadForm();
  },

  async loadForm() {
    const { formCode } = this.data;
    this.setData({ loading: true, loadError: "", form: null });
    try {
      const form = await getFormStructure(formCode);
      this.setData({ form, values: {}, loading: false });
      wx.setNavigationBarTitle({ title: form.navTitle });
    } catch (error) {
      this.setData({
        loading: false,
        loadError: error.message || "表单加载失败，请稍后重试",
      });
    }
  },

  retryLoad() {
    this.loadForm();
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

  onRadioChange(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [`values.${key}`]: event.detail.value });
  },

  onCheckboxChange(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [`values.${key}`]: event.detail.value });
  },

  async submitLead() {
    const {
      form,
      formCode,
      type,
      values,
      submitting,
      submissionId,
      formStartedAt,
    } = this.data;
    if (submitting) return;
    const missing = form.fields.find(
      (field) => field.required && !values[field.key],
    );

    if (missing) {
      wx.showToast({
        title: `请填写${missing.label}`,
        icon: "none",
      });
      return;
    }

    try {
      this.setData({ submitting: true });
      wx.showLoading({ title: "正在提交", mask: true });
      await createLeadRecord({
        type,
        formCode,
        title: form.navTitle,
        values,
        submissionId,
        formStartedAt,
      });
      wx.hideLoading();
      wx.showToast({
        title: form.successText,
        icon: "success",
      });
    } catch (error) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: error.message || "提交失败", icon: "none" });
      return;
    }

    setTimeout(() => {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: "/pages/usercenter/index" }),
      });
    }, 600);
  },
});
