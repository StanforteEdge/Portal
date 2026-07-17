# Manual Entry Navigation And Statutory Deduction Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move manual journal entry into its own finance menu, add a statutory deduction manual entry page and API flow, and harden Prisma startup behavior for production.

**Architecture:** Keep the current generic manual-entry path intact but re-home it under a new navigation group. Add a new sibling statutory-deduction manual-entry surface backed by dedicated list/create endpoints that reuse the existing journal posting engine with a distinct `sourceType`. Contain Prisma hardening to the shared Prisma service so downstream modules keep the same contract.

**Tech Stack:** React, TypeScript, React Router, NestJS, Prisma, Jest

---

## File Map

- Modify: `apps/pwa/src/shared/navigation.ts`
  - Move `Journal Entry` out of `Accounting` and create `Manual Entries` submenu.
- Modify: `apps/pwa/src/App.tsx`
  - Register the new statutory deduction manual-entry route.
- Modify: `apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx`
  - Point the page at the new navigation context.
- Create: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx`
  - New finance page for statutory deduction manual entry.
- Modify: `apps/pwa/src/shared/lib/core/finance.ts` or the existing finance API client file that owns `createManualEntry`/`listManualEntries`
  - Add list/create client methods for statutory deduction manual entries.
- Modify: `api/src/modules/finance/finance.controller.ts`
  - Add list/create endpoints for statutory deduction manual entries.
- Modify: `api/src/modules/finance/finance.service.ts`
  - Add list/create service methods using a separate source type.
- Modify: `api/prisma/schema.prisma` only if `sourceType` is enum-constrained.
  - Add `statutory_deduction_manual_entry` if required.
- Create or Modify: finance tests under `api/src/modules/finance/__tests__/`
  - Add coverage for the new list/create path.
- Modify: `api/src/common/prisma/prisma.service.ts`
  - Add minimal production-focused hardening.

### Task 1: Check Source Type Constraints First

**Files:**
- Modify: `api/prisma/schema.prisma` only if needed
- Test: none yet

- [ ] **Step 1: Inspect journal entry source type definition**

Check whether `FinanceJournalEntry.sourceType` is a free string or Prisma enum before changing service logic.

Run: `rg -n "sourceType|FinanceJournalEntry" api/prisma/schema.prisma api/src/modules/finance/finance.service.ts`
Expected: Find the model field and any enum declaration.

- [ ] **Step 2: If enum-based, add the new source type**

Add `statutory_deduction_manual_entry` to the relevant Prisma enum only if the schema requires it.

Example target shape:

```prisma
enum FinanceJournalSourceType {
  manual_entry
  statutory_deduction_manual_entry
}
```

- [ ] **Step 3: Generate the Prisma client if schema changed**

Run: `npm run prisma:generate`
Expected: Prisma client regeneration completes without schema errors.

- [ ] **Step 4: Commit the schema-safe baseline**

```bash
git add api/prisma/schema.prisma api/package.json api/package-lock.json
git commit -m "chore(api): add statutory deduction journal source type"
```

Skip this commit if no schema change was needed.

### Task 2: Reorganize Finance Navigation

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx`
- Test: existing frontend test location if present; otherwise manual verification

- [ ] **Step 1: Write the intended navigation assertions**

Document the expected structure before editing:

```ts
// Expected navigation shape
// Finance > Manual Entries
//   - Journal Entry
//   - Statutory Deduction Entry
// Finance > Accounting
//   - Ledger
//   - Chart of Accounts
//   - Bank & Cash
//   - Reports
```

- [ ] **Step 2: Update `buildAppNavigation` to add the new submenu**

Modify the finance section so `Journal Entry` moves into a new group and `Accounting` loses that child.

Target shape:

```ts
{
  key: "finance-group-manual-entries",
  label: "Manual Entries",
  icon: "edit_note",
  children: [
    { key: "finance-manual-entry", label: "Journal Entry", icon: "edit_note", path: "/finance/manual-entry", permissions: ["finance.manage"] },
    { key: "finance-statutory-deduction-entry", label: "Statutory Deduction Entry", icon: "account_balance", path: "/finance/manual-entry/statutory-deductions", permissions: ["finance.manage"] },
  ],
}
```

- [ ] **Step 3: Point the existing journal page at the new menu key**

Ensure `FinanceManualEntryPage` keeps:

```tsx
activeLabel="finance-manual-entry"
```

and still uses the finance app shell correctly after the menu move.

- [ ] **Step 4: Run the frontend checks for obvious type issues**

Run: `npm run build --workspace apps/pwa`
Expected: PWA build passes without TypeScript errors from navigation changes.

