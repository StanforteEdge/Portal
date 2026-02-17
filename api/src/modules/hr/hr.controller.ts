import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { SetPrimaryOrganizationDto } from './dto/set-primary-organization.dto';
import { HrService } from './hr.service';

@Controller('hr')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('HR')
@ApiBearerAuth('bearer')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('summary')
  @Permissions('users.manage')
  summary() {
    return this.hrService.summary();
  }

  @Get('employees')
  @Permissions('users.manage')
  list(@Query() query: Record<string, any>) {
    return this.hrService.listEmployees(query);
  }

  @Get('employees/:id')
  @Permissions('users.manage')
  get(@Param('id') id: string) {
    return this.hrService.getEmployee(id);
  }

  @Post('employees/:id/primary-organization')
  @Permissions('users.manage')
  setPrimaryOrganization(@Param('id') id: string, @Body() dto: SetPrimaryOrganizationDto) {
    return this.hrService.setPrimaryOrganization(id, dto);
  }
}
