"use strict";
/**
 * ================== 猜小人游戏配置文件 ==================
 * Copyright (c) 2025 Tavern (QQ: 2196008384)
 * 
 * 本文件包含游戏的所有配置参数，是游戏核心逻辑的重要组成部分
 * 
 * @author Tavern
 * @contact QQ: 2196008384
 * @license MIT
 * @version 1.0.0
 * @since 2025
 * 
 * ================== 游戏配置说明 ==================
 * 
 * 这个文件包含了游戏的所有可配置参数，通过修改这些配置可以调整游戏的各种行为
 * 
 * 📋 配置文件结构：
 * ├── 基础游戏设置 (PREPARE_SECONDS, INPUT_MODE 等)
 * ├── 游戏机制配置 (ENTRY_CONFIG, ESCAPE_CONFIG, LEVEL_CONFIG 等)
 * ├── 视觉效果配置 (PEOPLE_CONFIG, HOUSE_CONFIG, UI_CONFIG 等)
 * ├── 输入系统配置 (CANVAS_CONFIG, KEYPAD_CONFIG)
 * ├── 高级功能配置 (REVIVAL_CONFIG, AUDIO_CONFIG 等)
 * └── 调试和性能配置 (DEBUG_CONFIG, PERFORMANCE_CONFIG 等)
 * 
 * ⚠️  重要说明：配置实现状态
 * ✅ 已完全实现：PREPARE_SECONDS, INPUT_MODE, BASE_PEOPLE_IN_HOUSE, SLIDE_DURATION_MS, 
 *                WAVE_INTERVAL_MS, ANIMATION_START_DELAY, ENTRY_CONFIG, ESCAPE_CONFIG, 
 *                LEVEL_CONFIG, BALANCE_CONFIG, PEOPLE_CONFIG (包含进入速度关卡增长), HOUSE_CONFIG, 
 *                CANVAS_CONFIG, KEYPAD_CONFIG, REVIVAL_CONFIG
 * ⚠️  部分实现：DEBUG_CONFIG.logging.enableLogging, FLOW_CONFIG.levels (部分)
 * ❌ 未实现：AUDIO_CONFIG, UI_CONFIG, PERFORMANCE_CONFIG, AI_CONFIG, 
 *           DEBUG_CONFIG (大部分), FLOW_CONFIG (大部分)
 *
 * 📝 使用说明：
 * - 标记为"已完全实现"的配置可以直接修改并生效
 * - 标记为"未实现"的配置项虽然在此文件中定义，但在game.vue中并未使用
 * - 如需启用未实现的功能，需要在game.vue中添加相应的实现代码
 * 
 * 🎯 快速配置指南：
 * - 调整游戏难度：修改 LEVEL_CONFIG
 * - 调整动画速度：修改 SLIDE_DURATION_MS 和 PEOPLE_CONFIG.animations
 * - 调整进入速度关卡增长：修改 PEOPLE_CONFIG.animations.slideIn.speed.levelProgression
 * - 调整逃离速度关卡增长：修改 PEOPLE_CONFIG.animations.escape.speed.levelProgression
 * - 调整输入方式：修改 INPUT_MODE (0=画板, 1=键盘)
 * - 调整分享复活：修改 REVIVAL_CONFIG
 */
