import { Controller, Post } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Controller('seed')
export class SeedController {
  @Post()
  async seed() {
    const client = getSupabaseClient()
    const results: string[] = []
    
    // 插入测试用户
    const testUsers = [
      { id: 'user-001', name: '张三（测试账号）', avatar: '' },
      { id: 'user-002', name: '李四', avatar: '' },
      { id: 'user-003', name: '王五', avatar: '' },
    ]

    for (const user of testUsers) {
      const { error } = await client
        .from('users')
        .upsert(user, { onConflict: 'id' })
        .select()
      
      results.push(`用户 ${user.name}: ${error ? `失败(${error.message})` : 'OK'}`)
    }

    // 插入示例小队
    const { error: teamError } = await client
      .from('teams')
      .upsert(
        { id: 'team-001', name: '测试小队', creator_id: 'user-001' },
        { onConflict: 'id' }
      )

    results.push(`小队: ${teamError ? `失败(${teamError.message})` : 'OK'}`)

    // 添加小队成员
    const members = [
      { team_id: 'team-001', user_id: 'user-001', role: 'owner' },
      { team_id: 'team-001', user_id: 'user-002', role: 'member' },
      { team_id: 'team-001', user_id: 'user-003', role: 'member' },
    ]
    for (const m of members) {
      await client.from('team_members').upsert(m, { onConflict: 'team_id,user_id' })
    }

    // 插入示例任务（让审核人员看到有数据的界面）
    const sampleTasks = [
      {
        id: 'task-review-001',
        title: '完成首页UI改版',
        description: '根据最新设计稿更新首页样式，包括卡片布局和颜色调整',
        creator_id: 'user-001',
        assignee_id: 'user-002',
        team_id: 'team-001',
        status: 'todo',
        priority: 'high',
      },
      {
        id: 'task-review-002',
        title: '修复语音录入bug',
        description: '部分安卓机型语音录入后无法自动转文字，需要排查兼容性问题',
        creator_id: 'user-001',
        assignee_id: 'user-001',
        team_id: 'team-001',
        status: 'todo',
        priority: 'high',
      },
      {
        id: 'task-review-003',
        title: '编写接口文档',
        description: '整理所有后端API接口，编写统一的接口文档供前端对接',
        creator_id: 'user-001',
        assignee_id: 'user-003',
        team_id: 'team-001',
        status: 'in_progress',
        priority: 'medium',
      },
      {
        id: 'task-review-004',
        title: '数据库性能优化',
        description: '优化慢查询，添加必要索引，review查询语句',
        creator_id: 'user-002',
        assignee_id: 'user-001',
        team_id: 'team-001',
        status: 'todo',
        priority: 'medium',
      },
      {
        id: 'task-review-005',
        title: '用户权限模块开发',
        description: '实现基于角色的权限控制，管理员/普通成员不同权限',
        creator_id: 'user-001',
        assignee_id: 'user-002',
        team_id: 'team-001',
        status: 'done',
        priority: 'high',
      },
      {
        id: 'task-review-006',
        title: '部署上线准备',
        description: '准备服务器环境，配置CI/CD流水线，编写部署文档',
        creator_id: 'user-001',
        assignee_id: 'user-001',
        team_id: 'team-001',
        status: 'done',
        priority: 'medium',
      },
    ]

    for (const task of sampleTasks) {
      const { error } = await client
        .from('tasks')
        .upsert(task, { onConflict: 'id' })
      
      results.push(`任务「${task.title}」: ${error ? `失败(${error.message})` : 'OK'}`)
    }

    return {
      code: 200,
      msg: '初始化完成',
      data: results,
    }
  }
}
