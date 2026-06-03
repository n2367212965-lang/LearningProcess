const storage = require('../../utils/storage')
const { getToday } = require('../../utils/util')

Page({
  data: {
    type: 0,
    amount: '',
    selectedCategory: '',
    date: getToday(),
    note: '',
    categories: [],
    categoryIcons: {
      '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
      '住房': '🏠', '通讯': '📱', '医疗': '🏥', '教育': '📚',
      '人情': '🧧', '其他': '📦',
      '工资': '💰', '奖金': '🏆', '兼职': '💼', '红包': '🧧',
      '理财': '📈'
    }
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    this.loadCategories()
  },

  loadCategories() {
    const categories = storage.getCategories(this.data.type)
    this.setData({ categories, selectedCategory: '' })
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    this.setData({ type, selectedCategory: '', amount: '' }, () => {
      this.loadCategories()
    })
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  selectCategory(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.category })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  onSave() {
    const { type, amount, selectedCategory, date, note } = this.data
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' })
      return
    }
    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }
    storage.addRecord({ type, amount: parseFloat(amount), category: selectedCategory, note, date })
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.setData({ amount: '', selectedCategory: '', note: '' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' })
    }, 500)
  }
})
