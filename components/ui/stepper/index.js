Component({
  properties: {
    value: {
      type: Number,
      value: 1,
      observer(value) {
        this.setData({ current: Number(value) || 0 });
      },
    },
    min: {
      type: Number,
      value: 1,
    },
    max: {
      type: Number,
      value: 999,
    },
    classname: {
      type: String,
      value: "",
    },
  },
  data: {
    current: 1,
  },
  lifetimes: {
    attached() {
      this.setData({ current: Number(this.properties.value) || 0 });
    },
  },
  methods: {
    emitChange(value) {
      this.setData({ current: value });
      this.triggerEvent("change", { value });
    },
    onMinus() {
      const next = Math.max(this.data.current - 1, this.properties.min);
      if (next === this.data.current) {
        this.triggerEvent("overlimit", { type: "minus" });
        return;
      }
      this.emitChange(next);
    },
    onPlus() {
      const next = Math.min(this.data.current + 1, this.properties.max);
      if (next === this.data.current) {
        this.triggerEvent("overlimit", { type: "plus" });
        return;
      }
      this.emitChange(next);
    },
    onInput(e) {
      const raw = Number(e.detail.value);
      if (Number.isNaN(raw)) return;
      const next = Math.max(this.properties.min, Math.min(raw, this.properties.max));
      this.emitChange(next);
    },
    onBlur(e) {
      this.triggerEvent("blur", { value: Number(e.detail.value) || this.data.current });
    },
  },
});
