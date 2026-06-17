import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateStatusDto } from './dto';

@Injectable()
export class TasksService {
  // 创建任务
  async createTask(dto: CreateTaskDto) {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('tasks')
      .insert({
        title: dto.title,
        description: dto.description,
        status: 'todo',
        assignee_id: dto.assigneeId,
        creator_id: dto.creatorId,
        deadline: dto.deadline,
        is_urgent: dto.isUrgent || false
      })
      .select();
    
    if (error) throw new Error(`创建任务失败: ${error.message}`);

    // 记录历史
    await this.addHistory(data[0].id, 'created', dto.creatorId, '任务创建');

    return data[0];
  }

  // 查询任务列表
  async listTasks(userId?: string, filter?: 'created' | 'assigned' | 'all', status?: 'todo' | 'in_progress' | 'done') {
    const client = getSupabaseClient();
    
    let query = client
      .from('tasks')
      .select('id, title, description, status, assignee_id, creator_id, deadline, is_urgent, created_at, updated_at')
      .order('created_at', { ascending: false });

    // 按状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 按归属筛选
    if (userId && filter === 'created') {
      query = query.eq('creator_id', userId);
    } else if (userId && filter === 'assigned') {
      query = query.eq('assignee_id', userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询任务失败: ${error.message}`);

    return data;
  }

  // 获取任务详情（包含评论和历史）
  async getTaskDetail(id: string) {
    const client = getSupabaseClient();

    // 查询任务信息
    const { data: task, error: taskError } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (taskError) throw new Error(`查询任务失败: ${taskError.message}`);
    if (!task) throw new Error('任务不存在');

    // 查询评论
    const { data: comments, error: commentsError } = await client
      .from('comments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) throw new Error(`查询评论失败: ${commentsError.message}`);

    // 查询历史
    const { data: history, error: historyError } = await client
      .from('task_history')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (historyError) throw new Error(`查询历史失败: ${historyError.message}`);

    return {
      ...task,
      comments: comments || [],
      history: history || []
    };
  }

  // 更新任务
  async updateTask(id: string, dto: UpdateTaskDto) {
    const client = getSupabaseClient();

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.assigneeId) updateData.assignee_id = dto.assigneeId;
    if (dto.deadline) updateData.deadline = dto.deadline;
    if (dto.isUrgent !== undefined) updateData.is_urgent = dto.isUrgent;

    const { data, error } = await client
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw new Error(`更新任务失败: ${error.message}`);
    if (!data.length) throw new Error('任务不存在');

    // 记录历史
    if (dto.userId) {
      await this.addHistory(id, 'updated', dto.userId, '任务更新');
    }

    return data[0];
  }

  // 删除任务
  async deleteTask(id: string) {
    const client = getSupabaseClient();

    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除任务失败: ${error.message}`);
  }

  // 更新任务状态
  async updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'done', userId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw new Error(`更新状态失败: ${error.message}`);
    if (!data.length) throw new Error('任务不存在');

    // 记录历史
    const statusText = status === 'todo' ? '待办' : status === 'in_progress' ? '进行中' : '已完成';
    await this.addHistory(id, 'status_change', userId, `状态变更为${statusText}`);

    return data[0];
  }

  // 添加评论
  async addComment(taskId: string, dto: CreateCommentDto) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('comments')
      .insert({
        task_id: taskId,
        user_id: dto.userId,
        content: dto.content
      })
      .select();

    if (error) throw new Error(`添加评论失败: ${error.message}`);

    return data[0];
  }

  // 获取评论列表
  async listComments(taskId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`查询评论失败: ${error.message}`);

    return data;
  }

  // 获取任务历史
  async listHistory(taskId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`查询历史失败: ${error.message}`);

    return data;
  }

  // 私有方法：添加历史记录
  private async addHistory(taskId: string, actionType: string, userId: string, description: string) {
    const client = getSupabaseClient();

    await client
      .from('task_history')
      .insert({
        task_id: taskId,
        action_type: actionType,
        user_id: userId,
        description
      });
  }
}