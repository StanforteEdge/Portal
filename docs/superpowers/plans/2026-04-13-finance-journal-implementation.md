# Finance Journal (Zoho-Style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Zoho-style manual journals (list + create + approvals + multi-currency + attachments) to the new PWA and API.

**Architecture:** Add manual-journal endpoints in `api/src/modules/finance` backed by `FinanceJournalEntry` + `FinanceJournalLine`, with a shared validation helper. Add PWA list page + modal create/detail, wired via new `finance-api` client functions and linked in finance navigation and routes.

**Tech Stack:** NestJS + Prisma (API), React + Vite + TypeScript (PWA).

---

## File Structure

**API**
- Create: `api/src/modules/finance/journal-utils.ts`
- Create: `api/src/modules/finance/journal-utils.test.ts`
- Create: `api/src/modules/finance/dto/create-finance-journal.dto.ts`
- Create: `api/src/modules/finance/dto/list-finance-journals.dto.ts`
- Create: `api/src/modules/finance/dto/journal-action.dto.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`

**PWA**
- Modify: `apps/pwa/src/modules/finance/finance-api.ts`
- Create: `apps/pwa/src/modules/finance/FinanceJournalPage.tsx`
- Modify: `apps/pwa/src/features/requests/requests-data.ts`
- Modify: `apps/pwa/src/App.tsx`

---

### Task 1: Add journal utils with tests

**Files:**
- Create: `api/src/modules/finance/journal-utils.ts`
- Create: `api/src/modules/finance/journal-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// api/src/modules/finance/journal-utils.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateJournalLines, normalizeJournalCurrency } from './journal-utils';

test('validateJournalLines throws when totals are unbalanced', () => {
  assert.throws(() => {
    validateJournalLines([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 50 }
    ]);
  }, /balanced/);
});

test('validateJournalLines returns totals when balanced', () => {
  const result = validateJournalLines([
    { debit: 120, credit: 0 },
    { debit: 0, credit: 120 }
  ]);
  assert.equal(result.totalDebit, 120);
  assert.equal(result.totalCredit, 120);
});

test('normalizeJournalCurrency uppercases currency', () => {
  assert.equal(normalizeJournalCurrency('ngn'), 'NGN');
  assert.equal(normalizeJournalCurrency(undefined), 'NGN');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: FAIL with “module not found” or missing exports.

- [ ] **Step 3: Write minimal implementation**

```ts
// api/src/modules/finance/journal-utils.ts
export type JournalLineInput = { debit?: number; credit?: number };

export function normalizeJournalCurrency(value?: string | null, fallback = 'NGN') {
  const raw = String(value || fallback).trim().toUpperCase();
  return raw || fallback;
}

export function validateJournalLines(lines: JournalLineInput[]) {
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error('Journal entry is not balanced');
  }
  return { totalDebit, totalCredit };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/journal-utils.ts api/src/modules/finance/journal-utils.test.ts
git commit -m "test(finance): add journal validation utils"
```

---

### Task 2: Add Journal DTOs

**Files:**
- Create: `api/src/modules/finance/dto/create-finance-journal.dto.ts`
- Create: `api/src/modules/finance/dto/list-finance-journals.dto.ts`
- Create: `api/src/modules/finance/dto/journal-action.dto.ts`

- [ ] **Step 1: Write the failing test**

```ts
// api/src/modules/finance/journal-utils.test.ts
import { CreateFinanceJournalDto } from './dto/create-finance-journal.dto';
import { validate } from 'class-validator';

