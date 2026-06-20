import { useState } from 'react'
import { useDidShow } from '@tarojs/taro'

/**
 * 获取当前登录用户 ID 的 Hook
 * 优先从 Storage 读取（登录时写入），失败则 fallback 到 'user-001'
 * 每次页面显示时重新读取，应对跨页面登录状态变化及 Taro tab 页面缓存
 */
export function useCurrentUser(): string {
  const [userId, setUserId] = useState<string>(() => {
    // 初始化时同步读取一次
    const stored = getStoredUserId()
    return stored || 'user-001'
  })

  // 每次页面显示时重新读取 Storage（应对 Taro tab 页面缓存）
  useDidShow(() => {
    const stored = getStoredUserId()
    if (stored && stored !== userId) {
      setUserId(stored)
    }
  })

  return userId
}

/** 从小程序 Storage 读取 userId（兼容 H5 环境） */
function getStoredUserId(): string {
  try {
    // Taro 小程序环境：Taro.getStorageSync
    const val = (globalThis as any).Taro?.getStorageSync?.('userId')
    if (val) return val
  } catch {}
  try {
    // H5 环境：localStorage
    const val = localStorage.getItem('userId')
    if (val) return val
  } catch {}
  return ''
}
