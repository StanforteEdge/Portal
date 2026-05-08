# Payroll HR/Finance Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split payroll so HR managers can initiate and manage payroll runs (and worker profiles) while Finance managers retain exclusive control over approval, payment, and financial configuration.

**Architecture:** Re-gate the existing `/payroll` API controller from `finance.manage`/`finance.view` to three dedicated permissions (`payroll.manage`, `payroll.approve`, and combined reads). Add HR-facing pages under `/hr/payroll` for run initiation and worker management, and Finance-facing pages under `/finance/payroll` for approval and disbursement. No new API models — only permission changes and new frontend pages.

**Tech Stack:** NestJS (API), React + TypeScript + TailwindCSS (PWA), existing shared UI components (`SectionCard`, `Table`, `StatCard`, `Button`, `Chip`, `PageHeader`, `AppShell`), `useCachedQuery` for data fetching, `httpRequest` for API calls.

---

## File Map

**Modify:**
- `api/src/modules/payroll/payroll.controller.ts` — re-gate permissions
- `api/scripts/seed-rbac.js` — add `payroll.manage` permission + assign to `hr_manager`
- `apps/pwa/src/shared/api/payroll-api.ts` — extend with run/worker/approval functions
- `apps/pwa/src/shared/navigation.ts` — add HR Payroll and Finance Payroll nav items
- `apps/pwa/src/App.tsx` — register new routes

**Create:**
- `apps/pwa/src/pages/hr/payroll/HrPayrollPage.tsx` — HR payroll run list + stat cards
- `apps/pwa/src/pages/hr/payroll/HrPayrollRunFormPage.tsx` — create/edit payroll run
- `apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx` — run detail + generate + submit
- `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx` — employee payroll profiles
- `apps/pwa/src/pages/finance/payroll/FinancePayrollPage.tsx` — Finance approval queue
- `apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx` — approve/reject/pay

---

## Task 1: Re-gate API permissions

**Files:**
- Modify: `api/src/modules/payroll/payroll.controller.ts`

Permission mapping (the guard uses `required.some()` — so listing multiple permissions is OR logic):

| Route group | Old | New |
|---|---|---|
| Read runs, workers, reports, payslips | `finance.view` | `payroll.manage`, `payroll.approve` |
| Create/update/delete runs, generate, submit | `finance.manage` | `payroll.manage` |
| Review, approve, reject, pay, close, reopen runs | `finance.manage` | `payroll.approve` |
| Create/update/delete workers, loans | `finance.manage` | `payroll.manage` |
| Settings, tax tables, components (finance config) | `finance.manage` / `finance.view` | unchanged |
| My payslips / timesheets (staff self-service) | no guard | unchanged |

- [ ] **Step 1: Apply permission changes to `payroll.controller.ts`**

