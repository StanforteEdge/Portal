# Budget Request Commitment Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link requests to approved budget revisions and lines, enforce scope-safe budget selection, and record request commitments so budgets can show committed versus actual spend.

**Architecture:** Keep `FinanceBudget` as the scope container and `FinanceBudgetRevision` as the approval baseline. Add a small commitment layer tied to approved revision lines and request ids, validate budget references during request create/update/approval, and expose approved budget/line selection to the request UI without changing the existing budget owner workspace.

**Tech Stack:** Prisma, PostgreSQL migrations, NestJS services/controllers, React TypeScript PWA, shared resource API client.

---

## File Structure

- Modify: `api/prisma/schema.prisma`
  - Add commitment tables and any missing relations from requests to budget artifacts.
- Create: `api/prisma/migrations/<timestamp>_budget_request_commitments/migration.sql`
  - Create commitment tables and indexes.
- Modify: `api/src/modules/finance/finance.service.ts`
  - Add approved-budget lookup helpers and commitment aggregation into budget serialization.
- Modify: `api/src/modules/finance/finance.controller.ts`
  - Expose approved budget line selection endpoint.
- Modify: `api/src/modules/requests/requests.service.ts`
  - Validate `budget_id` / `budget_line_id`, create and update commitments as request state changes.
- Modify: `api/src/modules/requests/dto/create-request.dto.ts`
  - Keep documented request payload keys aligned with implemented validation.
- Modify: `api/src/modules/requests/dto/update-request.dto.ts`
  - Keep request update payload rules aligned with budget linkage.
- Create: `api/src/modules/requests/__tests__/budget-linkage.spec.ts`
  - Cover request validation and commitment lifecycle.
- Modify: `apps/shared/src/api/finance-api.ts`
  - Add endpoint for listing approved budget lines for selection.
- Modify: `apps/pwa/src/pages/requests/requests-api.ts`
  - Add budget lookup helpers for forms.
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`
  - Fetch approved budgets/lines for scope-aware request forms.
- Modify: `apps/pwa/src/pages/requests/new/forms/ProcurementRequestFormPage.tsx`
  - Add budget and budget line selectors.
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`
  - Render linked budget / budget line on request details.
- Modify: `docs/superpowers/specs/2026-07-04-budget-usage-manual.md`
  - Document budget-backed request usage.

## Task 1: Add Commitment Storage To Prisma

**Files:**
- Modify: `api/prisma/schema.prisma`
- Test: `api/prisma/schema.prisma`

- [ ] **Step 1: Add commitment models to Prisma**

```prisma
model FinanceBudgetCommitment {
  id               String   @id @default(uuid()) @db.Uuid
  budgetId         String   @map("budget_id") @db.Uuid
  budgetRevisionId String   @map("budget_revision_id") @db.Uuid
  budgetLineId     String?  @map("budget_line_id") @db.Uuid
  requestId        BigInt   @map("request_id")
  requestItemKey   String?  @map("request_item_key") @db.VarChar(100)
  status           String   @default("reserved") @db.VarChar(30)
  committedAmount  Decimal  @map("committed_amount") @db.Decimal(15, 2)
  actualizedAmount Decimal? @map("actualized_amount") @db.Decimal(15, 2)
  notes            String?
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  budget         FinanceBudget         @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  budgetRevision FinanceBudgetRevision @relation(fields: [budgetRevisionId], references: [id], onDelete: Cascade)
  budgetLine     FinanceBudgetRevisionLine? @relation(fields: [budgetLineId], references: [id], onDelete: SetNull)
  request        RequestInstance       @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([budgetId, status])
  @@index([requestId])
  @@unique([requestId, budgetLineId], name: "unique_request_budget_line_commitment")
  @@map("finance_budget_commitments")
}
```

- [ ] **Step 2: Add reverse relations only where needed**

