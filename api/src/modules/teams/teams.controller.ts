import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Teams')
@ApiBearerAuth('bearer')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.teamsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.teamsService.get(id);
  }

  @Post()
  @Permissions('settings.manage')
  create(@Req() req: any, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(req.user?.id, dto);
  }

  @Post(':id')
  @Permissions('settings.manage')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, req.user?.id, dto);
  }

  @Post(':id/members')
  @Permissions('settings.manage')
  addMember(@Req() req: any, @Param('id') id: string, @Body() dto: AddGroupMemberDto) {
    return this.teamsService.addMember(id, req.user?.id, dto);
  }

  @Delete(':id/members/:userId')
  @Permissions('settings.manage')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(id, userId);
  }
}