Replace the entire file at `api/src/modules/payroll/payroll.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { PayPayrollRunDto } from './dto/pay-payroll-run.dto';
import { GeneratePayrollPayslipTemplateDto, GeneratePayrollSummaryTemplateDto } from './dto/generate-payroll-template.dto';
import { PayrollImportDto } from './dto/payroll-import.dto';
import { UpdatePayrollRunAllocationsDto } from './dto/update-payroll-run-allocations.dto';
import { UpdatePayrollRunItemDto } from './dto/update-payroll-run-item.dto';
import { UpdatePayrollRunTimesheetAllocationsDto } from './dto/update-payroll-run-timesheet-allocations.dto';
import { UpsertPayrollLoanDto } from './dto/upsert-payroll-loan.dto';
import { UpsertProjectTimesheetEntryDto } from './dto/upsert-project-timesheet-entry.dto';
import { UpsertPayrollTaxTableDto } from './dto/upsert-payroll-tax-table.dto';
import { ReviewPayrollRunDto } from './dto/review-payroll-run.dto';
import { UpsertPayrollComponentDto } from './dto/upsert-payroll-component.dto';
import { UpsertPayrollSettingDto } from './dto/upsert-payroll-setting.dto';
import { UpsertPayrollWorkerDto } from './dto/upsert-payroll-worker.dto';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Payroll')
@ApiBearerAuth('bearer')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ── Staff self-service (no permission guard needed) ──────────────────────

  @Get('my/payslips')
  myPayslips(@Req() req: any, @Query() query: Record<string, any>) {
    return this.payrollService.listMyPayslips(req.user?.id, query);
  }

  @Get('my/payslips/:runId/:itemId')
  myPayslipDetails(@Req() req: any, @Param('runId') runId: string, @Param('itemId') itemId: string) {
    return this.payrollService.getMyPayslipDetails(req.user?.id, runId, itemId);
  }

  @Post('my/payslips/:runId/:itemId')
  downloadMyPayslip(@Req() req: any, @Param('runId') runId: string, @Param('itemId') itemId: string) {
    return this.payrollService.generateMyPayslip(req.user?.id, runId, itemId);
  }

  @Get('my/timesheets')
  myTimesheets(@Req() req: any, @Query() query: Record<string, any>) {
    return this.payrollService.listMyProjectTimesheets(req.user?.id, query);
  }

  @Post('my/timesheets')
  createMyTimesheet(@Req() req: any, @Body() dto: UpsertProjectTimesheetEntryDto) {
    return this.payrollService.createMyProjectTimesheet(req.user?.id, dto);
  }

  @Post('my/timesheets/:id')
  updateMyTimesheet(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertProjectTimesheetEntryDto) {
    return this.payrollService.updateMyProjectTimesheet(req.user?.id, id, dto);
  }

  @Post('my/timesheets/:id/submit')
  submitMyTimesheet(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.submitMyProjectTimesheet(req.user?.id, id);
  }

  @Get('notification-preferences')
  notificationPreferences(@Req() req: any) {
    return this.payrollService.getNotificationPreferences(req.user?.id);
  }

  @Post('notification-preferences')
  upsertNotificationPreferences(@Req() req: any, @Body() body: Record<string, any>) {
    return this.payrollService.upsertNotificationPreferences(req.user?.id, body);
  }

  // ── Shared reads — HR or Finance ─────────────────────────────────────────

  @Get('summary')
  @Permissions('payroll.manage', 'payroll.approve')
  summary() {
    return this.payrollService.summary();
  }

  @Get('inbox')
  @Permissions('payroll.manage', 'payroll.approve')
  inbox(@Req() req: any) {
    return this.payrollService.getInbox(req.user?.id, req.user?.permissions ?? []);
  }

  @Get('runs')
  @Permissions('payroll.manage', 'payroll.approve')
  listRuns(@Query() query: Record<string, any>) {
    return this.payrollService.listRuns(query);
  }

  @Get('runs/:id')
  @Permissions('payroll.manage', 'payroll.approve')
  getRun(@Param('id') id: string) {
    return this.payrollService.getRun(id);
  }

  @Post('runs/:id/payslips/:itemId')
  @Permissions('payroll.manage', 'payroll.approve')
  generateRunItemPayslip(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.payrollService.generateRunItemPayslip(id, itemId);
  }

  @Post('runs/:id/payslips-package')
  @Permissions('payroll.manage', 'payroll.approve')
  generateRunPayslipsPackage(@Param('id') id: string) {
    return this.payrollService.generateRunPayslipsPackage(id);
  }

  @Post('runs/:id/distribute-payslips')
  @Permissions('payroll.manage', 'payroll.approve')
  distributeRunPayslips(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.distributeRunPayslips(id, req.user?.id);
  }

  @Post('runs/:id/bank-schedule')
  @Permissions('payroll.manage', 'payroll.approve')
  generateBankSchedule(@Param('id') id: string) {
    return this.payrollService.generateBankSchedule(id);
  }

  @Get('workers')
  @Permissions('payroll.manage', 'payroll.approve')
  listWorkers(@Query() query: Record<string, any>) {
    return this.payrollService.listWorkers(query);
  }

  @Get('workers/:id')
  @Permissions('payroll.manage', 'payroll.approve')
  getWorker(@Param('id') id: string) {
    return this.payrollService.getWorker(id);
  }

  @Get('loans')
  @Permissions('payroll.manage', 'payroll.approve')
  listLoans(@Query() query: Record<string, any>) {
    return this.payrollService.listLoans(query);
  }

  @Get('timesheets')
  @Permissions('payroll.manage', 'payroll.approve')
  listTimesheets(@Query() query: Record<string, any>) {
    return this.payrollService.listProjectTimesheets(query);
  }

  @Get('reports/overview')
  @Permissions('payroll.manage', 'payroll.approve')
  reportsOverview(@Query() query: Record<string, any>) {
    return this.payrollService.reportsOverview(query);
  }

  @Get('import/jobs')
  @Permissions('payroll.manage', 'payroll.approve')
  listImportJobs(@Query() query: Record<string, any>) {
    return this.payrollService.listImportJobs(query);
  }

  @Get('import/jobs/:id')
  @Permissions('payroll.manage', 'payroll.approve')
  getImportJob(@Param('id') id: string) {
    return this.payrollService.getImportJob(id);
  }

  @Post('templates/payslip')
  @Permissions('payroll.manage', 'payroll.approve')
  generatePayslipTemplate(@Body() dto: GeneratePayrollPayslipTemplateDto) {
    return this.payrollService.generatePayslipTemplate(dto);
  }

  @Post('templates/summary')
  @Permissions('payroll.manage', 'payroll.approve')
  generateSummaryTemplate(@Body() dto: GeneratePayrollSummaryTemplateDto) {
    return this.payrollService.generateSummaryTemplate(dto);
  }

  // ── HR initiation — payroll.manage only ──────────────────────────────────

  @Post('runs')
  @Permissions('payroll.manage')
  createRun(@Req() req: any, @Body() dto: CreatePayrollRunDto) {
    return this.payrollService.createRun(dto, req.user?.id);
  }

  @Post('runs/:id')
  @Permissions('payroll.manage')
  updateRun(@Req() req: any, @Param('id') id: string, @Body() dto: CreatePayrollRunDto) {
    return this.payrollService.updateRun(id, dto, req.user?.id);
  }

  @Delete('runs/:id')
  @Permissions('payroll.manage')
  deleteRun(@Param('id') id: string) {
    return this.payrollService.deleteRun(id);
  }

  @Post('runs/:id/generate')
  @Permissions('payroll.manage')
  generateRun(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.generateRun(id, req.user?.id);
  }

  @Post('runs/:id/submit')
  @Permissions('payroll.manage')
  submitRun(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.submitRun(id, req.user?.id);
  }

  @Post('runs/:id/items/:itemId')
  @Permissions('payroll.manage')
  updateRunItem(@Req() req: any, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdatePayrollRunItemDto) {
    return this.payrollService.updateRunItem(id, itemId, dto, req.user?.id);
  }

  @Post('runs/:id/items/:itemId/allocations')
  @Permissions('payroll.manage')
  updateRunItemAllocations(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePayrollRunAllocationsDto
  ) {
    return this.payrollService.updateRunItemAllocations(id, itemId, dto, req.user?.id);
  }

  @Post('runs/:id/workers/:workerId/timesheet-allocations')
  @Permissions('payroll.manage')
  updateRunWorkerTimesheetAllocations(
    @Req() req: any,
    @Param('id') id: string,
    @Param('workerId') workerId: string,
    @Body() dto: UpdatePayrollRunTimesheetAllocationsDto
  ) {
    return this.payrollService.updateRunWorkerTimesheetAllocations(id, workerId, dto, req.user?.id);
  }

  @Post('workers')
  @Permissions('payroll.manage')
  createWorker(@Req() req: any, @Body() dto: UpsertPayrollWorkerDto) {
    return this.payrollService.createWorker(dto, req.user?.id);
  }

  @Post('workers/:id')
  @Permissions('payroll.manage')
  updateWorker(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertPayrollWorkerDto) {
    return this.payrollService.updateWorker(id, dto, req.user?.id);
  }

  @Delete('workers/:id')
  @Permissions('payroll.manage')
  deleteWorker(@Param('id') id: string) {
    return this.payrollService.deleteWorker(id);
  }

  @Post('loans')
  @Permissions('payroll.manage')
  createLoan(@Body() dto: UpsertPayrollLoanDto) {
    return this.payrollService.createLoan(dto);
  }

  @Post('loans/:id')
  @Permissions('payroll.manage')
  updateLoan(@Param('id') id: string, @Body() dto: UpsertPayrollLoanDto) {
    return this.payrollService.updateLoan(id, dto);
  }

  @Post('timesheets')
  @Permissions('payroll.manage')
  createTimesheet(@Req() req: any, @Body() dto: UpsertProjectTimesheetEntryDto) {
    return this.payrollService.createProjectTimesheet(dto, req.user?.id);
  }

  @Post('timesheets/:id')
  @Permissions('payroll.manage')
  updateTimesheet(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertProjectTimesheetEntryDto) {
    return this.payrollService.updateProjectTimesheet(id, dto, req.user?.id);
  }

  @Post('timesheets/:id/submit')
  @Permissions('payroll.manage')
  submitTimesheet(@Param('id') id: string) {
    return this.payrollService.submitProjectTimesheet(id);
  }

  @Post('timesheets/:id/approve')
  @Permissions('payroll.manage')
  approveTimesheet(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.approveProjectTimesheet(id, req.user?.id);
  }

  @Post('timesheets/:id/reject')
  @Permissions('payroll.manage')
  rejectTimesheet(@Param('id') id: string) {
    return this.payrollService.rejectProjectTimesheet(id);
  }

  @Post('import/validate')
  @Permissions('payroll.manage')
  validateImport(@Body() dto: PayrollImportDto) {
    return this.payrollService.validateImport(dto);
  }

  @Post('import/commit')
  @Permissions('payroll.manage')
  commitImport(@Req() req: any, @Body() dto: PayrollImportDto) {
    return this.payrollService.commitImport(dto, req.user?.id);
  }

  @Post('import/jobs/:id/retry-failed')
  @Permissions('payroll.manage')
  retryFailedImport(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.retryFailedImport(id, req.user?.id);
  }

  // ── Finance approval — payroll.approve only ───────────────────────────────

  @Post('runs/:id/review')
  @Permissions('payroll.approve')
  reviewRun(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewPayrollRunDto) {
    return this.payrollService.reviewRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/approve')
  @Permissions('payroll.approve')
  approveRun(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewPayrollRunDto) {
    return this.payrollService.approveRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/reject')
  @Permissions('payroll.approve')
  rejectRun(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewPayrollRunDto) {
    return this.payrollService.rejectRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/reopen')
  @Permissions('payroll.approve')
  reopenRun(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewPayrollRunDto) {
    return this.payrollService.reopenRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/close')
  @Permissions('payroll.approve')
  closeRun(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewPayrollRunDto) {
    return this.payrollService.closeRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/pay')
  @Permissions('payroll.approve')
  payRun(@Req() req: any, @Param('id') id: string, @Body() dto: PayPayrollRunDto) {
    return this.payrollService.payRun(id, dto, req.user?.id);
  }

  // ── Finance config — finance.manage only (unchanged) ─────────────────────

  @Get('settings')
  @Permissions('finance.manage')
  settings(@Query() query: Record<string, any>) {
    return this.payrollService.getSettings(query);
  }

  @Post('settings')
  @Permissions('finance.manage')
  upsertSettings(@Req() req: any, @Body() dto: UpsertPayrollSettingDto) {
    return this.payrollService.upsertSettings(dto, req.user?.id);
  }

  @Get('tax-tables')
  @Permissions('finance.manage')
  listTaxTables(@Query() query: Record<string, any>) {
    return this.payrollService.listTaxTables(query);
  }

  @Post('tax-tables')
  @Permissions('finance.manage')
  createTaxTable(@Body() dto: UpsertPayrollTaxTableDto) {
    return this.payrollService.createTaxTable(dto);
  }

  @Post('tax-tables/:id')
  @Permissions('finance.manage')
  updateTaxTable(@Param('id') id: string, @Body() dto: UpsertPayrollTaxTableDto) {
    return this.payrollService.updateTaxTable(id, dto);
  }

  @Get('components')
  @Permissions('finance.manage')
  listComponents(@Query() query: Record<string, any>) {
    return this.payrollService.listComponents(query);
  }

  @Post('components')
  @Permissions('finance.manage')
  createComponent(@Body() dto: UpsertPayrollComponentDto) {
    return this.payrollService.createComponent(dto);
  }

  @Post('components/:id')
  @Permissions('finance.manage')
  updateComponent(@Param('id') id: string, @Body() dto: UpsertPayrollComponentDto) {
    return this.payrollService.updateComponent(id, dto);
  }

  @Delete('components/:id')
  @Permissions('finance.manage')
  deleteComponent(@Param('id') id: string) {
    return this.payrollService.deleteComponent(id);
  }
}
```

