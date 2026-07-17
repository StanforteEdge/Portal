# Finance Edit Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit capabilities to three finance areas: posted journal entries (manual + statutory deduction), pending statutory deductions, and completed remittance records.

**Architecture:** Add PATCH endpoints for each entity type following the codebase's existing update patterns. Journal entry updates modify the entry and its lines in-place within a transaction. Deduction and remittance updates modify `FinanceRequestDeduction` fields directly. Frontend adds edit buttons to existing tables and edit slide-over panels pre-filled with current data.

**Tech Stack:** React, TypeScript, NestJS, Prisma, class-validator

---

## File Map

- Modify: `api/src/modules/finance/finance.controller.ts`
  - Add PATCH endpoints for journal entries and deductions.
- Modify: `api/src/modules/finance/finance.service.ts`
  - Add `updateManualJournalEntry` and `updateStatutoryDeductionManualEntry` methods.
- Modify: `api/src/modules/finance/deduction.service.ts`
  - Add `updatePendingDeduction` and `updateRemittanceRecord` methods.
- Create: `api/src/modules/finance/dto/update-journal-entry.dto.ts`
  - DTO for updating journal entry fields.
- Create: `api/src/modules/finance/dto/update-deduction.dto.ts`
  - DTO for updating pending deductions and remittance records.
- Modify: `apps/shared/src/api/finance-api.ts`
  - Add `updateJournalEntry`, `updatePendingDeduction`, `updateRemittanceRecord` client methods.
- Modify: `apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx`
  - Add edit button and edit slide-over for journal entries.
- Modify: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx`
  - Add edit button and edit slide-over for statutory deduction journal entries.
- Modify: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx`
  - Add edit action for pending deductions and remitted records.
- Modify: `apps/pwa/src/pages/finance/deductions/RequestDeductionDetailPanel.tsx`
  - Add edit button for deduction fields and remittance fields.
- Create or Modify: `api/src/modules/finance/__tests__/finance-edit.spec.ts`
  - Tests for all update service methods.

### Task 1: Backend — Update Journal Entry Endpoint

