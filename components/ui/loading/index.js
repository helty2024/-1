Component({
  externalClasses: ["t-class", "t-class-text", "t-class-indicator", "class"],
  properties: {
    loading: {
      type: Boolean,
      value: true,
    },
    text: {
      type: String,
      value: "",
    },
    size: {
      type: String,
      value: "32rpx",
    },
  },
});
