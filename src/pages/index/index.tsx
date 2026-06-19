import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardList, Clock } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

// 任务数据类型（对应后端API）
interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  assignee_id: string
  creator_id: string
  deadline: string
  is_urgent: boolean
  created_at: string
  updated_at: string
}

// 状态映射
const statusConfig = {
  todo: { label: '待办', color: 'bg-orange-400' },
  in_progress: { label: '进行中', color: 'bg-green-500' },
  done: { label: '已完成', color: 'bg-gray-400' }
}

// 模拟用户信息（实际应从登录状态获取）
const MOCK_USER_ID = 'user-001'

const IndexPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取任务列表
  useEffect(() => {
    fetchTasks()
  }, [activeTab])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('获取任务列表 - URL:', '/api/tasks')
      console.log('获取任务列表 - Method:', 'GET')
      console.log('获取任务列表 - Params:', { userId: MOCK_USER_ID, filter: activeTab })
      
      const res = await Network.request({
        url: '/api/tasks',
        method: 'GET',
        data: {
          userId: MOCK_USER_ID,
          filter: activeTab
        }
      })
      
      console.log('获取任务列表 - Response:', res)
      
      // 数据解包：后端返回 { code: 200, msg: 'success', data: [...] }
      const taskList = res.data?.data || []
      setTasks(taskList)
    } catch (err) {
      console.error('获取任务列表失败:', err)
      setError('获取任务列表失败，请重试')
      Taro.showToast({ title: '获取任务列表失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 点击任务卡片，跳转到详情页
  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${taskId}` })
  }

  // 格式化截止时间
  const formatDeadline = (deadline: string) => {
    if (!deadline) return '无截止时间'
    const date = new Date(deadline)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <View className="flex flex-col h-full bg-background">
      {/* 页面标题 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-xl font-semibold text-foreground">工作助手小新</Text>
        <Text className="block text-sm text-muted-foreground mt-1">高效协作，准时完成</Text>
      </View>

      {/* 状态筛选 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="created">我创建的</TabsTrigger>
          <TabsTrigger value="assigned">我负责的</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <TaskListSkeleton />
          ) : error ? (
            <Alert className="bg-destructive bg-opacity-10">
              <AlertDescription className="text-destructive">
                <Text className="block">{error}</Text>
              </AlertDescription>
            </Alert>
          ) : (
            <TaskList tasks={tasks} onTaskClick={handleTaskClick} formatDeadline={formatDeadline} />
          )}
        </TabsContent>
      </Tabs>
    </View>
  )
}

// 加载骨架屏
const TaskListSkeleton = () => (
  <View className="space-y-3">
    {[1, 2, 3].map(i => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </View>
)

// 任务列表组件
const TaskList = ({ 
  tasks, 
  onTaskClick, 
  formatDeadline 
}: { 
  tasks: Task[], 
  onTaskClick: (id: string) => void,
  formatDeadline: (deadline: string) => string
}) => {
  if (tasks.length === 0) {
    return (
      <Alert className="bg-secondary">
        <ClipboardList className="w-5 h-5" size={20} color="#8c8c8c" />
        <AlertDescription className="text-muted-foreground">
          <Text className="block">暂无任务</Text>
          <Text className="block text-sm mt-1">点击下方&ldquo;创建&rdquo;按钮添加新任务</Text>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <View className="space-y-3">
      {tasks.map(task => (
        <Card 
          key={task.id} 
          className={`cursor-pointer hover:shadow-md ${task.is_urgent ? 'border-l-4 border-l-red-500' : ''}`}
          onClick={() => onTaskClick(task.id)}
        >
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex-1">
                <Text className="block">{task.title}</Text>
              </CardTitle>
              <Badge className={`${statusConfig[task.status].color} text-white`}>
                <Text className="block text-xs">{statusConfig[task.status].label}</Text>
              </Badge>
            </View>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-5 h-5">
                <AvatarFallback>
                  <Text className="text-xs">{task.assignee_id.slice(0, 1).toUpperCase()}</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="block flex-1">{task.assignee_id}</Text>
              <Clock className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block">{formatDeadline(task.deadline)}</Text>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  )
}

export default IndexPage