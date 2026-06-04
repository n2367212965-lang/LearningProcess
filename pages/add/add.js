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
    amountFontSize: "48rpx", // 动态字号，4 位以内不缩，长金额由 computeAmountFontSize 递减
    budgetHint: null, // { status, pct, spent, budget } | null
  },

  onLoad(options) {
    this.setData({
      date: app.getToday(),
      categoryIcons: app.categoryIcons,
    });

    if (options.id) {
      const record = app.getRecordById(options.id);
      if (record) {
        const amountStr = String(record.amount);
        this.setData({
          editId: options.id,
          type: record.type,
          amount: amountStr,
          selectedCategory: record.category,
          date: record.date,
          note: record.note || "",
          categories: app.getCategories(record.type),
          amountFontSize: this.computeAmountFontSize(amountStr.length),
        });
        return;
      }
    }
    this.setData({ categories: app.getCategories(0) });
  },

  // 标签页切换 / 从其他页返回时触发 — 同步 storage 中的最新分类 + 消费待编辑 id
  onShow() {
    const cats = app.getCategories(this.data.type);
    const update = { categories: cats };
    // 防御性: 若已选分类已被删除, 清空
    if (
      this.data.selectedCategory &&
      !cats.includes(this.data.selectedCategory)
    ) {
      update.selectedCategory = "";
    }
    // 只在非编辑模式下重置标题；编辑模式下保持"编辑记录"直到保存
    if (!this.data.editId) {
      wx.setNavigationBarTitle({ title: "记一笔" });
    }
    this.setData(update);

    // 消费 index 页面通过 app.setEditingId 暂存的待编辑 id
    // 一次性：消费后 _pendingEditId 被清空，下次 onShow 不会重放
    const editId = app.consumeEditingId();
    if (editId) {
      const record = app.getRecordById(editId);
      if (record) {
        const amountStr = String(record.amount);
        this.setData({
          editId,
          type: record.type,
          amount: amountStr,
          selectedCategory: record.category,
          date: record.date,
          note: record.note || "",
          categories: app.getCategories(record.type),
          amountFontSize: this.computeAmountFontSize(amountStr.length),
          budgetHint: null,
        });
        wx.setNavigationBarTitle({ title: "编辑记录" });
      } else {
        wx.showToast({ title: "记录不存在", icon: "none" });
      }
    }
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({
      type,
      selectedCategory: "",
      amount: "",
      categories: app.getCategories(type),
      budgetHint: null,
    });
  },

  onAmountInput(e) {
    let val = e.detail.value;
    val = val.replace(/(\.\d{2})\d*$/, "$1");
    const update = {
      amount: val,
      amountFontSize: this.computeAmountFontSize(val.length),
    };
    if (this.data.selectedCategory) {
      update.budgetHint = this._buildBudgetHint(this.data.selectedCategory);
    }
    this.setData(update);
  },

  // 金额越长字号越小，确保始终装得下输入框。
  // 阈值基于：在 750rpx 设计稿、48rpx 初始字号下，4 位（"9999"）可放心显示；
  // 输入超 4 位后逐级收缩，给 ¥ 符号和容器 padding 留余量。
  computeAmountFontSize(len) {
    if (len <= 4) return "48rpx";
    if (len <= 6) return "40rpx";
    if (len <= 8) return "34rpx";
    if (len <= 10) return "30rpx";
    if (len <= 12) return "26rpx";
    return "24rpx";
  },

  selectCategory(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: cat,
      budgetHint: this._buildBudgetHint(cat),
    });
  },

  // 选支出分类后，预算提示（未设预算或未超阈值则返回 null）
  _buildBudgetHint(category) {
    if (this.data.type !== 0) return null;
    const today = new Date();
    const y = today.getFullYear(),
      m = today.getMonth() + 1;
    const budget = app.getBudget(0, category);
    if (budget <= 0) return null;
    const spent =
      app.getCategorySpent(0, category, y, m) + (Number(this.data.amount) || 0);
    const s = app.calcBudgetStatus(category, spent, budget);
    if (s.status === "none" || s.status === "ok") return null;
    return {
      status: s.status,
      pct: Math.round(s.pct),
      spent: app.formatAmount(spent),
      budget: app.formatAmount(budget),
    };
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