```prisma
model FinanceBudget {
  commitments FinanceBudgetCommitment[]
}

model FinanceBudgetRevision {
  commitments FinanceBudgetCommitment[]
}

model FinanceBudgetRevisionLine {
  commitments FinanceBudgetCommitment[]
}

model RequestInstance {
  budgetCommitments FinanceBudgetCommitment[]
}
```

- [ ] **Step 3: Run Prisma format**

Run: `npx prisma format --schema api/prisma/schema.prisma`
Expected: `Prisma schema loaded` and `Formatted` output.

- [ ] **Step 4: Commit**

```bash
git add api/prisma/schema.prisma
git commit -m "feat(budgets): add request commitment models"
```

## Task 2: Create Commitment Migration

**Files:**
- Create: `api/prisma/migrations/<timestamp>_budget_request_commitments/migration.sql`
- Test: `api/prisma/migrations/<timestamp>_budget_request_commitments/migration.sql`

- [ ] **Step 1: Generate create-only migration**

Run: `npx prisma migrate dev --schema api/prisma/schema.prisma --name budget_request_commitments --create-only`
Expected: New migration directory created but not applied.

- [ ] **Step 2: Ensure migration SQL creates the new table and indexes**

Verify SQL includes:

```sql
CREATE TABLE "finance_budget_commitments" (
  "id" UUID NOT NULL,
  "budget_id" UUID NOT NULL,
  "budget_revision_id" UUID NOT NULL,
  "budget_line_id" UUID,
  "request_id" BIGINT NOT NULL,
  "request_item_key" VARCHAR(100),
  "status" VARCHAR(30) NOT NULL DEFAULT 'reserved',
  "committed_amount" DECIMAL(15,2) NOT NULL,
  "actualized_amount" DECIMAL(15,2),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "finance_budget_commitments_pkey" PRIMARY KEY ("id")
);
```

- [ ] **Step 3: Apply migration locally**

Run: `npm run prisma:migrate -w api -- --name budget_request_commitments`
Expected: Migration applied and Prisma client regenerated.

- [ ] **Step 4: Commit**

```bash
git add api/prisma/migrations
git commit -m "feat(budgets): migrate request commitment table"
```

## Task 3: Add Approved Budget Lookup APIs

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Write failing test for approved budget line lookup**

Add test:

```ts
it('lists approved budget lines for a project scope', async () => {
  prisma.financeBudget.findMany.mockResolvedValue([
    {
      id: 'budget-1',
      projectId: 9n,
      status: 'approved',
      currentActiveRevision: {
        id: 'rev-1',
        lines: [{ id: 'line-1', lineLabel: 'Travel', totalAmount: 5000, chartAccountId: 'acc-1' }],
      },
    },
  ]);

  const rows = await (service as any).listApprovedBudgetLines({ project_id: '9' });

  expect(rows[0].budget_id).toBe('budget-1');
  expect(rows[0].budget_line_id).toBe('line-1');
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- api/src/modules/finance/__tests__/budget-revisions.spec.ts`
Expected: FAIL because `listApprovedBudgetLines` does not exist.

- [ ] **Step 3: Implement approved budget line lookup in finance service**

Add a method that filters `approved` budgets by scope and returns current active revision lines:

```ts
async listApprovedBudgetLines(query: Record<string, any>) {
  const where: Prisma.FinanceBudgetWhereInput = {
    status: 'approved',
    currentActiveRevisionId: { not: null },
  };
  if (query.project_id) where.projectId = this.parseId(String(query.project_id), 'project_id');
  if (query.team_id) where.teamId = this.parseId(String(query.team_id), 'team_id');
  if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');

  const rows = await this.prisma.financeBudget.findMany({
    where,
    include: { currentActiveRevision: { include: { lines: true } } },
    orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
  });

  return rows.flatMap((budget) =>
    (budget.currentActiveRevision?.lines ?? []).map((line) => ({
      budget_id: budget.id,
      budget_name: budget.name,
      budget_revision_id: budget.currentActiveRevisionId,
      budget_line_id: line.id,
      line_label: line.lineLabel,
      chart_account_id: line.chartAccountId,
      total_amount: Number(line.totalAmount ?? line.amount ?? 0),
      scope_type: budget.scopeType,
    }))
  );
}
```

