import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Moon, Bell, LogOut, ChevronRight, Users } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

interface UserStats {
  createdCount: number
  assignedCount: number
  completedCount: number
}

const ProfilePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState({
    id: '',
    name: '用户',
    avatar: ''
  })
  const [userStats, setUserStats] = useState<UserStats>({
    createdCount: 0,
    assignedCount: 0,
    completedCount: 0
  })
  const [darkMode, setDarkMode] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const currentUserId = useCurrentUser()

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!isLoggedIn) return
    
    try {
      // 获取用户基本信息
      const userRes = await Network.request({
        url: `/api/users/${currentUserId}`, // 当前登录用户ID
        method: 'GET'
      })
      
      console.log('获取用户信息响应:', userRes)
      
      if (userRes && userRes.data && userRes.data.data) {
        setUserInfo({
          id: userRes.data.data.id,
          name: userRes.data.data.name,
          avatar: userRes.data.data.avatar || ''
        })
      }
      
      // 获取任务统计
      const statsRes = await Network.request({
        url: '/api/tasks',
        method: 'GET'
      })
      
      console.log('获取任务列表响应:', statsRes)
      
      if (statsRes && statsRes.data && statsRes.data.data) {
        const tasks = statsRes.data.data
        
        // 计算统计数据
        const createdCount = tasks.filter(t => t.creator_id === currentUserId).length
        const assignedCount = tasks.filter(t => t.assignee_id === currentUserId).length
        const completedCount = tasks.filter(t => t.assignee_id === currentUserId && t.status === 'done').length
        
        setUserStats({
          createdCount,
          assignedCount,
          completedCount
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      Taro.showToast({ title: '获取用户信息失败', icon: 'none' })
    }
  }

  useEffect(() => {
    // 检查登录状态
    const loggedIn = Taro.getStorageSync('isLoggedIn')
    if (loggedIn) {
      setIsLoggedIn(true)
      fetchUserInfo()
    }
  }, [])

  // 模拟登录（实际项目中应调用微信登录API）
  const handleLogin = async () => {
    Taro.showLoading({ title: '登录中...' })
    
    try {
      // 模拟登录过程（实际应调用微信.login()获取openid，然后后端验证）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsLoggedIn(true)
      Taro.setStorageSync('isLoggedIn', true)
      Taro.setStorageSync('userId', 'user-001')
      
      setUserInfo({
        id: 'user-001',
        name: '张三',
        avatar: ''
      })
      
      Taro.hideLoading()
      Taro.showToast({ title: '登录成功', icon: 'success' })
      
      // 获取用户信息和统计数据
      fetchUserInfo()
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '登录失败', icon: 'none' })
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
          setUserInfo({ id: '', name: '用户', avatar: '' })
          setUserStats({ createdCount: 0, assignedCount: 0, completedCount: 0 })
          Taro.showToast({ title: '已退出登录', icon: 'none' })
        }
      }
    })
  }

  // 切换深色模式
  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    Taro.showToast({ title: checked ? '深色模式已开启' : '深色模式已关闭', icon: 'none' })
    
    // 实际切换深色模式逻辑
    if (checked) {
      Taro.setStorageSync('theme', 'dark')
    } else {
      Taro.setStorageSync('theme', 'light')
    }
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
                {isLoggedIn ? '点击查看个人资料' : '点击登录使用完整功能'}
              </Text>
            </View>
            <Button
              size="sm"
              variant="outline"
              onClick={isLoggedIn ? handleLogout : handleLogin}
            >
              <Text className="block">{isLoggedIn ? '退出' : '登录'}</Text>
            </Button>
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
              <View className="flex flex-col items-center">
                <Text className="block text-2xl font-bold text-primary">{userStats.createdCount}</Text>
                <Text className="block text-sm text-muted-foreground">我创建的</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="block text-2xl font-bold text-primary">{userStats.assignedCount}</Text>
                <Text className="block text-sm text-muted-foreground">我负责的</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="block text-2xl font-bold text-primary">{userStats.completedCount}</Text>
                <Text className="block text-sm text-muted-foreground">已完成</Text>
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
          {/* 深色模式 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Moon className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-base">深色模式</Text>
            </View>
            <Switch
              checked={darkMode}
              onCheckedChange={handleDarkModeChange}
            />
          </View>
          
          <Separator />
          
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