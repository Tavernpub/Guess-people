<template>
	<view class="game-container" :style="rootStyle">
		<text v-if="showTitle" class="top-title">请记住人数。</text>
		<text v-if="!showTitle && showResult && finalCount !== null" class="top-title">房屋里有几个人？</text>

		<text v-if="count > 0" class="countdown-top" :style="{ color: countdownColor }">{{ count }}</text>
		<view v-if="!showTitle && !showResult" class="level-indicator">第{{ currentLevel }}关</view>
		<view class="people-cluster" v-show="!peopleHidden">
			<view class="row row-top">
				<image class="person" :src="peopleSrcFixed" mode="widthFix"></image>
				<image class="person overlap" :src="peopleSrcFixed" mode="widthFix"></image>
			</view>
			<view class="row row-bottom">
				<image class="person" :src="peopleSrcFixed" mode="widthFix"></image>
				<image class="person overlap" :src="peopleSrcFixed" mode="widthFix"></image>
				<image class="person overlap" :src="peopleSrcFixed" mode="widthFix"></image>
			</view>
		</view>
		<image class="cover-image" :src="homeSrcFixed" mode="widthFix" :class="{ show: coverVisible, lift: houseLift }"></image>
		<!-- 透明遮罩层：实际的游戏区域，与房子大小一致 -->
		<view class="house-mask" :class="{ show: coverVisible, lift: houseLift }"></view>
		<view class="slide-people">
			<view v-for="p in movingPeople" :key="p.id" v-show="p.alive" class="sperson" :class="{ run: p.run }" 
				:style="{ 
					left: leftPx(p.left),
					position: 'absolute',
					top: '0',
					zIndex: 10
				}">
				<image :src="peopleSrcFixed" mode="widthFix" class="person-image"></image>
			</view>
		</view>
		<view class="escape-people">
			<view v-for="e in escapingPeople" :key="e.id" class="eperson" :class="e.cls" 
				:style="{ 
					left: leftPx(e.left), 
					top: leftPx(e.top), 
					zIndex: e.z, 
					'--escape-duration': e.duration + 'ms',
					position: 'absolute'
				}">
				<image :src="peopleSrcFixed" mode="widthFix" class="person-image"></image>
			</view>
		</view>

		<view v-if="showResult && inputMode === 0" class="pad-card">
			<view class="pad-header">请在下方写出答案</view>
			<view class="canvas-container">
			<canvas type="2d" class="draw-canvas" canvas-id="digitCanvas" id="digitCanvas" disable-scroll="true"
				@touchstart.stop.prevent="onCanvasTouchStart"
				@touchmove.stop.prevent="onCanvasTouchMove"
				@touchend.stop.prevent="onCanvasTouchEnd"
				@touchcancel.stop.prevent="onCanvasTouchEnd"></canvas>
				<image class="canvas-clear-icon" src="/static/eraser.png" mode="widthFix" @tap="clearCanvas"></image>
			</view>
			<view class="pad-result" v-if="recognizedDigit !== null">识别结果：{{ recognizedDigit }}</view>
			<view class="confirmation-countdown" v-if="showConfirmationCountdown">
				{{ _confirmationCountdown }}秒后自动提交，可清除重写
			</view>
		</view>

		<!-- 数字键盘 -->
		<view v-if="showResult && inputMode === 1" class="keyboard-container">
			<!-- 折叠按钮 -->
			<view class="fold-btn" @tap="toggleKeypad">
				<image src="/static/fold.png" mode="widthFix" class="fold-icon" :class="{ rotated: !keypadExpanded }"></image>
			</view>
			
			<!-- 输入框区域 -->
			<view class="input-display">
				<view class="input-box">
					<text class="input-text">{{ keypadInput || '请输入数字' }}</text>
				</view>
			</view>
			
			<!-- 键盘主体 -->
			<view v-if="keypadExpanded" class="keyboard-main">
				<!-- 数字区域 -->
				<view class="numbers-area">
					<view class="number-row">
						<view class="number-btn" @tap="onKeypadTap(1)">1</view>
						<view class="number-btn" @tap="onKeypadTap(2)">2</view>
						<view class="number-btn" @tap="onKeypadTap(3)">3</view>
					</view>
					
					<view class="number-row">
						<view class="number-btn" @tap="onKeypadTap(4)">4</view>
						<view class="number-btn" @tap="onKeypadTap(5)">5</view>
						<view class="number-btn" @tap="onKeypadTap(6)">6</view>
					</view>
					
					<view class="number-row">
						<view class="number-btn" @tap="onKeypadTap(7)">7</view>
						<view class="number-btn" @tap="onKeypadTap(8)">8</view>
						<view class="number-btn" @tap="onKeypadTap(9)">9</view>
					</view>
					
					<view class="bottom-row">
						<view class="zero-btn" @tap="onKeypadTap(0)">0</view>
						<view class="dot-btn" @tap="onKeypadTap('.')">.</view>
					</view>
				</view>
				
				<!-- 功能区域 -->
				<view class="function-area">
					<view class="delete-btn" @tap="onKeypadDelete">
						<image src="/static/clear.png" mode="widthFix" class="keypad-clear-icon"></image>
					</view>
					
					<view class="confirm-btn" @tap="onKeypadConfirm">
						<text class="confirm-text">确定</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 揭示剩余人数阶段 -->
		<view v-if="revealVisible" class="reveal-layer">
			<view class="reveal-people">
				<view v-for="(rp, idx) in revealPeople" :key="idx" class="reveal-person" :class="{ red: idx <= revealActiveIndex }"
					:style="{ 
						left: revealLeftRpx(idx)+'rpx', 
						top: revealTopRpx(idx)+'rpx'
					}">
					<!-- 小人图片 - 激活时变红色，未激活时保持黑色 -->
					<image :src="peopleSrcFixed" mode="widthFix" 
						:class="idx <= revealActiveIndex ? 'person-image-red' : 'person-image'"></image>
				</view>
			</view>
			<view class="reveal-number">{{ revealCountNum }}</view>
		</view>

		<!-- 分享复活界面 -->
		<view v-if="revivalData.isReviving" class="revival-overlay">
			<view class="revival-card">
				<view class="revival-title">挑战失败！</view>
				<view class="revival-content">
					第{{ currentLevel }}关挑战失败
					<br>分享给好友获得复活机会
				</view>
				
				<view class="revival-actions">
					<button class="revival-restart-btn" @tap="restartGame">重新开始</button>
					<button class="revival-quit-btn" @tap="quitGame">退出游戏</button>
				</view>
				
				<!-- 分享复活按钮 - 使用open-type="share"触发onShareAppMessage -->
				<button class="revival-share-btn" open-type="share">分享复活</button>
			</view>
		</view>
	</view>

</template>

