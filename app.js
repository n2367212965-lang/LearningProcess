// 数据服务层 — 页面通过 getApp() 调用，不直接操作 Storage
const DEFAULT_EXPENSE = ["餐饮", "交通", "购物", "娱乐", "住房", "通讯", "医疗", "教育", "人情", "其他"];
const DEFAULT_INCOME = ["工资", "奖金", "兼职", "红包", "理财", "其他"];

let _counter = 0;

App({
  onLaunch() {
    // 初始化 Storage
    if (!wx.getStorageSync("records")) wx.setStorageSync("records", []);
    if (!wx.getStorageSync("categories_expense")) wx.setStorageSync("categories_expense", DEFAULT_EXPENSE);
    if (!wx.getStorageSync("categories_income")) wx.setStorageSync("categories_income", DEFAULT_INCOME);
  },

  // ---- 记录 CRUD ----
  getRecords() {
    return wx.getStorageSync("records") || [];
  },

  addRecord({ type, amount, category, note, date }) {
    const records = this.getRecords();
    const record = {
      id: Date.now() + "_" + ++_counter + "_" + Math.random().toString(36).slice(2, 8),
      type,
      amount: Number(amount),
      category,
      note: note || "",
      date,
      createTime: Date.now(),
    };
    records.unshift(record);
    wx.setStorageSync("records", records);
    return record;
  },

  updateRecord(id, data) {
    const records = this.getRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...data };
      wx.setStorageSync("records", records);
      return records[idx];
    }
    return null;
  },

  deleteRecord(id) {
    const records = this.getRecords().filter((r) => r.id !== id);
    wx.setStorageSync("records", records);
  },

  getRecordById(id) {
    return this.getRecords().find((r) => r.id === id) || null;
  },

  // ---- 查询 ----
  getRecordsByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return this.getRecords().filter((r) => r.date.startsWith(prefix));
  },

  getMonthSummary(year, month) {
    const records = this.getRecordsByMonth(year, month);
    let totalIncome = 0, totalExpense = 0;
    records.forEach((r) => {
      if (r.type === 1) totalIncome += r.amount;
      else totalExpense += r.amount;
    });
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, records };
  },

  getDailySummary(records) {
    const map = {};
    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = { date: r.date, income: 0, expense: 0, items: [] };
      if (r.type === 1) map[r.date].income += r.amount;
      else map[r.date].expense += r.amount;
      map[r.date].items.push(r);
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  },

  getCategorySummary(records) {
    const map = {};
    records.forEach((r) => {
      if (r.type === 0) {
        if (!map[r.category]) map[r.category] = { category: r.category, total: 0, count: 0 };
        map[r.category].total += r.amount;
        map[r.category].count += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  },

  // ---- 分类管理 ----
  getCategories(type) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    return wx.getStorageSync(key) || [];
  },

  addCategory(type, name) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    const cats = [...this.getCategories(type)];
    if (!cats.includes(name)) {
      cats.push(name);
      wx.setStorageSync(key, cats);
    }
    return cats;
  },

  deleteCategory(type, name) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    const cats = this.getCategories(type).filter((c) => c !== name);
    wx.setStorageSync(key, cats);
    return cats;
  },

  resetCategories(type) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    const defaults = type === 1 ? DEFAULT_INCOME : DEFAULT_EXPENSE;
    wx.setStorageSync(key, defaults);
    return defaults;
  },

  clearAllData() {
    wx.setStorageSync("records", []);
  },

  // ---- 分类图标映射 ----
  categoryIcons: {
    餐饮: "🍜", 交通: "🚗", 购物: "🛍️", 娱乐: "🎮",
    住房: "🏠", 通讯: "📱", 医疗: "🏥", 教育: "📚",
    人情: "🧧", 其他: "📦", 工资: "💰", 奖金: "🏆",
    兼职: "💼", 红包: "🧧", 理财: "📈",
  },

  // ---- 工具方法 ----
  formatAmount(amount) {
    return Number(amount).toFixed(2);
  },

  formatDateCN(dateStr) {
    const parts = dateStr.split("-");
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  },

  getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },

  getMonthDays(year, month) {
    return new Date(year, month, 0).getDate();
  },
});
