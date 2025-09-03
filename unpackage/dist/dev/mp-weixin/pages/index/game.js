"use strict";
const common_vendor = require("../../common/vendor.js");
const config = require("../../config.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      // ==================== 屏幕适配相关 ====================
      screenInfo: {
        windowWidth: 0,
        windowHeight: 0,
        pixelRatio: 1
      },
      // ==================== 游戏状态控制 ====================
      count: config.PREPARE_SECONDS,
      // 倒计时剩余秒数
      countdownTimer: null,
      // 倒计时定时器
      showTitle: true,
      // 是否显示标题文字
      countdownColor: "#000000",
      // 倒计时数字颜色
      coverVisible: false,
      // 房屋是否可见
      peopleHidden: false,
      // 初始5人是否已隐藏
      coverHideTimer: null,
      // 房屋遮盖延迟定时器
      // ==================== 小人进入波次控制 ====================
      movingPeople: [],
      // 当前正在移动的小人数组 [{id, left, alive, run}]
      waveTimers: [],
      // 波次相关的所有定时器
      currentWave: 0,
      // 当前波次编号
      startSlideTimer: null,
      // 开始滑动的延迟定时器
      slideDurationMs: config.SLIDE_DURATION_MS,
      // 滑动动画持续时间
      personIdSeq: 1,
      // 小人ID序列号，确保唯一性
      launchingNextWave: false,
      // 是否正在启动下一波（防止重复触发）
      currentWaveId: null,
      // 当前波次的唯一ID（用于清理过期动画）
      activeAliveCount: 0,
      // 当前波次中仍在移动的小人数量
      wavesLaunched: 0,
      // 已启动的波次数量
      totalWavesTarget: 3,
      // 目标波次总数（根据关卡动态计算）
      gameFinished: false,
      // 游戏是否已结束
      wavesFinished: false,
      // 所有进入波次是否已完成
      // ==================== 小人逃离控制 ====================
      escapingPeople: [],
      // 正在逃离的小人数组 [{id, cls, left, top, z, duration}]
      escapeTimers: [],
      // 逃离相关的所有定时器
      escapeWavesLaunched: 0,
      // 已执行的逃离次数
      totalEscapeWavesTarget: 5,
      // 目标逃离总次数（根据关卡动态计算）
      escapeDispatcherTimer: null,
      // 逃离调度定时器（当前未使用）
      escapeSeriesScheduled: false,
      // 逃离序列是否已安排（防止重复安排）
      escapeZSeq: 1,
      // 逃离小人的z-index序号
      // ==================== 关卡系统 ====================
      currentLevel: 1,
      // 当前关卡等级
      // ==================== 计数与结果 ====================
      basePeopleInHouse: config.BASE_PEOPLE_IN_HOUSE,
      // 房屋初始人数
      totalEntered: 0,
      // 累计进入的小人总数
      totalEscaped: 0,
      // 累计逃离的小人总数
      finalCount: null,
      // 最终计算出的房屋内人数
      showResult: false,
      // 是否显示答题界面
      // ==================== 手写识别画板相关 ====================
      canvasWidth: config.CANVAS_CONFIG.dimensions.width,
      // 画布宽度
      canvasHeight: config.CANVAS_CONFIG.dimensions.height,
      // 画布高度
      ctx: null,
      // Canvas 2D绘图上下文
      isDrawing: false,
      // 是否正在绘制
      lastPoint: null,
      // 上一个绘制点坐标
      recognizedDigit: null,
      // AI识别出的数字结果
      _recognizeTimer: null,
      // 识别延迟定时器
      recognitionHandled: false,
      // 识别结果是否已处理（防止重复处理）
      _recognizeDelayMs: config.CANVAS_CONFIG.recognition.recognizeDelayMs,
      // 识别延迟时间
      _lastDrawTs: 0,
      // 最后一次绘制的时间戳
      _forceRecognizeTimer: null,
      // 强制识别定时器（兜底机制）
      _idleWatchTimer: null,
      // 空闲监测定时器
      _strokeLen: 0,
      // 当前笔画长度
      _totalStrokeLen: 0,
      // 总笔画长度
      _strokeCount: 0,
      // 笔画数量
      _lastStrokeEndTime: 0,
      // 最后一笔结束时间
      _canvasDevW: null,
      // 画布设备像素宽度
      _canvasDevH: null,
      // 画布设备像素高度
      // ==================== 确认机制相关 ====================
      _confirmationTimer: null,
      // 确认倒计时定时器
      _confirmationCountdown: 0,
      // 确认倒计时秒数
      showConfirmationCountdown: false,
      // 是否显示确认倒计时
      // ==================== 弹窗状态控制 ====================
      _modalShown: false,
      // 是否有弹窗正在显示（防止重复弹窗）
      // ==================== 资源路径 ====================
      peopleSrcFixed: config.PEOPLE_CONFIG.appearance.defaultImage,
      // 小人图片路径
      homeSrcFixed: config.HOUSE_CONFIG.image,
      // 房屋图片路径
      // ==================== 输入模式控制 ====================
      inputMode: config.INPUT_MODE,
      // 当前输入模式（0=画板，1=键盘）
      // ==================== 数字键盘相关 ====================
      keypadInput: "",
      // 键盘输入的内容
      keypadConfirmed: false,
      // 键盘输入是否已确认
      keypadExpanded: config.KEYPAD_CONFIG.features.defaultExpanded,
      // 键盘是否展开
      // ==================== 答案揭示阶段 ====================
      houseLift: false,
      // 房屋是否上升（揭示小人）
      revealVisible: false,
      // 揭示阶段是否可见
      revealPeople: [],
      // 揭示阶段的小人数组
      revealActiveIndex: -1,
      // 当前高亮的小人索引
      revealCountNum: 0,
      // 揭示阶段显示的数字
      revealTimers: [],
      // 揭示阶段相关定时器
      // ==================== 分享复活系统 ====================
      revivalData: {
        totalFailures: 0,
        // 总失败次数（跨会话保存）
        totalRevivals: 0,
        // 总复活次数（跨会话保存）
        lastResetDate: "",
        // 上次重置日期（用于每日重置）
        isReviving: false
        // 是否正在复活流程中
      },
      _showPageShareButton: false,
      // 是否显示页面内分享按钮
      _waitingForTopShare: false
      // 是否等待用户使用右上角分享
    };
  },
  /**
   * 计算属性
   */
  computed: {
    /**
    * 根组件样式 - 动态设置CSS变量
    * 用于控制小人滑动动画的持续时间和房屋位置
    */
    rootStyle() {
      return `
				--slide-duration: ${this.slideDurationMs}ms;
				--house-from-top: ${config.HOUSE_CONFIG.animations.initialDrop.fromTop};
				--house-to-top: ${config.HOUSE_CONFIG.animations.initialDrop.toTop};
				--house-lift-top: ${config.HOUSE_CONFIG.animations.revealLift.toTop};
				--house-drop-duration: ${config.HOUSE_CONFIG.animations.initialDrop.duration};
				--house-lift-duration: ${config.HOUSE_CONFIG.animations.revealLift.duration};
				--house-drop-easing: ${config.HOUSE_CONFIG.animations.initialDrop.easing};
				--house-lift-easing: ${config.HOUSE_CONFIG.animations.revealLift.easing};
				--house-width: ${this.responsiveHouseWidth};
				--house-height: ${this.responsiveHouseHeight};
				--people-size: ${config.PEOPLE_CONFIG.appearance.size};
				--people-reveal-size: ${config.PEOPLE_CONFIG.appearance.revealSize};
				--people-reveal-color: ${config.PEOPLE_CONFIG.appearance.revealRedColor};
				--people-image: url('${config.PEOPLE_CONFIG.appearance.defaultImage}');
				--people-slide-start: ${config.PEOPLE_CONFIG.animations.slideIn.startPosition};
				--people-slide-end: ${config.PEOPLE_CONFIG.animations.slideIn.endPosition};
				--people-slide-disappear: ${config.PEOPLE_CONFIG.animations.slideIn.disappearPosition};
				--game-area-top: ${config.UI_CONFIG.layout.gameAreaTop};
				--people-area-top: ${config.UI_CONFIG.layout.peopleAreaTop};
				--title-top: ${config.UI_CONFIG.layout.titleTop};
				--countdown-top: ${config.UI_CONFIG.layout.countdownTop};
				--level-indicator-top: ${config.UI_CONFIG.layout.levelIndicatorTop};
				--level-indicator-right: ${config.UI_CONFIG.layout.levelIndicatorRight};
				--reveal-number-top: ${config.UI_CONFIG.layout.revealNumberTop};
				--slide-area-width: ${config.UI_CONFIG.layout.slideAreaWidth};
				--slide-area-height: ${config.UI_CONFIG.layout.slideAreaHeight};
				--slide-area-margin-left: ${config.UI_CONFIG.layout.slideAreaMarginLeft};
				--escape-area-width: ${config.UI_CONFIG.layout.escapeAreaWidth};
				--escape-area-height: ${config.UI_CONFIG.layout.escapeAreaHeight};
				--escape-area-margin-left: ${config.UI_CONFIG.layout.escapeAreaMarginLeft};
				--reveal-area-width: ${config.UI_CONFIG.layout.revealAreaWidth};
				--reveal-area-height: ${config.UI_CONFIG.layout.revealAreaHeight};
				--reveal-area-margin-left: ${config.UI_CONFIG.layout.revealAreaMarginLeft};
			`.replace(/\s+/g, " ").trim();
    },
    /**
     * 响应式房屋宽度 - 根据屏幕尺寸动态计算
     */
    responsiveHouseWidth() {
      if (!this.screenInfo.windowWidth)
        return config.HOUSE_CONFIG.width;
      const baseWidth = 375;
      const baseHouseWidth = 560;
      const scale = Math.max(0.8, Math.min(1.5, this.screenInfo.windowWidth / baseWidth));
      return Math.round(baseHouseWidth * scale) + "rpx";
    },
    /**
     * 响应式房屋高度 - 确保能完全覆盖小人
     */
    responsiveHouseHeight() {
      if (!this.screenInfo.windowHeight)
        return config.HOUSE_CONFIG.height;
      const peopleSize = 165;
      const peopleAreaHeight = peopleSize * 2 + 40;
      const minHouseHeight = Math.round(peopleAreaHeight * 1.3);
      const baseHouseHeight = 330;
      const maxScreenRatio = 0.45;
      const maxHouseHeight = Math.round(this.screenInfo.windowHeight * maxScreenRatio * (750 / this.screenInfo.windowWidth));
      const finalHeight = Math.max(minHouseHeight, Math.min(baseHouseHeight, maxHouseHeight));
      return finalHeight + "rpx";
    }
  },
  /**
   * 页面加载时的初始化
   * 1. 加载分享复活数据（从本地存储）
   * 2. 开始游戏倒计时
   */
  onLoad() {
    this.getScreenInfo();
    this.loadRevivalData && this.loadRevivalData();
    this.startCountdown && this.startCountdown();
    this.enableShareMenu && this.enableShareMenu();
  },
  /**
   * 页面显示时的处理
   * 用于检测分享完成后的复活逻辑
   */
  onShow() {
    if (this._isRevivalShare && this.revivalData.isReviving) {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:430", "📱 [Share] 检测到分享完成，处理复活逻辑");
      }
      setTimeout(() => {
        common_vendor.index.showToast({
          title: "分享成功！获得复活机会",
          icon: "success",
          duration: 2e3
        });
        this.onShareSuccess();
        this._isRevivalShare = false;
        this._waitingForTopShare = false;
      }, 500);
    }
  },
  /**
   * 微信小程序分享生命周期方法
   * 当用户点击右上角分享按钮或页面内的分享按钮时触发
   * 这是微信小程序分享的标准做法，比直接调用wx.shareAppMessage更可靠
   * 
   * 注意：只有定义了此事件处理函数，小程序右上角菜单才会显示"转发"按钮
   */
  onShareAppMessage(res) {
    {
      common_vendor.index.__f__("log", "at pages/index/game.vue:462", "📱 [Share] onShareAppMessage 被调用", res);
      common_vendor.index.__f__("log", "at pages/index/game.vue:463", "📱 [Share] 当前环境信息:", {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "undefined",
        wxExists: typeof common_vendor.wx$1 !== "undefined",
        shareAppMessageExists: typeof common_vendor.wx$1 !== "undefined" && typeof common_vendor.wx$1.shareAppMessage !== "undefined"
      });
    }
    const shareContent = this.getShareContent();
    if (res.from === "button") {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:477", "📱 [Share] 分享来源：页面内分享按钮");
        common_vendor.index.__f__("log", "at pages/index/game.vue:478", "📱 [Share] 分享按钮目标:", res.target);
      }
      if (this.revivalData.isReviving) {
        {
          common_vendor.index.__f__("log", "at pages/index/game.vue:484", "📱 [Share] 检测到分享复活流程，将在分享完成后处理复活逻辑");
        }
        this._isRevivalShare = true;
      }
    } else if (res.from === "menu") {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:492", "📱 [Share] 分享来源：右上角分享按钮");
      }
      if (this._waitingForTopShare) {
        {
          common_vendor.index.__f__("log", "at pages/index/game.vue:498", "📱 [Share] 检测到用户使用右上角分享，将在分享完成后处理复活逻辑");
        }
        this._isRevivalShare = true;
        this._waitingForTopShare = false;
      }
    }
    const shareData = {
      title: shareContent.title,
      // 分享标题（必填）
      path: shareContent.path,
      // 页面路径（必填，必须以/开头）
      imageUrl: shareContent.imageUrl
      // 分享图标（可选）
    };
    if (shareContent.desc) {
      shareData.desc = shareContent.desc;
    }
    {
      common_vendor.index.__f__("log", "at pages/index/game.vue:519", "📱 [Share] 返回分享内容:", shareData);
    }
    return shareData;
  },
  /**
   * 启用右上角分享菜单
   * 功能：
   * 1. 显示右上角的分享按钮
   * 2. 支持带 shareTicket 的转发（用于群聊分享）
   * 
   * 注意：分享内容由 onShareAppMessage 方法提供，不需要在此处预设
   */
  enableShareMenu() {
    try {
      if (config.REVIVAL_CONFIG.debug.enableLogging) {
        common_vendor.index.__f__("log", "at pages/index/game.vue:537", "📱 [Share] 启用右上角分享菜单");
      }
      common_vendor.index.showShareMenu({
        withShareTicket: true,
        // 支持群聊分享，默认为 false
        success: () => {
          if (config.REVIVAL_CONFIG.debug.enableLogging) {
            common_vendor.index.__f__("log", "at pages/index/game.vue:546", "✅ [Share] uni.showShareMenu 启用成功");
          }
        },
        fail: (err) => {
          if (config.REVIVAL_CONFIG.debug.enableLogging) {
            common_vendor.index.__f__("log", "at pages/index/game.vue:551", "❌ [Share] uni.showShareMenu 启用失败:", err);
          }
        }
      });
      if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.showShareMenu) {
        common_vendor.wx$1.showShareMenu({
          withShareTicket: true,
          success: () => {
            if (config.REVIVAL_CONFIG.debug.enableLogging) {
              common_vendor.index.__f__("log", "at pages/index/game.vue:562", "✅ [Share] wx.showShareMenu 启用成功");
            }
          },
          fail: (err) => {
            if (config.REVIVAL_CONFIG.debug.enableLogging) {
              common_vendor.index.__f__("log", "at pages/index/game.vue:567", "❌ [Share] wx.showShareMenu 启用失败:", err);
            }
          }
        });
      }
    } catch (error) {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:574", "❌ [Share] 启用分享菜单异常:", error);
      }
    }
  },
  /**
   * 页面卸载时的清理工作
   * 清理所有定时器，防止内存泄漏
   */
  onUnload() {
    this.clearCountdown && this.clearCountdown();
    this.clearCoverHideTimer && this.clearCoverHideTimer();
    this.clearAllWaveTimers && this.clearAllWaveTimers();
    this.clearEscapeTimers && this.clearEscapeTimers();
    this.clearEscapeDispatcher && this.clearEscapeDispatcher();
    this.clearRevealState && this.clearRevealState();
    this._stopPadIdleWatcher && this._stopPadIdleWatcher();
    this.clearConfirmationTimer && this.clearConfirmationTimer();
    this.clearMaskCollisionTrackers && this.clearMaskCollisionTrackers();
  },
  methods: {
    // ==================== 屏幕适配方法 ====================
    /**
     * 获取屏幕信息用于响应式适配
     */
    getScreenInfo() {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        this.screenInfo = {
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio || 1
        };
        if (config.DEBUG_CONFIG.enabled && config.DEBUG_CONFIG.performance.enableVerboseLogging) {
          common_vendor.index.__f__("log", "at pages/index/game.vue:610", "📱 [Screen] 屏幕信息:", this.screenInfo);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/game.vue:613", "📱 [Screen] 获取屏幕信息失败:", error);
        this.screenInfo = {
          windowWidth: 375,
          windowHeight: 667,
          pixelRatio: 2
        };
      }
    },
    // ==================== 工具方法 ====================
    /**
     * 单位转换工具 - rpx转px
     * @param {number} val - rpx值
     * @returns {string} - px值或rpx值（兜底）
     */
    leftPx(val) {
      try {
        return common_vendor.index.upx2px(val) + "px";
      } catch (e) {
        return val + "rpx";
      }
    },
    // ==================== 关卡难度计算 ====================
    /**
     * 获取当前关卡的进入波数
     * 支持多种增长模式：线性、指数、自定义
     * @returns {number} 波数
     */
    getCurrentLevelWaves() {
      const config$1 = config.LEVEL_CONFIG.waves;
      const level = this.currentLevel;
      switch (config$1.growthType) {
        case "linear":
          return Math.min(config$1.baseWaves + (level - 1) * config$1.linearGrowth, config$1.maxWaves);
        case "exponential":
          return Math.min(config$1.baseWaves * Math.pow(1.5, level - 1), config$1.maxWaves);
        case "custom":
          return config$1.customWaves[level - 1] || config$1.customWaves[config$1.customWaves.length - 1];
        default:
          return config$1.baseWaves + (level - 1);
      }
    },
    /**
     * 获取当前关卡的逃离人数
     * 支持多种增长模式：线性、随机、自定义
     * @returns {number} 逃离人数
     */
    getCurrentLevelEscapes() {
      const config$1 = config.LEVEL_CONFIG.escapes;
      const level = this.currentLevel;
      switch (config$1.growthType) {
        case "linear":
          return Math.min(config$1.baseEscapes + (level - 1) * config$1.linearGrowth, config$1.maxEscapes);
        case "random":
          let totalEscapes = config$1.baseEscapes;
          for (let l = 2; l <= level; l++) {
            const [min, max] = config$1.randomRange;
            totalEscapes += Math.floor(Math.random() * (max - min + 1)) + min;
          }
          return Math.min(totalEscapes, config$1.maxEscapes);
        case "custom":
          return config$1.customEscapes[level - 1] || config$1.customEscapes[config$1.customEscapes.length - 1];
        default:
          return config$1.baseEscapes + (level - 1) * 2;
      }
    },
    // ==================== 答案揭示阶段布局算法 ====================
    /**
     * 获取揭示阶段小人的列位置
     * 自适应紧凑排列：少量使用预设簇，多量使用六边形错位网格
     * @param {number} idx - 小人索引
     * @returns {number} 列编号
     */
    revealCol(idx) {
      const { cols } = this._revealLayout();
      return idx % cols;
    },
    /**
     * 获取揭示阶段小人的行位置
     * @param {number} idx - 小人索引
     * @returns {number} 行编号
     */
    revealRow(idx) {
      const { cols } = this._revealLayout();
      return Math.floor(idx / cols);
    },
    /**
     * 计算揭示阶段小人的水平位置（rpx）
     * 策略：小于等于5人使用预设位置，多于5人使用动态网格布局
     * @param {number} idx - 小人索引
     * @returns {number} 水平位置（rpx）
     */
    revealLeftRpx(idx) {
      const n = this.revealPeople.length;
      if (n <= 5) {
        const presets = [
          [{ x: 220, y: 0 }, { x: 330, y: 0 }, { x: 275, y: 30 }, { x: 165, y: 30 }, { x: 385, y: 30 }],
          [{ x: 255, y: 0 }, { x: 295, y: 0 }, { x: 225, y: 30 }, { x: 325, y: 30 }, { x: 275, y: 60 }]
        ];
        const p = presets[0][idx] || presets[0][presets[0].length - 1];
        return p.x;
      }
      const { stepX, offsetX, staggerX, cols } = this._revealLayout();
      const c = this.revealCol(idx);
      const r = this.revealRow(idx);
      return offsetX + c * stepX + (r % 2 ? staggerX : 0);
    },
    /**
     * 计算揭示阶段小人的垂直位置（rpx）
     * @param {number} idx - 小人索引
     * @returns {number} 垂直位置（rpx）
     */
    revealTopRpx(idx) {
      const n = this.revealPeople.length;
      if (n <= 5) {
        const presets = [
          [{ x: 220, y: 0 }, { x: 330, y: 0 }, { x: 275, y: 30 }, { x: 165, y: 30 }, { x: 385, y: 30 }],
          [{ x: 255, y: 0 }, { x: 295, y: 0 }, { x: 225, y: 30 }, { x: 325, y: 30 }, { x: 275, y: 60 }]
        ];
        const p = presets[0][idx] || presets[0][presets[0].length - 1];
        return p.y;
      }
      const { stepY, offsetY } = this._revealLayout();
      const r = this.revealRow(idx);
      return offsetY + r * stepY;
    },
    /**
     * 计算揭示阶段的布局参数
     * 自适应算法：根据人数动态调整行列数和间距
     * @returns {Object} 布局参数 {cols, rows, stepX, stepY, offsetX, offsetY, staggerX}
     */
    _revealLayout() {
      const containerW = 550;
      const personW = 110;
      const n = Math.max(0, this.revealPeople.length);
      if (n <= 5) {
        return { cols: n, stepX: 0, stepY: 0, offsetX: 0, offsetY: 0, staggerX: 0 };
      }
      let cols = Math.max(5, Math.min(8, Math.round(Math.sqrt(n * 1.2))));
      const rows = Math.ceil(n / cols);
      const overlapX = 0.6;
      const overlapY = 0.7;
      let stepX = Math.floor(personW * overlapX);
      let stepY = Math.floor(personW * overlapY);
      const rowWidth = (cols - 1) * stepX + personW;
      const offsetX = Math.floor((containerW - rowWidth) / 2);
      const offsetY = 0;
      const staggerX = Math.floor(stepX / 2);
      return { cols, rows, stepX, stepY, offsetX, offsetY, staggerX };
    },
    // ==================== 核心游戏流程控制 ====================
    /**
     * 开始游戏倒计时
     * 游戏的主要入口点，负责：
     * 1. 清理所有现有状态和定时器
     * 2. 重置游戏数据到初始状态
     * 3. 根据当前关卡设置难度参数
     * 4. 启动倒计时，倒计时结束后自动进入下一阶段
     */
    startCountdown() {
      this.clearCountdown();
      this.clearCoverHideTimer();
      this.clearAllWaveTimers();
      this.clearEscapeTimers();
      this.clearEscapeDispatcher();
      this.clearRevealState();
      this._modalShown = false;
      this.count = config.PREPARE_SECONDS;
      this.showTitle = true;
      this.coverVisible = false;
      this.peopleHidden = false;
      this.countdownColor = "#000000";
      this.movingPeople = [];
      this.escapingPeople = [];
      this.currentWave = 0;
      this.wavesLaunched = 0;
      this.escapeWavesLaunched = 0;
      this.launchingNextWave = false;
      this.gameFinished = false;
      this.wavesFinished = false;
      this.escapeSeriesScheduled = false;
      this.escapeZSeq = 1;
      this.totalEntered = 0;
      this.totalEscaped = 0;
      this.totalWavesTarget = this.getCurrentLevelWaves();
      this.totalEscapeWavesTarget = this.getCurrentLevelEscapes();
      this.slideDurationMs = this.getEntryDuration();
      common_vendor.index.__f__("log", "at pages/index/game.vue:850", `🎮 [Level ${this.currentLevel}] 游戏开始 - 目标波数: ${this.totalWavesTarget}, 逃离波数: ${this.totalEscapeWavesTarget}, 初始小人: ${this.basePeopleInHouse}, 进入速度: ${this.slideDurationMs}ms`);
      this.finalCount = null;
      this.showResult = false;
      this.recognizedDigit = null;
      this.recognitionHandled = false;
      this.keypadInput = "";
      this.keypadConfirmed = false;
      this.keypadExpanded = true;
      this.houseLift = false;
      this.revealVisible = false;
      this.revealPeople = [];
      this.revealActiveIndex = -1;
      this.revealCountNum = 0;
      this._strokeCount = 0;
      this._totalStrokeLen = 0;
      this._strokeLen = 0;
      this._lastStrokeEndTime = 0;
      this.clearConfirmationTimer && this.clearConfirmationTimer();
      this.countdownTimer = setInterval(() => {
        if (this.count <= 1) {
          this.clearCountdown();
          this.count = 0;
          this.showTitle = false;
          this.coverVisible = true;
          this.coverHideTimer = setTimeout(() => {
            this.peopleHidden = true;
            this.clearCoverHideTimer();
          }, config.HOUSE_CONFIG.animations.covering.hideDelay);
          this.startSlideTimer = setTimeout(() => {
            if (this.gameFinished)
              return;
            const firstWave = config.ENTRY_CONFIG.firstWave;
            this.launchWave({ count: firstWave.count, grouped: firstWave.grouped });
          }, config.ENTRY_CONFIG.firstWave.delay);
          return;
        }
        this.count -= 1;
      }, 1e3);
    },
    /**
     * 启动一波小人进入
     * 这是控制小人进入的核心方法，支持成组和独立两种模式
     * 
     * @param {Object} params - 参数对象
     * @param {number} params.count - 本波小人数量
     * @param {boolean} params.grouped - 是否成组移动
     * 
     * 设计逻辑：
     * 1. 成组模式：所有小人同时启动，有位置偏移，视觉效果像一群人
     * 2. 独立模式：小人按间隔依次启动，视觉效果像零散个体
     * 3. 每个小人都有独立的动画生命周期管理
     * 4. 当前波次的所有小人完成后，自动启动下一波或结束进入阶段
     */
    launchWave({ count, grouped }) {
      if (this.gameFinished)
        return;
      this.movingPeople = this.movingPeople.filter((p) => p.alive);
      const config$1 = config.ENTRY_CONFIG.subsequentWaves;
      if (!grouped && count >= config$1.groupedThreshold) {
        grouped = true;
      } else if (!grouped && count < config$1.groupedThreshold) {
        grouped = Math.random() < config$1.groupedProbability;
      }
      if (this.wavesLaunched >= this.totalWavesTarget)
        return;
      this.wavesLaunched += 1;
      this.currentWave += 1;
      this.totalEntered += count;
      const baseSpeed = config.PEOPLE_CONFIG.animations.slideIn.speed.base;
      const speedChange = ((baseSpeed - this.slideDurationMs) / baseSpeed * 100).toFixed(1);
      common_vendor.index.__f__("log", "at pages/index/game.vue:947", `📥 [Wave ${this.wavesLaunched}/${this.totalWavesTarget}] 小人进入 - 本波: ${count}人 (${grouped ? "成组" : "独立"}), 累计进入: ${this.totalEntered}人, 速度: ${this.slideDurationMs}ms (较基础速度${speedChange > 0 ? "加快" : "减慢"}${Math.abs(speedChange)}%)`);
      this.launchingNextWave = false;
      const waveId = Date.now() + Math.random();
      this.currentWaveId = waveId;
      this.activeAliveCount = count;
      const ids = [];
      const offsets = grouped ? config.ENTRY_CONFIG.subsequentWaves.groupOffsets[count] || [0] : new Array(count).fill(0);
      for (let i = 0; i < count; i++) {
        const id = this.personIdSeq++;
        ids.push(id);
        this.movingPeople.push({
          id,
          left: offsets[i] || 0,
          // 水平偏移位置
          alive: true,
          // 是否仍在移动中
          run: false
          // 是否开始运行动画
        });
      }
      if (grouped) {
        const startAll = setTimeout(() => {
          if (this.gameFinished || waveId !== this.currentWaveId)
            return;
          const now = Date.now();
          ids.forEach((id) => {
            const item = this.movingPeople.find((p) => p.id === id);
            if (item) {
              item.run = true;
              item.animationStartTime = now;
            }
          });
        }, config.ANIMATION_START_DELAY);
        this.waveTimers.push(startAll);
        const endGroupT = setTimeout(() => {
          if (this.gameFinished || waveId !== this.currentWaveId)
            return;
          ids.forEach((id) => {
            const target = this.movingPeople.find((p) => p.id === id);
            if (target)
              target.alive = false;
          });
          this.activeAliveCount = 0;
          this.checkAndLaunchNextWave();
        }, this.slideDurationMs + config.ANIMATION_START_DELAY + 100);
        this.waveTimers.push(endGroupT);
      } else {
        const intervalConfig = config.ENTRY_CONFIG.independentInterval;
        const intervalMs = Math.max(intervalConfig.minMs, this.slideDurationMs * intervalConfig.durationRatio);
        ids.forEach((id, idx) => {
          const startT = setTimeout(() => {
            if (this.gameFinished || waveId !== this.currentWaveId)
              return;
            const item = this.movingPeople.find((p) => p.id === id);
            if (item) {
              item.run = true;
              item.animationStartTime = Date.now();
            }
            const endT = setTimeout(() => {
              if (this.gameFinished || waveId !== this.currentWaveId)
                return;
              const target = this.movingPeople.find((p) => p.id === id);
              if (target && target.alive) {
                target.alive = false;
                this.activeAliveCount -= 1;
              }
              if (this.activeAliveCount === 0) {
                this.checkAndLaunchNextWave();
              }
            }, this.slideDurationMs);
            this.waveTimers.push(endT);
          }, idx * intervalMs + config.ANIMATION_START_DELAY);
          this.waveTimers.push(startT);
        });
      }
    },
    /**
     * 检查并启动下一波
     */
    checkAndLaunchNextWave() {
      if (this.launchingNextWave)
        return;
      this.launchingNextWave = true;
      this.cleanupDeadPeople();
      if (this.wavesLaunched === 1 && !this.escapeSeriesScheduled) {
        this.scheduleEscapeMixAfterFirstWave();
      }
      if (this.wavesLaunched < this.totalWavesTarget) {
        const choices = config.ENTRY_CONFIG.subsequentWaves.countRange;
        const nextCount = choices[Math.floor(Math.random() * choices.length)];
        const nextGrouped = nextCount >= config.ENTRY_CONFIG.subsequentWaves.groupedThreshold ? true : Math.random() < config.ENTRY_CONFIG.subsequentWaves.groupedProbability;
        const t = setTimeout(() => {
          if (this.gameFinished)
            return;
          {
            common_vendor.index.__f__("log", "at pages/index/game.vue:1062", "[game] next wave with", nextCount, "grouped=", nextGrouped);
          }
          this.launchWave({
            count: nextCount,
            grouped: nextGrouped
          });
        }, config.WAVE_INTERVAL_MS);
        this.waveTimers.push(t);
      } else {
        this.wavesFinished = true;
        common_vendor.index.__f__("log", "at pages/index/game.vue:1072", `🌊 [Waves Complete] 所有进入波次完成 (${this.wavesLaunched}/${this.totalWavesTarget})`);
        this.tryFinalize();
      }
    },
    /**
     * 🔧 重新添加：清理已死亡的小人
     * 功能：从movingPeople数组中移除已死亡的小人，防止闪烁和内存泄漏
     */
    cleanupDeadPeople() {
      const beforeCount = this.movingPeople.length;
      this.movingPeople = this.movingPeople.filter((p) => p.alive);
      const afterCount = this.movingPeople.length;
      if (beforeCount !== afterCount) {
        common_vendor.index.__f__("log", "at pages/index/game.vue:1087", `🧹 [Cleanup] 清理已死亡小人: ${beforeCount} -> ${afterCount}`);
      }
    },
    // ==================== 小人逃离控制系统 ====================
    /**
     * 第一波结束后安排逃离序列
     * 
     * 设计逻辑：
     * 1. 在第一波小人进入完成后触发，避免进入和逃离同时发生造成混乱
     * 2. 支持多种方向分配策略：平衡、自定义概率、完全随机
     * 3. 使用定时器序列化执行，确保逃离有节奏感
     * 4. 通过随机打乱顺序增加不可预测性
     * 
     * 核心算法：
     * - 根据配置计算向上/向右逃离的人数分配
     * - 生成逃离方向序列并随机打乱
     * - 按间隔时间依次安排逃离定时器
     */
    scheduleEscapeMixAfterFirstWave() {
      this.escapeSeriesScheduled = true;
      const totalEscapes = this.totalEscapeWavesTarget;
      const config$1 = config.ESCAPE_CONFIG.directionProbability;
      let upCount, rightCount;
      switch (config$1.mode) {
        case "balanced":
          const half = Math.floor(totalEscapes / 2);
          upCount = Math.max(half, config$1.minUpCount);
          rightCount = Math.max(totalEscapes - upCount, config$1.minRightCount);
          if (upCount + rightCount > totalEscapes) {
            upCount = Math.max(Math.floor(totalEscapes * 0.5), config$1.minUpCount);
            rightCount = totalEscapes - upCount;
          }
          break;
        case "custom":
          upCount = Math.max(Math.floor(totalEscapes * config$1.upProbability), config$1.minUpCount);
          rightCount = Math.max(totalEscapes - upCount, config$1.minRightCount);
          break;
        case "random":
        default:
          upCount = Math.max(Math.floor(Math.random() * (totalEscapes - config$1.minRightCount)) + 1, config$1.minUpCount);
          rightCount = totalEscapes - upCount;
          break;
      }
      if (upCount + rightCount > totalEscapes) {
        if (upCount > rightCount) {
          upCount = totalEscapes - rightCount;
        } else {
          rightCount = totalEscapes - upCount;
        }
      }
      const seq = [];
      for (let i = 0; i < upCount; i++) {
        seq.push("up");
      }
      for (let i = 0; i < rightCount; i++) {
        seq.push("right");
      }
      for (let i = seq.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seq[i], seq[j]] = [seq[j], seq[i]];
      }
      const intervalConfig = config.ESCAPE_CONFIG.interval;
      const perInterval = Math.max(intervalConfig.minMs, Math.floor(this.slideDurationMs * intervalConfig.durationRatio));
      seq.slice(0, totalEscapes).forEach((dir, idx) => {
        const t = setTimeout(() => {
          this.launchEscape(dir);
        }, idx * perInterval);
        this.escapeTimers.push(t);
      });
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:1184", `[Level ${this.currentLevel}] Scheduled ${totalEscapes} escapes: ${upCount} up, ${rightCount} right (mode: ${config$1.mode})`);
      }
    },
    // ==================== 遮罩层碰撞检测系统 ====================
    /**
     * 启动遮罩层碰撞检测跟踪器
     * 
     * 设计逻辑：
     * 1. 监控小人的实时位置，当进入透明遮罩区域时立即隐藏
     * 2. 使用高频率检测（60fps）确保精确的碰撞检测
     * 3. 考虑小人的偏移位置，动态计算进入边界
     * 4. 替代原有的基于时间百分比的消失逻辑
     * 
     * @param {Object} person - 小人对象 {id, left, alive, run, hidden}
     */
    startMaskCollisionTracker(person) {
      const startPos = parseInt(config.PEOPLE_CONFIG.animations.slideIn.startPosition);
      const endPos = parseInt(config.PEOPLE_CONFIG.animations.slideIn.endPosition);
      const disappearPos = parseInt(config.PEOPLE_CONFIG.animations.slideIn.disappearPosition);
      const totalDistance = endPos - startPos;
      const personOffset = person.left || 0;
      const tracker = setInterval(() => {
        if (!person.alive || this.gameFinished || person.hidden) {
          clearInterval(tracker);
          return;
        }
        if (!person.animationStartTime) {
          person.animationStartTime = Date.now();
        }
        const elapsed = Date.now() - person.animationStartTime;
        const progress = Math.min(elapsed / this.slideDurationMs, 1);
        const basePos = startPos + totalDistance * progress;
        const visualPos = basePos + personOffset;
        if (visualPos >= disappearPos && !person.hidden) {
          person.hidden = true;
          person.alive = false;
          this.activeAliveCount -= 1;
          clearInterval(tracker);
          {
            common_vendor.index.__f__("log", "at pages/index/game.vue:1240", `🏠 [Disappear] 小人${person.id} 到达消失位置，瞬间消失: 基础位置${basePos.toFixed(1)}, 视觉位置${visualPos.toFixed(1)}, 消失位置${disappearPos}, 偏移${personOffset}`);
          }
        }
        if (progress >= 1) {
          if (!person.hidden) {
            person.hidden = true;
            person.alive = false;
            this.activeAliveCount -= 1;
            {
              common_vendor.index.__f__("log", "at pages/index/game.vue:1252", `🏠 [Disappear] 小人${person.id} 动画完成，强制消失`);
            }
          }
          clearInterval(tracker);
          return;
        }
      }, 16);
      this.maskCollisionTrackers.push(tracker);
    },
    /**
     * 清理所有遮罩碰撞检测跟踪器
     */
    clearMaskCollisionTrackers() {
      if (this.maskCollisionTrackers) {
        this.maskCollisionTrackers.forEach((tracker) => clearInterval(tracker));
        this.maskCollisionTrackers = [];
      }
    },
    /**
     * 计算逃离动画持续时间
     * 
     * 这是一个复杂的动态速度计算系统，支持：
     * 1. 多种关卡增长模式（百分比、固定、自定义）
     * 2. 不同的变化曲线（线性、指数、对数）
     * 3. 方向差异化速度
     * 4. 合理的速度范围限制
     * 
     * @param {string} direction - 逃离方向 'up' 或 'right'
     * @returns {number} 动画持续时间（毫秒）
     */
    getEscapeDuration(direction) {
      const speedConfig = config.PEOPLE_CONFIG.animations.escape.speed;
      const progression = speedConfig.levelProgression;
      let duration = speedConfig.base;
      switch (progression.mode) {
        case "percentage":
          const decreaseRate = progression.percentageDecrease / 100;
          for (let level = 2; level <= this.currentLevel; level++) {
            duration *= 1 - decreaseRate;
          }
          break;
        case "fixed":
          duration -= (this.currentLevel - 1) * progression.fixedDecrease;
          break;
        case "custom":
          const customIndex = this.currentLevel - 1;
          if (customIndex < progression.customDurations.length) {
            duration = progression.customDurations[customIndex];
          } else {
            duration = progression.customDurations[progression.customDurations.length - 1];
          }
          break;
        default:
          const defaultDecreaseRate = 0.05;
          for (let level = 2; level <= this.currentLevel; level++) {
            duration *= 1 - defaultDecreaseRate;
          }
          break;
      }
      {
        const dirMultiplier = direction === "up" ? speedConfig.directionDifference.upMultiplier : speedConfig.directionDifference.rightMultiplier;
        duration *= dirMultiplier;
      }
      duration = Math.max(speedConfig.minDuration, Math.min(speedConfig.maxDuration, duration));
      return Math.round(duration);
    },
    /**
     * 计算进入动画持续时间
     * 
     * 这是一个动态速度计算系统，支持：
     * 1. 多种关卡增长模式（百分比、固定、自定义）
     * 2. 不同的变化曲线（线性、指数、对数）
     * 3. 合理的速度范围限制
     * 
     * 随着关卡提升，小人进入速度会逐渐加快，增加游戏难度
     * 
     * @returns {number} 动画持续时间（毫秒）
     */
    getEntryDuration() {
      const speedConfig = config.PEOPLE_CONFIG.animations.slideIn.speed;
      const progression = speedConfig.levelProgression;
      let duration = speedConfig.base;
      switch (progression.mode) {
        case "percentage":
          const decreaseRate = progression.percentageDecrease / 100;
          for (let level = 2; level <= this.currentLevel; level++) {
            duration *= 1 - decreaseRate;
          }
          break;
        case "fixed":
          duration -= (this.currentLevel - 1) * progression.fixedDecrease;
          break;
        case "custom":
          const customIndex = this.currentLevel - 1;
          if (customIndex < progression.customDurations.length) {
            duration = progression.customDurations[customIndex];
          } else {
            duration = progression.customDurations[progression.customDurations.length - 1];
          }
          break;
        default:
          const defaultDecreaseRate = 0.08;
          for (let level = 2; level <= this.currentLevel; level++) {
            duration *= 1 - defaultDecreaseRate;
          }
          break;
      }
      const finalDuration = Math.max(speedConfig.minDuration, Math.min(duration, speedConfig.maxDuration));
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:1448", `🎯 [Entry Speed] Level ${this.currentLevel}: base=${speedConfig.base}ms, calculated=${Math.round(duration)}ms, final=${finalDuration}ms, mode=${progression.mode}`);
      }
      return finalDuration;
    },
    /**
     * 执行单个小人逃离
     * 
     * 这是逃离系统的执行核心，负责：
     * 1. 创建逃离小人对象并设置初始位置
     * 2. 计算动态动画时长
     * 3. 启动CSS动画（小程序兼容性处理）
     * 4. 管理动画生命周期和清理
     * 5. 检查游戏是否应该结束
     * 
     * @param {string} dir - 逃离方向 'up' 或 'right'
     */
    launchEscape(dir) {
      if (this.escapeWavesLaunched >= this.totalEscapeWavesTarget)
        return;
      this.escapeWavesLaunched += 1;
      this.totalEscaped += 1;
      const escapeDuration = this.getEscapeDuration(dir);
      const speedConfig = config.PEOPLE_CONFIG.animations.escape.speed;
      const baseSpeed = speedConfig.base;
      const speedChange = ((baseSpeed - escapeDuration) / baseSpeed * 100).toFixed(1);
      common_vendor.index.__f__("log", "at pages/index/game.vue:1480", `📤 [Escape ${this.escapeWavesLaunched}/${this.totalEscapeWavesTarget}] 小人逃离 - 方向: ${dir === "up" ? "向上" : "向右"}, 速度: ${escapeDuration}ms (较基础速度${speedChange > 0 ? "加快" : "减慢"}${Math.abs(speedChange)}%), 累计逃离: ${this.totalEscaped}人`);
      const startPos = config.PEOPLE_CONFIG.animations.escape.startPositions[dir];
      const startLeft = startPos.left;
      const startTop = startPos.top;
      const id = "e" + this.personIdSeq++;
      const obj = {
        id,
        // 唯一标识符
        cls: "pre",
        // CSS类名，初始状态
        left: startLeft,
        // 水平位置
        top: startTop,
        // 垂直位置
        z: this.escapeZSeq++,
        // z-index层级（确保后逃离的在上层）
        duration: escapeDuration
        // 动画持续时间（传递给CSS变量）
      };
      this.escapingPeople.push(obj);
      this.$nextTick(() => {
        setTimeout(() => {
          const targetObj = this.escapingPeople.find((p) => p.id === id);
          if (targetObj) {
            targetObj.cls = dir === "up" ? "escape-up" : "escape-right";
          }
        }, 50);
      });
      const t = setTimeout(() => {
        this.escapingPeople = this.escapingPeople.filter((p) => p.id !== id);
      }, escapeDuration + config.ESCAPE_CONFIG.interval.cleanupDelay);
      this.escapeTimers.push(t);
    },
    startEscapeDispatcher() {
      if (this.escapeDispatcherTimer)
        return;
      const interval = Math.max(260, Math.floor(this.slideDurationMs * 0.6));
      this.escapeDispatcherTimer = setInterval(() => {
        if (this.escapeWavesLaunched >= this.totalEscapeWavesTarget) {
          this.clearEscapeDispatcher();
          this.tryFinalize();
          return;
        }
        this.launchEscape(Math.random() < 0.5 ? "up" : "right");
      }, interval);
    },
    clearEscapeDispatcher() {
      if (this.escapeDispatcherTimer) {
        clearInterval(this.escapeDispatcherTimer);
        this.escapeDispatcherTimer = null;
      }
    },
    tryEscapes() {
    },
    clearEscapeTimers() {
      this.escapeTimers.forEach((t) => clearTimeout(t));
      this.escapeTimers = [];
    },
    tryFinalize() {
      if (this.gameFinished)
        return;
      if (this.wavesFinished && this.escapeWavesLaunched >= this.totalEscapeWavesTarget) {
        this.gameFinished = true;
        this.clearEscapeDispatcher();
        const final = this.basePeopleInHouse + this.totalEntered - this.totalEscaped;
        this.finalCount = Math.max(0, final);
        common_vendor.index.__f__("log", "at pages/index/game.vue:1554", `🏁 [Level ${this.currentLevel}] 游戏结束 - 初始: ${this.basePeopleInHouse}人, 进入: ${this.totalEntered}人, 逃离: ${this.totalEscaped}人`);
        common_vendor.index.__f__("log", "at pages/index/game.vue:1555", `🏠 [Final Count] 最终房屋内小人数量: ${this.finalCount}人`);
        this.showResult = true;
        this.recognitionHandled = false;
        common_vendor.index.__f__("log", "at pages/index/game.vue:1558", `⌨️ [Input] 进入答题阶段 - showResult: ${this.showResult}, inputMode: ${this.inputMode}`);
        if (this.inputMode === 0) {
          this.$nextTick(() => {
            this.setupCanvas && this.setupCanvas();
            this._startPadIdleWatcher && this._startPadIdleWatcher();
            setTimeout(() => {
              this.recognizeDigit && this.recognizeDigit();
            }, 1200);
          });
        } else {
          this.keypadInput = "";
          this.keypadConfirmed = false;
          common_vendor.index.__f__("log", "at pages/index/game.vue:1571", `⌨️ [Keypad] 数字键盘初始化 - keypadExpanded: ${this.keypadExpanded}`);
        }
      }
    },
    // 画板
    setupCanvas() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#digitCanvas").fields({ node: true, size: true, rect: true }).exec((res) => {
        if (!res || !res[0]) {
          common_vendor.index.__f__("error", "at pages/index/game.vue:1581", "[Canvas] Failed to get canvas node");
          return;
        }
        const canvas = res[0].node;
        if (!canvas) {
          common_vendor.index.__f__("error", "at pages/index/game.vue:1586", "[Canvas] Canvas node is null");
          return;
        }
        const dpr = common_vendor.index.getWindowInfo().pixelRatio || 1;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        this.canvasWidth = res[0].width;
        this.canvasHeight = res[0].height;
        this._canvasDevW = canvas.width;
        this._canvasDevH = canvas.height;
        this._dpr = dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          common_vendor.index.__f__("error", "at pages/index/game.vue:1603", "[Canvas] Failed to get 2d context");
          return;
        }
        ctx.scale(dpr, dpr);
        const drawConfig = config.CANVAS_CONFIG.drawing;
        ctx.lineCap = drawConfig.lineCap;
        ctx.lineJoin = drawConfig.lineJoin;
        ctx.lineWidth = drawConfig.lineWidth;
        ctx.strokeStyle = drawConfig.strokeStyle;
        ctx.fillStyle = drawConfig.backgroundColor;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.beginPath();
        this.ctx = ctx;
        this._canvasRect = { left: res[0].left || 0, top: res[0].top || 0 };
      });
    },
    async _getImageData() {
      const devW = this._canvasDevW || (this.canvasWidth || 0);
      const devH = this._canvasDevH || (this.canvasHeight || 0);
      if (!this.ctx || !devW || !devH)
        return null;
      try {
        const img = this.ctx.getImageData(0, 0, devW, devH);
        return { data: img.data, width: devW, height: devH };
      } catch (e) {
        return await new Promise((resolve) => {
          common_vendor.index.canvasGetImageData({
            canvasId: "digitCanvas",
            x: 0,
            y: 0,
            width: devW,
            height: devH,
            quality: 1,
            success: (res) => {
              resolve({ data: new Uint8ClampedArray(res.data), width: res.width, height: res.height });
            },
            fail: () => resolve(null)
          }, this);
        });
      }
    },
    _getCanvasXY(e) {
      const t0 = e.changedTouches && e.changedTouches[0] || e.touches && e.touches[0] || {};
      if (t0.x != null && t0.y != null) {
        return { x: t0.x, y: t0.y };
      }
      const rect = this._canvasRect || { left: 0, top: 0 };
      const clientX = t0.clientX != null ? t0.clientX : t0.pageX;
      const clientY = t0.clientY != null ? t0.clientY : t0.pageY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return { x, y };
    },
    /**
     * 画板触摸开始事件处理
     * 功能：
     * 1. 初始化绘图状态和参数
     * 2. 清除之前的识别定时器
     * 3. 设置画笔样式和起始点
     * 4. 记录绘图开始时间
     */
    onCanvasTouchStart(e) {
      if (!this.ctx) {
        common_vendor.index.__f__("error", "at pages/index/game.vue:1680", "[Canvas] No context available for drawing");
        return;
      }
      if (this._recognizeTimer) {
        clearTimeout(this._recognizeTimer);
        this._recognizeTimer = null;
      }
      if (this._forceRecognizeTimer) {
        clearTimeout(this._forceRecognizeTimer);
        this._forceRecognizeTimer = null;
      }
      const { x, y } = this._getCanvasXY(e);
      this.isDrawing = true;
      this.lastPoint = { x, y };
      const drawConfig = config.CANVAS_CONFIG.drawing;
      this.ctx.lineWidth = drawConfig.lineWidth;
      this.ctx.strokeStyle = drawConfig.strokeStyle;
      this.ctx.lineCap = drawConfig.lineCap;
      this.ctx.lineJoin = drawConfig.lineJoin;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this._lastDrawTs = Date.now();
      if (this._strokeCount === 0) {
        this.recognizedDigit = null;
      }
      this._strokeLen = 0;
    },
    /**
     * 画板触摸移动事件处理
     * 功能：
     * 1. 绘制连续的线条轨迹
     * 2. 计算并累积笔画长度（用于AI识别特征）
     * 3. 更新最后绘制时间戳
     */
    onCanvasTouchMove(e) {
      if (!this.isDrawing || !this.ctx) {
        return;
      }
      const { x, y } = this._getCanvasXY(e);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      if (this.lastPoint) {
        const dx = x - this.lastPoint.x, dy = y - this.lastPoint.y;
        this._strokeLen += Math.sqrt(dx * dx + dy * dy);
      }
      this.lastPoint = { x, y };
      this._lastDrawTs = Date.now();
    },
    /**
     * 画板触摸结束事件处理
     * 功能：
     * 1. 结束绘制状态，统计笔画数据
     * 2. 强制重绘确保内容显示（小程序兼容性）
     * 3. 启动延迟识别机制
     * 4. 设置兜底强制识别定时器
     */
    onCanvasTouchEnd() {
      this.isDrawing = false;
      this.lastPoint = null;
      this._strokeCount++;
      this._totalStrokeLen += this._strokeLen;
      this._lastStrokeEndTime = Date.now();
      if (this.ctx) {
        this._forceCanvasRedraw();
      }
      if (this._recognizeTimer)
        clearTimeout(this._recognizeTimer);
      if (this._forceRecognizeTimer)
        clearTimeout(this._forceRecognizeTimer);
      const waitMs = this._recognizeDelayMs;
      this._recognizeTimer = setTimeout(() => {
        this.recognizeDigit && this.recognizeDigit();
      }, waitMs);
      this._forceRecognizeTimer = setTimeout(() => {
        this.recognizeDigit && this.recognizeDigit();
      }, 3e3);
    },
    /**
     * 清除画板内容和相关状态
     * 功能：
     * 1. 清空Canvas画布并重置背景
     * 2. 重置绘制样式为配置默认值
     * 3. 清除所有识别相关状态和定时器
     * 4. 重置笔画统计数据
     */
    clearCanvas() {
      if (!this.ctx) {
        common_vendor.index.__f__("error", "at pages/index/game.vue:1796", "[Canvas] No context available for clearing");
        return;
      }
      const drawConfig = config.CANVAS_CONFIG.drawing;
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.fillStyle = drawConfig.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.strokeStyle = drawConfig.strokeStyle;
      this.ctx.lineWidth = drawConfig.lineWidth;
      this.ctx.lineCap = drawConfig.lineCap;
      this.ctx.lineJoin = drawConfig.lineJoin;
      this.ctx.beginPath();
      this._forceCanvasRedraw();
      this.recognizedDigit = null;
      this._strokeCount = 0;
      this._totalStrokeLen = 0;
      this._strokeLen = 0;
      this._lastStrokeEndTime = 0;
      if (this._recognizeTimer) {
        clearTimeout(this._recognizeTimer);
        this._recognizeTimer = null;
      }
      if (this._forceRecognizeTimer) {
        clearTimeout(this._forceRecognizeTimer);
        this._forceRecognizeTimer = null;
      }
      this.clearConfirmationTimer();
    },
    async recognizeDigit() {
      if (!this.ctx)
        return;
      const img = await this._getImageData();
      if (!img) {
        this.recognizedDigit = null;
        return;
      }
      if (this._recognizeTimer) {
        clearTimeout(this._recognizeTimer);
        this._recognizeTimer = null;
      }
      if (this._forceRecognizeTimer) {
        clearTimeout(this._forceRecognizeTimer);
        this._forceRecognizeTimer = null;
      }
      const w = img.width;
      const h = img.height;
      const gray = new Uint8Array(w * h);
      const alpha = new Uint8Array(w * h);
      const hist = new Uint32Array(256);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = img.data[idx], g = img.data[idx + 1], b = img.data[idx + 2], a = img.data[idx + 3];
          const lum = Math.round((r * 299 + g * 587 + b * 114) / 1e3);
          gray[y * w + x] = lum;
          alpha[y * w + x] = a;
          if (a > 10)
            hist[lum]++;
        }
      }
      let sum = 0, sumB = 0, wB = 0, wF = 0, maxVar = -1, thresh = 128;
      const total = w * h;
      for (let i = 0; i < 256; i++)
        sum += i * hist[i];
      for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0)
          continue;
        wF = total - wB;
        if (wF === 0)
          break;
        sumB += t * hist[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const between = wB * wF * (mB - mF) * (mB - mF);
        if (between > maxVar) {
          maxVar = between;
          thresh = t;
        }
      }
      const bin = new Uint8Array(w * h);
      let cnt = 0;
      for (let i = 0; i < w * h; i++) {
        if (alpha[i] > 10 && gray[i] < thresh) {
          bin[i] = 1;
          cnt++;
        }
      }
      if (cnt < 50) {
        this.recognizedDigit = null;
        return;
      }
      this._morphologyClose(bin, w, h, 2);
      const comps = this._connectedComponents(bin, w, h);
      if (comps.length === 0) {
        this.recognizedDigit = null;
        return;
      }
      const digits = this._segmentDigits(comps, w, h);
      let text = "";
      for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const result = this._classifyDigitAdvanced(bin, w, h, digit);
        if (result !== null) {
          text += String(result);
        }
      }
      this.recognizedDigit = text;
      if (text) {
        common_vendor.index.__f__("log", "at pages/index/game.vue:1917", `🤖 [AI Recognition] 识别结果: "${text}"`);
      }
      const num = parseInt(text);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        this.startConfirmationCountdown(num);
      }
    },
    // 启动延迟确认倒计时
    startConfirmationCountdown(recognizedNumber) {
      this.clearConfirmationTimer();
      this._confirmationCountdown = config.CANVAS_CONFIG.recognition.confirmationCountdown;
      this.showConfirmationCountdown = true;
      const countdownInterval = setInterval(() => {
        this._confirmationCountdown--;
        if (this._confirmationCountdown <= 0) {
          clearInterval(countdownInterval);
          this.showConfirmationCountdown = false;
          if (this.recognizedDigit !== null && !this.recognitionHandled) {
            this.handleRecognitionResult(recognizedNumber);
          }
        }
      }, 1e3);
      this._confirmationTimer = countdownInterval;
    },
    // 清除确认定时器
    clearConfirmationTimer() {
      if (this._confirmationTimer) {
        clearInterval(this._confirmationTimer);
        this._confirmationTimer = null;
      }
      this.showConfirmationCountdown = false;
      this._confirmationCountdown = 0;
    },
    handleRecognitionResult(pred) {
      if (this.recognitionHandled)
        return;
      if (pred == null)
        return;
      this.recognitionHandled = true;
      this.clearConfirmationTimer();
      const isCorrect = Number(pred) === Number(this.finalCount);
      common_vendor.index.__f__("log", "at pages/index/game.vue:1969", `📝 [Answer] 用户答案: ${pred}, 正确答案: ${this.finalCount}, 结果: ${isCorrect ? "✅正确" : "❌错误"}`);
      setTimeout(() => {
        this.startRevealSequence(isCorrect);
      }, config.BALANCE_CONFIG.flow.autoProgressDelay);
    },
    startRevealSequence(isCorrect) {
      this.showResult = false;
      this.peopleHidden = true;
      this.movingPeople = [];
      this.escapingPeople = [];
      this.clearAllWaveTimers();
      this.clearEscapeTimers();
      this.houseLift = false;
      this.coverVisible = true;
      this.revealVisible = false;
      this.revealPeople = [];
      this.revealActiveIndex = -1;
      this.revealCountNum = 0;
      const liftT = setTimeout(() => {
        this.houseLift = true;
      }, config.HOUSE_CONFIG.animations.revealLift.delay);
      this.revealTimers.push(liftT);
      const afterLift = setTimeout(() => {
        this.revealVisible = true;
        const total = Math.max(0, this.finalCount);
        this.revealPeople = Array.from({ length: total }, (_, i) => i);
        const stepMs = config.BALANCE_CONFIG.flow.revealAnimationStep;
        for (let i = 0; i < total; i++) {
          const t = setTimeout(() => {
            this.revealActiveIndex = i;
            this.revealCountNum = i + 1;
          }, i * stepMs);
          this.revealTimers.push(t);
        }
        const afterAll = setTimeout(() => {
          const showModal = () => {
            if (isCorrect) {
              this.currentLevel += 1;
              common_vendor.index.__f__("log", "at pages/index/game.vue:2020", `🎉 [Level Up] 恭喜通过第${this.currentLevel - 1}关，进入第${this.currentLevel}关！`);
              this._modalShown = true;
              common_vendor.index.showModal({
                title: `第${this.currentLevel - 1}关通过！`,
                content: `恭喜进入第${this.currentLevel}关！难度将会增加。`,
                confirmText: "下一关",
                cancelText: "退出",
                showCancel: true,
                success: (res) => {
                  this._modalShown = false;
                  if (res.confirm) {
                    this.clearRevealState && this.clearRevealState();
                    this.startCountdown && this.startCountdown();
                  } else if (res.cancel) {
                    common_vendor.index.reLaunch({ url: "/pages/index/index" });
                  }
                },
                fail: (err) => {
                  common_vendor.index.__f__("error", "at pages/index/game.vue:2042", `[Game] Modal failed:`, err);
                  this._modalShown = false;
                  this.clearRevealState && this.clearRevealState();
                  this.startCountdown && this.startCountdown();
                }
              });
            } else {
              const failedLevel = this.currentLevel;
              this.recordFailure();
              common_vendor.index.__f__("log", "at pages/index/game.vue:2055", `💥 [Game Over] 第${failedLevel}关失败`);
              if (this.canUseRevival()) {
                this.showRevivalModal(failedLevel);
              } else {
                this.currentLevel = 1;
                common_vendor.index.__f__("log", "at pages/index/game.vue:2064", `💥 [Game Over] 第${failedLevel}关失败，重置到第1关`);
                this.showGameOverModal(failedLevel);
              }
            }
          };
          showModal();
          const fallbackTimer = setTimeout(() => {
            if (isCorrect && this.currentLevel > 1) {
              if (!this._modalShown) {
                this.startCountdown && this.startCountdown();
              }
            }
          }, 5e3);
          this.revealTimers.push(fallbackTimer);
        }, Math.max(200, total * stepMs + 200));
        this.revealTimers.push(afterAll);
      }, 700);
      this.revealTimers.push(afterLift);
    },
    clearRevealState() {
      this.houseLift = false;
      this.revealVisible = false;
      this.revealPeople = [];
      this.revealActiveIndex = -1;
      this.revealCountNum = 0;
      this.revealTimers && this.revealTimers.forEach((t) => clearTimeout(t));
      this.revealTimers = [];
      if (this._recognizeTimer) {
        clearTimeout(this._recognizeTimer);
        this._recognizeTimer = null;
      }
      if (this._forceRecognizeTimer) {
        clearTimeout(this._forceRecognizeTimer);
        this._forceRecognizeTimer = null;
      }
      this._stopPadIdleWatcher && this._stopPadIdleWatcher();
      this.movingPeople = [];
      this.escapingPeople = [];
      this.clearAllWaveTimers();
      this.clearEscapeTimers();
      this._modalShown = false;
    },
    countHoles(arr, w, h) {
      const vis = new Uint8Array(w * h);
      for (let x = 0; x < w; x++) {
        if (!arr[x] && !vis[x])
          this.fill(arr, vis, w, h, x, 0);
        const i2 = (h - 1) * w + x;
        if (!arr[i2] && !vis[i2])
          this.fill(arr, vis, w, h, x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        const i1 = y * w;
        if (!arr[i1] && !vis[i1])
          this.fill(arr, vis, w, h, 0, y);
        const i2 = y * w + (w - 1);
        if (!arr[i2] && !vis[i2])
          this.fill(arr, vis, w, h, w - 1, y);
      }
      let holes = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!arr[i] && !vis[i]) {
            holes++;
            this.fill(arr, vis, w, h, x, y);
          }
        }
      return holes;
    },
    fill(arr, vis, w, h, sx, sy) {
      const st = [sx, sy];
      while (st.length) {
        const y = st.pop(), x = st.pop();
        const i = y * w + x;
        if (x < 0 || y < 0 || x >= w || y >= h)
          continue;
        if (vis[i])
          continue;
        if (arr[i])
          continue;
        vis[i] = 1;
        st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
    },
    holeCenterY(arr, w, h) {
      const vis = new Uint8Array(w * h);
      for (let x = 0; x < w; x++) {
        if (!arr[x])
          this.fill(arr, vis, w, h, x, 0);
        const i2 = (h - 1) * w + x;
        if (!arr[i2])
          this.fill(arr, vis, w, h, x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        const i1 = y * w;
        if (!arr[i1])
          this.fill(arr, vis, w, h, 0, y);
        const i2 = y * w + (w - 1);
        if (!arr[i2])
          this.fill(arr, vis, w, h, w - 1, y);
      }
      let sumY = 0, count = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!arr[i] && !vis[i]) {
            sumY += y;
            count++;
          }
        }
      return count ? sumY / count : h / 2;
    },
    _densityFeatures(arr, w, h) {
      let top = 0, bottom = 0, left = 0, right = 0, cySum = 0, cnt = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const v = arr[y * w + x];
          if (v) {
            cnt++;
            cySum += y;
            if (y < h / 2)
              top++;
            else
              bottom++;
            if (x < w / 2)
              left++;
            else
              right++;
          }
        }
      return { topDensity: top / (w * h / 2), bottomDensity: bottom / (w * h / 2), leftDensity: left / (w * h / 2), rightDensity: right / (w * h / 2), centerY: cnt ? cySum / cnt : h / 2 };
    },
    _connectedComponents(bin, w, h) {
      const vis = new Uint8Array(w * h);
      const comps = [];
      const push = (arr, x, y) => {
        arr.push(x, y);
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!bin[i] || vis[i])
            continue;
          let area = 0, minX = x, maxX = x, minY = y, maxY = y, sumX = 0, sumY = 0;
          const st = [];
          push(st, x, y);
          while (st.length) {
            const cy = st.pop(), cx = st.pop();
            if (cx < 0 || cy < 0 || cx >= w || cy >= h)
              continue;
            const ii = cy * w + cx;
            if (vis[ii] || !bin[ii])
              continue;
            vis[ii] = 1;
            area++;
            sumX += cx;
            sumY += cy;
            if (cx < minX)
              minX = cx;
            if (cx > maxX)
              maxX = cx;
            if (cy < minY)
              minY = cy;
            if (cy > maxY)
              maxY = cy;
            push(st, cx + 1, cy);
            push(st, cx - 1, cy);
            push(st, cx, cy + 1);
            push(st, cx, cy - 1);
          }
          const bw = maxX - minX + 1, bh = maxY - minY + 1;
          comps.push({ minX, minY, maxX, maxY, bw, bh, area, cx: sumX / area, cy: sumY / area });
        }
      return comps;
    },
    _classifyDigit(bin, w, h, comp) {
      const sw = 28, sh = 28;
      const scaled = new Uint8Array(sw * sh);
      for (let y = 0; y < sh; y++)
        for (let x = 0; x < sw; x++) {
          const sx = Math.floor(comp.minX + x * comp.bw / sw);
          const sy = Math.floor(comp.minY + y * comp.bh / sh);
          scaled[y * sw + x] = bin[sy * w + sx];
        }
      const holes = this.countHoles(scaled, sw, sh);
      const aspect = comp.bw / comp.bh;
      const { topDensity, bottomDensity, leftDensity, rightDensity, centerY } = this._densityFeatures(scaled, sw, sh);
      let pred = null;
      if (holes >= 2)
        pred = 8;
      else if (holes === 1) {
        const cy = this.holeCenterY(scaled, sw, sh);
        if (cy < sh * 0.45)
          pred = 9;
        else if (cy > sh * 0.6)
          pred = 6;
        else
          pred = 0;
      } else {
        if (aspect < 0.45)
          pred = 1;
        else if (aspect >= 1.25 && topDensity > bottomDensity * 1.5 && rightDensity > leftDensity * 1.2)
          pred = 7;
        else if (aspect > 0.85 && aspect < 1.25 && topDensity < bottomDensity * 0.75)
          pred = 3;
        else if (centerY > sh * 0.65 && rightDensity > leftDensity * 1.2)
          pred = 2;
        else
          pred = 2;
      }
      return pred;
    },
    // 形态学闭运算
    _morphologyClose(bin, w, h, radius) {
      const temp = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let maxVal = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
                if (bin[ny * w + nx] > maxVal)
                  maxVal = bin[ny * w + nx];
              }
            }
          }
          temp[y * w + x] = maxVal;
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let minVal = 1;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
                if (temp[ny * w + nx] < minVal)
                  minVal = temp[ny * w + nx];
              }
            }
          }
          bin[y * w + x] = minVal;
        }
      }
    },
    // 智能分割数字
    _segmentDigits(comps, w, h) {
      if (comps.length === 0)
        return [];
      let filtered = comps.filter((c) => c.area > Math.max(50, w * h * 2e-3));
      if (filtered.length === 0 && comps.length > 0) {
        const sorted = comps.slice().sort((a, b) => b.area - a.area);
        filtered = sorted.slice(0, Math.min(3, sorted.length));
      }
      filtered.sort((a, b) => a.cx - b.cx);
      const avgWidth = filtered.reduce((sum, c) => sum + c.bw, 0) / filtered.length;
      const avgHeight = filtered.reduce((sum, c) => sum + c.bh, 0) / filtered.length;
      const segments = [];
      for (const comp of filtered) {
        if (comp.bw > avgWidth * 1.8 && comp.bw > avgHeight * 0.8) {
          const splitComps = this._trySplitComponent(comp, w, h);
          segments.push(...splitComps);
        } else {
          segments.push(comp);
        }
      }
      const merged = [];
      const mergeThreshold = Math.max(avgWidth * 0.2, 8);
      for (const comp of segments) {
        if (merged.length === 0) {
          merged.push({ ...comp });
          continue;
        }
        const last = merged[merged.length - 1];
        const xGap = comp.minX - last.maxX;
        const yOverlap = Math.max(0, Math.min(comp.maxY, last.maxY) - Math.max(comp.minY, last.minY));
        const minHeight = Math.min(comp.bh, last.bh);
        const shouldMerge = xGap <= mergeThreshold && yOverlap >= minHeight * 0.6 && // 需要更多重叠
        comp.area < avgWidth * avgHeight * 0.3 && // 面积不能太大
        last.area < avgWidth * avgHeight * 0.3;
        if (shouldMerge) {
          last.minX = Math.min(last.minX, comp.minX);
          last.maxX = Math.max(last.maxX, comp.maxX);
          last.minY = Math.min(last.minY, comp.minY);
          last.maxY = Math.max(last.maxY, comp.maxY);
          last.bw = last.maxX - last.minX + 1;
          last.bh = last.maxY - last.minY + 1;
          last.area += comp.area;
          last.cx = (last.minX + last.maxX) / 2;
          last.cy = (last.minY + last.maxY) / 2;
        } else {
          merged.push({ ...comp });
        }
      }
      return merged.sort((a, b) => a.cx - b.cx);
    },
    // 尝试分割连通域
    _trySplitComponent(comp, canvasW, canvasH) {
      const midX = Math.floor((comp.minX + comp.maxX) / 2);
      const leftComp = {
        minX: comp.minX,
        maxX: midX,
        minY: comp.minY,
        maxY: comp.maxY,
        bw: midX - comp.minX + 1,
        bh: comp.bh,
        area: comp.area / 2,
        // 估算
        cx: (comp.minX + midX) / 2,
        cy: comp.cy
      };
      const rightComp = {
        minX: midX + 1,
        maxX: comp.maxX,
        minY: comp.minY,
        maxY: comp.maxY,
        bw: comp.maxX - midX,
        bh: comp.bh,
        area: comp.area / 2,
        // 估算
        cx: (midX + 1 + comp.maxX) / 2,
        cy: comp.cy
      };
      if (leftComp.bw > 10 && rightComp.bw > 10) {
        return [leftComp, rightComp];
      }
      return [comp];
    },
    // 改进的数字分类算法
    _classifyDigitAdvanced(bin, w, h, comp) {
      const sw = 32, sh = 32;
      const scaled = new Uint8Array(sw * sh);
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const sx = Math.floor(comp.minX + x * comp.bw / sw);
          const sy = Math.floor(comp.minY + y * comp.bh / sh);
          if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
            scaled[y * sw + x] = bin[sy * w + sx];
          }
        }
      }
      const features = this._extractDigitFeatures(scaled, sw, sh);
      features.originalAspect = comp.bw / comp.bh;
      const result = this._classifyByFeatures(features, comp);
      return result;
    },
    // 提取数字特征
    _extractDigitFeatures(bin, w, h) {
      const features = {};
      let totalPixels = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bin[y * w + x]) {
            totalPixels++;
          }
        }
      }
      if (totalPixels === 0)
        return features;
      const regions = this._getRegionDensities(bin, w, h);
      features.topDensity = regions.top;
      features.bottomDensity = regions.bottom;
      features.leftDensity = regions.left;
      features.rightDensity = regions.right;
      features.centerDensity = regions.center;
      const holes = this._analyzeHoles(bin, w, h);
      features.holeCount = holes.count;
      features.holePositions = holes.positions;
      const projections = this._getProjections(bin, w, h);
      features.horizontalProjection = projections.horizontal;
      features.verticalProjection = projections.vertical;
      features.aspect = this._getAspectRatio(bin, w, h);
      features.compactness = this._getCompactness(bin, w, h);
      const endpoints = this._findEndpoints(bin, w, h);
      features.endpointCount = endpoints.length;
      const crossings = this._findCrossings(bin, w, h);
      features.crossingCount = crossings.length;
      return features;
    },
    // 基于特征分类 - 重新设计的算法
    _classifyByFeatures(features, comp) {
      var _a;
      const aspect = features.originalAspect || features.aspect || comp.bw / comp.bh;
      const topBottomRatio = features.topDensity / (features.bottomDensity || 0.01);
      const rightLeftRatio = features.rightDensity / (features.leftDensity || 0.01);
      if (features.holeCount >= 2)
        return 8;
      if (features.holeCount === 1) {
        const holeY = ((_a = features.holePositions[0]) == null ? void 0 : _a.y) || 0.5;
        if (holeY < 0.4 || topBottomRatio > 1.5 && aspect < 0.8) {
          return 9;
        }
        if (holeY > 0.6) {
          return 6;
        }
        if (aspect > 0.6 && aspect < 1.5) {
          return 0;
        }
        if (topBottomRatio > 1.8 && aspect < 0.8) {
          return 9;
        }
      }
      if (topBottomRatio >= 1.4 && rightLeftRatio >= 2.5) {
        if (features.crossingCount <= 5) {
          return 7;
        }
      }
      if (aspect < 0.6 && features.holeCount === 0 && rightLeftRatio < 2 && features.crossingCount <= 2) {
        return 1;
      }
      if (topBottomRatio >= 1.4 && aspect < 0.8 && rightLeftRatio < 2.5) {
        if (features.rightDensity > 0.3 && rightLeftRatio > 1.5) {
          return 9;
        }
      }
      if (topBottomRatio >= 1.4 && topBottomRatio < 2.5 && features.holeCount === 0 && aspect < 0.8) {
        if (rightLeftRatio < 2.5 && features.rightDensity > 0.3) {
          return 9;
        }
      }
      if (features.crossingCount >= 1 && features.crossingCount <= 8) {
        if (aspect > 0.8 && aspect < 1.5 && features.leftDensity > 0.15 && features.rightDensity > 0.15) {
          if (features.topDensity > 0.15 && features.bottomDensity > 0.15) {
            return 4;
          }
        }
      }
      if (features.bottomDensity > features.topDensity * 1.4) {
        const maxHorizontal = Math.max(...features.horizontalProjection || [0]);
        const avgHorizontal = (features.horizontalProjection || [0]).reduce((a, b) => a + b, 0) / features.horizontalProjection.length;
        if (maxHorizontal > avgHorizontal * 1.2) {
          return 2;
        }
      }
      if (rightLeftRatio > 1.5 && rightLeftRatio < 2.5 && features.crossingCount >= 1) {
        if (aspect > 0.6 && aspect < 1 && features.rightDensity > 0.25) {
          return 3;
        }
      }
      if (topBottomRatio > 1 && topBottomRatio < 2 && features.crossingCount >= 1 && features.holeCount === 0) {
        if (rightLeftRatio > 0.7 && rightLeftRatio < 1.8 && aspect > 0.5 && aspect < 0.9) {
          return 5;
        }
      }
      if (features.leftDensity > features.rightDensity * 1.4 && features.bottomDensity > 0.4) {
        if (features.holeCount === 0) {
          return 6;
        }
      }
      if (aspect < 0.6 && features.holeCount === 0 && rightLeftRatio < 2 && features.crossingCount <= 2) {
        return 1;
      }
      if (features.holeCount === 1 && aspect < 0.8) {
        return 9;
      }
      if (aspect > 1.2 && topBottomRatio > 1.5) {
        return 7;
      }
      if (features.bottomDensity > features.topDensity * 1.2) {
        return 2;
      }
      if (aspect < 0.5 && features.holeCount === 0 && features.crossingCount === 0) {
        return 1;
      }
      return null;
    },
    // 计算区域密度
    _getRegionDensities(bin, w, h) {
      const hw = Math.floor(w / 2), hh = Math.floor(h / 2);
      let top = 0, bottom = 0, left = 0, right = 0, center = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bin[y * w + x]) {
            if (y < hh)
              top++;
            if (y >= hh)
              bottom++;
            if (x < hw)
              left++;
            if (x >= hw)
              right++;
            if (x >= hw / 2 && x < w - hw / 2 && y >= hh / 2 && y < h - hh / 2)
              center++;
          }
        }
      }
      const area = w * h;
      return {
        top: top / (area / 2),
        bottom: bottom / (area / 2),
        left: left / (area / 2),
        right: right / (area / 2),
        center: center / (area / 4)
      };
    },
    // 分析洞的特征
    _analyzeHoles(bin, w, h) {
      const vis = new Uint8Array(w * h);
      const holes = [];
      for (let x = 0; x < w; x++) {
        if (!bin[x])
          this._floodFill(bin, vis, w, h, x, 0);
        const i2 = (h - 1) * w + x;
        if (!bin[i2])
          this._floodFill(bin, vis, w, h, x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        if (!bin[y * w])
          this._floodFill(bin, vis, w, h, 0, y);
        if (!bin[y * w + w - 1])
          this._floodFill(bin, vis, w, h, w - 1, y);
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!bin[i] && !vis[i]) {
            const hole = this._analyzeHole(bin, vis, w, h, x, y);
            if (hole.area > 3)
              holes.push(hole);
          }
        }
      }
      return {
        count: holes.length,
        positions: holes.map((h2) => ({ x: h2.cx / w, y: h2.cy / h2 }))
      };
    },
    // 分析单个洞
    _analyzeHole(bin, vis, w, h, startX, startY) {
      const stack = [startX, startY];
      let area = 0, sumX = 0, sumY = 0;
      while (stack.length > 0) {
        const y = stack.pop();
        const x = stack.pop();
        const i = y * w + x;
        if (x < 0 || y < 0 || x >= w || y >= h || vis[i] || bin[i])
          continue;
        vis[i] = 1;
        area++;
        sumX += x;
        sumY += y;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
      return {
        area,
        cx: area > 0 ? sumX / area : 0,
        cy: area > 0 ? sumY / area : 0
      };
    },
    // 洪水填充
    _floodFill(bin, vis, w, h, startX, startY) {
      const stack = [startX, startY];
      while (stack.length > 0) {
        const y = stack.pop();
        const x = stack.pop();
        const i = y * w + x;
        if (x < 0 || y < 0 || x >= w || y >= h || vis[i] || bin[i])
          continue;
        vis[i] = 1;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
    },
    // 获取投影特征
    _getProjections(bin, w, h) {
      const horizontal = new Array(h).fill(0);
      const vertical = new Array(w).fill(0);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bin[y * w + x]) {
            horizontal[y]++;
            vertical[x]++;
          }
        }
      }
      return { horizontal, vertical };
    },
    // 获取宽高比
    _getAspectRatio(bin, w, h) {
      let minX = w, maxX = 0, minY = h, maxY = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bin[y * w + x]) {
            if (x < minX)
              minX = x;
            if (x > maxX)
              maxX = x;
            if (y < minY)
              minY = y;
            if (y > maxY)
              maxY = y;
          }
        }
      }
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      return height > 0 ? width / height : 1;
    },
    // 获取紧密度
    _getCompactness(bin, w, h) {
      let area = 0, perimeter = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bin[y * w + x]) {
            area++;
            let isBoundary = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h || !bin[ny * w + nx]) {
                  isBoundary = true;
                  break;
                }
              }
              if (isBoundary)
                break;
            }
            if (isBoundary)
              perimeter++;
          }
        }
      }
      return perimeter > 0 ? 4 * Math.PI * area / (perimeter * perimeter) : 0;
    },
    // 找到端点
    _findEndpoints(bin, w, h) {
      const endpoints = [];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!bin[y * w + x])
            continue;
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0)
                continue;
              if (bin[(y + dy) * w + (x + dx)])
                neighbors++;
            }
          }
          if (neighbors === 1) {
            endpoints.push({ x, y });
          }
        }
      }
      return endpoints;
    },
    // 找到交叉点 - 更严格的算法
    _findCrossings(bin, w, h) {
      const crossings = [];
      for (let y = 3; y < h - 3; y++) {
        for (let x = 3; x < w - 3; x++) {
          if (!bin[y * w + x])
            continue;
          const upStrong = bin[(y - 1) * w + x] && bin[(y - 2) * w + x];
          const downStrong = bin[(y + 1) * w + x] && bin[(y + 2) * w + x];
          const leftStrong = bin[y * w + x - 1] && bin[y * w + x - 2];
          const rightStrong = bin[y * w + x + 1] && bin[y * w + x + 2];
          const strongConnections = [upStrong, downStrong, leftStrong, rightStrong].filter(Boolean).length;
          if (strongConnections >= 3) {
            const neighbors = [
              bin[(y - 1) * w + x - 1],
              bin[(y - 1) * w + x],
              bin[(y - 1) * w + x + 1],
              bin[y * w + x - 1],
              bin[y * w + x + 1],
              bin[(y + 1) * w + x - 1],
              bin[(y + 1) * w + x],
              bin[(y + 1) * w + x + 1]
            ];
            let segments = 0;
            let inSegment = false;
            for (let i = 0; i < 16; i++) {
              const idx = i % 8;
              const isOn = neighbors[idx];
              if (isOn && !inSegment) {
                segments++;
                inSegment = true;
              } else if (!isOn && inSegment) {
                inSegment = false;
              }
            }
            if (segments >= 3 && segments <= 4) {
              let thickLineScore = 0;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  if (bin[(y + dy) * w + (x + dx)])
                    thickLineScore++;
                }
              }
              if (thickLineScore <= 15) {
                crossings.push({ x, y });
              }
            }
          }
        }
      }
      const merged = [];
      for (const crossing of crossings) {
        let shouldAdd = true;
        for (const existing of merged) {
          const dist = Math.sqrt((crossing.x - existing.x) ** 2 + (crossing.y - existing.y) ** 2);
          if (dist < 8) {
            shouldAdd = false;
            break;
          }
        }
        if (shouldAdd) {
          merged.push(crossing);
        }
      }
      return merged;
    },
    // 数字键盘折叠切换
    toggleKeypad() {
      this.keypadExpanded = !this.keypadExpanded;
    },
    // 数字键盘交互方法
    onKeypadTap(digit) {
      if (this.keypadConfirmed || this.recognitionHandled)
        return;
      if (digit === ".") {
        if (this.keypadInput.includes("."))
          return;
        if (this.keypadInput === "") {
          this.keypadInput = "0.";
        } else {
          this.keypadInput += ".";
        }
        return;
      }
      if (this.keypadInput.length >= config.KEYPAD_CONFIG.features.maxInputLength)
        return;
      this.keypadInput += String(digit);
    },
    onKeypadDelete() {
      if (this.keypadConfirmed || this.recognitionHandled)
        return;
      if (this.keypadInput.length > 0) {
        this.keypadInput = this.keypadInput.slice(0, -1);
      }
    },
    onKeypadConfirm() {
      if (this.keypadConfirmed || this.recognitionHandled)
        return;
      if (!this.keypadInput)
        return;
      const inputNumber = parseFloat(this.keypadInput);
      const validation = config.KEYPAD_CONFIG.validation;
      if (isNaN(inputNumber) || inputNumber < validation.minValue || inputNumber > validation.maxValue) {
        {
          common_vendor.index.showToast({
            title: validation.errorMessage,
            icon: "none"
          });
        }
        return;
      }
      this.keypadConfirmed = true;
      this.recognizedDigit = this.keypadInput;
      common_vendor.index.__f__("log", "at pages/index/game.vue:2895", `⌨️  [Keypad] 数字键盘输入: "${this.keypadInput}" -> ${inputNumber}`);
      const compareNumber = Math.floor(inputNumber);
      setTimeout(() => {
        this.handleRecognitionResult(compareNumber);
      }, 400);
    },
    // 定时器清理方法（修复小程序环境未找到函数）
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
    clearCoverHideTimer() {
      if (this.coverHideTimer) {
        clearTimeout(this.coverHideTimer);
        this.coverHideTimer = null;
      }
    },
    clearAllWaveTimers() {
      if (this.startSlideTimer) {
        clearTimeout(this.startSlideTimer);
        this.startSlideTimer = null;
      }
      this.waveTimers.forEach((t) => clearTimeout(t));
      this.waveTimers = [];
    },
    clearEscapeTimers() {
      this.escapeTimers.forEach((t) => clearTimeout(t));
      this.escapeTimers = [];
      if (this.escapeDispatcherTimer) {
        clearTimeout(this.escapeDispatcherTimer);
        this.escapeDispatcherTimer = null;
      }
    },
    _startPadIdleWatcher() {
      this._stopPadIdleWatcher();
      this._idleWatchTimer = setInterval(() => {
        if (!this.showResult)
          return;
        if (this.isDrawing)
          return;
        if (this.recognitionHandled)
          return;
        if (this.recognizedDigit && String(this.recognizedDigit).length > 0)
          return;
        const idle = Date.now() - (this._lastDrawTs || 0);
        if (idle >= this._recognizeDelayMs) {
          this.recognizeDigit && this.recognizeDigit();
        }
      }, 250);
    },
    _stopPadIdleWatcher() {
      if (this._idleWatchTimer) {
        clearInterval(this._idleWatchTimer);
        this._idleWatchTimer = null;
      }
    },
    // 小程序环境：强制重绘画布
    _forceCanvasRedraw() {
      if (!this.ctx)
        return;
      try {
        if (typeof this.ctx.draw === "function") {
          this.ctx.draw(true);
          return;
        }
        if (typeof this.ctx.canvas !== "undefined" && this.ctx.canvas) {
          const canvas = this.ctx.canvas;
          if (canvas.requestAnimationFrame) {
            canvas.requestAnimationFrame(() => {
            });
          }
        }
        const currentStroke = this.ctx.strokeStyle;
        const currentWidth = this.ctx.lineWidth;
        this.ctx.strokeStyle = currentStroke;
        this.ctx.lineWidth = currentWidth;
      } catch (e) {
      }
    },
    // ==================== 分享复活功能 ====================
    /**
     * 加载分享复活数据
     * 功能：
     * 1. 从本地存储加载复活统计数据
     * 2. 检查日期，支持跨日期自动重置
     * 3. 异常处理，确保数据完整性
     */
    loadRevivalData() {
      try {
        const stored = common_vendor.index.getStorageSync(config.REVIVAL_CONFIG.limits.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (config.REVIVAL_CONFIG.limits.resetOnNewDay) {
            const today = (/* @__PURE__ */ new Date()).toDateString();
            if (data.lastResetDate !== today) {
              if (config.REVIVAL_CONFIG.debug.enableLogging) {
                common_vendor.index.__f__("log", "at pages/index/game.vue:3002", "🔄 [Revival] 新的一天，重置复活数据");
              }
              this.revivalData = {
                totalFailures: 0,
                totalRevivals: 0,
                lastResetDate: today,
                isReviving: false
              };
              this.saveRevivalData();
              return;
            }
          }
          this.revivalData = {
            totalFailures: data.totalFailures || 0,
            totalRevivals: data.totalRevivals || 0,
            lastResetDate: data.lastResetDate || (/* @__PURE__ */ new Date()).toDateString(),
            isReviving: false
          };
          if (config.REVIVAL_CONFIG.debug.enableLogging) {
            common_vendor.index.__f__("log", "at pages/index/game.vue:3023", "📊 [Revival] 加载复活数据:", this.revivalData);
          }
        } else {
          this.revivalData = {
            totalFailures: 0,
            totalRevivals: 0,
            lastResetDate: (/* @__PURE__ */ new Date()).toDateString(),
            isReviving: false
          };
          this.saveRevivalData();
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/game.vue:3036", "[Revival] 加载复活数据失败:", e);
        this.revivalData = {
          totalFailures: 0,
          totalRevivals: 0,
          lastResetDate: (/* @__PURE__ */ new Date()).toDateString(),
          isReviving: false
        };
      }
    },
    // 保存复活数据
    saveRevivalData() {
      try {
        const dataToStore = JSON.stringify({
          totalFailures: this.revivalData.totalFailures,
          totalRevivals: this.revivalData.totalRevivals,
          lastResetDate: this.revivalData.lastResetDate
        });
        common_vendor.index.setStorageSync(config.REVIVAL_CONFIG.limits.storageKey, dataToStore);
        if (config.REVIVAL_CONFIG.debug.enableLogging) {
          common_vendor.index.__f__("log", "at pages/index/game.vue:3074", "💾 [Revival] 保存复活数据:", this.revivalData);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/game.vue:3077", "[Revival] 保存复活数据失败:", e);
      }
    },
    // 检查是否可以使用分享复活
    canUseRevival() {
      const limits = config.REVIVAL_CONFIG.limits;
      if (this.revivalData.totalFailures >= limits.maxFailures) {
        {
          common_vendor.index.__f__("log", "at pages/index/game.vue:3090", `❌ [Revival] 失败次数已达上限 (${this.revivalData.totalFailures}/${limits.maxFailures})`);
        }
        return false;
      }
      return true;
    },
    // 记录失败
    recordFailure() {
      this.revivalData.totalFailures += 1;
      this.saveRevivalData();
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3114", `📈 [Revival] 记录失败，当前失败次数: ${this.revivalData.totalFailures}`);
      }
    },
    /**
     * 执行分享复活流程
     * 功能：
     * 1. 生成动态分享内容
     * 2. 直接调用微信分享API
     * 3. 处理分享结果和复活逻辑
     * 
     * 注意：移除了复杂的环境检测，直接使用分享API，让微信自己处理环境差异
     */
    shareForRevival() {
      if (!this.canUseRevival()) {
        common_vendor.index.showToast({
          title: config.REVIVAL_CONFIG.share.limitMessage,
          icon: "none",
          duration: 3e3
        });
        return;
      }
      this.revivalData.isReviving = true;
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3145", "🔗 [Revival] 开始分享复活流程");
      }
    },
    // 🔧 新增：处理重新开始游戏
    restartGame() {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3152", "🔄 [Restart] 用户选择重新开始游戏");
      }
      this.revivalData.isReviving = false;
      this.currentLevel = 1;
      this.clearRevealState && this.clearRevealState();
      this.startCountdown && this.startCountdown();
    },
    // 🔧 新增：处理退出游戏
    quitGame() {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3169", "🚪 [Quit] 用户选择退出游戏");
      }
      this.revivalData.isReviving = false;
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    },
    // 获取动态分享内容
    getShareContent() {
      const shareConfig = config.REVIVAL_CONFIG.share;
      let title = shareConfig.title;
      let desc = shareConfig.desc;
      if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled) {
        const dynamicConfig = shareConfig.dynamicContent;
        if (dynamicConfig.levelSpecific && dynamicConfig.levelSpecific[this.currentLevel]) {
          const levelContent = dynamicConfig.levelSpecific[this.currentLevel];
          title = levelContent.title;
          desc = levelContent.desc;
        } else {
          title = title.replace("{level}", this.currentLevel);
          desc = desc.replace("{level}", this.currentLevel);
          if (dynamicConfig.failureMessages && dynamicConfig.failureMessages.length > 0) {
            const failures = this.revivalData.totalFailures;
            let messageIndex = 0;
            if (failures <= 2)
              messageIndex = 0;
            else if (failures <= 5)
              messageIndex = 1;
            else if (failures <= 10)
              messageIndex = 2;
            else
              messageIndex = 3;
            if (messageIndex < dynamicConfig.failureMessages.length) {
              desc += ` ${dynamicConfig.failureMessages[messageIndex]}`;
            }
          }
        }
      } else {
        title = title.replace("{level}", this.currentLevel);
        desc = desc.replace("{level}", this.currentLevel);
      }
      return {
        title,
        desc,
        path: shareConfig.path,
        imageUrl: shareConfig.imageUrl
      };
    },
    // 分享成功回调
    onShareSuccess() {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3234", "✅ [Revival] 分享成功");
      }
      this.revivalData.totalRevivals += 1;
      this.revivalData.isReviving = false;
      this.saveRevivalData();
      common_vendor.index.showToast({
        title: config.REVIVAL_CONFIG.share.successMessage,
        icon: "success",
        duration: 2e3
      });
      setTimeout(() => {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3251", `🎉 [Revival] 复活成功，继续第${this.currentLevel}关！`);
        this.startCountdown && this.startCountdown();
      }, 2e3);
    },
    // 分享失败回调
    onShareFail(err) {
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3259", "❌ [Revival] 分享失败:", err);
      }
      this.revivalData.isReviving = false;
      common_vendor.index.showToast({
        title: config.REVIVAL_CONFIG.share.failMessage,
        icon: "none",
        duration: 2e3
      });
    },
    /**
     * 显示分享复活弹窗
     * 功能：
     * 1. 计算剩余复活次数和失败次数
     * 2. 生成动态失败文案（根据失败次数）
     * 3. 生成动态弹窗标题（根据关卡）
     * 4. 显示复活选择弹窗
     * 5. 处理用户选择（分享复活 vs 重新开始）
     */
    showRevivalModal(failedLevel) {
      this._modalShown = true;
      const limits = config.REVIVAL_CONFIG.limits;
      limits.maxFailures - this.revivalData.totalFailures;
      const shareConfig = config.REVIVAL_CONFIG.share;
      if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled && shareConfig.dynamicContent.failureMessages) {
        this.revivalData.totalFailures;
      }
      if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled && shareConfig.dynamicContent.levelSpecific) {
        const levelContent = shareConfig.dynamicContent.levelSpecific[failedLevel];
        if (levelContent && levelContent.title) {
          levelContent.title;
        }
      }
      this.revivalData.isReviving = true;
      this._modalShown = false;
      {
        common_vendor.index.__f__("log", "at pages/index/game.vue:3331", "📱 [Revival] 分享复活界面已显示，等待用户点击分享按钮");
      }
    },
    // 显示游戏结束弹窗（不能复活时）
    showGameOverModal(failedLevel) {
      this._modalShown = true;
      let content = "游戏结束！";
      {
        const limits = config.REVIVAL_CONFIG.limits;
        if (this.revivalData.totalFailures >= limits.maxFailures) {
          content += `
您已达到最大失败次数限制 (${limits.maxFailures}次)`;
        }
      }
      content += "\n是否从第1关重新开始？";
      common_vendor.index.showModal({
        title: `第${failedLevel}关失败`,
        content,
        confirmText: "重新开始",
        cancelText: "退出",
        showCancel: true,
        success: (res) => {
          this._modalShown = false;
          if (res.confirm) {
            this.clearRevealState && this.clearRevealState();
            this.startCountdown && this.startCountdown();
          } else if (res.cancel) {
            common_vendor.index.reLaunch({ url: "/pages/index/index" });
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/game.vue:3368", `[Game] Modal failed:`, err);
          this._modalShown = false;
          this.clearRevealState && this.clearRevealState();
          this.startCountdown && this.startCountdown();
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.showTitle
  }, $data.showTitle ? {} : {}, {
    b: !$data.showTitle && $data.showResult && $data.finalCount !== null
  }, !$data.showTitle && $data.showResult && $data.finalCount !== null ? {} : {}, {
    c: $data.count > 0
  }, $data.count > 0 ? {
    d: common_vendor.t($data.count),
    e: $data.countdownColor
  } : {}, {
    f: !$data.showTitle && !$data.showResult
  }, !$data.showTitle && !$data.showResult ? {
    g: common_vendor.t($data.currentLevel)
  } : {}, {
    h: $data.peopleSrcFixed,
    i: $data.peopleSrcFixed,
    j: $data.peopleSrcFixed,
    k: $data.peopleSrcFixed,
    l: $data.peopleSrcFixed,
    m: !$data.peopleHidden,
    n: $data.homeSrcFixed,
    o: $data.coverVisible ? 1 : "",
    p: $data.houseLift ? 1 : "",
    q: $data.coverVisible ? 1 : "",
    r: $data.houseLift ? 1 : "",
    s: common_vendor.f($data.movingPeople, (p, k0, i0) => {
      return {
        a: p.id,
        b: p.alive,
        c: p.run ? 1 : "",
        d: $options.leftPx(p.left)
      };
    }),
    t: $data.peopleSrcFixed,
    v: common_vendor.f($data.escapingPeople, (e, k0, i0) => {
      return {
        a: e.id,
        b: common_vendor.n(e.cls),
        c: $options.leftPx(e.left),
        d: $options.leftPx(e.top),
        e: e.z,
        f: e.duration + "ms"
      };
    }),
    w: $data.peopleSrcFixed,
    x: $data.showResult && $data.inputMode === 0
  }, $data.showResult && $data.inputMode === 0 ? common_vendor.e({
    y: common_vendor.o((...args) => $options.onCanvasTouchStart && $options.onCanvasTouchStart(...args)),
    z: common_vendor.o((...args) => $options.onCanvasTouchMove && $options.onCanvasTouchMove(...args)),
    A: common_vendor.o((...args) => $options.onCanvasTouchEnd && $options.onCanvasTouchEnd(...args)),
    B: common_vendor.o((...args) => $options.onCanvasTouchEnd && $options.onCanvasTouchEnd(...args)),
    C: common_assets._imports_0$1,
    D: common_vendor.o((...args) => $options.clearCanvas && $options.clearCanvas(...args)),
    E: $data.recognizedDigit !== null
  }, $data.recognizedDigit !== null ? {
    F: common_vendor.t($data.recognizedDigit)
  } : {}, {
    G: $data.showConfirmationCountdown
  }, $data.showConfirmationCountdown ? {
    H: common_vendor.t($data._confirmationCountdown)
  } : {}) : {}, {
    I: $data.showResult && $data.inputMode === 1
  }, $data.showResult && $data.inputMode === 1 ? common_vendor.e({
    J: common_assets._imports_1,
    K: !$data.keypadExpanded ? 1 : "",
    L: common_vendor.o((...args) => $options.toggleKeypad && $options.toggleKeypad(...args)),
    M: common_vendor.t($data.keypadInput || "请输入数字"),
    N: $data.keypadExpanded
  }, $data.keypadExpanded ? {
    O: common_vendor.o(($event) => $options.onKeypadTap(1)),
    P: common_vendor.o(($event) => $options.onKeypadTap(2)),
    Q: common_vendor.o(($event) => $options.onKeypadTap(3)),
    R: common_vendor.o(($event) => $options.onKeypadTap(4)),
    S: common_vendor.o(($event) => $options.onKeypadTap(5)),
    T: common_vendor.o(($event) => $options.onKeypadTap(6)),
    U: common_vendor.o(($event) => $options.onKeypadTap(7)),
    V: common_vendor.o(($event) => $options.onKeypadTap(8)),
    W: common_vendor.o(($event) => $options.onKeypadTap(9)),
    X: common_vendor.o(($event) => $options.onKeypadTap(0)),
    Y: common_vendor.o(($event) => $options.onKeypadTap(".")),
    Z: common_assets._imports_2,
    aa: common_vendor.o((...args) => $options.onKeypadDelete && $options.onKeypadDelete(...args)),
    ab: common_vendor.o((...args) => $options.onKeypadConfirm && $options.onKeypadConfirm(...args))
  } : {}) : {}, {
    ac: $data.revealVisible
  }, $data.revealVisible ? {
    ad: common_vendor.f($data.revealPeople, (rp, idx, i0) => {
      return {
        a: common_vendor.n(idx <= $data.revealActiveIndex ? "person-image-red" : "person-image"),
        b: idx,
        c: idx <= $data.revealActiveIndex ? 1 : "",
        d: $options.revealLeftRpx(idx) + "rpx",
        e: $options.revealTopRpx(idx) + "rpx"
      };
    }),
    ae: $data.peopleSrcFixed,
    af: common_vendor.t($data.revealCountNum)
  } : {}, {
    ag: $data.revivalData.isReviving
  }, $data.revivalData.isReviving ? {
    ah: common_vendor.t($data.currentLevel),
    ai: common_vendor.o((...args) => $options.restartGame && $options.restartGame(...args)),
    aj: common_vendor.o((...args) => $options.quitGame && $options.quitGame(...args))
  } : {}, {
    ak: common_vendor.s($options.rootStyle)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/game.js.map
