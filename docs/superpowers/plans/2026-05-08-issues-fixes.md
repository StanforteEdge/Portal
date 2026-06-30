# Issues Fix Plan — 2026-05-08

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four tracked issues: (1) Employee attendance tab — add pagination and per-record slideout. (2) Extract inline tabs from `HrEmployeeDetailPage` into the `employees/tabs/` folder. (3) Fix `FinanceChartAccountsPage` to read the API correctly and add pagination. (4) Standardize all API list responses to a consistent `{ data: { items: T[], meta: {...} } }` shape.

**Tech Stack:** NestJS (API), React + TypeScript + TailwindCSS (PWA), existing shared components (`SectionCard`, `Table`, `PaginationControls`, `SlideOver`, `Chip`, `Button`), `useCachedQuery` for data fetching.

---

## File Map

**Modify:**
- `apps/pwa/src/pages/hr/employees/tabs/EmployeeAttendanceTab.tsx` — add pagination + clickable rows opening AttendanceRecordSlideOver
- `apps/pwa/src/pages/hr/employees/HrEmployeeDetailPage.tsx` — remove inline tab components, import from tabs folder
- `apps/pwa/src/pages/hr/attendance/HrAttendancePage.tsx` — replace StaffAttendanceSlideOver row-click with AttendanceRecordSlideOver
- `apps/pwa/src/pages/finance/accounts/FinanceChartAccountsPage.tsx` — fix response key (`result` → `items`) and wire pagination
- `api/src/modules/hr/hr.controller.ts` — add GET `/hr/attendance/records/:userId/:workDate` route (if missing)
- `api/src/modules/hr/attendance.service.ts` — add `getDailyRecord(userId, workDate)` method (if missing)
- `apps/shared/src/api/attendance-api.ts` — add `getDailyRecord(userId, workDate)` client method

**Create:**
- `apps/pwa/src/pages/hr/employees/tabs/EmployeeOverviewTab.tsx` — extracted from HrEmployeeDetailPage
- `apps/pwa/src/pages/hr/employees/tabs/EmployeeWorkTab.tsx` — extracted from HrEmployeeDetailPage
- `apps/pwa/src/pages/hr/employees/tabs/EmployeeOrgsOverviewTab.tsx` — read-only orgs/teams view, extracted from HrEmployeeDetailPage
- `apps/pwa/src/pages/hr/attendance/AttendanceRecordSlideOver.tsx` — **shared** single-day detail slideout used by both HrAttendancePage and EmployeeAttendanceTab; fetches full entries on open

**API standardization (Task 4 — separate sweep):**
- All NestJS list endpoints that currently return `{ result: T[], total_result: N, ... }` → change to `{ data: { items: T[], meta: { page, per_page, total, pages } } }`
- All frontend API clients and page consumers updated to match

---

## Task 1: Extract inline tabs from HrEmployeeDetailPage

**Context:** `HrEmployeeDetailPage.tsx` defines `EmployeeOverviewTab`, `EmployeeWorkEmploymentTab`, and `EmployeeOrgsTeamsOverviewTab` as inline functions. All other tabs already live in `employees/tabs/`. The page is growing unwieldy.

- [ ] **Step 1.1** — Create `apps/pwa/src/pages/hr/employees/tabs/EmployeeOverviewTab.tsx`

  Move the `EmployeeOverviewTab` function (personal details + current assignment grid) out of `HrEmployeeDetailPage.tsx` into this new file. Props: `{ employee: EmployeeDetail }`. Export as default.

- [ ] **Step 1.2** — Create `apps/pwa/src/pages/hr/employees/tabs/EmployeeWorkTab.tsx`

  Move `EmployeeWorkEmploymentTab` (employment records, dates, manager, job description) into this new file. Props: `{ employee: EmployeeDetail }`. Export as default.

- [ ] **Step 1.3** — Create `apps/pwa/src/pages/hr/employees/tabs/EmployeeOrgsOverviewTab.tsx`

  Move `EmployeeOrgsTeamsOverviewTab` (read-only orgs and teams list) into this file. Props: `{ employee: EmployeeDetail }`. Export as default.

- [ ] **Step 1.4** — Update `HrEmployeeDetailPage.tsx`

  - Remove the three inline component definitions.
  - Add imports:
    ```typescript
    import EmployeeOverviewTab from "@/pages/hr/employees/tabs/EmployeeOverviewTab";
    import EmployeeWorkTab from "@/pages/hr/employees/tabs/EmployeeWorkTab";
    import EmployeeOrgsOverviewTab from "@/pages/hr/employees/tabs/EmployeeOrgsOverviewTab";
    ```
  - Replace inline JSX usage with the imported components. Keep `humanize`, `formatDate`, `DetailField`, `employeeFullName`, `employeeInitials`, `employeeManagerName` helpers in the page file since they are used in the header section — or move them to a shared `employee-helpers.ts` if they are also needed by the new tab files.

