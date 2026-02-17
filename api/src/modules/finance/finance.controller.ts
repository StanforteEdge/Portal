import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { DisburseRequestDto } from './dto/disburse-request.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Finance')
@ApiBearerAuth('bearer')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @Permissions('requests.view')
  summary(@Query() query: Record<string, any>) {
    return this.financeService.summary(query);
  }

  @Get('requests')
  @Permissions('requests.view')
  listRequests(@Query() query: Record<string, any>) {
    return this.financeService.listRequests(query);
  }

  @Post('requests/:id/disburse')
  @Permissions('requests.manage')
  disburse(@Param('id') id: string, @Body() dto: DisburseRequestDto) {
    return this.financeService.disburseRequest(id, dto);
  }
}
