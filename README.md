# 猜小人游戏

基于uni-app开发的记忆力挑战小游戏，主要运行在微信小程序上。玩家需要观察小人进入和逃离房屋的过程，然后计算出最终房屋内的人数。

## 游戏玩法

### 基本流程

游戏开始时，房屋里有5个小人。然后会有以下几个阶段：

1. **记忆阶段**（3秒）：记住房屋里有5个小人
2. **房屋遮盖**：房屋降下来把小人遮住
3. **小人进入**：会有好几波小人从左边滑进房屋，你要数清楚有多少个
4. **小人逃离**：有些小人会从房屋逃跑，要么向上飞走，要么向右跑掉
5. **答题**：计算房屋里最终剩下多少人
6. **揭晓答案**：房屋上升，显示正确答案

### 计算方法

最终人数 = 5（初始） + 进入的人数 - 逃跑的人数

举个例子：
- 开始有5个人
- 进来了9个人（分3波：3个、2个、4个）
- 跑掉了5个人（向上2个、向右3个）
- 最终剩下：5 + 9 - 5 = 9个人

### 答题方式

游戏提供两种输入方式：

**手写模式**：在画板上写数字，程序会自动识别。识别后有2秒时间确认，不对可以擦掉重写。

**键盘模式**：直接用数字键盘输入答案，比较稳定可靠。

### 难度变化

随着关卡提升：
- 小人进入的波数会增加
- 动画速度会变快
- 逃跑的人数会增多

基本上就是越来越难数清楚。

## 主要功能

- 支持多关卡，难度递增
- 手写识别和数字键盘两种输入方式
- 失败后可以分享复活
- 动画流畅，适配不同屏幕
- 可以通过配置文件调整各种参数

## 运行项目

### 需要的环境

- Node.js 12+
- HBuilderX 或者 VSCode + uni-app插件  
- 微信开发者工具

### 运行步骤

1. 下载代码
   ```bash
   git clone https://github.com/Tavernpub/Guess-people.git
   ```

2. 用HBuilderX打开项目文件夹

3. 点击"运行" → "运行到小程序模拟器" → "微信开发者工具"

4. 在微信开发者工具里预览，也可以扫码在手机上试玩

## 配置文件说明

所有游戏参数都在 `config.js` 里，可以通过修改这些参数来调整游戏的各种行为。

### 哪些配置有用

| 配置 | 是否生效 | 用途 |
|------|---------|------|
| 基础游戏配置 | ✅ | 控制游戏核心参数 |
| 关卡难度配置 | ✅ | 难度调整 |
| 动画速度配置 | ✅ | 控制动画速度变化 |
| 输入系统配置 | ✅ | 画板和键盘设置 |
| 分享复活配置 | ✅ | 失败复活机制 |
| 房屋和小人配置 | ✅ | 视觉效果 |
| 音效配置 | ❌ | 还没做 |
| UI主题配置 | ❌ | 还没做 |

## 新旧对照

⚠️ **重要提醒**：`SLIDE_DURATION_MS = 6000` 在前面的版本中时通过这个修改第一关小人向右进房的基础速度，现在已经把算法移到PEOPLE_CONFIG.animations.slideIn.speed了

### 1️⃣ 小人进入房屋机制（游戏核心）

#### 基础配置（config.js 437-460行）
```javascript
PEOPLE_CONFIG.animations.slideIn.speed: {
  base: 6000,                    // 🔴 第1关基础时长（毫秒）
  minDuration: 1500,             // 🔴 最快速度限制  
  maxDuration: 9000,             // 🔴 最慢速度限制

  // 关卡难度增长机制（核心难度系统）
  levelProgression: {
    mode: 'fixed',              // 🔴 增长模式
    fixedDecrease: 400,         // 🔴 每关减少400ms（6000→5600→5200→4800...）
    percentageDecrease: 8,      // 百分比模式：每关减少8%
    customDurations: [6000, 5600, 5200, 4800, 4400, 4000, 3600, 3200, 2800, 2400],
    curve: 'linear',            // 🔴 变化曲线：linear/exponential/logarithmic
    curveIntensity: 1.3         // 曲线强度
  }
}
```

