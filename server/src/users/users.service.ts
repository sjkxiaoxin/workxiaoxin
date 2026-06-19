import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class UsersService {
  /**
   * 获取用户列表
   */
  async findAll() {
    const client = getSupabaseClient()
    
    const result = await client
      .from('users')
      .select()
      .order('created_at', { ascending: true })
    
    return result.data || []
  }

  /**
   * 获取单个用户
   */
  async findOne(id: string) {
    const client = getSupabaseClient()
    
    const result = await client
      .from('users')
      .select()
      .eq('id', id)
      .limit(1)
    
    return result.data?.[0] || null
  }

  /**
   * 创建用户
   */
  async create(data: { name: string; avatar?: string; openid?: string }) {
    const client = getSupabaseClient()
    
    const result = await client
      .from('users')
      .insert({
        name: data.name,
        avatar: data.avatar || '',
        openid: data.openid || ''
      })
      .select()
    
    return result.data?.[0] || null
  }

  /**
   * 根据openid查找用户（用于微信登录）
   */
  async findByOpenid(openid: string) {
    const client = getSupabaseClient()
    
    const result = await client
      .from('users')
      .select()
      .eq('openid', openid)
      .limit(1)
    
    return result.data?.[0] || null
  }
}