**Files:**
- Create: `api/src/modules/finance/dto/update-journal-entry.dto.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: none yet

- [ ] **Step 1: Create the update journal entry DTO**

```ts
// api/src/modules/finance/dto/update-journal-entry.dto.ts
import {
  IsArray, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateJournalLineDto {
  @IsOptional() @IsString() id?: string;
  @IsString() chart_account_id!: string;
  @IsOptional() @IsString() organization_id?: string;
  @IsOptional() @IsString() team_id?: string;
  @IsOptional() @IsString() fund_id?: string;
  @IsOptional() @IsString() grant_id?: string;
  @IsNumber() @Min(0) debit!: number;
  @IsNumber() @Min(0) credit!: number;
  @IsOptional() @IsString() @MaxLength(255) description?: string;
}

export class UpdateJournalEntryDto {
  @IsOptional() @IsDateString() entry_date?: string;
  @IsOptional() @IsString() @MaxLength(255) memo?: string;
  @IsOptional() @IsString() currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateJournalLineDto)
  lines?: UpdateJournalLineDto[];
}
```

- [ ] **Step 2: Add the `updateManualJournalEntry` service method**

Add after `createManualJournalEntry` in `finance.service.ts` (around line 6882):

```ts
async updateManualJournalEntry(id: string, dto: {
  entry_date?: string;
  memo?: string;
  currency?: string;
  lines?: Array<{
    id?: string;
    chart_account_id: string;
    organization_id?: string;
    team_id?: string;
    fund_id?: string;
    grant_id?: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}, actorId?: string) {
  const existing = await this.prisma.financeJournalEntry.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!existing) throw new NotFoundException('Journal entry not found');
  if (existing.sourceType !== 'manual_entry' && existing.sourceType !== 'statutory_deduction_manual_entry') {
    throw new BadRequestException('Only manual entries can be edited');
  }

  const entryDate = dto.entry_date ? new Date(dto.entry_date) : existing.entryDate;
  if (dto.entry_date && Number.isNaN(entryDate.getTime())) {
    throw new BadRequestException('Invalid entry_date');
  }

  const lines = dto.lines ?? existing.lines.map((l) => ({
    chart_account_id: l.chartAccountId,
    organization_id: l.organizationId?.toString() ?? undefined,
    team_id: l.teamId?.toString() ?? undefined,
    fund_id: l.fundId ?? undefined,
    grant_id: l.grantId ?? undefined,
    debit: Number(l.debit),
    credit: Number(l.credit),
    description: l.description ?? undefined,
  }));

  if (lines.length < 2) {
    throw new BadRequestException('At least two journal lines are required');
  }

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new BadRequestException('Journal entry is not balanced');
  }

  const period = await this.ensureReportingPeriod(entryDate, actorId);

  await this.prisma.$transaction(async (tx) => {
    await tx.financeJournalLine.deleteMany({ where: { journalEntryId: id } });
    await tx.financeJournalEntry.update({
      where: { id },
      data: {
        entryDate,
        periodId: period.id,
        memo: dto.memo !== undefined ? dto.memo || null : existing.memo,
        currency: dto.currency ? dto.currency.toUpperCase() : existing.currency,
        totalDebit,
        totalCredit,
        lines: {
          create: lines.map((l) => ({
            chartAccountId: l.chart_account_id,
            organizationId: l.organization_id ? toBigInt(l.organization_id) : null,
            teamId: l.team_id ? toBigInt(l.team_id) : null,
            fundId: l.fund_id || null,
            grantId: l.grant_id || null,
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
            description: l.description || null,
          })),
        },
      },
    });
  });

  return this.prisma.financeJournalEntry.findUnique({
    where: { id },
    include: {
      lines: { include: { chartAccount: { select: { id: true, code: true, name: true } } } },
    },
  });
}
```

- [ ] **Step 3: Add the controller endpoint**

Add after the existing `createStatutoryDeductionManualEntry` endpoint in `finance.controller.ts` (around line 580):

```ts
@Patch('manual-entry/:id')
@Permissions('finance.manage')
@ApiOperation({ summary: 'Update a manual journal entry' })
@ApiBody({ type: UpdateJournalEntryDto })
updateManualEntry(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateJournalEntryDto) {
  return this.financeService.updateManualJournalEntry(id, dto as any, req.user?.id);
}
```

Also add the import at the top of the controller:

```ts
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
```

And add `Patch` to the existing import from `@nestjs/common` if not already present.

- [ ] **Step 4: Verify compilation**

Run: `node -e "const ts = require('typescript'); ['api/src/modules/finance/dto/update-journal-entry.dto.ts', 'api/src/modules/finance/finance.controller.ts', 'api/src/modules/finance/finance.service.ts'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, emitDecoratorMetadata: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: All files show 0 diagnostics.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/dto/update-journal-entry.dto.ts api/src/modules/finance/finance.controller.ts api/src/modules/finance/finance.service.ts
git commit -m "feat(api): add journal entry update endpoint"
```

### Task 2: Backend — Update Pending Deduction Endpoint

**Files:**
- Create: `api/src/modules/finance/dto/update-deduction.dto.ts`
- Modify: `api/src/modules/finance/deduction.service.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Test: none yet

- [ ] **Step 1: Create the update deduction DTO**

```ts
// api/src/modules/finance/dto/update-deduction.dto.ts
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePendingDeductionDto {
  @IsOptional() @IsString() deduction_type_id?: string;
  @IsOptional() @IsNumber() @Min(0) gross_amount?: number;
  @IsOptional() @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsNumber() @Min(0) rate?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class UpdateRemittanceRecordDto {
  @IsOptional() @IsString() @MaxLength(255) remittance_ref?: string;
  @IsOptional() @IsString() remitted_at?: string;
  @IsOptional() @IsString() paid_from_account_id?: string;
  @IsOptional() @IsString() evidence_file_id?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
```

- [ ] **Step 2: Add `updatePendingDeduction` to deduction service**

Add after `batchRemitDeductions` in `deduction.service.ts` (around line 494):

```ts
async updatePendingDeduction(id: string, dto: {
  deduction_type_id?: string;
  gross_amount?: number;
  amount?: number;
  rate?: number;
  notes?: string;
}) {
  const existing = await this.prisma.financeRequestDeduction.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException('Deduction not found');
  if (existing.status !== 'pending') throw new BadRequestException('Only pending deductions can be edited');

  if (dto.deduction_type_id) {
    const dt = await this.prisma.financeDeductionType.findUnique({ where: { id: dto.deduction_type_id } });
    if (!dt) throw new BadRequestException('Invalid deduction_type_id');
  }

  if (dto.gross_amount !== undefined && dto.gross_amount <= 0) {
    throw new BadRequestException('gross_amount must be positive');
  }
  if (dto.amount !== undefined && dto.amount <= 0) {
    throw new BadRequestException('amount must be positive');
  }

  const data: Record<string, any> = {};
  if (dto.deduction_type_id !== undefined) data.deductionTypeId = dto.deduction_type_id;
  if (dto.gross_amount !== undefined) data.grossAmount = dto.gross_amount;
  if (dto.amount !== undefined) data.amount = dto.amount;
  if (dto.rate !== undefined) data.rate = dto.rate;
  if (dto.notes !== undefined) data.notes = dto.notes || null;

  return this.prisma.financeRequestDeduction.update({ where: { id }, data });
}
```

