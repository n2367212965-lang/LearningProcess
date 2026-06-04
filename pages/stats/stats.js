// 方案 A：经典财务仪表盘
// 回答 4 个核心问题：
//  1. 我有没有入不敷出？（结余/储蓄率）
//  2. 钱花到哪去了？（分类占比 + Top5）
//  3. 我是越花越多还是越来越少？（6 个月趋势 + 环比）
//  4. 有没有超预算？（分类预算预警）
const app = getApp();

const PIE_COLORS = [
  "#FF6B6B",
  "#FFA94D",
  "#FFD43B",
  "#51CF66",
  "#4DABF7",
  "#845EF7",
  "#94A3B8",
];

Page({
  data: {
    viewMode: "month", // month | year
    year: 0,
    month: 0,
    // 头部
    incomeStr: "0.00",
    expenseStr: "0.00",
    balanceStr: "0.00",
    balance: 0,
    hasData: false,
    // KPI 三件套
    savingRate: "0",
    savingRateClass: "good",
    momChange: "0",
    momArrow: "—",
    momClass: "flat",
    momHidden: false,
    avgDaily: "0.00",
    avgLabel: "日均支出",
    // 趋势图
    trend: [],
    trendMax: 0,
    // 分类
    categoryList: [],
    pieSlices: [],
    pieBg: "conic-gradient(#e9ecef 0% 100%)",
    topExpense: null,
    // 进度
    savingProgress: 0,
    // 预算预警
    budgetWarnings: [],
  },

  onLoad() {
    const now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
  },

  onShow() {
    this.refresh();
  },

  switchMode(e) {
    this.setData({ viewMode: e.currentTarget.dataset.mode });
    this.refresh();
  },

  refresh() {
    const { viewMode, year, month } = this.data;
    const summary =
      viewMode === "month"
        ? app.getMonthSummary(year, month)
        : app.getYearSummary(year);

    const prevSummary =
      viewMode === "month" ? this._prevMonthSummary(year, month) : null;

    const isYear = viewMode === "year";
    const hasData = summary.totalExpense > 0 || summary.totalIncome > 0;

    this.setData({
      ...this._buildSummaryHeader(summary),
      ...this._buildKpi(summary, prevSummary, isYear),
      ...this._buildTrend(year, month),
      ...this._buildCategories(summary),
      ...this._buildBudgetWarnings(year, month, isYear),
      hasData,
    });
  },

  _prevMonthSummary(year, month) {
    let pm = month - 1,
      py = year;
    if (pm < 1) {
      pm = 12;
      py--;
    }
    return app.getMonthSummary(py, pm);
  },

  _buildSummaryHeader(summary) {
    return {
      incomeStr: app.formatAmount(summary.totalIncome),
      expenseStr: app.formatAmount(summary.totalExpense),
      balanceStr: app.formatAmount(summary.balance),
      balance: summary.balance,
    };
  },

  _buildKpi(summary, prevSummary, hidden) {
    const k = app.calcKpiState(
      { totalIncome: summary.totalIncome, totalExpense: summary.totalExpense },
      prevSummary,
      hidden,
    );
    const periodCount = hidden
      ? 12
      : app.getMonthDays(this.data.year, this.data.month);
    const avgDaily = app.formatAmount(
      summary.totalExpense / (periodCount || 1),
    );
    return {
      savingRate: k.savingRate,
      savingRateClass: k.savingRateClass,
      momChange: k.momChange,
      momArrow: k.momArrow,
      momClass: k.momClass,
      momHidden: k.momHidden,
      avgDaily,
      avgLabel: hidden ? "月均支出" : "日均支出",
      savingProgress: Math.max(0, Math.min(Number(k.savingRate), 100)),
    };
  },

  _buildTrend(year, month) {
    const trendRaw = app.getMonthTrend(6, year, month);
    const bars = app.calcTrendBars(trendRaw);
    const trend = trendRaw.map((t, i) => ({
      label: t.label,
      income: bars[i].income,
      expense: bars[i].expense,
      incomeStr: app.formatAmount(bars[i].income),
      expenseStr: app.formatAmount(bars[i].expense),
      barHeight: bars[i].barHeight,
    }));
    const trendMax = Math.max(...trendRaw.map((t) => t.income + t.expense), 1);
    return { trend, trendMax };
  },

  _buildCategories(summary) {
    const catData = app.getCategorySummary(summary.records);
    const totalExp = summary.totalExpense;
    const top5 = catData.slice(0, 5);
    const others = catData.slice(5);
    const othersTotal = others.reduce((s, c) => s + c.total, 0);

    // ---- 列表 ----
    const categoryList = top5.map((c) => ({
      ...c,
      amountStr: app.formatAmount(c.total),
      pct: totalExp > 0 ? ((c.total / totalExp) * 100).toFixed(1) : "0.0",
      icon: app.categoryIcons[c.category] || "📦",
      barWidth: totalExp > 0 ? Math.max((c.total / totalExp) * 100, 4) : 0,
    }));
    if (othersTotal > 0) {
      categoryList.push({
        category: "其他",
        total: othersTotal,
        amountStr: app.formatAmount(othersTotal),
        pct: totalExp > 0 ? ((othersTotal / totalExp) * 100).toFixed(1) : "0.0",
        icon: "📦",
        barWidth:
          totalExp > 0 ? Math.max((othersTotal / totalExp) * 100, 4) : 0,
      });
    }

    // ---- 饼图 ----
    let curPct = 0;
    const pieSlices = top5.map((c, i) => {
      const pct = totalExp > 0 ? (c.total / totalExp) * 100 : 0;
      const slice = {
        category: c.category,
        icon: app.categoryIcons[c.category] || "📦",
        total: app.formatAmount(c.total),
        pct: pct.toFixed(1),
        color: PIE_COLORS[i % PIE_COLORS.length],
        startPct: curPct,
        endPct: curPct + pct,
      };
      curPct += pct;
      return slice;
    });
    if (othersTotal > 0) {
      const pct = totalExp > 0 ? (othersTotal / totalExp) * 100 : 0;
      pieSlices.push({
        category: "其他",
        icon: "📦",
        total: app.formatAmount(othersTotal),
        pct: pct.toFixed(1),
        color: PIE_COLORS[5],
        startPct: curPct,
        endPct: 100,
      });
    }
    const pieBg =
      pieSlices.length > 0
        ? `conic-gradient(${pieSlices.map((s) => `${s.color} ${s.startPct}% ${s.endPct}%`).join(", ")})`
        : "conic-gradient(#e9ecef 0% 100%)";

    // ---- 最大支出 ----
    const topExpense =
      top5.length > 0
        ? {
            category: top5[0].category,
            amount: app.formatAmount(top5[0].total),
            icon: app.categoryIcons[top5[0].category] || "📦",
          }
        : null;

    return { categoryList, pieSlices, pieBg, topExpense };
  },

  _buildBudgetWarnings(year, month, isYear) {
    if (isYear) return { budgetWarnings: [] };
    const cats = app.getCategories(0);
    const warnings = [];
    cats.forEach((cat) => {
      const budget = app.getBudget(0, cat);
      if (budget > 0) {
        const spent = app.getCategorySpent(0, cat, year, month);
        const s = app.calcBudgetStatus(cat, spent, budget);
        if (s.status === "warn" || s.status === "over") {
          warnings.push({
            category: cat,
            icon: app.categoryIcons[cat] || "📦",
            spent: app.formatAmount(spent),
            budget: app.formatAmount(budget),
            pct: Math.round(s.pct),
            status: s.status,
          });
        }
      }
    });
    return { budgetWarnings: warnings };
  },

  prevPeriod() {
    let { year, month, viewMode } = this.data;
    if (viewMode === "month") {
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
    } else year--;
    this.setData({ year, month });
    this.refresh();
  },

  nextPeriod() {
    let { year, month, viewMode } = this.data;
    if (viewMode === "month") {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    } else year++;
    this.setData({ year, month });
    this.refresh();
  },
});
