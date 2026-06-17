import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClipboardList, Clock } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

// 模拟任务数据
interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee: string
  assigneeAvatar?: string
  deadline: string
  creator: string
  isUrgent: boolean
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: '完成产品需求文档',
    status: 'in_progress',
    assignee: '张三',
    deadline: '2024-12-20',
    creator: '李四',
    isUrgent: true
  },
  {
    id: '2',
    title: '设计首页原型',
    status: 'todo',
    assignee: '王五',
    deadline: '2024-12-25',
    creator: '张三',
    isUrgent: false
  },
  {
    id: '3',
    title: '编写后端接口',
    status: 'done',
    assignee: '赵六',
    deadline: '2024-12-15',
    creator: '李四',
    isUrgent: false
  }
]

// 状态映射
const statusConfig = {
  todo: { label: '待办', color: 'bg-orange-400' },
  in_progress: { label: '进行中', color: 'bg-green-500' },
  done: { label: '已完成', color: 'bg-gray-400' }
}

const IndexPage = () => {
  const [activeTab, setActiveTab] = useState('all')

  // 根据筛选条件过滤任务
  const filteredTasks = mockTasks.filter(task => {
    if (activeTab === 'created') return task.creator === '张三'
    if (activeTab === 'assigned') return task.assignee === '张三'
    return true
  })

  // 点击任务卡片，跳转到详情页
  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${taskId}` })
  }

  return (
    <View className="flex flex-col h-full bg-background">
      {/* 页面标题 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-xl font-semibold text-foreground">飞任务</Text>
        <Text className="block text-sm text-muted-foreground mt-1">高效协作，准时完成</Text>
      </View>

      {/* 状态筛选 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="created">我创建的</TabsTrigger>
          <TabsTrigger value="assigned">我负责的</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-4">
          <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="assigned" className="mt-4">
          <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
        </TabsContent>
      </Tabs>
    </View>
  )
}

// 任务列表组件
const TaskList = ({ tasks, onTaskClick }: { tasks: Task[], onTaskClick: (id: string) => void }) => {
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
          className={`cursor-pointer hover:shadow-md ${task.isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
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
                {task.assigneeAvatar ? (
                  <AvatarImage src={task.assigneeAvatar} />
                ) : (
                  <AvatarFallback>
                    <Text className="text-xs">{task.assignee[0]}</Text>
                  </AvatarFallback>
                )}
              </Avatar>
              <Text className="block flex-1">{task.assignee}</Text>
              <Clock className="w-4 h-4" size={16} color="#8c8c8c" />
              <Text className="block">{task.deadline}</Text>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  )
}

export default IndexPage