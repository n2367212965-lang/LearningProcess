// app.js — 存储层（无 UI 依赖），所有计算委托给 utils/calc.js
const calc = require("./utils/calc.js");

// 支出 18 个常用分类（含日用、宠物、健身、旅行、数码、烟酒、服饰等日常场景）
const DEFAULT_EXPENSE = [
  "餐饮",
  "交通",
  "购物",
  "娱乐",
  "住房",
  "通讯",
  "医疗",
  "教育",
  "人情",
  "宠物",
  "美容",
  "健身",
  "旅行",
  "服饰",
  "数码",
  "烟酒",
  "日用",
  "其他",
];
// 收入 10 个常见来源
const DEFAULT_INCOME = [
  "工资",
  "奖金",
  "兼职",
  "红包",
  "理财",
  "报销",
  "利息",
  "退费",
  "投资收益",
  "其他",
];

// ---- 内存缓存（写时失效） ----
let _records = null; // null = 未加载
let _catsExp = null;
let _catsInc = null;
let _budgets = null;

function _loadRecords() {
  if (_records === null) _records = wx.getStorageSync("records") || [];
  return _records;
}
function _saveRecords(arr) {
  _records = arr;
  wx.setStorageSync("records", arr);
}
function _loadCatsExp() {
  if (_catsExp === null)
    _catsExp = wx.getStorageSync("categories_expense") || DEFAULT_EXPENSE;
  return _catsExp;
}
function _loadCatsInc() {
  if (_catsInc === null)
    _catsInc = wx.getStorageSync("categories_income") || DEFAULT_INCOME;
  return _catsInc;
}
function _loadBudgets() {
  if (_budgets === null)
    _budgets = wx.getStorageSync("budgets") || { expense: {}, income: {} };
  return _budgets;
}

