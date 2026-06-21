import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取用户列表
   */
  @Get()
  async findAll() {
    const users = await this.usersService.findAll()
    return {
      code: 200,
      msg: 'success',
      data: users
    }
  }

  /**
   * 获取单个用户信息
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id)
    return {
      code: 200,
      msg: 'success',
      data: user
    }
  }

  /**
   * 创建用户（登录时自动创建）
   */
  @Post()
  async create(@Body() body: { name: string; avatar?: string; openid?: string }) {
    const user = await this.usersService.create(body)
    return {
      code: 200,
      msg: 'success',
      data: user
    }
  }

  /**
   * 审核测试登录：无需微信授权，返回预设测试账号
   * 用于微信小程序提审时审核人员登录测试
   */
  @Post('test-login')
  async testLogin() {
    try {
      const user = await this.usersService.testLogin()
      return {
        code: 200,
        msg: 'success',
        data: user
      }
    } catch (err: any) {
      return {
        code: 500,
        msg: err.message || '测试登录失败',
        data: null
      }
    }
  }

  /**
   * 微信登录：用 code 换取 openid，返回用户信息
   */
  @Post('wx-login')
  async wxLogin(@Body() body: { code: string }) {
    try {
      const user = await this.usersService.wxLogin(body.code)
      return {
        code: 200,
        msg: 'success',
        data: user
      }
    } catch (err: any) {
      return {
        code: 500,
        msg: err.message || '微信登录失败',
        data: null
      }
    }
  }
}