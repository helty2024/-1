const formMap = {
  agent: {
    navTitle: '代理申请',
    label: '代理申请',
    title: '提交代理合作申请',
    subtitle: '填写基础信息后，合作对接人员将根据你的渠道资源和意向产品进行沟通。',
    submitText: '提交代理申请',
    successText: '代理申请已记录',
    fields: [
      { key: 'name', label: '姓名', required: true, type: 'text', placeholder: '请输入姓名' },
      { key: 'phone', label: '手机号', required: true, type: 'number', placeholder: '请输入手机号' },
      { key: 'city', label: '所在城市', required: true, type: 'text', placeholder: '例如：吉林通化' },
      {
        key: 'identity',
        label: '当前身份',
        required: true,
        type: 'select',
        options: ['区域代理', '渠道代理', '私域团长', '电商运营者', '门店经营者', '企业采购服务商', '其他'],
      },
      {
        key: 'channel',
        label: '经营渠道',
        required: true,
        type: 'select',
        options: ['私域社群', '电商平台', '直播带货', '线下门店', '礼赠团购', '健康管理机构', '其他'],
      },
      {
        key: 'product',
        label: '意向产品',
        required: false,
        type: 'select',
        options: ['黑参液', '西洋参凉茶', '野山参酒', '鲜林下参', '珍品野山参', '暂不确定'],
      },
      {
        key: 'mode',
        label: '预计合作方式',
        required: false,
        type: 'select',
        options: ['区域代理', '渠道合作', '私域团购', '电商分销', '企业团购', '项目定制'],
      },
      { key: 'remark', label: '留言备注', required: false, type: 'textarea', placeholder: '请补充渠道情况或合作需求' },
    ],
  },
  investment: {
    navTitle: '投资合作',
    label: '投资合作',
    title: '提交投资合作申请',
    subtitle: '适合项目投资、资源合作、品牌运营、渠道共建和参旅康养方向的合作方。',
    submitText: '提交投资申请',
    successText: '投资合作申请已记录',
    fields: [
      { key: 'name', label: '姓名', required: true, type: 'text', placeholder: '请输入姓名' },
      { key: 'phone', label: '手机号', required: true, type: 'number', placeholder: '请输入手机号' },
      { key: 'city', label: '所在城市', required: true, type: 'text', placeholder: '例如：北京' },
      {
        key: 'direction',
        label: '合作方向',
        required: true,
        type: 'select',
        options: ['项目投资', '渠道共建', '品牌运营', '参旅康养', '产业资源', '其他'],
      },
      { key: 'resource', label: '可提供资源', required: false, type: 'textarea', placeholder: '请简要说明资金、渠道、团队或项目资源' },
      { key: 'remark', label: '留言备注', required: false, type: 'textarea', placeholder: '请补充合作诉求' },
    ],
  },
  consult: {
    navTitle: '普通咨询',
    label: '普通咨询',
    title: '提交咨询信息',
    subtitle: '用于产品、品牌、资质、渠道政策等一般问题咨询。',
    submitText: '提交咨询',
    successText: '咨询信息已记录',
    fields: [
      { key: 'name', label: '姓名', required: true, type: 'text', placeholder: '请输入姓名' },
      { key: 'phone', label: '手机号', required: true, type: 'number', placeholder: '请输入手机号' },
      {
        key: 'topic',
        label: '咨询类型',
        required: true,
        type: 'select',
        options: ['产品咨询', '代理政策', '品牌资质', '合作案例', '投资合作', '其他'],
      },
      { key: 'content', label: '咨询内容', required: false, type: 'textarea', placeholder: '请输入咨询内容' },
    ],
  },
};

function getForm(type) {
  return formMap[type] || formMap.consult;
}

module.exports = {
  formMap,
  getForm,
};