- [ ] **Step 3: Add `updateRemittanceRecord` to deduction service**

Add after `updatePendingDeduction`:

```ts
async updateRemittanceRecord(id: string, dto: {
  remittance_ref?: string;
  remitted_at?: string;
  paid_from_account_id?: string;
  evidence_file_id?: string;
  notes?: string;
}) {
  const existing = await this.prisma.financeRequestDeduction.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException('Deduction not found');
  if (existing.status !== 'remitted') throw new BadRequestException('Only remitted deductions can be edited');

  const data: Record<string, any> = {};
  if (dto.remittance_ref !== undefined) data.remittanceRef = dto.remittance_ref || null;
  if (dto.remitted_at !== undefined) data.remittedAt = new Date(dto.remitted_at);
  if (dto.paid_from_account_id !== undefined) data.paidFromAccountId = dto.paid_from_account_id || null;
  if (dto.evidence_file_id !== undefined) data.evidenceFileId = dto.evidence_file_id || null;
  if (dto.notes !== undefined) data.notes = dto.notes || null;

  return this.prisma.financeRequestDeduction.update({ where: { id }, data });
}
```

- [ ] **Step 4: Add controller endpoints**

Add after the `batchRemitDeductions` endpoint in `finance.controller.ts` (around line 1013):

```ts
@Patch('statutory-deductions/:id')
@Permissions('finance.manage')
@ApiOperation({ summary: 'Update a pending statutory deduction' })
@ApiBody({ type: UpdatePendingDeductionDto })
updatePendingDeduction(@Param('id') id: string, @Body() dto: UpdatePendingDeductionDto) {
  return this.deductionService.updatePendingDeduction(id, dto);
}

@Patch('statutory-deductions/:id/remittance')
@Permissions('finance.manage')
@ApiOperation({ summary: 'Update remittance record for a remitted deduction' })
@ApiBody({ type: UpdateRemittanceRecordDto })
updateRemittanceRecord(@Param('id') id: string, @Body() dto: UpdateRemittanceRecordDto) {
  return this.deductionService.updateRemittanceRecord(id, dto);
}
```

Add the import at the top of the controller:

```ts
import { UpdatePendingDeductionDto, UpdateRemittanceRecordDto } from './dto/update-deduction.dto';
```

- [ ] **Step 5: Verify compilation**

Run: `node -e "const ts = require('typescript'); ['api/src/modules/finance/dto/update-deduction.dto.ts', 'api/src/modules/finance/finance.controller.ts', 'api/src/modules/finance/deduction.service.ts'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, emitDecoratorMetadata: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: All files show 0 diagnostics.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/finance/dto/update-deduction.dto.ts api/src/modules/finance/deduction.service.ts api/src/modules/finance/finance.controller.ts
git commit -m "feat(api): add deduction and remittance update endpoints"
```

### Task 3: Frontend — Finance API Client Methods

**Files:**
- Modify: `apps/shared/src/api/finance-api.ts`
- Test: frontend build

- [ ] **Step 1: Add `updateJournalEntry` method**

Add after `createManualEntry` (around line 453):

```ts
updateJournalEntry(id: string, payload: Record<string, unknown>) {
  return httpRequest<Record<string, unknown>>(`/finance/manual-entry/${id}`, {
    method: 'PATCH',
    body: payload,
  });
},
```

- [ ] **Step 2: Add `updateStatutoryDeductionManualEntry` method**

Add after `createStatutoryDeductionManualEntry` (around line 469):

```ts
updateStatutoryDeductionManualEntry(id: string, payload: Record<string, unknown>) {
  return httpRequest<Record<string, unknown>>(`/finance/manual-entry/${id}`, {
    method: 'PATCH',
    body: payload,
  });
},
```

- [ ] **Step 3: Add `updatePendingDeduction` method**

Add after `batchRemitDeductions` (around line 896):

```ts
updatePendingDeduction(id: string, payload: Record<string, unknown>) {
  return httpRequest<Record<string, unknown>>(`/finance/statutory-deductions/${id}`, {
    method: 'PATCH',
    body: payload,
  });
},
```

- [ ] **Step 4: Add `updateRemittanceRecord` method**

Add after `updatePendingDeduction`:

