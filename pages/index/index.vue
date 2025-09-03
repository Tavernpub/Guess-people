<!--
/**
 * 猜小人游戏 - 游戏开始页面
 * Copyright (c) 2025 Tavern (QQ: 2196008384)
 * 
 * 本文件是游戏的启动页面，提供游戏入口和基本导航
 * 
 * @author Tavern
 * @contact QQ: 2196008384
 * @license MIT
 * @version 1.0.0
 * @since 2025
 */
-->

<template>
	<view class="start-container">
		<image class="home-image" src="@/static/home.png" mode="widthFix"></image>
		<button class="start-button" @click="startGame">开始游戏</button>
	</view>
</template>

<script>
	export default {
		methods: {
			startGame() {
				// 预留跳转逻辑：例如跳转到游戏主页面
				uni.navigateTo({ url: '/pages/index/game' })

			}
		}
	}
</script>

<style>
	.start-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40rpx 30rpx;
		box-sizing: border-box;
		background-color: #ffffff;
	}

	.home-image {
		width: 420rpx;
		margin-bottom: 60rpx;
	}

	.start-button {
		width: 60%;
		background-color: #007aff;
		color: #ffffff;
		border: none;
	}
</style>
