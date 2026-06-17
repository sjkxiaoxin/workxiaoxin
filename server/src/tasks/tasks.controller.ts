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
    const task = await this.tasksService.createTask(dto);
    return { data: task };
  }

  // 查询任务列表
  @Get()
  async list(
    @Query('userId') userId?: string,
    @Query('filter') filter?: 'created' | 'assigned' | 'all',
    @Query('status') status?: 'todo' | 'in_progress' | 'done'
  ) {
    const tasks = await this.tasksService.listTasks(userId, filter, status);
    return { data: tasks };
  }

  // 获取任务详情
  @Get(':id')
  async detail(@Param('id') id: string) {
    const task = await this.tasksService.getTaskDetail(id);
    return { data: task };
  }

  // 更新任务
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const task = await this.tasksService.updateTask(id, dto);
    return { data: task };
  }

  // 删除任务
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.tasksService.deleteTask(id);
    return { data: { success: true } };
  }

  // 更新任务状态
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const task = await this.tasksService.updateTaskStatus(id, dto.status, dto.userId);
    return { data: task };
  }

  // 添加评论
  @Post(':id/comments')
  @HttpCode(HttpStatus.OK)
  async addComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    const comment = await this.tasksService.addComment(id, dto);
    return { data: comment };
  }

  // 获取评论列表
  @Get(':id/comments')
  async listComments(@Param('id') id: string) {
    const comments = await this.tasksService.listComments(id);
    return { data: comments };
  }

  // 获取任务历史记录
  @Get(':id/history')
  async listHistory(@Param('id') id: string) {
    const history = await this.tasksService.listHistory(id);
    return { data: history };
  }
}