```ts
updateRemittanceRecord(id: string, payload: Record<string, unknown>) {
  return httpRequest<Record<string, unknown>>(`/finance/statutory-deductions/${id}/remittance`, {
    method: 'PATCH',
    body: payload,
  });
},
```

- [ ] **Step 5: Verify compilation**

Run: `node -e "const ts = require('typescript'); const src = require('fs').readFileSync('apps/shared/src/api/finance-api.ts', 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext, esModuleInterop: true } }); console.log('finance-api.ts: ' + (r.diagnostics?.length || 0) + ' diagnostics');"`
Expected: 0 diagnostics.

- [ ] **Step 6: Commit**

```bash
git add apps/shared/src/api/finance-api.ts
git commit -m "feat(shared): add finance update api client methods"
```

### Task 4: Frontend — Journal Entry Edit UI

**Files:**
- Modify: `apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx`
- Modify: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx`
- Test: frontend build

- [ ] **Step 1: Add edit state and handlers to FinanceManualEntryPage**

Add state variables after the existing state declarations (around line 46):

```ts
const [editingEntry, setEditingEntry] = useState<any>(null);
const [editEntryDate, setEditEntryDate] = useState("");
const [editMemo, setEditMemo] = useState("");
const [editCurrency, setEditCurrency] = useState("NGN");
const [editLines, setEditLines] = useState<EntryLine[]>([]);
const [editSaving, setEditSaving] = useState(false);
```

Add the openEdit handler:

```ts
const openEdit = (entry: any) => {
  setEditingEntry(entry);
  setEditEntryDate((entry.entryDate || entry.entry_date || "").slice(0, 10));
  setEditMemo(entry.memo || "");
  setEditCurrency(entry.currency || "NGN");
  setEditLines(
    (entry.lines || []).map((l: any) => ({
      chart_account_id: l.chartAccountId || l.chart_account_id || "",
      description: l.description || "",
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    }))
  );
};
```

Add the save handler:

```ts
const handleUpdate = async () => {
  if (!editingEntry) return;
  if (!editEntryDate) {
    showToast({ tone: "warning", title: "Date required", message: "Set an entry date." });
    return;
  }
  const editTotals = editLines.reduce(
    (acc, l) => ({ debit: acc.debit + Number(l.debit || 0), credit: acc.credit + Number(l.credit || 0) }),
    { debit: 0, credit: 0 },
  );
  if (Math.abs(editTotals.debit - editTotals.credit) > 0.001) {
    showToast({ tone: "danger", title: "Not balanced", message: "Debits and credits must be equal." });
    return;
  }
  const normalized = editLines
    .map((l) => ({
      chart_account_id: l.chart_account_id,
      description: l.description || undefined,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    }))
    .filter((l) => l.chart_account_id && (l.debit > 0 || l.credit > 0));
  if (normalized.length < 2) {
    showToast({ tone: "warning", title: "Incomplete", message: "At least two valid lines required." });
    return;
  }
  try {
    setEditSaving(true);
    await financeApi.updateJournalEntry(editingEntry.id, {
      entry_date: editEntryDate,
      memo: editMemo.trim() || undefined,
      currency: editCurrency.toUpperCase(),
      lines: normalized,
    });
    showToast({ tone: "success", title: "Updated", message: "Journal entry updated." });
    setEditingEntry(null);
    setRefreshKey((v) => v + 1);
  } catch (err) {
    showToast({ tone: "danger", title: "Update failed", message: err instanceof Error ? err.message : "Unable to update." });
  } finally {
    setEditSaving(false);
  }
};
```

- [ ] **Step 2: Add edit button column to the recent entries table**

Replace the `<TableHeaderRow>` in the recent entries section to add an Actions column:

```tsx
<TableHeaderRow>
  <TableHeaderCell>Date</TableHeaderCell>
  <TableHeaderCell>Entry No</TableHeaderCell>
  <TableHeaderCell>Memo</TableHeaderCell>
  <TableHeaderCell className="text-right">Debit</TableHeaderCell>
  <TableHeaderCell className="text-right">Credit</TableHeaderCell>
  <TableHeaderCell>{" "}</TableHeaderCell>
