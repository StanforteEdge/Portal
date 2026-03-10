import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { DisburseRequestDto } from './dto/disburse-request.dto';
import { FinanceService } from './finance.service';
import { UpdateFinanceSettingsDto } from './dto/update-finance-settings.dto';
import { UpsertFinanceAccountDto } from './dto/upsert-finance-account.dto';
import { CreateFinanceIncomeDto } from './dto/create-finance-income.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Finance')
@ApiBearerAuth('bearer')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'Finance dashboard summary for request pipeline' })
  summary(@Query() query: Record<string, any>) {
    return this.financeService.summary(query);
  }

  @Get('settings')
  @Permissions('settings.manage')
  @ApiOperation({ summary: 'Get finance document/signatory settings' })
  settings() {
    return this.financeService.getSettings();
  }

  @Post('settings')
  @Permissions('settings.manage')
  @ApiOperation({ summary: 'Update finance document/signatory settings' })
  @ApiBody({
    type: UpdateFinanceSettingsDto,
    examples: {
      default: {
        value: {
          prepared_by: { name: 'Ayo Adebayo', title: 'Accountant' },
          reviewed_by: { name: 'Tolu Femi', title: 'Finance Manager / COO' },
          approved_by: { name: 'Bola Ade', title: 'Executive Director' }
        }
      }
    }
  })
  updateSettings(@Req() req: any, @Body() dto: UpdateFinanceSettingsDto) {
    return this.financeService.updateSettings(dto, req.user?.id);
  }

  @Get('requests')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List finance-facing requests (cleared to completed)' })
  listRequests(@Query() query: Record<string, any>) {
    return this.financeService.listRequests(query);
  }

  @Get('accounts')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List finance accounts (bank/cash/wallet)' })
  listAccounts(@Query() query: Record<string, any>) {
    return this.financeService.listAccounts(query);
  }

  @Get('accounts/:id')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'Get single finance account details' })
  getAccount(@Param('id') id: string) {
    return this.financeService.getAccount(id);
  }

  @Post('accounts')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create finance account' })
  @ApiBody({ type: UpsertFinanceAccountDto })
  createAccount(@Req() req: any, @Body() dto: UpsertFinanceAccountDto) {
    return this.financeService.createAccount(dto, req.user?.id);
  }

  @Post('accounts/:id')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Update finance account' })
  @ApiBody({ type: UpsertFinanceAccountDto })
  updateAccount(@Param('id') id: string, @Body() dto: UpsertFinanceAccountDto) {
    return this.financeService.updateAccount(id, dto);
  }

  @Get('ledger')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List ledger entries (in/out)' })
  listLedger(@Query() query: Record<string, any>) {
    return this.financeService.listLedger(query);
  }

  @Post('income')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create income entry and post to ledger' })
  @ApiBody({ type: CreateFinanceIncomeDto })
  createIncome(@Req() req: any, @Body() dto: CreateFinanceIncomeDto) {
    return this.financeService.createIncome(dto, req.user?.id);
  }

  @Get('income')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List income entries' })
  listIncome(@Query() query: Record<string, any>) {
    return this.financeService.listIncome(query);
  }

  @Post('transfers')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Transfer funds between finance accounts (posts in/out ledger lines)' })
  @ApiBody({ type: CreateTransferDto })
  createTransfer(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.financeService.createTransfer(dto, req.user?.id);
  }

  @Post('requests/:id/disburse')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Mark cleared request as disbursed' })
  @ApiBody({
    type: DisburseRequestDto,
    examples: {
      default: {
        value: { note: 'Transferred to requester account. Txn ref: STN240217001' }
      }
    }
  })
  disburse(@Req() req: any, @Param('id') id: string, @Body() dto: DisburseRequestDto) {
    return this.financeService.disburseRequest(id, dto, req.user?.id);
  }

  @Get('requests/:id/payment-vouchers')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List payment vouchers/disbursements for a request' })
  listPaymentVouchers(@Param('id') id: string) {
    return this.financeService.listPaymentVouchers(id);
  }

  @Get('payment-vouchers')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List payment vouchers/disbursements across requests' })
  listAllPaymentVouchers(@Query() query: Record<string, any>) {
    return this.financeService.listAllPaymentVouchers(query);
  }
}