const PREPARE_SECONDS = 3;
const INPUT_MODE = 1;
const BASE_PEOPLE_IN_HOUSE = 5;
const SLIDE_DURATION_MS = 6e3;
const WAVE_INTERVAL_MS = 80;
const ANIMATION_START_DELAY = 16;
const ENTRY_CONFIG = {
  /**
   * 第一波小人的固定配置
   * 第一波是玩家看到的第一个进入动画，需要相对稳定
   */
  firstWave: {
    count: 3,
    // 第一波小人数量（固定）
    grouped: true,
    // 是否成组移动（true=一起移动，false=分散移动）
    delay: 100
    // 房屋遮盖后多久开始第一波（毫秒）
  },
  /**
   * 后续波次的动态配置
   * 后续波次会根据这些规则随机生成，增加游戏的不可预测性
   */
  subsequentWaves: {
    countRange: [2, 3, 4],
    // 每波可能的小人数量范围
    groupedThreshold: 3,
    // 大于等于此数量时强制成组移动
    groupedProbability: 0.5,
    // 小于阈值时成组移动的概率
    /**
     * 成组移动时的位置偏移配置
     * - 键：小人数量
     * - 值：每个小人相对于基准位置的偏移量（rpx）
     * - 负值表示向左偏移，正值表示向右偏移
     */
    groupOffsets: {
      2: [-60, 60],
      // 2人时：左右分开，总间距120rpx
      3: [-100, 0, 100],
      // 3人时：左中右排列，间距100rpx每段
      4: [-150, -50, 50, 150]
      // 4人时：均匀分布，间距100rpx每段
    }
  },
  /**
   * 独立模式（非成组）的间隔配置
   * 当小人不成组移动时，控制每个小人之间的时间间隔
   */
  independentInterval: {
    minMs: 160,
    // 最小间隔时间（毫秒）
    durationRatio: 0.35
    // 相对于总动画时长的比例
  }
};
const ESCAPE_CONFIG = {
  /**
   * 逃离时机控制
   * 决定小人什么时候开始逃离
   */
  timing: {
    startAfterFirstWave: true,
    // 是否在第一波进入后开始安排逃离
    executeAfterAllWaves: false
    // 是否等所有波次完成后才执行逃离
  },
  /**
   * 逃离方向分配策略
   * 小人可以向上或向右逃离，这里控制方向的分配规则
   */
  directionProbability: {
    mode: "balanced",
    // 分配模式：
    // - 'balanced': 平衡分配（尽量均匀）
    // - 'random': 完全随机
    // - 'custom': 自定义概率
    upProbability: 0.5,
    // 向上逃离的概率（仅在custom模式生效）
    minUpCount: 1,
    // 最少向上逃离的小人数量
    minRightCount: 1
    // 最少向右逃离的小人数量
  },
  /**
   * 逃离动画间隔配置
   * 控制多个小人逃离时的时间间隔
   */
  interval: {
    minMs: 200,
    // 最小间隔时间（毫秒）
    durationRatio: 0.4,
    // 相对于动画总时长的比例
    cleanupDelay: 100
    // 动画完成后的清理延迟
  }
};
const LEVEL_CONFIG = {
  /**
   * 进入波数增长机制
   * 控制每关有多少波小人进入房屋
   */
  waves: {
    baseWaves: 3,
    // 第一关的基础波数
    growthType: "linear",
    // 增长类型：
    // - 'linear': 线性增长（每关+固定数量）
    // - 'exponential': 指数增长（越来越快）
    // - 'custom': 自定义每关的波数
    linearGrowth: 1,
    // 线性增长时每关增加的波数
    maxWaves: 10,
    // 波数上限（防止无限增长）
    /**
     * 自定义波数配置（当growthType='custom'时使用）
     * 数组索引对应关卡数（从第1关开始）
     */
    customWaves: [3, 4, 5, 6, 7, 8, 9, 10]
  },
  /**
   * 逃离人数增长机制
   * 控制每关有多少小人逃离房屋
   */
  escapes: {
    baseEscapes: 5,
    // 第一关的基础逃离人数
    growthType: "random",
    // 增长类型：
    // - 'linear': 线性增长
    // - 'random': 随机范围增长
    // - 'custom': 自定义每关的逃离数
    randomRange: [2, 5],
    // 随机增长时的范围
    linearGrowth: 3,
    // 线性增长时每关增加的数量
    maxEscapes: 20,
    // 逃离人数上限
    /**
     * 自定义逃离数配置（当growthType='custom'时使用）
     * 数组索引对应关卡数（从第1关开始）
     */
    customEscapes: [5, 8, 12, 16, 20]
  }
};
const BALANCE_CONFIG = {
  /**
   * 答案计算规则
   * 定义最终答案的计算方式
   */
  calculation: {
    formula: "base + entered - escaped",
    // 计算公式：初始+进入-逃离
    allowNegative: false
    // 是否允许负数结果（通常不允许）
  },
  /**
   * 游戏流程时间控制
   * 控制各个阶段之间的过渡时间
   */
  flow: {
    autoProgressDelay: 400,
    // 自动进入下一步的延迟（毫秒）
    confirmationCountdown: 2,
    // 确认倒计时秒数
    revealAnimationStep: 120
    // 揭示阶段每个小人高亮的间隔（毫秒）
  }
};
const UI_CONFIG = {
  // 颜色主题 (当前未实现)
  colors: {
    primary: "#4285f4",
    // 主色调 (当前未实现)
    secondary: "#1976d2",
    // 次要色调 (当前未实现)
    success: "#4caf50",
    // 成功色 (当前未实现)
    warning: "#ff9800",
    // 警告色 (当前未实现)
    error: "#e53935",
    // 错误色 (当前未实现)
    background: "#ffffff",
    // 背景色 (当前未实现)
    text: "#333333",
    // 文字色 (当前未实现)
    border: "#e5e5e5"
    // 边框色 (当前未实现)
  },
  // 字体配置 (当前未实现)
  fonts: {
    small: "24rpx",
    // (当前未实现)
    medium: "28rpx",
    // (当前未实现)
    large: "36rpx",
    // (当前未实现)
    xlarge: "48rpx",
    // (当前未实现)
    title: "64rpx",
    // (当前未实现)
    countdown: "120rpx"
    // (当前未实现)
  },
  // 动画配置 (当前未实现)
  animations: {
    enableTransitions: true,
    // 是否启用过渡动画 (当前未实现)
    enableParticles: false,
    // 是否启用粒子效果 (当前未实现)
    transitionDuration: "300ms",
    // 过渡动画时长 (当前未实现)
    easing: "ease-out"
    // 缓动函数 (当前未实现)
  },
  // 布局配置
  layout: {
    containerPadding: "24rpx",
    // 容器内边距 (当前未实现)
    borderRadius: "16rpx",
    // 圆角大小 (当前未实现)
    shadowIntensity: 0.08,
    // 阴影强度 (当前未实现)
    // 游戏区域位置
    gameAreaTop: "44vh",
    // 初始小人簇顶部位置
    peopleAreaTop: "49vh",
    // 小人活动区域顶部位置（滑动、逃离、揭示）
    // 标题和指示器位置
    titleTop: "40rpx",
    // 标题顶部位置
    countdownTop: "110rpx",
    // 倒计时顶部位置
    levelIndicatorTop: "40rpx",
    // 关卡指示器顶部位置
    levelIndicatorRight: "40rpx",
    // 关卡指示器右侧位置
    revealNumberTop: "76vh",
    // 揭示数字顶部位置
    // 容器尺寸
    slideAreaWidth: "520rpx",
    // 滑动区域宽度
    slideAreaHeight: "140rpx",
    // 滑动区域高度
    slideAreaMarginLeft: "-260rpx",
    // 滑动区域左边距
    escapeAreaWidth: "550rpx",
    // 逃离区域宽度
    escapeAreaHeight: "280rpx",
    // 逃离区域高度
    escapeAreaMarginLeft: "-275rpx",
    // 逃离区域左边距
    revealAreaWidth: "550rpx",
    // 揭示区域宽度
    revealAreaHeight: "280rpx",
    // 揭示区域高度
    revealAreaMarginLeft: "-275rpx"
    // 揭示区域左边距
  }
};
const CANVAS_CONFIG = {
  // 画布尺寸
  dimensions: {
    width: 686,
    // 画布宽度(rpx)
    height: 320,
    // 画布高度(rpx)
    devicePixelRatio: "auto"
    // 设备像素比，'auto'为自动检测
  },
  // 绘画样式
  drawing: {
    lineWidth: 14,
    // 线条宽度
    strokeStyle: "#111",
    // 线条颜色
    lineCap: "round",
    // 线条端点样式
    lineJoin: "round",
    // 线条连接样式
    backgroundColor: "#f7f7f7"
    // 背景颜色
  },
  // 识别配置
  recognition: {
    recognizeDelayMs: 1200,
    // 识别延迟时间
    forceRecognizeMs: 3e3,
    // 强制识别时间
    confirmationCountdown: 2,
    // 确认倒计时秒数
    minStrokeArea: 50,
    // 最小笔画面积
    enableAutoRecognition: true,
    // 是否启用自动识别
    enableConfirmationCountdown: true
    // 是否启用确认倒计时
  },
  // 图像处理参数
  imageProcessing: {
    morphologyRadius: 2,
    // 形态学处理半径
    otsuThreshold: true,
    // 是否使用Otsu自适应阈值
    minComponentArea: 50,
    // 最小连通域面积
    noiseFilterThreshold: 2e-3
    // 噪声过滤阈值
  }
};
const KEYPAD_CONFIG = {
  // 键盘样式
  appearance: {
    backgroundColor: "white",
    // 背景颜色
    borderColor: "#e5e5e5",
    // 边框颜色
    textColor: "#333",
    // 文字颜色
    fontSize: "48rpx",
    // 字体大小
    buttonHeight: "120rpx"
    // 按钮高度
  },
  // 功能配置
  features: {
    enableDecimal: true,
    // 是否启用小数点
    maxInputLength: 5,
    // 最大输入长度
    allowNegative: false,
    // 是否允许负数
    autoAddZeroForDecimal: true,
    // 小数点前自动添加0
    enableFoldButton: true,
    // 是否启用折叠按钮
    defaultExpanded: true
    // 默认是否展开
  },
  // 验证规则
  validation: {
    minValue: 0,
    // 最小值
    maxValue: 100,
    // 最大值
    decimalPlaces: 2,
    // 小数位数
    showToastOnError: true,
    // 错误时显示提示
    errorMessage: "请输入0-100之间的数字"
    // 错误提示信息
  }
};
const PEOPLE_CONFIG = {
  // 小人外观
  appearance: {
    defaultImage: "/static/people.png",
    // 默认小人图片
    size: "165rpx",
    // 小人大小
    revealSize: "110rpx",
    // 揭示阶段小人大小
    revealRedColor: "#e53935"
    // 揭示阶段红色
  },
  // 动画效果
  animations: {
    // 进入动画
    slideIn: {
      startPosition: "-1000rpx",
      // 起始位置
      endPosition: "180rpx",
      // 结束位置（完全穿过房子，到达房子后面）
      disappearPosition: "999999rpx",
      // 禁用强制消失（设置为很大的值）
      disappearAt: 100,
      // 只在动画100%完成时才处理（禁用中途消失）
      enableFadeOut: false,
      // 禁用淡出，使用自然遮挡
      enableInstantDisappear: false,
      // 禁用瞬间消失效果
      // 速度控制
      speed: {
        // 基础配置
        base: 6e3,
        // 基础动画时长 (毫秒) - 第1关的时长
        minDuration: 1500,
        // 最小动画时长
        maxDuration: 9e3,
        // 最大动画时长
        // 关卡速度增长配置
        levelProgression: {
          mode: "fixed",
          // 'percentage'(百分比), 'fixed'(固定减少), 'custom'(自定义)
          // 百分比模式：每关减少的百分比
          percentageDecrease: 8,
          // 每关减少8%（6000ms -> 5520ms -> 5078.4ms -> ...）
          // 固定减少模式：每关减少的固定毫秒数
          fixedDecrease: 400,
          // 每关减少400ms（6000ms -> 5600ms -> 5200ms -> ...）
          // 自定义模式：为每个关卡指定具体时长
          customDurations: [6e3, 5600, 5200, 4800, 4400, 4e3, 3600, 3200, 2800, 2400],
          // 第1-10关的时长
          // 关卡速度变化曲线
          curve: "linear",
          // 'linear'(线性), 'exponential'(指数), 'logarithmic'(对数)
          // 指数和对数曲线的强度参数
          curveIntensity: 1.3
          // 曲线强度（>1加速变化，<1减缓变化）
        }
      }
    },
    // 逃离动画
    escape: {
      // 起始位置（从房子内部开始，避免透过窗户看见）
      startPositions: {
        up: { left: 343, top: -13 },
        // 向上逃离：从房子左侧内部开始，更靠上
        right: { left: 380, top: -1 }
        // 向右逃离：从房子右侧内部开始
      },
      upDistance: "-100vh",
      // 向上逃离距离
      rightDistance: "100vw",
      // 向右逃离距离
      fadeInDuration: "15%",
      // 淡入持续时间百分比
      fadeOutStart: "85%",
      // 淡出开始时间百分比
      finalOpacity: 0.8,
      // 最终透明度
      // 速度控制
      speed: {
        // 基础配置
        base: 15e3,
        // 基础动画时长 (毫秒) - 第1关的时长 (降低3倍速度)
        minDuration: 600,
        // 最小动画时长 (相应提高)
        maxDuration: 8e3,
        // 最大动画时长 (相应提高)
        // 关卡速度增长配置
        levelProgression: {
          mode: "fixed",
          // 'percentage'(百分比), 'fixed'(固定减少), 'custom'(自定义)
          // 百分比模式：每关减少的百分比
          percentageDecrease: 5,
          // 每关减少5%（3000ms -> 2850ms -> 2707.5ms -> ...）
          // 固定减少模式：每关减少的固定毫秒数
          fixedDecrease: 300,
          // 每关减少150ms（3000ms -> 2850ms -> 2700ms -> ...）
          // 自定义模式：为每个关卡指定具体时长
          customDurations: [3e3, 2850, 2700, 2550, 2400, 2250, 2100, 1950, 1800, 1650],
          // 第1-10关的时长
          // 关卡速度变化曲线
          curve: "linear",
          // 'linear'(线性), 'exponential'(指数), 'logarithmic'(对数)
          // 指数和对数曲线的强度参数
          curveIntensity: 1.2
          // 曲线强度（>1加速变化，<1减缓变化）
        },
        // 方向差异配置
        directionDifference: {
          enabled: true,
          // 是否启用方向差异
          upMultiplier: 3,
          // 向上逃离速度倍数 (值越大越慢)
          rightMultiplier: 1
          // 向右逃离速度倍数 (值越大越慢)
          // 速度控制说明：
          // - 1.0 = 标准速度
          // - 0.5 = 快2倍 (500ms基础变成250ms)  
          // - 2.0 = 慢2倍 (500ms基础变成1000ms)
          // - 建议范围: 0.3 - 3.0
          // 常用配置示例：
          // 向上快，向右慢: upMultiplier: 0.8, rightMultiplier: 1.2
          // 速度相同: upMultiplier: 1.0, rightMultiplier: 1.0  
          // 向上慢，向右快: upMultiplier: 1.5, rightMultiplier: 0.8
        }
      }
    }
  },
  // 排列配置
  layout: {
    // 初始5人排列
    initialCluster: {
      rowTopMarginBottom: "-40rpx",
      // 上排底边距
      personOverlapMargin: "-40rpx"
      // 人物重叠边距
    },
    // 揭示阶段排列
    reveal: {
      containerWidth: "550rpx",
      // 容器宽度
      overlapRatioX: 0.6,
      // 水平重叠比例
      overlapRatioY: 0.7,
      // 垂直重叠比例
      maxColumns: 8,
      // 最大列数
      minColumns: 5
      // 最小列数
    }
  }
};
const HOUSE_CONFIG = {
  // 房屋图片
  image: "/static/home.png",
  // 房屋图片路径
  width: "560rpx",
  // 房屋宽度
  height: "340rpx",
  // 房屋高度（用于透明遮罩层碰撞检测）
  // 透明遮罩层配置
  mask: {
    // 遮罩区域的有效检测区域（针对矢量图房子的精确边界）
    collisionArea: {
      left: "200rpx",
      // 左边界偏移
      right: "200rpx",
      // 右边界偏移
      top: "120rpx",
      // 上边界偏移
      bottom: "50rpx"
      // 下边界偏移
    },
    // 渐变消失配置
    fadeOut: {
      enabled: true,
      // 启用渐变消失
      maxDepth: 5,
      // 小人完全进入遮罩层需要的深度（rpx）
      gradientWidth: 20,
      // 渐变边缘的宽度（百分比）
      direction: "right"
      // 渐变方向：'right'从右侧开始消失（小人进入房子的正确方向）
    }
  },
  // 动画时机
  animations: {
    // 初始下降
    initialDrop: {
      fromTop: "-70vh",
      // 起始位置
      toTop: "25vh",
      // 下降到的位置（向上调整了3vh）
      duration: "300ms",
      // 动画时长
      easing: "ease"
      // 缓动函数
    },
    // 揭示上升
    revealLift: {
      toTop: "-120vh",
      // 上升到的位置
      duration: "700ms",
      // 动画时长
      easing: "ease-in",
      // 缓动函数
      delay: 16
      // 延迟时间
    },
    // 遮盖时机
    covering: {
      hideDelay: 350,
      // 隐藏小人延迟
      startDelay: 300
      // 开始第一波延迟
    }
  }
};
const REVIVAL_CONFIG = {
  /**
   * 基础开关设置
   */
  enabled: true,
  // 是否启用分享复活功能（总开关）
  /**
   * 复活限制配置
   * 防止玩家无限制使用复活功能，保持游戏挑战性
   */
  limits: {
    maxFailures: 100,
    // 累计失败多少次后不再能分享复活
    maxRevivals: 0,
    // 每日最大复活次数（0为无限制）
    resetOnNewDay: true,
    // 是否每天重置失败和复活计数
    storageKey: "gamedata"
    // 本地存储数据的键名
  },
  /**
   * 分享内容配置
   * 控制分享到微信时显示的内容和行为
   */
  share: {
    /**
     * 基础分享内容（默认情况下使用）
     */
    title: "别笑，你上你也过不了第二关",
    // 默认分享标题
    desc: "这个烧脑游戏太难了！快来救救我！",
    // 默认分享描述
    path: "/pages/index/index",
    // 分享页面路径
    imageUrl: "/static/share.png",
    // 分享图片（可选）
    /**
     * 动态分享内容系统
     * 根据玩家当前状态（关卡、失败次数等）生成个性化分享内容
     */
    dynamicContent: {
      enabled: true,
      // 是否启用动态内容（关闭则使用基础内容）
      /**
       * 特定关卡的分享文案
       * 为重要关卡节点设计特殊的分享内容，增加传播效果
       */
      levelSpecific: {
        1: {
          title: "连第1关都过不了？😅",
          desc: "这个记忆力游戏第1关就把我难住了，你能帮我一下吗？"
        },
        3: {
          title: "第3关太变态了！🤯",
          desc: "小人越来越多，我的脑子快转不过来了！"
        },
        5: {
          title: "挑战第5关失败！😭",
          desc: "据说能到第5关的人只有10%，我已经很不错了吧？"
        },
        10: {
          title: "第10关终极挑战！🔥",
          desc: "我竟然能到第10关！但是这里真的太难了，救命！"
        }
      },
      /**
       * 根据失败次数的动态文案
       * 数组索引对应失败次数范围：[0]=1-2次, [1]=3-5次, [2]=6-10次, [3]=10次以上
       */
      failureMessages: [
        "第一次失败，还有机会！",
        // 失败1-2次
        "连续失败了，需要支援！",
        // 失败3-5次
        "我快要放弃了...",
        // 失败6-10次
        "拯救一个即将崩溃的玩家！"
        // 失败10次以上
      ]
    },
    /**
     * 分享结果提示消息
     */
    successMessage: "🎉 分享成功！好友的支持让你获得了复活机会！",
    failMessage: "😭 分享失败，请重试一下吧",
    limitMessage: "💔 复活次数已用完，是时候展现真正的实力了！"
  },
  /**
   * UI界面配置
   * 控制复活功能在界面上的显示效果
   */
  ui: {
    buttonText: "分享复活",
    // 复活按钮显示的文字
    buttonColor: "#ff6b35",
    // 复活按钮的背景颜色
    showRevivalCount: true,
    // 是否在弹窗中显示剩余复活次数
    showFailureCount: false,
    // 是否在弹窗中显示累计失败次数
    animateButton: true
    // 是否启用按钮动画效果
  },
  /**
   * 调试和开发配置
   * 用于开发阶段的测试和调试
   */
  debug: {
    enableLogging: true,
    // 是否启用复活功能的控制台日志
    mockShareSuccess: false,
    // 是否模拟分享成功（调试用，已关闭）
    resetDataOnLoad: false,
    // 是否每次加载页面时重置复活数据（调试用）
    forceRealShare: false,
    // 强制使用真实分享API（即使在开发者工具中）
    showEnvironmentInfo: true
    // 是否在日志中显示环境检测信息
  }
};
const DEBUG_CONFIG = {
  // 日志控制 (部分实现)
  logging: {
    enableLogging: true,
    // 是否启用控制台日志 (已实现)
    enableVerboseLogging: false,
    // 是否启用详细日志 (当前未实现)
    logLevel: "info",
    // 日志级别: 'error', 'warn', 'info', 'debug' (当前未实现)
    showTimestamps: true,
    // 是否显示时间戳 (当前未实现)
    showGameState: false
    // 是否显示游戏状态 (当前未实现)
  },
  // 界面调试 (当前未实现)
  ui: {
    showCalculation: false,
    // 是否在界面显示计算过程 (当前未实现)
    showFPS: false,
    // 是否显示FPS (当前未实现)
    showMemoryUsage: false,
    // 是否显示内存使用 (当前未实现)
    highlightHitboxes: false,
    // 是否高亮碰撞框 (当前未实现)
    showCoordinates: false
    // 是否显示坐标信息 (当前未实现)
  },
  // 测试模式 (当前未实现)
  testing: {
    fastMode: false,
    // 快速模式（缩短所有动画时间） (当前未实现)
    skipAnimations: false,
    // 跳过动画直接显示结果 (当前未实现)
    autoPlay: false,
    // 自动游戏模式 (当前未实现)
    fixedRandomSeed: null,
    // 固定随机种子(null为不固定) (当前未实现)
    enableCheatMode: false,
    // 是否启用作弊模式 (当前未实现)
    showAnswerInConsole: false
    // 是否在控制台显示答案 (当前未实现)
  }
};
exports.ANIMATION_START_DELAY = ANIMATION_START_DELAY;
exports.BALANCE_CONFIG = BALANCE_CONFIG;
exports.BASE_PEOPLE_IN_HOUSE = BASE_PEOPLE_IN_HOUSE;
exports.CANVAS_CONFIG = CANVAS_CONFIG;
exports.DEBUG_CONFIG = DEBUG_CONFIG;
exports.ENTRY_CONFIG = ENTRY_CONFIG;
exports.ESCAPE_CONFIG = ESCAPE_CONFIG;
exports.HOUSE_CONFIG = HOUSE_CONFIG;
exports.INPUT_MODE = INPUT_MODE;
exports.KEYPAD_CONFIG = KEYPAD_CONFIG;
exports.LEVEL_CONFIG = LEVEL_CONFIG;
exports.PEOPLE_CONFIG = PEOPLE_CONFIG;
exports.PREPARE_SECONDS = PREPARE_SECONDS;
exports.REVIVAL_CONFIG = REVIVAL_CONFIG;
exports.SLIDE_DURATION_MS = SLIDE_DURATION_MS;
exports.UI_CONFIG = UI_CONFIG;
exports.WAVE_INTERVAL_MS = WAVE_INTERVAL_MS;
//# sourceMappingURL=../.sourcemap/mp-weixin/config.js.map
