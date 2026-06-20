import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Calendar, User, Send, Square } from 'lucide-react-taro'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

const CreatePage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([])
  const currentUserId = useCurrentUser()
  
  // CRITICAL: 直接判断平台（同时支持微信和抖音）
  const isMiniApp = [Taro.ENV_TYPE.WEAPP as string, Taro.ENV_TYPE.TT as string].includes(Taro.getEnv() as string)

  useLoad(() => {
    console.log('Create page loaded.')
  })

  // 获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  // 每次页面显示时刷新可派发成员列表
  useDidShow(() => {
    fetchUsers()
  })

  // CRITICAL: 在useEffect中初始化RecorderManager（仅小程序端）
  useEffect(() => {
    if (isMiniApp) {
      const manager = Taro.getRecorderManager()

      manager.onStart(() => {
        console.log('录音开始')
        setIsRecording(true)
        setRecordingTime(0)
        Taro.showToast({ title: '录音中...', icon: 'none', duration: 1500 })
      })

      manager.onStop((res) => {
        console.log('录音结束，文件路径:', res.tempFilePath, '文件时长:', res.duration, '文件大小:', res.fileSize)
        setIsRecording(false)

        if (!res.tempFilePath) {
          console.error('录音文件路径为空，可能录音时间太短')
          Taro.showToast({ title: '录音时间太短，请长按录音', icon: 'none' })
          return
        }

        // 自动上传并识别
        handleUploadAndRecognize(res.tempFilePath)
      })

      manager.onError((err) => {
        console.error('录音错误详情:', JSON.stringify(err))
        setIsRecording(false)
        const errMsg = typeof err === 'object' ? (err as any).errMsg || JSON.stringify(err) : String(err)
        Taro.showToast({
          title: `录音失败: ${errMsg}`,
          icon: 'none',
          duration: 3000
        })
      })

      // 监听录音帧数据（用于检测是否有声音输入）
      manager.onFrameRecorded && manager.onFrameRecorded((res) => {
        // frameBuffer 包含音频帧数据，frameNumber 是帧编号
        if (res.frameNumber === 1) {
          console.log('检测到声音输入，第一帧已收到')
        }
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
        data: { creatorId: currentUserId }
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
      // 真机调试时使用 Mock 数据
      const mockUsers = [
        { id: 'user-001', name: '测试成员一' },
        { id: 'user-002', name: '测试成员二' }
      ]
      setUsers(mockUsers)
      Taro.showToast({ title: '使用演示成员', icon: 'none', duration: 2000 })
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
  const handleStartRecord = async () => {
    if (!isMiniApp) {
      Taro.showToast({ title: 'H5端暂不支持录音', icon: 'none' })
      return
    }

    if (!recorderManager) {
      Taro.showToast({ title: '录音组件未初始化', icon: 'none' })
      return
    }

    // CRITICAL: 录音前必须检查/请求麦克风权限
    try {
      const setting = await Taro.getSetting()
      const recordAuth = setting.authSetting['scope.record']

      if (recordAuth === false) {
        // 用户之前拒绝过录音权限，需要引导去设置页开启
        Taro.showModal({
          title: '需要录音权限',
          content: '语音输入功能需要使用麦克风权限，您之前拒绝了该权限，请在设置中手动开启。',
          confirmText: '去设置',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              Taro.openSetting({
                success: (openRes) => {
                  // 用户从设置页返回后，如果开启了权限，自动开始录音
                  if (openRes.authSetting['scope.record']) {
                    startRecording()
                  }
                }
              })
            }
          }
        })
        return
      }

      if (recordAuth === undefined) {
        // 从未请求过权限，主动发起授权请求
        await Taro.authorize({ scope: 'scope.record' })
        // 授权成功后继续录音
      }

      // 权限就绪，开始录音
      startRecording()
    } catch (error) {
      console.error('录音权限获取失败:', error)
      Taro.showToast({
        title: '需要麦克风权限才能使用语音输入',
        icon: 'none',
        duration: 3000
      })
    }
  }

  // 实际启动录音的方法
  const startRecording = () => {
    if (!recorderManager) return
    console.log('开始录音...')
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
  // 请求订阅消息授权（创建任务时同时订阅两个模板）
  // 1. 任务派发提醒：将来被别人指派任务时能收到通知
  // 2. 状态变更通知：自己创建的任务被改状态时能收到通知
  const requestSubscribeForTaskAssign = async (): Promise<boolean> => {
    const assignTemplateId = process.env.TARO_APP_WECHAT_TEMPLATE_TASK_ASSIGN
    const statusTemplateId = process.env.TARO_APP_WECHAT_TEMPLATE_STATUS_CHANGE

    const tmplIds: string[] = []
    if (assignTemplateId) tmplIds.push(assignTemplateId)
    if (statusTemplateId) tmplIds.push(statusTemplateId)

    if (tmplIds.length === 0) {
      console.log('未配置订阅消息模板ID，跳过授权')
      return true
    }

    try {
      const res = await Taro.requestSubscribeMessage({
        tmplIds
      })
      console.log('订阅授权结果:', res)
      // 即使拒绝也不阻止任务创建
      return true
    } catch (err) {
      console.log('订阅授权失败或用户拒绝:', err)
      return true
    }
  }

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

    // 请求订阅消息授权（不阻塞任务创建）
    await requestSubscribeForTaskAssign()

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
          creatorId: currentUserId, // 当前登录用户ID
          deadline: new Date(deadline).toISOString(),
          isUrgent: false
        },
        timeout: 15000
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
    } catch (error: any) {
      Taro.hideLoading()
      console.error('创建任务失败:', error)
      const errMsg = error?.errMsg || error?.message || '创建失败'
      Taro.showModal({
        title: '创建失败',
        content: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
        showCancel: false
      })
    }
  }

  // 选择截止日期
  const handleDateChange = (e) => {
    const date = e.detail.value
    setDeadlineDate(date)
    // 日期选完后，等待选时间
    if (deadlineTime) {
      setDeadline(`${date} ${deadlineTime}`)
    }
  }

  // 选择截止时间
  const handleTimeChange = (e) => {
    const time = e.detail.value
    setDeadlineTime(time)
    if (deadlineDate) {
      setDeadline(`${deadlineDate} ${time}`)
    }
  }

  // 清除截止时间
  const handleClearDeadline = () => {
    setDeadline('')
    setDeadlineDate('')
    setDeadlineTime('')
  }

  // 获取今天的日期，作为 Picker 默认值
  const getToday = () => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
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
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {/* 没选日期时：显示日期选择器 */}
              {!deadlineDate ? (
                <Picker mode="date" value={getToday()} onChange={handleDateChange}>
                  <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', paddingHorizontal: '16px', paddingVertical: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '14px', color: '#999' }}>请选择截止时间</Text>
                    <Calendar size={16} color="#8c8c8c" />
                  </View>
                </Picker>
              ) : null}
              
              {/* 选了日期但没选时间：显示时间选择器 */}
              {deadlineDate && !deadlineTime ? (
                <Picker mode="time" value="12:00" onChange={handleTimeChange}>
                  <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', paddingHorizontal: '16px', paddingVertical: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '14px' }}>已选 {deadlineDate}，请选择时间</Text>
                    <Calendar size={16} color="#8c8c8c" />
                  </View>
                </Picker>
              ) : null}
              
              {/* 日期和时间都选了：显示结果 + 清除按钮 */}
              {deadline ? (
                <>
                  <Picker mode="date" value={deadlineDate} onChange={handleDateChange}>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', paddingHorizontal: '16px', paddingVertical: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: '14px' }}>{deadline}</Text>
                      <Calendar size={16} color="#8c8c8c" />
                    </View>
                  </Picker>
                  <View 
                    style={{ marginLeft: '8px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleClearDeadline}
                  >
                    <Text style={{ fontSize: '18px', color: '#ef4444', fontWeight: 'bold' }}>✕</Text>
                  </View>
                </>
              ) : null}
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