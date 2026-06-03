const { generateId } = require('./util')

function getRecords() {
  return wx.getStorageSync('records') || []
}

function saveRecords(records) {
  wx.setStorageSync('records', records)
}

function addRecord({ type, amount, category, note, date }) {
  const records = getRecords()
  const record = {
    id: generateId(),
    type,
    amount: Number(amount),
    category,
    note: note || '',
    date,
    createTime: Date.now()
  }
  records.unshift(record)
  saveRecords(records)
  return record
}

function deleteRecord(id) {
  let records = getRecords()
  records = records.filter(r => r.id !== id)
  saveRecords(records)
}

function getRecordsByDate(date) {
  return getRecords().filter(r => r.date === date)
}

function getRecordsByMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return getRecords().filter(r => r.date.startsWith(prefix))
}

function getMonthSummary(year, month) {
  const records = getRecordsByMonth(year, month)
  let totalIncome = 0, totalExpense = 0
  records.forEach(r => {
    if (r.type === 1) totalIncome += r.amount
    else totalExpense += r.amount
  })
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense, records }
}

function getDailySummary(records) {
  const map = {}
  records.forEach(r => {
    if (!map[r.date]) map[r.date] = { date: r.date, income: 0, expense: 0, items: [] }
    if (r.type === 1) map[r.date].income += r.amount
    else map[r.date].expense += r.amount
    map[r.date].items.push(r)
  })
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

function getCategorySummary(records) {
  const map = {}
  records.forEach(r => {
    if (r.type === 0) {
      if (!map[r.category]) map[r.category] = { category: r.category, total: 0 }
      map[r.category].total += r.amount
    }
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

function getCategories(type) {
  const key = type === 1 ? 'categories_income' : 'categories_expense'
  return wx.getStorageSync(key) || []
}

function saveCategories(type, categories) {
  const key = type === 1 ? 'categories_income' : 'categories_expense'
  wx.setStorageSync(key, categories)
}

function addCategory(type, name) {
  const categories = getCategories(type)
  if (!categories.includes(name)) {
    categories.push(name)
    saveCategories(type, categories)
  }
  return categories
}

function deleteCategory(type, name) {
  let categories = getCategories(type)
  categories = categories.filter(c => c !== name)
  saveCategories(type, categories)
  return categories
}

function resetCategories(type) {
  const defaults = type === 1
    ? ['工资', '奖金', '兼职', '红包', '理财', '其他']
    : ['餐饮', '交通', '购物', '娱乐', '住房', '通讯', '医疗', '教育', '人情', '其他']
  saveCategories(type, defaults)
  return defaults
}

module.exports = {
  getRecords, saveRecords, addRecord, deleteRecord,
  getRecordsByDate, getRecordsByMonth,
  getMonthSummary, getDailySummary, getCategorySummary,
  getCategories, saveCategories, addCategory, deleteCategory, resetCategories
}
