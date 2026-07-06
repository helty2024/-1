Component({
  externalClasses: ["t-class", "t-class-load", "class"],
  properties: {
    src: {
      type: String,
      value: "",
    },
    mode: {
      type: String,
      value: "aspectFill",
    },
    lazyLoad: {
      type: Boolean,
      value: false,
    },
    showMenuByLongpress: {
      type: Boolean,
      value: false,
    },
    loadFailed: {
      type: String,
      value: "default",
    },
    loading: {
      type: String,
      value: "default",
    },
  },
  methods: {
    onLoad(e) {
      this.triggerEvent("load", e.detail);
    },
    onError(e) {
      this.triggerEvent("error", e.detail);
    },
  },
});
