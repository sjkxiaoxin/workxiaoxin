import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

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

  /**
   * 更新用户的 openid
   */
  async updateOpenid(userId: string, openid: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('users')
      .update({ openid })
      .eq('id', userId)
      .select()

    if (error) {
      this.logger.error(`更新 openid 失败: ${error.message}`)
      return false
    }

    return true
  }

  /**
   * 微信登录：用 code 换取 openid
   */
  async wxLogin(code: string) {
    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_APP_SECRET

    if (!appid || !secret) {
      throw new Error('WECHAT_APPID 或 WECHAT_APP_SECRET 未配置')
    }

    // 调用微信 code2Session 接口
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

    const res = await fetch(url)
    const data = await res.json()

    if (data.errcode) {
      this.logger.error(`微信登录失败: ${data.errcode} ${data.errmsg}`)
      throw new Error(`微信登录失败: ${data.errmsg}`)
    }

    const openid = data.openid
    if (!openid) {
      throw new Error('未获取到 openid')
    }

    // 查找已有用户
    let user = await this.findByOpenid(openid)

    // 如果不存在，自动创建
    if (!user) {
      user = await this.create({
        name: '微信用户',
        openid,
      })
    }

    return user
  }
}