<script>
	/**
	 * 猜小人游戏核心逻辑文件
	 * Copyright (c) 2025 Tavern (QQ: 2196008384)
	 * 
	 * 本文件是游戏的核心组件，包含完整的游戏逻辑
	 * 
	 * @author Tavern
	 * @contact QQ: 2196008384
	 * @license MIT
	 * @version 1.0.0
	 * @since 2025
	 * 
	 * ================== 游戏核心逻辑 ==================
	 * 
	 * 游戏流程：
	 * 1. 倒计时准备阶段 - 显示初始5个小人，让玩家记住
	 * 2. 房屋遮盖阶段 - 房屋下降遮盖小人
	 * 3. 小人进入阶段 - 多波次小人从左侧滑入房屋
	 * 4. 小人逃离阶段 - 部分小人从房屋逃离（向上/向右）
	 * 5. 答题阶段 - 玩家输入最终房屋内剩余人数
	 * 6. 揭示阶段 - 显示正确答案并逐个高亮小人
	 * 7. 结果处理 - 正确进入下一关，错误可选择分享复活
	 * 
	 * 核心算法：最终人数 = 初始人数 + 进入人数 - 逃离人数
	 */
	import { 
		PREPARE_SECONDS,        // 游戏准备倒计时秒数
		SLIDE_DURATION_MS,      // 小人滑动动画时长
		INPUT_MODE,             // 输入模式：0=手写识别，1=数字键盘
		BASE_PEOPLE_IN_HOUSE,   // 房屋初始人数
		WAVE_INTERVAL_MS,       // 波次间隔时间
		ANIMATION_START_DELAY,  // 动画启动延迟
		ENTRY_CONFIG,           // 小人进入配置
		ESCAPE_CONFIG,          // 小人逃离配置
		LEVEL_CONFIG,           // 关卡难度配置
		BALANCE_CONFIG,         // 游戏平衡配置
		DEBUG_CONFIG,           // 调试配置
		UI_CONFIG,              // UI界面配置
		CANVAS_CONFIG,          // 画布配置
		KEYPAD_CONFIG,          // 数字键盘配置
		PEOPLE_CONFIG,          // 小人外观配置
		HOUSE_CONFIG,           // 房屋配置
		FLOW_CONFIG,            // 游戏流程配置
		REVIVAL_CONFIG,         // 分享复活配置
		AUDIO_CONFIG,           // 音效配置（未实现）
		PERFORMANCE_CONFIG,     // 性能优化配置（未实现）
		AI_CONFIG               // AI识别配置（未实现）
	} from '@/config.js'
	
	export default {
		data() {
			return {
				// ==================== 屏幕适配相关 ====================
				screenInfo: {
					windowWidth: 0,
					windowHeight: 0,
					pixelRatio: 1
				},
				
				// ==================== 游戏状态控制 ====================
				count: PREPARE_SECONDS,          // 倒计时剩余秒数
				countdownTimer: null,            // 倒计时定时器
				showTitle: true,                 // 是否显示标题文字
				countdownColor: '#000000',       // 倒计时数字颜色
				coverVisible: false,             // 房屋是否可见
				peopleHidden: false,             // 初始5人是否已隐藏
				coverHideTimer: null,            // 房屋遮盖延迟定时器
				
				// ==================== 小人进入波次控制 ====================
				movingPeople: [],               // 当前正在移动的小人数组 [{id, left, alive, run}]
				waveTimers: [],                 // 波次相关的所有定时器
				currentWave: 0,                 // 当前波次编号
				startSlideTimer: null,          // 开始滑动的延迟定时器
				slideDurationMs: SLIDE_DURATION_MS,  // 滑动动画持续时间
				personIdSeq: 1,                 // 小人ID序列号，确保唯一性
				launchingNextWave: false,       // 是否正在启动下一波（防止重复触发）
				currentWaveId: null,            // 当前波次的唯一ID（用于清理过期动画）
				activeAliveCount: 0,            // 当前波次中仍在移动的小人数量
				wavesLaunched: 0,               // 已启动的波次数量
				totalWavesTarget: 3,            // 目标波次总数（根据关卡动态计算）
				gameFinished: false,            // 游戏是否已结束
				wavesFinished: false,           // 所有进入波次是否已完成
				
				// ==================== 小人逃离控制 ====================
				escapingPeople: [],             // 正在逃离的小人数组 [{id, cls, left, top, z, duration}]
				escapeTimers: [],               // 逃离相关的所有定时器
				escapeWavesLaunched: 0,         // 已执行的逃离次数
				totalEscapeWavesTarget: 5,      // 目标逃离总次数（根据关卡动态计算）
				escapeDispatcherTimer: null,    // 逃离调度定时器（当前未使用）
				escapeSeriesScheduled: false,   // 逃离序列是否已安排（防止重复安排）
				escapeZSeq: 1,                  // 逃离小人的z-index序号
				
				// ==================== 关卡系统 ====================
				currentLevel: 1,                // 当前关卡等级
				
				// ==================== 计数与结果 ====================
				basePeopleInHouse: BASE_PEOPLE_IN_HOUSE,  // 房屋初始人数
				totalEntered: 0,                // 累计进入的小人总数
				totalEscaped: 0,                // 累计逃离的小人总数
				finalCount: null,               // 最终计算出的房屋内人数
				showResult: false,              // 是否显示答题界面
				
				// ==================== 手写识别画板相关 ====================
				canvasWidth: CANVAS_CONFIG.dimensions.width,    // 画布宽度
				canvasHeight: CANVAS_CONFIG.dimensions.height,  // 画布高度
				ctx: null,                      // Canvas 2D绘图上下文
				isDrawing: false,               // 是否正在绘制
				lastPoint: null,                // 上一个绘制点坐标
				recognizedDigit: null,          // AI识别出的数字结果
				_recognizeTimer: null,          // 识别延迟定时器
				recognitionHandled: false,      // 识别结果是否已处理（防止重复处理）
				_recognizeDelayMs: CANVAS_CONFIG.recognition.recognizeDelayMs,  // 识别延迟时间
				_lastDrawTs: 0,                 // 最后一次绘制的时间戳
				_forceRecognizeTimer: null,     // 强制识别定时器（兜底机制）
				_idleWatchTimer: null,          // 空闲监测定时器
				_strokeLen: 0,                  // 当前笔画长度
				_totalStrokeLen: 0,             // 总笔画长度
				_strokeCount: 0,                // 笔画数量
				_lastStrokeEndTime: 0,          // 最后一笔结束时间
				_canvasDevW: null,              // 画布设备像素宽度
				_canvasDevH: null,              // 画布设备像素高度
				
				// ==================== 确认机制相关 ====================
				_confirmationTimer: null,       // 确认倒计时定时器
				_confirmationCountdown: 0,      // 确认倒计时秒数
				showConfirmationCountdown: false,  // 是否显示确认倒计时
				
				// ==================== 弹窗状态控制 ====================
				_modalShown: false,             // 是否有弹窗正在显示（防止重复弹窗）
				
				// ==================== 资源路径 ====================
				peopleSrcFixed: PEOPLE_CONFIG.appearance.defaultImage,  // 小人图片路径
				homeSrcFixed: HOUSE_CONFIG.image,                       // 房屋图片路径
				
				// ==================== 输入模式控制 ====================
				inputMode: INPUT_MODE,          // 当前输入模式（0=画板，1=键盘）
				
				// ==================== 数字键盘相关 ====================
				keypadInput: '',                // 键盘输入的内容
				keypadConfirmed: false,         // 键盘输入是否已确认
				keypadExpanded: KEYPAD_CONFIG.features.defaultExpanded,  // 键盘是否展开
				
				// ==================== 答案揭示阶段 ====================
				houseLift: false,               // 房屋是否上升（揭示小人）
				revealVisible: false,           // 揭示阶段是否可见
				revealPeople: [],               // 揭示阶段的小人数组
				revealActiveIndex: -1,          // 当前高亮的小人索引
				revealCountNum: 0,              // 揭示阶段显示的数字
				revealTimers: [],               // 揭示阶段相关定时器
				
				// ==================== 分享复活系统 ====================
				revivalData: {
					totalFailures: 0,           // 总失败次数（跨会话保存）
					totalRevivals: 0,           // 总复活次数（跨会话保存）
					lastResetDate: '',          // 上次重置日期（用于每日重置）
					isReviving: false           // 是否正在复活流程中
				},
				_showPageShareButton: false,   // 是否显示页面内分享按钮
				_waitingForTopShare: false     // 是否等待用户使用右上角分享
			}
		},
		
		/**
		 * 计算属性
		 */
		computed: {
    /**
     * 动态设置CSS变量
     * 用于控制小人滑动动画的持续时间和房屋位置
     */
    rootStyle() {
        return `
            --slide-duration: ${this.slideDurationMs}ms;
            --house-from-top: ${HOUSE_CONFIG.animations.initialDrop.fromTop};
            --house-to-top: ${HOUSE_CONFIG.animations.initialDrop.toTop};
            --house-lift-top: ${HOUSE_CONFIG.animations.revealLift.toTop};
            --house-drop-duration: ${HOUSE_CONFIG.animations.initialDrop.duration};
            --house-lift-duration: ${HOUSE_CONFIG.animations.revealLift.duration};
            --house-drop-easing: ${HOUSE_CONFIG.animations.initialDrop.easing};
            --house-lift-easing: ${HOUSE_CONFIG.animations.revealLift.easing};
            --house-width: ${HOUSE_CONFIG.width};
            --house-height: ${HOUSE_CONFIG.height};
            --people-size: ${PEOPLE_CONFIG.appearance.size};
            --people-reveal-size: ${PEOPLE_CONFIG.appearance.revealSize};
            --people-reveal-color: ${PEOPLE_CONFIG.appearance.revealRedColor};
            --people-slide-start: ${PEOPLE_CONFIG.animations.slideIn.startPosition};
            --people-slide-end: ${PEOPLE_CONFIG.animations.slideIn.endPosition};
            --people-slide-disappear: ${PEOPLE_CONFIG.animations.slideIn.disappearPosition};
            --people-reveal-red-color: ${PEOPLE_CONFIG.appearance.revealRedColor};
            --game-area-top: ${UI_CONFIG.layout.gameAreaTop};
            --people-area-top: ${UI_CONFIG.layout.peopleAreaTop};
            --title-top: ${UI_CONFIG.layout.titleTop};
            --countdown-top: ${UI_CONFIG.layout.countdownTop};
            --level-indicator-top: ${UI_CONFIG.layout.levelIndicatorTop};
            --level-indicator-right: ${UI_CONFIG.layout.levelIndicatorRight};
            --reveal-number-top: ${UI_CONFIG.layout.revealNumberTop};
            --slide-area-width: ${UI_CONFIG.layout.slideAreaWidth};
            --slide-area-height: ${UI_CONFIG.layout.slideAreaHeight};
            --slide-area-margin-left: ${UI_CONFIG.layout.slideAreaMarginLeft};
            --escape-area-width: ${UI_CONFIG.layout.escapeAreaWidth};
            --escape-area-height: ${UI_CONFIG.layout.escapeAreaHeight};
            --escape-area-margin-left: ${UI_CONFIG.layout.escapeAreaMarginLeft};
            --reveal-area-width: ${UI_CONFIG.layout.revealAreaWidth};
            --reveal-area-height: ${UI_CONFIG.layout.revealAreaHeight};
            --reveal-area-margin-left: ${UI_CONFIG.layout.revealAreaMarginLeft};
        `.replace(/\s+/g, ' ').trim()
    },
    
    /**
     * 响应式房屋宽度 - 根据屏幕尺寸动态计算
     * 基于屏幕宽度的比例，确保房屋在不同分辨率下都有合适的大小
     * 标准宽度375px对应560rpx，按比例缩放
     */
    responsiveHouseWidth() {
        if (!this.screenInfo.windowWidth) return HOUSE_CONFIG.width;
        
        const baseWidth = 375;
        const baseHouseWidth = parseInt(HOUSE_CONFIG.width) || 560; // 使用配置值
        const scale = Math.max(0.8, Math.min(1.5, this.screenInfo.windowWidth / baseWidth));
        
        return Math.round(baseHouseWidth * scale) + 'rpx';
    },
    
    /**
     * 响应式房屋高度 - 确保能完全覆盖小人
     * 计算逻辑：
     * 1. 计算小人区域的高度
     * 2. 房屋高度至少要比小人区域高30%，确保完全覆盖
     * 3. 根据屏幕高度调整，确保在小屏幕上房屋不会太大
     */
    responsiveHouseHeight() {
        if (!this.screenInfo.windowHeight) return HOUSE_CONFIG.height;
        
        // 获取小人尺寸（rpx）
        const peopleSize = parseInt(PEOPLE_CONFIG.appearance.size) || 165;
        const peopleAreaHeight = peopleSize * 2 + 40; // 两排小人 + 间距
        
        // 房屋高度至少要比小人区域高30%
        const minHouseHeight = Math.round(peopleAreaHeight * 1.3);
        
        // 基础房屋高度
        const baseHouseHeight = parseInt(HOUSE_CONFIG.height) || 330;
        
        // 根据屏幕高度调整，确保在小屏幕上房屋不会太大
        const maxScreenRatio = 0.45; // 房屋最多占屏幕高度的45%
        const maxHouseHeight = Math.round(this.screenInfo.windowHeight * maxScreenRatio * (750 / this.screenInfo.windowWidth));
        
        // 取合适的尺寸
        const finalHeight = Math.max(minHouseHeight, Math.min(baseHouseHeight, maxHouseHeight));
        
        return finalHeight + 'rpx';
    }
	},
		
		/**
		 * 页面加载时的初始化
		 * 1. 加载分享复活数据（从本地存储）
		 * 2. 开始游戏倒计时
		 */
		onLoad() {
			// 获取屏幕信息用于响应式适配
			this.getScreenInfo()
			
			this.loadRevivalData && this.loadRevivalData()
			this.startCountdown && this.startCountdown()
			
			// 启用右上角分享菜单
			this.enableShareMenu && this.enableShareMenu()
		},
		
		/**
		 * 页面显示时的处理
		 * 用于检测分享完成后的复活逻辑
		 */
		onShow() {
			// 检查是否是分享复活后的返回
			if (this._isRevivalShare && this.revivalData.isReviving) {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('📱 [Share] 检测到分享完成，处理复活逻辑')
				}
				
				// 🔧 修复：确保分享复活成功处理
				// 延迟一下，确保分享完全完成
				setTimeout(() => {
					// 显示分享成功提示
					uni.showToast({
						title: '分享成功！获得复活机会',
						icon: 'success',
						duration: 2000
					})
					
					// 处理复活逻辑
					this.onShareSuccess()
					
					// 清理标记
					this._isRevivalShare = false
					this._waitingForTopShare = false
				}, 500)
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
			if (REVIVAL_CONFIG.debug.enableLogging) {
				console.log('📱 [Share] onShareAppMessage 被调用', res)
				console.log('📱 [Share] 当前环境信息:', {
					userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined',
					wxExists: typeof wx !== 'undefined',
					shareAppMessageExists: typeof wx !== 'undefined' && typeof wx.shareAppMessage !== 'undefined'
				})
			}
			
			// 获取动态分享内容
			const shareContent = this.getShareContent()
			
			// 记录分享来源
			if (res.from === 'button') {
				// 来自页面内分享按钮（<button open-type="share">）
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('📱 [Share] 分享来源：页面内分享按钮')
					console.log('📱 [Share] 分享按钮目标:', res.target)
				}
				
				// 如果是分享复活按钮触发的分享，需要处理复活逻辑
				if (this.revivalData.isReviving) {
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log('📱 [Share] 检测到分享复活流程，将在分享完成后处理复活逻辑')
					}
					// 设置一个标记，表示这是分享复活触发的分享
					this._isRevivalShare = true
				}
			} else if (res.from === 'menu') {
				// 来自右上角分享按钮
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('📱 [Share] 分享来源：右上角分享按钮')
				}
				
				// 如果正在等待用户使用右上角分享，设置标记
				if (this._waitingForTopShare) {
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log('📱 [Share] 检测到用户使用右上角分享，将在分享完成后处理复活逻辑')
					}
					// 设置一个标记，表示这是分享复活触发的分享
					this._isRevivalShare = true
					this._waitingForTopShare = false
				}
			}
			
			// 根据文档，返回正确的分享内容格式
			const shareData = {
				title: shareContent.title,        // 分享标题（必填）
				path: shareContent.path,          // 页面路径（必填，必须以/开头）
				imageUrl: shareContent.imageUrl   // 分享图标（可选）
			}
			
			// 添加描述（如果支持）
			if (shareContent.desc) {
				shareData.desc = shareContent.desc
			}
			
			if (REVIVAL_CONFIG.debug.enableLogging) {
				console.log('📱 [Share] 返回分享内容:', shareData)
			}
			
			// 返回分享内容
			return shareData
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
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('📱 [Share] 启用右上角分享菜单')
				}
				
				// 使用uni.showShareMenu启用分享菜单
				// 根据文档，只需要 withShareTicket 参数
				uni.showShareMenu({
					withShareTicket: true,  // 支持群聊分享，默认为 false
					success: () => {
						if (REVIVAL_CONFIG.debug.enableLogging) {
							console.log('✅ [Share] uni.showShareMenu 启用成功')
						}
					},
					fail: (err) => {
						if (REVIVAL_CONFIG.debug.enableLogging) {
							console.log('❌ [Share] uni.showShareMenu 启用失败:', err)
						}
					}
				})
				
				// 同时尝试使用wx.showShareMenu（微信原生方法）
				if (typeof wx !== 'undefined' && wx.showShareMenu) {
					wx.showShareMenu({
						withShareTicket: true,
						success: () => {
							if (REVIVAL_CONFIG.debug.enableLogging) {
								console.log('✅ [Share] wx.showShareMenu 启用成功')
							}
						},
						fail: (err) => {
							if (REVIVAL_CONFIG.debug.enableLogging) {
								console.log('❌ [Share] wx.showShareMenu 启用失败:', err)
							}
						}
					})
				}
			} catch (error) {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('❌ [Share] 启用分享菜单异常:', error)
				}
			}
		},
		
		/**
		 * 页面卸载时的清理工作
		 * 清理所有定时器，防止内存泄漏
		 */
		onUnload() {
			this.clearCountdown && this.clearCountdown()             // 清理倒计时定时器
			this.clearCoverHideTimer && this.clearCoverHideTimer()   // 清理房屋遮盖定时器
			this.clearAllWaveTimers && this.clearAllWaveTimers()     // 清理所有波次定时器
			this.clearEscapeTimers && this.clearEscapeTimers()       // 清理逃离定时器
			this.clearEscapeDispatcher && this.clearEscapeDispatcher() // 清理逃离调度器
			this.clearRevealState && this.clearRevealState()         // 清理揭示阶段状态
			this._stopPadIdleWatcher && this._stopPadIdleWatcher()   // 停止画板空闲监测
			this.clearConfirmationTimer && this.clearConfirmationTimer() // 清理确认定时器
			this.clearMaskCollisionTrackers && this.clearMaskCollisionTrackers() // 清理遮罩碰撞检测跟踪器
		},
		methods: {
			// ==================== 屏幕适配方法 ====================
			
			/**
			 * 获取屏幕信息用于响应式适配
			 */
			getScreenInfo() {
				try {
					const systemInfo = uni.getSystemInfoSync()
					this.screenInfo = {
						windowWidth: systemInfo.windowWidth,
						windowHeight: systemInfo.windowHeight,
						pixelRatio: systemInfo.pixelRatio || 1
					}
					
					if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.performance.enableVerboseLogging) {
						console.log('📱 [Screen] 屏幕信息:', this.screenInfo)
					}
				} catch (error) {
					console.error('📱 [Screen] 获取屏幕信息失败:', error)
					// 使用默认值
					this.screenInfo = {
						windowWidth: 375,
						windowHeight: 667,
						pixelRatio: 2
					}
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
					return uni.upx2px(val) + 'px' 
				} catch(e) { 
					return val + 'rpx' 
				}
			},
			
			// ==================== 关卡难度计算 ====================
			
			/**
			 * 获取当前关卡的进入波数
			 * 支持多种增长模式：线性、指数、自定义
			 * @returns {number} 波数
			 */
			getCurrentLevelWaves() {
				const config = LEVEL_CONFIG.waves
				const level = this.currentLevel
				
				switch (config.growthType) {
					case 'linear':
						// 线性增长：每关固定增加
						return Math.min(config.baseWaves + (level - 1) * config.linearGrowth, config.maxWaves)
					case 'exponential':
						// 指数增长：难度快速提升
						return Math.min(config.baseWaves * Math.pow(1.5, level - 1), config.maxWaves)
					case 'custom':
						// 自定义：每关精确控制
						return config.customWaves[level - 1] || config.customWaves[config.customWaves.length - 1]
					default:
						// 默认线性增长
						return config.baseWaves + (level - 1)
				}
			},
			
			/**
			 * 获取当前关卡的逃离人数
			 * 支持多种增长模式：线性、随机、自定义
			 * @returns {number} 逃离人数
			 */
			getCurrentLevelEscapes() {
				const config = LEVEL_CONFIG.escapes
				const level = this.currentLevel
				
				switch (config.growthType) {
					case 'linear':
						// 线性增长：每关固定增加
						return Math.min(config.baseEscapes + (level - 1) * config.linearGrowth, config.maxEscapes)
					case 'random':
						// 随机增长：每关随机增加一定范围的人数
						let totalEscapes = config.baseEscapes
						for (let l = 2; l <= level; l++) {
							const [min, max] = config.randomRange
							totalEscapes += Math.floor(Math.random() * (max - min + 1)) + min
						}
						return Math.min(totalEscapes, config.maxEscapes)
					case 'custom':
						// 自定义：每关精确控制
						return config.customEscapes[level - 1] || config.customEscapes[config.customEscapes.length - 1]
					default:
						// 默认增长
						return config.baseEscapes + (level - 1) * 2
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
				const { cols } = this._revealLayout()
				return idx % cols
			},
			
			/**
			 * 获取揭示阶段小人的行位置
			 * @param {number} idx - 小人索引
			 * @returns {number} 行编号
			 */
			revealRow(idx) {
				const { cols } = this._revealLayout()
				return Math.floor(idx / cols)
			},
			
			/**
			 * 计算揭示阶段小人的水平位置（rpx）
			 * 策略：小于等于5人使用预设位置，多于5人使用动态网格布局
			 * @param {number} idx - 小人索引
			 * @returns {number} 水平位置（rpx）
			 */
			revealLeftRpx(idx) {
				const n = this.revealPeople.length
				
				if (n <= 5) {
					// 小人数量少时，使用预设位置（模仿开局5人簇，居中于容器宽550rpx）
					const presets = [
						[{x:220,y:0},{x:330,y:0},{x:275,y:30},{x:165,y:30},{x:385,y:30}],
						[{x:255,y:0},{x:295,y:0},{x:225,y:30},{x:325,y:30},{x:275,y:60}]
					]
					const p = presets[0][idx] || presets[0][presets[0].length-1]
					return p.x
				}
				
				// 多人时使用动态网格布局
				const { stepX, offsetX, staggerX, cols } = this._revealLayout()
				const c = this.revealCol(idx)
				const r = this.revealRow(idx)
				// 六边形错位：奇数行向右偏移半个步长
				return offsetX + c * stepX + (r % 2 ? staggerX : 0)
			},
			
			/**
			 * 计算揭示阶段小人的垂直位置（rpx）
			 * @param {number} idx - 小人索引
			 * @returns {number} 垂直位置（rpx）
			 */
			revealTopRpx(idx) {
				const n = this.revealPeople.length
				
				if (n <= 5) {
					// 使用预设位置
					const presets = [
						[{x:220,y:0},{x:330,y:0},{x:275,y:30},{x:165,y:30},{x:385,y:30}],
						[{x:255,y:0},{x:295,y:0},{x:225,y:30},{x:325,y:30},{x:275,y:60}]
					]
					const p = presets[0][idx] || presets[0][presets[0].length-1]
					return p.y
				}
				
				// 动态网格布局
				const { stepY, offsetY } = this._revealLayout()
				const r = this.revealRow(idx)
				return offsetY + r * stepY
			},
			
			/**
			 * 计算揭示阶段的布局参数
			 * 自适应算法：根据人数动态调整行列数和间距
			 * @returns {Object} 布局参数 {cols, rows, stepX, stepY, offsetX, offsetY, staggerX}
			 */
			_revealLayout() {
				const containerW = 550    // 容器宽度（rpx）
				const personW = 110       // 单个小人宽度（rpx）
				const n = Math.max(0, this.revealPeople.length)
				
				if (n <= 5) {
					// 少量小人直接返回，使用预设位置
					return { cols: n, stepX: 0, stepY: 0, offsetX: 0, offsetY: 0, staggerX: 0 }
				}
				
				// 动态计算列数：基于平方根，限制在5-8列之间，偏紧凑布局
				let cols = Math.max(5, Math.min(8, Math.round(Math.sqrt(n * 1.2))))
				const rows = Math.ceil(n / cols)
				
				// 重叠系数：水平60%，垂直70%（紧凑但不重叠过多）
				const overlapX = 0.6
				const overlapY = 0.7
				let stepX = Math.floor(personW * overlapX)
				let stepY = Math.floor(personW * overlapY)
				
				// 水平居中：计算整行宽度，然后居中
				const rowWidth = (cols - 1) * stepX + personW
				const offsetX = Math.floor((containerW - rowWidth) / 2)
				const offsetY = 0
				
				// 六边形错位：奇数行向右偏移半个步长，形成蜂窝状布局
				const staggerX = Math.floor(stepX / 2)
				
				return { cols, rows, stepX, stepY, offsetX, offsetY, staggerX }
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
				// ========== 第一步：清理现有状态 ==========
				this.clearCountdown()           // 清理倒计时定时器
				this.clearCoverHideTimer()     // 清理房屋遮盖定时器
				this.clearAllWaveTimers()      // 清理所有波次定时器
				this.clearEscapeTimers()       // 清理逃离定时器
				this.clearEscapeDispatcher()   // 清理逃离调度器
				this.clearRevealState()        // 清理揭示状态
				
				// ========== 第二步：重置UI状态 ==========
				this._modalShown = false       // 重置弹窗状态
				this.count = PREPARE_SECONDS   // 重置倒计时
				this.showTitle = true          // 显示标题
				this.coverVisible = false      // 隐藏房屋
				this.peopleHidden = false      // 显示初始5人
				this.countdownColor = '#000000' // 重置倒计时颜色
				
				// ========== 第三步：重置游戏数据 ==========
				this.movingPeople = []         // 清空移动小人
				this.escapingPeople = []       // 清空逃离小人
				this.currentWave = 0           // 重置当前波次
				this.wavesLaunched = 0         // 重置已启动波次数
				this.escapeWavesLaunched = 0   // 重置已逃离次数
				this.launchingNextWave = false // 重置波次启动标志
				this.gameFinished = false      // 重置游戏结束标志
				this.wavesFinished = false     // 重置波次完成标志
				this.escapeSeriesScheduled = false // 重置逃离序列标志
				this.escapeZSeq = 1            // 重置逃离层级序号
				this.totalEntered = 0          // 重置进入人数统计
				this.totalEscaped = 0          // 重置逃离人数统计
				
				// ========== 第四步：根据关卡设置难度 ==========
				this.totalWavesTarget = this.getCurrentLevelWaves()      // 目标波数
				this.totalEscapeWavesTarget = this.getCurrentLevelEscapes() // 目标逃离数
				this.slideDurationMs = this.getEntryDuration()           // 动态计算进入动画时长
				console.log(`🎮 [Level ${this.currentLevel}] 游戏开始 - 目标波数: ${this.totalWavesTarget}, 逃离波数: ${this.totalEscapeWavesTarget}, 初始小人: ${this.basePeopleInHouse}, 进入速度: ${this.slideDurationMs}ms`)
				
				// ========== 第五步：重置答题相关状态 ==========
				this.finalCount = null         // 重置最终计算结果
				this.showResult = false        // 隐藏答题界面
				this.recognizedDigit = null    // 重置识别结果
				this.recognitionHandled = false // 重置识别处理标志
				
				// 重置数字键盘状态
				this.keypadInput = ''          // 清空键盘输入
				this.keypadConfirmed = false   // 重置确认状态
				this.keypadExpanded = true     // 展开键盘
				
				// 重置揭示阶段状态
				this.houseLift = false         // 房屋不上升
				this.revealVisible = false     // 隐藏揭示层
				this.revealPeople = []         // 清空揭示小人
				this.revealActiveIndex = -1    // 重置高亮索引
				this.revealCountNum = 0        // 重置显示数字
				
				// 重置画板状态
				this._strokeCount = 0          // 重置笔画数
				this._totalStrokeLen = 0       // 重置总笔画长度
				this._strokeLen = 0            // 重置当前笔画长度
				this._lastStrokeEndTime = 0    // 重置最后笔画时间
				
				// 清除确认定时器
				this.clearConfirmationTimer && this.clearConfirmationTimer()
				
				// ========== 第六步：启动倒计时 ==========
				this.countdownTimer = setInterval(() => {
					if (this.count <= 1) {
						// 倒计时结束，进入下一阶段
						this.clearCountdown()
						this.count = 0
						this.showTitle = false     // 隐藏标题
						this.coverVisible = true   // 显示房屋（开始遮盖）
						
						// 房屋遮盖后隐藏初始5人
						this.coverHideTimer = setTimeout(() => {
							this.peopleHidden = true
							this.clearCoverHideTimer()
						}, HOUSE_CONFIG.animations.covering.hideDelay)
						
						// 延迟后启动第一波小人进入
						this.startSlideTimer = setTimeout(() => {
							if (this.gameFinished) return
							const firstWave = ENTRY_CONFIG.firstWave
							this.launchWave({ count: firstWave.count, grouped: firstWave.grouped })
						}, ENTRY_CONFIG.firstWave.delay)
						return
					}
					this.count -= 1  // 倒计时递减
				}, 1000)
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
				if (this.gameFinished) return  // 游戏已结束，不启动新波次
				
				// ========== 第零步：清理已死亡的小人 ==========
				// 🔧 修复：每波开始前彻底清理已死亡的小人，防止闪烁
				this.movingPeople = this.movingPeople.filter(p => p.alive)
				
				// ========== 第一步：智能决定是否成组 ==========
				const config = ENTRY_CONFIG.subsequentWaves
				if (!grouped && count >= config.groupedThreshold) {
					// 人数多时强制成组（避免视觉混乱）
					grouped = true
				} else if (!grouped && count < config.groupedThreshold) {
					// 人数少时按概率决定是否成组
					grouped = Math.random() < config.groupedProbability
				}
				
				// ========== 第二步：检查波次限制 ==========
				if (this.wavesLaunched >= this.totalWavesTarget) return  // 已达到目标波数
				
				// ========== 第三步：更新统计数据 ==========
				this.wavesLaunched += 1        // 增加已启动波次数
				this.currentWave += 1          // 增加当前波次编号
				this.totalEntered += count     // 累计进入人数
				// 计算速度变化信息
				const baseSpeed = PEOPLE_CONFIG.animations.slideIn.speed.base
				const speedChange = ((baseSpeed - this.slideDurationMs) / baseSpeed * 100).toFixed(1)
				console.log(`📥 [Wave ${this.wavesLaunched}/${this.totalWavesTarget}] 小人进入 - 本波: ${count}人 (${grouped ? '成组' : '独立'}), 累计进入: ${this.totalEntered}人, 速度: ${this.slideDurationMs}ms (较基础速度${speedChange > 0 ? '加快' : '减慢'}${Math.abs(speedChange)}%)`)
				
				// ========== 第四步：初始化波次控制变量 ==========
				this.launchingNextWave = false                    // 重置下一波启动标志
				const waveId = Date.now() + Math.random()         // 生成唯一波次ID（用于清理过期动画）
				this.currentWaveId = waveId                       // 保存当前波次ID
				this.activeAliveCount = count                     // 设置当前波次活跃小人数
				
				// ========== 第五步：创建小人对象 ==========
				const ids = []  // 存储本波次所有小人的ID
				// 根据是否成组决定位置偏移
				const offsets = grouped 
					? (ENTRY_CONFIG.subsequentWaves.groupOffsets[count] || [0])  // 成组：使用预设偏移
					: new Array(count).fill(0)                                   // 独立：无偏移
				
				for (let i = 0; i < count; i++) {
					const id = this.personIdSeq++  // 生成唯一ID
					ids.push(id)
					// 创建小人对象并加入移动数组
					this.movingPeople.push({ 
						id, 
						left: offsets[i] || 0,  // 水平偏移位置
						alive: true,            // 是否仍在移动中
						run: false              // 是否开始运行动画
					})
				}
				
				// ========== 第六步：根据模式启动动画 ==========
				if (grouped) {
					// 成组模式：所有小人同时启动
					const startAll = setTimeout(() => {
						if (this.gameFinished || waveId !== this.currentWaveId) return
						const now = Date.now()
						ids.forEach((id) => {
							const item = this.movingPeople.find(p => p.id === id)
							if (item) {
								item.run = true
								item.animationStartTime = now  // 记录动画开始时间
							}
						})
					}, ANIMATION_START_DELAY)
					this.waveTimers.push(startAll)

					// 动画结束后统一处理
					const endGroupT = setTimeout(() => {
						if (this.gameFinished || waveId !== this.currentWaveId) return

						// 标记所有小人为非活跃
						ids.forEach(id => {
							const target = this.movingPeople.find(p => p.id === id)
							if (target) target.alive = false
						})
						this.activeAliveCount = 0

						// 检查是否启动下一波
						this.checkAndLaunchNextWave()
					}, this.slideDurationMs + ANIMATION_START_DELAY + 100) // 额外增加100ms缓冲
					this.waveTimers.push(endGroupT)

				} else {
					// 独立模式：小人按间隔依次启动
					const intervalConfig = ENTRY_CONFIG.independentInterval
					const intervalMs = Math.max(intervalConfig.minMs, this.slideDurationMs * intervalConfig.durationRatio)
					ids.forEach((id, idx) => {
						const startT = setTimeout(() => {
							if (this.gameFinished || waveId !== this.currentWaveId) return
							const item = this.movingPeople.find(p => p.id === id)
							if (item) {
								item.run = true
								item.animationStartTime = Date.now()  // 记录动画开始时间
							}
							// 为每个独立小人设置结束定时器
							const endT = setTimeout(() => {
								if (this.gameFinished || waveId !== this.currentWaveId) return
								const target = this.movingPeople.find(p => p.id === id)
								if (target && target.alive) {
									target.alive = false
									this.activeAliveCount -= 1
								}
								// 每个小人结束后都检查是否启动下一波
								if (this.activeAliveCount === 0) {
									this.checkAndLaunchNextWave()
								}
							}, this.slideDurationMs)
							this.waveTimers.push(endT)
						}, idx * intervalMs + ANIMATION_START_DELAY)
						this.waveTimers.push(startT)
					})
				}
			},
			
			/**
			 * 检查并启动下一波
			 */
			checkAndLaunchNextWave() {
				if (this.launchingNextWave) return
				this.launchingNextWave = true
		
				// 🔧 修复：清理已死亡的小人，防止下一波开始时出现闪烁
				this.cleanupDeadPeople()
		
				// 第一波结束后，安排逃离序列
				if (this.wavesLaunched === 1 && !this.escapeSeriesScheduled) {
					this.scheduleEscapeMixAfterFirstWave()
				}
		
				// 判断是否还有下一波
				if (this.wavesLaunched < this.totalWavesTarget) {
					const choices = ENTRY_CONFIG.subsequentWaves.countRange
					const nextCount = choices[Math.floor(Math.random() * choices.length)]
					const nextGrouped = nextCount >= ENTRY_CONFIG.subsequentWaves.groupedThreshold ? true : (Math.random() < ENTRY_CONFIG.subsequentWaves.groupedProbability)
					
					const t = setTimeout(() => {
						if (this.gameFinished) return
						if (DEBUG_CONFIG.logging.enableLogging) {
							console.log('[game] next wave with', nextCount, 'grouped=', nextGrouped)
						}
						this.launchWave({
							count: nextCount,
							grouped: nextGrouped
						})
					}, WAVE_INTERVAL_MS)
					this.waveTimers.push(t)
				} else {
					this.wavesFinished = true
					console.log(`🌊 [Waves Complete] 所有进入波次完成 (${this.wavesLaunched}/${this.totalWavesTarget})`)
					this.tryFinalize()
				}
			},
			
			/**
			 * 🔧 重新添加：清理已死亡的小人
			 * 功能：从movingPeople数组中移除已死亡的小人，防止闪烁和内存泄漏
			 */
			cleanupDeadPeople() {
				const beforeCount = this.movingPeople.length
				this.movingPeople = this.movingPeople.filter(p => p.alive)
				const afterCount = this.movingPeople.length
				
				if (DEBUG_CONFIG.logging.enableLogging && beforeCount !== afterCount) {
					console.log(`🧹 [Cleanup] 清理已死亡小人: ${beforeCount} -> ${afterCount}`)
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
				this.escapeSeriesScheduled = true  // 标记逃离序列已安排，防止重复调用
				const totalEscapes = this.totalEscapeWavesTarget
				const config = ESCAPE_CONFIG.directionProbability
				
				let upCount, rightCount  // 向上和向右逃离的人数
				
				// ========== 第一步：根据配置模式决定方向分配 ==========
				switch (config.mode) {
					case 'balanced':
						// 平衡模式：尽量均匀分配，但保证最小数量
						const half = Math.floor(totalEscapes / 2)
						upCount = Math.max(half, config.minUpCount)
						rightCount = Math.max(totalEscapes - upCount, config.minRightCount)
						// 如果总数不够，按比例调整
						if (upCount + rightCount > totalEscapes) {
							upCount = Math.max(Math.floor(totalEscapes * 0.5), config.minUpCount)
							rightCount = totalEscapes - upCount
						}
						break
					case 'custom':
						// 自定义概率模式：按指定概率分配
						upCount = Math.max(Math.floor(totalEscapes * config.upProbability), config.minUpCount)
						rightCount = Math.max(totalEscapes - upCount, config.minRightCount)
						break
					case 'random':
					default:
						// 完全随机模式：在保证最小数量的前提下随机分配
						upCount = Math.max(Math.floor(Math.random() * (totalEscapes - config.minRightCount)) + 1, config.minUpCount)
						rightCount = totalEscapes - upCount
						break
				}
				
				// ========== 第二步：确保分配合理性 ==========
				// 防止分配总数超出目标数量
				if (upCount + rightCount > totalEscapes) {
					if (upCount > rightCount) {
						upCount = totalEscapes - rightCount
					} else {
						rightCount = totalEscapes - upCount
					}
				}
				
				// ========== 第三步：生成逃离方向序列 ==========
				const seq = []  // 逃离方向序列
				
				// 添加向上逃离
				for (let i = 0; i < upCount; i++) {
					seq.push('up')
				}
				// 添加向右逃离
				for (let i = 0; i < rightCount; i++) {
					seq.push('right')
				}
				
				// ========== 第四步：随机打乱序列 ==========
				// Fisher-Yates洗牌算法，确保完全随机
				for (let i = seq.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[seq[i], seq[j]] = [seq[j], seq[i]]
				}
				
				// ========== 第五步：计算逃离间隔并安排定时器 ==========
				const intervalConfig = ESCAPE_CONFIG.interval
				// 间隔时间：配置的最小值 或 动画时长的比例，取较大值
				const perInterval = Math.max(intervalConfig.minMs, Math.floor(this.slideDurationMs * intervalConfig.durationRatio))
				
				// 为每个逃离事件安排定时器
				seq.slice(0, totalEscapes).forEach((dir, idx) => {
					const t = setTimeout(() => { 
						this.launchEscape(dir) 
					}, idx * perInterval)  // 按间隔依次执行
					this.escapeTimers.push(t)  // 保存定时器用于清理
				})
				
				// ========== 第六步：输出调试信息 ==========
				if (DEBUG_CONFIG.logging.enableLogging) {
					console.log(`[Level ${this.currentLevel}] Scheduled ${totalEscapes} escapes: ${upCount} up, ${rightCount} right (mode: ${config.mode})`)
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
				// 小人动画的起始和结束位置
				const startPos = parseInt(PEOPLE_CONFIG.animations.slideIn.startPosition)
				const endPos = parseInt(PEOPLE_CONFIG.animations.slideIn.endPosition)
				const disappearPos = parseInt(PEOPLE_CONFIG.animations.slideIn.disappearPosition)
				const totalDistance = endPos - startPos
				
				// 计算小人偏移
				const personOffset = person.left || 0
				
				// 每16ms检测一次（约60fps）
				const tracker = setInterval(() => {
					if (!person.alive || this.gameFinished || person.hidden) {
						clearInterval(tracker)
						return
					}
					
					// 计算当前动画进度
					if (!person.animationStartTime) {
						person.animationStartTime = Date.now()
					}
					
					const elapsed = Date.now() - person.animationStartTime
					const progress = Math.min(elapsed / this.slideDurationMs, 1)
					
					// 计算当前基础位置
					const basePos = startPos + (totalDistance * progress)
					// 计算视觉位置（基础位置 + 偏移）
					const visualPos = basePos + personOffset
					
					// 判断是否到达消失位置（每个小人独立判断）
					if (visualPos >= disappearPos && !person.hidden) {
						// 瞬间消失，无渐变效果
						person.hidden = true
						person.alive = false
						this.activeAliveCount -= 1
						clearInterval(tracker)
						
						if (DEBUG_CONFIG.logging.enableLogging) {
							console.log(`🏠 [Disappear] 小人${person.id} 到达消失位置，瞬间消失: 基础位置${basePos.toFixed(1)}, 视觉位置${visualPos.toFixed(1)}, 消失位置${disappearPos}, 偏移${personOffset}`)
						}
					}
					
					// 动画完成时清理
					if (progress >= 1) {
						// 如果动画完成但小人还没消失，强制消失
						if (!person.hidden) {
							person.hidden = true
							person.alive = false
							this.activeAliveCount -= 1
							if (DEBUG_CONFIG.logging.enableLogging) {
								console.log(`🏠 [Disappear] 小人${person.id} 动画完成，强制消失`)
							}
						}
						clearInterval(tracker)
						return
					}
				}, 16) // 60fps检测频率
				
				// 保存定时器引用，用于清理
				this.maskCollisionTrackers.push(tracker)
			},
			
			/**
			 * 清理所有遮罩碰撞检测跟踪器
			 */
			clearMaskCollisionTrackers() {
				if (this.maskCollisionTrackers) {
					this.maskCollisionTrackers.forEach(tracker => clearInterval(tracker))
					this.maskCollisionTrackers = []
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
				const speedConfig = PEOPLE_CONFIG.animations.escape.speed
				const progression = speedConfig.levelProgression
				let duration = speedConfig.base  // 基础动画时长
				
				// ========== 第一步：根据关卡和配置模式计算基础时长 ==========
				switch (progression.mode) {
					case 'percentage':
						// 百分比模式：每关按百分比递减时长（速度递增）
						const decreaseRate = progression.percentageDecrease / 100
						for (let level = 2; level <= this.currentLevel; level++) {
							duration *= (1 - decreaseRate)  // 例：每关减少5%
						}
						break
						
					case 'fixed':
						// 固定减少模式：每关减少固定毫秒数
						duration -= (this.currentLevel - 1) * progression.fixedDecrease
						break
						
					case 'custom':
						// 自定义模式：使用预定义的时长数组，精确控制每关速度
						const customIndex = this.currentLevel - 1
						if (customIndex < progression.customDurations.length) {
							duration = progression.customDurations[customIndex]
						} else {
							// 超出自定义范围时使用最后一个值
							duration = progression.customDurations[progression.customDurations.length - 1]
						}
						break
						
					default:
						// 默认为百分比模式，每关减少5%
						const defaultDecreaseRate = 0.05
						for (let level = 2; level <= this.currentLevel; level++) {
							duration *= (1 - defaultDecreaseRate)
						}
						break
				}
				
				// ========== 第二步：应用变化曲线调整 ==========
				// 让速度变化更符合游戏体验曲线
				if (progression.curve !== 'linear' && this.currentLevel > 1) {
					const levelFactor = (this.currentLevel - 1) / 10  // 归一化到0-1范围（假设10关为满级）
					let curveFactor = 1
					
					switch (progression.curve) {
						case 'exponential':
							// 指数曲线：后期关卡速度变化更激烈
							curveFactor = Math.pow(levelFactor, progression.curveIntensity || 1.2)
							break
						case 'logarithmic':
							// 对数曲线：前期关卡速度变化较快，后期趋于平缓
							curveFactor = Math.log(1 + levelFactor * (Math.E - 1)) / Math.log(Math.E)
							curveFactor = Math.pow(curveFactor, 1 / (progression.curveIntensity || 1.2))
							break
					}
					
					// 应用曲线调整
					const originalDuration = speedConfig.base
					const linearDuration = duration
					duration = originalDuration + (linearDuration - originalDuration) * curveFactor
				}
				
				// ========== 第三步：根据逃离方向调整速度 ==========
				// 不同方向可以有不同的速度，增加游戏策略性
				if (speedConfig.directionDifference.enabled) {
					const dirMultiplier = direction === 'up' 
						? speedConfig.directionDifference.upMultiplier    // 向上逃离速度倍数
						: speedConfig.directionDifference.rightMultiplier // 向右逃离速度倍数
					duration *= dirMultiplier
				}
				
				// ========== 第四步：限制在合理范围内 ==========
				// 防止速度过快或过慢影响游戏体验
				duration = Math.max(speedConfig.minDuration, Math.min(speedConfig.maxDuration, duration))
				
				return Math.round(duration)  // 返回整数毫秒值
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
				const speedConfig = PEOPLE_CONFIG.animations.slideIn.speed
				const progression = speedConfig.levelProgression
				let duration = speedConfig.base  // 基础动画时长
				
				// ========== 第一步：根据关卡和配置模式计算基础时长 ==========
				switch (progression.mode) {
					case 'percentage':
						// 百分比模式：每关按百分比递减时长（速度递增）
						const decreaseRate = progression.percentageDecrease / 100
						for (let level = 2; level <= this.currentLevel; level++) {
							duration *= (1 - decreaseRate)  // 例：每关减少8%
						}
						break
						
					case 'fixed':
						// 固定减少模式：每关减少固定毫秒数
						duration -= (this.currentLevel - 1) * progression.fixedDecrease
						break
						
					case 'custom':
						// 自定义模式：使用预定义的时长数组，精确控制每关速度
						const customIndex = this.currentLevel - 1
						if (customIndex < progression.customDurations.length) {
							duration = progression.customDurations[customIndex]
						} else {
							// 超出预定义范围时，使用最后一个值
							duration = progression.customDurations[progression.customDurations.length - 1]
						}
						break
						
					default:
						// 默认为百分比模式，每关减少8%
						const defaultDecreaseRate = 0.08
						for (let level = 2; level <= this.currentLevel; level++) {
							duration *= (1 - defaultDecreaseRate)
						}
						break
				}
				
				// ========== 第二步：应用变化曲线调整 ==========
				// 让速度变化更符合游戏体验曲线
				if (progression.curve !== 'linear' && this.currentLevel > 1) {
					const levelFactor = (this.currentLevel - 1) / 10  // 归一化到0-1范围（假设10关为满级）
					let curveFactor = 1
					
					switch (progression.curve) {
						case 'exponential':
							// 指数曲线：后期关卡速度变化更激烈
							curveFactor = Math.pow(levelFactor, progression.curveIntensity || 1.3)
							break
						case 'logarithmic':
							// 对数曲线：前期关卡速度变化较快，后期趋于平缓
							curveFactor = Math.log(1 + levelFactor * (Math.E - 1)) / Math.log(Math.E)
							curveFactor = Math.pow(curveFactor, 1 / (progression.curveIntensity || 1.3))
							break
					}
					
					// 应用曲线调整
					const originalDuration = speedConfig.base
					const linearDuration = duration
					duration = originalDuration + (linearDuration - originalDuration) * curveFactor
				}
				
				// ========== 第三步：应用速度范围限制 ==========
				// 确保速度在合理范围内，避免过快或过慢
				const finalDuration = Math.max(speedConfig.minDuration, Math.min(duration, speedConfig.maxDuration))
				
				// 调试信息：输出速度计算过程
				if (DEBUG_CONFIG.logging.enableLogging) {
					console.log(`🎯 [Entry Speed] Level ${this.currentLevel}: base=${speedConfig.base}ms, calculated=${Math.round(duration)}ms, final=${finalDuration}ms, mode=${progression.mode}`)
				}
				
				return finalDuration
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
				// ========== 第一步：检查逃离限制 ==========
				if (this.escapeWavesLaunched >= this.totalEscapeWavesTarget) return  // 已达到目标逃离数
				
				// ========== 第二步：更新统计数据 ==========
				this.escapeWavesLaunched += 1  // 增加已执行逃离次数
				this.totalEscaped += 1         // 增加总逃离人数
				
				// ========== 第三步：计算动画时长和输出调试信息 ==========
				const escapeDuration = this.getEscapeDuration(dir)  // 获取动态计算的动画时长
				const speedConfig = PEOPLE_CONFIG.animations.escape.speed
				const baseSpeed = speedConfig.base
				// 计算相对于基础速度的变化百分比
				const speedChange = ((baseSpeed - escapeDuration) / baseSpeed * 100).toFixed(1)
				console.log(`📤 [Escape ${this.escapeWavesLaunched}/${this.totalEscapeWavesTarget}] 小人逃离 - 方向: ${dir === 'up' ? '向上' : '向右'}, 速度: ${escapeDuration}ms (较基础速度${speedChange > 0 ? '加快' : '减慢'}${Math.abs(speedChange)}%), 累计逃离: ${this.totalEscaped}人`)
				
				// ========== 第四步：设置小人初始位置 ==========
				// 根据逃离方向设置不同的起始位置（使用配置文件）
				const startPos = PEOPLE_CONFIG.animations.escape.startPositions[dir]
				const startLeft = startPos.left    // 从房子内部开始
				const startTop = startPos.top      // 从房子内部开始
				const id = 'e'+(this.personIdSeq++)           // 生成唯一ID
				
				// ========== 第五步：创建逃离小人对象 ==========
				const obj = { 
					id,                    // 唯一标识符
					cls: 'pre',           // CSS类名，初始状态
					left: startLeft,      // 水平位置
					top: startTop,        // 垂直位置
					z: this.escapeZSeq++, // z-index层级（确保后逃离的在上层）
					duration: escapeDuration // 动画持续时间（传递给CSS变量）
				}
				this.escapingPeople.push(obj)  // 添加到逃离数组

				// ========== 第六步：启动CSS动画（小程序兼容性处理） ==========
				// 使用Vue的nextTick确保DOM更新完成，再启动动画
				this.$nextTick(() => {
					setTimeout(() => {
						const targetObj = this.escapingPeople.find(p => p.id === id)
						if (targetObj) {
							// 切换CSS类名，触发动画
							targetObj.cls = dir === 'up' ? 'escape-up' : 'escape-right'
						}
					}, 50) // 给足够时间让DOM完成渲染，避免小程序动画闪烁
				})
				
				// ========== 第七步：设置动画完成后的清理定时器 ==========
				const t = setTimeout(() => {
					// 从逃离数组中移除该小人
					this.escapingPeople = this.escapingPeople.filter(p => p.id !== id)
					// 注意：游戏可能已经结束，这里不再调用tryFinalize()
				}, escapeDuration + ESCAPE_CONFIG.interval.cleanupDelay) // 动画时长 + 清理延迟
				this.escapeTimers.push(t)  // 保存定时器用于清理
			},
			startEscapeDispatcher() {
				// 保留但当前不使用
				if (this.escapeDispatcherTimer) return
				const interval = Math.max(260, Math.floor(this.slideDurationMs * 0.6))
				this.escapeDispatcherTimer = setInterval(() => {
					if (this.escapeWavesLaunched >= this.totalEscapeWavesTarget) {
						this.clearEscapeDispatcher()
						this.tryFinalize()
						return
					}
					this.launchEscape(Math.random()<0.5?'up':'right')
				}, interval)
			},
			clearEscapeDispatcher() {
				if (this.escapeDispatcherTimer) {
					clearInterval(this.escapeDispatcherTimer)
					this.escapeDispatcherTimer = null
				}
			},
			tryEscapes() {
				// 已改为在第一波结束时统一安排
			},
			clearEscapeTimers() {
				this.escapeTimers.forEach(t=>clearTimeout(t))
				this.escapeTimers = []
			},
			tryFinalize() {
				if (this.gameFinished) return
				// 修改逻辑：只要波次完成且逃离序列已安排，就立即结束游戏
				if (this.wavesFinished && this.escapeWavesLaunched >= this.totalEscapeWavesTarget) {
					this.gameFinished = true
					this.clearEscapeDispatcher()
					const final = this.basePeopleInHouse + this.totalEntered - this.totalEscaped
					this.finalCount = Math.max(0, final)
					console.log(`🏁 [Level ${this.currentLevel}] 游戏结束 - 初始: ${this.basePeopleInHouse}人, 进入: ${this.totalEntered}人, 逃离: ${this.totalEscaped}人`)
					console.log(`🏠 [Final Count] 最终房屋内小人数量: ${this.finalCount}人`)
					this.showResult = true
					this.recognitionHandled = false
					console.log(`⌨️ [Input] 进入答题阶段 - showResult: ${this.showResult}, inputMode: ${this.inputMode}`)
					// 根据输入模式决定初始化方式
					if (this.inputMode === 0) {
						// Canvas 2D 模式
						this.$nextTick(() => { 
							this.setupCanvas && this.setupCanvas(); 
							this._startPadIdleWatcher && this._startPadIdleWatcher(); 
							setTimeout(()=>{ this.recognizeDigit && this.recognizeDigit() }, 1200) 
						})
					} else {
						// 数字键盘模式
						this.keypadInput = ''
						this.keypadConfirmed = false
						console.log(`⌨️ [Keypad] 数字键盘初始化 - keypadExpanded: ${this.keypadExpanded}`)
					}
				}
			},
			// 画板
			setupCanvas() {
				// 适配像素比
				const query = uni.createSelectorQuery().in(this)
				query.select('#digitCanvas').fields({ node: true, size: true, rect: true }).exec(res => {
					if (!res || !res[0]) {
						console.error('[Canvas] Failed to get canvas node')
						return
					}
					const canvas = res[0].node
					if (!canvas) {
						console.error('[Canvas] Canvas node is null')
						return
					}
					
					const dpr = uni.getWindowInfo().pixelRatio || 1
					
					// 设置canvas尺寸
					canvas.width = res[0].width * dpr
					canvas.height = res[0].height * dpr
					this.canvasWidth = res[0].width
					this.canvasHeight = res[0].height
					this._canvasDevW = canvas.width
					this._canvasDevH = canvas.height
					this._dpr = dpr
					
					const ctx = canvas.getContext('2d')
					if (!ctx) {
						console.error('[Canvas] Failed to get 2d context')
						return
					}
					
					// 应用像素比缩放
					ctx.scale(dpr, dpr)
					
					// 设置绘制样式（使用配置）
					const drawConfig = CANVAS_CONFIG.drawing
					ctx.lineCap = drawConfig.lineCap
					ctx.lineJoin = drawConfig.lineJoin
					ctx.lineWidth = drawConfig.lineWidth
					ctx.strokeStyle = drawConfig.strokeStyle
					ctx.fillStyle = drawConfig.backgroundColor
					
					// 先填充白色背景，确保画布可见
					ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
					
					// 小程序环境：初始化路径状态
					ctx.beginPath()
					
					this.ctx = ctx
					// 保存画布相对页面的偏移用于触摸坐标换算
					this._canvasRect = { left: res[0].left || 0, top: res[0].top || 0 }
				})
			},
			async _getImageData() {
				// 返回 { data: Uint8ClampedArray, width, height }，优先使用 2D ctx.getImageData，失败则使用 uni.canvasGetImageData
				const devW = this._canvasDevW || (this.canvasWidth || 0)
				const devH = this._canvasDevH || (this.canvasHeight || 0)
				if (!this.ctx || !devW || !devH) return null
				try {
					const img = this.ctx.getImageData(0, 0, devW, devH)
					return { data: img.data, width: devW, height: devH }
				} catch(e) {
					// 小程序老设备用 API 兜底
					return await new Promise((resolve) => {
						uni.canvasGetImageData({
							canvasId: 'digitCanvas',
							x: 0, y: 0, width: devW, height: devH,
							quality: 1,
							success: (res)=>{
								resolve({ data: new Uint8ClampedArray(res.data), width: res.width, height: res.height })
							},
							fail: ()=>resolve(null)
						}, this)
					})
				}
			},
			_getCanvasXY(e) {
				const t0 = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || {}
				
				// WeChat 2D canvas 事件提供相对画布的 x/y，优先使用
				if (t0.x != null && t0.y != null) {
					return { x: t0.x, y: t0.y }
				}
				
				// 使用页面坐标转换
				const rect = this._canvasRect || { left: 0, top: 0 }
				const clientX = t0.clientX != null ? t0.clientX : t0.pageX
				const clientY = t0.clientY != null ? t0.clientY : t0.pageY
				const x = clientX - rect.left
				const y = clientY - rect.top
				
				return { x, y }
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
					console.error('[Canvas] No context available for drawing')
					return
				}
				
				// 清除所有识别相关的定时器，避免在绘制过程中误触发识别
				if (this._recognizeTimer) { clearTimeout(this._recognizeTimer); this._recognizeTimer = null }
				if (this._forceRecognizeTimer) { clearTimeout(this._forceRecognizeTimer); this._forceRecognizeTimer = null }
				
				// 获取触摸点在Canvas中的相对坐标
				const { x, y } = this._getCanvasXY(e)
				this.isDrawing = true
				this.lastPoint = { x, y }
				
				// 确保绘制样式正确（使用配置）
				const drawConfig = CANVAS_CONFIG.drawing
				this.ctx.lineWidth = drawConfig.lineWidth     // 线条粗细
				this.ctx.strokeStyle = drawConfig.strokeStyle // 线条颜色
				this.ctx.lineCap = drawConfig.lineCap         // 线条端点样式
				this.ctx.lineJoin = drawConfig.lineJoin       // 线条连接样式
				
				// 开始新的路径
				this.ctx.beginPath()
				this.ctx.moveTo(x, y)
				
				// 记录绘图时间戳，用于识别延迟计算
				this._lastDrawTs = Date.now()
				// 只在第一笔画时清除识别结果，避免多笔画时频繁清除
				if (this._strokeCount === 0) {
					this.recognizedDigit = null
				}
				this._strokeLen = 0  // 重置当前笔画长度
			},
			
			/**
			 * 画板触摸移动事件处理
			 * 功能：
			 * 1. 绘制连续的线条轨迹
			 * 2. 计算并累积笔画长度（用于AI识别特征）
			 * 3. 更新最后绘制时间戳
			 */
			onCanvasTouchMove(e) {
				// 只有在绘制状态且Canvas上下文存在时才处理
				if (!this.isDrawing || !this.ctx) {
					return
				}
				
				// 获取当前触摸点坐标
				const { x, y } = this._getCanvasXY(e)
				
				// 小程序2D canvas优化：使用连续路径绘制而不是每次都重新开始
				// 这样可以获得更流畅的线条效果
				this.ctx.lineTo(x, y)
				this.ctx.stroke()
				
				// 累计笔画长度 - 这是AI识别数字的重要特征之一
				if (this.lastPoint) {
					const dx = x - this.lastPoint.x, dy = y - this.lastPoint.y
					this._strokeLen += Math.sqrt(dx*dx + dy*dy)
				}
				
				// 更新最后绘制点和时间戳
				this.lastPoint = { x, y }
				this._lastDrawTs = Date.now()
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
				// 结束绘制状态
				this.isDrawing = false
				this.lastPoint = null
				
				// 统计笔画数据 - 用于AI识别特征分析
				this._strokeCount++                           // 笔画数量
				this._totalStrokeLen += this._strokeLen      // 总笔画长度
				this._lastStrokeEndTime = Date.now()         // 最后笔画结束时间
				
				// 小程序环境：触摸结束后强制重绘，确保内容显示
				// 解决某些情况下Canvas内容不显示的问题
				if (this.ctx) {
					this._forceCanvasRedraw()
				}
				
				// 清除之前的识别定时器，避免重复识别
				if (this._recognizeTimer) clearTimeout(this._recognizeTimer)
				if (this._forceRecognizeTimer) clearTimeout(this._forceRecognizeTimer)
				
				// 启动延迟识别机制
				// 延迟给用户时间写多笔画数字（如8、4、6等）
				const waitMs = this._recognizeDelayMs
				this._recognizeTimer = setTimeout(() => { 
					this.recognizeDigit && this.recognizeDigit() 
				}, waitMs)
				
				// 兜底机制：最长3秒后强制识别一次
				// 防止因为各种原因导致识别永远不触发
				this._forceRecognizeTimer = setTimeout(() => { 
					this.recognizeDigit && this.recognizeDigit() 
				}, 3000)
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
					console.error('[Canvas] No context available for clearing')
					return
				}
				
				// 清除画布并重新填充背景（使用配置）
				const drawConfig = CANVAS_CONFIG.drawing
				this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
				this.ctx.fillStyle = drawConfig.backgroundColor
				this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
				
				// 重置绘制样式为配置默认值
				this.ctx.strokeStyle = drawConfig.strokeStyle  // 线条颜色
				this.ctx.lineWidth = drawConfig.lineWidth      // 线条粗细
				this.ctx.lineCap = drawConfig.lineCap          // 线条端点样式
				this.ctx.lineJoin = drawConfig.lineJoin        // 线条连接样式
				
				// 小程序环境：重新开始路径并强制重绘
				// 确保Canvas状态正确重置
				this.ctx.beginPath()
				this._forceCanvasRedraw()
				
				// 清除识别相关状态
				this.recognizedDigit = null      // 清除识别结果
				
				// 重置笔画统计数据 - 用于AI识别特征
				this._strokeCount = 0            // 笔画数量
				this._totalStrokeLen = 0        // 总笔画长度
				this._strokeLen = 0             // 当前笔画长度
				this._lastStrokeEndTime = 0     // 最后笔画结束时间
				
				// 清除识别定时器
				if (this._recognizeTimer) { clearTimeout(this._recognizeTimer); this._recognizeTimer = null }
				if (this._forceRecognizeTimer) { clearTimeout(this._forceRecognizeTimer); this._forceRecognizeTimer = null }
				
				// 清除确认倒计时
				this.clearConfirmationTimer()
			},
			async recognizeDigit() {
				if (!this.ctx) return
				const img = await this._getImageData()
				if (!img) { this.recognizedDigit = null; return }
				
				// 清除定时器
				if (this._recognizeTimer) { clearTimeout(this._recognizeTimer); this._recognizeTimer = null }
				if (this._forceRecognizeTimer) { clearTimeout(this._forceRecognizeTimer); this._forceRecognizeTimer = null }
				
				const w = img.width
				const h = img.height
				const gray = new Uint8Array(w*h)
				const alpha = new Uint8Array(w*h)
				
				// 转换为灰度图并建立直方图
				const hist = new Uint32Array(256)
				for (let y=0;y<h;y++) {
					for (let x=0;x<w;x++) {
						const idx = (y*w + x) * 4
						const r = img.data[idx], g = img.data[idx+1], b = img.data[idx+2], a = img.data[idx+3]
						const lum = Math.round((r*299 + g*587 + b*114)/1000)
						gray[y*w+x] = lum
						alpha[y*w+x] = a
						if (a > 10) hist[lum]++
					}
				}
				
				// Otsu自适应阈值
				let sum=0, sumB=0, wB=0, wF=0, maxVar=-1, thresh=128
				const total = w*h
				for (let i=0;i<256;i++) sum += i*hist[i]
				for (let t=0;t<256;t++) {
					wB += hist[t]
					if (wB === 0) continue
					wF = total - wB
					if (wF === 0) break
					sumB += t*hist[t]
					const mB = sumB / wB
					const mF = (sum - sumB) / wF
					const between = wB * wF * (mB - mF) * (mB - mF)
					if (between > maxVar) { maxVar = between; thresh = t }
				}
				
				// 二值化
				const bin = new Uint8Array(w*h)
				let cnt = 0
				for (let i=0;i<w*h;i++) {
					if (alpha[i] > 10 && gray[i] < thresh) {
						bin[i] = 1
						cnt++
					}
				}
				
				if (cnt < 50) { 
					this.recognizedDigit = null
					return 
				}
				
				// 形态学处理：闭运算填补小空隙
				this._morphologyClose(bin, w, h, 2)
				
				// 提取连通域
				const comps = this._connectedComponents(bin, w, h)
				if (comps.length === 0) {
					this.recognizedDigit = null
					return
				}
				
				// 智能合并和分割连通域
				const digits = this._segmentDigits(comps, w, h)
				
				// 识别每个数字
				let text = ''
				
				for (let i = 0; i < digits.length; i++) {
					const digit = digits[i]
					const result = this._classifyDigitAdvanced(bin, w, h, digit)
					if (result !== null) {
						text += String(result)
					}
				}
				
				this.recognizedDigit = text
				if (text) {
					console.log(`🤖 [AI Recognition] 识别结果: "${text}"`)
				}
				const num = parseInt(text)
				if (!isNaN(num) && num >= 0 && num <= 100) {
					// 启动延迟确认机制
					this.startConfirmationCountdown(num)
				}
			},
			// 启动延迟确认倒计时
			startConfirmationCountdown(recognizedNumber) {
				// 清除之前的确认定时器
				this.clearConfirmationTimer()
				
				// 开始倒计时（使用配置）
				this._confirmationCountdown = CANVAS_CONFIG.recognition.confirmationCountdown
				this.showConfirmationCountdown = true
				
				const countdownInterval = setInterval(() => {
					this._confirmationCountdown--
					if (this._confirmationCountdown <= 0) {
						clearInterval(countdownInterval)
						this.showConfirmationCountdown = false
						// 如果倒计时结束且没有被清除，则自动提交
						if (this.recognizedDigit !== null && !this.recognitionHandled) {
							this.handleRecognitionResult(recognizedNumber)
						}
					}
				}, 1000)
				
				// 保存定时器引用以便清除
				this._confirmationTimer = countdownInterval
			},
			
			// 清除确认定时器
			clearConfirmationTimer() {
				if (this._confirmationTimer) {
					clearInterval(this._confirmationTimer)
					this._confirmationTimer = null
				}
				this.showConfirmationCountdown = false
				this._confirmationCountdown = 0
			},
			
			handleRecognitionResult(pred) {
				if (this.recognitionHandled) return
				if (pred == null) return
				this.recognitionHandled = true
				
				// 清除确认定时器
				this.clearConfirmationTimer()
				
				const isCorrect = Number(pred) === Number(this.finalCount)
				console.log(`📝 [Answer] 用户答案: ${pred}, 正确答案: ${this.finalCount}, 结果: ${isCorrect ? '✅正确' : '❌错误'}`)
				
				// 先短暂展示识别结果文本，再开始揭示流程（使用配置）
				setTimeout(()=>{
					this.startRevealSequence(isCorrect)
				}, BALANCE_CONFIG.flow.autoProgressDelay)
			},
			startRevealSequence(isCorrect) {
				// 隐藏画板
				this.showResult = false
				
				// 🔧 清理所有其他阶段的小人，确保只显示揭示阶段的红色小人
				this.peopleHidden = true           // 隐藏初始5个小人
				this.movingPeople = []             // 清空移动的小人
				this.escapingPeople = []           // 清空逃离的小人
				
				// 清理相关定时器
				this.clearAllWaveTimers()         // 清理移动小人的定时器
				this.clearEscapeTimers()          // 清理逃离小人的定时器
				
				// 1) 房子上移
				this.houseLift = false
				this.coverVisible = true
				this.revealVisible = false
				this.revealPeople = []
				this.revealActiveIndex = -1
				this.revealCountNum = 0
				const liftT = setTimeout(()=>{ this.houseLift = true }, HOUSE_CONFIG.animations.revealLift.delay)
				this.revealTimers.push(liftT)
				// 2) 房子移走后展示人数（紧凑排列），并逐个变红+数字递增
				const afterLift = setTimeout(()=>{
					this.revealVisible = true
					const total = Math.max(0, this.finalCount)
					this.revealPeople = Array.from({length: total}, (_,i)=>i)
					const stepMs = BALANCE_CONFIG.flow.revealAnimationStep
					for (let i=0;i<total;i++) {
						const t = setTimeout(()=>{
							this.revealActiveIndex = i
							this.revealCountNum = i+1
						}, i*stepMs)
						this.revealTimers.push(t)
					}
					// 3) 全部完成后弹窗
					const afterAll = setTimeout(()=>{
						
						// 强制弹窗显示
						const showModal = () => {
							
							if (isCorrect) {
								// 答对了，进入下一关
								this.currentLevel += 1
								console.log(`🎉 [Level Up] 恭喜通过第${this.currentLevel-1}关，进入第${this.currentLevel}关！`)
								
								// 添加弹窗状态标记
								this._modalShown = true
								
								uni.showModal({
									title: `第${this.currentLevel-1}关通过！`,
									content: `恭喜进入第${this.currentLevel}关！难度将会增加。`,
									confirmText: '下一关',
									cancelText: '退出',
									showCancel: true,
									success: (res)=>{
										this._modalShown = false
										if (res.confirm) {
											// 先清理揭示状态的定时器，避免兜底定时器重复执行
											this.clearRevealState && this.clearRevealState()
											this.startCountdown && this.startCountdown()
										} else if (res.cancel) {
											uni.reLaunch({ url: '/pages/index/index' })
										}
									},
									fail: (err) => {
										console.error(`[Game] Modal failed:`, err)
										this._modalShown = false
										// 如果弹窗失败，先清理揭示状态的定时器，然后进入下一关
										this.clearRevealState && this.clearRevealState()
										this.startCountdown && this.startCountdown()
									}
								})
								
							} else {
								// 答错了，记录失败并检查是否可以复活
								const failedLevel = this.currentLevel
								this.recordFailure() // 记录失败
								
								console.log(`💥 [Game Over] 第${failedLevel}关失败`)
								
								// 检查是否可以使用分享复活
								if (this.canUseRevival()) {
									// 可以复活，显示复活选项
									this.showRevivalModal(failedLevel)
								} else {
									// 不能复活，直接重置到第一关
									this.currentLevel = 1
									console.log(`💥 [Game Over] 第${failedLevel}关失败，重置到第1关`)
									this.showGameOverModal(failedLevel)
								}
								
							}
						}
						
						// 尝试显示弹窗
						showModal()
						
						// 兜底：如果弹窗没有显示，5秒后强制进入下一关
						const fallbackTimer = setTimeout(() => {
							if (isCorrect && this.currentLevel > 1) {
								if (!this._modalShown) {
									this.startCountdown && this.startCountdown()
								}
							}
						}, 5000)
						this.revealTimers.push(fallbackTimer)
						
					}, Math.max(200, total*stepMs + 200))
					this.revealTimers.push(afterAll)
				}, 700)
				this.revealTimers.push(afterLift)
			},
			clearRevealState() {
				this.houseLift = false
				this.revealVisible = false
				this.revealPeople = []
				this.revealActiveIndex = -1
				this.revealCountNum = 0
				this.revealTimers && this.revealTimers.forEach(t=>clearTimeout(t))
				this.revealTimers = []
				if (this._recognizeTimer) { clearTimeout(this._recognizeTimer); this._recognizeTimer = null }
				if (this._forceRecognizeTimer) { clearTimeout(this._forceRecognizeTimer); this._forceRecognizeTimer = null }
				this._stopPadIdleWatcher && this._stopPadIdleWatcher()
				
				// 🔧 同时清理其他阶段的小人，防止在重新开始游戏时出现残留
				this.movingPeople = []        // 清空移动的小人
				this.escapingPeople = []      // 清空逃离的小人
				this.clearAllWaveTimers()     // 清理移动小人的定时器
				this.clearEscapeTimers()      // 清理逃离小人的定时器
				
				// 重置弹窗状态
				this._modalShown = false
			},
			countHoles(arr, w, h) {
				// 统计0区域中不与边界联通的块数量
				const vis = new Uint8Array(w*h)
				const inb = (x,y)=>x>=0&&y>=0&&x<w&&y<h
				const q=[]
				// 标记与边界相连的0
				for (let x=0;x<w;x++) {
					if (!arr[x] && !vis[x]) this.fill(arr, vis, w,h, x,0)
					const i2=(h-1)*w+x; if (!arr[i2] && !vis[i2]) this.fill(arr, vis, w,h, x,h-1)
				}
				for (let y=0;y<h;y++) {
					const i1=y*w; if (!arr[i1] && !vis[i1]) this.fill(arr, vis, w,h, 0,y)
					const i2=y*w+(w-1); if (!arr[i2] && !vis[i2]) this.fill(arr, vis, w,h, w-1,y)
				}
				let holes=0
				for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
					const i=y*w+x
					if (!arr[i] && !vis[i]) { holes++; this.fill(arr, vis, w,h, x,y) }
				}
				return holes
			},
			fill(arr, vis, w,h, sx,sy) {
				const st=[sx,sy]
				while (st.length) {
					const y=st.pop(), x=st.pop()
					const i=y*w+x
					if (x<0||y<0||x>=w||y>=h) continue
					if (vis[i]) continue
					if (arr[i]) continue
					vis[i]=1
					st.push(x+1,y, x-1,y, x,y+1, x,y-1)
				}
			},
			holeCenterY(arr, w,h) {
				const vis = new Uint8Array(w*h)
				// 去掉与边界相连的0
				for (let x=0;x<w;x++) { if (!arr[x]) this.fill(arr, vis, w,h, x,0); const i2=(h-1)*w+x; if (!arr[i2]) this.fill(arr, vis, w,h, x,h-1) }
				for (let y=0;y<h;y++) { const i1=y*w; if (!arr[i1]) this.fill(arr, vis, w,h, 0,y); const i2=y*w+(w-1); if (!arr[i2]) this.fill(arr, vis, w,h, w-1,y) }
				let sumY=0, count=0
				for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
					const i=y*w+x
					if (!arr[i] && !vis[i]) { sumY+=y; count++ }
				}
				return count? sumY/count : h/2
			},
			_densityFeatures(arr, w,h) {
				let top=0,bottom=0,left=0,right=0,cySum=0,cnt=0
				for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
					const v = arr[y*w+x]
					if (v) {
						cnt++; cySum+=y
						if (y < h/2) top++; else bottom++
						if (x < w/2) left++; else right++
					}
				}
				return { topDensity: top/(w*h/2), bottomDensity: bottom/(w*h/2), leftDensity: left/(w*h/2), rightDensity: right/(w*h/2), centerY: cnt? cySum/cnt : h/2 }
			},
			_connectedComponents(bin, w, h) {
				const vis = new Uint8Array(w*h)
				const comps = []
				const push = (arr,x,y)=>{ arr.push(x,y) }
				for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
					const i=y*w+x
					if (!bin[i] || vis[i]) continue
					let area=0, minX=x, maxX=x, minY=y, maxY=y, sumX=0, sumY=0
					const st=[]; push(st,x,y)
					while (st.length) {
						const cy=st.pop(), cx=st.pop()
						if (cx<0||cy<0||cx>=w||cy>=h) continue
						const ii=cy*w+cx
						if (vis[ii]||!bin[ii]) continue
						vis[ii]=1; area++; sumX+=cx; sumY+=cy
						if (cx<minX) minX=cx; if (cx>maxX) maxX=cx; if (cy<minY) minY=cy; if (cy>maxY) maxY=cy
						push(st,cx+1,cy); push(st,cx-1,cy); push(st,cx,cy+1); push(st,cx,cy-1)
					}
					const bw=maxX-minX+1, bh=maxY-minY+1
					comps.push({ minX, minY, maxX, maxY, bw, bh, area, cx: sumX/area, cy: sumY/area })
				}
				return comps
			},
			_classifyDigit(bin, w, h, comp) {
				// 裁剪为28x28并提取特征
				const sw=28, sh=28
				const scaled = new Uint8Array(sw*sh)
				for (let y=0;y<sh;y++) for (let x=0;x<sw;x++) {
					const sx = Math.floor(comp.minX + x*comp.bw/sw)
					const sy = Math.floor(comp.minY + y*comp.bh/sh)
					scaled[y*sw+x] = bin[sy*w+sx]
				}
				const holes = this.countHoles(scaled, sw, sh)
				const aspect = comp.bw/comp.bh
				const { topDensity, bottomDensity, leftDensity, rightDensity, centerY } = this._densityFeatures(scaled, sw, sh)
				let pred = null
				if (holes >= 2) pred = 8
				else if (holes === 1) {
					const cy = this.holeCenterY(scaled, sw, sh)
					if (cy < sh*0.45) pred = 9
					else if (cy > sh*0.6) pred = 6
					else pred = 0
				} else {
					if (aspect < 0.45) pred = 1
					else if (aspect >= 1.25 && topDensity > bottomDensity*1.5 && rightDensity > leftDensity*1.2) pred = 7
					else if (aspect > 0.85 && aspect < 1.25 && topDensity < bottomDensity*0.75) pred = 3
					else if (centerY > sh*0.65 && rightDensity > leftDensity*1.2) pred = 2
					else pred = 2
				}
				return pred
			},
			// 形态学闭运算
			_morphologyClose(bin, w, h, radius) {
				// 先膨胀后腐蚀
				const temp = new Uint8Array(w*h)
				
				// 膨胀
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						let maxVal = 0
						for (let dy=-radius; dy<=radius; dy++) {
							for (let dx=-radius; dx<=radius; dx++) {
								const nx = x + dx, ny = y + dy
								if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
									if (bin[ny*w + nx] > maxVal) maxVal = bin[ny*w + nx]
								}
							}
						}
						temp[y*w + x] = maxVal
					}
				}
				
				// 腐蚀
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						let minVal = 1
						for (let dy=-radius; dy<=radius; dy++) {
							for (let dx=-radius; dx<=radius; dx++) {
								const nx = x + dx, ny = y + dy
								if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
									if (temp[ny*w + nx] < minVal) minVal = temp[ny*w + nx]
								}
							}
						}
						bin[y*w + x] = minVal
					}
				}
			},
			
						// 智能分割数字
			_segmentDigits(comps, w, h) {
				if (comps.length === 0) return []
				
				// 过滤噪声 - 更严格的过滤
				let filtered = comps.filter(c => c.area > Math.max(50, (w*h)*0.002))
				if (filtered.length === 0 && comps.length > 0) {
					// 如果过滤太严格，取面积最大的几个
					const sorted = comps.slice().sort((a, b) => b.area - a.area)
					filtered = sorted.slice(0, Math.min(3, sorted.length))
				}
				
				// 按x坐标排序
				filtered.sort((a, b) => a.cx - b.cx)
				
				// 分析数字的典型宽度
				const avgWidth = filtered.reduce((sum, c) => sum + c.bw, 0) / filtered.length
				const avgHeight = filtered.reduce((sum, c) => sum + c.bh, 0) / filtered.length
				
				// 检测是否需要分割过宽的连通域
				const segments = []
				for (const comp of filtered) {
					// 如果宽度明显超过平均值，可能是两个数字连在一起
					if (comp.bw > avgWidth * 1.8 && comp.bw > avgHeight * 0.8) {
						// 尝试垂直分割
						const splitComps = this._trySplitComponent(comp, w, h)
						segments.push(...splitComps)
				} else {
						segments.push(comp)
					}
				}
				
				// 智能合并相近的连通域（更保守的合并策略）
				const merged = []
				const mergeThreshold = Math.max(avgWidth * 0.2, 8) // 更小的合并阈值
				
				for (const comp of segments) {
					if (merged.length === 0) {
						merged.push({...comp})
						continue
					}
					
					const last = merged[merged.length - 1]
					const xGap = comp.minX - last.maxX
					const yOverlap = Math.max(0, Math.min(comp.maxY, last.maxY) - Math.max(comp.minY, last.minY))
					const minHeight = Math.min(comp.bh, last.bh)
					
					// 更严格的合并条件
					const shouldMerge = (
						xGap <= mergeThreshold && 
						yOverlap >= minHeight * 0.6 && // 需要更多重叠
						comp.area < avgWidth * avgHeight * 0.3 && // 面积不能太大
						last.area < avgWidth * avgHeight * 0.3
					)
					
					if (shouldMerge) {
						last.minX = Math.min(last.minX, comp.minX)
						last.maxX = Math.max(last.maxX, comp.maxX)
						last.minY = Math.min(last.minY, comp.minY)
						last.maxY = Math.max(last.maxY, comp.maxY)
						last.bw = last.maxX - last.minX + 1
						last.bh = last.maxY - last.minY + 1
						last.area += comp.area
						last.cx = (last.minX + last.maxX) / 2
						last.cy = (last.minY + last.maxY) / 2
					} else {
						merged.push({...comp})
					}
				}
				
				return merged.sort((a, b) => a.cx - b.cx) // 最终按x坐标排序
			},
			
			// 尝试分割连通域
			_trySplitComponent(comp, canvasW, canvasH) {
				// 简单的垂直分割策略
				const midX = Math.floor((comp.minX + comp.maxX) / 2)
				const leftComp = {
					minX: comp.minX,
					maxX: midX,
					minY: comp.minY,
					maxY: comp.maxY,
					bw: midX - comp.minX + 1,
					bh: comp.bh,
					area: comp.area / 2, // 估算
					cx: (comp.minX + midX) / 2,
					cy: comp.cy
				}
				const rightComp = {
					minX: midX + 1,
					maxX: comp.maxX,
					minY: comp.minY,
					maxY: comp.maxY,
					bw: comp.maxX - midX,
					bh: comp.bh,
					area: comp.area / 2, // 估算
					cx: (midX + 1 + comp.maxX) / 2,
					cy: comp.cy
				}
				
				// 检查分割是否有意义（两部分都有足够面积）
				if (leftComp.bw > 10 && rightComp.bw > 10) {
					return [leftComp, rightComp]
				}
				
				return [comp] // 不分割
			},
			
			// 改进的数字分类算法
			_classifyDigitAdvanced(bin, w, h, comp) {
				const sw = 32, sh = 32
				const scaled = new Uint8Array(sw * sh)
				
				// 提取数字区域并缩放到32x32
				for (let y = 0; y < sh; y++) {
					for (let x = 0; x < sw; x++) {
						const sx = Math.floor(comp.minX + x * comp.bw / sw)
						const sy = Math.floor(comp.minY + y * comp.bh / sh)
						if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
							scaled[y * sw + x] = bin[sy * w + sx]
						}
					}
				}
				
				// 计算特征，使用原始连通域的宽高比而不是缩放后的
				const features = this._extractDigitFeatures(scaled, sw, sh)
				features.originalAspect = comp.bw / comp.bh  // 使用原始宽高比
				
				// 基于特征进行分类
				const result = this._classifyByFeatures(features, comp)
				
				return result
			},
			
			// 提取数字特征
			_extractDigitFeatures(bin, w, h) {
				const features = {}
				
				// 基本特征
				let totalPixels = 0
				let sumX = 0, sumY = 0
				for (let y = 0; y < h; y++) {
					for (let x = 0; x < w; x++) {
						if (bin[y * w + x]) {
							totalPixels++
							sumX += x
							sumY += y
						}
					}
				}
				
				if (totalPixels === 0) return features
				
				const centerX = sumX / totalPixels
				const centerY = sumY / totalPixels
				
				// 区域密度
				const regions = this._getRegionDensities(bin, w, h)
				features.topDensity = regions.top
				features.bottomDensity = regions.bottom
				features.leftDensity = regions.left
				features.rightDensity = regions.right
				features.centerDensity = regions.center
				
				// 洞的数量和位置
				const holes = this._analyzeHoles(bin, w, h)
				features.holeCount = holes.count
				features.holePositions = holes.positions
				
				// 投影特征
				const projections = this._getProjections(bin, w, h)
				features.horizontalProjection = projections.horizontal
				features.verticalProjection = projections.vertical
				
				// 轮廓特征
				features.aspect = this._getAspectRatio(bin, w, h)
				features.compactness = this._getCompactness(bin, w, h)
				
				// 端点和交叉点
				const endpoints = this._findEndpoints(bin, w, h)
				features.endpointCount = endpoints.length
				
				const crossings = this._findCrossings(bin, w, h)
				features.crossingCount = crossings.length
				
				return features
			},
			
			// 基于特征分类 - 重新设计的算法
			_classifyByFeatures(features, comp) {
				// 优先使用原始宽高比
				const aspect = features.originalAspect || features.aspect || (comp.bw / comp.bh)
				const topBottomRatio = features.topDensity / (features.bottomDensity || 0.01)
				const rightLeftRatio = features.rightDensity / (features.leftDensity || 0.01)
				
				// 首先基于最可靠的特征：洞的数量
				if (features.holeCount >= 2) return 8  // 两个或更多洞 = 8
				
				if (features.holeCount === 1) {
					const holeY = features.holePositions[0]?.y || 0.5
					
					// 数字9: 洞在上方，且有特定的密度分布特征
					if (holeY < 0.4 || (topBottomRatio > 1.5 && aspect < 0.8)) {
						return 9
					}
					// 数字6: 洞在下方
					if (holeY > 0.6) {
						return 6
					}
					// 数字0: 洞在中间，合理宽高比
					if (aspect > 0.6 && aspect < 1.5) {
						return 0
					}
					
					// 如果有洞但位置不明确，根据其他特征判断
					if (topBottomRatio > 1.8 && aspect < 0.8) {
						return 9
					}
				}
				
				// 数字7: 特征优先检查 - 顶重、右重、少交叉（优先于窄数字判断）
				if (topBottomRatio >= 1.4 && rightLeftRatio >= 2.5) {
					// 7的交叉点应该很少，因为主要是直线和对角线
					if (features.crossingCount <= 5) {  // 放宽交叉点限制，但仍然有限制
						return 7
					}
				}
				
				// 数字1: 最窄的数字且没有洞，且不是7的特征，交叉点少
				if (aspect < 0.6 && features.holeCount === 0 && rightLeftRatio < 2.0 && features.crossingCount <= 2) {
					return 1
				}
				
				// 数字9: 特殊处理 - 可能有洞也可能没洞，但有明显的上重下轻特征，且不是7
				if (topBottomRatio >= 1.4 && aspect < 0.8 && rightLeftRatio < 2.5) {
					// 9的特征：窄、上重、右侧有密度但不如7极端
					if (features.rightDensity > 0.3 && rightLeftRatio > 1.5) {
						return 9
					}
				}
				
				// 数字9的备用检测：没洞但有9的其他特征
				if (topBottomRatio >= 1.4 && topBottomRatio < 2.5 && features.holeCount === 0 && aspect < 0.8) {
					// 9的右侧密度不会像7那样突出，但比1要高
					if (rightLeftRatio < 2.5 && features.rightDensity > 0.3) {
						return 9
					}
				}
				
				// 数字4: 有明确的交叉点，且左右都有密度，优先检查
				if (features.crossingCount >= 1 && features.crossingCount <= 8) {
					// 4的特征：宽度合理，左右都有内容，上下都有内容
					if (aspect > 0.8 && aspect < 1.5 && features.leftDensity > 0.15 && features.rightDensity > 0.15) {
						if (features.topDensity > 0.15 && features.bottomDensity > 0.15) {
							return 4
						}
					}
				}
				
				// 数字2: 底部密度明显高于顶部
				if (features.bottomDensity > features.topDensity * 1.4) {
					const maxHorizontal = Math.max(...(features.horizontalProjection || [0]))
					const avgHorizontal = (features.horizontalProjection || [0]).reduce((a, b) => a + b, 0) / features.horizontalProjection.length
					if (maxHorizontal > avgHorizontal * 1.2) {
						return 2
					}
				}
				
				// 数字3: 右侧密度高，有一定的交叉点，不是7
				if (rightLeftRatio > 1.5 && rightLeftRatio < 2.5 && features.crossingCount >= 1) {
					// 3的特征：右重，宽高比适中，有弯曲结构
					if (aspect > 0.6 && aspect < 1.0 && features.rightDensity > 0.25) {
						return 3
					}
				}
				
				// 数字5: 特殊形状，上重但不极端，左右相对平衡
				if (topBottomRatio > 1.0 && topBottomRatio < 2.0 && features.crossingCount >= 1 && features.holeCount === 0) {
					// 5的特征：上部有内容，左右相对平衡，有转折，宽高比适中
					if (rightLeftRatio > 0.7 && rightLeftRatio < 1.8 && aspect > 0.5 && aspect < 0.9) {
						return 5
					}
				}
				
				// 数字6: 左侧密度很高，底部有密度
				if (features.leftDensity > features.rightDensity * 1.4 && features.bottomDensity > 0.4) {
					if (features.holeCount === 0) {
						return 6
					}
				}
				
				// 基于宽高比的最终分类 - 更严格的条件
				if (aspect < 0.6 && features.holeCount === 0 && rightLeftRatio < 2.0 && features.crossingCount <= 2) {
					return 1
				}
				
				// 有洞但前面没有匹配到的情况，可能是9
				if (features.holeCount === 1 && aspect < 0.8) {
					return 9
				}
				if (aspect > 1.2 && topBottomRatio > 1.5) {
					return 7
				}
				if (features.bottomDensity > features.topDensity * 1.2) {
					return 2
				}
				
				// 最后的特征检查
				// 如果还没识别出来，检查是否是简单的垂直线条（数字1）
				if (aspect < 0.5 && features.holeCount === 0 && features.crossingCount === 0) {
					return 1
				}
				
				return null
			},
			
			// 计算区域密度
			_getRegionDensities(bin, w, h) {
				const hw = Math.floor(w/2), hh = Math.floor(h/2)
				let top=0, bottom=0, left=0, right=0, center=0, total=0
				
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						if (bin[y*w + x]) {
							total++
							if (y < hh) top++
							if (y >= hh) bottom++
							if (x < hw) left++
							if (x >= hw) right++
							if (x >= hw/2 && x < w-hw/2 && y >= hh/2 && y < h-hh/2) center++
						}
					}
				}
				
				const area = w * h
				return {
					top: top / (area/2),
					bottom: bottom / (area/2), 
					left: left / (area/2),
					right: right / (area/2),
					center: center / (area/4)
				}
			},
			
			// 分析洞的特征
			_analyzeHoles(bin, w, h) {
				const vis = new Uint8Array(w*h)
				const holes = []
				
				// 标记与边界相连的0区域
				for (let x=0; x<w; x++) {
					if (!bin[x]) this._floodFill(bin, vis, w, h, x, 0)
					const i2 = (h-1)*w + x
					if (!bin[i2]) this._floodFill(bin, vis, w, h, x, h-1)
				}
				for (let y=0; y<h; y++) {
					if (!bin[y*w]) this._floodFill(bin, vis, w, h, 0, y)
					if (!bin[y*w + w-1]) this._floodFill(bin, vis, w, h, w-1, y)
				}
				
				// 找到内部的洞
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						const i = y*w + x
						if (!bin[i] && !vis[i]) {
							const hole = this._analyzeHole(bin, vis, w, h, x, y)
							if (hole.area > 3) holes.push(hole)
						}
					}
				}
				
				return {
					count: holes.length,
					positions: holes.map(h => ({x: h.cx/w, y: h.cy/h}))
				}
			},
			
			// 分析单个洞
			_analyzeHole(bin, vis, w, h, startX, startY) {
				const stack = [startX, startY]
				let area = 0, sumX = 0, sumY = 0
				
				while (stack.length > 0) {
					const y = stack.pop()
					const x = stack.pop()
					const i = y*w + x
					
					if (x < 0 || y < 0 || x >= w || y >= h || vis[i] || bin[i]) continue
					
					vis[i] = 1
					area++
					sumX += x
					sumY += y
					
					stack.push(x+1, y, x-1, y, x, y+1, x, y-1)
				}
				
				return {
					area,
					cx: area > 0 ? sumX / area : 0,
					cy: area > 0 ? sumY / area : 0
				}
			},
			
			// 洪水填充
			_floodFill(bin, vis, w, h, startX, startY) {
				const stack = [startX, startY]
				
				while (stack.length > 0) {
					const y = stack.pop()
					const x = stack.pop()
					const i = y*w + x
					
					if (x < 0 || y < 0 || x >= w || y >= h || vis[i] || bin[i]) continue
					
					vis[i] = 1
					stack.push(x+1, y, x-1, y, x, y+1, x, y-1)
				}
			},
			
			// 获取投影特征
			_getProjections(bin, w, h) {
				const horizontal = new Array(h).fill(0)
				const vertical = new Array(w).fill(0)
				
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						if (bin[y*w + x]) {
							horizontal[y]++
							vertical[x]++
						}
					}
				}
				
				return { horizontal, vertical }
			},
			
			// 获取宽高比
			_getAspectRatio(bin, w, h) {
				let minX=w, maxX=0, minY=h, maxY=0
				
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						if (bin[y*w + x]) {
							if (x < minX) minX = x
							if (x > maxX) maxX = x
							if (y < minY) minY = y
							if (y > maxY) maxY = y
						}
					}
				}
				
				const width = maxX - minX + 1
				const height = maxY - minY + 1
				return height > 0 ? width / height : 1
			},
			
			// 获取紧密度
			_getCompactness(bin, w, h) {
				let area = 0, perimeter = 0
				
				for (let y=0; y<h; y++) {
					for (let x=0; x<w; x++) {
						if (bin[y*w + x]) {
							area++
							// 计算边界像素
							let isBoundary = false
							for (let dy=-1; dy<=1; dy++) {
								for (let dx=-1; dx<=1; dx++) {
									const nx = x + dx, ny = y + dy
									if (nx < 0 || ny < 0 || nx >= w || ny >= h || !bin[ny*w + nx]) {
										isBoundary = true
										break
									}
								}
								if (isBoundary) break
							}
							if (isBoundary) perimeter++
						}
					}
				}
				
				return perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0
			},
			
			// 找到端点
			_findEndpoints(bin, w, h) {
				const endpoints = []
				
				for (let y=1; y<h-1; y++) {
					for (let x=1; x<w-1; x++) {
						if (!bin[y*w + x]) continue
						
						let neighbors = 0
						for (let dy=-1; dy<=1; dy++) {
							for (let dx=-1; dx<=1; dx++) {
								if (dx === 0 && dy === 0) continue
								if (bin[(y+dy)*w + (x+dx)]) neighbors++
							}
						}
						
						if (neighbors === 1) {
							endpoints.push({x, y})
						}
					}
				}
				
				return endpoints
			},
			
			// 找到交叉点 - 更严格的算法
			_findCrossings(bin, w, h) {
				const crossings = []
				
				for (let y=3; y<h-3; y++) {
					for (let x=3; x<w-3; x++) {
						if (!bin[y*w + x]) continue
						
						// 更严格的方向检查：需要连续的像素
						const upStrong = bin[(y-1)*w + x] && bin[(y-2)*w + x]
						const downStrong = bin[(y+1)*w + x] && bin[(y+2)*w + x]
						const leftStrong = bin[y*w + x-1] && bin[y*w + x-2]
						const rightStrong = bin[y*w + x+1] && bin[y*w + x+2]
						
						const strongConnections = [upStrong, downStrong, leftStrong, rightStrong].filter(Boolean).length
						
						// 只有在有强连接的情况下才考虑交叉
						if (strongConnections >= 3) {
							// 检查周围8个方向，真正的交叉点周围应该有空隙
							const neighbors = [
								bin[(y-1)*w + x-1], bin[(y-1)*w + x], bin[(y-1)*w + x+1],
								bin[y*w + x-1],                        bin[y*w + x+1],
								bin[(y+1)*w + x-1], bin[(y+1)*w + x], bin[(y+1)*w + x+1]
							]
							
							// 计算连续的段数
							let segments = 0
							let inSegment = false
							for (let i = 0; i < 16; i++) { // 遍历两圈以处理环形
								const idx = i % 8
								const isOn = neighbors[idx]
								if (isOn && !inSegment) {
									segments++
									inSegment = true
								} else if (!isOn && inSegment) {
									inSegment = false
								}
							}
							
							// 真正的交叉点应该有3-4个分离的段
							if (segments >= 3 && segments <= 4) {
								// 额外检查：不应该是粗线条的一部分
								let thickLineScore = 0
								for (let dy = -2; dy <= 2; dy++) {
									for (let dx = -2; dx <= 2; dx++) {
										if (bin[(y+dy)*w + (x+dx)]) thickLineScore++
									}
								}
								
								// 如果周围像素太多，可能是粗线条而不是交叉点
								if (thickLineScore <= 15) { // 5x5区域中不超过15个像素
									crossings.push({x, y})
								}
							}
						}
					}
				}
				
				// 更严格的去重：合并距离很近的交叉点
				const merged = []
				for (const crossing of crossings) {
					let shouldAdd = true
					for (const existing of merged) {
						const dist = Math.sqrt((crossing.x - existing.x)**2 + (crossing.y - existing.y)**2)
						if (dist < 8) { // 增加去重距离
							shouldAdd = false
							break
						}
					}
					if (shouldAdd) {
						merged.push(crossing)
					}
				}
				
				return merged
			},
			
			// 数字键盘折叠切换
			toggleKeypad() {
				this.keypadExpanded = !this.keypadExpanded
			},
			
			// 数字键盘交互方法
			onKeypadTap(digit) {
				if (this.keypadConfirmed || this.recognitionHandled) return
				
				// 处理小数点输入
				if (digit === '.') {
					// 如果已经有小数点，不允许再次输入
					if (this.keypadInput.includes('.')) return
					// 如果没有数字，自动添加0
					if (this.keypadInput === '') {
						this.keypadInput = '0.'
					} else {
						this.keypadInput += '.'
					}
					return
				}
				
				// 限制输入长度（使用配置）
				if (this.keypadInput.length >= KEYPAD_CONFIG.features.maxInputLength) return
				
				this.keypadInput += String(digit)
			},
			onKeypadDelete() {
				if (this.keypadConfirmed || this.recognitionHandled) return
				
				if (this.keypadInput.length > 0) {
					this.keypadInput = this.keypadInput.slice(0, -1)
				}
			},
			onKeypadConfirm() {
				if (this.keypadConfirmed || this.recognitionHandled) return
				if (!this.keypadInput) return
				
				const inputNumber = parseFloat(this.keypadInput)
				const validation = KEYPAD_CONFIG.validation
				if (isNaN(inputNumber) || inputNumber < validation.minValue || inputNumber > validation.maxValue) {
					if (validation.showToastOnError) {
						uni.showToast({
							title: validation.errorMessage,
							icon: 'none'
						})
					}
					return
				}
				
				this.keypadConfirmed = true
				this.recognizedDigit = this.keypadInput
				console.log(`⌨️  [Keypad] 数字键盘输入: "${this.keypadInput}" -> ${inputNumber}`)
				
				// 延迟处理结果，和canvas模式保持一致
				// 对于小数，取整数部分进行比较
				const compareNumber = Math.floor(inputNumber)
				setTimeout(() => {
					this.handleRecognitionResult(compareNumber)
				}, 400)
			},
			
			// 定时器清理方法（修复小程序环境未找到函数）
			clearCountdown() {
				if (this.countdownTimer) {
					clearInterval(this.countdownTimer)
					this.countdownTimer = null
				}
			},
			clearCoverHideTimer() {
				if (this.coverHideTimer) {
					clearTimeout(this.coverHideTimer)
					this.coverHideTimer = null
				}
			},
			clearAllWaveTimers() {
				if (this.startSlideTimer) { clearTimeout(this.startSlideTimer); this.startSlideTimer = null }
				this.waveTimers.forEach(t => clearTimeout(t))
				this.waveTimers = []
			},
			clearEscapeTimers() {
				this.escapeTimers.forEach(t => clearTimeout(t))
				this.escapeTimers = []
				if (this.escapeDispatcherTimer) {
					clearTimeout(this.escapeDispatcherTimer)
					this.escapeDispatcherTimer = null
				}
			},
			_startPadIdleWatcher() {
				this._stopPadIdleWatcher()
				this._idleWatchTimer = setInterval(() => {
					if (!this.showResult) return
					if (this.isDrawing) return
					if (this.recognitionHandled) return
					if (this.recognizedDigit && String(this.recognizedDigit).length > 0) return
					const idle = Date.now() - (this._lastDrawTs || 0)
					if (idle >= this._recognizeDelayMs) {
						this.recognizeDigit && this.recognizeDigit()
					}
				}, 250)
			},
			_stopPadIdleWatcher() {
				if (this._idleWatchTimer) { clearInterval(this._idleWatchTimer); this._idleWatchTimer = null }
			},
			
			// 小程序环境：强制重绘画布
			_forceCanvasRedraw() {
				if (!this.ctx) return
				
				// 小程序Canvas 2D的兼容性处理
				try {
					// 方法1：使用draw()方法强制渲染（兼容小程序）
					if (typeof this.ctx.draw === 'function') {
						this.ctx.draw(true) // 小程序特有的draw方法
						return
					}
					
					// 方法2：对于支持的环境，使用原生方法
					if (typeof this.ctx.canvas !== 'undefined' && this.ctx.canvas) {
						// 强制触发重绘
						const canvas = this.ctx.canvas
						if (canvas.requestAnimationFrame) {
							canvas.requestAnimationFrame(() => {})
						}
					}
					
					// 方法3：通过重新设置样式触发重绘
					const currentStroke = this.ctx.strokeStyle
					const currentWidth = this.ctx.lineWidth
					this.ctx.strokeStyle = currentStroke
					this.ctx.lineWidth = currentWidth
					
				} catch (e) {
					// 静默处理重绘错误
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
				if (!REVIVAL_CONFIG.enabled) return
				
				try {
					const stored = uni.getStorageSync(REVIVAL_CONFIG.limits.storageKey)
					if (stored) {
						const data = JSON.parse(stored)
						
						// 检查是否需要重置（新的一天）
						if (REVIVAL_CONFIG.limits.resetOnNewDay) {
							const today = new Date().toDateString()
							if (data.lastResetDate !== today) {
								if (REVIVAL_CONFIG.debug.enableLogging) {
									console.log('🔄 [Revival] 新的一天，重置复活数据')
								}
								this.revivalData = {
									totalFailures: 0,
									totalRevivals: 0,
									lastResetDate: today,
									isReviving: false
								}
								this.saveRevivalData()
								return
							}
						}
						
						this.revivalData = {
							totalFailures: data.totalFailures || 0,
							totalRevivals: data.totalRevivals || 0,
							lastResetDate: data.lastResetDate || new Date().toDateString(),
							isReviving: false
						}
						
						if (REVIVAL_CONFIG.debug.enableLogging) {
							console.log('📊 [Revival] 加载复活数据:', this.revivalData)
						}
					} else {
						// 首次使用，初始化数据
						this.revivalData = {
							totalFailures: 0,
							totalRevivals: 0,
							lastResetDate: new Date().toDateString(),
							isReviving: false
						}
						this.saveRevivalData()
					}
				} catch (e) {
					console.error('[Revival] 加载复活数据失败:', e)
					// 出错时重置为默认值
					this.revivalData = {
						totalFailures: 0,
						totalRevivals: 0,
						lastResetDate: new Date().toDateString(),
						isReviving: false
					}
				}
				
				// 调试模式：重置数据
				if (REVIVAL_CONFIG.debug.resetDataOnLoad) {
					this.revivalData = {
						totalFailures: 0,
						totalRevivals: 0,
						lastResetDate: new Date().toDateString(),
						isReviving: false
					}
					this.saveRevivalData()
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log('🔧 [Revival] 调试模式：重置复活数据')
					}
				}
			},
			
			// 保存复活数据
			saveRevivalData() {
				if (!REVIVAL_CONFIG.enabled) return
				
				try {
					const dataToStore = JSON.stringify({
						totalFailures: this.revivalData.totalFailures,
						totalRevivals: this.revivalData.totalRevivals,
						lastResetDate: this.revivalData.lastResetDate
					})
					uni.setStorageSync(REVIVAL_CONFIG.limits.storageKey, dataToStore)
					
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log('💾 [Revival] 保存复活数据:', this.revivalData)
					}
				} catch (e) {
					console.error('[Revival] 保存复活数据失败:', e)
				}
			},
			
			// 检查是否可以使用分享复活
			canUseRevival() {
				if (!REVIVAL_CONFIG.enabled) return false
				
				const limits = REVIVAL_CONFIG.limits
				
				// 检查失败次数限制
				if (limits.maxFailures > 0 && this.revivalData.totalFailures >= limits.maxFailures) {
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log(`❌ [Revival] 失败次数已达上限 (${this.revivalData.totalFailures}/${limits.maxFailures})`)
					}
					return false
				}
				
				// 检查复活次数限制
				if (limits.maxRevivals > 0 && this.revivalData.totalRevivals >= limits.maxRevivals) {
					if (REVIVAL_CONFIG.debug.enableLogging) {
						console.log(`❌ [Revival] 复活次数已达上限 (${this.revivalData.totalRevivals}/${limits.maxRevivals})`)
					}
					return false
				}
				
				return true
			},
			
			// 记录失败
			recordFailure() {
				if (!REVIVAL_CONFIG.enabled) return
				
				this.revivalData.totalFailures += 1
				this.saveRevivalData()
				
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log(`📈 [Revival] 记录失败，当前失败次数: ${this.revivalData.totalFailures}`)
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
				if (!REVIVAL_CONFIG.enabled) {
					console.warn('[Revival] 分享复活功能未启用')
					return
				}
				
				if (!this.canUseRevival()) {
					uni.showToast({
						title: REVIVAL_CONFIG.share.limitMessage,
						icon: 'none',
						duration: 3000
					})
					return
				}
				
				this.revivalData.isReviving = true
				
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('🔗 [Revival] 开始分享复活流程')
				}
			},
			
			// 🔧 新增：处理重新开始游戏
			restartGame() {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('🔄 [Restart] 用户选择重新开始游戏')
				}
				
				// 隐藏分享复活界面
				this.revivalData.isReviving = false
				
				// 重置到第一关
				this.currentLevel = 1
				
				// 清理游戏状态并重新开始
				this.clearRevealState && this.clearRevealState()
				this.startCountdown && this.startCountdown()
			},
			
			// 🔧 新增：处理退出游戏
			quitGame() {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('🚪 [Quit] 用户选择退出游戏')
				}
				
				// 隐藏分享复活界面
				this.revivalData.isReviving = false
				
				// 返回首页
				uni.reLaunch({ url: '/pages/index/index' })
			},

			

			
			// 获取动态分享内容
			getShareContent() {
				const shareConfig = REVIVAL_CONFIG.share
				let title = shareConfig.title
				let desc = shareConfig.desc
				
				// 检查是否启用动态内容
				if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled) {
					const dynamicConfig = shareConfig.dynamicContent
					
					// 优先使用特定关卡的分享内容
					if (dynamicConfig.levelSpecific && dynamicConfig.levelSpecific[this.currentLevel]) {
						const levelContent = dynamicConfig.levelSpecific[this.currentLevel]
						title = levelContent.title
						desc = levelContent.desc
					} else {
						// 使用默认内容，但替换变量
						title = title.replace('{level}', this.currentLevel)
						desc = desc.replace('{level}', this.currentLevel)
						
						// 根据失败次数添加额外描述
						if (dynamicConfig.failureMessages && dynamicConfig.failureMessages.length > 0) {
							const failures = this.revivalData.totalFailures
							let messageIndex = 0
							
							if (failures <= 2) messageIndex = 0
							else if (failures <= 5) messageIndex = 1
							else if (failures <= 10) messageIndex = 2
							else messageIndex = 3
							
							if (messageIndex < dynamicConfig.failureMessages.length) {
								desc += ` ${dynamicConfig.failureMessages[messageIndex]}`
							}
						}
					}
				} else {
					// 不启用动态内容，只替换基础变量
					title = title.replace('{level}', this.currentLevel)
					desc = desc.replace('{level}', this.currentLevel)
				}
				
				return {
					title,
					desc,
					path: shareConfig.path,
					imageUrl: shareConfig.imageUrl
				}
			},
			
			// 分享成功回调
			onShareSuccess() {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('✅ [Revival] 分享成功')
				}
				
				// 增加复活次数
				this.revivalData.totalRevivals += 1
				this.revivalData.isReviving = false
				this.saveRevivalData()
				
				// 显示成功提示
				uni.showToast({
					title: REVIVAL_CONFIG.share.successMessage,
					icon: 'success',
					duration: 2000
				})
				
				// 延迟后继续下一关
				setTimeout(() => {
					console.log(`🎉 [Revival] 复活成功，继续第${this.currentLevel}关！`)
					this.startCountdown && this.startCountdown()
				}, 2000)
			},
			
			// 分享失败回调
			onShareFail(err) {
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('❌ [Revival] 分享失败:', err)
				}
				
				this.revivalData.isReviving = false
				
				// 显示失败提示
				uni.showToast({
					title: REVIVAL_CONFIG.share.failMessage,
					icon: 'none',
					duration: 2000
				})
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
				this._modalShown = true
				
				const limits = REVIVAL_CONFIG.limits
				const remainingRevivals = limits.maxRevivals > 0 ? (limits.maxRevivals - this.revivalData.totalRevivals) : '∞'
				const remainingFailures = limits.maxFailures > 0 ? (limits.maxFailures - this.revivalData.totalFailures) : '∞'
				
				let content = `第${failedLevel}关挑战失败！`
				
				// 添加动态失败文案
				const shareConfig = REVIVAL_CONFIG.share
				if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled && shareConfig.dynamicContent.failureMessages) {
					const failures = this.revivalData.totalFailures
					let messageIndex = 0
					
					if (failures <= 2) messageIndex = 0
					else if (failures <= 5) messageIndex = 1
					else if (failures <= 10) messageIndex = 2
					else messageIndex = 3
					
					if (messageIndex < shareConfig.dynamicContent.failureMessages.length) {
						content += `\n${shareConfig.dynamicContent.failureMessages[messageIndex]}`
					}
				}
				
				if (REVIVAL_CONFIG.ui.showRevivalCount) {
					content += `\n剩余复活次数：${remainingRevivals}`
				}
				if (REVIVAL_CONFIG.ui.showFailureCount) {
					content += `\n剩余尝试次数：${remainingFailures}`
				}
				content += `\n\n分享给好友获得复活机会，继续挑战！`
				
				// 动态标题
				let title = `第${failedLevel}关失败`
				
				// 根据关卡使用特殊标题
				if (shareConfig.dynamicContent && shareConfig.dynamicContent.enabled && shareConfig.dynamicContent.levelSpecific) {
					const levelContent = shareConfig.dynamicContent.levelSpecific[failedLevel]
					if (levelContent && levelContent.title) {
						title = levelContent.title
					}
				}
				
					// 🔧 修复：不再使用Modal弹窗，而是显示页面内的分享复活界面
				// 设置复活状态，触发页面内分享复活界面的显示
				this.revivalData.isReviving = true
				this._modalShown = false  // 确保不阻塞其他操作
				
				if (REVIVAL_CONFIG.debug.enableLogging) {
					console.log('📱 [Revival] 分享复活界面已显示，等待用户点击分享按钮')
				}
			},
			
			// 显示游戏结束弹窗（不能复活时）
			showGameOverModal(failedLevel) {
				this._modalShown = true
				
				let content = '游戏结束！'
				if (REVIVAL_CONFIG.enabled) {
					const limits = REVIVAL_CONFIG.limits
					if (limits.maxFailures > 0 && this.revivalData.totalFailures >= limits.maxFailures) {
						content += `\n您已达到最大失败次数限制 (${limits.maxFailures}次)`
					}
					if (limits.maxRevivals > 0 && this.revivalData.totalRevivals >= limits.maxRevivals) {
						content += `\n您已用完所有复活机会 (${limits.maxRevivals}次)`
					}
				}
				content += '\n是否从第1关重新开始？'
				
				uni.showModal({
					title: `第${failedLevel}关失败`,
					content: content,
					confirmText: '重新开始',
					cancelText: '退出',
					showCancel: true,
					success: (res) => {
						this._modalShown = false
						if (res.confirm) {
							// 先清理揭示状态的定时器，避免兜底定时器重复执行
							this.clearRevealState && this.clearRevealState()
							this.startCountdown && this.startCountdown()
						} else if (res.cancel) {
							uni.reLaunch({ url: '/pages/index/index' })
						}
					},
					fail: (err) => {
						console.error(`[Game] Modal failed:`, err)
						this._modalShown = false
						// 如果弹窗失败，先清理揭示状态的定时器，然后重新开始
						this.clearRevealState && this.clearRevealState()
						this.startCountdown && this.startCountdown()
					}
				})
			}
		}
	}
