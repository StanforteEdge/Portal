import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { SetPrimaryOrganizationDto } from './dto/set-primary-organization.dto';
import { HrService } from './hr.service';
import { EmployeeActionDto, UpsertEmployeeDto } from './dto/upsert-employee.dto';
import {
  AssignEmployeeOrganizationDto,
  AssignEmployeeTeamDto,
  AssignOnboardingFormDto,
  UpdateOnboardingFormAssignmentDto
} from './dto/manage-employee-links.dto';

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

  @Post('employees')
  @Permissions('users.manage')
  create(@Body() dto: UpsertEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get('employees/:id')
  @Permissions('users.manage')
  get(@Param('id') id: string) {
    return this.hrService.getEmployee(id);
  }

  @Patch('employees/:id')
  @Permissions('users.manage')
  update(@Param('id') id: string, @Body() dto: UpsertEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Patch('employees/:id/action')
  @Permissions('users.manage')
  runAction(@Param('id') id: string, @Body() dto: EmployeeActionDto) {
    return this.hrService.runEmployeeAction(id, dto);
  }

  @Post('employees/:id/organizations')
  @Permissions('users.manage')
  addOrganization(@Param('id') id: string, @Body() dto: AssignEmployeeOrganizationDto) {
    return this.hrService.addOrganizationMembership(id, dto);
  }

  @Delete('employees/:id/organizations/:organizationId')
  @Permissions('users.manage')
  removeOrganization(@Param('id') id: string, @Param('organizationId') organizationId: string) {
    return this.hrService.removeOrganizationMembership(id, organizationId);
  }

  @Post('employees/:id/teams')
  @Permissions('users.manage')
  addTeam(@Param('id') id: string, @Body() dto: AssignEmployeeTeamDto) {
    return this.hrService.addTeamMembership(id, dto);
  }

  @Delete('employees/:id/teams/:teamId')
  @Permissions('users.manage')
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.hrService.removeTeamMembership(id, teamId);
  }

  @Post('employees/:id/primary-organization')
  @Permissions('users.manage')
  setPrimaryOrganization(@Param('id') id: string, @Body() dto: SetPrimaryOrganizationDto) {
    return this.hrService.setPrimaryOrganization(id, dto);
  }

  @Get('onboarding/forms')
  @Permissions('users.manage')
  listOnboardingFormAssignments(@Query() query: Record<string, any>) {
    return this.hrService.listOnboardingFormAssignments(query);
  }

  @Post('onboarding/forms/assign')
  @Permissions('users.manage')
  assignOnboardingForm(@Body() dto: AssignOnboardingFormDto) {
    return this.hrService.assignOnboardingForm(dto);
  }

  @Delete('onboarding/forms/assignments/:id')
  @Permissions('users.manage')
  deleteOnboardingFormAssignment(@Param('id') id: string) {
    return this.hrService.deleteOnboardingFormAssignment(id);
  }

  @Patch('onboarding/forms/assignments/:id')
  @Permissions('users.manage')
  updateOnboardingFormAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingFormAssignmentDto
  ) {
    return this.hrService.updateOnboardingFormAssignment(id, dto);
  }
}