- [ ] **Step 4: Expose the new endpoint in finance controller**

Add:

```ts
@Get('budgets/approved-lines')
listApprovedBudgetLines(@Query() query: Record<string, any>) {
  return this.financeService.listApprovedBudgetLines(query);
}
```

- [ ] **Step 5: Run test to confirm it passes**

Run: `npm test -- api/src/modules/finance/__tests__/budget-revisions.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/finance.controller.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat(budgets): expose approved budget lines"
```

## Task 4: Validate Budget References On Requests

**Files:**
- Create: `api/src/modules/requests/__tests__/budget-linkage.spec.ts`
- Modify: `api/src/modules/requests/requests.service.ts`
- Modify: `api/src/modules/requests/dto/create-request.dto.ts`
- Modify: `api/src/modules/requests/dto/update-request.dto.ts`

- [ ] **Step 1: Write failing request validation tests**

Add tests:

```ts
it('rejects request budget line when line is not from the active approved revision', async () => {
  prisma.financeBudget.findUnique.mockResolvedValue({
    id: 'budget-1',
    status: 'approved',
    currentActiveRevisionId: 'rev-1',
    currentActiveRevision: { id: 'rev-1', lines: [{ id: 'line-1' }] },
    teamId: 4n,
  });

  await expect(
    (service as any).validateBudgetSelection({ budget_id: 'budget-1', budget_line_id: 'line-2' }, { team_id: '4' })
  ).rejects.toThrow('Invalid budget_line_id');
});

it('accepts approved budget line that matches request scope', async () => {
  prisma.financeBudget.findUnique.mockResolvedValue({
    id: 'budget-1',
    status: 'approved',
    currentActiveRevisionId: 'rev-1',
    currentActiveRevision: { id: 'rev-1', lines: [{ id: 'line-1' }] },
    teamId: 4n,
  });

  const result = await (service as any).validateBudgetSelection(
    { budget_id: 'budget-1', budget_line_id: 'line-1' },
    { team_id: '4' }
  );

  expect(result.budgetId).toBe('budget-1');
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- api/src/modules/requests/__tests__/budget-linkage.spec.ts`
Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement scope-aware budget validation helper**

Add in `requests.service.ts`:

```ts
private async validateBudgetSelection(
  data: Record<string, any>,
  context: { team_id?: string; organization_id?: string }
) {
  if (!data.budget_id && !data.budget_line_id) return null;
  if (!data.budget_id || !data.budget_line_id) {
    throw new BadRequestException('budget_id and budget_line_id must be provided together');
  }

  const budget = await this.prisma.financeBudget.findUnique({
    where: { id: String(data.budget_id) },
    include: { currentActiveRevision: { include: { lines: true } } },
  });
  if (!budget || budget.status !== 'approved' || !budget.currentActiveRevision) {
    throw new BadRequestException('Selected budget is not approved');
  }
  if (budget.teamId && context.team_id !== budget.teamId.toString()) {
    throw new BadRequestException('Budget scope does not match request team');
  }

  const line = budget.currentActiveRevision.lines.find((entry) => entry.id === String(data.budget_line_id));
  if (!line) throw new BadRequestException('Invalid budget_line_id');

  return { budgetId: budget.id, budgetRevisionId: budget.currentActiveRevision.id, budgetLineId: line.id, amount: line.totalAmount };
}
```

- [ ] **Step 4: Call the helper from request create and update flows**

Patch both create/update payload validation blocks so they execute before persisting request data.

- [ ] **Step 5: Keep DTO documentation explicit**

Ensure request DTO comments say these keys are for budget-backed requests and must reference approved lines.

- [ ] **Step 6: Run tests to confirm they pass**

Run: `npm test -- api/src/modules/requests/__tests__/budget-linkage.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/requests/__tests__/budget-linkage.spec.ts api/src/modules/requests/requests.service.ts api/src/modules/requests/dto/create-request.dto.ts api/src/modules/requests/dto/update-request.dto.ts
git commit -m "feat(requests): validate approved budget references"
```

