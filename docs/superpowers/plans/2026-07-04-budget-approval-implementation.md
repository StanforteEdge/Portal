# Budget Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a revision-based budget approval workflow in `apps/pwa`, add staff-facing team and project budget entry points, and reuse one shared budget feature across team, project, and finance views.

**Architecture:** Keep `FinanceBudget` as the logical budget record and introduce revision-scoped approval records (`FinanceBudgetRevision`, `FinanceBudgetRevisionLine`, revision file links). In `apps/pwa`, create a shared `features/budgets` module that renders the same budget list/detail/editor experience in three contexts: owner mode inside Teams and Projects, and finance oversight mode inside Finance.

**Tech Stack:** NestJS, Prisma, PostgreSQL, class-validator, React, React Router, TypeScript, `apps/pwa` shared UI/core APIs.

---

## File Map

### Backend

- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_budget_revisions/migration.sql`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Modify: `api/src/modules/finance/finance.module.ts`
- Modify: `api/src/modules/finance/dto/upsert-finance-budget.dto.ts`
- Create: `api/src/modules/finance/dto/copy-finance-budget.dto.ts`
- Create: `api/src/modules/finance/dto/submit-finance-budget-revision.dto.ts`
- Create: `api/src/modules/finance/dto/action-finance-budget-revision.dto.ts`
- Create: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

### Frontend Shared Budget Feature (`apps/pwa` only)

- Create: `apps/pwa/src/features/budgets/budget-types.ts`
- Create: `apps/pwa/src/features/budgets/budget-api.ts`
- Create: `apps/pwa/src/features/budgets/BudgetWorkspace.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetSummaryPanel.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetRevisionTimeline.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetEditorPanel.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetListPanel.tsx`

### Frontend Pages and Routing (`apps/pwa` only)

- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`
- Create: `apps/pwa/src/pages/teams/TeamsPage.tsx`
- Create: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetsPage.tsx`
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetDetailPage.tsx`
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetEditorPage.tsx`

### Docs

- Already written: `docs/superpowers/specs/2026-07-04-budget-approval-design.md`
- Already written: `docs/superpowers/specs/2026-07-04-budget-usage-manual.md`

## Task 1: Add Revision Tables and Active Revision Link

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_budget_revisions/migration.sql`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Write the failing schema-oriented service test**

Create `api/src/modules/finance/__tests__/budget-revisions.spec.ts` with the first failing test:

```ts
import { FinanceService } from '../finance.service';

describe('FinanceService budget revisions', () => {
  const prisma: any = {
    financeBudget: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    financeBudgetRevision: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    financeBudgetRevisionLine: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeBudgetAssumption: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeBudgetPortfolio: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeFund: { findUnique: jest.fn() },
    financeGrant: { findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  };

  const service = new FinanceService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('creates a draft revision when creating a budget', async () => {
    prisma.financeBudget.create.mockResolvedValue({ id: 'budget-1' });
    prisma.financeBudgetRevision.create.mockResolvedValue({ id: 'rev-1', budgetId: 'budget-1', revisionNumber: 1, status: 'draft' });
    prisma.financeBudget.findUnique.mockResolvedValue({
      id: 'budget-1',
      name: 'July OPEX',
      status: 'draft',
      currentActiveRevisionId: null,
      draftRevisionId: 'rev-1',
      revisions: [{ id: 'rev-1', revisionNumber: 1, status: 'draft', lines: [] }],
      currentActiveRevision: null,
      draftRevision: { id: 'rev-1', revisionNumber: 1, status: 'draft', lines: [] },
      lines: [],
      assumptions: [],
      portfolio: [],
      fund: null,
      grant: null,
    });

    const dto = {
      name: 'July OPEX',
      scope_type: 'team',
      budget_type: 'team',
      period_type: 'monthly',
      month: 7,
      fiscal_year: 2026,
      team_id: '4',
      lines: [{ line_name: 'Rent', total_amount: 100000 }],
    };

    const result = await (service as any).createBudget(dto, '9');

    expect(prisma.financeBudgetRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          budgetId: 'budget-1',
          revisionNumber: 1,
          status: 'draft',
        }),
      }),
    );
    expect(result.id).toBe('budget-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: FAIL because revision models and logic do not exist.

- [ ] **Step 3: Add Prisma models and budget links**

Update `api/prisma/schema.prisma` by extending `FinanceBudget` and adding revision models:

```prisma
model FinanceBudget {
  id                      String    @id @default(uuid()) @db.Uuid
  currentActiveRevisionId String?   @map("current_active_revision_id") @db.Uuid
  draftRevisionId         String?   @map("draft_revision_id") @db.Uuid
  ownerType               String?   @map("owner_type") @db.VarChar(30)
  ownerId                 BigInt?   @map("owner_id")
  preparedBy              BigInt?   @map("prepared_by")
  revisions               FinanceBudgetRevision[]
  currentActiveRevision   FinanceBudgetRevision? @relation("BudgetActiveRevision", fields: [currentActiveRevisionId], references: [id], onDelete: SetNull)
  draftRevision           FinanceBudgetRevision? @relation("BudgetDraftRevision", fields: [draftRevisionId], references: [id], onDelete: SetNull)
}

