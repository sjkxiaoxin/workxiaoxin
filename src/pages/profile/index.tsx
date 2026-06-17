import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Settings, Moon, Bell, LogOut, User, ChevronRight } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

const ProfilePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '用户',
    avatar: ''
  })
  const [darkMode, setDarkMode] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(true)

  // 模拟登录
  const handleLogin = async () => {
    Taro.showLoading({ title: '登录中...' })
    
    // 模拟登录过程
    setTimeout(() => {
      Taro.hideLoading()
      setIsLoggedIn(true)
      setUserInfo({
        name: '张三',
        avatar: ''
      })
      Taro.showToast({ title: '登录成功', icon: 'success' })
    }, 1000)
  }

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          setIsLoggedIn(false)
          setUserInfo({ name: '用户', avatar: '' })
          Taro.showToast({ title: '已退出登录', icon: 'none' })
        }
      }
    })
  }

  // 切换深色模式
  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    Taro.showToast({ title: checked ? '深色模式已开启' : '深色模式已关闭', icon: 'none' })
    // TODO: 实际切换深色模式逻辑
  }

  // 切换通知设置
  const handleNotificationChange = (checked: boolean) => {
    setNotificationEnabled(checked)
    Taro.showToast({ title: checked ? '通知已开启' : '通知已关闭', icon: 'none' })
    // TODO: 实际切换通知设置逻辑
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
                  <Text className="text-lg">{userInfo.name[0]}</Text>
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

      {/* 设置区域 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <View className="flex flex-row items-center gap-2">
              <Settings className="w-5 h-5" size={20} color="#1890ff" />
              <Text className="block">设置</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 深色模式 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Moon className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-foreground">深色模式</Text>
            </View>
            <Switch
              checked={darkMode}
              onCheckedChange={handleDarkModeChange}
            />
          </View>

          <Separator />

          {/* 通知设置 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Bell className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-foreground">消息通知</Text>
            </View>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={handleNotificationChange}
            />
          </View>

          <Separator />

          {/* 个人资料 */}
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => Taro.showToast({ title: '个人资料功能开发中', icon: 'none' })}
          >
            <View className="flex flex-row items-center gap-2">
              <User className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-foreground">个人资料</Text>
            </View>
            <ChevronRight className="w-4 h-4" size={16} color="#8c8c8c" />
          </Button>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <Text className="block">任务统计</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="grid grid-cols-3 gap-3">
            <View className="flex flex-col items-center">
              <Text className="block text-xl font-bold text-foreground">5</Text>
              <Text className="block text-xs text-muted-foreground">我创建的</Text>
            </View>
            <View className="flex flex-col items-center">
              <Text className="block text-xl font-bold text-foreground">3</Text>
              <Text className="block text-xs text-muted-foreground">我负责的</Text>
            </View>
            <View className="flex flex-col items-center">
              <Text className="block text-xl font-bold text-foreground">2</Text>
              <Text className="block text-xs text-muted-foreground">已完成</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 退出登录按钮 */}
      {isLoggedIn && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" size={16} color="#f5222d" />
          <Text className="block text-destructive">退出登录</Text>
        </Button>
      )}

      {/* 版本信息 */}
      <View className="mt-auto pt-4">
        <Text className="block text-center text-xs text-muted-foreground">
          飞任务 v1.0.0
        </Text>
      </View>
    </View>
  )
}

export default ProfilePage