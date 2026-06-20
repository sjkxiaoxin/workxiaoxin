import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private accessTokenCache: { token: string; expiresAt: number } | null = null

  /**
   * 获取微信 access_token（带缓存，有效期 2 小时，提前 5 分钟刷新）
   */
  private async getAccessToken(): Promise<string> {
    // 检查缓存
    if (this.accessTokenCache && Date.now() < this.accessTokenCache.expiresAt) {
      return this.accessTokenCache.token
    }

    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_APP_SECRET

    if (!appid || !secret) {
      this.logger.warn('WECHAT_APPID 或 WECHAT_APP_SECRET 未配置，跳过发送订阅消息')
      return ''
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`

    try {
      const res = await fetch(url)
      const data = await res.json()

      if (data.errcode) {
        this.logger.error(`获取 access_token 失败: ${data.errcode} ${data.errmsg}`)
        return ''
      }

      this.accessTokenCache = {
        token: data.access_token,
        // expires_in 通常为 7200 秒，提前 5 分钟过期
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
      }

      this.logger.log('access_token 获取成功')
      return data.access_token
    } catch (err) {
      this.logger.error(`获取 access_token 异常: ${err}`)
      return ''
    }
  }

  /**
   * 调用微信订阅消息 API 发送消息
   */
  private async callWechatSubscribeMessage(params: {
    touser: string
    template_id: string
    page?: string
    data: Record<string, { value: string }>
  }) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      this.logger.warn('access_token 为空，跳过发送')
      return false
    }

    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const result = await res.json()

      if (result.errcode === 0) {
        this.logger.log(`订阅消息发送成功: touser=${params.touser}, template=${params.template_id}`)
        return true
      } else {
        this.logger.error(`订阅消息发送失败: ${result.errcode} ${result.errmsg}`)
        return false
      }
    } catch (err) {
      this.logger.error(`订阅消息发送异常: ${err}`)
      return false
    }
  }

  /**
   * 根据 userId 查询用户的 openid 和 name
   */
  private async getUserInfo(userId: string): Promise<{ openid: string; name: string }> {
    const client = getSupabaseClient()
    const { data } = await client
      .from('users')
      .select('openid, name')
      .eq('id', userId)
      .maybeSingle()

    return { openid: data?.openid || '', name: data?.name || '' }
  }

  /**
   * 发送任务派达通知
   * 模板：任务派发提醒
   * 字段：name2=被指定人, thing26=操作内容, time19=截止时间
   */
  async sendTaskAssignNotification(data: {
    taskId: string
    taskTitle: string
    assigneeId: string
    creatorName?: string
    deadline?: string
  }) {
    const templateId = process.env.WECHAT_TEMPLATE_TASK_ASSIGN
    if (!templateId) {
      this.logger.warn('WECHAT_TEMPLATE_TASK_ASSIGN 未配置，跳过任务派达通知')
      return
    }

    const { openid, name } = await this.getUserInfo(data.assigneeId)
    if (!openid) {
      this.logger.warn(`用户 ${data.assigneeId} 无 openid，跳过通知`)
      return
    }

    // 格式化截止时间：模板示例格式 "2023年09月14日 13:34"
    let deadlineText = '未设置'
    if (data.deadline) {
      try {
        const d = new Date(data.deadline)
        deadlineText = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } catch {
        deadlineText = data.deadline
      }
    }

    await this.callWechatSubscribeMessage({
      touser: openid,
      template_id: templateId,
      page: `/pages/detail/index?id=${data.taskId}`,
      data: {
        name2: { value: (name || '用户').substring(0, 20) },
        thing26: { value: data.taskTitle.substring(0, 20) },
        time19: { value: deadlineText.substring(0, 20) },
      },
    })
  }

  /**
   * 发送任务状态变更通知
   * 模板：指派任务信息变更通知
   * 字段：thing9=变更人, time10=变更时间, thing8=变更事项
   */
  async sendTaskStatusChangeNotification(data: {
    taskId: string
    taskTitle: string
    assigneeId: string
    creatorId: string
    oldStatus: string
    newStatus: string
    operatorId?: string
    operatorName?: string
  }) {
    const templateId = process.env.WECHAT_TEMPLATE_STATUS_CHANGE
    if (!templateId) {
      this.logger.warn('WECHAT_TEMPLATE_STATUS_CHANGE 未配置，跳过状态变更通知')
      return
    }

    // 通知对象：如果是负责人改了状态，通知创建者；如果是创建者改了状态，通知负责人
    const notifyUserId = data.operatorId === data.assigneeId ? data.creatorId : data.assigneeId
    if (!notifyUserId) return

    const { openid } = await this.getUserInfo(notifyUserId)
    if (!openid) {
      this.logger.warn(`用户 ${notifyUserId} 无 openid，跳过通知`)
      return
    }

    const statusMap: Record<string, string> = {
      todo: '待办',
      in_progress: '进行中',
      done: '已完成',
    }

    // 获取操作者名字
    let operatorName = data.operatorName || ''
    if (!operatorName && data.operatorId) {
      const opInfo = await this.getUserInfo(data.operatorId)
      operatorName = opInfo.name || '用户'
    }

    // 变更时间格式：模板示例 "2023年04月12日 17:34:32"
    const now = new Date()
    const timeText = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    await this.callWechatSubscribeMessage({
      touser: openid,
      template_id: templateId,
      page: `/pages/detail/index?id=${data.taskId}`,
      data: {
        thing9: { value: operatorName.substring(0, 20) },
        time10: { value: timeText.substring(0, 20) },
        thing8: { value: `「${data.taskTitle.substring(0, 10)}」状态变更为${statusMap[data.newStatus] || data.newStatus}`.substring(0, 20) },
      },
    })
  }
}