model FinanceBudgetRevision {
  id                    String    @id @default(uuid()) @db.Uuid
  budgetId              String    @map("budget_id") @db.Uuid
  revisionNumber        Int       @map("revision_number")
  status                String    @default("draft") @db.VarChar(30)
  submissionNote        String?   @map("submission_note")
  justification         String?
  materialChangeSummary String?   @map("material_change_summary")
  copiedFromRevisionId  String?   @map("copied_from_revision_id") @db.Uuid
  submittedBy           BigInt?   @map("submitted_by")
  submittedAt           DateTime? @map("submitted_at")
  approvedBy            BigInt?   @map("approved_by")
  approvedAt            DateTime? @map("approved_at")
  workflowInstanceId    String?   @map("workflow_instance_id") @db.Uuid
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  budget             FinanceBudget           @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  copiedFromRevision FinanceBudgetRevision?  @relation("BudgetRevisionCopySource", fields: [copiedFromRevisionId], references: [id], onDelete: SetNull)
  copiedToRevisions  FinanceBudgetRevision[] @relation("BudgetRevisionCopySource")
  lines              FinanceBudgetRevisionLine[]

  @@unique([budgetId, revisionNumber])
  @@index([budgetId, status])
  @@map("sta_finance_budget_revisions")
}

model FinanceBudgetRevisionLine {
  id               String   @id @default(uuid()) @db.Uuid
  budgetRevisionId String   @map("budget_revision_id") @db.Uuid
  chartAccountId   String?  @map("chart_account_id") @db.Uuid
  projectId        BigInt?  @map("project_id")
  fundId           String?  @map("fund_id") @db.Uuid
  grantId          String?  @map("grant_id") @db.Uuid
  section          String   @default("expenditure") @db.VarChar(20)
  groupName        String?  @map("group_name") @db.VarChar(120)
  lineLabel        String   @map("line_label") @db.VarChar(180)
  amount           Decimal  @db.Decimal(15, 2)
  period1Amount    Decimal? @map("period_1_amount") @db.Decimal(15, 2)
  period2Amount    Decimal? @map("period_2_amount") @db.Decimal(15, 2)
  period3Amount    Decimal? @map("period_3_amount") @db.Decimal(15, 2)
  period4Amount    Decimal? @map("period_4_amount") @db.Decimal(15, 2)
  totalAmount      Decimal? @map("total_amount") @db.Decimal(15, 2)
  notes            String?
  sortOrder        Int      @default(0) @map("sort_order")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  revision FinanceBudgetRevision @relation(fields: [budgetRevisionId], references: [id], onDelete: Cascade)

  @@index([budgetRevisionId, sortOrder])
  @@map("sta_finance_budget_revision_lines")
}
```

- [ ] **Step 4: Create the migration SQL**

Run: `pnpm prisma migrate dev --schema api/prisma/schema.prisma --name budget_revisions`
Expected: migration file generated with revision tables and new `FinanceBudget` links.

- [ ] **Step 5: Run the focused test again**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: still FAIL, but now on missing service implementation rather than schema shape.

- [ ] **Step 6: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat: add budget revision schema"
```

## Task 2: Refactor Budget Create/Update into Draft Revision Writes

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`
- Modify: `api/src/modules/finance/dto/upsert-finance-budget.dto.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Add failing tests for draft revision save behavior**

Extend `budget-revisions.spec.ts` with:

