import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Clock, User, MessageCircle, History, Trash2 } from 'lucide-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  assignee_id: string
  assignee_name?: string
  deadline?: string
  creator_id: string
  creator_name?: string
  created_at: string
  is_urgent: boolean
}

interface Comment {
  id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

interface History {
  id: string
  action_type: string
  old_value?: string
  new_value?: string
  user_id: string
  user_name?: string
  created_at: string
}

const statusConfig = {
  todo: { label: '待办', color: 'bg-orange-400' },
  in_progress: { label: '进行中', color: 'bg-green-500' },
  done: { label: '已完成', color: 'bg-gray-400' }
}

const DetailPage = () => {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [history, setHistory] = useState<History[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const currentUserId = useCurrentUser()

  // 获取任务详情
  const fetchTaskDetail = async (taskId: string) => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/tasks/${taskId}`,
        method: 'GET'
      })
      
      console.log('获取任务详情响应:', res)
      
      if (res && res.data && res.data.data) {
        const taskData = res.data.data
        setTask(taskData)
        setComments(taskData.comments || [])
        setHistory(taskData.history || [])
      }
    } catch (error) {
      console.error('获取任务详情失败:', error)
      Taro.showToast({ title: '获取任务详情失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const taskId = router.params.id
    if (taskId) {
      fetchTaskDetail(taskId)
    }
  }, [router.params.id])

  // 状态切换
  const handleStatusChange = async () => {
    if (!task) return
    
    const statuses = ['todo', 'in_progress', 'done']
    const currentIndex = statuses.indexOf(task.status)
    const nextIndex = (currentIndex + 1) % statuses.length
    const newStatus = statuses[nextIndex] as 'todo' | 'in_progress' | 'done'
    
    try {
      const res = await Network.request({
        url: `/api/tasks/${task.id}/status`,
        method: 'PUT',
        data: {
          status: newStatus,
          userId: currentUserId // 当前登录用户ID
        }
      })
      
      console.log('更新状态响应:', res)
      
      if (res && res.data) {
        setTask({ ...task, status: newStatus })
        Taro.showToast({ title: `状态已更新为：${statusConfig[newStatus].label}`, icon: 'success' })
        
        // 刷新历史记录
        fetchTaskDetail(task.id)
      }
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({ title: '更新状态失败', icon: 'none' })
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    if (!task) return
    if (!newComment.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    try {
      const res = await Network.request({
        url: `/api/tasks/${task.id}/comments`,
        method: 'POST',
        data: {
          userId: currentUserId, // 当前登录用户ID
          content: newComment.trim()
        }
      })
      
      console.log('添加评论响应:', res)
      
      if (res && res.data && res.data.data) {
        const newCommentData = res.data.data
        setComments([...comments, newCommentData])
        setNewComment('')
        Taro.showToast({ title: '评论已添加', icon: 'success' })
      }
    } catch (error) {
      console.error('添加评论失败:', error)
      Taro.showToast({ title: '添加评论失败', icon: 'none' })
    }
  }

  // 删除任务
  const handleDelete = async () => {
    if (!task) return
    
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await Network.request({
              url: `/api/tasks/${task.id}`,
              method: 'DELETE'
            })
            
            console.log('删除任务响应:', result)
            
            if (result && result.data) {
              Taro.showToast({ title: '任务已删除', icon: 'success' })
              
              // 返回首页
              setTimeout(() => {
                Taro.switchTab({ url: '/pages/index/index' })
              }, 1500)
            }
          } catch (error) {
            console.error('删除任务失败:', error)
            Taro.showToast({ title: '删除任务失败', icon: 'none' })
          }
        }
      }
    })
  }

  // 格式化时间显示
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }
  }

  if (loading) {
    return (
      <View className="flex flex-col h-full bg-background items-center justify-center">
        <Text className="block text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!task) {
    return (
      <View className="flex flex-col h-full bg-background items-center justify-center">
        <Text className="block text-muted-foreground">任务不存在</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-background px-4 py-4">
      {/* 任务信息卡片 */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex flex-row items-center justify-between">
            <CardTitle>
              <Text className="block">{task.title}</Text>
            </CardTitle>
            <Badge className={`${statusConfig[task.status].color} text-white`}>
              <Text className="block text-sm">{statusConfig[task.status].label}</Text>
            </Badge>
          </View>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 任务描述 */}
          {task.description && (
            <View>
              <Text className="block text-muted-foreground">{task.description}</Text>
            </View>
          )}
          
          {/* 任务元信息 */}
          <View className="flex flex-col gap-3">
            <View className="flex flex-row items-center gap-2">
              <Clock className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-muted-foreground">截止时间：</Text>
              <Text className="block text-sm">{task.deadline ? new Date(task.deadline).toLocaleDateString('zh-CN') : '未设置'}</Text>
            </View>
            
            <View className="flex flex-row items-center gap-2">
              <User className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-muted-foreground">负责人：</Text>
              <Avatar className="w-6 h-6 mr-2">
                <AvatarFallback>
                  <Text className="block text-xs">{(task.assignee_name || task.assignee_id)?.charAt(0) || 'U'}</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="block text-sm">{task.assignee_name || task.assignee_id}</Text>
            </View>
            
            <View className="flex flex-row items-center gap-2">
              <User className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block text-sm text-muted-foreground">创建人：</Text>
              <Text className="block text-sm">{task.creator_name || task.creator_id}</Text>
            </View>
            
            {task.is_urgent && (
              <Badge className="bg-red-500 text-white">
                <Text className="block text-sm">紧急任务</Text>
              </Badge>
            )}
          </View>
          
          {/* 状态切换按钮 */}
          <Button onClick={handleStatusChange} className="w-full">
            <Text className="block">切换状态</Text>
          </Button>
        </CardContent>
      </Card>

      {/* 评论区域 */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex flex-row items-center gap-2">
            <MessageCircle className="w-5 h-5" size={20} color="#1890ff" />
            <CardTitle>
              <Text className="block">评论 ({comments.length})</Text>
            </CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          {/* 评论列表 */}
          <View className="space-y-3 mb-4">
            {comments.length === 0 ? (
              <Text className="block text-sm text-muted-foreground text-center py-4">暂无评论</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} className="flex flex-row gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Text className="block text-sm">{comment.user_name?.charAt(0) || 'U'}</Text>
                    </AvatarFallback>
                  </Avatar>
                  <View className="flex-1">
                    <View className="flex flex-row items-center gap-2 mb-1">
                      <Text className="block text-sm font-semibold">{comment.user_name}</Text>
                      <Text className="block text-xs text-muted-foreground">{formatTime(comment.created_at)}</Text>
                    </View>
                    <Text className="block text-sm">{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
          
          {/* 新评论输入 */}
          <View className="bg-secondary rounded-lg p-3 flex flex-row gap-2">
            <View className="flex-1">
              <Textarea
                style={{ width: '100%', minHeight: '40px', backgroundColor: 'transparent' }}
                placeholder="输入评论..."
                value={newComment}
                onInput={(e) => setNewComment(e.detail.value)}
              />
            </View>
            <Button size="sm" onClick={handleAddComment}>
              <Text className="block">发送</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* 操作历史 */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex flex-row items-center gap-2">
            <History className="w-5 h-5" size={20} color="#1890ff" />
            <CardTitle>
              <Text className="block">操作历史</Text>
            </CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          <View className="space-y-3">
            {history.length === 0 ? (
              <Text className="block text-sm text-muted-foreground text-center py-4">暂无历史记录</Text>
            ) : (
              history.map((item) => (
                <View key={item.id} className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>
                        <Text className="block text-xs">{item.user_name?.charAt(0) || 'U'}</Text>
                      </AvatarFallback>
                    </Avatar>
                    <Text className="block text-sm">{item.action_type}</Text>
                    {item.old_value && item.new_value && (
                      <Text className="block text-sm text-muted-foreground">
                        {item.old_value} → {item.new_value}
                      </Text>
                    )}
                  </View>
                  <Text className="block text-xs text-muted-foreground">{formatTime(item.created_at)}</Text>
                </View>
              ))
            )}
          </View>
        </CardContent>
      </Card>

      {/* 底部操作栏 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e5e5',
          zIndex: 100
        }}
      >
        <Button variant="destructive" className="flex-1" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" size={16} color="#fff" />
          <Text className="block">删除任务</Text>
        </Button>
      </View>
    </View>
  )
}

export default DetailPage