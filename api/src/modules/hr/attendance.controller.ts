import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { ClockAttendanceDto } from './dto/attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller('hr/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('HR Attendance')
@ApiBearerAuth('bearer')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @Permissions('requests.view')
  clockIn(@Req() req: any, @Body() dto: ClockAttendanceDto) {
    return this.attendanceService.clockIn(req.user?.id, req, dto);
  }

  @Post('clock-out')
  @Permissions('requests.view')
  clockOut(@Req() req: any, @Body() dto: ClockAttendanceDto) {
    return this.attendanceService.clockOut(req.user?.id, req, dto);
  }

  @Get('me')
  @Permissions('requests.view')
  me(@Req() req: any, @Query() query: Record<string, any>) {
    return this.attendanceService.myAttendance(req.user?.id, query);
  }

  @Get('summary')
  @Permissions('users.manage')
  summary(@Query() query: Record<string, any>) {
    return this.attendanceService.summary(query);
  }
}
