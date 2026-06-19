import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';

@Injectable()
export class TeamsService {
  // 创建小队
  async createTeam(name: string, creatorId: string) {
    const client = getSupabaseClient();
    
    // 1. 创建小队
    const teamResult = await client
      .from('teams')
      .insert({
        name,
        creator_id: creatorId,
      })
      .select()
      .single();

    if (teamResult.error) {
      console.error('[TeamsService] 创建小队失败:', teamResult.error);
      throw new BadRequestException('创建小队失败');
    }

    const team = teamResult.data;

    // 2. 创建者自动成为owner成员
    const memberResult = await client
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: creatorId,
        role: 'owner',
      })
      .select()
      .single();

    if (memberResult.error) {
      console.error('[TeamsService] 添加创建者为成员失败:', memberResult.error);
      // 回滚删除小队
      await client.from('teams').delete().eq('id', team.id);
      throw new BadRequestException('创建小队成员失败');
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        ...team,
        members: [{
          id: memberResult.data.id,
          user_id: creatorId,
          role: 'owner',
          joined_at: memberResult.data.joined_at,
        }]
      }
    };
  }

  // 获取用户所属的小队列表
  async getUserTeams(userId: string) {
    const client = getSupabaseClient();
    
    const result = await client
      .from('team_members')
      .select(`
        id,
        role,
        joined_at,
        team_id,
        teams (
          id,
          name,
          creator_id,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (result.error) {
      console.error('[TeamsService] 获取用户小队失败:', result.error);
      throw new BadRequestException('获取小队列表失败');
    }

    const teams = result.data.map((item: any) => ({
      id: item.teams.id,
      name: item.teams.name,
      creator_id: item.teams.creator_id,
      created_at: item.teams.created_at,
      my_role: item.role,
      joined_at: item.joined_at,
    }));

    return {
      code: 200,
      msg: 'success',
      data: teams
    };
  }

  // 获取小队成员列表
  async getTeamMembers(teamId: string) {
    const client = getSupabaseClient();
    
    const result = await client
      .from('team_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        users (
          id,
          name,
          avatar
        )
      `)
      .eq('team_id', teamId);

    if (result.error) {
      console.error('[TeamsService] 获取小队成员失败:', result.error);
      throw new BadRequestException('获取成员列表失败');
    }

    const members = result.data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      role: item.role,
      joined_at: item.joined_at,
      name: item.users.name,
      avatar: item.users.avatar,
    }));

    return {
      code: 200,
      msg: 'success',
      data: members
    };
  }

  // 添加成员到小队
  async addMember(teamId: string, userId: string) {
    const client = getSupabaseClient();
    
    // 检查是否已是成员
    const checkResult = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (checkResult.data) {
      throw new BadRequestException('该用户已是小队成员');
    }

    const result = await client
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'member',
      })
      .select()
      .single();

    if (result.error) {
      console.error('[TeamsService] 添加成员失败:', result.error);
      throw new BadRequestException('添加成员失败');
    }

    return {
      code: 200,
      msg: 'success',
      data: result.data
    };
  }

  // 移除成员
  async removeMember(teamId: string, userId: string) {
    const client = getSupabaseClient();
    
    const result = await client
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error) {
      console.error('[TeamsService] 移除成员失败:', result.error);
      throw new BadRequestException('移除成员失败');
    }

    return {
      code: 200,
      msg: 'success',
      data: { removed: true }
    };
  }

  // 获取小队详情
  async getTeamDetail(teamId: string) {
    const client = getSupabaseClient();
    
    const teamResult = await client
      .from('teams')
      .select(`
        id,
        name,
        creator_id,
        created_at,
        updated_at
      `)
      .eq('id', teamId)
      .single();

    if (teamResult.error || !teamResult.data) {
      throw new NotFoundException('小队不存在');
    }

    // 获取成员列表
    const membersResult = await client
      .from('team_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        users (
          id,
          name,
          avatar
        )
      `)
      .eq('team_id', teamId);

    const members = membersResult.data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      role: item.role,
      joined_at: item.joined_at,
      name: item.users.name,
      avatar: item.users.avatar,
    })) || [];

    return {
      code: 200,
      msg: 'success',
      data: {
        ...teamResult.data,
        members
      }
    };
  }

  // 删除小队（仅创建者可删除）
  async deleteTeam(teamId: string, userId: string) {
    const client = getSupabaseClient();
    
    // 检查是否是创建者
    const teamResult = await client
      .from('teams')
      .select('creator_id')
      .eq('id', teamId)
      .single();

    if (teamResult.error || !teamResult.data) {
      throw new NotFoundException('小队不存在');
    }

    if (teamResult.data.creator_id !== userId) {
      throw new BadRequestException('只有创建者可以删除小队');
    }

    // 删除小队（会级联删除成员）
    const result = await client
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (result.error) {
      console.error('[TeamsService] 删除小队失败:', result.error);
      throw new BadRequestException('删除小队失败');
    }

    return {
      code: 200,
      msg: 'success',
      data: { deleted: true }
    };
  }

  // 检查用户是否是小队成员
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const client = getSupabaseClient();
    
    const result = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    return !!result.data;
  }
}