</script>

<style>
	.game-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		background-color: #ffffff;
	}

	.top-title { position: fixed; top: var(--title-top); left: 0; right: 0; text-align: center; font-size: 36rpx; color: #333333; z-index: 10; }
	.countdown-top { position: fixed; top: var(--countdown-top); left: 0; right: 0; text-align: center; font-size: 120rpx; font-weight: bold; }
	.level-indicator { position: fixed; top: var(--level-indicator-top); right: var(--level-indicator-right); background: rgba(0,0,0,0.7); color: white; padding: 8rpx 16rpx; border-radius: 20rpx; font-size: 24rpx; z-index: 10; }

	.people-cluster { position: fixed; top: var(--game-area-top); left: 0; right: 0; display: flex; flex-direction: column; align-items: center; z-index: 1; }
	.row { display: flex; flex-direction: row; align-items: center; justify-content: center; }
	.row-top { margin-bottom: -40rpx; }
	.person { width: var(--people-reveal-size); display: block; }
	.overlap { margin-left: -40rpx; }

.cover-image { 
    position: fixed; 
    top: var(--house-from-top);
    left: 50%; 
    transform: translateX(-50%); 
    width: var(--house-width); 
    z-index: 7; 
    transition: top var(--house-drop-duration) var(--house-drop-easing); 
}
.cover-image.show { 
    top: var(--house-to-top); 
}
.cover-image.lift { 
    top: var(--house-lift-top); 
    transition: top var(--house-lift-duration) var(--house-lift-easing); 
}

/* 透明遮罩层：与房子完全一致的尺寸和位置，用于碰撞检测 */
.house-mask { 
    position: fixed; 
    top: var(--house-from-top); 
    left: 50%; 
    transform: translateX(-50%); 
    width: var(--house-width); 
    height: var(--house-height);
    z-index: 5; /* 在小人层之上，房子层之下 */
    transition: top var(--house-drop-duration) var(--house-drop-easing); 
    background: transparent; /* 完全透明 */
    pointer-events: none; /* 不影响交互 */
}
.house-mask.show { 
    top: var(--house-to-top); 
}
.house-mask.lift { 
    top: var(--house-lift-top); 
    transition: top var(--house-lift-duration) var(--house-lift-easing); 
}

.slide-people { position: fixed; top: var(--people-area-top); left: 50%; margin-left: var(--slide-area-margin-left); z-index: 4; width: var(--slide-area-width); height: var(--slide-area-height); pointer-events: none; }
.sperson { 
    /* 基础定位由模板中的style设置 */
    width: var(--people-size); /* 使用CSS变量 */
    height: var(--people-size); /* 使用CSS变量 */
    opacity: 1; 
    /* 🔧 修复：设置初始位置，避免闪烁 */
    transform: translate3d(var(--people-slide-start), 0, 0);
    will-change: transform; 
    backface-visibility: hidden; 
}

/* 🔧 新增：通用小人图片样式 */
.person-image {
    width: 100%;
    height: 100%;
    display: block;
}
.sperson.run { animation: slide-pass var(--slide-duration) linear forwards; }

@keyframes slide-pass { 
    0% { 
        transform: translate3d(var(--people-slide-start), 0, 0); /* 使用CSS变量 */
    } 
    100% { 
        transform: translate3d(var(--people-slide-end), 0, 0); /* 使用CSS变量 */
    } 
}

.escape-people { 
    position: fixed; 
    top: var(--people-area-top); 
    left: 50%; 
    margin-left: var(--escape-area-margin-left); 
    width: var(--escape-area-width); 
    height: var(--escape-area-height); 
    z-index: 6; 
    pointer-events: none; 
    overflow: visible; 
}

.eperson { 
    /* 基础定位由模板中的style设置 */
    width: var(--people-size); /* 使用CSS变量 */
    height: var(--people-size); /* 使用CSS变量 */
    opacity: 1; 
    /* 减少不必要的硬件加速属性 */
    transform: translateZ(0);
    /* 确保图片不会被拉伸 */
    flex-shrink: 0;
}

.pre { 
    opacity: 1; 
    transform: translateZ(0);
}

	
	/* 使用更平滑的缓动函数，减少闪烁 */
	.escape-up { 
		animation: escapeUp var(--escape-duration, var(--slide-duration)) ease-out forwards; 
		/* 小程序优化：明确指定变换属性 */
		will-change: transform, opacity;
	}
	
	.escape-right { 
		animation: escapeRight var(--escape-duration, var(--slide-duration)) ease-out forwards; 
		/* 小程序优化：明确指定变换属性 */
		will-change: transform, opacity;
	}
	
	/* 优化关键帧：减少突变，使用更平滑的过渡 */
	@keyframes escapeUp { 
		0% { 
			transform: translate3d(0, 0, 0); 
			opacity: 1; 
		} 
		100% { 
			transform: translate3d(0, -100vh, 0); 
			opacity: 1; 
		} 
	}
	
	@keyframes escapeRight { 
		0% { 
			transform: translate3d(0, 0, 0); 
			opacity: 1; 
		} 
		100% { 
			transform: translate3d(100vw, 0, 0); 
			opacity: 1; 
		} 
	}

	/* 揭示层 */
	.reveal-layer { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 8; pointer-events: none; }
	.reveal-people { position: fixed; top: var(--people-area-top); left: 50%; margin-left: var(--reveal-area-margin-left); width: var(--reveal-area-width); height: var(--reveal-area-height); position: relative; }
	.reveal-person { 
		position: absolute; 
		width: var(--people-reveal-size); 
		height: var(--people-reveal-size); 
		/* 🔧 修复：移除CSS变量，改为在模板中通过style直接设置 */
		background-size: contain; 
		background-repeat: no-repeat; 
	}
	/* 🔧 修复：移除CSS变量依赖的red类，改为在模板中动态设置style */
	.reveal-person.red { 
		/* 保留基础样式，具体的背景和mask通过style设置 */
		-webkit-mask-repeat: no-repeat; 
		-webkit-mask-size: contain; 
		mask-repeat: no-repeat; 
		mask-size: contain; 
	}
	

	
	/* 🔧 修复：红色小人图片样式 - 保持小人形状，只改变颜色 */
	.person-image-red {
		width: 100%;
		height: 100%;
		display: block;
		/* 使用CSS滤镜将黑色小人变为红色 */
		filter: brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(3642%) hue-rotate(347deg) brightness(99%) contrast(94%);
		/* 添加激活动画效果 */
		animation: redActivate 0.5s ease-out;
	}
	
	@keyframes redActivate {
		0% {
			transform: scale(0.8);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	.reveal-number { position: fixed; top: var(--reveal-number-top); left: 0; right: 0; text-align: center; font-size: 64rpx; font-weight: 700; color: #000; }

	/* 🔧 新增：分享复活界面样式 */
	.revival-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.revival-card {
		background: white;
		border-radius: 24rpx;
		padding: 60rpx 40rpx;
		margin: 40rpx;
		max-width: 600rpx;
		width: 90%;
		text-align: center;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.2);
	}

	.revival-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.revival-content {
		font-size: 32rpx;
		color: #666;
		line-height: 1.6;
		margin-bottom: 40rpx;
	}

	.revival-share-btn {
		width: 100%;
		background: transparent;
		border: 2rpx solid #ddd;
		color: #666;
		border-radius: 40rpx;
		padding: 20rpx;
		font-size: 28rpx;
		margin-top: 20rpx;
		transition: all 0.3s ease;
	}

	.revival-share-btn:active {
		background: #f5f5f5;
		transform: scale(0.98);
	}

	.revival-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 20rpx;
	}

	.revival-restart-btn, .revival-quit-btn {
		flex: 1;
		background: transparent;
		border: 2rpx solid #ddd;
		color: #666;
		border-radius: 40rpx;
		padding: 20rpx;
		font-size: 28rpx;
		transition: all 0.3s ease;
	}

	.revival-restart-btn:active, .revival-quit-btn:active {
		background: #f5f5f5;
		transform: scale(0.98);
	}

	/* 底部画板卡片 */
	.pad-card { position: fixed; left: 0; right: 0; bottom: 0; background: #ffffff; box-shadow: 0 -6rpx 20rpx rgba(0,0,0,0.08); border-top-left-radius: 16rpx; border-top-right-radius: 16rpx; padding: 20rpx 24rpx 34rpx; z-index: 12; }
	.pad-header { font-size: 28rpx; color: #333; margin-bottom: 12rpx; text-align: center; }
	.canvas-container { position: relative; }
	.draw-canvas { width: 686rpx; height: 320rpx; background: #f7f7f7; border-radius: 12rpx; border: 2rpx dashed #ddd; }
	.canvas-clear-icon { position: absolute; left: 16rpx; bottom: 16rpx; width: 48rpx; height: 48rpx; opacity: 0.6; z-index: 13; }
	.canvas-clear-icon:active { opacity: 1; transform: scale(0.9); }
	.pad-result { margin-top: 12rpx; font-size: 28rpx; color: #e53935; font-weight: bold; text-align: center; }
	.confirmation-countdown { margin-top: 8rpx; font-size: 24rpx; color: #ff9800; text-align: center; animation: pulse 1s infinite; }
	@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

	/* 数字键盘样式 */
	.keyboard-container {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		z-index: 12;
		background-color: white;
		border-radius: 20rpx 20rpx 0 0;
		box-shadow: 0 -6rpx 20rpx rgba(0,0,0,0.08);
		overflow: hidden;
		margin: 0;
		padding: 0;
		/* 小程序强制贴底 */
		transform: translateY(0);
		-webkit-transform: translateY(0);
		/* 强制移除小程序默认底部间距 */
		margin-bottom: 0 !important;
		padding-bottom: 0 !important;
	}

	/* 输入框区域 */
	.input-display {
		padding: 15rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background-color: white;
	}

	.input-box {
		background-color: #f8f9fa;
		border: 1rpx solid #e5e5e5;
		border-radius: 10rpx;
		padding: 16rpx 24rpx;
		min-height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.input-text {
		font-size: 36rpx;
		font-weight: 500;
		color: #333;
		text-align: center;
	}

	/* 折叠按钮 */
	.fold-btn {
		display: flex;
		justify-content: center;
		padding: 15rpx 0 8rpx;
		cursor: pointer;
	}

	.fold-icon {
		width: 32rpx;
		height: 32rpx;
		transition: transform 0.3s ease;
	}

	.fold-icon.rotated {
		transform: rotate(180deg);
	}

	.keyboard-main {
		display: flex;
		gap: 0;
		padding: 0;
		margin: 0;
		position: relative;
		overflow: hidden;
	}

	.numbers-area {
		flex: 1;
		background-color: #f5f5f5;
	}

	.number-row {
		display: flex;
	}

	.number-btn {
		flex: 1;
		height: 90rpx;
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		font-weight: 500;
		color: #333;
		border: 1rpx solid #e5e5e5;
		margin: -1rpx -1rpx 0 0;
		user-select: none;
		transition: all 0.15s ease;
	}

	.number-btn:active {
		background-color: #f0f0f0;
		transform: scale(0.95);
	}

	.bottom-row {
		display: flex;
	}

	.zero-btn {
		flex: 2;
		height: 90rpx;
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		font-weight: 500;
		color: #333;
		border: 1rpx solid #e5e5e5;
		margin: -1rpx -1rpx 0 0;
		user-select: none;
		transition: all 0.15s ease;
	}

	.zero-btn:active {
		background-color: #f0f0f0;
		transform: scale(0.95);
	}

	.dot-btn {
		flex: 1;
		height: 90rpx;
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		font-weight: 500;
		color: #333;
		border: 1rpx solid #e5e5e5;
		margin: -1rpx 0 0 0;
		user-select: none;
		transition: all 0.15s ease;
	}

	.dot-btn:active {
		background-color: #f0f0f0;
		transform: scale(0.95);
	}

	.function-area {
		display: flex;
		flex-direction: column;
		width: 160rpx;
		background-color: #f5f5f5;
	}

	.delete-btn {
		height: 90rpx;
		background-color: white;
		border: 2rpx solid #ddd;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		margin: -1rpx 0 0 -1rpx;
		position: relative;
		overflow: hidden;
		transition: all 0.15s ease;
	}

	.delete-btn:active {
		background-color: #f0f0f0;
		transform: scale(0.95);
	}

	.keypad-clear-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
		margin: 0;
		padding: 0;
	}

	.confirm-btn {
		flex: 1;
		background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 180rpx;
		user-select: none;
		margin: -1rpx 0 0 -1rpx;
		transition: all 0.15s ease;
	}

	.confirm-btn:active {
		opacity: 0.8;
		transform: scale(0.95);
	}

	.confirm-text {
		color: white;
		font-size: 32rpx;
		font-weight: 600;
	}
</style>