## Task 5: Record And Release Commitments

**Files:**
- Modify: `api/src/modules/requests/requests.service.ts`
- Test: `api/src/modules/requests/__tests__/budget-linkage.spec.ts`

- [ ] **Step 1: Write failing commitment lifecycle tests**

Add tests:

```ts
it('creates a reserved commitment when a budget-backed request is submitted', async () => {
  prisma.financeBudgetCommitment.create.mockResolvedValue({ id: 'commit-1' });

  await (service as any).syncBudgetCommitmentForRequest({
    id: 101n,
    status: 'approval',
    totalAmount: 2500,
    data: { budget_id: 'budget-1', budget_line_id: 'line-1' },
  });

  expect(prisma.financeBudgetCommitment.create).toHaveBeenCalled();
});

it('releases commitment when request is rejected or cancelled', async () => {
  prisma.financeBudgetCommitment.updateMany.mockResolvedValue({ count: 1 });

  await (service as any).syncBudgetCommitmentForRequest({
    id: 101n,
    status: 'rejected',
    totalAmount: 2500,
    data: { budget_id: 'budget-1', budget_line_id: 'line-1' },
  });

  expect(prisma.financeBudgetCommitment.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'released' }) })
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- api/src/modules/requests/__tests__/budget-linkage.spec.ts`
Expected: FAIL because commitment sync helper does not exist.

- [ ] **Step 3: Implement request commitment sync helper**

Add helper in `requests.service.ts`:

```ts
private async syncBudgetCommitmentForRequest(request: {
  id: bigint;
  status: string;
  totalAmount?: number | null;
  data?: Record<string, any> | null;
}) {
  const data = request.data ?? {};
  if (!data.budget_id || !data.budget_line_id) return;

  const status = ['approved', 'payment_processing', 'disbursed', 'retired', 'completed'].includes(String(request.status))
    ? 'consumed'
    : ['rejected', 'cancelled'].includes(String(request.status))
      ? 'released'
      : 'reserved';

  const amount = Number(request.totalAmount ?? 0);
  await this.prisma.financeBudgetCommitment.upsert({
    where: { unique_request_budget_line_commitment: { requestId: request.id, budgetLineId: String(data.budget_line_id) } },
    update: { status, committedAmount: amount, actualizedAmount: status === 'consumed' ? amount : null },
    create: {
      budgetId: String(data.budget_id),
      budgetRevisionId: String(data.budget_revision_id),
      budgetLineId: String(data.budget_line_id),
      requestId: request.id,
      status,
      committedAmount: amount,
      actualizedAmount: status === 'consumed' ? amount : null,
    },
  });
}
```

- [ ] **Step 4: Call commitment sync on request create/update/status transitions**