test('CreateFinanceJournalDto requires at least 2 lines', async () => {
  const dto = new CreateFinanceJournalDto();
  dto.entry_date = '2026-04-13';
  dto.currency = 'NGN';
  dto.lines = [{ chart_account_id: '00000000-0000-0000-0000-000000000000', debit: 100, credit: 0 }];
  const errors = await validate(dto);
  if (!errors.length) throw new Error('Expected validation errors');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: FAIL with “CreateFinanceJournalDto not found”.

- [ ] **Step 3: Write DTOs**

```ts
// api/src/modules/finance/dto/create-finance-journal.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Matches, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class FinanceJournalLineDto {
  @ApiProperty({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsUUID()
  chart_account_id!: string;

  @ApiPropertyOptional({ example: '4fef7e86-cf6a-4df7-b0b3-e350adf55e44' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: '4fef7e86-cf6a-4df7-b0b3-e350adf55e44' })
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({ example: '4fef7e86-cf6a-4df7-b0b3-e350adf55e44' })
  @IsOptional()
  @IsUUID()
  fund_id?: string;

  @ApiPropertyOptional({ example: '4fef7e86-cf6a-4df7-b0b3-e350adf55e44' })
  @IsOptional()
  @IsUUID()
  grant_id?: string;

  @ApiPropertyOptional({ example: 'Reallocation to payroll' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  debit!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  credit!: number;
}

export class CreateFinanceJournalDto {
  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  entry_date!: string;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  exchange_rate?: number;

  @ApiPropertyOptional({ example: 'Manual adjustment' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ example: ['file-id-1'] })
  @IsOptional()
  @IsArray()
  file_ids?: string[];

  @ApiProperty({ type: [FinanceJournalLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => FinanceJournalLineDto)
  lines!: FinanceJournalLineDto[];
}
```

```ts
// api/src/modules/finance/dto/list-finance-journals.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ListFinanceJournalsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

```ts
// api/src/modules/finance/dto/journal-action.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JournalActionDto {
  @ApiPropertyOptional({ example: 'Approved by CFO' })
  @IsOptional()
  @IsString()
  comment?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/dto/create-finance-journal.dto.ts api/src/modules/finance/dto/list-finance-journals.dto.ts api/src/modules/finance/dto/journal-action.dto.ts api/src/modules/finance/journal-utils.test.ts
git commit -m "feat(finance): add manual journal DTOs"
```

---

### Task 3: Add finance service methods for manual journals

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`

- [ ] **Step 1: Write the failing test**

```ts
// api/src/modules/finance/journal-utils.test.ts
import { createJournalEntryPayload } from './journal-utils';
import test from 'node:test';
import assert from 'node:assert/strict';

test('createJournalEntryPayload maps DTO lines to journal lines', () => {
  const payload = createJournalEntryPayload({
    entryDate: new Date('2026-04-13'),
    memo: 'Test',
    currency: 'NGN',
    lines: [{ chart_account_id: 'acc', debit: 100, credit: 0 }]
  });
  assert.equal(payload.lines[0].chartAccountId, 'acc');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: FAIL with missing export.

- [ ] **Step 3: Implement service + helper**

```ts
// api/src/modules/finance/journal-utils.ts
export function createJournalEntryPayload(input: {
  entryDate: Date;
  periodId: string;
  memo?: string | null;
  currency: string;
  postedBy?: string | null;
  lines: Array<{
    chart_account_id: string;
    organization_id?: string;
    team_id?: string;
    fund_id?: string;
    grant_id?: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}) {
  return {
    entryDate: input.entryDate,
    periodId: input.periodId,
    sourceType: 'manual_journal',
    sourceId: `manual:${input.entryDate.toISOString()}`,
    memo: input.memo || 'Manual Journal',
    currency: input.currency,
    postedBy: input.postedBy || undefined,
    lines: input.lines.map((line) => ({
      chartAccountId: line.chart_account_id,
      organizationId: line.organization_id ? BigInt(line.organization_id) : null,
      teamId: line.team_id ? BigInt(line.team_id) : null,
      fundId: line.fund_id ?? null,
      grantId: line.grant_id ?? null,
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0),
      description: line.description ?? null
    }))
  };
}
```

```ts
// api/src/modules/finance/finance.service.ts (add methods)
async listManualJournals(query: ListFinanceJournalsDto) {
  const where: any = { sourceType: 'manual_journal' };
  if (query.status) where.status = String(query.status).toLowerCase();
  if (query.currency) where.currency = String(query.currency).toUpperCase();
  if (query.from || query.to) {
    where.entryDate = {};
    if (query.from) where.entryDate.gte = new Date(query.from);
    if (query.to) where.entryDate.lte = new Date(query.to);
  }
  if (query.search) {
    where.OR = [
      { entryNo: { contains: query.search, mode: 'insensitive' } },
      { memo: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  return this.prisma.financeJournalEntry.findMany({
    where,
    include: { lines: { include: { chartAccount: true } } },
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }]
  });
}

async getManualJournal(id: string) {
  return this.prisma.financeJournalEntry.findFirst({
    where: { id, sourceType: 'manual_journal' },
    include: { lines: { include: { chartAccount: true, organization: true, team: true, fund: true, grant: true } } }
  });
}

async createManualJournal(dto: CreateFinanceJournalDto, userId?: string) {
  const entryDate = new Date(dto.entry_date);
  const period = await this.ensureReportingPeriod(entryDate, userId);
  const currency = normalizeJournalCurrency(dto.currency);
  const { totalDebit, totalCredit } = validateJournalLines(dto.lines);
  const payload = createJournalEntryPayload({
    entryDate,
    periodId: period.id,
    memo: dto.memo ?? null,
    currency,
    postedBy: userId ?? null,
    lines: dto.lines
  });
  return this.prisma.financeJournalEntry.create({
    data: {
      entryNo: await this.nextSequenceValue(this.prisma, 'JE', entryDate),
      entryDate,
      periodId: period.id,
      sourceType: 'manual_journal',
      sourceId: payload.sourceId,
      memo: dto.memo ?? null,
      status: 'draft',
      currency,
      totalDebit,
      totalCredit,
      postedBy: userId ? toBigInt(userId) : null,
      metadata: {
        exchange_rate: dto.exchange_rate ?? null,
        file_ids: dto.file_ids ?? []
      },
      lines: { create: payload.lines }
    }
  });
}

async submitManualJournal(id: string, userId?: string) {
  return this.prisma.financeJournalEntry.update({
    where: { id },
    data: { status: 'pending', postedBy: userId ? toBigInt(userId) : null }
  });
}

async approveManualJournal(id: string, userId?: string) {
  return this.prisma.financeJournalEntry.update({
    where: { id },
    data: { status: 'approved', postedBy: userId ? toBigInt(userId) : null }
  });
}

async rejectManualJournal(id: string, userId?: string, comment?: string) {
  return this.prisma.financeJournalEntry.update({
    where: { id },
    data: { status: 'rejected', metadata: { rejection_note: comment ?? null } }
  });
}

async publishManualJournal(id: string, userId?: string) {
  return this.prisma.financeJournalEntry.update({
    where: { id },
    data: { status: 'posted', postedBy: userId ? toBigInt(userId) : null }
  });
}

async deleteManualJournal(id: string) {
  return this.prisma.financeJournalEntry.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test -r ts-node/register api/src/modules/finance/journal-utils.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/journal-utils.ts api/src/modules/finance/journal-utils.test.ts
git commit -m "feat(finance): add manual journal service workflows"
```

---

### Task 4: Add finance controller endpoints

**Files:**
- Modify: `api/src/modules/finance/finance.controller.ts`

- [ ] **Step 1: Add controller routes**

```ts
// api/src/modules/finance/finance.controller.ts (imports)
import { CreateFinanceJournalDto } from './dto/create-finance-journal.dto';
import { ListFinanceJournalsDto } from './dto/list-finance-journals.dto';
import { JournalActionDto } from './dto/journal-action.dto';
```

```ts
// api/src/modules/finance/finance.controller.ts (new endpoints)
  @Get('journals')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'List manual journals' })
  listManualJournals(@Query() query: ListFinanceJournalsDto) {
    return this.financeService.listManualJournals(query);
  }

  @Get('journals/:id')
  @Permissions('finance.view')
  @ApiOperation({ summary: 'Get manual journal detail' })
  getManualJournal(@Param('id') id: string) {
    return this.financeService.getManualJournal(id);
  }

  @Post('journals')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create manual journal draft' })
  createManualJournal(@Req() req: any, @Body() dto: CreateFinanceJournalDto) {
    return this.financeService.createManualJournal(dto, req.user?.id);
  }

  @Post('journals/:id/submit')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Submit manual journal for approval' })
  submitManualJournal(@Req() req: any, @Param('id') id: string) {
    return this.financeService.submitManualJournal(id, req.user?.id);
  }

  @Post('journals/:id/approve')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Approve manual journal' })
  approveManualJournal(@Req() req: any, @Param('id') id: string, @Body() dto: JournalActionDto) {
    return this.financeService.approveManualJournal(id, req.user?.id);
  }

  @Post('journals/:id/reject')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Reject manual journal' })
  rejectManualJournal(@Req() req: any, @Param('id') id: string, @Body() dto: JournalActionDto) {
    return this.financeService.rejectManualJournal(id, req.user?.id, dto.comment);
  }

  @Post('journals/:id/publish')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Publish manual journal' })
  publishManualJournal(@Req() req: any, @Param('id') id: string) {
    return this.financeService.publishManualJournal(id, req.user?.id);
  }

  @Post('journals/:id/delete')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Delete manual journal draft' })
  deleteManualJournal(@Param('id') id: string) {
    return this.financeService.deleteManualJournal(id);
  }
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/finance/finance.controller.ts
git commit -m "feat(finance): add manual journal endpoints"
```

---

### Task 5: Add PWA finance API client

**Files:**
- Modify: `apps/pwa/src/modules/finance/finance-api.ts`

- [ ] **Step 1: Add journal types and API helpers**

```ts
export type FinanceJournalLine = {
  id?: string;
  chart_account_id: string;
  organization_id?: string;
  team_id?: string;
  fund_id?: string;
  grant_id?: string;
  description?: string;
  debit: number;
  credit: number;
};

export type FinanceJournalEntry = {
  id: string;
  entry_no: string;
  entry_date: string;
  status: string;
  currency: string;
  memo?: string | null;
  total_debit: number;
  total_credit: number;
  metadata?: Record<string, unknown> | null;
  lines?: FinanceJournalLine[];
};

export async function listFinanceJournals(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return httpRequest<FinanceJournalEntry[]>(`/finance/journals${suffix}`);
}

export async function getFinanceJournal(id: string) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals/${id}`);
}

export async function createFinanceJournal(payload: {
  entry_date: string;
  currency?: string;
  exchange_rate?: number;
  memo?: string;
  file_ids?: string[];
  lines: FinanceJournalLine[];
}) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals`, {
    method: 'POST',
    body: payload,
  });
}

