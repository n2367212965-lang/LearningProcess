function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateCN(dateStr) {
  const parts = dateStr.split('-')
  return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
}

function formatAmount(amount) {
  return Number(amount).toFixed(2)
}

function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate()
}

function generateId() {
  return Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

function getToday() {
  return formatDate(new Date())
}

module.exports = {
  formatDate, formatDateCN, formatAmount,
  getMonthDays, generateId, getToday
}