**增长模式详解**：
- `fixed`：每关固定减少时长，难度稳定递增
- `percentage`：每关按百分比减少，后期速度变化更剧烈  
- `custom`：精确控制每关时长，可设计特殊难度曲线

**实际效果**：
- 第1关：6000ms（基础速度）
- 第2关：5600ms（快了400ms）
- 第3关：5200ms（快了800ms）
- 第5关：4400ms（比第1关快了1600ms）

#### 进入排列机制（config.js 103-144行）
```javascript
ENTRY_CONFIG: {
  firstWave: {
    count: 3,           // 🔴 第一波固定
	                    //不管在什么时候都不要把成组移动的小人的数量改为4以上 现在游戏逻辑可能有问题 小人数量过多显示会超出房子外
    grouped: true,      // 🔴 成组移动
    delay: 100         // 房屋遮盖后100ms开始
  },
  subsequentWaves: {
    countRange: [2, 3, 4],        // 🔴 后续波次人数范围
    groupedThreshold: 3,          // ≥3人时强制成组
    groupedProbability: 0.5,      // <3人时50%概率成组
    groupOffsets: {
      2: [-60, 60],              // 2人：左右分开60rpx
      3: [-100, 0, 100],         // 3人：左中右，间距100rpx
      4: [-150, -50, 50, 150]    // 4人：均匀分布
    }
  }
}
```

### 2️⃣ 小人逃离房屋机制（核心难度）

#### 逃离速度配置（config.js 478-522行）
```javascript
PEOPLE_CONFIG.animations.escape.speed: {
  base: 15000,                   // 🔴 逃离基础时长（比进入慢2.5倍）
  minDuration: 600,              
  maxDuration: 8000,             

  // 关卡难度增长（与进入速度独立）
  levelProgression: {
    mode: 'fixed',              
    fixedDecrease: 300,         // 🔴 每关减少300ms
    percentageDecrease: 5,      // 百分比模式：每关减少5%
    customDurations: [3000, 2850, 2700, 2550, 2400, 2250, 2100, 1950, 1800, 1650],
    curve: 'linear',            
    curveIntensity: 1.2         
  },

  // 🔴 方向差异机制（核心观察难度）
  directionDifference: {
    enabled: true,              // 启用方向差异
    upMultiplier: 3.0,          // 🔴 向上逃离：3倍慢（更容易观察）
    rightMultiplier: 1.0        // 🔴 向右逃离：标准速度（更难观察）
  }
}
```

**方向差异的设计意图**：
- **向上逃离**：速度慢，给玩家观察和计数的机会
- **向右逃离**：速度快，考验玩家反应和专注度
- 每关至少保证1人向上、1人向右，确保难度平衡

#### 逃离方向分配（config.js 149-182行）
```javascript
ESCAPE_CONFIG: {
  directionProbability: {
    mode: 'balanced',        // 🔴 平衡分配向上向右数量
    upProbability: 0.5,     // 自定义模式下向上概率
    minUpCount: 1,          // 🔴 至少1人向上
    minRightCount: 1        // 🔴 至少1人向右
  },
  interval: {
    minMs: 200,             // 🔴 逃离间隔最小200ms
    durationRatio: 0.4,     // 相对于动画时长的40%
    cleanupDelay: 100       // 动画完成后清理延迟
  }
}
```

### 3️⃣ 关卡难度增长系统（config.js 187-228行）