- [ ] **Step 5: Commit the navigation slice**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/pages/finance/ledger/FinanceManualEntryPage.tsx
git commit -m "feat(pwa): move manual entries into dedicated finance menu"
```

### Task 3: Add Frontend Route And Page Skeleton

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Create: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx`
- Test: manual route render or existing route test file if present

- [ ] **Step 1: Add the new route import in `App.tsx`**

Add a page import alongside the other finance page imports.

```tsx
import StatutoryDeductionManualEntryPage from "@/pages/finance/deductions/StatutoryDeductionManualEntryPage";
```

- [ ] **Step 2: Register the new route**

Add the route near the existing manual-entry and statutory-deductions routes.

```tsx
<Route path="/finance/manual-entry/statutory-deductions" element={<StatutoryDeductionManualEntryPage />} />
```

- [ ] **Step 3: Create the page shell with the correct navigation context**

Create a first-pass page with:

```tsx
<AppShell
  navigation={buildRequestsNavigation()}
  activeLabel="finance-statutory-deduction-entry"
  user={{ name: userName, role: "Finance" }}
  mobileNav={buildAppMobileNav("Finance")}
>
  <PageHeader
    eyebrow="Finance"
    breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Manual Entries" }, { label: "Statutory Deduction Entry" }]}
    title="Statutory Deduction Entry"
    description="Post manual statutory deduction journals and review recent entries."
  />
</AppShell>
```

- [ ] **Step 4: Reuse the current generic page layout pattern**

Mirror the current structure with:

- header stat cards
- entry header section
- statutory details section
- journal lines section
- recent entries section

Do not abstract both pages into a shared form component unless duplication becomes clearly excessive.

- [ ] **Step 5: Build the frontend again**

Run: `npm run build --workspace apps/pwa`
Expected: Route and page compile cleanly.

- [ ] **Step 6: Commit the route and skeleton page**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx
git commit -m "feat(pwa): add statutory deduction manual entry page"
```

### Task 4: Add Finance API Client Methods

**Files:**
- Modify: `apps/pwa/src/shared/lib/core/finance.ts` or the current finance API file
- Test: frontend build

- [ ] **Step 1: Locate the existing manual-entry client methods**

Find the methods that wrap:

- `listManualEntries`
- `createManualEntry`

Run: `rg -n "listManualEntries|createManualEntry" apps/pwa/src/shared/lib/core`
Expected: One finance API client file owns both methods.

- [ ] **Step 2: Add statutory deduction manual-entry list method**

Use the same query shape as generic manual entries.

```ts
listStatutoryDeductionManualEntries(params: Record<string, unknown> = {}) {
  return api.get("/finance/manual-entry/statutory-deductions", { params });
}
```

- [ ] **Step 3: Add statutory deduction manual-entry create method**

Use a dedicated endpoint and keep payload naming aligned with the backend DTO.

```ts
createStatutoryDeductionManualEntry(payload: Record<string, unknown>) {
  return api.post("/finance/manual-entry/statutory-deductions", payload);
}
```

- [ ] **Step 4: Run the frontend build**

Run: `npm run build --workspace apps/pwa`
Expected: API client additions compile with no type regressions.

- [ ] **Step 5: Commit the API client layer**

```bash
git add apps/pwa/src/shared/lib/core
git commit -m "feat(pwa): add statutory deduction manual entry api client"
```

### Task 5: Implement Statutory Deduction Entry Frontend Behavior

**Files:**
- Modify: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx`
- Test: frontend build and manual flow

- [ ] **Step 1: Define the local page state**

Use a state model close to the existing page plus deduction-specific fields.

```ts
type EntryLine = {
  chart_account_id: string;
  description: string;
  debit: number;
  credit: number;
};

type DeductionFormState = {
  entryDate: string;
  memo: string;
  currency: string;
  deductionTypeId: string;
  grossAmount: number;
  withheldAmount: number;
  lines: EntryLine[];
};
```

- [ ] **Step 2: Load chart accounts, deduction types, and recent entries**

Re-use cached query patterns already present in the manual-entry page, plus `financeApi.listDeductionTypes` for deduction types and the new list endpoint for recent entries.

- [ ] **Step 3: Add client-side validation before submit**

Reject submission when any of the following are true:

```ts
if (!entryDate) { /* date required */ }
if (!deductionTypeId) { /* deduction type required */ }
if (grossAmount <= 0) { /* gross amount required */ }
if (withheldAmount <= 0) { /* withheld amount required */ }
if (withheldAmount > grossAmount) { /* invalid withheld amount */ }
if (!balanced) { /* debits and credits must match */ }
if (normalized.length < 2) { /* at least two valid lines */ }
```

