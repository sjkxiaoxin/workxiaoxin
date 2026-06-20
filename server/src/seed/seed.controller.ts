import { Controller, Post } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Controller('seed')
export class SeedController {
  @Post()
  async seed() {
    const client = getSupabaseClient()
    
    // 插入测试用户
    const testUsers = [
      { id: 'user-001', name: '张三', avatar: '' },
      { id: 'user-002', name: '测试用户二', avatar: '' },
      { id: 'user-003', name: '测试用户三', avatar: '' },
    ]

    const results: Array<{ id: string; status: string }> = []
    for (const user of testUsers) {
      const { data, error } = await client
        .from('users')
        .upsert(user, { onConflict: 'id' })
        .select()
      
      results.push({
        id: user.id,
        status: error ? `失败: ${error.message}` : (data?.[0] ? '已创建' : '已存在'),
      })
    }

    // 插入示例小队
    const { error: teamError } = await client
      .from('teams')
      .upsert(
        { id: 'team-001', name: '测试小队', creator_id: 'user-001' },
        { onConflict: 'id' }
      )

    // 添加小队成员
    const members = [
      { team_id: 'team-001', user_id: 'user-001', role: 'owner' },
      { team_id: 'team-001', user_id: 'user-002', role: 'member' },
    ]
    for (const m of members) {
      await client.from('team_members').upsert(m, { onConflict: 'team_id,user_id' })
    }

    return {
      code: 200,
      msg: '初始化完成',
      data: {
        users: results,
        team: teamError ? `失败: ${teamError.message}` : '已创建',
      },
    }
  }
}