```ts
it('updates the draft revision instead of overwriting the approved baseline', async () => {
  prisma.financeBudget.findUnique.mockResolvedValueOnce({
    id: 'budget-1',
    currentActiveRevisionId: 'rev-1',
    draftRevisionId: 'rev-2',
    status: 'approved',
  });
  prisma.financeBudgetRevision.update.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-1', revisionNumber: 2, status: 'draft' });
  prisma.financeBudget.findUnique.mockResolvedValueOnce({
    id: 'budget-1',
    draftRevisionId: 'rev-2',
    currentActiveRevisionId: 'rev-1',
    revisions: [{ id: 'rev-2', revisionNumber: 2, status: 'draft', lines: [] }],
    currentActiveRevision: { id: 'rev-1', revisionNumber: 1, status: 'approved', lines: [] },
    draftRevision: { id: 'rev-2', revisionNumber: 2, status: 'draft', lines: [] },
    lines: [], assumptions: [], portfolio: [], fund: null, grant: null,
  });

  await (service as any).updateBudget('budget-1', {
    name: 'July OPEX Revised',
    scope_type: 'team',
    budget_type: 'team',
    period_type: 'monthly',
    month: 7,
    fiscal_year: 2026,
    team_id: '4',
    lines: [{ line_name: 'Rent', total_amount: 120000 }],
  }, '9');

  expect(prisma.financeBudgetRevision.update).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: FAIL because `updateBudget()` still rewrites `FinanceBudgetLine` directly.

- [ ] **Step 3: Add DTO fields for revision metadata**

Extend `UpsertFinanceBudgetDto`:

```ts
@ApiPropertyOptional()
@IsOptional()
@IsString()
justification?: string;

@ApiPropertyOptional()
@IsOptional()
@IsString()
submission_note?: string;

@ApiPropertyOptional({ type: [String] })
@IsOptional()
@IsArray()
@IsUUID('4', { each: true })
supporting_file_ids?: string[];
```

- [ ] **Step 4: Split budget persistence helpers in `finance.service.ts`**

Add focused helpers:

```ts
private async ensureBudgetDraftRevisionTx(tx: Prisma.TransactionClient, budgetId: string, actorId?: string) {
  const budget = await tx.financeBudget.findUnique({ where: { id: budgetId } });
  if (!budget) throw new NotFoundException('Budget not found');
  if (budget.draftRevisionId) return budget.draftRevisionId;

  const latest = await tx.financeBudgetRevision.findFirst({
    where: { budgetId },
    orderBy: { revisionNumber: 'desc' },
  });

  const revision = await tx.financeBudgetRevision.create({
    data: {
      budgetId,
      revisionNumber: (latest?.revisionNumber ?? 0) + 1,
      status: 'draft',
      copiedFromRevisionId: budget.currentActiveRevisionId ?? null,
    },
  });

  await tx.financeBudget.update({
    where: { id: budgetId },
    data: { draftRevisionId: revision.id, updatedBy: actorId ? toBigInt(actorId) : null },
  });

  return revision.id;
}
```

- [ ] **Step 5: Rewrite `upsertBudget()` to persist draft revisions**

Change persistence to write revision-scoped records instead of overwriting approved baselines:

```ts
const revisionId = id
  ? await this.ensureBudgetDraftRevisionTx(tx, id, actorId)
  : createdRevision.id;

await tx.financeBudgetRevision.update({
  where: { id: revisionId },
  data: {
    status: 'draft',
    justification: dto.justification?.trim() || null,
    submissionNote: dto.submission_note?.trim() || null,
  },
});

await tx.financeBudgetRevisionLine.deleteMany({ where: { budgetRevisionId: revisionId } });
await tx.financeBudgetRevisionLine.createMany({
  data: lines.map((line: any, index: number) => ({
    budgetRevisionId: revisionId,
    chartAccountId: line.chart_account_id || null,
    projectId: line.project_id ? this.parseId(String(line.project_id), 'line project_id') : null,
    fundId: line.fund_id || null,
    grantId: line.grant_id || null,
    section: String(line.section || 'expenditure').trim(),
    groupName: line.group_name ? String(line.group_name).trim() : null,
    lineLabel: String(line.line_name || line.line_label || '').trim(),
    amount: this.resolveLineTotal(line),
    period1Amount: line.period_1_amount ?? null,
    period2Amount: line.period_2_amount ?? null,
    period3Amount: line.period_3_amount ?? null,
    period4Amount: line.period_4_amount ?? null,
    totalAmount: this.resolveLineTotal(line),
    notes: line.notes ? String(line.notes).trim() : null,
    sortOrder: Number(line.sort_order ?? index),
  })),
});
```

- [ ] **Step 6: Run focused tests**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: PASS for draft creation/update tests.

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/dto/upsert-finance-budget.dto.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat: save budgets through draft revisions"
```