</TableHeaderRow>
```

Update each `<TableRow>` to include an edit button:

```tsx
{entries.map((entry: any) => (
  <TableRow key={entry.id}>
    <TableCell>{formatDate(entry.entryDate || entry.entry_date)}</TableCell>
    <TableCell>{entry.entryNo || entry.entry_no || entry.id.slice(0, 8)}</TableCell>
    <TableCell>{entry.memo || "-"}</TableCell>
    <TableCell className="text-right">{formatCurrency(Number(entry.totalDebit ?? entry.total_debit ?? 0), entry.currency || "NGN")}</TableCell>
    <TableCell className="text-right">{formatCurrency(Number(entry.totalCredit ?? entry.total_credit ?? 0), entry.currency || "NGN")}</TableCell>
    <TableCell>
      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => openEdit(entry)}>Edit</button>
    </TableCell>
  </TableRow>
))}
```

- [ ] **Step 3: Add the edit slide-over panel**

Add before the closing `</AppShell>` tag:

```tsx
{editingEntry && (
  <SlideOver open onClose={() => setEditingEntry(null)} size="md">
    <div className="space-y-4 p-4">
      <h3 className="font-semibold text-slate-800">Edit Journal Entry</h3>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-slate-700">Entry Date</span>
        <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editEntryDate} onChange={(e) => setEditEntryDate(e.target.value)} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-slate-700">Currency</span>
        <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editCurrency} onChange={(e) => setEditCurrency(e.target.value.toUpperCase())} />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-slate-700">Memo</span>
        <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={editMemo} onChange={(e) => setEditMemo(e.target.value)} />
      </label>
      <div className="space-y-2">
        <span className="font-semibold text-slate-700 text-sm">Lines</span>
        {editLines.map((line, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-12 items-end">
            <select className="md:col-span-4 rounded-2xl border border-slate-200 px-3 py-2 text-sm" value={line.chart_account_id} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, chart_account_id: e.target.value } : l))}>
              <option value="">Account</option>
              {chartAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
            <input className="md:col-span-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Description" value={line.description} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))} />
            <input type="number" className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Debit" value={line.debit} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, debit: Number(e.target.value) } : l))} />
            <input type="number" className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Credit" value={line.credit} onChange={(e) => setEditLines((p) => p.map((l, i) => i === idx ? { ...l, credit: Number(e.target.value) } : l))} />
            <button className="md:col-span-1 text-red-500 text-sm" onClick={() => setEditLines((p) => p.filter((_, i) => i !== idx))} disabled={editLines.length <= 2}>×</button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setEditLines((p) => [...p, { chart_account_id: "", description: "", debit: 0, credit: 0 }])}>+ Line</Button>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="secondary" onClick={() => setEditingEntry(null)}>Cancel</Button>
        <Button onClick={() => void handleUpdate()} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
      </div>
    </div>
  </SlideOver>
)}
```

Add `SlideOver` to the imports from `@/shared` at the top of the file.

- [ ] **Step 4: Apply the same pattern to StatutoryDeductionManualEntryPage**

Repeat Steps 1-3 for `StatutoryDeductionManualEntryPage.tsx`, using `financeApi.updateStatutoryDeductionManualEntry` instead of `financeApi.updateJournalEntry`. The edit state, handlers, table column, and slide-over are identical except for the API call.

- [ ] **Step 5: Verify compilation**

Run: `node -e "const ts = require('typescript'); ['apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx', 'apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, esModuleInterop: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: 0 diagnostics.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx
git commit -m "feat(pwa): add journal entry edit UI"
```

### Task 5: Frontend — Deduction and Remittance Edit UI

**Files:**
- Modify: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx`
- Modify: `apps/pwa/src/pages/finance/deductions/RequestDeductionDetailPanel.tsx`
- Test: frontend build

- [ ] **Step 1: Add edit state and handlers to StatutoryDeductionsPage**

Add state variables after the existing state declarations (around line 43):

```ts
const [editDeduction, setEditDeduction] = useState<FinanceRequestDeductionRecord | null>(null);
const [editForm, setEditForm] = useState({ deduction_type_id: "", gross_amount: 0, amount: 0, rate: 0, notes: "" });
const [editSaving, setEditSaving] = useState(false);
const [editRemittance, setEditRemittance] = useState<FinanceRequestDeductionRecord | null>(null);
const [editRemitForm, setEditRemitForm] = useState({ remittance_ref: "", remitted_at: "", paid_from_account_id: "", notes: "" });
const [editRemitSaving, setEditRemitSaving] = useState(false);
const [deductionTypes, setDeductionTypes] = useState<any[]>([]);
```

Add useEffect to load deduction types:

```ts
useEffect(() => {
  financeApi.listDeductionTypes({ page: 1, per_page: 200 }).then((res: any) => {
    setDeductionTypes(Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : []);
  }).catch(() => {});
}, []);
```

Add the openEditDeduction handler:

```ts
const openEditDeduction = (d: FinanceRequestDeductionRecord) => {
  setEditDeduction(d);
  setEditForm({
    deduction_type_id: d.deduction_type_id,
    gross_amount: d.gross_amount,
    amount: d.amount,
    rate: d.rate,
    notes: d.notes || "",
  });
};
```

Add the save handler for deductions:

```ts
const handleUpdateDeduction = async () => {
  if (!editDeduction) return;
  try {
    setEditSaving(true);
    await financeApi.updatePendingDeduction(editDeduction.id, editForm);
    showToast({ tone: "success", title: "Updated", message: "Deduction updated." });
    setEditDeduction(null);
    void fetchDeductions(page);
  } catch (err) {
    showToast({ tone: "danger", title: "Update failed", message: err instanceof Error ? err.message : "Unable to update." });
  } finally {
    setEditSaving(false);
  }
};
```

Add the openEditRemittance handler:

```ts
const openEditRemittance = (d: FinanceRequestDeductionRecord) => {
  setEditRemittance(d);
  setEditRemitForm({
    remittance_ref: d.remittance_ref || "",
    remitted_at: d.remitted_at ? d.remitted_at.slice(0, 10) : "",
    paid_from_account_id: d.paid_from_account?.id || "",
    notes: d.notes || "",
  });
};
```

Add the save handler for remittance:

```ts
const handleUpdateRemittance = async () => {
  if (!editRemittance) return;
  try {
    setEditRemitSaving(true);
    await financeApi.updateRemittanceRecord(editRemittance.id, editRemitForm);
    showToast({ tone: "success", title: "Updated", message: "Remittance record updated." });
    setEditRemittance(null);
    void fetchDeductions(page);
  } catch (err) {
    showToast({ tone: "danger", title: "Update failed", message: err instanceof Error ? err.message : "Unable to update." });
  } finally {
    setEditRemitSaving(false);
  }
};
```

- [ ] **Step 2: Add edit button to deduction table rows**

Add an Actions column header after the existing last `<TableHeaderCell>`:

```tsx
<TableHeaderCell>{" "}</TableHeaderCell>
```

Update each row to include edit/download actions:

```tsx
<TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
  <div className="flex gap-2 items-center">
    {d.status === "pending" && (
      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => openEditDeduction(d)}>Edit</button>
    )}
    {d.status === "remitted" && d.remittance_number && (
      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => openEditRemittance(d)}>Edit Remit</button>
    )}
    {d.status === "remitted" && d.remittance_number && (
      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => void handleDownloadTrm(d.id)}>TRM Slip</button>
    )}
  </div>
</TableCell>
```

- [ ] **Step 3: Add the edit deduction slide-over**

Add before the closing `</AppShell>` tag:

```tsx
{editDeduction && (
  <SlideOver open onClose={() => setEditDeduction(null)} size="sm">
    <div className="space-y-4 p-4">
      <h3 className="font-semibold text-slate-800">Edit Pending Deduction</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Deduction Type</label>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.deduction_type_id} onChange={(e) => setEditForm((p) => ({ ...p, deduction_type_id: e.target.value }))}>
          <option value="">Select type</option>
          {deductionTypes.map((dt: any) => <option key={dt.id} value={dt.id}>{dt.name}{dt.code ? ` (${dt.code})` : ""}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Gross Amount</label>
        <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.gross_amount} onChange={(e) => setEditForm((p) => ({ ...p, gross_amount: Number(e.target.value) }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Withheld Amount</label>
        <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.amount} onChange={(e) => setEditForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rate</label>
        <input type="number" step="0.0001" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.rate} onChange={(e) => setEditForm((p) => ({ ...p, rate: Number(e.target.value) }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="secondary" onClick={() => setEditDeduction(null)}>Cancel</Button>
        <Button onClick={() => void handleUpdateDeduction()} disabled={editSaving}>{editSaving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  </SlideOver>
)}
```

- [ ] **Step 4: Add the edit remittance slide-over**

Add after the edit deduction slide-over:

```tsx
{editRemittance && (
  <SlideOver open onClose={() => setEditRemittance(null)} size="sm">
    <div className="space-y-4 p-4">
      <h3 className="font-semibold text-slate-800">Edit Remittance Record</h3>
      <p className="text-sm text-slate-500">TRM: {editRemittance.remittance_number}</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Remittance Reference</label>
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editRemitForm.remittance_ref} onChange={(e) => setEditRemitForm((p) => ({ ...p, remittance_ref: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
        <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editRemitForm.remitted_at} onChange={(e) => setEditRemitForm((p) => ({ ...p, remitted_at: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Paid From Account</label>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editRemitForm.paid_from_account_id} onChange={(e) => setEditRemitForm((p) => ({ ...p, paid_from_account_id: e.target.value }))}>
          <option value="">Select account…</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.bank_name ? ` — ${a.bank_name}` : ""}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={editRemitForm.notes} onChange={(e) => setEditRemitForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="secondary" onClick={() => setEditRemittance(null)}>Cancel</Button>
        <Button onClick={() => void handleUpdateRemittance()} disabled={editRemitSaving}>{editRemitSaving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  </SlideOver>
)}
```