#### 波次数量增长
```javascript
LEVEL_CONFIG.waves: {
  baseWaves: 3,              // 🔴 第1关基础波数
  growthType: 'linear',      // 🔴 线性增长模式
  linearGrowth: 1,          // 🔴 每关增加1波
  maxWaves: 10,             // 波数上限
  customWaves: [3, 4, 5, 6, 7, 8, 9, 10]  // 自定义模式配置
}
```

#### 逃离人数增长
```javascript
LEVEL_CONFIG.escapes: {
  baseEscapes: 5,           // 🔴 第1关基础逃离5人
  growthType: 'random',     // 🔴 随机增长模式
  randomRange: [2, 5],      // 🔴 每关随机增加2-5人
  linearGrowth: 3,          // 线性模式：每关固定增加3人
  maxEscapes: 20,           // 逃离人数上限
  customEscapes: [5, 8, 12, 16, 20]  // 自定义模式配置
}
```

**难度增长实例**：
- 第1关：3波进入，5人逃离
- 第2关：4波进入，7-10人逃离（5+随机2-5）
- 第3关：5波进入，9-15人逃离
- 第5关：7波进入，13-25人逃离

### 4️⃣ 基础游戏设置

| 参数 | 说明 | 默认值 | 重要程度 |
|------|------|--------|----------|
| `BASE_PEOPLE_IN_HOUSE` | 初始人数（计算基础） | 5人 | 
| `PREPARE_SECONDS` | 记忆时间 | 3秒 | 


### 5️⃣ 游戏流程控制机制

#### 游戏算法核心（game.vue实现）
```
最终答案 = 初始人数 + 进入人数 - 逃离人数
```

**游戏流程**：
1. **准备阶段**：显示初始5人，倒计时3秒让玩家记忆
2. **房屋遮盖**：房屋下降遮住小人，开始计时
3. **进入阶段**：多波小人从左侧进入，使用动态速度计算
4. **逃离阶段**：与进入同步进行，小人向上/向右逃离
5. **答题阶段**：玩家输入计算结果
6. **揭示阶段**：显示正确答案，逐个小人变红计数

#### 动态速度计算算法（game.vue 1378-1452行）
```javascript
getEntryDuration() {
  const speedConfig = PEOPLE_CONFIG.animations.slideIn.speed
  let duration = speedConfig.base  // 从基础时长开始
  
  // 根据关卡和模式动态计算
  switch (progression.mode) {
    case 'fixed':       // 每关固定减少
    case 'percentage':  // 每关百分比减少  
    case 'custom':      // 自定义每关时长
  }
  
  // 应用变化曲线（linear/exponential/logarithmic）
  // 限制在合理范围内（minDuration ~ maxDuration）
  
  return finalDuration
}
```

#### 关卡难度计算（game.vue 645-693行）
```javascript
getCurrentLevelWaves() {    // 计算当前关卡波数
getCurrentLevelEscapes() {  // 计算当前关卡逃离数
```

### 6️⃣ 分享复活系统（已实现）

#### 复活机制（config.js 627-733行）
```javascript
REVIVAL_CONFIG: {
  enabled: true,          // 🔴 总开关
  limits: {
    maxFailures: 100,     // 🔴 最大失败次数限制
    maxRevivals: 0,       // 🔴 每日复活次数（0=无限）
    resetOnNewDay: true   // 每天重置计数
  },
  share: {
    title: "别笑，你上你也过不了第二关",  // 🔴 分享标题
    dynamicContent: {
      enabled: true,      // 🔴 启用动态分享内容
      levelSpecific: {    // 特定关卡分享文案
        1: { title: '连第1关都过不了？😅', desc: '...' }
      }
    }
  }
}
```

**复活流程**：
1. 失败后显示分享复活界面
2. 使用微信原生分享API（`onShareAppMessage`）
3. 分享成功后获得复活机会继续当前关卡
4. 记录复活次数，支持每日重置

### 7️⃣ 其他重要机制



