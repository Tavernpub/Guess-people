/**
 * 猜小人游戏 - uni-app Promise适配器
 * Copyright (c) 2025 Tavern (QQ: 2196008384)
 * 
 * 本文件用于将uni-app的API转换为Promise形式，提供更好的异步编程体验
 * 
 * @author Tavern
 * @contact QQ: 2196008384
 * @license MIT
 * @version 1.0.0
 * @since 2025
 */

uni.addInterceptor({
  returnValue (res) {
    if (!(!!res && (typeof res === "object" || typeof res === "function") && typeof res.then === "function")) {
      return res;
    }
    return new Promise((resolve, reject) => {
      res.then((res) => {
        if (!res) return resolve(res) 
        return res[0] ? reject(res[0]) : resolve(res[1])
      });
    });
  },
});