---

## Task 2: Shared attendance record detail slideout — used in HR page + Employee tab

**Context:** Two places show attendance rows and need to drill into a single record's full detail (clock entries, location, geofence, timing):

1. **`HrAttendancePage.tsx`** — line 335 currently opens `StaffAttendanceSlideOver` on row click, which fetches and displays a *list* of that user's records across the whole date range. This is wrong — clicking a row should show *that specific day's* detail, not a list again.
2. **`EmployeeAttendanceTab.tsx`** — rows are not clickable at all today.

Both will use the same new `AttendanceRecordSlideOver`. `StaffAttendanceSlideOver` is retired from the row-click action (it can remain for other uses but is no longer the record detail view).

**Important — data shape:** `StaffDailyRow` and `AttendanceDaily` likely carry only daily aggregates (first_in_at, last_out_at, worked_minutes, status). The individual clock entries (with mode, location, geofence, lat/lng) live in `entries[]` which may not be present in the list response. The slideout must fetch the full record detail on open using `attendanceApi.getDailyRecord(userId, workDate)` (or equivalent). If this endpoint does not yet exist, it must be added to the API and the shared API client.

- [ ] **Step 2.1** — Verify or add a single-record detail endpoint in the API

  Check `api/src/modules/hr/attendance.service.ts` and `hr.controller.ts` for an endpoint that returns a single day's full record including `entries[]`. If it does not exist, add:
  - Service method: `getDailyRecord(userId, workDate)` — fetches `AttendanceEntry[]` for that user+date plus the computed daily summary
  - Controller route: `GET /hr/attendance/records/:userId/:workDate`
  - Add the corresponding method to `attendanceApi` in `apps/shared/src/api/attendance-api.ts`

- [ ] **Step 2.2** — Create `apps/pwa/src/pages/hr/attendance/AttendanceRecordSlideOver.tsx`

  Props:
  ```typescript
  type Props = {
    userId: string;
    workDate: string;        // ISO date string e.g. "2026-05-08"
    employeeName?: string;
    onClose: () => void;
  };
  ```

  Behaviour:
  - On mount, call `attendanceApi.getDailyRecord(userId, workDate)` and show a loading state.
  - Once loaded, render:
    - **Header** — employee name + work date
    - **Summary** — status chip, worked hours, late minutes, expected mode
    - **Clock entries** — each entry: type label (Clock In / Clock Out), time, mode chip (Onsite / Remote / Field), office location name, geofence status chip, source badge
    - **Location** — lat/lng as text coordinates per entry if present (no map required)
  - Use `SlideOver`, `SlideOverHeader`, `SlideOverContent` from `@/shared/components/ui/SlideOver`.
  - Use `Chip` for status, mode, and geofence values.

- [ ] **Step 2.3** — Update `HrAttendancePage.tsx` to use `AttendanceRecordSlideOver`

  - Change the `slideOver` state shape from `{ userId, userName }` to `{ userId: string; workDate: string; userName: string } | null`.
  - Change row click handler (line 335) from:
    ```tsx
    onClick={() => setSlideOver({ userId: row.user_id, userName: row.user_name })}
    ```
    to:
    ```tsx
    onClick={() => setSlideOver({ userId: row.user_id, workDate: row.work_date, userName: row.user_name })}
    ```
  - Replace the `<StaffAttendanceSlideOver ... />` render at the bottom with:
    ```tsx
    {slideOver && (
      <AttendanceRecordSlideOver
        userId={slideOver.userId}
        workDate={slideOver.workDate}
        employeeName={slideOver.userName}
        onClose={() => setSlideOver(null)}
      />
    )}
    ```
  - Remove the `StaffAttendanceSlideOver` import (unless it is used elsewhere in the file).

- [ ] **Step 2.4** — Update `EmployeeAttendanceTab.tsx` to add pagination

  - Add state: `const [page, setPage] = useState(1)` and `const [perPage, setPerPage] = useState(20)`.
  - The `attendanceApi.listRecords` call should include `page` and `per_page` params if the API supports them. If not, paginate client-side by slicing the returned array.
  - After the table, render:
    ```tsx
    <PaginationControls
      page={page}
      totalPages={Math.ceil(totalCount / perPage)}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
      itemLabel="records"
    />
    ```
  - Reset `page` to 1 when the date range changes.

- [ ] **Step 2.5** — Wire `AttendanceRecordSlideOver` into `EmployeeAttendanceTab.tsx`

  - Add state: `const [selectedRecord, setSelectedRecord] = useState<{ workDate: string } | null>(null)`.
  - Make each table row clickable (`cursor-pointer`, `onClick={() => setSelectedRecord({ workDate: record.work_date })}`).
  - Render at the bottom:
    ```tsx
    {selectedRecord && (
      <AttendanceRecordSlideOver
        userId={employeeId}
        workDate={selectedRecord.workDate}
        onClose={() => setSelectedRecord(null)}
      />
    )}
    ```
  - Import `AttendanceRecordSlideOver` from `@/pages/hr/attendance/AttendanceRecordSlideOver`.

