const glyphMap = {
  arrow_drop_up: "▲",
  arrow_drop_down: "▼",
  filter: "≡",
  "chevron-right": "›",
  chevron_right: "›",
  "chevron-down": "˅",
  chevron_down: "˅",
  "check-circle-filled": "●",
  check_circle_filled: "●",
  circle: "○",
  store: "⌂",
  location: "⌖",
  "add-circle": "+",
  add_circle: "+",
  home: "⌂",
  app: "▦",
  activity: "✦",
  person: "◉",
};

Component({
  externalClasses: ["class"],
  properties: {
    name: {
      type: String,
      value: "",
      observer(name) {
        this.setData({ glyph: glyphMap[name] || "•" });
      },
    },
    size: {
      type: String,
      value: "32rpx",
    },
    color: {
      type: String,
      value: "inherit",
    },
    customStyle: {
      type: String,
      value: "",
    },
    prefix: {
      type: String,
      value: "",
    },
  },
  data: {
    glyph: "•",
  },
  lifetimes: {
    attached() {
      this.setData({ glyph: glyphMap[this.properties.name] || "•" });
    },
  },
});
