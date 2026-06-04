// utils/calc.js — 纯函数层，不依赖 wx / Storage，Node 可测
// 所有日期格式约定为 "YYYY-MM-DD"

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

function formatDateCN(dateStr) {
  const parts = dateStr.split("-");
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate();
}

// ---- 过滤 ----
function getRecordsByMonth(records, year, month) {
  const prefix = `${year}-${pad2(month)}`;
  return records.filter((r) => r.date.startsWith(prefix));
}

function getRecordsByYear(records, year) {
  const prefix = `${year}-`;
  return records.filter((r) => r.date.startsWith(prefix));
}

// ---- 汇总 ----
function summarize(records) {
  let totalIncome = 0,
    totalExpense = 0;
  records.forEach((r) => {
    if (r.type === 1) totalIncome += r.amount;
    else totalExpense += r.amount;
  });
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

function getMonthSummary(records, year, month) {
  const monthly = getRecordsByMonth(records, year, month);
  return { ...summarize(monthly), records: monthly };
}

function getYearSummary(records, year) {
  const yearly = getRecordsByYear(records, year);
  return { ...summarize(yearly), records: yearly };
}

function getDailySummary(records) {
  const map = {};
  records.forEach((r) => {
    if (!map[r.date])
      map[r.date] = { date: r.date, income: 0, expense: 0, items: [] };
    if (r.type === 1) map[r.date].income += r.amount;
    else map[r.date].expense += r.amount;
    map[r.date].items.push(r);
  });
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

function getCategorySummary(records) {
  const map = {};
  records.forEach((r) => {
    if (r.type === 0) {
      if (!map[r.category])
        map[r.category] = { category: r.category, total: 0, count: 0 };
      map[r.category].total += r.amount;
      map[r.category].count += 1;
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// ---- 储蓄率 / KPI / 趋势 ----
function calcSavingRate(income, expense) {
  income = Number(income) || 0;
  expense = Number(expense) || 0;
  if (income <= 0) return { rate: 0, class: expense > 0 ? "bad" : "good" };
  const rate = ((income - expense) / income) * 100;
  let cls = "good";
  if (rate < 0) cls = "bad";
  else if (rate < 20) cls = "warn";
  return { rate, class: cls };
}

function calcTrendBars(trend) {
  const max = Math.max(
    ...trend.map((t) => (t.income || 0) + (t.expense || 0)),
    1,
  );
  return trend.map((t) => {
    const total = (t.income || 0) + (t.expense || 0);
    return {
      income: t.income,
      expense: t.expense,
      barHeight: total > 0 ? Math.max((total / max) * 100, 4) : 0,
    };
  });
}

function calcKpiState(summary, prevSummary, hidden) {
  const { rate, class: cls } = calcSavingRate(
    summary.totalIncome,
    summary.totalExpense,
  );
  let momChange = 0,
    momArrow = "—",
    momClass = "flat";
  if (!hidden) {
    const prevExp = (prevSummary && prevSummary.totalExpense) || 0;
    if (prevExp > 0) {
      momChange = ((summary.totalExpense - prevExp) / prevExp) * 100;
      if (momChange > 0.5) {
        momArrow = "▲";
        momClass = "up";
      } else if (momChange < -0.5) {
        momArrow = "▼";
        momClass = "down";
      }
    } else if (summary.totalExpense > 0) {
      momArrow = "▲";
      momClass = "up";
    }
  }
  return {
    savingRate: Math.round(rate),
    savingRateClass: cls,
    momChange: hidden ? "—" : Math.abs(momChange).toFixed(1),
    momArrow,
    momClass,
    momHidden: !!hidden,
  };
}

function getMonthTrend(records, count, refYear, refMonth) {
  count = count || 6;
  refYear = refYear || new Date().getFullYear();
  refMonth = refMonth || new Date().getMonth() + 1;
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    let y = refYear,
      m = refMonth - i;
    while (m < 1) {
      m += 12;
      y--;
    }
    const summary = getMonthSummary(records, y, m);
    result.push({
      label: `${m}月`,
      year: y,
      month: m,
      income: summary.totalIncome,
      expense: summary.totalExpense,
    });
  }
  return result;
}

// ---- 预算 ----
/**
 * 计算分类预算状态
 * @param {string} category 分类名
 * @param {number} spent 已花
 * @param {number} budget 预算（0/缺省=未设预算）
 * @returns {{pct: number, status: 'none'|'ok'|'warn'|'over'}}
 */
function calcBudgetStatus(category, spent, budget) {
  if (!budget || budget <= 0) return { pct: 0, status: "none" };
  const pct = (spent / budget) * 100;
  if (pct >= 100) return { pct, status: "over" };
  if (pct >= 80) return { pct, status: "warn" };
  return { pct, status: "ok" };
}

// ---- 迁移辅助 ----
/**
 * 把 defaults 中不存在的项追加到 existing 末尾，保序去重。
 * 用于 App 升级时给老用户补齐新默认分类。
 * @template T
 * @param {T[]} existing 用户已有的分类
 * @param {T[]} defaults 默认分类
 * @returns {T[]}
 */
function mergeDefaults(existing, defaults) {
  const set = new Set(existing);
  const out = existing.slice();
  defaults.forEach((d) => {
    if (!set.has(d)) {
      out.push(d);
      set.add(d);
    }
  });
  return out;
}

module.exports = {
  pad2,
  formatAmount,
  formatDateCN,
  getToday,
  getMonthDays,
  getRecordsByMonth,
  getRecordsByYear,
  summarize,
  getMonthSummary,
  getYearSummary,
  getDailySummary,
  getCategorySummary,
  calcSavingRate,
  calcTrendBars,
  calcKpiState,
  getMonthTrend,
  calcBudgetStatus,
  mergeDefaults,
};