- [ ] **Step 5: Add edit buttons to RequestDeductionDetailPanel**

In `RequestDeductionDetailPanel.tsx`, add edit buttons next to the existing "Remit" button. For pending deductions, add an "Edit" button. For remitted deductions, add an "Edit Remittance" button. Pass `onEdit` and `onEditRemit` callbacks as props.

Update the Props type:

```ts
type Props = {
  deduction: FinanceRequestDeductionRecord;
  onClose: () => void;
  onRemit?: () => void;
  onEdit?: (d: FinanceRequestDeductionRecord) => void;
  onEditRemit?: (d: FinanceRequestDeductionRecord) => void;
};
```

Add edit buttons in the panel body, near the existing Remit button:

```tsx
{!isRemitted && onEdit && (
  <Button variant="secondary" onClick={() => onEdit(deduction)}>Edit</Button>
)}
{isRemitted && onEditRemit && (
  <Button variant="secondary" onClick={() => onEditRemit(deduction)}>Edit Remittance</Button>
)}
```

Update the `RequestDeductionDetailPanel` usage in `StatutoryDeductionsPage.tsx` to pass the new props:

```tsx
<RequestDeductionDetailPanel
  deduction={selectedDeduction}
  onClose={() => setSelectedDeduction(null)}
  onRemit={() => { ... }}
  onEdit={(d) => { setSelectedDeduction(null); openEditDeduction(d); }}
  onEditRemit={(d) => { setSelectedDeduction(null); openEditRemittance(d); }}
/>
```

- [ ] **Step 6: Verify compilation**

Run: `node -e "const ts = require('typescript'); ['apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx', 'apps/pwa/src/pages/finance/deductions/RequestDeductionDetailPanel.tsx'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, esModuleInterop: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: 0 diagnostics.

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx apps/pwa/src/pages/finance/deductions/RequestDeductionDetailPanel.tsx
git commit -m "feat(pwa): add deduction and remittance edit UI"
```

### Task 6: Backend Tests

**Files:**
- Create: `api/src/modules/finance/__tests__/finance-edit.spec.ts`
- Test: Jest (same pattern as existing tests)

- [ ] **Step 1: Write tests for journal entry update**

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinanceService } from '../finance.service';

function createService(prisma) {
  return new FinanceService(prisma, {} as any, {} as any, {} as any);
}

