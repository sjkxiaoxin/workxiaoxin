import { Injectable } from '@nestjs/common'

@Injectable()
export class NotificationService {
  /**
   * 发送任务派达通知
   * 
   * 注意：需要在微信小程序后台配置订阅消息模板
   * 模板ID需要替换为实际的模板ID
   * 
   * 配置步骤：
   * 1. 登录微信小程序后台
   * 2. 进入"订阅消息"功能
   * 3. 选择合适的模板（如：任务通知模板）
   * 4. 获取模板ID并替换下面的TEMPLATE_ID
   */
  async sendTaskAssignNotification(data: {
    taskId: string
    taskTitle: string
    assigneeId: string
    assigneeOpenid?: string
    creatorName?: string
    deadline?: string
  }) {
    console.log('发送任务派达通知:', data)
    
    // TODO: 调用微信订阅消息API
    // 需要配置实际的模板ID和微信API调用逻辑
    // 
    // 示例代码（需要在配置好模板ID后启用）：
    // 
    // const TEMPLATE_ID = 'YOUR_TEMPLATE_ID' // 替换为实际的模板ID
    // 
    // await this.callWechatSubscribeMessage({
    //   touser: data.assigneeOpenid,
    //   template_id: TEMPLATE_ID,
    //   page: `/pages/detail/index?id=${data.taskId}`,
    //   data: {
    //     thing1: { value: data.taskTitle },
    //     thing2: { value: data.creatorName || '系统' },
    //     time3: { value: data.deadline || '未设置' },
    //     thing4: { value: '您有新任务需要处理' }
    //   }
    // })
    
    // 暂时只记录日志，不实际发送
    console.log('任务派达通知已记录（需要在微信后台配置模板ID后启用）')
  }

  /**
   * 发送任务状态变更通知
   * 
   * 注意：需要在微信小程序后台配置订阅消息模板
   * 模板ID需要替换为实际的模板ID
   */
  async sendTaskStatusChangeNotification(data: {
    taskId: string
    taskTitle: string
    assigneeId: string
    assigneeOpenid?: string
    oldStatus: string
    newStatus: string
    operatorName?: string
  }) {
    console.log('发送任务状态变更通知:', data)
    
    // TODO: 调用微信订阅消息API
    // 需要配置实际的模板ID和微信API调用逻辑
    // 
    // 示例代码（需要在配置好模板ID后启用）：
    // 
    // const TEMPLATE_ID = 'YOUR_TEMPLATE_ID' // 替换为实际的模板ID
    // 
    // const statusMap = {
    //   'todo': '待办',
    //   'in_progress': '进行中',
    //   'done': '已完成'
    // }
    // 
    // await this.callWechatSubscribeMessage({
    //   touser: data.assigneeOpenid,
    //   template_id: TEMPLATE_ID,
    //   page: `/pages/detail/index?id=${data.taskId}`,
    //   data: {
    //     thing1: { value: data.taskTitle },
    //     thing2: { value: statusMap[data.oldStatus] || data.oldStatus },
    //     thing3: { value: statusMap[data.newStatus] || data.newStatus },
    //     time4: { value: new Date().toLocaleString() },
    //     thing5: { value: data.operatorName || '系统' }
    //   }
    // })
    
    // 暂时只记录日志，不实际发送
    console.log('任务状态变更通知已记录（需要在微信后台配置模板ID后启用）')
  }

  /**
   * 调用微信订阅消息API（预留方法）
   * 
   * 实现步骤：
   * 1. 获取微信access_token
   * 2. 调用微信订阅消息发送接口
   * 3. 处理发送结果
   * 
   * 参考文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/subscribe-message/subscribeMessage.send.html
   */
  private async callWechatSubscribeMessage(params: any) {
    // TODO: 实现微信订阅消息API调用
    console.log('调用微信订阅消息API（预留）:', params)
    
    // 需要实现：
    // 1. 获取access_token（需要配置AppID和AppSecret）
    // 2. 调用 POST https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=ACCESS_TOKEN
    // 3. 处理响应结果
  }
}