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
  async create(data: { id?: string; name: string; avatar?: string; openid?: string }) {
    const client = getSupabaseClient()

    const insertData: Record<string, any> = {
      name: data.name,
      avatar: data.avatar || '',
      openid: data.openid || ''
    }
    if (data.id) {
      insertData.id = data.id
    }

    const result = await client
      .from('users')
      .insert(insertData)
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
   * 审核测试登录：返回预设测试用户，无需微信授权
   * 用于微信小程序提审时审核人员登录测试
   */
  async testLogin() {
    const TEST_USER_ID = 'user-001'

    // 先查找测试用户是否存在
    let user = await this.findOne(TEST_USER_ID)

    // 如果不存在，自动创建
    if (!user) {
      user = await this.create({
        id: TEST_USER_ID,
        name: '张三（测试账号）',
        openid: 'test-openid-review'
      })
    }

    return user
  }

  /**
   * 微信登录：用 code 换取 openid
   */
  async wxLogin(code: string) {
    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_APP_SECRET

    if (!appid || !secret) {
      throw new Error('服务器未配置微信参数，请联系管理员')
    }

    // 调用微信 code2Session 接口
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

    let data: any
    try {
      const res = await fetch(url)
      data = await res.json()
    } catch (e) {
      throw new Error('调用微信接口失败，请检查网络')
    }

    if (data.errcode) {
      this.logger.error(`微信登录失败: errcode=${data.errcode} errmsg=${data.errmsg}`)
      // 给出更友好的错误提示
      if (data.errcode === 40029) {
        throw new Error('登录凭证无效，请重新点击登录')
      } else if (data.errcode === 45011) {
        throw new Error('登录太频繁，请稍后再试')
      } else if (data.errcode === 40163) {
        throw new Error('登录凭证已使用，请重新点击登录')
      } else if (data.errcode === -1) {
        throw new Error('微信服务繁忙，请稍后再试')
      } else {
        throw new Error(`微信登录失败(${data.errcode})，请重试`)
      }
    }

    const openid = data.openid
    if (!openid) {
      throw new Error('未获取到 openid，请重试')
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