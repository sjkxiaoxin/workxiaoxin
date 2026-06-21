import { View, Text, ScrollView } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

const PrivacyPage = () => {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '隐私政策' })
  }, [])

  return (
    <ScrollView className="h-full bg-background px-4 py-4">
      <View className="mb-4">
        <Text className="block text-xl font-semibold text-foreground">隐私政策</Text>
        <Text className="block text-sm text-muted-foreground mt-1">生效日期：2026年6月21日</Text>
      </View>

      <Card className="mb-3">
        <CardContent className="p-4">
          <Text className="block text-base font-semibold text-foreground mb-2">一、我们收集的信息</Text>
          <Text className="block text-sm text-muted-foreground leading-relaxed">
            为了保障您正常使用本小程序的服务，我们会收集以下信息：{"\n\n"}
            1. **微信公开信息**：当您使用微信登录时，我们会获取您的微信昵称、头像（仅用于展示）。{"\n\n"}
            2. **任务数据**：您创建的任务标题、描述、截止时间、负责人等信息，存储在我们的服务器上，用于团队协作。{"\n\n"}
            3. **录音数据**：当您使用语音输入功能时，录音文件会临时上传至服务器进行语音识别，识别完成后立即删除，不会长期存储。{"\n\n"}
            4. **使用日志**：我们会记录操作日志（如任务创建、状态变更），用于问题排查和功能改进。
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="p-4">
          <Text className="block text-base font-semibold text-foreground mb-2">二、信息的使用</Text>
          <Text className="block text-sm text-muted-foreground leading-relaxed">
            我们收集的信息仅用于：{"\n\n"}
            1. 提供核心功能（任务创建、分配、跟踪）；{"\n\n"}
            2. 发送任务通知（需您主动订阅）；{"\n\n"}
            3. 改进产品和服务。{"\n\n"}
            我们不会将您的信息出售给第三方，也不会用于本政策未说明的用途。
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="p-4">
          <Text className="block text-base font-semibold text-foreground mb-2">三、信息存储</Text>
          <Text className="block text-sm text-muted-foreground leading-relaxed">
            您的数据存储于 Supabase 云数据库（海外服务器），传输过程使用 HTTPS 加密。{"\n\n"}
            我们会采取合理的技术措施保护您的数据安全，但请您理解，互联网环境并非绝对安全，我们将尽力保护您的信息。
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="p-4">
          <Text className="block text-base font-semibold text-foreground mb-2">四、您的权利</Text>
          <Text className="block text-sm text-muted-foreground leading-relaxed">
            您有权：{"\n\n"}
            1. 查看您的数据：在"我的"页面可以查看您的任务和统计信息；{"\n\n"}
            2. 删除您的数据：请联系开发者申请删除账号及所有相关数据；{"\n\n"}
            3. 撤回授权：可以在微信设置中取消对小程序的授权。
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="p-4">
          <Text className="block text-base font-semibold text-foreground mb-2">五、 contact Us</Text>
          <Text className="block text-sm text-muted-foreground leading-relaxed">
            如您对本隐私政策有任何疑问，请联系我们：{"\n\n"}
            开发者：工作助手小新团队{"\n"}
            联系邮箱：请在微信公众平台留言
          </Text>
        </CardContent>
      </Card>

      <View className="pb-8">
        <Text className="block text-xs text-muted-foreground text-center">
          本政策未尽事宜，以微信小程序平台相关规定为准。
        </Text>
      </View>
    </ScrollView>
  )
}

export default PrivacyPage
