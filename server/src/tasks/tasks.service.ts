import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateStatusDto } from './dto';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class TasksService {
  constructor(private readonly teamsService: TeamsService) {}

  // 创建任务
  async createTask(dto: CreateTaskDto) {
    const client = getSupabaseClient();
    
    // 验证负责人是否与创建者在同一个小队
    if (dto.assigneeId && dto.assigneeId !== dto.creatorId) {
      const isValidAssignee = await this.validateTeamMember(dto.creatorId, dto.assigneeId);
      if (!isValidAssignee) {
        throw new BadRequestException('只能对小队成员派发任务');
      }
    }
    
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

    console.log('任务创建成功:', {
      taskId: data[0].id,
      assigneeId: dto.assigneeId
    });

    return data[0];
  }

  // 验证负责人是否与创建者在同一个小队
  private async validateTeamMember(creatorId: string, assigneeId: string): Promise<boolean> {
    const client = getSupabaseClient();
    
    // 获取创建者所属的小队
    const { data: creatorTeams } = await client
      .from('team_members')
      .select('team_id')
      .eq('user_id', creatorId);
    
    if (!creatorTeams || creatorTeams.length === 0) {
      // 创建者没有小队，不允许派发任务给其他人
      return false;
    }
    
    const teamIds = creatorTeams.map(t => t.team_id);
    
    // 检查负责人是否在这些小队中
    const { data: assigneeInTeams } = await client
      .from('team_members')
      .select('id')
      .eq('user_id', assigneeId)
      .in('team_id', teamIds)
      .limit(1);
    
    return Boolean(assigneeInTeams && assigneeInTeams.length > 0);
  }

  // 获取创建者可以派发任务的成员列表（同小队成员）
  async getAssignableMembers(creatorId: string) {
    const client = getSupabaseClient();
    
    // 获取创建者所属的小队
    const { data: creatorTeams } = await client
      .from('team_members')
      .select('team_id')
      .eq('user_id', creatorId);
    
    if (!creatorTeams || creatorTeams.length === 0) {
      return [];
    }
    
    const teamIds = creatorTeams.map(t => t.team_id);
    
    // 获取这些小队的所有成员（去重）
    const { data: members } = await client
      .from('team_members')
      .select(`
        user_id,
        users (
          id,
          name,
          avatar
        )
      `)
      .in('team_id', teamIds);
    
    if (!members) return [];
    
    // 去重并格式化
    const uniqueMembers: Map<string, any> = new Map();
    members.forEach((m: any) => {
      if (!uniqueMembers.has(m.user_id)) {
        uniqueMembers.set(m.user_id, {
          id: m.users.id,
          name: m.users.name,
          avatar: m.users.avatar
        });
      }
    });
    
    return Array.from(uniqueMembers.values());
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
    await this.addHistory(id, 'status_changed', userId, `状态变更为: ${statusText}`);

    return data[0];
  }

  // 添加评论
  async addComment(dto: CreateCommentDto) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('comments')
      .insert({
        task_id: dto.taskId,
        user_id: dto.userId,
        content: dto.content
      })
      .select();

    if (error) throw new Error(`添加评论失败: ${error.message}`);

    // 记录历史
    await this.addHistory(dto.taskId, 'commented', dto.userId, `添加评论: ${dto.content.substring(0, 20)}...`);

    return data[0];
  }

  // 记录历史
  private async addHistory(taskId: string, action: string, userId: string, description: string) {
    const client = getSupabaseClient();

    await client
      .from('task_history')
      .insert({
        task_id: taskId,
        action,
        user_id: userId,
        description
      });
  }
}