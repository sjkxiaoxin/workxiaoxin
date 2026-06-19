import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Trash2, Crown, UserPlus } from 'lucide-react-taro'

interface TeamMember {
  id: string
  user_id: string
  role: 'owner' | 'member'
  name: string
  avatar: string | null
  joined_at: string
}

interface Team {
  id: string
  name: string
  creator_id: string
  created_at: string
  my_role: 'owner' | 'member'
  joined_at: string
  members?: TeamMember[]
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId] = useState('user_001') // 测试用户ID
  
  useEffect(() => {
    loadTeams()
  }, [])
  
  const loadTeams = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/teams/user/${currentUserId}`
      })
      console.log('[TeamPage] 获取小队列表:', res.data)
      if (res.data?.code === 200) {
        setTeams(res.data.data || [])
      }
    } catch (error) {
      console.error('[TeamPage] 加载失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const showCreateDialog = async () => {
    try {
      // 使用prompt方式获取小队名称（小程序不支持，需要用其他方式）
      // 这里简化为使用固定名称测试
      const teamName = `小队${Date.now().toString().slice(-4)}`
      
      const res = await Network.request({
        url: '/api/teams',
        method: 'POST',
        data: {
          name: teamName,
          creatorId: currentUserId
        }
      })
      
      console.log('[TeamPage] 创建小队:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        loadTeams()
      } else {
        Taro.showToast({ title: res.data?.msg || '创建失败', icon: 'error' })
      }
    } catch (error) {
      console.error('[TeamPage] 创建失败:', error)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    }
  }
  
  const inviteMember = async (teamId: string) => {
    // 简化实现：直接邀请测试用户
    try {
      const testUserId = 'user_002'
      
      const res = await Network.request({
        url: `/api/teams/${teamId}/members`,
        method: 'POST',
        data: { userId: testUserId }
      })
      
      console.log('[TeamPage] 邀请成员:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '邀请成功', icon: 'success' })
        loadTeams()
      } else {
        Taro.showToast({ title: res.data?.msg || '邀请失败', icon: 'error' })
      }
    } catch (error) {
      console.error('[TeamPage] 邀请失败:', error)
      Taro.showToast({ title: '邀请失败', icon: 'error' })
    }
  }
  
  const deleteTeam = async (teamId: string) => {
    try {
      const { confirm } = await Taro.showModal({
        title: '确认删除',
        content: '删除后小队成员将无法继续协作，确定删除？'
      })
      
      if (!confirm) return
      
      const res = await Network.request({
        url: `/api/teams/${teamId}`,
        method: 'DELETE',
        data: { userId: currentUserId }
      })
      
      console.log('[TeamPage] 删除小队:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadTeams()
      } else {
        Taro.showToast({ title: res.data?.msg || '删除失败', icon: 'error' })
      }
    } catch (error) {
      console.error('[TeamPage] 删除失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'error' })
    }
  }
  
  const viewMembers = async (teamId: string) => {
    try {
      const res = await Network.request({
        url: `/api/teams/${teamId}/members`
      })
      
      console.log('[TeamPage] 查看成员:', res.data)
      
      if (res.data?.code === 200) {
        const members = res.data.data || []
        const memberNames = members.map((m: TeamMember) => 
          `${m.name}${m.role === 'owner' ? '(队长)' : ''}`
        ).join('\n')
        
        await Taro.showModal({
          title: '小队成员',
          content: memberNames || '暂无成员',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('[TeamPage] 查看成员失败:', error)
    }
  }
  
  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="flex flex-row items-center justify-between mb-4">
        <Text className="block text-xl font-bold text-gray-800">小队管理</Text>
        <Button size="sm" onClick={showCreateDialog}>
          <Plus size={16} color="#fff" />
          <Text className="text-white ml-1">创建</Text>
        </Button>
      </View>
      
      {loading ? (
        <View className="flex items-center justify-center h-32">
          <Text className="block text-gray-400">加载中...</Text>
        </View>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users size={48} color="#999" />
            <Text className="block text-gray-500 mt-4">暂无小队</Text>
            <Text className="block text-gray-400 text-sm mt-2">创建小队后可邀请成员协作</Text>
            <Button className="mt-4" onClick={showCreateDialog}>
              <Plus size={16} color="#fff" />
              <Text className="text-white ml-1">创建小队</Text>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <View className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <Text className="block font-semibold text-gray-800">{team.name}</Text>
                  {team.my_role === 'owner' && (
                    <Badge variant="default" className="ml-2">
                      <Crown size={12} color="#fff" />
                      <Text className="text-white ml-1 text-xs">队长</Text>
                    </Badge>
                  )}
                </View>
                {team.my_role === 'owner' && (
                  <Trash2 
                    size={18} 
                    color="#ef4444" 
                    className="cursor-pointer"
                    onClick={() => deleteTeam(team.id)}
                  />
                )}
              </CardHeader>
              <CardContent>
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-sm text-gray-500">
                    创建时间: {new Date(team.created_at).toLocaleDateString()}
                  </Text>
                  <View className="flex flex-row gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewMembers(team.id)}
                    >
                      <Users size={14} color="#1890ff" />
                      <Text className="text-primary ml-1 text-xs">成员</Text>
                    </Button>
                    {team.my_role === 'owner' && (
                      <Button 
                        size="sm"
                        onClick={() => inviteMember(team.id)}
                      >
                        <UserPlus size={14} color="#fff" />
                        <Text className="text-white ml-1 text-xs">邀请</Text>
                      </Button>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
      
      <View className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="block text-sm text-blue-600 font-medium mb-2">提示</Text>
        <Text className="block text-xs text-blue-500">
          • 只有小队成员才能被派发任务{'\n'}
          • 队长可以邀请成员和删除小队{'\n'}
          • 创建小队后自动成为队长
        </Text>
      </View>
    </View>
  )
}