import { Controller, Get, Post, Put, Delete, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateStatusDto } from './dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // 创建任务
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() dto: CreateTaskDto) {
    console.log('[TasksController] 创建任务:', dto);
    const task = await this.tasksService.createTask(dto);
    return { code: 200, msg: 'success', data: task };
  }

  // 查询任务列表
  @Get()
  async list(
    @Query('userId') userId?: string,
    @Query('filter') filter?: 'created' | 'assigned' | 'all',
    @Query('status') status?: 'todo' | 'in_progress' | 'done'
  ) {
    console.log('[TasksController] 查询任务列表:', { userId, filter, status });
    const tasks = await this.tasksService.listTasks(userId, filter, status);
    return { code: 200, msg: 'success', data: tasks };
  }

  // 获取可派发任务的成员列表（同小队成员）
  @Get('assignable-members')
  async getAssignableMembers(@Query('creatorId') creatorId: string) {
    console.log('[TasksController] 获取可派发成员:', creatorId);
    const members = await this.tasksService.getAssignableMembers(creatorId);
    return { code: 200, msg: 'success', data: members };
  }

  // 获取任务详情
  @Get(':id')
  async detail(@Param('id') id: string) {
    console.log('[TasksController] 获取任务详情:', id);
    const task = await this.tasksService.getTaskDetail(id);
    return { code: 200, msg: 'success', data: task };
  }

  // 更新任务
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    console.log('[TasksController] 更新任务:', { id, dto });
    const task = await this.tasksService.updateTask(id, dto);
    return { code: 200, msg: 'success', data: task };
  }

  // 删除任务
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    console.log('[TasksController] 删除任务:', id);
    await this.tasksService.deleteTask(id);
    return { code: 200, msg: 'success', data: { success: true } };
  }

  // 更新任务状态
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    console.log('[TasksController] 更新状态:', { id, status: dto.status });
    const task = await this.tasksService.updateTaskStatus(id, dto.status, dto.userId);
    return { code: 200, msg: 'success', data: task };
  }

  // 添加评论
  @Post(':id/comments')
  @HttpCode(HttpStatus.OK)
  async addComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    console.log('[TasksController] 添加评论:', { id, userId: dto.userId });
    const comment = await this.tasksService.addComment(dto);
    return { code: 200, msg: 'success', data: comment };
  }
}