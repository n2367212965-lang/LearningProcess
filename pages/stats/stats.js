const app = getApp();

Page({
  data: {
    year: 0,
    month: 0,
    incomeStr: "0.00",
    expenseStr: "0.00",
    balanceStr: "0.00",
    balance: 0,
    hasData: false,
    categoryList: [],
    dayCount: 0,
    recordCount: 0,
    avgDaily: "0.00",
    maxExpense: { category: "-", amount: "0.00", icon: "📦" },
  },

  onLoad() {
    const now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const { year, month } = this.data;
    const summary = app.getMonthSummary(year, month);
    const hasData = summary.totalExpense > 0 || summary.totalIncome > 0;

    // 分类统计
    const catData = app.getCategorySummary(summary.records);
    const categoryList =
      summary.totalExpense > 0
        ? catData.map((c) => ({
            ...c,
            amountStr: app.formatAmount(c.total),
            pct: ((c.total / summary.totalExpense) * 100).toFixed(1),
            icon: app.categoryIcons[c.category] || "📦",
            barWidth: Math.max((c.total / summary.totalExpense) * 100, 5),
          }))
        : [];

    // 每日统计
    const dailyData = app.getDailySummary(summary.records);
    const dayCount = dailyData.length;
    const recordCount = summary.records.length;
    const avgDaily =
      dayCount > 0 ? app.formatAmount(summary.totalExpense / dayCount) : "0.00";

    // 最大支出
    const maxCat = catData.length > 0 ? catData[0] : null;

    this.setData({
      incomeStr: app.formatAmount(summary.totalIncome),
      expenseStr: app.formatAmount(summary.totalExpense),
      balanceStr: app.formatAmount(summary.balance),
      balance: summary.balance,
      hasData,
      categoryList,
      dayCount,
      recordCount,
      avgDaily,
      maxExpense: maxCat
        ? {
            category: maxCat.category,
            amount: app.formatAmount(maxCat.total),
            icon: app.categoryIcons[maxCat.category] || "📦",
          }
        : { category: "-", amount: "0.00", icon: "📦" },
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
});
