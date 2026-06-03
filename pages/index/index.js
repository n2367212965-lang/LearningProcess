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
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      categoryIcons: app.categoryIcons,
    });
  },

  onShow() {
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

  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条记录吗？",
      confirmColor: "#e8725c",
      success: (res) => {
        if (res.confirm) {
          app.deleteRecord(id);
          this.refresh();
          wx.showToast({ title: "已删除", icon: "success" });
        }
      },
    });
  },
});