export async function submitFinanceJournal(id: string) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals/${id}/submit`, { method: 'POST' });
}

export async function approveFinanceJournal(id: string, comment?: string) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals/${id}/approve`, {
    method: 'POST',
    body: { comment },
  });
}

export async function rejectFinanceJournal(id: string, comment?: string) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals/${id}/reject`, {
    method: 'POST',
    body: { comment },
  });
}

export async function publishFinanceJournal(id: string) {
  return httpRequest<FinanceJournalEntry>(`/finance/journals/${id}/publish`, { method: 'POST' });
}

export async function deleteFinanceJournal(id: string) {
  return httpRequest<{ id: string }>(`/finance/journals/${id}/delete`, { method: 'POST' });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/modules/finance/finance-api.ts
git commit -m "feat(pwa): add finance journal API client"
```

---

### Task 6: Add Finance Journal page with modal create/detail

**Files:**
- Create: `apps/pwa/src/modules/finance/FinanceJournalPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useMemo, useState } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { PageHeader, SectionCard, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow, Chip, EmptyState, TextField, SelectField, TextAreaField, Button } from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { listFinanceAccounts, listFinanceJournals, createFinanceJournal, getFinanceJournal, submitFinanceJournal, approveFinanceJournal, rejectFinanceJournal, publishFinanceJournal, type FinanceJournalEntry, type FinanceJournalLine } from "@/modules/finance/finance-api";
import { MediaPickerModal } from "@/shared";

export default function FinanceJournalPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ from: "", to: "", status: "", currency: "", search: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<FinanceJournalLine[]>([
    { chart_account_id: "", debit: 0, credit: 0, description: "" },
    { chart_account_id: "", debit: 0, credit: 0, description: "" },
  ]);
  const [entryMeta, setEntryMeta] = useState({ entry_date: "", currency: "NGN", exchange_rate: 1, memo: "" });
  const [fileIds, setFileIds] = useState<string[]>([]);

  const { data: journals = [] } = useCachedQuery(
    ["finance:journals", filters],
    () => listFinanceJournals(filters),
    { ttlMs: 30_000, storage: "memory" },
  );

  const { data: accounts = [] } = useCachedQuery(
    "finance:accounts",
    () => listFinanceAccounts({ is_active: true }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: detail } = useCachedQuery(
    ["finance:journals:detail", selectedId],
    () => (selectedId ? getFinanceJournal(selectedId) : Promise.resolve(null)),
    { ttlMs: 10_000, storage: "memory", enabled: !!selectedId },
  );

  const totals = useMemo(() => {
    const debit = lineItems.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const credit = lineItems.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { debit, credit };
  }, [lineItems]);

  const balanced = Math.abs(totals.debit - totals.credit) < 0.001;

  function updateLine(index: number, patch: Partial<FinanceJournalLine>) {
    setLineItems((prev) => prev.map((line, idx) => (idx === index ? { ...line, ...patch } : line)));
  }

  async function handleCreate() {
    const payload = {
      ...entryMeta,
      lines: lineItems,
      file_ids: fileIds,
    };
    await createFinanceJournal(payload);
    setShowCreate(false);
  }

  async function handleSubmit(id: string) {
    await submitFinanceJournal(id);
  }

  async function handleApprove(id: string) {
    await approveFinanceJournal(id);
  }

  async function handleReject(id: string) {
    await rejectFinanceJournal(id, "Rejected");
  }

  async function handlePublish(id: string) {
    await publishFinanceJournal(id);
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-journal"
      user={{ name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff", role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Finance", path: "/finance" }, { label: "Journal" }]}
        title="Manual Journal"
        description="Create, review, and post manual journals."
        action={<Button onClick={() => setShowCreate(true)}>New Journal</Button>}
      />

      <SectionCard title="Filters">
        <div className="grid gap-4 md:grid-cols-5">
          <TextField label="From" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <TextField label="To" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <SelectField label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="posted">Posted</option>
          </SelectField>
          <TextField label="Currency" value={filters.currency} onChange={(e) => setFilters({ ...filters, currency: e.target.value })} />
          <TextField label="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
      </SectionCard>

      <SectionCard title="Journals">
        {journals.length ? (
          <Table caption="Manual journal entries">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Entry</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Currency</TableHeaderCell>
                <TableHeaderCell>Debit</TableHeaderCell>
                <TableHeaderCell>Credit</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {journals.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.entry_no}</TableCell>
                  <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip variant="neutral">{entry.status}</Chip></TableCell>
                  <TableCell>{entry.currency}</TableCell>
                  <TableCell>{entry.total_debit}</TableCell>
                  <TableCell>{entry.total_credit}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => { setSelectedId(entry.id); setShowDetail(true); }}>View</Button>
                      {entry.status === "draft" ? <Button onClick={() => handleSubmit(entry.id)}>Submit</Button> : null}
                      {entry.status === "pending" ? (
                        <>
                          <Button onClick={() => handleApprove(entry.id)}>Approve</Button>
                          <Button variant="secondary" onClick={() => handleReject(entry.id)}>Reject</Button>
                        </>
                      ) : null}
                      {entry.status === "approved" ? <Button onClick={() => handlePublish(entry.id)}>Publish</Button> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No journals yet" description="Create your first manual journal." />
        )}
      </SectionCard>

      {showCreate ? (
        <div className="dialog-backdrop">
          <div className="dialog-panel">
            <div className="dialog-header">
              <h2 className="text-lg font-semibold">New Journal</h2>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Close</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Entry Date" type="date" value={entryMeta.entry_date} onChange={(e) => setEntryMeta({ ...entryMeta, entry_date: e.target.value })} />
              <TextField label="Currency" value={entryMeta.currency} onChange={(e) => setEntryMeta({ ...entryMeta, currency: e.target.value })} />
              <TextField label="Exchange Rate" type="number" value={entryMeta.exchange_rate} onChange={(e) => setEntryMeta({ ...entryMeta, exchange_rate: Number(e.target.value) })} />
              <TextAreaField label="Memo" value={entryMeta.memo} onChange={(e) => setEntryMeta({ ...entryMeta, memo: e.target.value })} />
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
              {lineItems.map((line, idx) => (
                <div key={idx} className="grid gap-3 md:grid-cols-5 mt-3">
                  <SelectField label="Account" value={line.chart_account_id} onChange={(e) => updateLine(idx, { chart_account_id: e.target.value })}>
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.code ? `${account.code} - ${account.name}` : account.name}</option>
                    ))}
                  </SelectField>
                  <TextField label="Description" value={line.description || ""} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                  <TextField label="Debit" type="number" value={line.debit} onChange={(e) => updateLine(idx, { debit: Number(e.target.value) })} />
                  <TextField label="Credit" type="number" value={line.credit} onChange={(e) => updateLine(idx, { credit: Number(e.target.value) })} />
                  <Button variant="secondary" onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                </div>
              ))}
              <div className="mt-3 flex gap-3">
                <Button variant="secondary" onClick={() => setLineItems((prev) => [...prev, { chart_account_id: "", debit: 0, credit: 0 }])}>Add Line</Button>
                <span className="text-sm text-slate-600">Debit: {totals.debit} | Credit: {totals.credit}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button disabled={!balanced} onClick={handleCreate}>Save Draft</Button>
            </div>
          </div>
        </div>
      ) : null}

      {showDetail && detail ? (
        <div className="dialog-backdrop">
          <div className="dialog-panel">
            <div className="dialog-header">
              <h2 className="text-lg font-semibold">Journal Detail</h2>
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
            </div>
            <div className="grid gap-3 text-sm">
              <div>Entry: {detail.entry_no}</div>
              <div>Date: {new Date(detail.entry_date).toLocaleDateString()}</div>
              <div>Status: {detail.status}</div>
              <div>Currency: {detail.currency}</div>
              <div>Memo: {detail.memo}</div>
            </div>
            <Table caption="Journal lines">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Account</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Debit</TableHeaderCell>
                  <TableHeaderCell>Credit</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {detail.lines?.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{line.chart_account_id}</TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell>{line.debit}</TableCell>
                    <TableCell>{line.credit}</TableCell>
                  </TableRow>
                )) || null}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      <MediaPickerModal
        open={false}
        onClose={() => null}
        onSelect={(items) => setFileIds(items.map((item) => item.id))}
      />
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/modules/finance/FinanceJournalPage.tsx
git commit -m "feat(pwa): add finance journal list + modal UI"
```

---

### Task 7: Wire navigation and routes

**Files:**
- Modify: `apps/pwa/src/features/requests/requests-data.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add navigation item**

```ts
// apps/pwa/src/features/requests/requests-data.ts
{ key: "finance-journal", label: "Journal", icon: "book", path: "/finance/journal" },
```

- [ ] **Step 2: Add route**

```ts
// apps/pwa/src/App.tsx (imports)
import FinanceJournalPage from "@/modules/finance/FinanceJournalPage";

// apps/pwa/src/App.tsx (routes)
<Route path="/finance/journal" element={<FinanceJournalPage />} />
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/features/requests/requests-data.ts apps/pwa/src/App.tsx
git commit -m "feat(pwa): add finance journal nav + route"
```

---

### Task 8: Verification

**Files:** none

- [ ] **Step 1: API typecheck**

Run: `cd api && npx tsc --noEmit`  
Expected: no TypeScript errors.

- [ ] **Step 2: PWA build**

Run: `cd apps/pwa && npm run build`  
Expected: build succeeds.

