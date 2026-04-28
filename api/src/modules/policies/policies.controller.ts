import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { ResolvePolicyDto } from './dto/resolve-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PoliciesService } from './policies.service';

@Controller('policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Policies')
@ApiBearerAuth('bearer')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Permissions('settings.manage', 'hr.manage', 'hr.view', 'attendance.manage', 'leave.manage')
  list(@Query() query: Record<string, any>) {
    return this.policiesService.list(query);
  }

  @Post()
  @Permissions('settings.manage')
  create(@Req() req: any, @Body() dto: CreatePolicyDto) {
    return this.policiesService.create(dto, req.user?.id);
  }

  @Post(':id')
  @Permissions('settings.manage')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.policiesService.update(id, dto, req.user?.id);
  }

  @Post('resolve')
  @Permissions('settings.manage')
  resolve(@Body() dto: ResolvePolicyDto) {
    return this.policiesService.resolve(dto);
  }

  @Delete(':id')
  @Permissions('settings.manage')
  delete(@Param('id') id: string) {
    return this.policiesService.delete(id);
  }
}
