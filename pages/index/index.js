const app = getApp();

Page({
  data: {
    year: 0,
    month: 0,
    expenseStr: "0.00",
    incomeStr: "0.00",
    balanceStr: "0.00",
    balance: 0,
    dailyList: [],
    categoryIcons: {},
    fabVisible: true, // FAB 是否显示（下滑时隐藏，上滑显示）
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      categoryIcons: app.categoryIcons,
    });
    this._lastScrollTop = 0; // 滚动方向检测（page 属性，不进 data）
  },

  onShow() {
    this._lastScrollTop = 0; // 重置滚动基线（防止从其他 tab 回来时误判）
    this.setData({ fabVisible: true });
    this.refresh();
  },

  refresh() {
    const { year, month } = this.data;
    const summary = app.getMonthSummary(year, month);
    const dailyList = app.getDailySummary(summary.records);

    dailyList.forEach((group) => {
      group.dateCN = app.formatDateCN(group.date);
      group.expenseStr = app.formatAmount(group.expense);
      group.incomeStr = app.formatAmount(group.income);
      group.items.forEach((item) => {
        item.amountStr = app.formatAmount(item.amount);
      });
    });

    this.setData({
      expenseStr: app.formatAmount(summary.totalExpense),
      incomeStr: app.formatAmount(summary.totalIncome),
      balanceStr: app.formatAmount(summary.balance),
      balance: summary.balance,
      dailyList,
    });
  },

  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year, month });
    this.refresh();
  },

  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year, month });
    this.refresh();
  },

  onLongPressRecord(e) {
    const id = e.currentTarget.dataset.id;
    const records = app.getRecords();
    const record = records.find((r) => r.id === id);
    if (!record) return;

    wx.showActionSheet({
      itemList: ["编辑", "删除"],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 编辑：add 是 tabBar 页面，不能 navigateTo；用 switchTab + app 暂存 editId
          app.setEditingId(id);
          wx.switchTab({ url: "/pages/add/add" });
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: "删除记录",
            content: `确定删除「${record.category} ¥${app.formatAmount(record.amount)}」吗？`,
            confirmColor: "#e8725c",
            success: (r) => {
              if (r.confirm) {
                app.deleteRecord(id);
                this.refresh();
                wx.showToast({ title: "已删除", icon: "success" });
              }
            },
          });
        }
      },
    });
  },

  // 滚动方向检测 — 下滚隐藏、上滚显示
  onPageScroll(e) {
    const cur = e.scrollTop;
    const delta = cur - this._lastScrollTop;
    this._lastScrollTop = cur;

    // 忽略微小的滚动波动（< 5px）
    if (Math.abs(delta) < 5) return;

    if (delta > 0 && this.data.fabVisible) {
      // 下滚：隐藏
      this.setData({ fabVisible: false });
    } else if (delta < 0 && !this.data.fabVisible) {
      // 上滚：显示
      this.setData({ fabVisible: true });
    }

    // 滚到顶部附近强制显示
    if (cur < 10 && !this.data.fabVisible) {
      this.setData({ fabVisible: true });
    }
  },

  onFabTap() {
    // FAB 永远跳到「记账」新建模式，不传 editId（编辑走长按 → ActionSheet 路径）
    wx.switchTab({ url: "/pages/add/add" });
  },
});