## Task 3: Add Submit/Approve/Reject/Return Revision Workflow

**Files:**
- Create: `api/src/modules/finance/dto/submit-finance-budget-revision.dto.ts`
- Create: `api/src/modules/finance/dto/action-finance-budget-revision.dto.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Write failing tests for submission and approval**

Add tests:

```ts
it('submits a draft revision and stamps submitted metadata', async () => {
  prisma.financeBudgetRevision.findUnique.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-1', status: 'draft', revisionNumber: 2 });
  prisma.financeBudgetRevision.update.mockResolvedValue({ id: 'rev-2', status: 'approval' });

  await (service as any).submitBudgetRevision('rev-2', '9', { comment: 'Please review July OPEX' });

  expect(prisma.financeBudgetRevision.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'rev-2' },
      data: expect.objectContaining({ status: 'approval' }),
    }),
  );
});

it('approves a revision and marks it active on the budget', async () => {
  prisma.financeBudgetRevision.findUnique.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-1', status: 'approval', revisionNumber: 2 });
  prisma.financeBudgetRevision.update.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-1', status: 'approved', revisionNumber: 2 });
  prisma.financeBudget.update.mockResolvedValue({ id: 'budget-1', currentActiveRevisionId: 'rev-2', draftRevisionId: null });

  await (service as any).approveBudgetRevision('rev-2', '9', { action: 'approve', comment: 'Approved' });

  expect(prisma.financeBudget.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'budget-1' },
      data: expect.objectContaining({ currentActiveRevisionId: 'rev-2', draftRevisionId: null }),
    }),
  );
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: FAIL because submit/approve methods and DTOs do not exist.

- [ ] **Step 3: Add the DTOs**

Create `submit-finance-budget-revision.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitFinanceBudgetRevisionDto {
  @ApiPropertyOptional({ example: 'Please review July OPEX budget' })
  @IsOptional()
  @IsString()
  comment?: string;
}
```

Create `action-finance-budget-revision.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ActionFinanceBudgetRevisionDto {
  @ApiPropertyOptional({ example: 'approve' })
  @IsOptional()
  @IsIn(['approve', 'reject', 'return'])
  action?: 'approve' | 'reject' | 'return';

  @ApiPropertyOptional({ example: 'Numbers align with approved ceiling' })
  @IsOptional()
  @IsString()
  comment?: string;
}
```

- [ ] **Step 4: Add controller endpoints**

Extend `finance.controller.ts` with:

```ts
@Get('budgets/:id/revisions')
@Permissions('finance.view')
listBudgetRevisions(@Param('id') id: string) {
  return this.financeService.listBudgetRevisions(id);
}

@Post('budget-revisions/:revisionId/submit')
@Permissions('finance.manage')
submitBudgetRevision(@Param('revisionId') revisionId: string, @Req() req: any, @Body() dto: SubmitFinanceBudgetRevisionDto) {
  return this.financeService.submitBudgetRevision(revisionId, req.user?.id, dto);
}

@Post('budget-revisions/:revisionId/approve')
@Permissions('finance.manage')
approveBudgetRevision(@Param('revisionId') revisionId: string, @Req() req: any, @Body() dto: ActionFinanceBudgetRevisionDto) {
  return this.financeService.approveBudgetRevision(revisionId, req.user?.id, dto);
}

@Post('budget-revisions/:revisionId/reject')
@Permissions('finance.manage')
rejectBudgetRevision(@Param('revisionId') revisionId: string, @Req() req: any, @Body() dto: ActionFinanceBudgetRevisionDto) {
  return this.financeService.rejectBudgetRevision(revisionId, req.user?.id, dto);
}

@Post('budget-revisions/:revisionId/return')
@Permissions('finance.manage')
returnBudgetRevision(@Param('revisionId') revisionId: string, @Req() req: any, @Body() dto: ActionFinanceBudgetRevisionDto) {
  return this.financeService.returnBudgetRevision(revisionId, req.user?.id, dto);
}
```

- [ ] **Step 5: Implement service methods with request-style transitions**

Add methods like:

```ts
async submitBudgetRevision(revisionId: string, actorId?: string, dto?: { comment?: string }) {
  const revision = await this.prisma.financeBudgetRevision.findUnique({ where: { id: revisionId } });
  if (!revision) throw new NotFoundException('Budget revision not found');
  if (revision.status !== 'draft' && revision.status !== 'returned') {
    throw new BadRequestException('Only draft or returned revisions can be submitted');
  }

  return this.prisma.financeBudgetRevision.update({
    where: { id: revisionId },
    data: {
      status: 'approval',
      submissionNote: dto?.comment?.trim() || revision.submissionNote,
      submittedBy: actorId ? toBigInt(actorId) : null,
      submittedAt: new Date(),
    },
  });
}
```

Approval must mark the revision active on the budget and supersede the previously active approved revision.

- [ ] **Step 6: Run tests**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: PASS for revision transition tests.

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/finance/finance.controller.ts api/src/modules/finance/finance.service.ts api/src/modules/finance/dto/submit-finance-budget-revision.dto.ts api/src/modules/finance/dto/action-finance-budget-revision.dto.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat: add budget revision approval flow"
```

## Task 4: Add Copy Budget and New Revision Creation

**Files:**
- Create: `api/src/modules/finance/dto/copy-finance-budget.dto.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Write failing tests for copy behavior**

Add tests:

