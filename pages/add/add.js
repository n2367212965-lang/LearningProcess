const app = getApp();

Page({
  data: {
    editId: null,
    type: 0,
    amount: "",
    selectedCategory: "",
    date: "",
    note: "",
    categories: [],
    categoryIcons: {},
  },

  onLoad(options) {
    this.setData({
      date: app.getToday(),
      categoryIcons: app.categoryIcons,
    });

    if (options.id) {
      const record = app.getRecordById(options.id);
      if (record) {
        this.setData({
          editId: options.id,
          type: record.type,
          amount: String(record.amount),
          selectedCategory: record.category,
          date: record.date,
          note: record.note || "",
          categories: app.getCategories(record.type),
        });
        return;
      }
    }
    this.setData({ categories: app.getCategories(0) });
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({
      type,
      selectedCategory: "",
      amount: "",
      categories: app.getCategories(type),
    });
  },

  onAmountInput(e) {
    let val = e.detail.value;
    val = val.replace(/(\.\d{2})\d*$/, "$1");
    this.setData({ amount: val });
  },

  selectCategory(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.category });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onSave() {
    const { editId, type, amount, selectedCategory, date, note } = this.data;
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      wx.showToast({ title: "请输入金额", icon: "none" });
      return;
    }
    if (!selectedCategory) {
      wx.showToast({ title: "请选择分类", icon: "none" });
      return;
    }

    if (editId) {
      app.updateRecord(editId, {
        type,
        amount: num,
        category: selectedCategory,
        note,
        date,
      });
      wx.showToast({ title: "修改成功", icon: "success" });
    } else {
      app.addRecord({
        type,
        amount: num,
        category: selectedCategory,
        note,
        date,
      });
      wx.showToast({ title: "保存成功", icon: "success" });
    }

    this.setData({
      amount: "",
      selectedCategory: "",
      note: "",
      editId: null,
      type: 0,
      categories: app.getCategories(0),
    });
    setTimeout(() => wx.switchTab({ url: "/pages/index/index" }), 500);
  },
});