- [ ] **Step 2: Verify the API compiles**

```bash
cd api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/payroll/payroll.controller.ts
git commit -m "feat(payroll): re-gate permissions — payroll.manage for HR, payroll.approve for Finance"
```

---

## Task 2: Add `payroll.manage` to seed + assign to `hr_manager`

**Files:**
- Modify: `api/scripts/seed-rbac.js` lines ~65 (permissions array) and ~89 (rolePermissionMap)

- [ ] **Step 1: Add `payroll.manage` to the permissions array**

In `api/scripts/seed-rbac.js`, find the line:
```js
  { name: 'Approve Payroll', slug: 'payroll.approve', module: 'payroll', description: 'Can approve payroll workflow steps' },
```

Add the new permission directly before it:
```js
  { name: 'Manage Payroll', slug: 'payroll.manage', module: 'payroll', description: 'Can create and submit payroll runs and manage worker profiles' },
  { name: 'Approve Payroll', slug: 'payroll.approve', module: 'payroll', description: 'Can approve payroll workflow steps' },
```

- [ ] **Step 2: Add `payroll.manage` to `hr_manager` in `rolePermissionMap`**

Find the `hr_manager` entry:
```js
hr_manager: ['hr.view', 'hr.manage', 'hr.employees', ...],
```

Add `'payroll.manage'` to the end of the array:
```js
hr_manager: ['hr.view', 'hr.manage', 'hr.employees', 'hr.approve', 'attendance.clock', 'attendance.view_self', 'attendance.view_team', 'attendance.manage', 'attendance.approve', 'attendance.correct', 'leave.view', 'leave.manage', 'leave.approve', 'work.view', 'work.manage', 'work.approve', 'organizations.view', 'groups.view', 'projects.view', 'requests.view', 'requests.approve', 'payroll.manage'],
```

- [ ] **Step 3: Run the seed**

```bash
cd api && node scripts/seed-rbac.js
```

Expected output:
```
RBAC seed complete
- roles: 14
- permissions: 45
- mapped roles: 14
```

- [ ] **Step 4: Commit**

```bash
git add api/scripts/seed-rbac.js
git commit -m "feat(payroll): add payroll.manage permission and assign to hr_manager"
```

---

## Task 3: Extend `payroll-api.ts` with run/worker/approval functions

**Files:**
- Modify: `apps/pwa/src/shared/api/payroll-api.ts`

- [ ] **Step 1: Append the new types and functions**

Append to the end of `apps/pwa/src/shared/api/payroll-api.ts`:

```typescript
// ── Payroll run types ────────────────────────────────────────────────────

export type PayrollRunStatus =
  | "draft"
  | "generated"
  | "submitted"
  | "reviewed"
  | "approved"
  | "paid"
  | "closed"
  | "rejected";

export type PayrollRunSummary = {
  id: string;
  name: string;
  period_month: number;
  period_year: number;
  status: PayrollRunStatus;
  total_gross?: number | null;
  total_net?: number | null;
  worker_count?: number | null;
  currency: string;
  created_at: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
};

export type PayrollRunItem = {
  id: string;
  worker_id: string;
  worker_name?: string | null;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  payment_status?: string | null;
};

export type PayrollRunDetail = PayrollRunSummary & {
  notes?: string | null;
  items?: PayrollRunItem[];
};

export type PayrollRunListResponse = {
  data: PayrollRunSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

// ── Worker types ─────────────────────────────────────────────────────────

export type PayrollWorker = {
  id: string;
  full_name: string;
  email?: string | null;
  worker_type: "employee" | "consultant";
  status: string;
  currency: string;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  staff_code?: string | null;
  organization_id?: string | null;
};

export type PayrollWorkerListResponse = {
  data: PayrollWorker[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

// ── Run management (payroll.manage) ──────────────────────────────────────

export async function listPayrollRuns(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  year?: number;
  month?: number;
}): Promise<PayrollRunListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.status) query.set("status", params.status);
  if (params?.year) query.set("year", String(params.year));
  if (params?.month) query.set("month", String(params.month));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const payload = await httpRequest<any>(`/payroll/runs${suffix}`);
  if (Array.isArray(payload)) {
    return {
      data: payload as PayrollRunSummary[],
      meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 },
    };
  }
  return payload as PayrollRunListResponse;
}

export async function getPayrollRun(id: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}`);
}

export async function createPayrollRun(data: {
  name: string;
  year: number;
  month: number;
  period_start: string;
  period_end: string;
  currency?: string;
  notes?: string;
  paid_from_account_id?: string;
}): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>("/payroll/runs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePayrollRun(
  id: string,
  data: {
    name?: string;
    year?: number;
    month?: number;
    period_start?: string;
    period_end?: string;
    currency?: string;
    notes?: string;
    paid_from_account_id?: string;
  }
): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deletePayrollRun(id: string): Promise<void> {
  await httpRequest<void>(`/payroll/runs/${id}`, { method: "DELETE" });
}

export async function generatePayrollRun(id: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/generate`, { method: "POST" });
}

export async function submitPayrollRun(id: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/submit`, { method: "POST" });
}

// ── Finance approval (payroll.approve) ───────────────────────────────────

export async function reviewPayrollRun(id: string, note?: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function approvePayrollRun(id: string, note?: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectPayrollRun(id: string, note?: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function reopenPayrollRun(id: string, note?: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/reopen`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function closePayrollRun(id: string, note?: string): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/close`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function payPayrollRun(id: string, data: {
  note?: string;
  paid_at?: string;
  paid_from_account_id?: string;
  payment_reference?: string;
}): Promise<PayrollRunDetail> {
  return httpRequest<PayrollRunDetail>(`/payroll/runs/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Worker management (payroll.manage) ───────────────────────────────────

export async function listPayrollWorkers(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<PayrollWorkerListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const payload = await httpRequest<any>(`/payroll/workers${suffix}`);
  if (Array.isArray(payload)) {
    return {
      data: payload as PayrollWorker[],
      meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 },
    };
  }
  return payload as PayrollWorkerListResponse;
}

export async function getPayrollWorker(id: string): Promise<PayrollWorker> {
  return httpRequest<PayrollWorker>(`/payroll/workers/${id}`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/pwa && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat(payroll): extend payroll-api with run/worker/approval functions"
```

---

## Task 4: HR Payroll page — run list + stat cards

**Files:**
- Create: `apps/pwa/src/pages/hr/payroll/HrPayrollPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listPayrollRuns, type PayrollRunSummary } from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" | "info" {
  switch (status) {
    case "draft": return "neutral";
    case "generated": return "info";
    case "submitted": return "warning";
    case "reviewed": return "warning";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

function periodLabel(run: PayrollRunSummary) {
  return `${MONTH_NAMES[run.period_month] ?? run.period_month} ${run.period_year}`;
}

export default function HrPayrollPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "hr:payroll:runs",
    () => listPayrollRuns({ per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.data ?? [];

  const pendingSubmission = allRuns.filter((r) =>
    r.status === "draft" || r.status === "generated",
  ).length;
  const awaitingApproval = allRuns.filter((r) =>
    r.status === "submitted" || r.status === "reviewed",
  ).length;
  const paidThisYear = allRuns.filter((r) =>
    r.status === "paid" && r.period_year === new Date().getFullYear(),
  ).length;

  const filteredRuns =
    statusFilter === "all"
      ? allRuns
      : allRuns.filter((r) => r.status === statusFilter);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Payroll" }]}
        title="Payroll"
        description="Create and submit payroll runs for Finance approval."
        actions={
          <Button
            size="sm"
            requiredPermissions={["payroll.manage"]}
            onClick={() => navigate("/hr/payroll/runs/new")}
          >
            New Payroll Run
          </Button>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Draft / Generated"
            value={String(pendingSubmission)}
            tone="neutral"
            icon="edit_note"
          />
          <StatCard
            label="Awaiting Finance Approval"
            value={String(awaitingApproval)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label={`Paid Runs (${new Date().getFullYear()})`}
            value={String(paidThisYear)}
            tone="success"
            icon="payments"
          />
        </div>

        <SectionCard
          title="Payroll Runs"
          description="All runs you have created. Submit a generated run to send it to Finance for approval."
        >
          <div className="mb-4">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="generated">Generated</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Under Review</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </SelectField>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading runs...</div>
          ) : filteredRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Gross</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>{periodLabel(run)}</TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.total_gross != null
                        ? formatCurrency(run.total_gross, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {run.total_net != null
                        ? formatCurrency(run.total_net, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={runStatusTone(run.status)}>
                        {run.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/hr/payroll/runs/${run.id}`)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No payroll runs"
              description="Create a new payroll run to get started."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollPage.tsx
git commit -m "feat(payroll): add HrPayrollPage with run list and stat cards"
```

---

## Task 5: HR Payroll Run Form — create a new run

**Files:**
- Create: `apps/pwa/src/pages/hr/payroll/HrPayrollRunFormPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  PageHeader,
  SectionCard,
  TextField,
  SelectField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { createPayrollRun } from "@/shared/api/payroll-api";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function defaultPeriodDates(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
  };
}

export default function HrPayrollRunFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [name, setName] = useState(
    `Payroll ${MONTHS[today.getMonth()].label} ${today.getFullYear()}`,
  );
  const [currency, setCurrency] = useState("NGN");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { period_start, period_end } = defaultPeriodDates(year, month);
      const run = await createPayrollRun({
        name,
        year,
        month,
        period_start,
        period_end,
        currency,
        notes: notes || undefined,
      });
      toast({ title: "Payroll run created", variant: "success" });
      navigate(`/hr/payroll/runs/${run.id}`);
    } catch {
      toast({ title: "Failed to create payroll run", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "HR", path: "/hr" },
          { label: "Payroll", path: "/hr/payroll" },
          { label: "New Run" },
        ]}
        title="New Payroll Run"
        description="Create a payroll run. After saving, generate employee items then submit to Finance."
      />

      <form onSubmit={handleSubmit}>
        <SectionCard title="Run Details">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Run Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <SelectField
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </SelectField>
            <SelectField
              label="Year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </SelectField>
            <SelectField
              label="Month"
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </SelectField>
            <div className="md:col-span-2">
              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
              />
            </div>
          </div>
        </SectionCard>

        <div className="mt-4 flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Run"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/hr/payroll")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollRunFormPage.tsx
git commit -m "feat(payroll): add HrPayrollRunFormPage to create payroll runs"
```

---

## Task 6: HR Payroll Run Detail — view items, generate, submit

**Files:**
- Create: `apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getPayrollRun,
  generatePayrollRun,
  submitPayrollRun,
  deletePayrollRun,
  type PayrollRunDetail,
} from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" | "info" {
  switch (status) {
    case "draft": return "neutral";
    case "generated": return "info";
    case "submitted": return "warning";
    case "reviewed": return "warning";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

export default function HrPayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acting, setActing] = useState<string | null>(null);

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const {
    data: run,
    loading,
    refetch,
  } = useCachedQuery(
    `hr:payroll:run:${id}`,
    () => getPayrollRun(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  async function handleGenerate() {
    if (!id) return;
    setActing("generate");
    try {
      await generatePayrollRun(id);
      toast({ title: "Run generated — review items below", variant: "success" });
      refetch();
    } catch {
      toast({ title: "Failed to generate run", variant: "error" });
    } finally {
      setActing(null);
    }
  }

  async function handleSubmit() {
    if (!id) return;
    setActing("submit");
    try {
      await submitPayrollRun(id);
      toast({ title: "Run submitted to Finance for approval", variant: "success" });
      refetch();
    } catch {
      toast({ title: "Failed to submit run", variant: "error" });
    } finally {
      setActing(null);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this payroll run? This cannot be undone.")) return;
    setActing("delete");
    try {
      await deletePayrollRun(id);
      toast({ title: "Run deleted", variant: "success" });
      navigate("/hr/payroll");
    } catch {
      toast({ title: "Failed to delete run", variant: "error" });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="hr-payroll"
        user={{ name: userName, role: "HR Staff" }}
        mobileNav={buildAppMobileNav("HR")}
      >
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="hr-payroll"
        user={{ name: userName, role: "HR Staff" }}
        mobileNav={buildAppMobileNav("HR")}
      >
        <EmptyState title="Run not found" description="This payroll run does not exist." />
      </AppShell>
    );
  }

  const period = `${MONTH_NAMES[run.period_month] ?? run.period_month} ${run.period_year}`;
  const canGenerate = run.status === "draft";
  const canSubmit = run.status === "generated";
  const canDelete = run.status === "draft";
  const items = run.items ?? [];

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "HR", path: "/hr" },
          { label: "Payroll", path: "/hr/payroll" },
          { label: run.name },
        ]}
        title={run.name}
        description={`${period} · ${run.currency}`}
        actions={
          <div className="flex gap-2">
            {canGenerate && (
              <Button
                size="sm"
                requiredPermissions={["payroll.manage"]}
                disabled={acting === "generate"}
                onClick={handleGenerate}
              >
                {acting === "generate" ? "Generating..." : "Generate Items"}
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                requiredPermissions={["payroll.manage"]}
                disabled={acting === "submit"}
                onClick={handleSubmit}
              >
                {acting === "submit" ? "Submitting..." : "Submit to Finance"}
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                requiredPermissions={["payroll.manage"]}
                disabled={acting === "delete"}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Status"
            value={run.status}
            tone={runStatusTone(run.status)}
            icon="info"
          />
          <StatCard
            label="Workers"
            value={String(run.worker_count ?? items.length)}
            tone="neutral"
            icon="group"
          />
          <StatCard
            label="Total Net Pay"
            value={
              run.total_net != null
                ? formatCurrency(run.total_net, run.currency)
                : "-"
            }
            tone="neutral"
            icon="payments"
          />
        </div>

        {run.notes ? (
          <SectionCard title="Notes">
            <p className="text-sm text-slate-700">{run.notes}</p>
          </SectionCard>
        ) : null}

        <SectionCard
          title="Payroll Items"
          description={
            canGenerate
              ? "Click 'Generate Items' to pull worker records for this period."
              : "Employee-level breakdown for this run."
          }
        >
          {items.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Gross Pay</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {item.worker_name ?? "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.gross_pay, run.currency)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.total_deductions, run.currency)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(item.net_pay, run.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={
                          item.payment_status === "paid" ? "success" : "neutral"
                        }
                      >
                        {item.payment_status ?? "pending"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No items yet"
              description={
                canGenerate
                  ? "Generate items to populate this run."
                  : "No payroll items for this run."
              }
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx
git commit -m "feat(payroll): add HrPayrollRunDetailPage with generate and submit actions"
```

---

## Task 7: HR Payroll Workers page

**Files:**
- Create: `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import {
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listPayrollWorkers } from "@/shared/api/payroll-api";

export default function HrPayrollWorkersPage() {
  const { user } = useAuth();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: workersResp, loading } = useCachedQuery(
    "hr:payroll:workers",
    () => listPayrollWorkers({ per_page: 200 }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const workers = workersResp?.data ?? [];
  const activeWorkers = workers.filter((w) => w.status === "active").length;
  const employees = workers.filter((w) => w.worker_type === "employee").length;
  const consultants = workers.filter((w) => w.worker_type === "consultant").length;

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll-workers"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "HR", path: "/hr" },
          { label: "Payroll", path: "/hr/payroll" },
          { label: "Workers" },
        ]}
        title="Payroll Workers"
        description="Employee and consultant payroll profiles — salary basis, bank details, and tax identifiers."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active Workers" value={String(activeWorkers)} tone="success" icon="group" />
          <StatCard label="Employees" value={String(employees)} tone="neutral" icon="badge" />
          <StatCard label="Consultants" value={String(consultants)} tone="neutral" icon="work" />
        </div>

        <SectionCard
          title="All Workers"
          description="All registered payroll profiles."
        >
          {loading ? (
            <div className="text-sm text-slate-500">Loading workers...</div>
          ) : workers.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Currency</TableHeaderCell>
                  <TableHeaderCell>Bank</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {workers.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{w.full_name}</p>
                      {w.staff_code ? (
                        <p className="text-xs text-slate-500">{w.staff_code}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{w.email ?? "-"}</TableCell>
                    <TableCell className="capitalize">{w.worker_type}</TableCell>
                    <TableCell>{w.currency}</TableCell>
                    <TableCell>
                      {w.bank_name
                        ? `${w.bank_name}${w.bank_account_number ? ` ···${w.bank_account_number.slice(-4)}` : ""}`
                        : "-"}
                    </TableCell>
                    <TableCell className="capitalize">{w.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No workers registered"
              description="Add workers to include them in payroll runs."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx
git commit -m "feat(payroll): add HrPayrollWorkersPage"
```

---

## Task 8: Finance Payroll page — approval queue

**Files:**
- Create: `apps/pwa/src/pages/finance/payroll/FinancePayrollPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listPayrollRuns, type PayrollRunSummary } from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" | "info" {
  switch (status) {
    case "submitted": return "warning";
    case "reviewed": return "info";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

export default function FinancePayrollPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "finance:payroll:runs",
    () => listPayrollRuns({ per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.data ?? [];

  const pendingReview = allRuns.filter((r) =>
    r.status === "submitted" || r.status === "reviewed",
  );
  const approved = allRuns.filter((r) => r.status === "approved");
  const paid = allRuns.filter(
    (r) => r.status === "paid" && r.period_year === new Date().getFullYear(),
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Finance Staff",
      }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Financial", path: "/finance" }, { label: "Payroll" }]}
        title="Payroll Approval"
        description="Review and approve payroll runs submitted by HR."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Pending Review"
            value={String(pendingReview.length)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label="Approved (pending payment)"
            value={String(approved.length)}
            tone="success"
            icon="check_circle"
          />
          <StatCard
            label={`Paid (${new Date().getFullYear()})`}
            value={String(paid.length)}
            tone="neutral"
            icon="payments"
          />
        </div>

        {pendingReview.length > 0 && (
          <SectionCard
            title="Pending Review"
            description="Runs submitted by HR awaiting Finance review."
          >
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingReview.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.period_month] ?? run.period_month} {run.period_year}
                    </TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.total_net != null
                        ? formatCurrency(run.total_net, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={runStatusTone(run.status)}>{run.status}</Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        requiredPermissions={["payroll.approve"]}
                        onClick={() => navigate(`/finance/payroll/runs/${run.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        <SectionCard
          title="All Payroll Runs"
          description="Full history of payroll runs visible to Finance."
        >
          {loading ? (
            <div className="text-sm text-slate-500">Loading runs...</div>
          ) : allRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Gross</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {allRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.period_month] ?? run.period_month} {run.period_year}
                    </TableCell>
                    <TableCell>
                      {run.total_gross != null
                        ? formatCurrency(run.total_gross, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {run.total_net != null
                        ? formatCurrency(run.total_net, run.currency)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={runStatusTone(run.status)}>{run.status}</Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/finance/payroll/runs/${run.id}`)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No payroll runs"
              description="HR has not submitted any payroll runs yet."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollPage.tsx
git commit -m "feat(payroll): add FinancePayrollPage with approval queue"
```

---

## Task 9: Finance Payroll Run Detail — approve/reject/pay

**Files:**
- Create: `apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextAreaField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getPayrollRun,
  approvePayrollRun,
  rejectPayrollRun,
  reviewPayrollRun,
  payPayrollRun,
  closePayrollRun,
  reopenPayrollRun,
} from "@/shared/api/payroll-api";
import { formatCurrency } from "@stanforte/shared";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function runStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" | "info" {
  switch (status) {
    case "submitted": return "warning";
    case "reviewed": return "info";
    case "approved": return "success";
    case "paid": return "success";
    case "closed": return "neutral";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

export default function FinancePayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acting, setActing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: run, loading, refetch } = useCachedQuery(
    `finance:payroll:run:${id}`,
    () => getPayrollRun(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  async function act(
    action: string,
    fn: () => Promise<unknown>,
    successMsg: string,
  ) {
    setActing(action);
    try {
      await fn();
      toast({ title: successMsg, variant: "success" });
      setNote("");
      refetch();
    } catch {
      toast({ title: `Failed to ${action} run`, variant: "error" });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="finance-payroll"
        user={{ name: userName, role: "Finance Staff" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="finance-payroll"
        user={{ name: userName, role: "Finance Staff" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <EmptyState title="Run not found" description="This payroll run does not exist." />
      </AppShell>
    );
  }

  const period = `${MONTH_NAMES[run.period_month] ?? run.period_month} ${run.period_year}`;
  const items = run.items ?? [];

  const canReview = run.status === "submitted";
  const canApprove = run.status === "reviewed" || run.status === "submitted";
  const canReject = ["submitted", "reviewed", "approved"].includes(run.status);
  const canPay = run.status === "approved";
  const canClose = run.status === "paid";
  const canReopen = run.status === "rejected" || run.status === "closed";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-payroll"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Finance Staff",
      }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Financial", path: "/finance" },
          { label: "Payroll", path: "/finance/payroll" },
          { label: run.name },
        ]}
        title={run.name}
        description={`${period} · ${run.currency}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canReview && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "review"}
                onClick={() =>
                  act("review", () => reviewPayrollRun(id!, note || undefined), "Run marked as reviewed")
                }
              >
                {acting === "review" ? "Reviewing..." : "Mark Reviewed"}
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "approve"}
                onClick={() =>
                  act("approve", () => approvePayrollRun(id!, note || undefined), "Run approved")
                }
              >
                {acting === "approve" ? "Approving..." : "Approve"}
              </Button>
            )}
            {canPay && (
              <Button
                size="sm"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "pay"}
                onClick={() =>
                  act("pay", () => payPayrollRun(id!, { note: note || undefined }), "Run marked as paid")
                }
              >
                {acting === "pay" ? "Processing..." : "Mark as Paid"}
              </Button>
            )}
            {canClose && (
              <Button
                size="sm"
                variant="ghost"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "close"}
                onClick={() =>
                  act("close", () => closePayrollRun(id!, note || undefined), "Run closed")
                }
              >
                Close Run
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="ghost"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "reject"}
                onClick={() =>
                  act("reject", () => rejectPayrollRun(id!, note || undefined), "Run rejected")
                }
              >
                Reject
              </Button>
            )}
            {canReopen && (
              <Button
                size="sm"
                variant="ghost"
                requiredPermissions={["payroll.approve"]}
                disabled={acting === "reopen"}
                onClick={() =>
                  act("reopen", () => reopenPayrollRun(id!, note || undefined), "Run reopened")
                }
              >
                Reopen
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Status"
            value={run.status}
            tone={runStatusTone(run.status)}
            icon="info"
          />
          <StatCard
            label="Workers"
            value={String(run.worker_count ?? items.length)}
            tone="neutral"
            icon="group"
          />
          <StatCard
            label="Total Net Pay"
            value={
              run.total_net != null
                ? formatCurrency(run.total_net, run.currency)
                : "-"
            }
            tone="neutral"
            icon="payments"
          />
        </div>

        <SectionCard title="Review Note">
          <TextAreaField
            label="Note (optional — attached to any action you take above)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for HR or the audit trail..."
          />
        </SectionCard>

        <SectionCard title="Payroll Items" description="Employee breakdown for this run.">
          {items.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Gross Pay</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {item.worker_name ?? "-"}
                      </p>
                    </TableCell>
                    <TableCell>{formatCurrency(item.gross_pay, run.currency)}</TableCell>
                    <TableCell>{formatCurrency(item.total_deductions, run.currency)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(item.net_pay, run.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={item.payment_status === "paid" ? "success" : "neutral"}
                      >
                        {item.payment_status ?? "pending"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No items" description="No payroll items found for this run." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx
git commit -m "feat(payroll): add FinancePayrollRunDetailPage with approve/reject/pay actions"
```

---

## Task 10: Navigation + Routes

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add HR Payroll to navigation**

In `apps/pwa/src/shared/navigation.ts`, find the HR section children array and add the payroll item after `hr-leave`:

```typescript
{ key: "hr-leave", label: "Leave", icon: "event_available", path: "/hr/leave", permissions: ["leave.view", "leave.manage", "leave.approve"] },
{
  key: "hr-payroll",
  label: "Payroll",
  icon: "payments",
  children: [
    { key: "hr-payroll-runs", label: "Payroll Runs", icon: "receipt_long", path: "/hr/payroll", permissions: ["payroll.manage"] },
    { key: "hr-payroll-workers", label: "Workers", icon: "group", path: "/hr/payroll/workers", permissions: ["payroll.manage"] },
  ],
},
```

- [ ] **Step 2: Add Finance Payroll to navigation**

In the Finance section children, find `finance-group-operations` and add a payroll item inside it after `finance-requests`:

```typescript
{ key: "finance-requests", label: "Requests", icon: "receipt_long", path: "/finance/requests" },
{ key: "finance-payroll", label: "Payroll", icon: "payments", path: "/finance/payroll", permissions: ["payroll.approve"] },
```

- [ ] **Step 3: Add routes to App.tsx**

Add imports at the top of `apps/pwa/src/App.tsx`:

```typescript
import HrPayrollPage from "@/pages/hr/payroll/HrPayrollPage";
import HrPayrollRunFormPage from "@/pages/hr/payroll/HrPayrollRunFormPage";
import HrPayrollRunDetailPage from "@/pages/hr/payroll/HrPayrollRunDetailPage";
import HrPayrollWorkersPage from "@/pages/hr/payroll/HrPayrollWorkersPage";
import FinancePayrollPage from "@/pages/finance/payroll/FinancePayrollPage";
import FinancePayrollRunDetailPage from "@/pages/finance/payroll/FinancePayrollRunDetailPage";
```

Add HR payroll routes inside the HR `<PermissionRoute>` block (near the `hr-leave` route, around line 274):

```tsx
<Route path="/hr/payroll" element={<HrPayrollPage />} />
<Route path="/hr/payroll/runs/new" element={<HrPayrollRunFormPage />} />
<Route path="/hr/payroll/runs/:id" element={<HrPayrollRunDetailPage />} />
<Route path="/hr/payroll/workers" element={<HrPayrollWorkersPage />} />
```

Add Finance payroll routes inside the Finance `<PermissionRoute>` block (near `/finance/requests`):

```tsx
<Route path="/finance/payroll" element={<FinancePayrollPage />} />
<Route path="/finance/payroll/runs/:id" element={<FinancePayrollRunDetailPage />} />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/pwa && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx
git commit -m "feat(payroll): wire HR and Finance payroll routes and navigation"
```

---

## Self-Review

**Spec coverage:**
- ✅ API re-gating: `payroll.manage` for initiation, `payroll.approve` for approval, `finance.manage` for financial config
- ✅ Seed: `payroll.manage` added and assigned to `hr_manager`
- ✅ HR pages: run list, run form, run detail (generate/submit), workers list
- ✅ Finance pages: approval queue, run detail (review/approve/reject/pay/close/reopen)
- ✅ Navigation: HR Payroll group + Finance Payroll item
- ✅ Routes: all pages registered in App.tsx

**Placeholder scan:** None found.

**Type consistency:** `PayrollRunSummary`, `PayrollRunDetail`, `PayrollRunItem`, `PayrollWorker` defined in Task 3 and used consistently across all pages. `runStatusTone()` defined identically in HR and Finance pages (minor duplication acceptable — shared utilities can be extracted later if needed).
