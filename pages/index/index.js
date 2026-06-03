const storage = require("../../utils/storage");
const { formatDateCN, formatAmount } = require("../../utils/util");

Page({
  data: {
    year: 0,
    month: 0,
    expenseStr: "0.00",
    incomeStr: "0.00",
    balanceStr: "0.00",
    balance: 0,
    dailyList: [],
    categoryIcons: {
      餐饮: "🍜",
      交通: "🚗",
      购物: "🛍️",
      娱乐: "🎮",
      住房: "🏠",
      通讯: "📱",
      医疗: "🏥",
      教育: "📚",
      人情: "🧧",
      其他: "📦",
      工资: "💰",
      奖金: "🏆",
      兼职: "💼",
      红包: "🧧",
      理财: "📈",
    },
  },

  onLoad() {
    const now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const { year, month } = this.data;
    const summary = storage.getMonthSummary(year, month);
    const dailyList = storage.getDailySummary(summary.records);

    dailyList.forEach((group) => {
      group.dateCN = formatDateCN(group.date);
      group.expenseStr = formatAmount(group.expense);
      group.incomeStr = formatAmount(group.income);
      group.items.forEach((item) => {
        item.amountStr = formatAmount(item.amount);
      });
    });

    this.setData({
      expenseStr: formatAmount(summary.totalExpense),
      incomeStr: formatAmount(summary.totalIncome),
      balanceStr: formatAmount(summary.totalIncome - summary.totalExpense),
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
    const that = this;
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条记录吗？",
      success(res) {
        if (res.confirm) {
          storage.deleteRecord(id);
          that.refresh();
          wx.showToast({ title: "已删除", icon: "success" });
        }
      },
    });
  },

  goToAdd() {
    wx.switchTab({ url: "/pages/add/add" });
  },
});
