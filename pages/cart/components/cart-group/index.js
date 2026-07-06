const shortageImg = 'https://tdesign.gtimg.com/miniprogram/template/retail/cart/shortage.png';

Component({
  isSpecsTap: false,
  externalClasses: ['wr-class'],
  properties: {
    storeGoods: {
      type: Array,
      observer(storeGoods) {
        const nextStoreGoods = (storeGoods || []).map((store) => ({
          ...store,
          promotionGoodsList: (store.promotionGoodsList || []).map((activity) => ({
            ...activity,
            goodsPromotionList: (activity.goodsPromotionList || []).map((goods) => ({
              ...goods,
              specs: (goods.specInfo || []).map((item) => item.specValue),
            })),
          })),
          shortageGoodsList: (store.shortageGoodsList || []).map((goods) => ({
            ...goods,
            specs: (goods.specInfo || []).map((item) => item.specValue),
          })),
        }));
        this.setData({ _storeGoods: nextStoreGoods });
      },
    },
    invalidGoodItems: {
      type: Array,
      observer(invalidGoodItems) {
        const nextInvalidItems = (invalidGoodItems || []).map((goods) => ({
          ...goods,
          specs: (goods.specInfo || []).map((item) => item.specValue),
        }));
        this.setData({ _invalidGoodItems: nextInvalidItems });
      },
    },
    thumbWidth: { type: null },
    thumbHeight: { type: null },
  },

  data: {
    shortageImg,
    isShowSpecs: false,
    currentGoods: {},
    isShowToggle: false,
    _storeGoods: [],
    _invalidGoodItems: [],
  },

  methods: {
    deleteGoods(e) {
      const { goods } = e.currentTarget.dataset;
      this.triggerEvent('delete', { goods });
    },

    clearInvalidGoods() {
      this.triggerEvent('clearinvalidgoods');
    },

    selectGoods(e) {
      const { goods } = e.currentTarget.dataset;
      this.triggerEvent('selectgoods', {
        goods,
        isSelected: !goods.isSelected,
      });
    },

    changeQuantity(num, goods) {
      this.triggerEvent('changequantity', {
        goods,
        quantity: num,
      });
    },

    changeStepper(e) {
      const { value } = e.detail;
      const { goods } = e.currentTarget.dataset;
      const num = value > goods.stack ? goods.stack : value;
      this.changeQuantity(num, goods);
    },

    input(e) {
      const { value } = e.detail;
      const { goods } = e.currentTarget.dataset;
      this.changeQuantity(value, goods);
    },

    overlimit(e) {
      const text = e.detail.type === 'minus' ? 'stepper-min-limit' : 'stepper-max-limit';
      wx.showToast({ title: text, icon: 'none' });
    },

    gotoBuyMore(e) {
      const { promotion, storeId = '' } = e.currentTarget.dataset;
      this.triggerEvent('gocollect', { promotion, storeId });
    },

    selectStore(e) {
      const { storeIndex } = e.currentTarget.dataset;
      const store = this.data._storeGoods[storeIndex];
      if (!store) return;
      const isSelected = !store.isSelected;
      if (store.storeStockShortage && isSelected) {
        wx.showToast({ title: 'store-shortage', icon: 'none' });
        return;
      }
      this.triggerEvent('selectstore', {
        store,
        isSelected,
      });
    },

    showToggle() {
      this.setData({
        isShowToggle: !this.data.isShowToggle,
      });
    },

    specsTap(e) {
      this.isSpecsTap = true;
      const { goods } = e.currentTarget.dataset;
      this.setData({
        isShowSpecs: true,
        currentGoods: goods,
      });
    },

    hideSpecsPopup() {
      this.setData({
        isShowSpecs: false,
      });
    },

    goGoodsDetail(e) {
      if (this.isSpecsTap) {
        this.isSpecsTap = false;
        return;
      }
      const { goods } = e.currentTarget.dataset;
      this.triggerEvent('goodsclick', { goods });
    },

    gotoCoupons() {
      wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
    },
  },
});