App({
  onLaunch() {
    // 初始化 Storage
    if (!wx.getStorageSync("records")) wx.setStorageSync("records", []);
    if (!wx.getStorageSync("categories_expense"))
      wx.setStorageSync("categories_expense", DEFAULT_EXPENSE);
    if (!wx.getStorageSync("categories_income"))
      wx.setStorageSync("categories_income", DEFAULT_INCOME);
    if (!wx.getStorageSync("budgets"))
      wx.setStorageSync("budgets", { expense: {}, income: {} });

    // 一次性迁移: 老用户 storage 中已有旧分类，把新增的默认项追加到末尾（去重保序）
    const oldExp = wx.getStorageSync("categories_expense") || [];
    const oldInc = wx.getStorageSync("categories_income") || [];
    const mergedExp = calc.mergeDefaults(oldExp, DEFAULT_EXPENSE);
    const mergedInc = calc.mergeDefaults(oldInc, DEFAULT_INCOME);
    if (mergedExp.length !== oldExp.length)
      wx.setStorageSync("categories_expense", mergedExp);
    if (mergedInc.length !== oldInc.length)
      wx.setStorageSync("categories_income", mergedInc);

    // 触发缓存预热
    _loadRecords();
    _loadCatsExp();
    _loadCatsInc();
    _loadBudgets();
  },

  // ---- 记录 CRUD ----
  getRecords() {
    return _loadRecords().slice();
  },

  addRecord({ type, amount, category, note, date }) {
    const record = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      type,
      amount: Number(amount),
      category,
      note: note || "",
      date,
      createTime: Date.now(),
    };
    const arr = _loadRecords();
    arr.unshift(record);
    _saveRecords(arr);
    return record;
  },

  updateRecord(id, data) {
    const arr = _loadRecords();
    const idx = arr.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    _saveRecords(arr);
    return arr[idx];
  },

  deleteRecord(id) {
    _saveRecords(_loadRecords().filter((r) => r.id !== id));
  },

  getRecordById(id) {
    return _loadRecords().find((r) => r.id === id) || null;
  },

  // ---- 查询（委托 calc）----
  getRecordsByMonth(year, month) {
    return calc.getRecordsByMonth(_loadRecords(), year, month);
  },
  getRecordsByYear(year) {
    return calc.getRecordsByYear(_loadRecords(), year);
  },
  getMonthSummary(year, month) {
    return calc.getMonthSummary(_loadRecords(), year, month);
  },
  getYearSummary(year) {
    return calc.getYearSummary(_loadRecords(), year);
  },
  getDailySummary(records) {
    return calc.getDailySummary(records);
  },
  getCategorySummary(records) {
    return calc.getCategorySummary(records);
  },
  getMonthTrend(count, refYear, refMonth) {
    return calc.getMonthTrend(_loadRecords(), count, refYear, refMonth);
  },
  calcSavingRate(income, expense) {
    return calc.calcSavingRate(income, expense);
  },
  calcTrendBars(trend) {
    return calc.calcTrendBars(trend);
  },
  calcKpiState(summary, prevSummary, hidden) {
    return calc.calcKpiState(summary, prevSummary, hidden);
  },
  calcBudgetStatus(category, spent, budget) {
    return calc.calcBudgetStatus(category, spent, budget);
  },

  // ---- 分类管理 ----
  getCategories(type) {
    return (type === 1 ? _loadCatsInc() : _loadCatsExp()).slice();
  },
  addCategory(type, name) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    const cached = type === 1 ? _loadCatsInc() : _loadCatsExp();
    if (!cached.includes(name)) {
      cached.push(name);
      wx.setStorageSync(key, cached);
    }
    return cached.slice();
  },
  deleteCategory(type, name) {
    const key = type === 1 ? "categories_income" : "categories_expense";
    const arr = (type === 1 ? _loadCatsInc() : _loadCatsExp()).filter(
      (c) => c !== name,
    );
    wx.setStorageSync(key, arr);
    if (type === 1) _catsInc = arr;
    else _catsExp = arr;
    return arr.slice();
  },
  resetCategories(type) {
    const defaults = type === 1 ? DEFAULT_INCOME : DEFAULT_EXPENSE;
    const key = type === 1 ? "categories_income" : "categories_expense";
    wx.setStorageSync(key, defaults);
    if (type === 1) _catsInc = defaults;
    else _catsExp = defaults;
    return defaults.slice();
  },

  // ---- 预算管理 ----
  getBudgets() {
    return JSON.parse(JSON.stringify(_loadBudgets()));
  },
  getBudget(type, category) {
    const b = _loadBudgets();
    const key = type === 1 ? "income" : "expense";
    return (b[key] && b[key][category]) || 0;
  },
  setBudget(type, category, amount) {
    const b = _loadBudgets();
    const key = type === 1 ? "income" : "expense";
    if (!b[key]) b[key] = {};
    if (amount <= 0) delete b[key][category];
    else b[key][category] = Number(amount);
    wx.setStorageSync("budgets", b);
    return b;
  },
  getCategorySpent(type, category, year, month) {
    const rs = calc
      .getRecordsByMonth(_loadRecords(), year, month)
      .filter((r) => r.type === type && r.category === category);
    return rs.reduce((s, r) => s + r.amount, 0);
  },

  // ---- 跨页通讯：暂存待编辑记录的 id（add 是 tabBar 页面，switchTab 不触发 onLoad）----
  // 用 app 实例属性做一次性暂存：setEditingId 设值，consumeEditingId 读取并清空。
  // 任何路径进入 add 页 onShow 都会消费；保存或返回后下次 onShow 不会重放。
  _pendingEditId: null,
  setEditingId(id) {
    this._pendingEditId = id || null;
  },
  consumeEditingId() {
    const id = this._pendingEditId;
    this._pendingEditId = null;
    return id;
  },

  // ---- 导出 / 导入 ----
  exportData() {
    return {
      version: 1,
      exportTime: new Date().toISOString(),
      records: _loadRecords(),
      categories_expense: _loadCatsExp(),
      categories_income: _loadCatsInc(),
      budgets: _loadBudgets(),
    };
  },

  /**
   * 导入数据。模式：
   *   "merge"  : 记录按 id 去重追加；分类并集；预算取较大值
   *   "replace": 全部覆盖（调用前应确认）
   * @returns {{added: number, skipped: number, mode: string}}
   */
  importData(json, mode) {
    if (!json || !Array.isArray(json.records)) {
      throw new Error("invalid import data");
    }
    mode = mode || "merge";
    if (mode === "replace") {
      _saveRecords(json.records);
      wx.setStorageSync(
        "categories_expense",
        json.categories_expense || DEFAULT_EXPENSE,
      );
      wx.setStorageSync(
        "categories_income",
        json.categories_income || DEFAULT_INCOME,
      );
      wx.setStorageSync("budgets", json.budgets || { expense: {}, income: {} });
      _catsExp = null;
      _catsInc = null;
      _budgets = null;
      return { added: json.records.length, skipped: 0, mode };
    }
    // merge
    const existing = _loadRecords();
    const ids = new Set(existing.map((r) => r.id));
    let added = 0,
      skipped = 0;
    json.records.forEach((r) => {
      if (ids.has(r.id)) {
        skipped++;
        return;
      }
      existing.push(r);
      ids.add(r.id);
      added++;
    });
    // 按 createTime 降序
    existing.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    _saveRecords(existing);

    // 分类并集
    const mergeCats = (cur, incoming) => {
      const set = new Set(cur);
      (incoming || []).forEach((c) => set.add(c));
      return Array.from(set);
    };
    const exp = mergeCats(_loadCatsExp(), json.categories_expense);
    const inc = mergeCats(_loadCatsInc(), json.categories_income);
    wx.setStorageSync("categories_expense", exp);
    wx.setStorageSync("categories_income", inc);
    _catsExp = exp;
    _catsInc = inc;

    // 预算取较大值
    const cur = _loadBudgets();
    const incB = json.budgets || { expense: {}, income: {} };
    ["expense", "income"].forEach((k) => {
      cur[k] = cur[k] || {};
      Object.keys(incB[k] || {}).forEach((cat) => {
        const v = Number(incB[k][cat]) || 0;
        if (v > (cur[k][cat] || 0)) cur[k][cat] = v;
      });
    });
    wx.setStorageSync("budgets", cur);
    _budgets = cur;

    return { added, skipped, mode };
  },

  clearAllData() {
    _saveRecords([]);
  },

  // ---- 分类图标映射 ----
  categoryIcons: {
    // 支出
    餐饮: "🍜",
    交通: "🚗",
    购物: "🛍️",
    娱乐: "🎮",
    住房: "🏠",
    通讯: "📱",
    医疗: "🏥",
    教育: "📚",
    人情: "🧧",
    宠物: "🐾",
    美容: "💄",
    健身: "🏋️",
    旅行: "✈️",
    服饰: "👕",
    数码: "💻",
    烟酒: "🍷",
    日用: "🧴",
    // 收入
    工资: "💰",
    奖金: "🏆",
    兼职: "💼",
    红包: "🧧",
    理财: "📈",
    报销: "🧾",
    利息: "🏦",
    退费: "↩️",
    投资收益: "📊",
    // 通用
    其他: "📦",
  },

  // ---- 工具方法（委托 calc）----
  formatAmount(amount) {
    return calc.formatAmount(amount);
  },
  formatDateCN(dateStr) {
    return calc.formatDateCN(dateStr);
  },
  getToday() {
    return calc.getToday();
  },
  getMonthDays(year, month) {
    return calc.getMonthDays(year, month);
  },
});
