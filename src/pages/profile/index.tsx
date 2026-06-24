import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Bell, LogOut, ChevronRight, Users, FileText } from 'lucide-react-taro'

import Taro, { useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

interface UserStats {
  createdCount: number
  assignedCount: number
  completedCount: number
}

// 从 Storage 恢复登录状态（避免重渲染丢状态）
const getStoredLoginState = () => {
  const loggedIn = Taro.getStorageSync('isLoggedIn')
  const userId = Taro.getStorageSync('userId')
  const openid = Taro.getStorageSync('openid')
  const name = Taro.getStorageSync('userName')
  const avatar = Taro.getStorageSync('userAvatar')
  return { loggedIn: !!loggedIn, userId: userId || '', openid: openid || '', name: name || '', avatar: avatar || '' }
}

const ProfilePage = () => {
  const stored = getStoredLoginState()
  const [isLoggedIn, setIsLoggedIn] = useState(stored.loggedIn)
  const [userInfo, setUserInfo] = useState({
    id: stored.userId,
    name: stored.name || '用户',
    avatar: stored.avatar || ''
  })
  const [userStats, setUserStats] = useState<UserStats>({
    createdCount: 0,
    assignedCount: 0,
    completedCount: 0
  })
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const currentUserId = useCurrentUser()

  // 获取用户信息和任务统计
  const fetchUserInfo = useCallback(async (uid?: string) => {
    const targetId = uid || currentUserId
    console.log('[fetchUserInfo] targetId=', targetId, 'currentUserId=', currentUserId)

    try {
      // 获取用户基本信息
      const userRes = await Network.request({
        url: `/api/users/${targetId}`,
        method: 'GET',
        timeout: 15000
      })

      console.log('[fetchUserInfo] 用户信息响应:', JSON.stringify(userRes?.data))

      if (userRes && userRes.data && userRes.data.data) {
        const fetchedUser = userRes.data.data
        setUserInfo({
          id: fetchedUser.id,
          name: fetchedUser.name,
          avatar: fetchedUser.avatar || ''
        })
        // 同步到 Storage
        Taro.setStorageSync('userName', fetchedUser.name)
        Taro.setStorageSync('userAvatar', fetchedUser.avatar || '')
      }

      // 获取任务统计
      const statsRes = await Network.request({
        url: '/api/tasks',
        method: 'GET',
        data: { userId: targetId, filter: 'all' },
        timeout: 15000
      })

      console.log('[fetchUserInfo] 任务统计响应:', JSON.stringify(statsRes?.data))

      if (statsRes && statsRes.data && statsRes.data.data) {
        const tasks = statsRes.data.data
        const createdCount = tasks.filter((t: any) => t.creator_id === targetId).length
        const assignedCount = tasks.filter((t: any) => t.assignee_id === targetId).length
        const completedCount = tasks.filter((t: any) => t.assignee_id === targetId && t.status === 'done').length

        setUserStats({ createdCount, assignedCount, completedCount })
      }
    } catch (error) {
      console.error('[fetchUserInfo] 失败:', error)
    }
  }, [currentUserId])

  // 登录状态变化时自动拉取数据
  useEffect(() => {
    console.log('[ProfilePage] isLoggedIn changed to:', isLoggedIn)
    if (isLoggedIn) {
      fetchUserInfo()
    }
  }, [isLoggedIn])

  // CRITICAL: 页面每次显示时检查登录状态并刷新数据
  useDidShow(() => {
    const stored = getStoredLoginState()
    console.log('[useDidShow] stored=', JSON.stringify(stored))
    if (stored.loggedIn) {
      // 确保组件状态与 Storage 同步
      if (!isLoggedIn) {
        console.log('[useDidShow] 从 Storage 恢复登录状态')
        setIsLoggedIn(true)
      }
      setUserInfo(prev => {
        if (prev.id !== stored.userId) {
          return { id: stored.userId, name: stored.name || prev.name, avatar: stored.avatar || '' }
        }
        return prev
      })
      fetchUserInfo(stored.userId)
    }
  })

  // 微信登录
  const handleLogin = async () => {
    try {
      // 第一步：先唤醒后端（Render 免费版有冷启动，需要等待）
      Taro.showLoading({ title: '连接服务器...' })
      try {
        await Network.request({
          url: '/api/health',
          method: 'GET',
          timeout: 30000
        })
      } catch {
        // 忽略预热失败，继续尝试登录
      }

      // 第二步：获取微信 code（code 需要在后端唤醒后再获取，避免超时后 code 已作废）
      Taro.showLoading({ title: '登录中...' })
      const loginResult = await Taro.login()
      const { code } = loginResult

      if (!code) {
        Taro.hideLoading()
        Taro.showToast({ title: '获取登录凭证失败', icon: 'none' })
        return
      }

      // 第三步：发送 code 到后端换取 openid 和用户信息
      const res = await Network.request({
        url: '/api/users/wx-login',
        method: 'POST',
        data: { code },
        timeout: 30000
      })

      Taro.hideLoading()

      if (res?.data?.code === 200 && res.data.data) {
        const user = res.data.data
        console.log('[handleLogin] 登录成功, user=', JSON.stringify(user))

        // 先写 Storage（持久化，组件重载也能恢复）
        Taro.setStorageSync('isLoggedIn', true)
        Taro.setStorageSync('userId', user.id)
        Taro.setStorageSync('openid', user.openid || '')
        Taro.setStorageSync('userName', user.name || '')
        Taro.setStorageSync('userAvatar', user.avatar || '')

        // 再更新组件状态
        setIsLoggedIn(true)
        setUserInfo({
          id: user.id,
          name: user.name || '微信用户',
          avatar: user.avatar || ''
        })

        Taro.showToast({ title: '登录成功', icon: 'success' })
        // fetchUserInfo 由 useEffect([isLoggedIn]) 自动触发，不用手动调
      } else {
        const errMsg = res?.data?.msg || '登录失败，请重试'
        Taro.showToast({ title: errMsg, icon: 'none', duration: 3000 })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('登录失败:', error)
      Taro.showToast({ title: '网络超时，请稍后重试', icon: 'none', duration: 3000 })
    }
  }

  // 审核测试登录（无需微信授权）
  const handleTestLogin = async () => {
    Taro.showLoading({ title: '测试登录中...' })

    try {
      const res = await Network.request({
        url: '/api/users/test-login',
        method: 'POST',
        timeout: 15000
      })

      Taro.hideLoading()

      if (res?.data?.code === 200 && res.data.data) {
        const user = res.data.data
        console.log('[handleTestLogin] 测试登录成功, user=', JSON.stringify(user))

        // 先写 Storage
        Taro.setStorageSync('isLoggedIn', true)
        Taro.setStorageSync('userId', user.id)
        Taro.setStorageSync('openid', user.openid || '')
        Taro.setStorageSync('userName', user.name || '')
        Taro.setStorageSync('userAvatar', user.avatar || '')

        // 再更新组件状态
        setIsLoggedIn(true)
        setUserInfo({
          id: user.id,
          name: user.name || '测试用户',
          avatar: user.avatar || ''
        })

        Taro.showToast({ title: '测试登录成功', icon: 'success' })
        // fetchUserInfo 由 useEffect([isLoggedIn]) 自动触发
      } else {
        Taro.showToast({ title: res?.data?.msg || '测试登录失败', icon: 'none' })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('测试登录失败:', error)
      Taro.showToast({ title: '测试登录失败', icon: 'none' })
    }
  }

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          setIsLoggedIn(false)
          Taro.removeStorageSync('isLoggedIn')
          Taro.removeStorageSync('userId')
          Taro.removeStorageSync('userName')
          Taro.removeStorageSync('userAvatar')
          setUserInfo({ id: '', name: '用户', avatar: '' })
          setUserStats({ createdCount: 0, assignedCount: 0, completedCount: 0 })
          Taro.showToast({ title: '已退出登录', icon: 'none' })
        }
      }
    })
  }

  // 切换通知设置
  const handleNotificationChange = (checked: boolean) => {
    setNotificationEnabled(checked)
    Taro.showToast({ title: checked ? '通知已开启' : '通知已关闭', icon: 'none' })
    
    // 实际切换通知设置逻辑
    Taro.setStorageSync('notificationEnabled', checked)
  }

  return (
    <View className="flex flex-col h-full bg-background px-4 py-4">
      {/* 用户信息卡片 */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <View className="flex flex-row items-center gap-3">
            <Avatar className="w-12 h-12">
              {userInfo.avatar ? (
                <AvatarImage src={userInfo.avatar} />
              ) : (
                <AvatarFallback>
                  <Text className="block text-lg">{userInfo.name[0]}</Text>
                </AvatarFallback>
              )}
            </Avatar>
            <View className="flex-1">
              <Text className="block text-base font-medium text-foreground">{isLoggedIn ? userInfo.name : '未登录'}</Text>
              <Text className="block text-sm text-muted-foreground">
                {isLoggedIn ? '点击查看个人资料' : '请选择登录方式'}
              </Text>
            </View>
            {!isLoggedIn ? (
              <View className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleLogin}
                >
                  <Text className="block text-xs">微信登录</Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestLogin}
                >
                  <Text className="block text-xs">审核测试登录</Text>
                </Button>
              </View>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
              >
                <Text className="block">退出</Text>
              </Button>
            )}
          </View>
        </CardContent>
      </Card>

      {/* 统计数据卡片 */}
      {isLoggedIn && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              <Text className="block">我的统计</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row justify-around">
              {/* 我创建的 */}
              <View
                className="flex flex-col items-center"
                onClick={() => Taro.switchTab({ url: '/pages/index/index' }).then(() => {
                  Taro.setStorageSync('pendingFilter', 'created')
                })}
              >
                <Text className="block text-2xl font-bold text-primary">{userStats.createdCount}</Text>
                <Text className="block text-sm text-muted-foreground">我创建的</Text>
                <Text className="block text-xs text-blue-400 mt-1">查看详情 ›</Text>
              </View>
              {/* 我负责的 */}
              <View
                className="flex flex-col items-center"
                onClick={() => Taro.switchTab({ url: '/pages/index/index' }).then(() => {
                  Taro.setStorageSync('pendingFilter', 'assigned')
                })}
              >
                <Text className="block text-2xl font-bold text-primary">{userStats.assignedCount}</Text>
                <Text className="block text-sm text-muted-foreground">我负责的</Text>
                <Text className="block text-xs text-blue-400 mt-1">查看详情 ›</Text>
              </View>
              {/* 已完成 */}
              <View
                className="flex flex-col items-center"
                onClick={() => Taro.switchTab({ url: '/pages/index/index' }).then(() => {
                  Taro.setStorageSync('pendingFilter', 'completed')
                })}
              >
                <Text className="block text-2xl font-bold text-primary">{userStats.completedCount}</Text>
                <Text className="block text-sm text-muted-foreground">已完成</Text>
                <Text className="block text-xs text-blue-400 mt-1">查看详情 ›</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 设置区域 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <Text className="block">设置</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 小队管理 */}
          {isLoggedIn && (
            <View 
              className="flex flex-row items-center justify-between" 
              onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}
            >
              <View className="flex flex-row items-center gap-2">
                <Users className="w-4 h-4" size={16} color="#1890ff" />
                <Text className="block text-base">小队管理</Text>
              </View>
              <ChevronRight className="w-4 h-4" size={16} color="#8c8c8c" />
            </View>
          )}
          
          <Separator />
          
          {/* 通知设置 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Bell className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-base">消息通知</Text>
            </View>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={handleNotificationChange}
            />
          </View>
          
          {isLoggedIn && <Separator />}
          
          {/* 隐私政策 */}
          <View className="flex flex-row items-center justify-between" onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}>
              <View className="flex flex-row items-center gap-2">
                <FileText className="w-4 h-4" size={16} color="#8c8c8c" />
                <Text className="block text-base">隐私政策</Text>
              </View>
              <ChevronRight className="w-4 h-4" size={16} color="#8c8c8c" />
          </View>

          {isLoggedIn && <Separator />}
          
          {/* 退出登录 */}
          {isLoggedIn && (
            <View className="flex flex-row items-center justify-between" onClick={handleLogout}>
              <View className="flex flex-row items-center gap-2">
                <LogOut className="w-4 h-4" size={16} color="#f5222d" />
                <Text className="block text-base text-destructive">退出登录</Text>
              </View>
              <ChevronRight className="w-4 h-4" size={16} color="#8c8c8c" />
            </View>
          )}
        </CardContent>
      </Card>

      {/* 版本信息 */}
      <View className="flex flex-col items-center mt-8">
        <Text className="block text-sm text-muted-foreground">工作助手小新 v1.0.0</Text>
        <Text className="block text-xs text-muted-foreground mt-2">基于 Taro + Supabase 开发</Text>
      </View>
    </View>
  )
}

export default ProfilePage