---

## Task 3: Fix FinanceChartAccountsPage API reading + pagination

**Context:** `FinanceChartAccountsPage.tsx` reads `(accountsData as any)?.result` but the API endpoint (and the standardized shape from Task 4) will use `items`. Pagination controls exist but may not be fully wired.

- [ ] **Step 3.1** — Fix response key reads in `FinanceChartAccountsPage.tsx`

  Replace all references to `?.result` and `?.total_result` with the standardized shape:
  ```typescript
  // Before (current)
  const accounts = (accountsData as any)?.result ?? [];
  const total = (accountsData as any)?.total_result ?? 0;

  // After (standardized — parseResponse strips wrapper, so res = { items, meta })
  const accounts = (accountsData as any)?.items ?? (accountsData as any)?.result ?? [];
  const total = (accountsData as any)?.meta?.total ?? (accountsData as any)?.total_result ?? 0;
  ```
  Use the fallback chain temporarily so the page works both before and after the API migration in Task 4.

- [ ] **Step 3.2** — Ensure `PaginationControls` is rendered and wired

  If pagination UI is missing or incomplete, add it below the accounts table:
  ```tsx
  <PaginationControls
    page={page}
    totalPages={Math.ceil(total / perPage)}
    totalCount={total}
    perPage={perPage}
    onPageChange={setPage}
    onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
    itemLabel="accounts"
  />
  ```
  Pass `page` and `per_page` to `resourceApi.listChartAccounts(...)` so the API is called with the correct page.

---

## Task 4: Standardize API list response shape

**Goal:** All paginated list endpoints return the agreed standard shape below. Single-item and action responses remain `{ success: true, data: T }`.

**Agreed target shape for all list endpoints:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": { "page": 1, "per_page": 20, "total": 150, "pages": 8 }
  }
}
```

**`http-client.ts` `parseResponse()` behaviour with this shape:**
The top level has only `success` + `data` (no top-level `meta`), so `parseResponse` strips the wrapper and hands `data` to the caller. Frontend clients receive `{ items: T[], meta: {...} }` and read `res.items` / `res.meta`.

**Current shapes that need migrating:**
| Shape | Where used |
|---|---|
| `{ result: T[], total_result: N, page, per_page, pages }` | Finance, HR list endpoints |
| `{ data: T[] }` or bare `T[]` | Attendance list endpoints |
| `{ success: true, data: T[], meta: {...} }` | Payroll endpoints — **wrong shape, also needs migrating** |

- [ ] **Step 4.1** — Create a NestJS helper

  Create `api/src/common/helpers/paginated-response.ts`:
  ```typescript
  export function paginatedResponse<T>(items: T[], meta: { page: number; per_page: number; total: number }) {
    return {
      success: true,
      data: {
        items,
        meta: {
          page: meta.page,
          per_page: meta.per_page,
          total: meta.total,
          pages: Math.ceil(meta.total / meta.per_page),
        },
      },
    };
  }
  ```
  Use this in every list endpoint instead of inline object construction.

- [ ] **Step 4.2** — Audit and update all list endpoints in the API

  Search for `total_result`, `result:`, and the flat payroll pattern in `api/src/modules/`. For each:
  - Replace old shapes with `return paginatedResponse(items, { page, per_page, total })`.

  Priority order: Finance → HR → Payroll → Admin → Resource.

- [ ] **Step 4.3** — Update all frontend API clients in `apps/shared/src/api/`

  After `parseResponse` strips the wrapper, clients receive `{ items: T[], meta: {...} }` directly. Update every list function to:
  ```typescript
  const items = res?.items ?? [];
  const meta  = res?.meta ?? { page: 1, per_page: 20, total: 0, pages: 0 };
  ```
  This includes `payroll-api.ts` — the current fallback chain `res?.data?.items ?? res?.data ?? res?.result` should be simplified to `res?.items` once the backend is migrated.

- [ ] **Step 4.4** — Update all frontend page consumers

  Search for `?.result`, `.result`, `total_result` across `apps/pwa/src/pages/` and update each reference to use `?.items` / `?.meta?.total`. The fallback chains added in Task 3.1 can be removed once this step is complete.

- [ ] **Step 4.5** — Update `apps/shared/src/api/request-api.ts` and any other shared API clients not covered in 4.3.

---

## Execution order

Run tasks in this sequence to avoid breaking the app mid-flight:

1. **Task 1** (tab extraction) — pure refactor, no behaviour change, safe to merge alone
2. **Task 3** (chart of accounts) — add fallback keys first so the page reads both old and new shapes
3. **Task 4** (API standardization) — migrate backend first, then frontend clients, then page consumers; remove fallbacks last
4. **Task 2** (attendance pagination + slideout) — depends on knowing the final API shape from Task 4