- [ ] **Step 4: Submit through the dedicated API method**

Target payload shape:

```ts
await financeApi.createStatutoryDeductionManualEntry({
  entry_date: entryDate,
  memo: memo.trim() || undefined,
  currency: currency.toUpperCase(),
  deduction_type_id: deductionTypeId,
  gross_amount: grossAmount,
  withheld_amount: withheldAmount,
  lines: normalized,
});
```

- [ ] **Step 5: Render a recent entries table filtered to the new source type**

Show the same core fields as the generic page:

- date
- entry number
- memo
- debit total
- credit total

Optionally add deduction type if the response exposes it.

- [ ] **Step 6: Verify the page builds and navigate to it locally**

Run: `npm run build --workspace apps/pwa`
Expected: Build passes.

Manual check: open `/finance/manual-entry/statutory-deductions`
Expected: page loads with header, form sections, and recent entries area.

- [ ] **Step 7: Commit the page behavior**

```bash
git add apps/pwa/src/pages/finance/deductions/StatutoryDeductionManualEntryPage.tsx
git commit -m "feat(pwa): implement statutory deduction manual entry flow"
```

### Task 6: Add Backend Endpoints And Service Methods

**Files:**
- Modify: `api/src/modules/finance/finance.controller.ts`
- Modify: `api/src/modules/finance/finance.service.ts`
- Test: finance module tests

- [ ] **Step 1: Add list endpoint in `finance.controller.ts`**

Add a controller handler near the existing manual-entry endpoints.

```ts
@Get('manual-entry/statutory-deductions')
@Permissions('finance.view')
@ApiOperation({ summary: 'List statutory deduction manual journal entries' })
listStatutoryDeductionManualEntries(@Query() query: Record<string, any>) {
  return this.financeService.listStatutoryDeductionManualEntries(query);
}
```

- [ ] **Step 2: Add create endpoint in `finance.controller.ts`**

```ts
@Post('manual-entry/statutory-deductions')
@Permissions('finance.manage')
@ApiOperation({ summary: 'Create statutory deduction manual journal entry' })
createStatutoryDeductionManualEntry(@Req() req: any, @Body() dto: CreateStatutoryDeductionManualEntryDto) {
  return this.financeService.createStatutoryDeductionManualEntry(dto as any, req.user?.id);
}
```

Use an inline type only if the codebase has no DTO pattern nearby for this change; otherwise add a focused DTO file.

- [ ] **Step 3: Add the list service method**

Reuse the generic manual-entry listing logic with a source-type-specific filter.

```ts
async listStatutoryDeductionManualEntries(query: Record<string, any>) {
  return this.listJournalEntriesBySourceType('statutory_deduction_manual_entry', query);
}
```

If there is no helper yet, create one small private helper used by both list methods.

- [ ] **Step 4: Add the create service method**

Implement validation plus shared journal posting.

```ts
async createStatutoryDeductionManualEntry(dto: {
  entry_date: string;
  memo?: string;
  currency?: string;
  deduction_type_id: string;
  gross_amount: number;
  withheld_amount: number;
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
}, actorId?: string) {
  if (!dto.deduction_type_id) throw new BadRequestException('deduction_type_id is required');
  if (Number(dto.gross_amount) <= 0) throw new BadRequestException('gross_amount must be greater than zero');
  if (Number(dto.withheld_amount) <= 0) throw new BadRequestException('withheld_amount must be greater than zero');
  if (Number(dto.withheld_amount) > Number(dto.gross_amount)) throw new BadRequestException('withheld_amount cannot exceed gross_amount');
  // then post using createJournalEntry with sourceType: 'statutory_deduction_manual_entry'
}
```

- [ ] **Step 5: Preserve generic manual entry behavior**

Do not change:

- route path `/finance/manual-entry`
- source type `manual_entry`
- existing response shape for current consumers

- [ ] **Step 6: Run targeted backend tests or compile checks**

Run: `npm run test --workspace api -- finance`
Expected: finance tests pass or at minimum the affected suite passes.

If workspace test filtering differs, run the repo’s existing API test command for finance-related suites.

- [ ] **Step 7: Commit backend manual-entry support**

```bash
git add api/src/modules/finance/finance.controller.ts api/src/modules/finance/finance.service.ts api/src/modules/finance/dto
git commit -m "feat(api): add statutory deduction manual entry endpoints"
```

### Task 7: Add Backend Test Coverage For The New Flow

**Files:**
- Create or Modify: `api/src/modules/finance/__tests__/...`
- Test: the same Jest command used below

- [ ] **Step 1: Add a failing service test for list filtering**

Example test target:

