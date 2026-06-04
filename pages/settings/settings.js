const app = getApp();

Page({
  data: {
    expenseCategories: [],
    incomeCategories: [],
    categoryIcons: {},
    showAddModal: false,
    addType: 0,
    newCategory: "",
    // 预算
    budgets: { expense: {}, income: {} },
    showBudgetModal: false,
    budgetType: 0,
    budgetCategory: "",
    budgetAmount: "",
  },

  onShow() {
    this.setData({
      expenseCategories: app.getCategories(0),
      incomeCategories: app.getCategories(1),
      categoryIcons: app.categoryIcons,
      budgets: app.getBudgets(),
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

  preventBubble() {
    // 空方法，仅用于 catchtap 阻止事件冒泡到 modal-mask
  },

  onDeleteCategory(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    const name = e.currentTarget.dataset.name;
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
      content:
        "此操作不可恢复，确定清除全部账单记录吗？建议先「导出到剪贴板」备份。",
      confirmColor: "#e8725c",
      success: (res) => {
        if (res.confirm) {
          app.clearAllData();
          wx.showToast({ title: "已清除", icon: "success" });
        }
      },
    });
  },

  // ---- 预算 ----
  showSetBudget(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    const category = e.currentTarget.dataset.category;
    const cur = app.getBudget(type, category);
    this.setData({
      showBudgetModal: true,
      budgetType: type,
      budgetCategory: category,
      budgetAmount: cur > 0 ? String(cur) : "",
    });
  },

  onBudgetAmountInput(e) {
    this.setData({ budgetAmount: e.detail.value });
  },

  onBudgetSave() {
    const { budgetType, budgetCategory, budgetAmount } = this.data;
    const num = parseFloat(budgetAmount);
    if (!budgetCategory) return;
    if (isNaN(num) || num < 0) {
      wx.showToast({ title: "请输入有效金额", icon: "none" });
      return;
    }
    app.setBudget(budgetType, budgetCategory, num);
    this.setData({
      showBudgetModal: false,
      budgetCategory: "",
      budgetAmount: "",
      budgets: app.getBudgets(),
    });
    wx.showToast({ title: num > 0 ? "已保存" : "已清除", icon: "success" });
  },

  onBudgetCancel() {
    this.setData({
      showBudgetModal: false,
      budgetCategory: "",
      budgetAmount: "",
    });
  },

  // ---- 数据备份 ----
  onExport() {
    const data = app.exportData();
    const json = JSON.stringify(data, null, 2);
    const sysInfo = wx.getSystemInfoSync();
    wx.setClipboardData({
      data: json,
      success: () => {
        wx.showModal({
          title: "已复制到剪贴板",
          content: `共 ${data.records.length} 条记录，JSON 已复制。\n请粘贴到文件、聊天或邮件中保存。\n（当前 ${sysInfo.platform}）`,
          showCancel: false,
        });
      },
      fail: () => {
        wx.showToast({ title: "复制失败", icon: "none" });
      },
    });
  },

  onImport() {
    wx.showModal({
      title: "导入数据",
      content:
        "将读取剪贴板内容并解析为 JSON。\n\n请先复制之前导出的 JSON 到剪贴板。",
      success: (res) => {
        if (!res.confirm) return;
        wx.getClipboardData({
          success: (clip) => {
            let json;
            try {
              json = JSON.parse(clip.data);
            } catch (e) {
              wx.showToast({ title: "剪贴板内容不是有效 JSON", icon: "none" });
              return;
            }
            if (!Array.isArray(json.records)) {
              wx.showToast({ title: "JSON 缺少 records 字段", icon: "none" });
              return;
            }
            wx.showActionSheet({
              itemList: ["合并到现有数据", "替换现有数据"],
              success: (act) => {
                const mode = act.tapIndex === 0 ? "merge" : "replace";
                const r = app.importData(json, mode);
                this.setData({ budgets: app.getBudgets() });
                wx.showToast({
                  title: `新增 ${r.added}，跳过 ${r.skipped}`,
                  icon: "success",
                });
              },
            });
          },
        });
      },
    });
  },
});
