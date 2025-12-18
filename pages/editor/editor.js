const app = getApp();

Page({
  data: {
    avatarUrl: '', // 用户头像URL
    frameUrl: '', // 头像框URL
    frames: [
      { url: '/static/image/frame/guoqing/1.png' },
      { url: '/static/image/frame/guoqing/2.png' },
      { url: '/static/image/frame/guoqing/3.png' },
      { url: '/static/image/frame/guoqing/4.png' },
      { url: '/static/image/frame/guoqing/5.png' },
      { url: '/static/image/frame/guoqing/6.png' }
    ],
    currentFrameIndex: 0,
    avatarX: 0, // 头像X轴位置
    avatarY: 0, // 头像Y轴位置
    avatarScale: 1, // 头像缩放比例
    startX: 0, // 触摸开始X坐标
    startY: 0, // 触摸开始Y坐标
    canvasSize: 500, // 画布尺寸，与UI中的avatar-editor尺寸一致
  },

  onLoad() {
    // 获取全局数据
    if (app.globalData.tempAvatarUrl) {
      this.setData({
        avatarUrl: app.globalData.tempAvatarUrl
      });
    } else {
      // 如果没有头像，显示默认空白头像
      this.setData({
        avatarUrl: '/static/image/ui/avatar_empty.svg'
      });
    }

    // 设置默认头像框
    if (app.globalData.selectedFrame) {
      // 查找对应的索引
      const index = this.data.frames.findIndex(item => item.url === app.globalData.selectedFrame);
      if (index !== -1) {
        this.setData({
          frameUrl: app.globalData.selectedFrame,
          currentFrameIndex: index
        });
      } else {
        this.setData({
          frameUrl: this.data.frames[0].url
        });
      }
    } else {
      this.setData({
        frameUrl: this.data.frames[0].url
      });
    }
  },

  onReady() {
    // 页面渲染完成
  },

  // 头像框选择事件
  onFrameSelect(e) {
    const index = e.currentTarget.dataset.index;
    const frameUrl = this.data.frames[index].url;
    
    this.setData({
      frameUrl: frameUrl,
      currentFrameIndex: index
    });
    
    app.globalData.selectedFrame = frameUrl;
  },

  // 缩放滑块变化事件
  onScaleChange(e) {
    this.setData({
      avatarScale: e.detail.value
    });
  },

  // 重置头像位置和缩放
  resetAvatar() {
    this.setData({
      avatarX: 0,
      avatarY: 0,
      avatarScale: 1
    });
  },

  // 触摸开始事件
  onTouchStart(e) {
    this.setData({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY
    });
  },

  // 触摸移动事件
  onTouchMove(e) {
    const moveX = e.touches[0].clientX - this.data.startX;
    const moveY = e.touches[0].clientY - this.data.startY;
    
    this.setData({
      avatarX: this.data.avatarX + moveX,
      avatarY: this.data.avatarY + moveY,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY
    });
  },

  // 保存头像
  saveAvatar() {
    wx.showLoading({
      title: '正在生成头像',
      mask: true // 防止用户触摸操作
    });

    const query = wx.createSelectorQuery();
    query.select('#avatarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          wx.hideLoading();
          wx.showToast({
            title: '画布创建失败',
            icon: 'none'
          });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置超高清canvas尺寸，提高基础分辨率
        const dpr = wx.getSystemInfoSync().pixelRatio || 2;
        const canvasSize = this.data.canvasSize;
        // 减小渲染尺寸以控制文件大小，从之前的2倍降为1.5倍
        const renderSize = canvasSize * 1.5;
        
        // 设置Canvas尺寸为渲染尺寸的1.5倍，控制输出图像尺寸
        canvas.width = renderSize * dpr;
        canvas.height = renderSize * dpr;
        
        // 按比例缩放绘图上下文
        ctx.scale(dpr * 1.5, dpr * 1.5); // 从2倍降到1.5倍
        
        // 开启抗锯齿
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 清空画布并绘制白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // 预加载两个图片
        const avatarImg = canvas.createImage();
        const frameImg = canvas.createImage();
        
        // 头像加载完成后执行绘制
        avatarImg.onload = () => {
          try {
            // 计算圆心和半径
            const centerX = canvasSize / 2;
            const centerY = canvasSize / 2;
            const radius = canvasSize / 2;
            
            // 创建圆形剪切区域
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.clip();
            
            // 计算缩放和位置
            const scale = this.data.avatarScale;
            const offsetX = this.data.avatarX;
            const offsetY = this.data.avatarY;
            
            // 计算头像的绘制尺寸和位置
            const imgWidth = avatarImg.width;
            const imgHeight = avatarImg.height;
            
            // 保持纵横比的情况下，确保覆盖整个圆形区域
            const scaleFactor = Math.max(canvasSize / imgWidth, canvasSize / imgHeight) * scale;
            
            const scaledWidth = imgWidth * scaleFactor;
            const scaledHeight = imgHeight * scaleFactor;
            
            // 计算居中位置
            const drawX = centerX - (scaledWidth / 2) + offsetX;
            const drawY = centerY - (scaledHeight / 2) + offsetY;
            
            // 绘制用户头像
            ctx.drawImage(
              avatarImg,
              0, 0, imgWidth, imgHeight,
              drawX, drawY, scaledWidth, scaledHeight
            );
            ctx.restore();
            
            // 帧图像加载完后绘制帧
            frameImg.onload = () => {
              try {
                // 绘制帧图像覆盖在头像上方
                // 修改绘制方式，确保完全填充
                const frameWidth = frameImg.width;
                const frameHeight = frameImg.height;
                
                // 计算缩放比例，确保图像完全覆盖画布，稍微放大避免边缘问题
                const frameScaleFactor = Math.max(canvasSize / frameWidth, canvasSize / frameHeight) * 1.02;
                
                // 计算缩放后的尺寸（稍微放大）
                const scaledFrameWidth = frameWidth * frameScaleFactor;
                const scaledFrameHeight = frameHeight * frameScaleFactor;
                
                // 居中绘制，考虑偏移以确保完全覆盖
                const frameX = (canvasSize - scaledFrameWidth) / 2;
                const frameY = (canvasSize - scaledFrameHeight) / 2;
                
                ctx.drawImage(
                  frameImg,
                  0, 0, frameWidth, frameHeight,
                  frameX, frameY, scaledFrameWidth, scaledFrameHeight
                );
                
                // 导出图片 - 降低分辨率和质量控制文件大小
                wx.canvasToTempFilePath({
                  canvas: canvas,
                  x: 0,
                  y: 0,
                  width: canvasSize,
                  height: canvasSize,
                  destWidth: canvasSize * 4, // 从8倍减少到4倍，控制文件大小
                  destHeight: canvasSize * 4,
                  fileType: 'png',
                  quality: 0.8, // 降低质量以控制文件大小
                  success: (res) => {
                    // 获取临时文件信息以检查大小
                    wx.getFileInfo({
                      filePath: res.tempFilePath,
                      success: (fileInfo) => {
                        const fileSize = fileInfo.size / 1024; // 转换为KB
                        console.log('生成图片大小:', fileSize + 'KB');
                        
                        if (fileSize > 190) { // 预留一些余量，确保不超过200KB
                          // 如果文件大小超过190KB，再次压缩
                          this.compressImage(res.tempFilePath, 0.7, (compressedPath) => {
                            this.saveImageToAlbum(compressedPath);
                          });
                        } else {
                          // 文件大小符合要求，直接保存
                          this.saveImageToAlbum(res.tempFilePath);
                        }
                      },
                      fail: (err) => {
                        console.error('获取文件信息失败', err);
                        // 保险起见，尝试压缩后保存
                        this.compressImage(res.tempFilePath, 0.7, (compressedPath) => {
                          this.saveImageToAlbum(compressedPath);
                        });
                      }
                    });
                  },
                  fail: (err) => {
                    console.error('生成图片失败', err);
                    wx.hideLoading();
                    wx.showToast({
                      title: '生成图片失败',
                      icon: 'none'
                    });
                  }
                });
              } catch (error) {
                console.error('绘制帧出错', error);
                wx.hideLoading();
                wx.showToast({
                  title: '图片处理失败',
                  icon: 'none'
                });
              }
            };
            
            // 加载帧图像
            frameImg.src = this.data.frameUrl;
          } catch (error) {
            console.error('绘制头像出错', error);
            wx.hideLoading();
            wx.showToast({
              title: '图片处理失败',
              icon: 'none'
            });
          }
        };
        
        // 开始加载头像图像
        avatarImg.src = this.data.avatarUrl;
        
        // 处理图像加载错误
        avatarImg.onerror = () => {
          wx.hideLoading();
          wx.showToast({
            title: '头像加载失败',
            icon: 'none'
          });
        };
        
        frameImg.onerror = () => {
          wx.hideLoading();
          wx.showToast({
            title: '头像框加载失败',
            icon: 'none'
          });
        };
      });
  },
  
  // 图片压缩方法
  compressImage(filePath, quality, callback) {
    wx.compressImage({
      src: filePath,
      quality: Math.floor(quality * 100), // 质量0-100
      success: (res) => {
        console.log('压缩后图片路径:', res.tempFilePath);
        // 检查压缩后的文件大小
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (fileInfo) => {
            const fileSize = fileInfo.size / 1024; // 转换为KB
            console.log('压缩后图片大小:', fileSize + 'KB');
            
            if (fileSize > 190 && quality > 0.4) {
              // 如果仍然超过190KB且质量还可以再降低，继续压缩
              this.compressImage(res.tempFilePath, quality - 0.1, callback);
            } else {
              callback(res.tempFilePath);
            }
          },
          fail: (err) => {
            console.error('获取压缩后文件信息失败', err);
            callback(res.tempFilePath); // 仍然使用压缩后的文件
          }
        });
      },
      fail: (err) => {
        console.error('压缩图片失败', err);
        callback(filePath); // 压缩失败则使用原文件
      }
    });
  },
  
  // 保存图片到相册的方法
  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.hideLoading();
        wx.showModal({
          title: '保存成功',
          content: '头像已保存到相册，快去设置你的新头像吧！',
          confirmText: '查看头像',
          success: (result) => {
            if (result.confirm) {
              wx.navigateTo({
                url: '/pages/preview/preview?avatar=' + filePath
              });
            }
          }
        });
      },
      fail: (err) => {
        console.error('保存失败', err);
        wx.hideLoading();
        wx.showModal({
          title: '保存失败',
          content: '请检查是否授权相册权限',
          showCancel: false
        });
      }
    });
  }
}) 