/**
 * 猜小人游戏 - 应用入口文件
 * Copyright (c) 2025 Tavern (QQ: 2196008384)
 * 
 * 本文件是uni-app应用的主入口文件，负责应用的初始化和启动
 * 
 * @author Tavern
 * @contact QQ: 2196008384
 * @license MIT
 * @version 1.0.0
 * @since 2025
 */

import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif