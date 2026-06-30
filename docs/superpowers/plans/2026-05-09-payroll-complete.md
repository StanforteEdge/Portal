# Payroll System — Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the payroll system end-to-end — HR initiates, ED/COO authorizes, Finance pays. Includes salary components and tax table management UI, worker detail pages, loan management, full monthly breakdown exports, and enhanced employee payslips.

**Prerequisites:** The HR/Finance split plan (`2026-04-29-payroll-hr-finance-split.md`) must be fully implemented first. This plan builds directly on top of it.

**Key constraint:** Finance may NOT mark a run as paid until an ED/COO has authorized it. The authorization step sits between `approved` and `paid` in the state machine.

**Tech Stack:** NestJS (API), React + TypeScript + TailwindCSS (PWA), existing shared UI components, `useCachedQuery` for data fetching, `httpRequest` for API calls.

---

## State Machine (final)

```
draft → generated → submitted → reviewed → approved → authorized → paid → closed
                                                              ↓
                                                          rejected (from any active state)
```

| Status      | Who can move forward        |
|-------------|---------------------------|
| draft       | HR (`payroll.manage`) → generate |
| generated   | HR (`payroll.manage`) → submit |
| submitted   | Finance (`payroll.approve`) → review or approve |
| reviewed    | Finance (`payroll.approve`) → approve |
| approved    | ED/COO (`payroll.authorize`) → authorize |
| authorized  | Finance (`payroll.approve`) → pay |
| paid        | Finance (`payroll.approve`) → close |
| closed      | terminal |
| rejected    | Finance (`payroll.approve`) → reopen → back to draft |

---

## File Map

**Modify:**
- `api/src/modules/payroll/payroll.controller.ts` — add `authorize` endpoint
- `api/src/modules/payroll/payroll.service.ts` — add `authorizeRun`, update `payRun` guard, add `monthlyBreakdown`
- `api/scripts/seed-rbac.js` — add `payroll.authorize` permission + assign to ed/coo
- `apps/pwa/src/shared/api/payroll-api.ts` — add `authorizePayrollRun`, `downloadMonthlyBreakdown`, loan/component/tax-table functions
- `apps/pwa/src/shared/navigation.ts` — add Admin authorization entry, Finance components/tax-table entries
- `apps/pwa/src/App.tsx` — register all new routes
- `apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx` — block Pay until authorized, show auth status
- `apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx` — add Export button

**Create:**
- `api/src/modules/payroll/dto/authorize-payroll-run.dto.ts` — DTO for authorize endpoint
- `apps/pwa/src/pages/admin/payroll/AdminPayrollAuthorizationPage.tsx` — ED/COO authorization queue
- `apps/pwa/src/pages/admin/payroll/AdminPayrollRunAuthorizePage.tsx` — authorize/reject a specific run
- `apps/pwa/src/pages/finance/payroll/FinancePayrollComponentsPage.tsx` — salary components CRUD
- `apps/pwa/src/pages/finance/payroll/FinancePayrollTaxTablesPage.tsx` — tax tables CRUD
- `apps/pwa/src/pages/hr/payroll/HrPayrollWorkerDetailPage.tsx` — worker detail + component assignments
- `apps/pwa/src/pages/hr/payroll/HrPayrollLoansPage.tsx` — loan management

---

## Task 1: Backend — `payroll.authorize` permission + authorize endpoint

**Files:**
- Create: `api/src/modules/payroll/dto/authorize-payroll-run.dto.ts`
- Modify: `api/src/modules/payroll/payroll.controller.ts`
- Modify: `api/src/modules/payroll/payroll.service.ts`

### Step 1a: Create the DTO

- [ ] Create `api/src/modules/payroll/dto/authorize-payroll-run.dto.ts`:

```typescript
import { IsOptional, IsString } from 'class-validator';

export class AuthorizePayrollRunDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### Step 1b: Add the authorize endpoint to the controller

- [ ] In `api/src/modules/payroll/payroll.controller.ts`, add the import at the top with other DTO imports:

```typescript
import { AuthorizePayrollRunDto } from './dto/authorize-payroll-run.dto';
```

- [ ] In the same file, add the `authorize` endpoint in the Finance approval section (after `rejectRun`, before the Finance config section):

```typescript
  @Post('runs/:id/authorize')
  @Permissions('payroll.authorize')
  authorizeRun(@Req() req: any, @Param('id') id: string, @Body() dto: AuthorizePayrollRunDto) {
    return this.payrollService.authorizeRun(id, dto, req.user?.id);
  }
```

Also add `payroll.authorize` to the shared reads permissions on the `getRun` endpoint so authorizers can view runs:

```typescript
  @Get('runs/:id')
  @Permissions('payroll.manage', 'payroll.approve', 'payroll.authorize')
  getRun(@Param('id') id: string) {
    return this.payrollService.getRun(id);
  }

  @Get('runs')
  @Permissions('payroll.manage', 'payroll.approve', 'payroll.authorize')
  listRuns(@Query() query: Record<string, any>) {
    return this.payrollService.listRuns(query);
  }
```

Also add a new `monthly-breakdown` export endpoint in the shared reads section:

```typescript
  @Post('runs/:id/monthly-breakdown')
  @Permissions('payroll.manage', 'payroll.approve', 'payroll.authorize')
  monthlyBreakdown(@Param('id') id: string) {
    return this.payrollService.monthlyBreakdown(id);
  }
```

### Step 1c: Add `authorizeRun` and `monthlyBreakdown` to the service

> **ORM note:** The service uses **Prisma**, not TypeORM. All DB access goes through `this.prisma.*`. The audit pattern is `this.appendRunNote()` + `this.recordRunEvent()`. There is no `buildPayslipData()` — component data lives in `PayrollRunItemLine` records linked to each `PayrollRunItem` via the `lines` relation.

- [ ] Add the `authorizeRun` method directly after `approveRun`:

```typescript
async authorizeRun(id: string, dto: { notes?: string }, actorId: string) {
  const run = await this.prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw new NotFoundException('Payroll run not found');
  if (run.status !== 'approved') {
    throw new BadRequestException(
      `Cannot authorize a run with status "${run.status}". Run must be approved first.`,
    );
  }

  await this.prisma.payrollRun.update({
    where: { id },
    data: {
      status: 'authorized',
      authorizedAt: new Date(),
      authorizedById: actorId,
      notes: this.appendRunNote(run.notes, 'Authorized', dto.notes, actorId),
    },
  });

  await this.recordRunEvent(id, 'authorized', actorId, dto.notes || 'Authorized payroll run');
  return this.getRun(id);
}
```

> `authorizedAt`, `authorizedById` are new columns added in Step 1d. If the schema does not yet have them, the `prisma.payrollRun.update` will fail at compile time — add them to `schema.prisma` first (Step 1d), then run the migration before compiling.

- [ ] Find `payRun` in the service. At the very top of the method body, after the `findUnique` call that fetches the run, add the authorization guard:

```typescript
// Insert immediately after the existing "run not found" check:
if (run.status !== 'authorized') {
  throw new BadRequestException(
    `Cannot pay a run with status "${run.status}". Run must be authorized by ED/COO first.`,
  );
}
```

Do **not** replace the rest of `payRun` — only insert these three lines at the top.

- [ ] Add `monthlyBreakdown` after `generateBankSchedule` (or any existing export method):

```typescript
async monthlyBreakdown(id: string) {
  // Fetch run with items → lines → component (the PayrollRunItemLine table)
  const run = await this.prisma.payrollRun.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          lines: { include: { component: true } },
          worker: true,
        },
      },
    },
  });
  if (!run) throw new NotFoundException('Payroll run not found');

  // Collect all unique component names in document order, grouped by type
  const allLines = run.items.flatMap((item) => item.lines);

  const earningNames = [
    ...new Set(
      allLines
        .filter((l) => l.component?.componentType === 'earning')
        .map((l) => l.component!.name),
    ),
  ];
  const deductionNames = [
    ...new Set(
      allLines
        .filter((l) => l.component?.componentType === 'deduction')
        .map((l) => l.component!.name),
    ),
  ];
  const employerCostNames = [
    ...new Set(
      allLines
        .filter((l) => l.component?.componentType === 'employer_cost')
        .map((l) => l.component!.name),
    ),
  ];

  // One flat row per worker
  const rows = run.items.map((item) => {
    const row: Record<string, unknown> = {
      name:             item.worker?.fullName ?? '',
      type:             item.worker?.workerType ?? '',
      staff_code:       item.worker?.staffCode ?? '',
      gross_pay:        Number(item.grossPay ?? 0),
      total_deductions: Number(item.totalDeductions ?? 0),
      net_pay:          Number(item.netPay ?? item.computedNetPay ?? 0),
    };

    for (const name of earningNames) {
      const line = item.lines.find(
        (l) => l.component?.componentType === 'earning' && l.component.name === name,
      );
      row[`earning_${name}`] = Number(line?.amount ?? 0);
    }
    for (const name of deductionNames) {
      const line = item.lines.find(
        (l) => l.component?.componentType === 'deduction' && l.component.name === name,
      );
      row[`deduction_${name}`] = Number(line?.amount ?? 0);
    }
    for (const name of employerCostNames) {
      const line = item.lines.find(
        (l) => l.component?.componentType === 'employer_cost' && l.component.name === name,
      );
      row[`employer_cost_${name}`] = Number(line?.amount ?? 0);
    }

    return row;
  });

  // Emit CSV — handle empty run gracefully
  const headers =
    rows.length > 0
      ? Object.keys(rows[0])
      : ['name', 'type', 'staff_code', 'gross_pay', 'total_deductions', 'net_pay'];

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    ),
  ].join('\n');

  const fileName = `payroll-breakdown-${run.year ?? ''}-${String(run.month ?? '').padStart(2, '0')}.csv`;
  return {
    file_name: fileName,
    mime_type: 'text/csv',
    content_base64: Buffer.from(csv).toString('base64'),
  };
}
```

> **Field name check:** Prisma generates camelCase accessors from the schema. Verify the exact field names against `schema.prisma` for `PayrollWorker` (`fullName` / `workerType` / `staffCode`) and `PayrollRunItem` (`grossPay` / `totalDeductions` / `netPay` / `computedNetPay`). If the schema uses different casing, update accordingly — the logic is unchanged.

### Step 1d: Schema change + Prisma migration

- [ ] In `api/prisma/schema.prisma`, find the `PayrollRun` model and add three new optional fields (place them near the other `*At` / `*ById` audit fields):

```prisma
authorizedAt       DateTime?
authorizedById     String?   @db.Uuid
authorizationNotes String?
```

If a `User` relation is needed (for foreign key integrity), also add:
```prisma
authorizedBy       User?     @relation("PayrollRunAuthorizedBy", fields: [authorizedById], references: [id])
```
And add the inverse relation on the `User` model:
```prisma
authorizedPayrollRuns PayrollRun[] @relation("PayrollRunAuthorizedBy")
```

- [ ] Generate and apply the migration:

```bash
cd api
npx prisma migrate dev --name add_payroll_run_authorization
```

- [ ] Verify the generated SQL in `prisma/migrations/*/migration.sql` — it should add exactly the three columns and nothing else.

### Step 1e: Verify

- [ ] Compile API:

```bash
cd api && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add api/src/modules/payroll/
git commit -m "feat(payroll): add authorize step — payroll.authorize permission, authorized status, monthly breakdown export"
```

---

## Task 2: Seed — add `payroll.authorize` and assign to ED/COO

**File:** `api/scripts/seed-rbac.js`

- [ ] **Step 1:** Find the permissions array and add `payroll.authorize` after `payroll.manage`:

```javascript
{ name: 'Manage Payroll', slug: 'payroll.manage', module: 'payroll', description: 'Can create and submit payroll runs and manage worker profiles' },
{ name: 'Approve Payroll', slug: 'payroll.approve', module: 'payroll', description: 'Can review, approve, pay, and close payroll runs' },
{ name: 'Authorize Payroll', slug: 'payroll.authorize', module: 'payroll', description: 'Final ED/COO authorization required before Finance can pay' },
```

- [ ] **Step 2:** Find the `rolePermissionMap` and add `payroll.authorize` to the executive roles. Locate `executive_director` (or `ed`), `coo`, and `ceo` entries and append:

```javascript
executive_director: [...existingPermissions, 'payroll.authorize'],
coo: [...existingPermissions, 'payroll.authorize'],
ceo: [...existingPermissions, 'payroll.authorize'],
```

> Look for the actual role slugs used in the file — they may be `ed`, `coo`, or `executive_director`. Add to all executive-level roles.

- [ ] **Step 3:** Run the seed:

```bash
cd api && node scripts/seed-rbac.js
```

Expected: permissions count increases by 1.

- [ ] **Step 4:** Commit:

```bash
git add api/scripts/seed-rbac.js
git commit -m "feat(payroll): add payroll.authorize permission, assign to executive roles"
```

---

## Task 3: Frontend API — extend `payroll-api.ts`

**File:** `apps/pwa/src/shared/api/payroll-api.ts`

- [ ] **Step 1:** Add `authorizePayrollRun` function after `approvePayrollRun`:

```typescript
export async function authorizePayrollRun(id: string, payload?: { notes?: string }) {
  const res = await httpRequest<any>(`/payroll/runs/${id}/authorize`, {
    method: "POST",
    body: payload ?? {},
  });
  return (res?.data ?? res) as PayrollRunDetail;
}
```

- [ ] **Step 2:** Add `downloadMonthlyBreakdown` function:

```typescript
export async function downloadMonthlyBreakdown(id: string) {
  const res = await httpRequest<any>(`/payroll/runs/${id}/monthly-breakdown`, {
    method: "POST",
  });
  return (res?.data ?? res) as { file_name: string; mime_type: string; content_base64: string };
}
```

- [ ] **Step 3:** Add loan types and functions:

```typescript
export type PayrollLoan = {
  id: string;
  worker_id: string;
  worker_name?: string | null;
  principal: number;
  balance: number;
  monthly_recovery: number;
  issued_date: string;
  expected_end_date?: string | null;
  status: string;
  currency?: string | null;
};

export type UpsertLoanPayload = {
  worker_id: string;
  principal: number;
  monthly_recovery: number;
  issued_date: string;
  expected_end_date?: string;
  currency?: string;
  notes?: string;
};

export async function listLoans(params?: { page?: number; per_page?: number; worker_id?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.worker_id) query.set("worker_id", params.worker_id);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await httpRequest<any>(`/payroll/loans${suffix}`);
  const items: PayrollLoan[] = res?.data?.items ?? res?.data ?? res ?? [];
  return { items };
}

export async function createLoan(payload: UpsertLoanPayload) {
  const res = await httpRequest<any>("/payroll/loans", { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollLoan;
}

export async function updateLoan(id: string, payload: Partial<UpsertLoanPayload>) {
  const res = await httpRequest<any>(`/payroll/loans/${id}`, { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollLoan;
}
```

- [ ] **Step 4:** Add payroll component types and functions:

```typescript
export type PayrollComponent = {
  id: string;
  code: string;
  name: string;
  component_type: "earning" | "deduction" | "employer_cost";
  calculation_type: string;
  amount?: number | null;
  rate?: number | null;
  taxable: boolean;
  statutory: boolean;
  is_active: boolean;
};

export type UpsertComponentPayload = {
  code: string;
  name: string;
  component_type: "earning" | "deduction" | "employer_cost";
  calculation_type: string;
  amount?: number;
  rate?: number;
  taxable?: boolean;
  statutory?: boolean;
  notes?: string;
};

export async function listPayrollComponents() {
  const res = await httpRequest<any>("/payroll/components");
  const items: PayrollComponent[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
  return { items };
}

export async function createPayrollComponent(payload: UpsertComponentPayload) {
  const res = await httpRequest<any>("/payroll/components", { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollComponent;
}

export async function updatePayrollComponent(id: string, payload: Partial<UpsertComponentPayload>) {
  const res = await httpRequest<any>(`/payroll/components/${id}`, { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollComponent;
}

export async function deletePayrollComponent(id: string) {
  return httpRequest<any>(`/payroll/components/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 5:** Add tax table types and functions:

```typescript
export type TaxBand = {
  from: number;
  to?: number | null;
  rate: number;
};

export type PayrollTaxTable = {
  id: string;
  name: string;
  worker_type?: string | null;
  effective_date: string;
  currency?: string | null;
  bands: TaxBand[];
  is_active: boolean;
};

export type UpsertTaxTablePayload = {
  name: string;
  worker_type?: string;
  effective_date: string;
  currency?: string;
  bands: TaxBand[];
};

export async function listPayrollTaxTables() {
  const res = await httpRequest<any>("/payroll/tax-tables");
  const items: PayrollTaxTable[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
  return { items };
}

export async function createPayrollTaxTable(payload: UpsertTaxTablePayload) {
  const res = await httpRequest<any>("/payroll/tax-tables", { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollTaxTable;
}

export async function updatePayrollTaxTable(id: string, payload: Partial<UpsertTaxTablePayload>) {
  const res = await httpRequest<any>(`/payroll/tax-tables/${id}`, { method: "POST", body: payload });
  return (res?.data ?? res) as PayrollTaxTable;
}
```

- [ ] **Step 6:** Verify TypeScript:

```bash
cd apps/pwa && npx tsc --noEmit
```

- [ ] **Step 7:** Commit:

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat(payroll): extend payroll-api with authorize, breakdown, loans, components, tax tables"
```

---

## Task 4: Admin — ED/COO Payroll Authorization Pages

**Files:**
- Create: `apps/pwa/src/pages/admin/payroll/AdminPayrollAuthorizationPage.tsx`
- Create: `apps/pwa/src/pages/admin/payroll/AdminPayrollRunAuthorizePage.tsx`

### Step 4a: Authorization queue list page

- [ ] Create `apps/pwa/src/pages/admin/payroll/AdminPayrollAuthorizationPage.tsx`:

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

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminPayrollAuthorizationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: runsResp, loading } = useCachedQuery(
    "admin:payroll:runs",
    () => listPayrollRuns({ per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRuns: PayrollRunSummary[] = runsResp?.items ?? [];
  const pendingAuth = allRuns.filter((r) => r.status === "approved");
  const authorized = allRuns.filter((r) => r.status === "authorized");
  const paid = allRuns.filter((r) => r.status === "paid" && r.year === new Date().getFullYear());

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Executive";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-payroll-auth"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Executive",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration", path: "/admin" }, { label: "Payroll Authorization" }]}
        title="Payroll Authorization"
        description="Finance-approved runs awaiting your authorization before payment can proceed."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Awaiting Authorization" value={String(pendingAuth.length)} tone="warning" icon="pending_actions" />
          <StatCard label="Authorized (pending payment)" value={String(authorized.length)} tone="success" icon="verified" />
          <StatCard label={`Paid (${new Date().getFullYear()})`} value={String(paid.length)} tone="neutral" icon="payments" />
        </div>

        {pendingAuth.length > 0 && (
          <SectionCard title="Awaiting Your Authorization" description="These runs have been approved by Finance and require your sign-off before payment.">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Run Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingAuth.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{run.name}</p>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/admin/payroll/authorize/${run.id}`)}
                      >
                        Review & Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        <SectionCard title="All Payroll Runs" description="Full history of payroll runs.">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : allRuns.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Run Name</TableHeaderCell>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Workers</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
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
                      {MONTH_NAMES[run.month] ?? run.month} {run.year}
                    </TableCell>
                    <TableCell>{run.worker_count ?? "-"}</TableCell>
                    <TableCell>
                      {run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={
                          run.status === "authorized" || run.status === "paid"
                            ? "success"
                            : run.status === "approved"
                            ? "warning"
                            : run.status === "rejected"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {run.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/payroll/authorize/${run.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No payroll runs" description="No runs have been submitted yet." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

> **Field name note:** The `PayrollRunSummary` type in `payroll-api.ts` uses `period_month`/`period_year` or `month`/`year` depending on what the API returns. Check the actual backend response shape and adjust field access (`run.month`, `run.year`, `run.net_total`, `run.gross_total`) to match. If the existing type uses `period_month`/`period_year`/`total_net`, use those instead.

### Step 4b: Authorize/view run detail page

- [ ] Create `apps/pwa/src/pages/admin/payroll/AdminPayrollRunAuthorizePage.tsx`:

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
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getPayrollRun,
  authorizePayrollRun,
  downloadMonthlyBreakdown,
} from "@/shared/api/payroll-api";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function triggerDownload(fileName: string, mimeType: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayrollRunAuthorizePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: run, loading, refetch } = useCachedQuery(
    `admin:payroll:run:${id}`,
    () => getPayrollRun(id!),
    { ttlMs: 0, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Executive";

  async function handleAuthorize() {
    if (!id) return;
    setActing("authorize");
    try {
      await authorizePayrollRun(id, { notes: notes.trim() || undefined });
      showToast({ tone: "success", title: "Authorized", message: "Payroll run authorized. Finance can now proceed with payment." });
      setNotes("");
      refetch();
    } catch (err) {
      showToast({ tone: "danger", title: "Authorization failed", message: err instanceof Error ? err.message : "Unable to authorize." });
    } finally {
      setActing(null);
    }
  }

  async function handleExport() {
    if (!id) return;
    setActing("export");
    try {
      const result = await downloadMonthlyBreakdown(id);
      triggerDownload(result.file_name, result.mime_type, result.content_base64);
    } catch {
      showToast({ tone: "danger", title: "Export failed", message: "Unable to download breakdown." });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="admin-payroll-auth" user={{ name: userName, role: "Executive" }} mobileNav={buildAppMobileNav("Dashboard")}>
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="admin-payroll-auth" user={{ name: userName, role: "Executive" }} mobileNav={buildAppMobileNav("Dashboard")}>
        <EmptyState title="Run not found" description="This payroll run does not exist." />
      </AppShell>
    );
  }

  const canAuthorize = run.status === "approved";
  const items = run.items ?? [];
  const period = `${MONTH_NAMES[run.month] ?? run.month} ${run.year}`;

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-payroll-auth"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Executive" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Administration", path: "/admin" },
          { label: "Payroll Authorization", path: "/admin/payroll/authorization" },
          { label: run.name },
        ]}
        title={run.name}
        description={`${period} · ${run.currency}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={acting === "export"} onClick={() => void handleExport()}>
              {acting === "export" ? "Exporting..." : "Download Breakdown"}
            </Button>
            {canAuthorize && (
              <Button size="sm" disabled={acting === "authorize"} onClick={() => void handleAuthorize()}>
                {acting === "authorize" ? "Authorizing..." : "Authorize Payment"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Status" value={run.status} tone={run.status === "authorized" || run.status === "paid" ? "success" : run.status === "approved" ? "warning" : "neutral"} icon="info" />
          <StatCard label="Workers" value={String(run.worker_count ?? items.length)} tone="neutral" icon="group" />
          <StatCard label="Total Net Pay" value={run.net_total != null ? `${run.currency} ${run.net_total.toLocaleString()}` : "-"} tone="neutral" icon="payments" />
        </div>

        {canAuthorize && (
          <SectionCard title="Authorization">
            <div className="grid gap-4">
              <p className="text-sm text-slate-700">
                You are authorizing this payroll run for payment. Finance will be able to mark it as paid once you authorize.
                Review the breakdown below before signing off.
              </p>
              <TextField
                label="Authorization Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Approved for May cycle — all figures verified."
              />
            </div>
          </SectionCard>
        )}

        {run.status === "authorized" && (
          <SectionCard title="Authorization">
            <Chip variant="success">Authorized — Finance can proceed with payment</Chip>
          </SectionCard>
        )}

        <SectionCard title="Payroll Items" description="Per-employee summary. Download the full breakdown for component-level detail.">
          {items.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Gross Pay</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Pay</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{item.worker_name ?? "-"}</p>
                    </TableCell>
                    <TableCell>{`${run.currency} ${item.gross_pay?.toLocaleString() ?? "-"}`}</TableCell>
                    <TableCell>{`${run.currency} ${item.total_deductions?.toLocaleString() ?? "-"}`}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{`${run.currency} ${item.net_pay?.toLocaleString() ?? "-"}`}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No items" description="No payroll items for this run." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] Commit:

```bash
git add apps/pwa/src/pages/admin/payroll/
git commit -m "feat(payroll): add ED/COO payroll authorization pages"
```

---

## Task 5: Finance — Update Run Detail to enforce authorized status

**File:** `apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx`

- [ ] **Step 1:** Change the `canPay` condition from `run.status === "approved"` to `run.status === "authorized"`:

Find:
```typescript
const canPay = run.status === "approved";
```

Replace with:
```typescript
const canPay = run.status === "authorized";
```

- [ ] **Step 2:** Add an authorization status banner. Find the SectionCard for "Review Note" and insert before it:

```tsx
{run.status === "approved" && (
  <SectionCard title="Authorization Required">
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <span className="material-symbols-outlined text-amber-600">pending</span>
      <div>
        <p className="text-sm font-semibold text-amber-900">Awaiting ED/COO Authorization</p>
        <p className="mt-0.5 text-sm text-amber-700">
          This run has been approved but requires authorization from the ED or COO before you can mark it as paid.
        </p>
      </div>
    </div>
  </SectionCard>
)}
{run.status === "authorized" && (
  <SectionCard title="Authorization">
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
      <span className="material-symbols-outlined text-green-600">verified</span>
      <div>
        <p className="text-sm font-semibold text-green-900">Authorized for Payment</p>
        <p className="mt-0.5 text-sm text-green-700">
          ED/COO authorization confirmed. You can now mark this run as paid.
        </p>
      </div>
    </div>
  </SectionCard>
)}
```

- [ ] **Step 3:** Add import for `downloadMonthlyBreakdown` and add an Export button in the `PageHeader` actions:

Add to imports:
```typescript
import { ..., downloadMonthlyBreakdown } from "@/shared/api/payroll-api";
```

In the `actions` section of PageHeader, add alongside the other action buttons:
```tsx
<Button
  size="sm"
  variant="secondary"
  disabled={acting === "export"}
  onClick={async () => {
    setActing("export");
    try {
      const result = await downloadMonthlyBreakdown(id!);
      const bytes = Uint8Array.from(atob(result.content_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: result.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", variant: "error" });
    } finally {
      setActing(null);
    }
  }}
>
  {acting === "export" ? "Exporting..." : "Export Breakdown"}
</Button>
```

- [ ] **Step 4:** Commit:

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx
git commit -m "feat(payroll): block Finance Pay until authorized, add export breakdown button"
```

---

## Task 6: HR — Update Run Detail with Export button

**File:** `apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx`

- [ ] **Step 1:** Add `downloadMonthlyBreakdown` import and an "Export Breakdown" button in the actions area. Apply the same download helper pattern as in Task 5 (inline `triggerDownload` logic). Show the button whenever `run.status` is not `draft` (i.e. items exist).

- [ ] **Step 2:** Commit:

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx
git commit -m "feat(payroll): add export breakdown button to HR run detail page"
```

---

## Task 7: Finance Settings — Salary Components CRUD

**File:** Create `apps/pwa/src/pages/finance/payroll/FinancePayrollComponentsPage.tsx`

- [ ] **Step 1:** Create the file:

```tsx
import { useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  SlideOver,
  SlideOverContent,
  SlideOverFooter,
  SlideOverHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  listPayrollComponents,
  createPayrollComponent,
  updatePayrollComponent,
  deletePayrollComponent,
  type PayrollComponent,
  type UpsertComponentPayload,
} from "@/shared/api/payroll-api";

const EMPTY_FORM: UpsertComponentPayload = {
  code: "",
  name: "",
  component_type: "earning",
  calculation_type: "fixed",
  amount: undefined,
  rate: undefined,
  taxable: false,
  statutory: false,
};

const COMPONENT_TYPE_TONE: Record<string, "success" | "danger" | "neutral"> = {
  earning: "success",
  deduction: "danger",
  employer_cost: "neutral",
};

export default function FinancePayrollComponentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listKey, setListKey] = useState(0);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpsertComponentPayload>(EMPTY_FORM);

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: componentsResp, loading } = useCachedQuery(
    `finance:payroll:components:${listKey}`,
    () => listPayrollComponents(),
    { ttlMs: 0, storage: "memory" },
  );

  const components = componentsResp?.items ?? [];

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  const openCreate = () => {
    setEditingComponent(null);
    setForm(EMPTY_FORM);
    setShowSlideOver(true);
  };

  const openEdit = (c: PayrollComponent) => {
    setEditingComponent(c);
    setForm({
      code: c.code,
      name: c.name,
      component_type: c.component_type,
      calculation_type: c.calculation_type,
      amount: c.amount ?? undefined,
      rate: c.rate ?? undefined,
      taxable: c.taxable,
      statutory: c.statutory,
    });
    setShowSlideOver(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      showToast({ tone: "warning", title: "Required fields", message: "Code and name are required." });
      return;
    }
    setSaving(true);
    try {
      if (editingComponent) {
        await updatePayrollComponent(editingComponent.id, form);
        showToast({ tone: "success", title: "Updated", message: `${form.name} updated.` });
      } else {
        await createPayrollComponent(form);
        showToast({ tone: "success", title: "Created", message: `${form.name} added.` });
      }
      setShowSlideOver(false);
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: PayrollComponent) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await deletePayrollComponent(c.id);
      showToast({ tone: "success", title: "Deleted", message: `${c.name} removed.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Delete failed", message: err instanceof Error ? err.message : "Unable to delete." });
    }
  };

  const setField = (key: keyof UpsertComponentPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-payroll-components"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Finance Staff" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Financial", path: "/finance" },
          { label: "Payroll Setup" },
          { label: "Salary Components" },
        ]}
        title="Salary Components"
        description="Define earnings, deductions, and employer costs used in payroll runs."
        action={
          <Button onClick={openCreate}>
            <Icon name="add" className="text-[18px]" />
            Add Component
          </Button>
        }
      />

      <SectionCard
        title="Components"
        description="Active salary components available for payroll calculation."
        action={
          components.length > 0 ? (
            <Button size="sm" onClick={openCreate}>
              <Icon name="add" className="text-[18px]" />
              Add
            </Button>
          ) : undefined
        }
      >
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : components.length ? (
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Calculation</TableHeaderCell>
                <TableHeaderCell>Amount / Rate</TableHeaderCell>
                <TableHeaderCell>Taxable</TableHeaderCell>
                <TableHeaderCell>Statutory</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {components.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{c.code}</code>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                  </TableCell>
                  <TableCell>
                    <Chip variant={COMPONENT_TYPE_TONE[c.component_type] ?? "neutral"}>
                      {c.component_type.replace("_", " ")}
                    </Chip>
                  </TableCell>
                  <TableCell className="capitalize">{c.calculation_type.replace("_", " ")}</TableCell>
                  <TableCell>
                    {c.calculation_type === "fixed" && c.amount != null
                      ? c.amount.toLocaleString()
                      : c.rate != null
                      ? `${c.rate}%`
                      : "-"}
                  </TableCell>
                  <TableCell>{c.taxable ? "Yes" : "No"}</TableCell>
                  <TableCell>{c.statutory ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Icon name="edit" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(c)}>
                        <Icon name="delete" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No components"
            description="Add salary components to use in payroll calculations."
            action={<Button onClick={openCreate}><Icon name="add" className="text-[18px]" />Add Component</Button>}
          />
        )}
      </SectionCard>

      <SlideOver open={showSlideOver} onClose={() => setShowSlideOver(false)} size="md">
        <SlideOverHeader
          title={editingComponent ? "Edit Component" : "Add Salary Component"}
          subtitle="Define how this component is calculated."
          onClose={() => setShowSlideOver(false)}
        />
        <SlideOverContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Code" value={form.code} onChange={setField("code")} placeholder="e.g. BASIC" />
              <TextField label="Name" value={form.name} onChange={setField("name")} placeholder="e.g. Basic Salary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Type" value={form.component_type} onChange={setField("component_type")}>
                <option value="earning">Earning</option>
                <option value="deduction">Deduction</option>
                <option value="employer_cost">Employer Cost</option>
              </SelectField>
              <SelectField label="Calculation" value={form.calculation_type} onChange={setField("calculation_type")}>
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="formula">Formula</option>
                <option value="manual">Manual</option>
              </SelectField>
            </div>
            {form.calculation_type === "fixed" && (
              <TextField label="Fixed Amount" type="number" value={String(form.amount ?? "")} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || undefined }))} placeholder="0.00" />
            )}
            {form.calculation_type === "percentage" && (
              <TextField label="Rate (%)" type="number" value={String(form.rate ?? "")} onChange={(e) => setForm((f) => ({ ...f, rate: Number(e.target.value) || undefined }))} placeholder="0.00" />
            )}
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Taxable" value={form.taxable ? "yes" : "no"} onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.value === "yes" }))}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </SelectField>
              <SelectField label="Statutory" value={form.statutory ? "yes" : "no"} onChange={(e) => setForm((f) => ({ ...f, statutory: e.target.value === "yes" }))}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </SelectField>
            </div>
          </div>
        </SlideOverContent>
        <SlideOverFooter>
          <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : editingComponent ? "Update" : "Add Component"}
          </Button>
        </SlideOverFooter>
      </SlideOver>
    </AppShell>
  );
}
```

- [ ] **Step 2:** Commit:

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollComponentsPage.tsx
git commit -m "feat(payroll): add FinancePayrollComponentsPage for salary component management"
```

---

## Task 8: Finance Settings — Tax Tables CRUD

**File:** Create `apps/pwa/src/pages/finance/payroll/FinancePayrollTaxTablesPage.tsx`

- [ ] **Step 1:** Create the file:

```tsx
import { useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  SlideOver,
  SlideOverContent,
  SlideOverFooter,
  SlideOverHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  listPayrollTaxTables,
  createPayrollTaxTable,
  updatePayrollTaxTable,
  type PayrollTaxTable,
  type TaxBand,
  type UpsertTaxTablePayload,
} from "@/shared/api/payroll-api";

const EMPTY_FORM: UpsertTaxTablePayload = {
  name: "",
  worker_type: "employee",
  effective_date: new Date().toISOString().slice(0, 10),
  currency: "NGN",
  bands: [{ from: 0, to: undefined, rate: 0 }],
};

export default function FinancePayrollTaxTablesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listKey, setListKey] = useState(0);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingTable, setEditingTable] = useState<PayrollTaxTable | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpsertTaxTablePayload>(EMPTY_FORM);

  const { data: profile } = useCachedQuery(
    "finance:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: tablesResp, loading } = useCachedQuery(
    `finance:payroll:tax-tables:${listKey}`,
    () => listPayrollTaxTables(),
    { ttlMs: 0, storage: "memory" },
  );

  const tables = tablesResp?.items ?? [];

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Finance Staff";

  const openCreate = () => {
    setEditingTable(null);
    setForm(EMPTY_FORM);
    setShowSlideOver(true);
  };

  const openEdit = (t: PayrollTaxTable) => {
    setEditingTable(t);
    setForm({
      name: t.name,
      worker_type: t.worker_type ?? "employee",
      effective_date: t.effective_date,
      currency: t.currency ?? "NGN",
      bands: t.bands,
    });
    setShowSlideOver(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast({ tone: "warning", title: "Required", message: "Name is required." });
      return;
    }
    setSaving(true);
    try {
      if (editingTable) {
        await updatePayrollTaxTable(editingTable.id, form);
        showToast({ tone: "success", title: "Updated", message: `${form.name} updated.` });
      } else {
        await createPayrollTaxTable(form);
        showToast({ tone: "success", title: "Created", message: `${form.name} created.` });
      }
      setShowSlideOver(false);
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setSaving(false);
    }
  };

  const addBand = () =>
    setForm((f) => ({
      ...f,
      bands: [...f.bands, { from: f.bands[f.bands.length - 1]?.to ?? 0, to: undefined, rate: 0 }],
    }));

  const removeBand = (idx: number) =>
    setForm((f) => ({ ...f, bands: f.bands.filter((_, i) => i !== idx) }));

  const updateBand = (idx: number, key: keyof TaxBand, value: string) =>
    setForm((f) => ({
      ...f,
      bands: f.bands.map((b, i) =>
        i === idx ? { ...b, [key]: value === "" ? undefined : Number(value) } : b,
      ),
    }));

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="finance-payroll-tax-tables"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Finance Staff" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Financial", path: "/finance" },
          { label: "Payroll Setup" },
          { label: "Tax Tables" },
        ]}
        title="Tax Tables"
        description="Progressive tax rate bands applied during payroll calculation."
        action={
          <Button onClick={openCreate}>
            <Icon name="add" className="text-[18px]" />
            Add Tax Table
          </Button>
        }
      />

      <SectionCard title="Tax Tables">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : tables.length ? (
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Worker Type</TableHeaderCell>
                <TableHeaderCell>Effective Date</TableHeaderCell>
                <TableHeaderCell>Currency</TableHeaderCell>
                <TableHeaderCell>Bands</TableHeaderCell>
                <TableHeaderCell>Active</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {tables.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                  </TableCell>
                  <TableCell className="capitalize">{t.worker_type ?? "-"}</TableCell>
                  <TableCell>{t.effective_date}</TableCell>
                  <TableCell>{t.currency ?? "-"}</TableCell>
                  <TableCell>{t.bands.length} band{t.bands.length !== 1 ? "s" : ""}</TableCell>
                  <TableCell>
                    <Chip variant={t.is_active ? "success" : "neutral"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Icon name="edit" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No tax tables"
            description="Add tax tables to apply progressive taxation in payroll."
            action={<Button onClick={openCreate}><Icon name="add" className="text-[18px]" />Add Tax Table</Button>}
          />
        )}
      </SectionCard>

      <SlideOver open={showSlideOver} onClose={() => setShowSlideOver(false)} size="lg">
        <SlideOverHeader
          title={editingTable ? "Edit Tax Table" : "Add Tax Table"}
          subtitle="Define progressive rate bands for this tax table."
          onClose={() => setShowSlideOver(false)}
        />
        <SlideOverContent>
          <div className="grid gap-4">
            <TextField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. PAYE 2026" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Worker Type" value={form.worker_type ?? "employee"} onChange={(e) => setForm((f) => ({ ...f, worker_type: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="consultant">Consultant</option>
              </SelectField>
              <TextField label="Currency" value={form.currency ?? "NGN"} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="NGN" />
            </div>
            <TextField label="Effective Date" type="date" value={form.effective_date} onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))} />

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">Rate Bands</p>
            <div className="grid gap-2">
              {form.bands.map((band, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <TextField label="From" type="number" value={String(band.from)} onChange={(e) => updateBand(idx, "from", e.target.value)} />
                  <TextField label="To (blank = no limit)" type="number" value={String(band.to ?? "")} onChange={(e) => updateBand(idx, "to", e.target.value)} />
                  <TextField label="Rate (%)" type="number" value={String(band.rate)} onChange={(e) => updateBand(idx, "rate", e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => removeBand(idx)} disabled={form.bands.length <= 1}>
                    <Icon name="remove" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addBand}>
                <Icon name="add" className="text-[18px]" />
                Add Band
              </Button>
            </div>
          </div>
        </SlideOverContent>
        <SlideOverFooter>
          <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : editingTable ? "Update" : "Add Tax Table"}
          </Button>
        </SlideOverFooter>
      </SlideOver>
    </AppShell>
  );
}
```

- [ ] **Step 2:** Commit:

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollTaxTablesPage.tsx
git commit -m "feat(payroll): add FinancePayrollTaxTablesPage for progressive tax band management"
```

---

## Task 9: HR — Worker Detail Page

**File:** Create `apps/pwa/src/pages/hr/payroll/HrPayrollWorkerDetailPage.tsx`

- [ ] **Step 1:** Create the file. This page shows a single worker's full profile (retrieved via `getPayrollWorker`) plus their active loans. It also links to editing the worker (via the existing `HrPayrollWorkersPage` slide-over — navigate back).

```tsx
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
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { getPayrollWorker, listLoans } from "@/shared/api/payroll-api";

export default function HrPayrollWorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: worker, loading: workerLoading } = useCachedQuery(
    `hr:payroll:worker:${id}`,
    () => getPayrollWorker(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: loansResp, loading: loansLoading } = useCachedQuery(
    `hr:payroll:worker:${id}:loans`,
    () => listLoans({ worker_id: id! }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const loans = loansResp?.items ?? [];
  const activeLoans = loans.filter((l) => l.status === "active");

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  if (workerLoading) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="hr-payroll-workers" user={{ name: userName, role: "HR Staff" }} mobileNav={buildAppMobileNav("HR")}>
        <div className="p-8 text-sm text-slate-500">Loading...</div>
      </AppShell>
    );
  }

  if (!worker) {
    return (
      <AppShell navigation={buildAppNavigation()} activeLabel="hr-payroll-workers" user={{ name: userName, role: "HR Staff" }} mobileNav={buildAppMobileNav("HR")}>
        <EmptyState title="Worker not found" description="This payroll worker does not exist." />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll-workers"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "HR", path: "/hr" },
          { label: "Payroll", path: "/hr/payroll" },
          { label: "Workers", path: "/hr/payroll/workers" },
          { label: worker.full_name ?? worker.name },
        ]}
        title={worker.full_name ?? worker.name}
        description={`${worker.worker_type} · ${worker.currency ?? "NGN"}`}
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate("/hr/payroll/workers")}>
            Back to Workers
          </Button>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Status" value={worker.status ?? "active"} tone={worker.status === "active" ? "success" : "neutral"} icon="person" />
          <StatCard label="Type" value={worker.worker_type} tone="neutral" icon="badge" />
          <StatCard label="Active Loans" value={String(activeLoans.length)} tone={activeLoans.length > 0 ? "warning" : "neutral"} icon="credit_card" />
        </div>

        <SectionCard title="Profile">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-3">
            {[
              ["Full Name", worker.full_name ?? worker.name],
              ["Email", worker.email ?? "-"],
              ["Staff Code", worker.staff_code ?? "-"],
              ["Currency", worker.currency ?? "NGN"],
              ["Pay Basis", (worker as any).pay_basis ?? "-"],
              ["Start Date", (worker as any).start_date ?? "-"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Bank Details">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-3">
            {[
              ["Bank Name", (worker as any).bank_name ?? "-"],
              ["Account Name", (worker as any).bank_account_name ?? "-"],
              ["Account Number", (worker as any).bank_account_number ?? "-"],
              ["Tax ID (TIN)", (worker as any).tax_identifier ?? "-"],
              ["Pension ID (PFA)", (worker as any).pension_identifier ?? "-"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard
          title="Loans"
          description="Active and past loans for this worker."
          action={
            <Button size="sm" onClick={() => navigate("/hr/payroll/loans")}>
              Manage Loans
            </Button>
          }
        >
          {loansLoading ? (
            <div className="text-sm text-slate-500">Loading loans...</div>
          ) : loans.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Principal</TableHeaderCell>
                  <TableHeaderCell>Balance</TableHeaderCell>
                  <TableHeaderCell>Monthly Recovery</TableHeaderCell>
                  <TableHeaderCell>Issued</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{`${loan.currency ?? "NGN"} ${loan.principal?.toLocaleString()}`}</TableCell>
                    <TableCell>{`${loan.currency ?? "NGN"} ${loan.balance?.toLocaleString()}`}</TableCell>
                    <TableCell>{`${loan.currency ?? "NGN"} ${loan.monthly_recovery?.toLocaleString()}`}</TableCell>
                    <TableCell>{loan.issued_date}</TableCell>
                    <TableCell>
                      <Chip variant={loan.status === "active" ? "success" : "neutral"}>{loan.status}</Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No loans" description="No loans recorded for this worker." />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2:** Also update `HrPayrollWorkersPage.tsx` table rows to link to the worker detail page. In the table row, make the worker name a clickable link:

Find the worker name cell in `HrPayrollWorkersPage.tsx`:
```tsx
<TableCell>
  <p className="font-semibold text-slate-900">{w.full_name ?? w.name}</p>
```

Replace with:
```tsx
<TableCell>
  <button
    className="font-semibold text-slate-900 hover:text-brand-700 text-left"
    onClick={() => navigate(`/hr/payroll/workers/${w.id}`)}
  >
    {w.full_name ?? w.name}
  </button>
```

Add `useNavigate` import and hook if not already present.

- [ ] **Step 3:** Commit:

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollWorkerDetailPage.tsx apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx
git commit -m "feat(payroll): add worker detail page with profile, bank details, and loan summary"
```

---

## Task 10: HR — Loan Management Page

**File:** Create `apps/pwa/src/pages/hr/payroll/HrPayrollLoansPage.tsx`

- [ ] **Step 1:** Create the file:

```tsx
import { useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  SlideOver,
  SlideOverContent,
  SlideOverFooter,
  SlideOverHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  listLoans,
  createLoan,
  updateLoan,
  listPayrollWorkers,
  type PayrollLoan,
  type UpsertLoanPayload,
} from "@/shared/api/payroll-api";

const EMPTY_FORM: UpsertLoanPayload = {
  worker_id: "",
  principal: 0,
  monthly_recovery: 0,
  issued_date: new Date().toISOString().slice(0, 10),
  expected_end_date: "",
  currency: "NGN",
  notes: "",
};

export default function HrPayrollLoansPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listKey, setListKey] = useState(0);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingLoan, setEditingLoan] = useState<PayrollLoan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpsertLoanPayload>(EMPTY_FORM);

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: loansResp, loading } = useCachedQuery(
    `hr:payroll:loans:${listKey}`,
    () => listLoans({ per_page: 200 }),
    { ttlMs: 0, storage: "memory" },
  );

  const { data: workersResp } = useCachedQuery(
    "hr:payroll:workers:select",
    () => listPayrollWorkers({ per_page: 200 }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const loans = loansResp?.items ?? [];
  const workers = workersResp?.items ?? [];

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  const openCreate = () => {
    setEditingLoan(null);
    setForm(EMPTY_FORM);
    setShowSlideOver(true);
  };

  const openEdit = (loan: PayrollLoan) => {
    setEditingLoan(loan);
    setForm({
      worker_id: loan.worker_id,
      principal: loan.principal,
      monthly_recovery: loan.monthly_recovery,
      issued_date: loan.issued_date,
      expected_end_date: loan.expected_end_date ?? "",
      currency: loan.currency ?? "NGN",
    });
    setShowSlideOver(true);
  };

  const handleSave = async () => {
    if (!form.worker_id || !form.principal || !form.monthly_recovery) {
      showToast({ tone: "warning", title: "Required fields", message: "Worker, principal, and monthly recovery are required." });
      return;
    }
    setSaving(true);
    try {
      if (editingLoan) {
        await updateLoan(editingLoan.id, form);
        showToast({ tone: "success", title: "Updated", message: "Loan updated." });
      } else {
        await createLoan(form);
        showToast({ tone: "success", title: "Created", message: "Loan recorded." });
      }
      setShowSlideOver(false);
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-payroll-loans"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "HR", path: "/hr" },
          { label: "Payroll", path: "/hr/payroll" },
          { label: "Loans" },
        ]}
        title="Payroll Loans"
        description="Track salary advance loans and their monthly deduction schedule."
        action={
          <Button onClick={openCreate}>
            <Icon name="add" className="text-[18px]" />
            Add Loan
          </Button>
        }
      />

      <SectionCard
        title="All Loans"
        action={
          loans.length > 0 ? (
            <Button size="sm" onClick={openCreate}>
              <Icon name="add" className="text-[18px]" />
              Add Loan
            </Button>
          ) : undefined
        }
      >
        {loading ? (
          <div className="text-sm text-slate-500">Loading loans...</div>
        ) : loans.length ? (
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Worker</TableHeaderCell>
                <TableHeaderCell>Principal</TableHeaderCell>
                <TableHeaderCell>Balance</TableHeaderCell>
                <TableHeaderCell>Monthly Recovery</TableHeaderCell>
                <TableHeaderCell>Issued</TableHeaderCell>
                <TableHeaderCell>Expected End</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{loan.worker_name ?? loan.worker_id}</p>
                  </TableCell>
                  <TableCell>{`${loan.currency ?? "NGN"} ${loan.principal?.toLocaleString()}`}</TableCell>
                  <TableCell>{`${loan.currency ?? "NGN"} ${loan.balance?.toLocaleString()}`}</TableCell>
                  <TableCell>{`${loan.currency ?? "NGN"} ${loan.monthly_recovery?.toLocaleString()}`}</TableCell>
                  <TableCell>{loan.issued_date}</TableCell>
                  <TableCell>{loan.expected_end_date ?? "-"}</TableCell>
                  <TableCell>
                    <Chip variant={loan.status === "active" ? "success" : "neutral"}>{loan.status}</Chip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(loan)}>
                      <Icon name="edit" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No loans"
            description="Record salary advance loans to track deductions."
            action={<Button onClick={openCreate}><Icon name="add" className="text-[18px]" />Add Loan</Button>}
          />
        )}
      </SectionCard>

      <SlideOver open={showSlideOver} onClose={() => setShowSlideOver(false)} size="md">
        <SlideOverHeader
          title={editingLoan ? "Edit Loan" : "Add Loan"}
          subtitle="Record a salary advance loan for automatic monthly deduction."
          onClose={() => setShowSlideOver(false)}
        />
        <SlideOverContent>
          <div className="grid gap-4">
            <SelectField label="Worker" value={form.worker_id} onChange={(e) => setForm((f) => ({ ...f, worker_id: e.target.value }))}>
              <option value="">Select worker...</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.full_name ?? (w as any).name}</option>
              ))}
            </SelectField>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Principal Amount" type="number" value={String(form.principal)} onChange={(e) => setForm((f) => ({ ...f, principal: Number(e.target.value) }))} />
              <TextField label="Monthly Recovery" type="number" value={String(form.monthly_recovery)} onChange={(e) => setForm((f) => ({ ...f, monthly_recovery: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Issued Date" type="date" value={form.issued_date} onChange={(e) => setForm((f) => ({ ...f, issued_date: e.target.value }))} />
              <TextField label="Expected End Date" type="date" value={form.expected_end_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, expected_end_date: e.target.value || undefined }))} />
            </div>
            <TextField label="Currency" value={form.currency ?? "NGN"} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="NGN" />
          </div>
        </SlideOverContent>
        <SlideOverFooter>
          <Button variant="secondary" onClick={() => setShowSlideOver(false)}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : editingLoan ? "Update" : "Add Loan"}
          </Button>
        </SlideOverFooter>
      </SlideOver>
    </AppShell>
  );
}
```

- [ ] **Step 2:** Commit:

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollLoansPage.tsx
git commit -m "feat(payroll): add HrPayrollLoansPage for loan management"
```

---

## Task 11: Navigation + Routes

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/App.tsx`

### Step 11a: Update navigation

- [ ] In `apps/pwa/src/shared/navigation.ts`, update the HR Payroll group to include Loans:

Find:
```typescript
{
  key: "hr-payroll-group",
  label: "Payroll",
  icon: "payments",
  permissions: ["payroll.manage"],
  children: [
    { key: "hr-payroll", label: "Payroll Runs", icon: "receipt_long", path: "/hr/payroll" },
    { key: "hr-payroll-workers", label: "Workers", icon: "group", path: "/hr/payroll/workers" },
  ],
},
```

Replace with:
```typescript
{
  key: "hr-payroll-group",
  label: "Payroll",
  icon: "payments",
  permissions: ["payroll.manage"],
  children: [
    { key: "hr-payroll", label: "Payroll Runs", icon: "receipt_long", path: "/hr/payroll" },
    { key: "hr-payroll-workers", label: "Workers", icon: "group", path: "/hr/payroll/workers" },
    { key: "hr-payroll-loans", label: "Loans", icon: "credit_card", path: "/hr/payroll/loans" },
  ],
},
```

- [ ] Add Administration → Payroll Authorization entry (after `admin-settings`):

Find the Administration section children array and add:
```typescript
{ key: "admin-payroll-auth", label: "Payroll Authorization", icon: "verified", path: "/admin/payroll/authorization", permissions: ["payroll.authorize"] },
```

- [ ] Add Finance → Payroll Setup group for components and tax tables. In the Finance section, find `finance-group-setup` children and add:

```typescript
{ key: "finance-payroll-components", label: "Salary Components", icon: "tune", path: "/finance/payroll/components", permissions: ["finance.manage"] },
{ key: "finance-payroll-tax-tables", label: "Tax Tables", icon: "percent", path: "/finance/payroll/tax-tables", permissions: ["finance.manage"] },
```

### Step 11b: Register routes in App.tsx

- [ ] Add imports:

```typescript
import AdminPayrollAuthorizationPage from "@/pages/admin/payroll/AdminPayrollAuthorizationPage";
import AdminPayrollRunAuthorizePage from "@/pages/admin/payroll/AdminPayrollRunAuthorizePage";
import FinancePayrollComponentsPage from "@/pages/finance/payroll/FinancePayrollComponentsPage";
import FinancePayrollTaxTablesPage from "@/pages/finance/payroll/FinancePayrollTaxTablesPage";
import HrPayrollWorkerDetailPage from "@/pages/hr/payroll/HrPayrollWorkerDetailPage";
import HrPayrollLoansPage from "@/pages/hr/payroll/HrPayrollLoansPage";
```

- [ ] Add Admin routes (in the admin PermissionRoute block):

```tsx
<Route path="/admin/payroll/authorization" element={<AdminPayrollAuthorizationPage />} />
<Route path="/admin/payroll/authorize/:id" element={<AdminPayrollRunAuthorizePage />} />
```

- [ ] Add Finance payroll setup routes (in the finance PermissionRoute block):

```tsx
<Route path="/finance/payroll/components" element={<FinancePayrollComponentsPage />} />
<Route path="/finance/payroll/tax-tables" element={<FinancePayrollTaxTablesPage />} />
```

- [ ] Add HR payroll routes (in the HR PermissionRoute block, after existing payroll routes):

```tsx
<Route path="/hr/payroll/workers/:id" element={<HrPayrollWorkerDetailPage />} />
<Route path="/hr/payroll/loans" element={<HrPayrollLoansPage />} />
```

- [ ] Verify TypeScript:

```bash
cd apps/pwa && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx
git commit -m "feat(payroll): wire all new payroll routes and nav entries"
```

---

## Task 12: Employee — Enhanced Payslips with PDF Download

**File:** `apps/pwa/src/pages/profile/MyPayslipsPage.tsx` (create if not exists, or update existing)

- [ ] **Step 1:** Check if `MyPayslipsPage.tsx` exists at `apps/pwa/src/pages/profile/`. If it does not, create it. If it exists, update it to add:

1. Per-payslip "Download PDF" button that calls `downloadMyPayslip(runId, itemId)` from `payroll-api.ts`
2. Expanded row or slide-over showing earnings / deductions / employer costs breakdown when clicking a payslip

The download function already exists: `downloadMyPayslip` returns `{ file_name, mime_type, content_base64 }`. Use the same `triggerDownload` helper pattern from Task 4b.

For detailed component display: call `getMyPayslipDetails(runId, itemId)` which returns `PayslipDetail` with `earnings[]`, `deductions[]`, `employer_costs[]` arrays.

- [ ] **Step 2:** If a `MyPayslipsPage` slide-over for breakdown doesn't exist, create it inline with a `SlideOver` showing:

```tsx
// In the slide-over content:
<div className="grid gap-4">
  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Earnings</p>
  {payslipDetail.earnings.map((e) => (
    <div key={e.label} className="flex justify-between text-sm">
      <span className="text-slate-700">{e.label}</span>
      <span className="font-semibold text-slate-900">
        {formatCurrency(e.amount, payslipDetail.currency)}
      </span>
    </div>
  ))}
  
  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">Deductions</p>
  {payslipDetail.deductions.map((d) => (
    <div key={d.label} className="flex justify-between text-sm">
      <span className="text-slate-700">{d.label}</span>
      <span className="font-semibold text-red-700">
        ({formatCurrency(d.amount, payslipDetail.currency)})
      </span>
    </div>
  ))}
  
  <div className="border-t pt-3 flex justify-between font-semibold">
    <span>Net Pay</span>
    <span className="text-green-700">
      {formatCurrency(payslipDetail.net_pay, payslipDetail.currency)}
    </span>
  </div>
</div>
```

- [ ] **Step 3:** Commit:

```bash
git add apps/pwa/src/pages/profile/
git commit -m "feat(payroll): enhance employee payslips with detailed breakdown and PDF download"
```

---

## Task 13: Email + In-App Notifications for Every Payroll Event

**File:** `api/src/modules/payroll/payroll.service.ts` only.

### What already works (do not duplicate)

| Event | Already notified |
|---|---|
| `submitRun` | `preparedById`, `reviewedById`, `approvedById` — type `payroll.run.submitted` |
| `reviewRun` | `preparedById` only — type `payroll.run.reviewed` |
| `approveRun` | `preparedById` only — type `payroll.run.approved` |
| `payRun` | `preparedById` only — type `payroll.run.paid` |
| Payslip distribution | Each worker individually — type `payroll.payslip.sent` ✅ |

### What is missing

| Event | Who should be notified | Gap |
|---|---|---|
| HR submits run | All Finance approvers (`payroll.approve`) | Not notified — Finance has no idea a run landed |
| Finance approves run | All ED/COO authorizers (`payroll.authorize`) | Not notified — they never know it needs sign-off |
| ED/COO authorizes run | All Finance approvers (`payroll.approve`) + `preparedById` | `authorizeRun` is new, has zero notifications |
| Payroll paid/closed | HR manager (`preparedById`) + Finance + ED/COO | Only `preparedById` is notified; rest are silent |
| New payslip available | Individual staff member | ✅ Already handled by payslip distribution |

### Step 13a: Add `getUsersWithPermission` helper

- [ ] In `payroll.service.ts`, add a private helper method. Find the `createPayrollNotification` private method and add this immediately after it:

```typescript
private async getUsersWithPermission(permissionSlug: string): Promise<string[]> {
  // Users who hold this permission via any of their roles
  const users = await this.prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            rolePermissions: {
              some: {
                permission: { slug: permissionSlug },
              },
            },
          },
        },
      },
      isActive: true,
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
```

> **Schema note:** The Prisma relation names (`userRoles`, `rolePermissions`, `permission`) must match your actual schema. Check `schema.prisma` for the correct relation names. Common alternatives: `UserRole` → `user_roles`, `RolePermission` → `role_permissions`. Also check whether `isActive` is the correct field name for filtering active users (may be `status: 'active'` or similar).

### Step 13b: Notify Finance when HR submits

- [ ] In `submitRun()`, after the existing `notifyRunStakeholders(...)` call, add:

```typescript
// Notify all Finance approvers that a new run is waiting for review
const financeApprovers = await this.getUsersWithPermission('payroll.approve');
await Promise.all(
  financeApprovers
    .filter((uid) => uid !== actorId)
    .map((uid) =>
      this.createPayrollNotification(uid, 'approvals', {
        type: 'payroll.run.submitted',
        title: 'New payroll run submitted',
        message: `${run.name} (${periodLabel}) has been submitted by HR and is ready for your review.`,
        link: `/finance/payroll/runs/${run.id}`,
        notifiableType: 'payroll_run',
        notifiableId: run.id,
      }),
    ),
);
```

Where `periodLabel` is the month+year string — build it the same way the existing `submitRun` code formats periods (e.g. `${MONTH_NAMES[run.month]} ${run.year}` or however it's done in that method).

### Step 13c: Notify ED/COO when Finance approves

- [ ] In `approveRun()`, after the existing `notifyRunStakeholders(...)` call, add:

```typescript
// Notify all ED/COO authorizers that a run is awaiting their authorization
const authorizers = await this.getUsersWithPermission('payroll.authorize');
await Promise.all(
  authorizers
    .filter((uid) => uid !== actorId)
    .map((uid) =>
      this.createPayrollNotification(uid, 'approvals', {
        type: 'payroll.run.awaiting_authorization',
        title: 'Payroll run awaiting your authorization',
        message: `${run.name} (${periodLabel}) has been approved by Finance and requires your authorization before payment can proceed.`,
        link: `/admin/payroll/authorize/${run.id}`,
        notifiableType: 'payroll_run',
        notifiableId: run.id,
      }),
    ),
);
```

### Step 13d: Notify Finance + HR when ED/COO authorizes

- [ ] In the new `authorizeRun()` method added in Task 1, after saving the run, add notification calls:

```typescript
// 1. Notify Finance approvers — they can now pay
const financeApprovers = await this.getUsersWithPermission('payroll.approve');
await Promise.all(
  financeApprovers
    .filter((uid) => uid !== actorId)
    .map((uid) =>
      this.createPayrollNotification(uid, 'approvals', {
        type: 'payroll.run.authorized',
        title: 'Payroll run authorized — ready to pay',
        message: `${run.name} (${periodLabel}) has been authorized by ${actorName}. You can now proceed with payment.`,
        link: `/finance/payroll/runs/${run.id}`,
        notifiableType: 'payroll_run',
        notifiableId: run.id,
      }),
    ),
);

// 2. Notify the HR preparer so they know authorization is done
if (run.preparedById && run.preparedById !== actorId) {
  await this.createPayrollNotification(run.preparedById, 'run_updates', {
    type: 'payroll.run.authorized',
    title: 'Payroll run authorized',
    message: `${run.name} (${periodLabel}) has been authorized. Finance will proceed with payment shortly.`,
    link: `/hr/payroll/runs/${run.id}`,
    notifiableType: 'payroll_run',
    notifiableId: run.id,
  });
}
```

> **`actorName` note:** Resolve the actor's display name before the notifications block:
> ```typescript
> const actorUser = await this.prisma.user.findUnique({ where: { id: actorId }, select: { first_name: true, last_name: true } });
> const actorName = [actorUser?.first_name, actorUser?.last_name].filter(Boolean).join(' ') || 'ED/COO';
> ```

### Step 13e: Notify HR, Finance, and ED/COO when payroll is paid

- [ ] In `payRun()`, after the existing `notifyRunStakeholders(...)` call, add:

```typescript
// Notify HR managers, Finance approvers, and ED/COO authorizers that payroll is done
const [hrManagers, financeApprovers, authorizers] = await Promise.all([
  this.getUsersWithPermission('payroll.manage'),
  this.getUsersWithPermission('payroll.approve'),
  this.getUsersWithPermission('payroll.authorize'),
]);

const allStakeholders = [...new Set([...hrManagers, ...financeApprovers, ...authorizers])];

await Promise.all(
  allStakeholders
    .filter((uid) => uid !== actorId)
    .map((uid) =>
      this.createPayrollNotification(uid, 'run_updates', {
        type: 'payroll.run.paid',
        title: 'Payroll has been paid',
        message: `${run.name} (${periodLabel}) has been marked as paid. ${run.worker_count ?? ''} workers' payslips are being distributed.`,
        link: uid === run.preparedById
          ? `/hr/payroll/runs/${run.id}`
          : `/finance/payroll/runs/${run.id}`,
        notifiableType: 'payroll_run',
        notifiableId: run.id,
      }),
    ),
);
```

> The existing `payRun` already notifies `preparedById` via `notifyRunStakeholders`. The deduplication via `Set` above avoids double-sending to the preparer — but since `notifyRunStakeholders` uses `onlyPreparedBy: true`, the stakeholders call only hits `preparedById`, so the `Set` union cleanly covers everyone else.

### Step 13f: Staff notified when their payslip is available

- [ ] This is **already handled** by the existing payslip distribution loop — each worker receives a `payroll.payslip.sent` in-app notification and email with their payslip PDF attached. No changes needed here. ✅

### Step 13g: Verify + Commit

- [ ] Compile the API:

```bash
cd api && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add api/src/modules/payroll/payroll.service.ts
git commit -m "feat(payroll): add role-based email+in-app notifications for all payroll workflow events"
```

---

### Notification summary table (post-implementation)

| Trigger | Who gets notified | Channel |
|---|---|---|
| HR submits run | All `payroll.approve` users (Finance team) | Email + in-app |
| Finance marks reviewed | HR preparer (`preparedById`) | Email + in-app |
| Finance approves run | HR preparer + all `payroll.authorize` users (ED/COO) | Email + in-app |
| ED/COO authorizes run | All `payroll.approve` users (Finance) + HR preparer | Email + in-app |
| Finance marks as paid | All `payroll.manage` + `payroll.approve` + `payroll.authorize` | Email + in-app |
| Finance rejects run | HR preparer | Email + in-app |
| Finance closes run | HR preparer | Email + in-app |
| Payslip distributed | Individual staff member (their own payslip) | Email (PDF attached) + in-app |

Delivery channel (email vs in-app only) is controlled per-user via `/payroll/notification-preferences` — users can opt out of email for any category without losing in-app notifications.

---

## Task 14: Per-Step Revert (Send Back)

Every active step in the state machine can be sent back one level. `reject` remains the "hard stop" path; `sendBack` is the "please fix and resubmit" path.

**Revert map:**

| Current status | Reverts to | Permission required | Reason |
|---|---|---|---|
| `prepared` | `draft` | `payroll.manage` | HR recalls before Finance has seen it |
| `under_review` | `prepared` | `payroll.approve` | Finance returns to HR — needs correction |
| `approved` | `under_review` | `payroll.approve` | Finance steps back their own approval |
| `authorized` | `approved` | `payroll.authorize` | ED/COO revokes their own authorization |
| `closed` | `paid` | `payroll.approve` | Finance reopens a closed run |

`paid` cannot be reverted — money has been disbursed.

> **Status name note:** The actual backend status names differ from the plan's earlier documentation. Canonical names: `draft → prepared → under_review → approved → authorized → paid → closed`. The new `authorized` status was added in Task 1.

---

### Step 14a: Backend — `sendBackRun` service method

**File:** `api/src/modules/payroll/payroll.service.ts`

- [ ] Add `sendBackRun` after the existing `reopenRun` method:

```typescript
async sendBackRun(id: string, dto: { note?: string }, actorId: string) {
  const run = await this.prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw new NotFoundException('Payroll run not found');

  const REVERT_MAP: Record<string, string> = {
    prepared:    'draft',
    under_review: 'prepared',
    approved:    'under_review',
    authorized:  'approved',
    closed:      'paid',
  };

  const nextStatus = REVERT_MAP[run.status];
  if (!nextStatus) {
    throw new BadRequestException(
      `Runs with status "${run.status}" cannot be sent back.`,
    );
  }

  const updatedRun = await this.prisma.payrollRun.update({
    where: { id },
    data: {
      status: nextStatus,
      notes: this.appendRunNote(
        run.notes,
        `Sent back to ${nextStatus}`,
        dto.note,
        actorId,
      ),
    },
  });

  await this.recordRunEvent(
    id,
    'sent_back',
    actorId,
    dto.note || `Sent back from ${run.status} to ${nextStatus}`,
  );

  // Notify whoever owns the step we're returning to
  await this.notifySendBack(run, nextStatus, dto.note, actorId);

  return this.getRun(id);
}

private async notifySendBack(
  run: any,
  nextStatus: string,
  note: string | undefined,
  actorId: string,
) {
  const periodLabel = this.formatPeriodLabel(run);
  const noteText = note ? ` Note: "${note}"` : '';

  // When Finance sends back to HR (prepared) — notify HR preparer
  if (nextStatus === 'prepared' && run.preparedById && run.preparedById !== actorId) {
    await this.createPayrollNotification(run.preparedById, 'run_updates', {
      type: 'payroll.run.sent_back',
      title: 'Payroll run returned for correction',
      message: `${run.name} (${periodLabel}) has been sent back for your review.${noteText}`,
      link: `/hr/payroll/runs/${run.id}`,
      notifiableType: 'payroll_run',
      notifiableId: run.id,
    });
  }

  // When HR recalls to draft (from prepared) — no one else to notify
  // When Finance revokes approval (approved → under_review) — notify ED/COO if they were
  // previously notified, but since they haven't acted yet no action needed

  // When ED/COO revokes authorization (authorized → approved) — notify Finance approvers
  if (nextStatus === 'approved') {
    const financeApprovers = await this.getUsersWithPermission('payroll.approve');
    await Promise.all(
      financeApprovers
        .filter((uid) => uid !== actorId)
        .map((uid) =>
          this.createPayrollNotification(uid, 'approvals', {
            type: 'payroll.run.authorization_revoked',
            title: 'Payroll authorization revoked',
            message: `${run.name} (${periodLabel}) authorization has been revoked and returned to approved state.${noteText} The run will need to be re-authorized before payment.`,
            link: `/finance/payroll/runs/${run.id}`,
            notifiableType: 'payroll_run',
            notifiableId: run.id,
          }),
        ),
    );
  }
}
```

> **`formatPeriodLabel` note:** Use the same month+year formatting helper already present in the service for `notifyRunStakeholders`. If it is inlined rather than a method, extract the pattern (e.g. `${MONTH_NAMES[run.month]} ${run.year}`) directly.

---

### Step 14b: Backend — controller endpoint

**File:** `api/src/modules/payroll/payroll.controller.ts`

- [ ] Add the `sendBack` endpoint. The permission must be checked per-status inside the service, but the controller guard must allow any of the three permission holders to reach the endpoint. Add after `reopenRun`:

```typescript
@Post('runs/:id/send-back')
@Permissions('payroll.manage', 'payroll.approve', 'payroll.authorize')
sendBackRun(
  @Req() req: any,
  @Param('id') id: string,
  @Body() dto: ReviewPayrollRunDto,
) {
  return this.payrollService.sendBackRun(id, dto, req.user?.id);
}
```

> **Permission enforcement inside the service:** The service must validate that the actor's permission matches the current run status before executing the revert. Add this block at the top of `sendBackRun`, before the `REVERT_MAP` lookup:

```typescript
// Validate actor has permission to send back this specific status
const actorUser = await this.prisma.user.findUnique({
  where: { id: actorId },
  include: {
    userRoles: {
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    },
  },
});
const actorPermissions = new Set(
  actorUser?.userRoles?.flatMap((ur: any) =>
    ur.role?.rolePermissions?.map((rp: any) => rp.permission?.slug),
  ) ?? [],
);

const REQUIRED_PERMISSION: Record<string, string> = {
  prepared:     'payroll.manage',
  under_review: 'payroll.approve',
  approved:     'payroll.approve',
  authorized:   'payroll.authorize',
  closed:       'payroll.approve',
};

const required = REQUIRED_PERMISSION[run.status];
if (!required || !actorPermissions.has(required)) {
  throw new ForbiddenException(
    `You do not have permission to send back a run with status "${run.status}".`,
  );
}
```

> Add `ForbiddenException` to the NestJS imports at the top of the file if not already present.

- [ ] Compile the API:

```bash
cd api && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add api/src/modules/payroll/payroll.controller.ts api/src/modules/payroll/payroll.service.ts
git commit -m "feat(payroll): add sendBackRun — per-step revert with role-gated permission check"
```

---

### Step 14c: Frontend API

**File:** `apps/pwa/src/shared/api/payroll-api.ts`

- [ ] Add `sendBackPayrollRun` after `authorizePayrollRun`:

```typescript
export async function sendBackPayrollRun(id: string, payload?: { note?: string }) {
  const res = await httpRequest<any>(`/payroll/runs/${id}/send-back`, {
    method: "POST",
    body: payload ?? {},
  });
  return (res?.data ?? res) as PayrollRunDetail;
}
```

- [ ] Commit:

```bash
git add apps/pwa/src/shared/api/payroll-api.ts
git commit -m "feat(payroll): add sendBackPayrollRun to payroll-api"
```

---

### Step 14d: HR Run Detail — "Recall" button

**File:** `apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx`

HR can pull back a `prepared` run to `draft` as long as Finance hasn't acted on it.

- [ ] Add `sendBackPayrollRun` to the imports from `payroll-api`.

- [ ] Add `canRecall` condition alongside the existing `canGenerate`/`canSubmit` flags:

```typescript
const canRecall = run.status === "prepared"; // HR pulls back before Finance reviews
```

- [ ] Add the Recall button in the actions area:

```tsx
{canRecall && (
  <Button
    size="sm"
    variant="ghost"
    requiredPermissions={["payroll.manage"]}
    disabled={acting === "recall"}
    onClick={async () => {
      const note = prompt("Reason for recalling? (optional)") ?? undefined;
      setActing("recall");
      try {
        await sendBackPayrollRun(id!, { note });
        showToast({ tone: "success", title: "Recalled", message: "Run returned to draft. Make your changes and resubmit." });
        refetch();
      } catch {
        showToast({ tone: "danger", title: "Recall failed", message: "Unable to recall run." });
      } finally {
        setActing(null);
      }
    }}
  >
    {acting === "recall" ? "Recalling..." : "Recall"}
  </Button>
)}
```

> Replace `prompt()` with a `TextField` inside a confirmation `SlideOver` or `Dialog` if the project has a confirmation modal component.

- [ ] Commit:

```bash
git add apps/pwa/src/pages/hr/payroll/HrPayrollRunDetailPage.tsx
git commit -m "feat(payroll): add Recall button on HR run detail for prepared → draft revert"
```

---

### Step 14e: Finance Run Detail — "Send Back" and "Revoke Approval" buttons

**File:** `apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx`

- [ ] Add `sendBackPayrollRun` to the imports.

- [ ] Add two new conditions alongside the existing `canReview`/`canApprove`/`canPay` flags:

```typescript
const canSendBack = run.status === "under_review";  // Finance returns to HR
const canRevokeApproval = run.status === "approved"; // Finance steps back their own approval
```

- [ ] Add the buttons in the actions area (alongside Approve, Reject, Pay, etc.):

```tsx
{canSendBack && (
  <Button
    size="sm"
    variant="ghost"
    requiredPermissions={["payroll.approve"]}
    disabled={acting === "send-back"}
    onClick={() =>
      act(
        "send-back",
        async () => {
          const note = prompt("Reason for returning to HR? (optional)") ?? undefined;
          return sendBackPayrollRun(id!, { note });
        },
        "Run returned to HR for correction",
      )
    }
  >
    {acting === "send-back" ? "Returning..." : "Return to HR"}
  </Button>
)}
{canRevokeApproval && (
  <Button
    size="sm"
    variant="ghost"
    requiredPermissions={["payroll.approve"]}
    disabled={acting === "revoke-approval"}
    onClick={() =>
      act(
        "revoke-approval",
        async () => {
          const note = prompt("Reason for revoking approval? (optional)") ?? undefined;
          return sendBackPayrollRun(id!, { note });
        },
        "Approval revoked — run returned to under review",
      )
    }
  >
    {acting === "revoke-approval" ? "Revoking..." : "Revoke Approval"}
  </Button>
)}
```

- [ ] Also update the existing `canReopen` condition to include `closed`:

```typescript
// Before:
const canReopen = run.status === "rejected" || run.status === "closed";
// After (closed now uses sendBack, rejected still uses reopenRun):
const canReopen = run.status === "rejected";
const canReopenClosed = run.status === "closed";
```

Add a "Reopen" button for `closed`:
```tsx
{canReopenClosed && (
  <Button
    size="sm"
    variant="ghost"
    requiredPermissions={["payroll.approve"]}
    disabled={acting === "reopen-closed"}
    onClick={() =>
      act(
        "reopen-closed",
        async () => {
          const note = prompt("Reason for reopening? (optional)") ?? undefined;
          return sendBackPayrollRun(id!, { note });
        },
        "Run reopened",
      )
    }
  >
    Reopen
  </Button>
)}
```

- [ ] Commit:

```bash
git add apps/pwa/src/pages/finance/payroll/FinancePayrollRunDetailPage.tsx
git commit -m "feat(payroll): add Return to HR, Revoke Approval, and Reopen buttons on Finance run detail"
```

---

### Step 14f: Admin Authorize Page — "Revoke Authorization" button

**File:** `apps/pwa/src/pages/admin/payroll/AdminPayrollRunAuthorizePage.tsx`

- [ ] Add `sendBackPayrollRun` to the imports.

- [ ] Add a `canRevokeAuth` condition:

```typescript
const canRevokeAuth = run.status === "authorized";
```

- [ ] Add the button alongside the existing Authorize button:

```tsx
{canRevokeAuth && (
  <Button
    size="sm"
    variant="ghost"
    disabled={acting === "revoke-auth"}
    onClick={async () => {
      const note = prompt("Reason for revoking authorization? (optional)") ?? undefined;
      setActing("revoke-auth");
      try {
        await sendBackPayrollRun(id!, { note: note ?? undefined });
        showToast({ tone: "warning", title: "Authorization revoked", message: "Run returned to approved state. Finance will need to re-submit for authorization." });
        refetch();
      } catch {
        showToast({ tone: "danger", title: "Failed", message: "Unable to revoke authorization." });
      } finally {
        setActing(null);
      }
    }}
  >
    {acting === "revoke-auth" ? "Revoking..." : "Revoke Authorization"}
  </Button>
)}
```

- [ ] Commit:

```bash
git add apps/pwa/src/pages/admin/payroll/AdminPayrollRunAuthorizePage.tsx
git commit -m "feat(payroll): add Revoke Authorization button for ED/COO on run authorize page"
```

---

### Complete revert + forward path (final state machine)

```
              ← recall (HR)
draft ⇄ prepared ⇄ under_review ⇄ approved ⇄ authorized → paid → closed
                  ↑ return (Finance) ↑ revoke (Finance)  ↑ revoke (ED/COO)
                  
Any active state → rejected (Finance reject)
rejected → draft (Finance reopen)
closed ⇄ paid (Finance send-back / reopen)
paid — TERMINAL (cannot revert)
```

---

## Self-Review

**Full flow coverage:**
- ✅ HR creates run → generates items → submits to Finance
- ✅ Finance team emailed + notified when HR submits
- ✅ Finance reviews → approves (no pay yet — blocked)
- ✅ ED/COO emailed + notified when Finance approves
- ✅ ED/COO sees approved runs → reviews item breakdown → downloads CSV → authorizes
- ✅ Finance emailed + notified when ED/COO authorizes — Pay button unlocked
- ✅ Finance marks as paid → HR, Finance, ED/COO all notified
- ✅ Payslip distribution → each staff member emailed with PDF + in-app notification
- ✅ HR/Finance can export monthly breakdown (CSV with per-component columns) at any point after generation
- ✅ Employees see full breakdown + can download PDF payslip
- ✅ HR manages worker profiles (add/edit/view detail/loans)
- ✅ Finance configures salary components and tax tables
- ✅ `payroll.authorize` permission seeded to ED/COO roles
- ✅ Every active step is reversible — HR recalls, Finance returns/revokes, ED/COO revokes auth
- ✅ `paid` is the only terminal state that cannot be reverted

**Blocked path:**
- Finance `payRun` is hard-blocked by the backend service guard — even if the frontend Pay button were shown, the API would return `400 Bad Request: Run must be authorized by ED/COO first`. Defense in depth.

**Field name caveat:**
The `PayrollRunSummary` type uses `month`/`year`/`net_total`/`gross_total` in the admin pages above. If the actual API response or existing type uses `period_month`/`period_year`/`total_net`/`total_gross`, update the field access in `AdminPayrollAuthorizationPage` and `AdminPayrollRunAuthorizePage` to match. The discrepancy is in naming only — no logic changes needed.
