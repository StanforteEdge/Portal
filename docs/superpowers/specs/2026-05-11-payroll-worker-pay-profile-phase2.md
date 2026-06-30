# Payroll Worker Pay Profile — Phase 2: Allocations

## Summary

Add cost allocation mode, default fund/grant, and allocation rows to the HR payroll worker editor. This lets HR split a worker's payroll cost across organizations, teams, projects, funds, and grants.

## Scope

Phase 2 only: allocation mode + default fund/grant + allocation rows. Statutory overrides are deferred to Phase 3.

## Architecture

- **No API changes needed** — backend `UpsertPayrollWorkerDto` already supports `allocation_mode`, `hybrid_fixed_percent`, `default_fund_id`, `default_grant_id`, and `allocations[]`
- **Frontend only**: add Step 3 to the existing 2-step wizard in `HrPayrollWorkersPage.tsx`
- **Shared API**: expand `UpsertWorkerPayload` type in `payroll-api.ts` with allocation fields
- **Existing APIs**: `resourceApi.listOrganizations()`, `resourceApi.listGroups()`, `resourceApi.listProjects()`, `financeApi.listFunds()`, `financeApi.listGrants()` all available from `@/shared/lib/core`

## Step Structure

### Step 3: Allocation
- **Allocation Mode** — select: `fixed` / `timesheet` / `hybrid`
- **Hybrid Fixed %** — number input, shown only when mode is `hybrid`
- Mode description text explaining each option
- **Default Fund** — select from fetched fund list
- **Default Grant** — select from fetched grant list
- **Allocation Rows** — table with add/delete:
  - Organization, Team, Project, Fund, Grant (select dropdowns)
  - Allocation % (number, default 100)
  - Delete button per row
  - Total % display at bottom
  - Starts with one row at 100%

## Data Mapping

### Opening for edit
Populate from worker fields:
- `allocationMode` → `w.allocation_mode` (default `"fixed"`)
- `hybridFixedPercent` → `w.hybrid_fixed_percent` (default `"0"`)
- `defaultFundId` → `w.default_fund_id` (default `""`)
- `defaultGrantId` → `w.default_grant_id` (default `""`)
- `allocations` → `w.allocations` map to `{ _key, org_id, team_id, project_id, fund_id, grant_id, percent }` (default one row at 100%)

### Save
Include in payload:
```ts
allocation_mode: allocationMode,
hybrid_fixed_percent: allocationMode === "hybrid" ? Number(hybridFixedPercent) : undefined,
default_fund_id: defaultFundId || undefined,
default_grant_id: defaultGrantId || undefined,
allocations: allocations.map(a => ({
  organization_id: a.org_id || undefined,
  team_id: a.team_id || undefined,
  project_id: a.project_id || undefined,
  fund_id: a.fund_id || undefined,
  grant_id: a.grant_id || undefined,
  allocation_percent: Number(a.percent || 0),
})).filter(a => Object.values(a).some(v => v !== undefined)),
```

## File Changes

- `apps/pwa/src/shared/api/payroll-api.ts` — expand `UpsertWorkerPayload` with allocation fields
- `apps/pwa/src/pages/hr/payroll/HrPayrollWorkersPage.tsx` — add Step 3 UI, extend wizard to 3 steps, extend save logic, extend edit population
- Potentially: add API functions for orgs/teams/projects/funds/grants if not already available in the shared API or hrApi
