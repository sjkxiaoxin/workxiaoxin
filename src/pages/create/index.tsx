import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Calendar, User, Send } from 'lucide-react-taro'
import Taro, { useLoad } from '@tarojs/taro'

const CreatePage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  useLoad(() => {
    console.log('Create page loaded.')
  })

  // 语音创建任务（简化版，实际需要录音和 ASR）
  const handleVoiceCreate = async () => {
    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    const isTT = Taro.getEnv() === Taro.ENV_TYPE.TT
    
    if (!isWeapp && !isTT) {
      Taro.showToast({ title: '语音功能仅在小程序中可用', icon: 'none' })
      return
    }

    setIsRecording(true)
    Taro.showToast({ title: '录音功能开发中...', icon: 'none', duration: 2000 })
    
    // 模拟录音
    setTimeout(() => {
      setIsRecording(false)
      // TODO: 实际录音和 ASR 功能
      setTitle('语音识别示例任务')
      setDescription('这是一个通过语音创建的任务示例')
    }, 2000)
  }

  // 选择截止时间
  const handleSelectDeadline = () => {
    Taro.showModal({
      title: '选择截止时间',
      content: '请选择任务的截止时间',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          // 模拟选择日期
          setDeadline('2024-12-31')
        }
      }
    })
  }

  // 选择负责人
  const handleSelectAssignee = () => {
    Taro.showActionSheet({
      itemList: ['张三', '李四', '王五'],
      success: (res) => {
        const names = ['张三', '李四', '王五']
        setAssignee(names[res.tapIndex])
      }
    })
  }

  // 创建任务
  const handleCreateTask = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' })
      return
    }

    if (!assignee) {
      Taro.showToast({ title: '请选择负责人', icon: 'none' })
      return
    }

    // TODO: 调用后端接口创建任务
    Taro.showToast({ title: '创建成功', icon: 'success' })
    
    // 返回首页
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/index/index' })
    }, 1500)
  }

  return (
    <View className="flex flex-col h-full bg-background px-4 py-4">
      {/* 页面标题 */}
      <Text className="block text-xl font-semibold text-foreground mb-4">创建任务</Text>

      {/* 任务表单 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <Text className="block">任务信息</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 任务标题 */}
          <View>
            <Label className="text-sm text-muted-foreground mb-2">
              <Text className="block">任务标题</Text>
            </Label>
            <View className="bg-secondary rounded-lg px-3 py-2 flex flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入任务标题"
                  value={title}
                  onInput={(e) => setTitle(e.detail.value)}
                />
              </View>
              {/* 语音按钮 */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleVoiceCreate}
                disabled={isRecording}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} size={16} color="#1890ff" />
              </Button>
            </View>
          </View>

          {/* 任务描述 */}
          <View>
            <Label className="text-sm text-muted-foreground mb-2">
              <Text className="block">任务描述</Text>
            </Label>
            <View className="bg-secondary rounded-lg p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                placeholder="请输入任务详细描述..."
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                maxlength={500}
              />
            </View>
          </View>

          {/* 负责人 */}
          <View>
            <Label className="text-sm text-muted-foreground mb-2">
              <Text className="block">负责人</Text>
            </Label>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSelectAssignee}
            >
              <User className="w-4 h-4 mr-2" size={16} color="#1890ff" />
              <Text className="block">{assignee || '请选择负责人'}</Text>
            </Button>
          </View>

          {/* 截止时间 */}
          <View>
            <Label className="text-sm text-muted-foreground mb-2">
              <Text className="block">截止时间</Text>
            </Label>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSelectDeadline}
            >
              <Calendar className="w-4 h-4 mr-2" size={16} color="#1890ff" />
              <Text className="block">{deadline || '请选择截止时间'}</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* 创建按钮 */}
      <View className="flex flex-row gap-3 mt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          <Text className="block">取消</Text>
        </Button>
        <Button
          className="flex-1 bg-primary"
          onClick={handleCreateTask}
        >
          <Send className="w-4 h-4 mr-2" size={16} color="#ffffff" />
          <Text className="block text-primary-foreground">创建任务</Text>
        </Button>
      </View>
    </View>
  )
}

export default CreatePage