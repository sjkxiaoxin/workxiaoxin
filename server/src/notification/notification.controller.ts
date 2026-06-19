import { Controller, Post, Body } from '@nestjs/common'
import { NotificationService } from './notification.service'

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 发送任务派达通知
   */
  @Post('task-assign')
  async sendTaskAssignNotification(@Body() body: {
    taskId: string
    taskTitle: string
    assigneeId: string
    assigneeOpenid?: string
    creatorName?: string
    deadline?: string
  }) {
    await this.notificationService.sendTaskAssignNotification(body)
    
    return {
      code: 200,
      msg: 'success',
      data: { sent: true }
    }
  }

  /**
   * 发送任务状态变更通知
   */
  @Post('task-status-change')
  async sendTaskStatusChangeNotification(@Body() body: {
    taskId: string
    taskTitle: string
    assigneeId: string
    assigneeOpenid?: string
    oldStatus: string
    newStatus: string
    operatorName?: string
  }) {
    await this.notificationService.sendTaskStatusChangeNotification(body)
    
    return {
      code: 200,
      msg: 'success',
      data: { sent: true }
    }
  }
}