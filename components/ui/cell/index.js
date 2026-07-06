Component({
  options: {
    multipleSlots: true,
  },
  externalClasses: ["t-class", "t-class-left", "t-class-title", "t-class-note", "class"],
  properties: {
    title: {
      type: String,
      value: "",
    },
    note: {
      type: String,
      value: "",
    },
    arrow: {
      type: Boolean,
      value: false,
    },
    bordered: {
      type: Boolean,
      value: true,
    },
  },
});
