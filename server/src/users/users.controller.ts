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
}