describe('FinanceService — journal entry updates', () => {
  let prisma;

  beforeEach(() => {
    prisma = {
      financeJournalEntry: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      financeJournalLine: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      financeReportingPeriod: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rp-1' }),
      },
      $transaction: jest.fn(async (fn) => fn(prisma)),
    };
    jest.clearAllMocks();
  });

  it('throws NotFoundException when entry not found', async () => {
    prisma.financeJournalEntry.findUnique.mockResolvedValue(null);
    const service = createService(prisma);
    await expect(
      service.updateManualJournalEntry('nonexistent', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for non-manual source types', async () => {
    prisma.financeJournalEntry.findUnique.mockResolvedValue({
      id: 'je-1', sourceType: 'finance_income', lines: [],
    });
    const service = createService(prisma);
    await expect(
      service.updateManualJournalEntry('je-1', { memo: 'test' }),
    ).rejects.toThrow('Only manual entries can be edited');
  });

  it('updates memo and lines for manual entry', async () => {
    prisma.financeJournalEntry.findUnique
      .mockResolvedValueOnce({
        id: 'je-1', sourceType: 'manual_entry', entryDate: new Date(),
        memo: 'old', currency: 'NGN', lines: [
          { chartAccountId: 'a', organizationId: null, teamId: null, fundId: null, grantId: null, debit: 100, credit: 0, description: '' },
          { chartAccountId: 'b', organizationId: null, teamId: null, fundId: null, grantId: null, debit: 0, credit: 100, description: '' },
        ],
      })
      .mockResolvedValueOnce({
        id: 'je-1', sourceType: 'manual_entry', memo: 'updated',
        lines: [{ chartAccount: { id: 'a', code: '100', name: 'Cash' } }],
      });

    const service = createService(prisma);
    const result = await service.updateManualJournalEntry('je-1', {
      memo: 'updated',
      lines: [
        { chart_account_id: 'a', debit: 200, credit: 0 },
        { chart_account_id: 'b', debit: 0, credit: 200 },
      ],
    });

    expect(prisma.financeJournalLine.deleteMany).toHaveBeenCalledWith({ where: { journalEntryId: 'je-1' } });
    expect(prisma.financeJournalEntry.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write tests for deduction updates**

Add to the same file:

```ts
import { DeductionService } from '../deduction.service';

function createDeductionService(prisma) {
  return new DeductionService(prisma, {} as any);
}

describe('DeductionService — deduction updates', () => {
  let prisma;

  beforeEach(() => {
    prisma = {
      financeRequestDeduction: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      financeDeductionType: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    jest.clearAllMocks();
  });

  it('throws NotFoundException when deduction not found', async () => {
    prisma.financeRequestDeduction.findUnique.mockResolvedValue(null);
    const service = createDeductionService(prisma);
    await expect(
      service.updatePendingDeduction('nonexistent', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when deduction is not pending', async () => {
    prisma.financeRequestDeduction.findUnique.mockResolvedValue({
      id: 'd-1', status: 'remitted',
    });
    const service = createDeductionService(prisma);
    await expect(
      service.updatePendingDeduction('d-1', { amount: 500 }),
    ).rejects.toThrow('Only pending deductions can be edited');
  });

  it('updates pending deduction fields', async () => {
    prisma.financeRequestDeduction.findUnique.mockResolvedValue({
      id: 'd-1', status: 'pending',
    });
    prisma.financeRequestDeduction.update.mockResolvedValue({
      id: 'd-1', status: 'pending', amount: 500,
    });

    const service = createDeductionService(prisma);
    await service.updatePendingDeduction('d-1', { amount: 500, notes: 'corrected' });

    expect(prisma.financeRequestDeduction.update).toHaveBeenCalledWith({
      where: { id: 'd-1' },
      data: { amount: 500, notes: 'corrected' },
    });
  });

  it('throws BadRequestException when remitted deduction update attempted via pending method', async () => {
    prisma.financeRequestDeduction.findUnique.mockResolvedValue({
      id: 'd-1', status: 'remitted',
    });
    const service = createDeductionService(prisma);
    await expect(
      service.updateRemittanceRecord('d-1', { remittance_ref: 'new' }),
    ).rejects.toThrow('Only remitted deductions can be edited');
  });

  it('updates remittance record fields', async () => {
    prisma.financeRequestDeduction.findUnique.mockResolvedValue({
      id: 'd-1', status: 'remitted',
    });
    prisma.financeRequestDeduction.update.mockResolvedValue({});

    const service = createDeductionService(prisma);
    await service.updateRemittanceRecord('d-1', {
      remittance_ref: 'FIRS/2026/Q1',
      notes: 'updated ref',
    });

    expect(prisma.financeRequestDeduction.update).toHaveBeenCalledWith({
      where: { id: 'd-1' },
      data: { remittanceRef: 'FIRS/2026/Q1', notes: 'updated ref' },
    });
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/__tests__/finance-edit.spec.ts
git commit -m "test(api): cover journal entry and deduction update methods"
```

### Task 7: Final Verification

**Files:**
- Modify: none
- Test: full verification

- [ ] **Step 1: Verify all backend files compile**

Run: `node -e "const ts = require('typescript'); ['api/src/modules/finance/dto/update-journal-entry.dto.ts', 'api/src/modules/finance/dto/update-deduction.dto.ts', 'api/src/modules/finance/finance.controller.ts', 'api/src/modules/finance/finance.service.ts', 'api/src/modules/finance/deduction.service.ts'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, emitDecoratorMetadata: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: All 0 diagnostics.

- [ ] **Step 2: Verify all frontend files compile**

Run: `node -e "const ts = require('typescript'); ['apps/shared/src/api/finance-api.ts', 'apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx', 'apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx', 'apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx', 'apps/pwa/src/pages/finance/deductions/RequestDeductionDetailPanel.tsx'].forEach(f => { const src = require('fs').readFileSync(f, 'utf8'); const r = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, esModuleInterop: true } }); console.log(f + ': ' + (r.diagnostics?.length || 0) + ' diagnostics'); })"`
Expected: All 0 diagnostics.

- [ ] **Step 3: Final commit if needed**

```bash
git status
git log --oneline -5
```