```ts
it('copies an approved budget into a new draft budget', async () => {
  prisma.financeBudget.findUnique.mockResolvedValue({
    id: 'budget-1',
    name: 'June OPEX',
    scopeType: 'team',
    budgetType: 'team',
    periodType: 'monthly',
    fiscalYear: 2026,
    month: 6,
    currentActiveRevisionId: 'rev-1',
    currentActiveRevision: {
      id: 'rev-1',
      revisionNumber: 1,
      lines: [{ lineLabel: 'Rent', totalAmount: 100000 }],
    },
    assumptions: [],
    portfolio: [],
    fund: null,
    grant: null,
  });
  prisma.financeBudget.create.mockResolvedValue({ id: 'budget-2' });
  prisma.financeBudgetRevision.create.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-2', revisionNumber: 1, status: 'draft' });

  await (service as any).copyBudget('budget-1', { mode: 'full', period_shift: 'next_month' }, '9');

  expect(prisma.financeBudget.create).toHaveBeenCalled();
  expect(prisma.financeBudgetRevisionLine.createMany).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: FAIL because copy endpoint/service do not exist.

- [ ] **Step 3: Add the copy DTO**

Create `copy-finance-budget.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class CopyFinanceBudgetDto {
  @ApiPropertyOptional({ example: 'full' })
  @IsOptional()
  @IsIn(['full', 'header_only', 'header_lines_assumptions'])
  mode?: 'full' | 'header_only' | 'header_lines_assumptions';

  @ApiPropertyOptional({ example: 'next_month' })
  @IsOptional()
  @IsIn(['same_period', 'next_month', 'next_quarter', 'next_fiscal_year'])
  period_shift?: 'same_period' | 'next_month' | 'next_quarter' | 'next_fiscal_year';
}
```

- [ ] **Step 4: Add controller and service copy methods**

Controller endpoint:

```ts
@Post('budgets/:id/copy')
@Permissions('finance.manage')
copyBudget(@Param('id') id: string, @Req() req: any, @Body() dto: CopyFinanceBudgetDto) {
  return this.financeService.copyBudget(id, dto, req.user?.id);
}
```

Service method skeleton:

```ts
async copyBudget(id: string, dto: CopyFinanceBudgetDto, actorId?: string) {
  const source = await this.prisma.financeBudget.findUnique({
    where: { id },
    include: {
      currentActiveRevision: { include: { lines: true } },
      assumptions: true,
      portfolio: true,
      fund: true,
      grant: true,
    },
  });
  if (!source) throw new NotFoundException('Budget not found');

  const shifted = this.shiftCopiedBudgetPeriod(source, dto.period_shift ?? 'same_period');
  return this.createBudget(this.buildCopiedBudgetPayload(source, shifted, dto.mode ?? 'full'), actorId);
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: PASS for copy behavior.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/finance/dto/copy-finance-budget.dto.ts api/src/modules/finance/finance.controller.ts api/src/modules/finance/finance.service.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat: add budget copy workflow"
```

## Task 5: Return Revision-Aware Budget Responses and Scope Filters

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Add failing tests for response shape**

Add a serialization test:

```ts
it('returns current active revision and draft revision metadata in budget detail', async () => {
  prisma.financeBudget.findUnique.mockResolvedValue({
    id: 'budget-1',
    name: 'July OPEX',
    currentActiveRevisionId: 'rev-1',
    draftRevisionId: 'rev-2',
    currentActiveRevision: { id: 'rev-1', revisionNumber: 1, status: 'approved', lines: [] },
    draftRevision: { id: 'rev-2', revisionNumber: 2, status: 'draft', lines: [] },
    revisions: [],
    lines: [], assumptions: [], portfolio: [], fund: null, grant: null,
  });

  const result = await (service as any).getBudget('budget-1');

  expect(result.current_active_revision?.id).toBe('rev-1');
  expect(result.draft_revision?.id).toBe('rev-2');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: FAIL because budget serialization only returns flat lines/status.

- [ ] **Step 3: Update budget includes and serializer**

Modify `findMany` / `findUnique` includes and `serializeBudget()` so they return:

```ts
include: {
  fund: true,
  grant: true,
  assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  currentActiveRevision: { include: { lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } },
  draftRevision: { include: { lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } },
  revisions: { orderBy: [{ revisionNumber: 'desc' }] },
}
```

Expose revision-aware fields while preserving compatibility:

```ts
return {
  id: row.id,
  name: row.name,
  status: row.currentActiveRevision?.status ?? row.status,
  total_budget: Number(row.totalBudget ?? 0),
  current_active_revision: row.currentActiveRevision ? this.serializeBudgetRevision(row.currentActiveRevision) : null,
  draft_revision: row.draftRevision ? this.serializeBudgetRevision(row.draftRevision) : null,
  revisions: (row.revisions || []).map((revision) => this.serializeBudgetRevisionSummary(revision)),
  lines: row.draftRevision?.lines?.length
    ? row.draftRevision.lines.map((line) => this.serializeBudgetRevisionLine(line))
    : row.currentActiveRevision?.lines?.map((line) => this.serializeBudgetRevisionLine(line)) ?? [],
};
```

- [ ] **Step 4: Add `listBudgetRevisions()` and owner-scope filters**

Add:

```ts
async listBudgetRevisions(budgetId: string) {
  const revisions = await this.prisma.financeBudgetRevision.findMany({
    where: { budgetId },
    include: { lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    orderBy: [{ revisionNumber: 'desc' }],
  });
  return revisions.map((revision) => this.serializeBudgetRevision(revision));
}
```

Extend `listBudgets(query)` so the future Teams/Projects pages can call it with filters like:
- `scope_type=team&team_id=<id>`
- `scope_type=project&project_id=<id>`
- `owner_id=<profileId>`

- [ ] **Step 5: Run tests**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: PASS for detail serialization and scope filter expectations.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat: expose revision-aware budget api"
```

## Task 6: Create Shared Budget Feature in `apps/pwa`

**Files:**
- Create: `apps/pwa/src/features/budgets/budget-types.ts`
- Create: `apps/pwa/src/features/budgets/budget-api.ts`
- Create: `apps/pwa/src/features/budgets/BudgetWorkspace.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetSummaryPanel.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetRevisionTimeline.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetEditorPanel.tsx`
- Create: `apps/pwa/src/features/budgets/BudgetListPanel.tsx`

- [ ] **Step 1: Create shared types and API wrappers**

Add `budget-types.ts`:

```ts
export type BudgetScopeContext = {
  scopeType: 'team' | 'project' | 'finance';
  scopeId?: string;
  mode: 'owner' | 'finance';
};

export type BudgetRevisionRecord = {
  id: string;
  revision_number: number;
  status: string;
  submitted_at?: string | null;
  approved_at?: string | null;
};
```

Add `budget-api.ts` wrappers around `financeApi`:

```ts
import { financeApi } from '@/shared/lib/core';

export const budgetApi = {
  list: (query?: Record<string, unknown>) => financeApi.listBudgets(query),
  get: (id: string) => financeApi.getBudget(id),
  create: (payload: Record<string, unknown>) => financeApi.createBudget?.(payload),
  update: (id: string, payload: Record<string, unknown>) => financeApi.updateBudget?.(id, payload),
  revisions: (id: string) => financeApi.listBudgetRevisions?.(id),
  submitRevision: (revisionId: string, payload?: Record<string, unknown>) => financeApi.submitBudgetRevision?.(revisionId, payload),
  approveRevision: (revisionId: string, payload?: Record<string, unknown>) => financeApi.approveBudgetRevision?.(revisionId, payload),
  rejectRevision: (revisionId: string, payload?: Record<string, unknown>) => financeApi.rejectBudgetRevision?.(revisionId, payload),
  returnRevision: (revisionId: string, payload?: Record<string, unknown>) => financeApi.returnBudgetRevision?.(revisionId, payload),
  copy: (id: string, payload?: Record<string, unknown>) => financeApi.copyBudget?.(id, payload),
};
```

- [ ] **Step 2: Create reusable display panels**

`BudgetSummaryPanel.tsx` should render:
- total budget
- actual spend
- variance
- scope summary
- notes

`BudgetRevisionTimeline.tsx` should render:
- revision selector
- revision status chips
- submit/approve/return/reject buttons depending on `mode`

`BudgetListPanel.tsx` should render:
- list/register table
- optional `New Budget` and `Copy` actions
- filters supplied by context

- [ ] **Step 3: Create `BudgetEditorPanel.tsx` from shared form logic**

Move editor behavior out of finance-only page assumptions:

```tsx
type BudgetEditorPanelProps = {
  context: BudgetScopeContext;
  budgetId?: string;
  onSaved?: (budgetId: string) => void;
};
```

It must accept pre-scoped defaults:
- team mode pre-fills `scope_type=team`, `team_id`
- project mode pre-fills `scope_type=project`, `project_id`
- finance mode allows broader scope switching

- [ ] **Step 4: Create `BudgetWorkspace.tsx` as the orchestrator**

`BudgetWorkspace.tsx` should load budgets, pick the selected budget, and compose the shared panels:

```tsx
type BudgetWorkspaceProps = {
  context: BudgetScopeContext;
  selectedBudgetId?: string;
  layout?: 'embedded' | 'full-page';
};
```

It should:
- call `budgetApi.list()` with scope filters based on context
- show only team/project budgets in owner views
- allow finance mode to show all budgets or filtered budgets

- [ ] **Step 5: Run frontend typecheck**

Run: `pnpm --filter pwa tsc --noEmit`
Expected: PASS or only unrelated existing failures.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/features/budgets
git commit -m "feat: add shared pwa budget workspace"
```

## Task 7: Add Staff-Facing Teams Pages and Navigation

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`
- Create: `apps/pwa/src/pages/teams/TeamsPage.tsx`
- Create: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`

- [ ] **Step 1: Add routes for teams**

Extend `App.tsx`:

```tsx
import TeamsPage from '@/pages/teams/TeamsPage';
import TeamDetailPage from '@/pages/teams/TeamDetailPage';

<Route path="/teams" element={<TeamsPage />} />
<Route path="/teams/:id" element={<TeamDetailPage />} />
```

- [ ] **Step 2: Add staff navigation entry**

Extend `shared/navigation.ts` staff section:

```ts
{ label: 'Teams', icon: 'groups', path: '/teams', section: 'Staff' },
```

- [ ] **Step 3: Create `TeamsPage.tsx`**

This page should show the teams the current user belongs to or leads.

Use the existing workspace profile source:

```tsx
const { data: profile } = useCachedQuery('user:profile', () => getWorkspaceProfile(), { ttlMs: 60_000, storage: 'memory' });
const teams = profile?.teams ?? profile?.groups ?? [];
```

Render cards with:
- team name
- team type
- role
- quick link to `/teams/:id`

- [ ] **Step 4: Create `TeamDetailPage.tsx`**

This page should provide tabs/sections for:
- Overview
- Members
- Projects
- Budgets
- Requests

Use placeholder sections for Members/Projects/Requests where data is not yet fully available, but the Budgets section must embed the shared budget workspace:

```tsx
<BudgetWorkspace context={{ scopeType: 'team', scopeId: id, mode: 'owner' }} layout="embedded" />
```

- [ ] **Step 5: Run frontend typecheck**

Run: `pnpm --filter pwa tsc --noEmit`
Expected: PASS or only unrelated existing failures.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/shared/navigation.ts apps/pwa/src/pages/teams/TeamsPage.tsx apps/pwa/src/pages/teams/TeamDetailPage.tsx
git commit -m "feat: add staff teams pages"
```

## Task 8: Scope Budgets into Project Detail

**Files:**
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`

- [ ] **Step 1: Replace the placeholder budget cards with embedded budget workspace**

In `ProjectDetailPage.tsx`, replace the current placeholder block:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <SectionCard title="Budget" description="Project budget allocation">...
</div>
```

with:

```tsx
<SectionCard title="Budgets" description="Project-scoped budgets, revisions, and submissions.">
  <BudgetWorkspace context={{ scopeType: 'project', scopeId: id, mode: 'owner' }} layout="embedded" />
</SectionCard>
```

- [ ] **Step 2: Keep the page scoped to project ownership context**

Do not create a separate standalone project budget page in v1. The project detail page is the owner-facing entry point.

- [ ] **Step 3: Run frontend typecheck**

Run: `pnpm --filter pwa tsc --noEmit`
Expected: PASS or only unrelated existing failures.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/projects/ProjectDetailPage.tsx
git commit -m "feat: add project budget workspace"
```

## Task 9: Refactor Finance Budget Pages to Reuse Shared Budget Feature

**Files:**
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetsPage.tsx`
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetDetailPage.tsx`
- Modify: `apps/pwa/src/pages/finance/budgets/FinanceBudgetEditorPage.tsx`

- [ ] **Step 1: Convert `FinanceBudgetsPage.tsx` into a wrapper**

Replace custom list logic with:

```tsx
<BudgetWorkspace context={{ scopeType: 'finance', mode: 'finance' }} layout="full-page" />
```

Keep the finance `AppShell` and `PageHeader`, but let the shared workspace drive the budget table and actions.

- [ ] **Step 2: Convert `FinanceBudgetDetailPage.tsx` into a wrapper**

Embed the shared workspace in detail mode using the route param budget id. Remove local approve/recalculate-only assumptions and shift those controls into revision-aware actions in the shared feature.

- [ ] **Step 3: Convert `FinanceBudgetEditorPage.tsx` into a wrapper**

Use:

```tsx
<BudgetEditorPanel context={{ scopeType: 'finance', mode: 'finance' }} budgetId={id} onSaved={(savedId) => navigate(`/finance/budgets/${savedId}`)} />
```

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter pwa tsc --noEmit`
Expected: PASS or only unrelated existing failures.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/finance/budgets/FinanceBudgetsPage.tsx apps/pwa/src/pages/finance/budgets/FinanceBudgetDetailPage.tsx apps/pwa/src/pages/finance/budgets/FinanceBudgetEditorPage.tsx
git commit -m "refactor: reuse shared budget feature in finance"
```

## Task 10: Final Verification and Help Alignment

**Files:**
- Modify if needed: `apps/pwa/src/shared/navigation.ts`

- [ ] **Step 1: Run backend tests**

Run: `pnpm test --filter api -- budget-revisions.spec.ts`
Expected: PASS.

- [ ] **Step 2: Run frontend typecheck**

Run: `pnpm --filter pwa tsc --noEmit`
Expected: PASS or only unrelated existing failures.

- [ ] **Step 3: Manual verification pass**

Verify this flow locally:
- open `/teams` and navigate to a team detail
- create a team-scoped budget draft from the team budget section
- submit the draft revision
- approve it from finance
- open `/projects/:id` and create a project-scoped budget
- copy an approved budget into the next month
- confirm finance sees both team and project budgets in `/finance/budgets`

- [ ] **Step 4: Commit any final navigation/help fixes**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx apps/pwa/src/pages/teams apps/pwa/src/pages/projects/ProjectDetailPage.tsx apps/pwa/src/pages/finance/budgets apps/pwa/src/features/budgets
git commit -m "feat: ship scoped budget workspaces"
```

## Spec Coverage Check

- `FinanceBudget + BudgetRevision + BudgetRevisionLine`: covered in Tasks 1, 2, 5.
- Request-style approval flow: covered in Task 3.
- Material-change revisions and immutable approved baseline: covered in Tasks 2 and 3.
- Historical approved revision reporting: covered in Task 5.
- Copy budget flow for monthly OPEX: covered in Task 4.
- Team and project scoped budget entry: covered in Tasks 7 and 8.
- Shared single implementation reused in finance/team/project: covered in Tasks 6 and 9.
- `apps/oldPWA` exclusion: all frontend tasks target `apps/pwa` only.

## Notes for the Implementer

- Do not touch `apps/oldPWA`.
- Do not build a standalone staff `/budgets` route.
- Team/project owner flows should be contextual in their detail pages.
- Keep approved revisions immutable. Any code path that changes approved financial values is a bug.
- Do not try to implement procurement, commitment posting, or vendor workflows in this plan.
