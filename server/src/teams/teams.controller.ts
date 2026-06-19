import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createTeam(@Body() body: { name: string; creatorId: string }) {
    console.log('[TeamsController] 创建小队:', body);
    return await this.teamsService.createTeam(body.name, body.creatorId);
  }

  @Get('user/:userId')
  async getUserTeams(@Param('userId') userId: string) {
    console.log('[TeamsController] 获取用户所属小队:', userId);
    return await this.teamsService.getUserTeams(userId);
  }

  @Get(':teamId/members')
  async getTeamMembers(@Param('teamId') teamId: string) {
    console.log('[TeamsController] 获取小队成员:', teamId);
    return await this.teamsService.getTeamMembers(teamId);
  }

  @Post(':teamId/members')
  @HttpCode(HttpStatus.OK)
  async addMember(@Param('teamId') teamId: string, @Body() body: { userId: string }) {
    console.log('[TeamsController] 添加成员:', { teamId, userId: body.userId });
    return await this.teamsService.addMember(teamId, body.userId);
  }

  @Delete(':teamId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMember(@Param('teamId') teamId: string, @Param('userId') userId: string) {
    console.log('[TeamsController] 移除成员:', { teamId, userId });
    return await this.teamsService.removeMember(teamId, userId);
  }

  @Get(':teamId')
  async getTeamDetail(@Param('teamId') teamId: string) {
    console.log('[TeamsController] 获取小队详情:', teamId);
    return await this.teamsService.getTeamDetail(teamId);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  async deleteTeam(@Param('teamId') teamId: string, @Body() body: { userId: string }) {
    console.log('[TeamsController] 删除小队:', { teamId, userId: body.userId });
    return await this.teamsService.deleteTeam(teamId, body.userId);
  }
}