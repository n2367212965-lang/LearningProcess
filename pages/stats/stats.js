const storage = require('../../utils/storage')
const { formatAmount, getMonthDays } = require('../../utils/util')

Page({
  data: {
    year: 0,
    month: 0,
    incomeStr: '0.00',
    expenseStr: '0.00',
    balanceStr: '0.00',
    balance: 0
  },

  onLoad() {
    const now = new Date()
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 })
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const { year, month } = this.data
    const summary = storage.getMonthSummary(year, month)
    this.setData({
      incomeStr: formatAmount(summary.totalIncome),
      expenseStr: formatAmount(summary.totalExpense),
      balanceStr: formatAmount(summary.balance),
      balance: summary.balance
    })
    this.drawBarChart(year, month)
    this.drawPieChart(summary.records)
  },

  prevMonth() {
    let { year, month } = this.data
    month--
    if (month < 1) { month = 12; year-- }
    this.setData({ year, month })
    this.refresh()
  },

  nextMonth() {
    let { year, month } = this.data
    month++
    if (month > 12) { month = 1; year++ }
    this.setData({ year, month })
    this.refresh()
  },

  drawBarChart(year, month) {
    const ctx = wx.createCanvasContext('barChart')
    const days = getMonthDays(year, month)
    const records = storage.getRecordsByMonth(year, month)
    const dailyMap = {}
    records.forEach(r => {
      const day = parseInt(r.date.split('-')[2])
      if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
      if (r.type === 1) dailyMap[day].income += r.amount
      else dailyMap[day].expense += r.amount
    })

    const width = 700
    const height = 400
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    let maxVal = 0
    for (let d = 1; d <= days; d++) {
      const data = dailyMap[d] || { expense: 0 }
      if (data.expense > maxVal) maxVal = data.expense
      if (data.income > maxVal) maxVal = data.income
    }
    maxVal = Math.max(maxVal * 1.2, 100)

    ctx.setFillStyle('#1a1a1a')
    ctx.fillRect(0, 0, width, height)

    // Y轴刻度
    ctx.setFontSize(18)
    ctx.setFillStyle('#6b7280')
    for (let i = 0; i <= 4; i++) {
      const val = (maxVal / 4) * i
      const y = padding.top + chartH * (1 - val / maxVal)
      ctx.fillText('¥' + Math.round(val), 4, y + 6)
      ctx.setStrokeStyle('#2a2a2a')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 柱状图
    for (let d = 1; d <= days; d++) {
      const data = dailyMap[d] || { expense: 0 }
      const x = padding.left + (d - 1) * (chartW / days) + 4
      const expenseH = (data.expense / maxVal) * chartH
      const incomeH = (data.income / maxVal) * chartH
      const baseY = padding.top + chartH

      // 支出柱（红色）
      if (data.expense > 0) {
        ctx.setFillStyle('#ef4444')
        ctx.fillRect(x, baseY - expenseH, 10, expenseH)
      }

      // 收入柱（金色）
      if (data.income > 0) {
        ctx.setFillStyle('#f59e0b')
        ctx.fillRect(x + 12, baseY - incomeH, 6, incomeH)
      }

      // 日期标签（每5天显示）
      if (d % 5 === 0 || d === 1 || d === days) {
        ctx.setFontSize(16)
        ctx.setFillStyle('#6b7280')
        ctx.fillText(String(d), x, baseY + 24)
      }
    }

    ctx.draw()
  },

  drawPieChart(records) {
    const ctx = wx.createCanvasContext('pieChart')
    const categoryData = storage.getCategorySummary(records)
    const total = categoryData.reduce((s, c) => s + c.total, 0)

    const width = 700
    const height = 400
    const cx = 180
    const cy = 200
    const radius = 140

    ctx.setFillStyle('#1a1a1a')
    ctx.fillRect(0, 0, width, height)

    if (total === 0) {
      ctx.setFontSize(24)
      ctx.setFillStyle('#6b7280')
      ctx.setTextAlign('center')
      ctx.fillText('暂无支出数据', cx, cy + 8)
      ctx.draw()
      return
    }

    const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']
    let startAngle = -Math.PI / 2

    // 最多显示8个分类，其余归入"其他"
    const slices = categoryData.slice(0, 8)
    if (categoryData.length > 8) {
      const otherTotal = categoryData.slice(8).reduce((s, c) => s + c.total, 0)
      slices.push({ category: '其他', total: otherTotal })
    }

    slices.forEach((slice, i) => {
      const angle = (slice.total / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle)
      ctx.closePath()
      ctx.setFillStyle(colors[i % colors.length])
      ctx.fill()
      startAngle += angle
    })

    // 图例
    let legendY = 40
    slices.forEach((slice, i) => {
      const pct = ((slice.total / total) * 100).toFixed(1)
      ctx.setFillStyle(colors[i % colors.length])
      ctx.fillRect(380, legendY, 24, 24)
      ctx.setFontSize(22)
      ctx.setFillStyle('#ffffff')
      ctx.fillText(`${slice.category} ¥${formatAmount(slice.total)} (${pct}%)`, 416, legendY + 20)
      legendY += 40
    })

    ctx.draw()
  }
})