```ts
it('lists only statutory deduction manual entries', async () => {
  prisma.financeJournalEntry.findMany.mockResolvedValueOnce([{ id: '1', sourceType: 'statutory_deduction_manual_entry', lines: [] }] as any);
  prisma.financeJournalEntry.count.mockResolvedValueOnce(1 as any);

  const result = await service.listStatutoryDeductionManualEntries({});

  expect(prisma.financeJournalEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ sourceType: 'statutory_deduction_manual_entry' }),
  }));
  expect(result).toBeDefined();
});
```

- [ ] **Step 2: Add a failing service test for validation**

```ts
it('rejects withheld amount greater than gross amount', async () => {
  await expect(service.createStatutoryDeductionManualEntry({
    entry_date: '2026-07-17',
    deduction_type_id: 'type-1',
    gross_amount: 100,
    withheld_amount: 120,
    lines: [
      { chart_account_id: 'a', debit: 120, credit: 0 },
      { chart_account_id: 'b', debit: 0, credit: 120 },
    ],
  } as any, 'user-1')).rejects.toThrow('withheld_amount cannot exceed gross_amount');
});
```

- [ ] **Step 3: Add a passing service test for successful creation**

Assert that journal creation uses the distinct source type.

```ts
expect(createJournalEntrySpy).toHaveBeenCalledWith(expect.objectContaining({
  sourceType: 'statutory_deduction_manual_entry',
}));
```

- [ ] **Step 4: Run the affected API test file**

Run: `npm run test --workspace api -- path/to/test-file`
Expected: New tests pass.

- [ ] **Step 5: Commit the backend tests**

```bash
git add api/src/modules/finance/__tests__
git commit -m "test(api): cover statutory deduction manual entry"
```

### Task 8: Harden Prisma Service For Production

**Files:**
- Modify: `api/src/common/prisma/prisma.service.ts`
- Test: API build or tests

- [ ] **Step 1: Add an explicit Prisma client constructor**

Use a constructor that keeps logging low in production and more useful in development.

```ts
constructor() {
  super({
    log: process.env.NODE_ENV === 'production'
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'],
  });
}
```

If `query` logging is too noisy for the repo’s existing practice, reduce development logs to `['info', 'warn', 'error']`.

- [ ] **Step 2: Guard connect lifecycle state**

Add a private flag so repeated bootstrap/hot-reload lifecycle calls do not double-connect or double-disconnect.

```ts
private connected = false;

async onModuleInit() {
  if (this.connected) return;
  await this.$connect();
  await this.$queryRaw`SELECT 1`;
  this.connected = true;
}

async onModuleDestroy() {
  if (!this.connected) return;
  await this.$disconnect();
  this.connected = false;
}
```

- [ ] **Step 3: Make startup failures explicit**

Wrap `onModuleInit` in a `try/catch` that rethrows after adding a clear message.

```ts
try {
  await this.$connect();
  await this.$queryRaw`SELECT 1`;
  this.connected = true;
} catch (error) {
  this.connected = false;
  throw new Error(`Prisma failed to connect during startup: ${error instanceof Error ? error.message : 'unknown error'}`);
}
```

Keep the change minimal and avoid swallowing the root failure.

- [ ] **Step 4: Run API verification**

Run: `npm run build --workspace api`
Expected: API compiles cleanly.

Optional stronger check if available:

Run: `npm run test --workspace api`
Expected: API tests still pass.

- [ ] **Step 5: Commit Prisma hardening**

```bash
git add api/src/common/prisma/prisma.service.ts
git commit -m "fix(api): harden prisma service startup lifecycle"
```

### Task 9: Final Verification

**Files:**
- Modify: none
- Test: full verification commands

- [ ] **Step 1: Run frontend build**

Run: `npm run build --workspace apps/pwa`
Expected: PASS

- [ ] **Step 2: Run API build**

Run: `npm run build --workspace api`
Expected: PASS

- [ ] **Step 3: Run affected API tests**

Run: `npm run test --workspace api -- finance`
Expected: PASS

- [ ] **Step 4: Manually verify navigation and routes**

Check the following in the running app:

- `Finance > Manual Entries > Journal Entry` exists
- `Finance > Manual Entries > Statutory Deduction Entry` exists
- `Finance > Accounting` no longer contains `Journal Entry`
- `Finance > Workflows > Statutory Deductions` still exists
- `/finance/manual-entry` still posts a normal journal entry
- `/finance/manual-entry/statutory-deductions` loads and submits correctly

- [ ] **Step 5: Final commit or squash according to repo practice**

```bash
git status
git log --oneline -5
```

If the branch is ready, keep the existing incremental commits unless the user explicitly asks for squashing.
