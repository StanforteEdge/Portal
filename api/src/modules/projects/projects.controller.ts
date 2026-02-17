import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Projects')
@ApiBearerAuth('bearer')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Permissions('requests.view')
  list(@Query() query: Record<string, any>) {
    return this.projectsService.list(query);
  }

  @Get(':id')
  @Permissions('requests.view')
  get(@Param('id') id: string) {
    return this.projectsService.get(id);
  }

  @Post()
  @Permissions('requests.manage')
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user?.id, dto);
  }

  @Post(':id')
  @Permissions('requests.manage')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, req.user?.id, dto);
  }

  @Post(':id/members')
  @Permissions('requests.manage')
  addMember(@Req() req: any, @Param('id') id: string, @Body() dto: AddProjectMemberDto) {
    return this.projectsService.addMember(id, req.user?.id, dto);
  }

  @Delete(':id/members/:userId')
  @Permissions('requests.manage')
  removeMember(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, req.user?.id, userId);
  }
}
