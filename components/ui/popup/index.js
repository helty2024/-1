Component({
  options: {
    multipleSlots: true,
  },
  externalClasses: ["class"],
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    placement: {
      type: String,
      value: "bottom",
    },
    closeBtn: {
      type: Boolean,
      value: false,
    },
    zIndex: {
      type: Number,
      value: 1000,
    },
  },
  methods: {
    close() {
      this.triggerEvent("visible-change", { value: false });
    },
    onMaskTap() {
      this.close();
    },
    stop() {},
  },
});
