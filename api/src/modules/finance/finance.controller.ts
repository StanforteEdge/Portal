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
import { UpsertFinanceAssetDto } from './dto/upsert-finance-asset.dto';
import { CreateFinanceAssetVerificationDto } from './dto/create-finance-asset-verification.dto';
import { CreateFinanceAssetDisposalDto } from './dto/create-finance-asset-disposal.dto';
import { UpsertFinanceChartAccountDto } from './dto/upsert-finance-chart-account.dto';
import { UpsertFinanceReportingPeriodDto } from './dto/upsert-finance-reporting-period.dto';
import { UpsertFinanceCustomerDto } from './dto/upsert-finance-customer.dto';
import { UpsertFinanceVendorDto } from './dto/upsert-finance-vendor.dto';
import { CreateFinanceSalesInvoiceDto } from './dto/create-finance-sales-invoice.dto';
import { CreateFinanceBillDto } from './dto/create-finance-bill.dto';
import { CreateFinanceReceiptDto } from './dto/create-finance-receipt.dto';
import { CreateFinanceVendorPaymentDto } from './dto/create-finance-vendor-payment.dto';
import { UpsertFinanceReportNoteDto } from './dto/upsert-finance-report-note.dto';
import { UpsertFinanceDonorDto } from './dto/upsert-finance-donor.dto';
import { UpsertFinanceFundDto } from './dto/upsert-finance-fund.dto';
import { UpsertFinanceGrantDto } from './dto/upsert-finance-grant.dto';
import { UpsertFinanceBudgetDto } from './dto/upsert-finance-budget.dto';
import { UpdatePaymentVoucherDto } from './dto/update-payment-voucher.dto';

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
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Get finance document/signatory settings' })
  settings() {
    return this.financeService.getSettings();
  }

  @Post('settings')
  @Permissions('finance.manage')
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

  @Get('chart-accounts')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance chart of accounts' })
  listChartAccounts(@Query() query: Record<string, any>) {
    return this.financeService.listChartAccounts(query);
  }

  @Get('chart-accounts/:id')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance chart account' })
  getChartAccount(@Param('id') id: string) {
    return this.financeService.getChartAccount(id);
  }

  @Post('chart-accounts')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance chart account' })
  createChartAccount(@Req() req: any, @Body() dto: UpsertFinanceChartAccountDto) {
    return this.financeService.createChartAccount(dto, req.user?.id);
  }

  @Post('chart-accounts/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance chart account' })
  updateChartAccount(@Param('id') id: string, @Body() dto: UpsertFinanceChartAccountDto) {
    return this.financeService.updateChartAccount(id, dto);
  }

  @Get('reporting-periods')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance reporting periods' })
  listReportingPeriods(@Query() query: Record<string, any>) {
    return this.financeService.listReportingPeriods(query);
  }

  @Post('reporting-periods')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create or upsert finance reporting period' })
  createReportingPeriod(@Req() req: any, @Body() dto: UpsertFinanceReportingPeriodDto) {
    return this.financeService.createReportingPeriod(dto, req.user?.id);
  }

  @Post('reporting-periods/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance reporting period' })
  updateReportingPeriod(@Param('id') id: string, @Body() dto: UpsertFinanceReportingPeriodDto) {
    return this.financeService.updateReportingPeriod(id, dto);
  }

  @Post('reporting-periods/:id/close')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Close finance reporting period' })
  closeReportingPeriod(@Param('id') id: string) {
    return this.financeService.closeReportingPeriod(id);
  }

  @Post('reporting-periods/:id/reopen')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Reopen finance reporting period' })
  reopenReportingPeriod(@Param('id') id: string) {
    return this.financeService.reopenReportingPeriod(id);
  }

  @Get('customers')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance customers' })
  listCustomers(@Query() query: Record<string, any>) {
    return this.financeService.listCustomers(query);
  }

  @Post('customers')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create finance customer' })
  createCustomer(@Req() req: any, @Body() dto: UpsertFinanceCustomerDto) {
    return this.financeService.createCustomer(dto, req.user?.id);
  }

  @Post('customers/:id')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Update finance customer' })
  updateCustomer(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceCustomerDto) {
    return this.financeService.updateCustomer(id, dto, req.user?.id);
  }

  @Get('customers/:id/statement')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get customer statement' })
  customerStatement(@Param('id') id: string, @Query() query: Record<string, any>) {
    return this.financeService.customerStatement(id, query);
  }

  @Get('vendors')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance vendors' })
  listVendors(@Query() query: Record<string, any>) {
    return this.financeService.listVendors(query);
  }

  @Post('vendors')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create finance vendor' })
  createVendor(@Req() req: any, @Body() dto: UpsertFinanceVendorDto) {
    return this.financeService.createVendor(dto, req.user?.id);
  }

  @Post('vendors/:id')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Update finance vendor' })
  updateVendor(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceVendorDto) {
    return this.financeService.updateVendor(id, dto, req.user?.id);
  }

  @Get('donors')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance donors' })
  listDonors(@Query() query: Record<string, any>) {
    return this.financeService.listDonors(query);
  }

  @Post('donors')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance donor' })
  createDonor(@Req() req: any, @Body() dto: UpsertFinanceDonorDto) {
    return this.financeService.createDonor(dto, req.user?.id);
  }

  @Post('donors/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance donor' })
  updateDonor(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceDonorDto) {
    return this.financeService.updateDonor(id, dto, req.user?.id);
  }

  @Get('funds')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance funds' })
  listFunds(@Query() query: Record<string, any>) {
    return this.financeService.listFunds(query);
  }

  @Post('funds')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance fund' })
  createFund(@Req() req: any, @Body() dto: UpsertFinanceFundDto) {
    return this.financeService.createFund(dto, req.user?.id);
  }

  @Post('funds/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance fund' })
  updateFund(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceFundDto) {
    return this.financeService.updateFund(id, dto, req.user?.id);
  }

  @Get('grants')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance grants' })
  listGrants(@Query() query: Record<string, any>) {
    return this.financeService.listGrants(query);
  }

  @Post('grants')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance grant' })
  createGrant(@Req() req: any, @Body() dto: UpsertFinanceGrantDto) {
    return this.financeService.createGrant(dto, req.user?.id);
  }

  @Post('grants/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance grant' })
  updateGrant(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceGrantDto) {
    return this.financeService.updateGrant(id, dto, req.user?.id);
  }

  @Get('budgets')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance budgets' })
  listBudgets(@Query() query: Record<string, any>) {
    return this.financeService.listBudgets(query);
  }

  @Get('budgets/:id')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance budget detail' })
  getBudget(@Param('id') id: string) {
    return this.financeService.getBudget(id);
  }

  @Get('budgets/:id/export')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Export finance budget' })
  exportBudget(@Param('id') id: string, @Query('format') format?: string) {
    return this.financeService.exportBudget(id, format);
  }

  @Post('budgets')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance budget' })
  createBudget(@Req() req: any, @Body() dto: UpsertFinanceBudgetDto) {
    return this.financeService.createBudget(dto, req.user?.id);
  }

  @Post('budgets/:id')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update finance budget' })
  updateBudget(@Param('id') id: string, @Req() req: any, @Body() dto: UpsertFinanceBudgetDto) {
    return this.financeService.updateBudget(id, dto, req.user?.id);
  }

  @Post('budgets/:id/approve')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Approve finance budget' })
  approveBudget(@Param('id') id: string, @Req() req: any) {
    return this.financeService.approveBudget(id, req.user?.id);
  }

  @Post('budgets/:id/reopen')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Reopen finance budget' })
  reopenBudget(@Param('id') id: string, @Req() req: any) {
    return this.financeService.reopenBudget(id, req.user?.id);
  }

  @Post('budgets/:id/recalculate')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Recalculate finance budget totals and variance' })
  recalculateBudget(@Param('id') id: string) {
    return this.financeService.recalculateBudget(id);
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

  @Get('sales-invoices')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance sales invoices' })
  listSalesInvoices(@Query() query: Record<string, any>) {
    return this.financeService.listSalesInvoices(query);
  }

  @Get('sales-invoices/:id')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance sales invoice detail' })
  getSalesInvoice(@Param('id') id: string) {
    return this.financeService.getSalesInvoice(id);
  }

  @Post('sales-invoices')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create finance sales invoice and post AR journal' })
  createSalesInvoice(@Req() req: any, @Body() dto: CreateFinanceSalesInvoiceDto) {
    return this.financeService.createSalesInvoice(dto, req.user?.id);
  }

  @Post('sales-invoices/:id/send')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Send finance sales invoice and post AR journal if needed' })
  sendSalesInvoice(@Req() req: any, @Param('id') id: string) {
    return this.financeService.sendSalesInvoice(id, req.user?.id);
  }

  @Post('sales-invoices/:id/remind')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Send finance sales invoice reminder email' })
  remindSalesInvoice(@Req() req: any, @Param('id') id: string) {
    return this.financeService.remindSalesInvoice(id, req.user?.id);
  }

  @Post('sales-invoices/:id/void')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Void finance sales invoice if unpaid' })
  voidSalesInvoice(@Req() req: any, @Param('id') id: string) {
    return this.financeService.voidSalesInvoice(id, req.user?.id);
  }

  @Post('sales-invoices/:id/pdf')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Generate finance sales invoice PDF' })
  generateSalesInvoicePdf(@Param('id') id: string) {
    return this.financeService.generateSalesInvoicePdf(id);
  }

  @Get('bills')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List finance vendor bills' })
  listBills(@Query() query: Record<string, any>) {
    return this.financeService.listBills(query);
  }

  @Get('bills/:id')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance vendor bill detail' })
  getBill(@Param('id') id: string) {
    return this.financeService.getBill(id);
  }

  @Post('bills')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create finance vendor bill and post AP journal' })
  createBill(@Req() req: any, @Body() dto: CreateFinanceBillDto) {
    return this.financeService.createBill(dto, req.user?.id);
  }

  @Post('receipts')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create customer receipt and settle receivables' })
  createReceipt(@Req() req: any, @Body() dto: CreateFinanceReceiptDto) {
    return this.financeService.createReceipt(dto, req.user?.id);
  }

  @Post('vendor-payments')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create vendor payment and settle payables' })
  createVendorPayment(@Req() req: any, @Body() dto: CreateFinanceVendorPaymentDto) {
    return this.financeService.createVendorPayment(dto, req.user?.id);
  }

  @Post('transfers')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Transfer funds between finance accounts (posts in/out ledger lines)' })
  @ApiBody({ type: CreateTransferDto })
  createTransfer(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.financeService.createTransfer(dto, req.user?.id);
  }

  @Get('assets')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List finance asset register' })
  listAssets(@Query() query: Record<string, any>) {
    return this.financeService.listAssets(query);
  }

  @Get('assets/disposals')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List asset disposal log' })
  listAssetDisposals(@Query() query: Record<string, any>) {
    return this.financeService.listAssetDisposals(query);
  }

  @Get('assets/:id')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'Get single asset register record' })
  getAsset(@Param('id') id: string) {
    return this.financeService.getAsset(id);
  }

  @Post('assets')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Create asset register record' })
  @ApiBody({ type: UpsertFinanceAssetDto })
  createAsset(@Req() req: any, @Body() dto: UpsertFinanceAssetDto) {
    return this.financeService.createAsset(dto, req.user?.id);
  }

  @Post('assets/:id')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Update asset register record' })
  @ApiBody({ type: UpsertFinanceAssetDto })
  updateAsset(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinanceAssetDto) {
    return this.financeService.updateAsset(id, dto, req.user?.id);
  }

  @Post('assets/:id/verify')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Verify asset condition/custody/location' })
  @ApiBody({ type: CreateFinanceAssetVerificationDto })
  verifyAsset(@Req() req: any, @Param('id') id: string, @Body() dto: CreateFinanceAssetVerificationDto) {
    return this.financeService.verifyAsset(id, dto, req.user?.id);
  }

  @Post('assets/:id/dispose')
  @Permissions('requests.manage')
  @ApiOperation({ summary: 'Dispose asset and add disposal log record' })
  @ApiBody({ type: CreateFinanceAssetDisposalDto })
  disposeAsset(@Req() req: any, @Param('id') id: string, @Body() dto: CreateFinanceAssetDisposalDto) {
    return this.financeService.disposeAsset(id, dto, req.user?.id);
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

  @Post('requests/:requestId/payment-vouchers/:voucherId')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Update payment voucher evidence and metadata' })
  updatePaymentVoucher(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Param('voucherId') voucherId: string,
    @Body() dto: UpdatePaymentVoucherDto
  ) {
    return this.financeService.updatePaymentVoucher(requestId, voucherId, dto, req.user?.id, req.user?.permissions ?? []);
  }

  @Get('payment-vouchers')
  @Permissions('requests.view')
  @ApiOperation({ summary: 'List payment vouchers/disbursements across requests' })
  listAllPaymentVouchers(@Query() query: Record<string, any>) {
    return this.financeService.listAllPaymentVouchers(query);
  }

  @Get('report-notes')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List saved finance report notes' })
  listReportNotes(@Query() query: Record<string, any>) {
    return this.financeService.listReportNotes(query);
  }

  @Post('report-notes')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create finance report note override' })
  upsertReportNote(@Req() req: any, @Body() dto: UpsertFinanceReportNoteDto) {
    return this.financeService.upsertReportNote(dto, req.user?.id);
  }

  @Get('reports/executive-summary')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance executive summary report' })
  executiveSummary(@Query() query: Record<string, any>) {
    return this.financeService.executiveSummary(query);
  }

  @Get('reports/income-summary')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance income summary report' })
  incomeSummary(@Query() query: Record<string, any>) {
    return this.financeService.incomeSummary(query);
  }

  @Get('reports/expense-summary')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance expense summary report' })
  expenseSummary(@Query() query: Record<string, any>) {
    return this.financeService.expenseSummary(query);
  }

  @Get('reports/profit-loss')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance profit and loss report' })
  profitLoss(@Query() query: Record<string, any>) {
    return this.financeService.profitLoss(query);
  }

  @Get('reports/balances')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance balances report' })
  balances(@Query() query: Record<string, any>) {
    return this.financeService.balances(query);
  }

  @Get('reports/receivables')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance receivables aging report' })
  receivables(@Query() query: Record<string, any>) {
    return this.financeService.receivables(query);
  }

  @Get('reports/payables')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get finance payables aging report' })
  payables(@Query() query: Record<string, any>) {
    return this.financeService.payables(query);
  }

  @Get('reports/budget-vs-actual')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get budget versus actual report' })
  budgetVsActual(@Query() query: Record<string, any>) {
    return this.financeService.budgetVsActual(query);
  }

  @Get('reports/grant-utilization')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get grant utilization report' })
  grantUtilization(@Query() query: Record<string, any>) {
    return this.financeService.grantUtilization(query);
  }

  @Post('accounting/backfill')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Backfill accounting journals from historical finance records' })
  backfillAccounting(@Req() req: any) {
    return this.financeService.backfillAccounting(req.user?.id);
  }
}