Patch create, update, approve, reject, cancel, disburse, and retire flows to call `syncBudgetCommitmentForRequest` after the request row is persisted.

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npm test -- api/src/modules/requests/__tests__/budget-linkage.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/requests/requests.service.ts api/src/modules/requests/__tests__/budget-linkage.spec.ts
git commit -m "feat(budgets): track request commitments"
```

## Task 6: Surface Commitment Totals In Budget Responses

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: `api/src/modules/finance/__tests__/budget-revisions.spec.ts`

- [ ] **Step 1: Write failing serialization test for commitment totals**

Add test:

```ts
it('serializes committed and consumed totals on budgets', async () => {
  const budget = {
    commitments: [
      { status: 'reserved', committedAmount: 1000, actualizedAmount: null },
      { status: 'consumed', committedAmount: 500, actualizedAmount: 500 },
    ],
  };

  const result = (service as any).serializeBudget(budget);

  expect(result.total_committed).toBe(1500);
  expect(result.total_consumed).toBe(500);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- api/src/modules/finance/__tests__/budget-revisions.spec.ts`
Expected: FAIL because fields do not exist.

- [ ] **Step 3: Include commitments in budget fetches and serialize totals**

Add `commitments: true` to budget includes and extend serializer:

```ts
const commitments = row.commitments ?? [];
const totalCommitted = commitments.reduce((sum: number, item: any) => sum + Number(item.committedAmount ?? 0), 0);
const totalConsumed = commitments.reduce((sum: number, item: any) => sum + Number(item.actualizedAmount ?? 0), 0);

return {
  ...existing,
  total_committed: totalCommitted,
  total_consumed: totalConsumed,
  total_available: Number(row.totalBudget ?? 0) - totalCommitted,
};
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test -- api/src/modules/finance/__tests__/budget-revisions.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/__tests__/budget-revisions.spec.ts
git commit -m "feat(budgets): expose commitment totals"
```

## Task 7: Add Budget Selection To Request Forms

**Files:**
- Modify: `apps/shared/src/api/finance-api.ts`
- Modify: `apps/pwa/src/pages/requests/requests-api.ts`
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`
- Modify: `apps/pwa/src/pages/requests/new/forms/ProcurementRequestFormPage.tsx`
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`

- [ ] **Step 1: Add API helper for approved budget lines**

In `apps/shared/src/api/finance-api.ts` add:

```ts
listApprovedBudgetLines(params?: Record<string, unknown>) {
  return httpRequest<any[]>(`/finance/budgets/approved-lines${toQuery(params)}`);
}
```

- [ ] **Step 2: Add request-facing wrapper**

In `apps/pwa/src/pages/requests/requests-api.ts` add:

```ts
export async function listApprovedBudgetLines(params?: Record<string, unknown>) {
  const res = await financeApi.listApprovedBudgetLines(params);
  return (res?.data ?? res) as Array<Record<string, unknown>>;
}
```

- [ ] **Step 3: Load scope-aware budget options in request form shell**

In `RequestFormPage.tsx`, when `team_id` or `project_id` context exists, load approved budget line options and pass them into request-specific forms.

- [ ] **Step 4: Add selectors to procurement request form**

Add fields:

```tsx
<SelectField label="Budget" value={budgetId} onChange={...}>
<SelectField label="Budget Line" value={budgetLineId} onChange={...}>
```

Persist into form data as:

```ts
budget_id: budgetId,
budget_line_id: budgetLineId,
budget_revision_id: selectedLine?.budget_revision_id,
```

- [ ] **Step 5: Render linked budget fields in request details**

Show `budget_id` and `budget_line_id` in the request details budget section.

- [ ] **Step 6: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/shared/src/api/finance-api.ts apps/pwa/src/pages/requests/requests-api.ts apps/pwa/src/pages/requests/new/RequestFormPage.tsx apps/pwa/src/pages/requests/new/forms/ProcurementRequestFormPage.tsx apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "feat(requests): add approved budget selectors"
```

## Task 8: Documentation And Final Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-07-04-budget-usage-manual.md`

- [ ] **Step 1: Update usage manual for budget-backed requests**

Add a section covering:

```md
- only approved budget lines are selectable in request forms
- submitting/approving requests reserves budget commitment
- rejected/cancelled requests release commitment
- disbursed/completed requests consume commitment
```

- [ ] **Step 2: Run API build**

Run: `npm run build -w api`
Expected: PASS

- [ ] **Step 3: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 4: Manual verification checklist**

Check:

- approved budget lines appear in procurement request form
- invalid budget line cannot be submitted
- approved request creates reserved commitment
- rejected request releases commitment
- disbursed request marks commitment consumed
- budget detail shows committed/consumed totals

- [ ] **Step 5: Commit**

```bash
git add api apps/pwa docs
git commit -m "feat(budgets): link requests to approved budget lines"
```

## Spec Coverage Check

- Approved revisions as request baseline: covered in Tasks 3 and 4.
- Request commitment tracking: covered in Task 5.
- Budget availability reporting: covered in Task 6.
- Request form integration: covered in Task 7.
- Usage documentation: covered in Task 8.
