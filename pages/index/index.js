const app = getApp()

Page({
  data: {
    frames: [
      { url: '/static/image/frame/guoqing/1.png' },
      { url: '/static/image/frame/guoqing/2.png' },
      { url: '/static/image/frame/guoqing/3.png' },
      { url: '/static/image/frame/guoqing/4.png' }
    ],
    gradientFrames: [
      { url: '/static/image/frame/guoqing/1.png' },
      { url: '/static/image/frame/guoqing/2.png' }
    ],
    simpleFrames: [
      { url: '/static/image/frame/guoqing/3.png' },
      { url: '/static/image/frame/guoqing/4.png' }
    ],
    otherFrames: [
      { url: '/static/image/frame/guoqing/5.png' },
      { url: '/static/image/frame/guoqing/6.png' }
    ],
    selectedFrameIndex: 0,
    selectedFrame: '/static/image/frame/guoqing/1.png',
    avatarUrl: '',
    currentTab: 0,
    currentFrames: [],
    tabs: ['2025新款', '渐变国旗', '清爽国旗', '其他']
  },

  onLoad() {
    // 页面加载时初始化相框数据
    this.setData({
      currentFrames: this.data.frames,
      selectedFrame: this.data.frames[0].url
    });

    // 确保数据加载完成后异步更新预览图
    setTimeout(() => {
      this.updatePreviewFrame();
    }, 100);
  },

  // 更新预览区相框
  updatePreviewFrame() {
    const selectedFrame = this.data.currentFrames[this.data.selectedFrameIndex].url;
    if (selectedFrame) {
      // 创建预览区动画
      const previewAnimation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-out',
      });
      
      // 先淡出缩小
      previewAnimation.opacity(0.6).scale(0.95).step();
      // 再恢复并淡入
      previewAnimation.opacity(1).scale(1).step();
      
      this.setData({
        selectedFrame: selectedFrame,
        previewAnimation: previewAnimation.export()
      });
    }
  },

  // 选择头像框
  selectFrame(e) {
    const index = e.currentTarget.dataset.index;
    
    // 添加动画效果
    if (index !== this.data.selectedFrameIndex) {
      // 创建动画实例
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease',
      });
      
      // 缩放动画
      animation.scale(1.1).step();
      animation.scale(1.0).step();
      
      this.setData({
        selectedFrameIndex: index,
        animationData: animation.export(),
        selectedFrame: this.data.currentFrames[index].url
      });
      
      // 更新预览区显示的相框
      this.updatePreviewFrame();
    }
    
    app.globalData.selectedFrame = this.data.currentFrames[index].url;
  },

  // 切换标签页
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    
    // 如果点击当前已选中标签，不做任何操作
    if (index === this.data.currentTab) {
      return;
    }
    
    let frames = [];
    
    // 根据选中的标签更新相框列表
    switch(index) {
      case 0:
        frames = this.data.frames;
        break;
      case 1:
        frames = this.data.gradientFrames;
        break;
      case 2:
        frames = this.data.simpleFrames;
        break;
      case 3:
        frames = this.data.otherFrames;
        break;
      default:
        frames = this.data.frames;
    }
    
    if (frames.length === 0) {
      frames = this.data.frames;
    }
    
    // 创建列表过渡动画
    const listAnimation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    
    // 先淡出
    listAnimation.opacity(0).translateX(15).step();
    
    this.setData({
      currentTab: index,
      framesAnimation: listAnimation.export()
    });
    
    // 延时切换数据并淡入
    setTimeout(() => {
      listAnimation.opacity(1).translateX(0).step();
      
      this.setData({
        currentFrames: frames,
        selectedFrameIndex: 0,
        framesAnimation: listAnimation.export()
      });
      
      // 更新预览区相框
      this.updatePreviewFrame();
      
      app.globalData.selectedFrame = frames.length > 0 ? frames[0].url : this.data.frames[0].url;
    }, 250);
  },

  // 获取头像
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      camera: 'back',
      success: (res) => {
        app.globalData.tempAvatarUrl = res.tempFiles[0].tempFilePath;
        app.globalData.selectedFrame = this.data.selectedFrame;
        
        // 跳转到编辑页面
        wx.navigateTo({
          url: '/pages/editor/editor'
        });
      }
    });
  },

  // 拍照获取头像
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'front',
      success: (res) => {
        app.globalData.tempAvatarUrl = res.tempFiles[0].tempFilePath;
        app.globalData.selectedFrame = this.data.selectedFrame;
        
        // 跳转到编辑页面
        wx.navigateTo({
          url: '/pages/editor/editor'
        });
      }
    });
  },

  // 直接保存当前头像框（不带用户头像）
  saveAvatar() {
    wx.showLoading({
      title: '正在保存',
    });

    // 下载图片到本地
    wx.getImageInfo({
      src: this.data.selectedFrame,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.path,
          success: () => {
            wx.hideLoading();
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            wx.hideLoading();
            wx.showModal({
              title: '保存失败',
              content: '请检查是否授权相册权限',
              showCancel: false
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  // 用户分享小程序
  onShareAppMessage() {
    return {
      title: '迎国庆换头像，为祖国华诞添彩！',
      path: '/pages/index/index',
      imageUrl: '/static/image/share_img.png'
    }
  }
}) 