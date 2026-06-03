const app = getApp();

Page({
  data: {
    expenseCategories: [],
    incomeCategories: [],
    categoryIcons: {},
    showAddModal: false,
    addType: 0,
    newCategory: "",
  },

  onShow() {
    this.setData({
      expenseCategories: app.getCategories(0),
      incomeCategories: app.getCategories(1),
      categoryIcons: app.categoryIcons,
    });
  },

  showAddExpense() {
    this.setData({ showAddModal: true, addType: 0, newCategory: "" });
  },

  showAddIncome() {
    this.setData({ showAddModal: true, addType: 1, newCategory: "" });
  },

  onModalInput(e) {
    this.setData({ newCategory: e.detail.value });
  },

  onModalConfirm() {
    const { addType, newCategory } = this.data;
    if (!newCategory.trim()) {
      wx.showToast({ title: "请输入分类名", icon: "none" });
      return;
    }
    const cats = app.addCategory(addType, newCategory.trim());
    const key = addType === 1 ? "incomeCategories" : "expenseCategories";
    this.setData({ [key]: cats, showAddModal: false, newCategory: "" });
    wx.showToast({ title: "添加成功", icon: "success" });
  },

  onModalCancel() {
    this.setData({ showAddModal: false, newCategory: "" });
  },

  onDeleteCategory(e) {
    const { type, name } = e.currentTarget.dataset;
    wx.showModal({
      title: "删除分类",
      content: `确定删除「${name}」吗？`,
      confirmColor: "#e8725c",
      success: (res) => {
        if (res.confirm) {
          const cats = app.deleteCategory(type, name);
          const key = type === 1 ? "incomeCategories" : "expenseCategories";
          this.setData({ [key]: cats });
        }
      },
    });
  },

  onResetCategories(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    const label = type === 1 ? "收入" : "支出";
    wx.showModal({
      title: "重置分类",
      content: `确定将${label}分类恢复为默认吗？`,
      confirmColor: "#e8725c",
      success: (res) => {
        if (res.confirm) {
          const cats = app.resetCategories(type);
          const key = type === 1 ? "incomeCategories" : "expenseCategories";
          this.setData({ [key]: cats });
          wx.showToast({ title: "已重置", icon: "success" });
        }
      },
    });
  },

  onClearData() {
    wx.showModal({
      title: "清除所有数据",
      content: "此操作不可恢复，确定清除全部账单记录吗？",
      confirmColor: "#e8725c",
      success: (res) => {
        if (res.confirm) {
          app.clearAllData();
          wx.showToast({ title: "已清除", icon: "success" });
        }
      },
    });
  },
});
