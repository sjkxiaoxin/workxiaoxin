import { Controller, Post, HttpException, HttpStatus } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { Client } from 'pg'

@Controller('fix-db')
export class FixDbController {
  @Post()
  async fixDb() {
    const results: Array<{ step: string; status: string }> = []

    // 尝试用 pg 直连执行 DDL (Supabase JS 客户端不支持 DDL)
    const supabaseUrl = process.env.COZE_SUPABASE_URL || ''
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    const connectionStrings = [
      `postgresql://postgres:Sjk193384332.@db.${projectRef}.supabase.co:5432/postgres`,
      `postgresql://postgres:Sjk193384332.@${projectRef}.supabase.co:5432/postgres`,
    ]

    let client: Client | null = null

    for (const connStr of connectionStrings) {
      try {
        client = new Client({
          connectionString: connStr,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        })
        await client.connect()
        break
      } catch (err) {
        client = null
      }
    }

    if (!client) {
      // 如果 pg 直连失败，用 Supabase JS 客户端尝试
      return this.fixWithSupabaseClient(results)
    }

    try {
      // 1. 添加 deadline 字段
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE')
      results.push({ step: '添加 deadline 字段', status: '✅ 完成' })

      // 2. 添加 is_urgent 字段
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false')
      results.push({ step: '添加 is_urgent 字段', status: '✅ 完成' })

      // 3. 迁移 due_date 数据
      await client.query('UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL')
      results.push({ step: '迁移 due_date 数据', status: '✅ 完成' })

      // 4. 创建 task_history 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_history (
          id SERIAL PRIMARY KEY,
          task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          user_id TEXT REFERENCES users(id),
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      results.push({ step: '创建 task_history 表', status: '✅ 完成' })

      // 5. 确保 users 表有 openid 字段（微信订阅消息需要）
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS openid TEXT DEFAULT \'\'')
      results.push({ step: '添加 users.openid 字段', status: '✅ 完成' })

      // 验证
      const res = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position"
      )
      const columns = res.rows.map((r: { column_name: string }) => r.column_name)

      return {
        code: 200,
        msg: '数据库修复完成',
        data: { results, tasksColumns: columns },
      }
    } finally {
      await client.end()
    }
  }

  private async fixWithSupabaseClient(results: Array<{ step: string; status: string }>) {
    // Supabase JS 客户端不支持 DDL，返回错误信息
    throw new HttpException(
      {
        code: 500,
        msg: '无法通过 pg 直连数据库，请手动在 Supabase SQL Editor 执行修复',
        sql: `
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS openid TEXT DEFAULT '';
        `,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}
