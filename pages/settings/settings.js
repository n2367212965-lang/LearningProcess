const storage = require('../../utils/storage')

Page({
  data: {
    expenseCategories: [],
    incomeCategories: []
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    this.loadCategories()
  },

  loadCategories() {
    this.setData({
      expenseCategories: storage.getCategories(0),
      incomeCategories: storage.getCategories(1)
    })
  },

  onAddExpense() {
    this.showAddDialog(0)
  },

  onAddIncome() {
    this.showAddDialog(1)
  },

  showAddDialog(type) {
    const that = this
    wx.showModal({
      title: '新增分类',
      editable: true,
      placeholderText: '输入分类名称',
      success(res) {
        if (res.confirm && res.content.trim()) {
          if (type === 0) {
            storage.addCategory(0, res.content.trim())
          } else {
            storage.addCategory(1, res.content.trim())
          }
          that.loadCategories()
          wx.showToast({ title: '添加成功', icon: 'success' })
        }
      }
    })
  },

  onDeleteCategory(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    const name = e.currentTarget.dataset.name
    const that = this
    wx.showModal({
      title: '删除分类',
      content: `确定删除「${name}」吗？已有该分类的记录仍会保留。`,
      success(res) {
        if (res.confirm) {
          storage.deleteCategory(type, name)
          that.loadCategories()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onResetExpense() {
    const that = this
    wx.showModal({
      title: '重置分类',
      content: '重置为默认分类，将删除所有自定义支出分类？',
      success(res) {
        if (res.confirm) {
          storage.resetCategories(0)
          that.loadCategories()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  onResetIncome() {
    const that = this
    wx.showModal({
      title: '重置分类',
      content: '重置为默认分类，将删除所有自定义收入分类？',
      success(res) {
        if (res.confirm) {
          storage.resetCategories(1)
          that.loadCategories()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  onClearData() {
    const that = this
    wx.showModal({
      title: '清除数据',
      content: '确定清除所有账单数据吗？此操作不可恢复！',
      success(res) {
        if (res.confirm) {
          storage.saveRecords([])
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }
})
