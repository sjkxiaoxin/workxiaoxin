import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Clock, User, MessageCircle, History, ChevronRight, Trash2 } from 'lucide-react-taro'
import Taro, { useLoad } from '@tarojs/taro'

// 模拟任务详情数据
const mockTaskDetail = {
  id: '1',
  title: '完成产品需求文档',
  description: '需要完成新功能的产品需求文档，包括用户调研、功能设计、技术方案等内容。',
  status: 'in_progress',
  assignee: '张三',
  assigneeAvatar: '',
  deadline: '2024-12-20',
  creator: '李四',
  createdAt: '2024-12-15',
  isUrgent: true
}

// 模拟评论数据
const mockComments = [
  {
    id: '1',
    user: '李四',
    content: '任务已经分配，请按时完成',
    time: '2024-12-15 10:00'
  },
  {
    id: '2',
    user: '张三',
    content: '收到，我会尽快完成',
    time: '2024-12-15 11:00'
  }
]

// 模拟历史记录
const mockHistory = [
  {
    id: '1',
    action: '任务创建',
    user: '李四',
    time: '2024-12-15 09:00'
  },
  {
    id: '2',
    action: '状态变更：待办 → 进行中',
    user: '张三',
    time: '2024-12-16 10:00'
  }
]

const statusConfig = {
  todo: { label: '待办', color: 'bg-orange-400' },
  in_progress: { label: '进行中', color: 'bg-green-500' },
  done: { label: '已完成', color: 'bg-gray-400' }
}

const DetailPage = () => {
  const [task, setTask] = useState(mockTaskDetail)
  const [comments, setComments] = useState(mockComments)
  const [newComment, setNewComment] = useState('')

  useLoad((options) => {
    console.log('Detail page loaded with options:', options)
    // TODO: 根据 options.id 获取任务详情
  })

  // 状态切换
  const handleStatusChange = () => {
    const statuses = ['todo', 'in_progress', 'done']
    const currentIndex = statuses.indexOf(task.status)
    const nextIndex = (currentIndex + 1) % statuses.length
    const newStatus = statuses[nextIndex] as 'todo' | 'in_progress' | 'done'
    
    setTask({ ...task, status: newStatus })
    Taro.showToast({ title: `状态已更新为：${statusConfig[newStatus].label}`, icon: 'success' })
    // TODO: 调用后端接口更新状态
  }

  // 添加评论
  const handleAddComment = () => {
    if (!newComment.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    const comment = {
      id: `${comments.length + 1}`,
      user: '我',
      content: newComment,
      time: new Date().toLocaleString('zh-CN')
    }
    
    setComments([...comments, comment])
    setNewComment('')
    Taro.showToast({ title: '评论成功', icon: 'success' })
    // TODO: 调用后端接口添加评论
  }

  // 删除任务
  const handleDeleteTask = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            Taro.navigateBack()
          }, 1500)
        }
      }
    })
  }

  return (
    <View className="flex flex-col h-full bg-background">
      {/* 任务信息 */}
      <View className="px-4 py-4">
        <Card className={`${task.isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
          <CardHeader>
            <View className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex-1">
                <Text className="block">{task.title}</Text>
              </CardTitle>
              <Badge className={`${statusConfig[task.status].color} text-white`}>
                <Text className="block text-xs">{statusConfig[task.status].label}</Text>
              </Badge>
            </View>
          </CardHeader>
          <CardContent>
            {/* 基本信息 */}
            <View className="space-y-2 text-sm text-muted-foreground">
              <View className="flex flex-row items-center gap-2">
                <User className="w-4 h-4" size={16} color="#1890ff" />
                <Text className="block">负责人：</Text>
                <Avatar className="w-5 h-5">
                  <AvatarFallback>
                    <Text className="text-xs">{task.assignee[0]}</Text>
                  </AvatarFallback>
                </Avatar>
                <Text className="block">{task.assignee}</Text>
              </View>
              
              <View className="flex flex-row items-center gap-2">
                <Clock className="w-4 h-4" size={16} color="#1890ff" />
                <Text className="block">截止时间：{task.deadline}</Text>
              </View>

              <View className="flex flex-row items-center gap-2">
                <Text className="block">创建人：{task.creator}</Text>
              </View>
            </View>

            {/* 任务描述 */}
            <Separator className="my-3" />
            <View>
              <Text className="block text-sm font-medium text-foreground mb-2">任务描述</Text>
              <Text className="block text-sm text-muted-foreground">{task.description}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleStatusChange}
          >
            <ChevronRight className="w-4 h-4 mr-2" size={16} color="#1890ff" />
            <Text className="block">切换状态</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeleteTask}
          >
            <Trash2 className="w-4 h-4 mr-2" size={16} color="#f5222d" />
            <Text className="block text-destructive">删除任务</Text>
          </Button>
        </View>
      </View>

      {/* 评论区域 */}
      <View className="px-4 py-4 flex-1">
        <View className="flex flex-row items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5" size={20} color="#1890ff" />
          <Text className="block text-base font-medium text-foreground">评论 ({comments.length})</Text>
        </View>

        {/* 评论列表 */}
        <View className="space-y-3 mb-4">
          {comments.map(comment => (
            <View key={comment.id} className="bg-secondary rounded-lg p-3">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="block text-sm font-medium text-foreground">{comment.user}</Text>
                <Text className="block text-xs text-muted-foreground">{comment.time}</Text>
              </View>
              <Text className="block text-sm text-muted-foreground">{comment.content}</Text>
            </View>
          ))}
        </View>

        {/* 评论输入框 */}
        <View className="bg-secondary rounded-lg p-3">
          <Textarea
            style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
            placeholder="输入评论..."
            value={newComment}
            onInput={(e) => setNewComment(e.detail.value)}
            maxlength={200}
          />
          <Button
            size="sm"
            className="mt-2 bg-primary"
            onClick={handleAddComment}
          >
            <Text className="block text-primary-foreground">发送评论</Text>
          </Button>
        </View>
      </View>

      {/* 历史记录 */}
      <View className="px-4 py-4">
        <View className="flex flex-row items-center gap-2 mb-3">
          <History className="w-5 h-5" size={20} color="#1890ff" />
          <Text className="block text-base font-medium text-foreground">历史记录</Text>
        </View>

        <View className="space-y-2">
          {mockHistory.map(record => (
            <View key={record.id} className="flex flex-row items-start gap-3">
              <View className="w-2 h-2 rounded-full bg-primary mt-2" />
              <View className="flex-1">
                <Text className="block text-sm text-foreground">{record.action}</Text>
                <Text className="block text-xs text-muted-foreground">{record.user} · {record.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default DetailPage