#### AI手写识别（game.vue 1833-2842行）  
- 支持0-9数字识别
- 使用Otsu自适应阈值、形态学处理、连通域分析
- 特征提取：洞数量、宽高比、密度分布、交叉点等
- 智能分割和合并算法处理连笔字
- //这里的算法是我通过自己写的字计算的偏移数据得来的 因为每个人写字不一样 识别可能有问题 所有数字键盘常用一点

#### 答案揭示动画（game.vue 1976-2088行）
- 房屋上升露出剩余小人  
- 小人逐个变红高亮并计数


### 🔧 快速调整示例

**让游戏简单一点：**
```javascript
// 1. 减慢基础速度（最重要）
PEOPLE_CONFIG.animations.slideIn.speed.base = 8000

// 2. 减缓难度增长
LEVEL_CONFIG.waves.linearGrowth = 0       // 波数不增长
LEVEL_CONFIG.escapes.baseEscapes = 3      // 逃离人数减少
PEOPLE_CONFIG.animations.slideIn.speed.levelProgression.fixedDecrease = 200

// 3. 增加记忆时间
export const PREPARE_SECONDS = 5
```

**让游戏更有挑战：**
```javascript
// 1. 加快基础速度（最重要）
PEOPLE_CONFIG.animations.slideIn.speed.base = 4000
PEOPLE_CONFIG.animations.slideIn.speed.levelProgression.fixedDecrease = 600

// 2. 增加复杂度
LEVEL_CONFIG.escapes.randomRange = [3, 7]  // 逃离变化更大
export const BASE_PEOPLE_IN_HOUSE = 7     // 初始人数更多
PEOPLE_CONFIG.animations.escape.speed.directionDifference.upMultiplier = 1.5  // 向上逃离也快一些
```

---

## 总结

这个项目的核心运转逻辑（按重要性排序）：

1. **小人进入速度机制**：通过 `PEOPLE_CONFIG.animations.slideIn.speed` 的动态计算控制游戏节奏
2. **小人逃离速度机制**：通过方向差异（向上3倍慢、向右标准速度）控制观察难度  
3. **关卡难度增长系统**：通过 `LEVEL_CONFIG` 控制波数和逃离人数的递增规律
4. **游戏流程算法**：`最终答案 = 初始人数 + 进入人数 - 逃离人数` 的核心计算


要调整游戏难度，重点关注前三个机制即可。其他配置主要影响界面体验和用户交互，对游戏核心逻辑影响相对较小。

## 📁 项目结构

```
猜小人/
├── pages/
│   └── index/
│       ├── index.vue          # 游戏开始页面
│       └── game.vue           # 🔴 游戏核心逻辑文件
├── static/                    # 静态资源文件
│   ├── people.png            # 小人图片
│   ├── home.png              # 房屋图片
│   ├── share.png             # 分享图片
│   └── ...                   # 其他UI图标
├── config.js                 # 🔴 游戏配置文件
├── main.js                   # uni-app入口文件
├── App.vue                   # 应用根组件
├── pages.json                # 页面路由配置
├── manifest.json             # 应用配置
└── uni.scss                  # 全局样式
```

## 🔍 核心文件说明

### `game.vue` - 游戏核心逻辑
这是游戏的主要文件，包含：
- 游戏状态管理
- 动画控制逻辑
- 小人进入/逃离算法
- 手写识别AI算法
- 分享复活功能

### `config.js` - 游戏配置中心
统一管理所有游戏参数：
- 基础游戏设置
- 关卡难度配置
- 动画时间配置
- UI交互配置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！


### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用 Tab 缩进
- 超级详细的注释
- 变量名使用驼峰命名法
- 重要配置项要在注释中标明影响

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📧 联系方式

- **开发者**：Tavern
- **QQ**：2196008384  
- **邮箱**：tavernpub@yeah.net
- **GitHub**：https://github.com/Tavernpub/Guess-people



---

⭐ 如果这个项目对你有帮助，请给一个 Star 支持一下！
