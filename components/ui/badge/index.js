Component({
  options: {
    multipleSlots: true,
  },
  externalClasses: ["class"],
  properties: {
    count: {
      type: Number,
      value: 0,
    },
    maxCount: {
      type: Number,
      value: 99,
    },
    color: {
      type: String,
      value: "#FF4646",
    },
  },
});
