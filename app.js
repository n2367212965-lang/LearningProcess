App({
  onLaunch() {
    const records = wx.getStorageSync('records')
    const expenseCats = wx.getStorageSync('categories_expense')
    const incomeCats = wx.getStorageSync('categories_income')
    if (!records) wx.setStorageSync('records', [])
    if (!expenseCats) wx.setStorageSync('categories_expense', ['餐饮', '交通', '购物', '娱乐', '住房', '通讯', '医疗', '教育', '人情', '其他'])
    if (!incomeCats) wx.setStorageSync('categories_income', ['工资', '奖金', '兼职', '红包', '理财', '其他'])
  }
})
