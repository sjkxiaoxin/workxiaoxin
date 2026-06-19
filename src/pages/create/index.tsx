import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Calendar, User, Send, Square } from 'lucide-react-taro'
import Taro, { useLoad } from '@tarojs/taro'
import { Network } from '@/network'

const CreatePage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([])
  
  // CRITICAL: 直接判断平台（同时支持微信和抖音）
  const isMiniApp = [Taro.ENV_TYPE.WEAPP as string, Taro.ENV_TYPE.TT as string].includes(Taro.getEnv() as string)

  useLoad(() => {
    console.log('Create page loaded.')
  })

  // 获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  // CRITICAL: 在useEffect中初始化RecorderManager（仅小程序端）
  useEffect(() => {
    if (isMiniApp) {
      const manager = Taro.getRecorderManager()

      manager.onStart(() => {
        console.log('录音开始')
        setIsRecording(true)
        setRecordingTime(0)
      })

      manager.onStop((res) => {
        console.log('录音结束，文件路径:', res.tempFilePath)
        setIsRecording(false)
        // 自动上传并识别
        handleUploadAndRecognize(res.tempFilePath)
      })

      manager.onError((err) => {
        console.error('录音错误:', err)
        Taro.showToast({ title: '录音失败', icon: 'none' })
        setIsRecording(false)
      })

      setRecorderManager(manager)
    }
  }, [isMiniApp])

  // 获取可派发任务的成员列表（同小队成员）
  const fetchUsers = async () => {
    try {
      // 使用新的接口获取可派发成员（只返回同小队成员）
      const res = await Network.request({
        url: '/api/tasks/assignable-members',
        method: 'GET',
        data: { creatorId: 'user-001' }
      })
      
      console.log('获取可派发成员响应:', res)
      
      if (res && res.data) {
        const userList = res.data.data || []
        setUsers(userList)
        console.log('可派发成员列表:', userList)
        
        if (userList.length === 0) {
          Taro.showToast({ title: '请先创建小队', icon: 'none', duration: 2000 })
        }
      }
    } catch (error) {
      console.error('获取成员列表失败:', error)
      Taro.showToast({ title: '获取成员失败', icon: 'none' })
      setUsers([])
    }
  }

  // 录音计时器
  useEffect(() => {
    let timer: number | null = null
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000) as unknown as number
    } else {
      if (timer) clearInterval(timer)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRecording])

  // 上传音频并调用ASR识别
  const handleUploadAndRecognize = async (filePath: string) => {
    if (!filePath) return
    
    setIsProcessing(true)
    Taro.showToast({ title: '正在识别...', icon: 'loading', duration: 10000 })
    
    try {
      // 上传音频文件到后端
      const uploadRes = await Network.uploadFile({
        url: '/api/asr/upload',
        filePath: filePath,
        name: 'audio'
      })
      
      console.log('上传响应:', uploadRes)
      
      // 检查响应数据结构
      if (uploadRes && uploadRes.data) {
        const result = typeof uploadRes.data === 'string' 
          ? JSON.parse(uploadRes.data) 
          : uploadRes.data
        
        if (result && result.text) {
          // 将识别结果填充到任务描述
          setDescription(result.text)
          Taro.showToast({ title: '识别成功', icon: 'success' })
        } else {
          Taro.showToast({ title: '识别结果为空', icon: 'none' })
        }
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      Taro.showToast({ title: '识别失败，请重试', icon: 'none' })
    } finally {
      setIsProcessing(false)
    }
  }

  // 开始录音
  const handleStartRecord = () => {
    if (!isMiniApp) {
      Taro.showToast({ title: 'H5端暂不支持录音', icon: 'none' })
      return
    }
    
    if (!recorderManager) {
      Taro.showToast({ title: '录音组件未初始化', icon: 'none' })
      return
    }
    
    // 开始录音（WAV格式，16kHz采样率，单声道）
    recorderManager.start({
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1
    })
  }

  // 停止录音
  const handleStopRecord = () => {
    if (!recorderManager) return
    recorderManager.stop()
  }

  // 选择负责人
  const handleSelectAssignee = () => {
    if (users.length === 0) {
      Taro.showToast({ title: '暂无小队成员，请先邀请', icon: 'none' })
      return
    }
    
    Taro.showActionSheet({
      itemList: users.map(u => u.name),
      success: (res) => {
        const selectedUser = users[res.tapIndex]
        setAssignee(selectedUser.name)
        setAssigneeId(selectedUser.id)
      }
    })
  }

  // 提交创建任务
  const handleSubmit = async () => {
    // 验证必填字段
    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' })
      return
    }
    
    if (!assigneeId) {
      Taro.showToast({ title: '请选择负责人', icon: 'none' })
      return
    }
    
    if (!deadline) {
      Taro.showToast({ title: '请选择截止时间', icon: 'none' })
      return
    }
    
    try {
      Taro.showLoading({ title: '创建中...' })
      
      // 调用后端接口创建任务
      const res = await Network.request({
        url: '/api/tasks',
        method: 'POST',
        data: {
          title: title.trim(),
          description: description.trim(),
          assigneeId: assigneeId,
          creatorId: 'user-001', // 当前登录用户ID
          deadline: new Date(deadline).toISOString(),
          isUrgent: false
        }
      })
      
      console.log('创建任务响应:', res)
      
      Taro.hideLoading()
      
      if (res && res.data) {
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
        
        // 清空表单
        setTitle('')
        setDescription('')
        setAssignee('')
        setAssigneeId('')
        setDeadline('')
        
        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建任务失败:', error)
      Taro.showToast({
        title: '创建失败',
        icon: 'none'
      })
    }
  }

  // 选择截止时间
  const handleSelectDeadline = () => {
    // 使用 Picker 组件选择日期时间
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    
    Taro.showActionSheet({
      itemList: ['今天', '明天', '一周后', '自定义'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 今天
            setDeadline(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 18:00`)
            break
          case 1: // 明天
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            setDeadline(`${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')} 18:00`)
            break
          case 2: // 一周后
            const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            setDeadline(`${weekLater.getFullYear()}-${(weekLater.getMonth() + 1).toString().padStart(2, '0')}-${weekLater.getDate().toString().padStart(2, '0')} 18:00`)
            break
          case 3: // 自定义 - 使用默认值
            const defaultDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
            setDeadline(`${defaultDate.getFullYear()}-${(defaultDate.getMonth() + 1).toString().padStart(2, '0')}-${defaultDate.getDate().toString().padStart(2, '0')} 18:00`)
            Taro.showToast({ title: '已设置为3天后', icon: 'none' })
            break
        }
      }
    })
  }

  // 格式化录音时长
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <View className="min-h-screen bg-background p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <Text className="block text-lg">创建新任务</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 任务标题 */}
          <View>
            <Label>
              <Text className="block text-sm font-medium mb-2">任务标题 *</Text>
            </Label>
            <View className="bg-gray-50 rounded-lg px-4 py-3">
              <Input
                className="w-full bg-transparent"
                placeholder="请输入任务标题"
                value={title}
                onInput={(e) => setTitle(e.detail.value)}
              />
            </View>
          </View>
          
          {/* 任务描述 */}
          <View>
            <Label>
              <Text className="block text-sm font-medium mb-2">任务描述</Text>
            </Label>
            <View className="bg-gray-50 rounded-xl p-4">
              <Textarea
                style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                placeholder="请输入任务详细描述..."
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                maxlength={500}
              />
            </View>
            
            {/* 语音输入按钮 */}
            <View className="mt-2 flex items-center">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center"
                onClick={isRecording ? handleStopRecord : handleStartRecord}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <>
                    <Square size={16} color="#f5222d" className="mr-2" />
                    <Text className="block text-sm">停止录音 ({formatTime(recordingTime)})</Text>
                  </>
                ) : (
                  <>
                    <Mic size={16} color="#1890ff" className="mr-2" />
                    <Text className="block text-sm">语音输入</Text>
                  </>
                )}
              </Button>
              
              {isMiniApp ? (
                <Text className="block text-xs text-gray-500 ml-2">
                  点击麦克风开始录音，录音结束后自动识别
                </Text>
              ) : (
                <Text className="block text-xs text-orange-500 ml-2">
                  H5端暂不支持录音功能
                </Text>
              )}
            </View>
          </View>
          
          {/* 负责人选择 */}
          <View>
            <Label>
              <Text className="block text-sm font-medium mb-2">负责人 *</Text>
            </Label>
            <View 
              className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between"
              onClick={handleSelectAssignee}
            >
              <Text className="block text-sm">
                {assignee || '请选择负责人'}
              </Text>
              <User size={16} color="#8c8c8c" className="ml-2" />
            </View>
          </View>
          
          {/* 截止时间 */}
          <View>
            <Label>
              <Text className="block text-sm font-medium mb-2">截止时间 *</Text>
            </Label>
            <View 
              className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between"
              onClick={handleSelectDeadline}
            >
              <Text className="block text-sm">
                {deadline || '请选择截止时间'}
              </Text>
              <Calendar size={16} color="#8c8c8c" className="ml-2" />
            </View>
          </View>
          
          {/* 提交按钮 */}
          <Button
            className="w-full mt-6 bg-primary text-primary-foreground"
            onClick={handleSubmit}
          >
            <View className="flex items-center justify-center">
              <Send size={16} color="#ffffff" className="mr-2" />
              <Text className="block text-sm font-medium">创建任务</Text>
            </View>
          </Button>
        </CardContent>
      </Card>
      
      {/* 提示信息 */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg">
        <Text className="block text-sm text-blue-600">
          提示：只能对小队成员派发任务。如果没有可选成员，请先在「我的」页面创建小队并邀请成员。
        </Text>
      </View>
    </View>
  )
}

export default CreatePage