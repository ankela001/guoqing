// pages/preview/preview.js
Page({
  data: {
    avatarUrl: '' // 生成的头像URL
  },

  onLoad(options) {
    // 获取传递的头像URL参数
    if (options.avatar) {
      this.setData({
        avatarUrl: options.avatar
      });
    }
  },

  // 返回首页
  goBack() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 用户分享
  onShareAppMessage() {
    return {
      title: '我用"迎国庆换头像"做了一个国庆头像，你也来试试吧！',
      path: '/pages/index/index',
      imageUrl: this.data.avatarUrl || '/static/image/share_img.png'
    }
  }
}) 