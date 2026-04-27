# PWA `src` Folder Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tangled `features/` / `modules/` / `pages/` hierarchy with flat domain folders, group loose files into sub-folders by concern, and rename `SystemShellPage` → `AccountShellPage` to match its new location.

**Architecture:** Pure file-move refactor — no logic changes. Each task moves one domain, updates its imports, updates the corresponding `App.tsx` import block, and TypeScript-checks before committing. Route URLs do not change. Shell wrapper adoption across all pages is a follow-on task (not in scope here).

**Tech Stack:** React 18, TypeScript, Vite, path alias `@/` = `apps/pwa/src/`.

---

## Target Structure

```
src/
  auth/           ← was pages/auth/
  dashboard/      ← was pages/dashboard/
  requests/       ← was features/requests/
  finance/        ← was modules/finance/ (with sub-folders added)
  hr/             ← was modules/hr/     (sub-folders already good)
  admin/          ← was modules/admin/  (sub-folders added)
  account/        ← was pages/system/
  files/          ← was pages/files/
  projects/       ← was pages/projects/
  shared/         (unchanged)
```

---

## File Map

| Old path | New path |
|----------|----------|
| `pages/auth/*` | `auth/*` |
| `pages/dashboard/DashboardPage.tsx` | `dashboard/DashboardPage.tsx` |
| `pages/files/FilesPage.tsx` | `files/FilesPage.tsx` |
| `pages/projects/*.tsx` | `projects/*.tsx` |
| `pages/system/*` | `account/*` |
| `features/requests/pages/*.tsx` | `requests/*.tsx` |
| `features/requests/pages/new/*.tsx` | `requests/new/*.tsx` |
| `features/taxonomy/TagPicker.tsx` | `requests/TagPicker.tsx` |
| `modules/admin/Admin*.tsx` | `admin/<section>/Admin*.tsx` |
| `modules/admin/RequestTypeSlideOver.tsx` | `admin/request-types/RequestTypeSlideOver.tsx` |
| `modules/finance/Finance*.tsx` | `finance/<section>/Finance*.tsx` |
| `modules/finance/PVDeductionsPanel.tsx` | `finance/deductions/PVDeductionsPanel.tsx` |
| `modules/finance/tabs/*.tsx` | `finance/settings/tabs/*.tsx` |
| `modules/finance/contacts/` | `finance/contacts/` |
| `modules/finance/customers/` | `finance/customers/` |
| `modules/finance/vendors/` | `finance/vendors/` |
| `modules/finance/finance-request-details/` | `finance/requests/details/` |
| `modules/hr/HrDashboardPage.tsx` | `hr/dashboard/HrDashboardPage.tsx` |
| `modules/hr/attendance/` | `hr/attendance/` |
| `modules/hr/employees/` | `hr/employees/` |
| `modules/hr/leave/` | `hr/leave/` |
| `modules/hr/settings/` | `hr/settings/` |

---

## Task 1: Move `auth/`

**Files:**
- Move: `pages/auth/` → `auth/`
- Modify: `App.tsx` (auth import block)

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/pwa/src/auth
git mv apps/pwa/src/pages/auth/AcceptInvitePage.tsx apps/pwa/src/auth/AcceptInvitePage.tsx
git mv apps/pwa/src/pages/auth/ForgotPasswordPage.tsx apps/pwa/src/auth/ForgotPasswordPage.tsx
git mv apps/pwa/src/pages/auth/LoginPage.tsx apps/pwa/src/auth/LoginPage.tsx
git mv apps/pwa/src/pages/auth/ResetPasswordPage.tsx apps/pwa/src/auth/ResetPasswordPage.tsx
git mv apps/pwa/src/pages/auth/SessionReauthPage.tsx apps/pwa/src/auth/SessionReauthPage.tsx
rmdir apps/pwa/src/pages/auth
```

- [ ] **Step 2: Update App.tsx auth imports**

Replace the auth import block in `App.tsx` (lines 62–66):

```typescript
import AcceptInvitePage from "@/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/auth/ForgotPasswordPage";
import LoginPage from "@/auth/LoginPage";
import ResetPasswordPage from "@/auth/ResetPasswordPage";
import SessionReauthPage from "@/auth/SessionReauthPage";
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move auth pages to src/auth/"
```

---

## Task 2: Move `account/` (was `pages/system/`)

**Files:**
- Move: `pages/system/*` → `account/*`
- Modify: `account/page-helpers.tsx` — rename `SystemShellPage` → `AccountShellPage`
- Modify: `App.tsx` (system/account import block)

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/pwa/src/account
git mv apps/pwa/src/pages/system/DownloadPage.tsx apps/pwa/src/account/DownloadPage.tsx
git mv apps/pwa/src/pages/system/HelpPage.tsx apps/pwa/src/account/HelpPage.tsx
git mv apps/pwa/src/pages/system/NotificationsPage.tsx apps/pwa/src/account/NotificationsPage.tsx
git mv apps/pwa/src/pages/system/PayslipsPage.tsx apps/pwa/src/account/PayslipsPage.tsx
git mv apps/pwa/src/pages/system/ProfilePage.tsx apps/pwa/src/account/ProfilePage.tsx
git mv apps/pwa/src/pages/system/SettingsPage.tsx apps/pwa/src/account/SettingsPage.tsx
git mv apps/pwa/src/pages/system/TimesheetEditorSlideOver.tsx apps/pwa/src/account/TimesheetEditorSlideOver.tsx
git mv apps/pwa/src/pages/system/TimesheetsPage.tsx apps/pwa/src/account/TimesheetsPage.tsx
git mv apps/pwa/src/pages/system/page-helpers.tsx apps/pwa/src/account/page-helpers.tsx
git mv apps/pwa/src/pages/system/index.ts apps/pwa/src/account/index.ts
rmdir apps/pwa/src/pages/system
```

- [ ] **Step 2: Rename `SystemShellPage` → `AccountShellPage` in `account/page-helpers.tsx`**

In `apps/pwa/src/account/page-helpers.tsx`, rename the exported function:

```typescript
export function AccountShellPage({
```

And update the `export` at the bottom if there is one. Also update the import in each page that uses it — open each of these files and change `SystemShellPage` to `AccountShellPage`:

```
apps/pwa/src/account/DownloadPage.tsx
apps/pwa/src/account/HelpPage.tsx
apps/pwa/src/account/NotificationsPage.tsx
apps/pwa/src/account/PayslipsPage.tsx
apps/pwa/src/account/ProfilePage.tsx
apps/pwa/src/account/SettingsPage.tsx
apps/pwa/src/account/TimesheetsPage.tsx
```

In each file, change:
```typescript
import { SystemShellPage } from "./page-helpers";
// → 
import { AccountShellPage } from "./page-helpers";
```

And change all JSX usages: `<SystemShellPage` → `<AccountShellPage` and `</SystemShellPage>` → `</AccountShellPage>`.

- [ ] **Step 3: Update App.tsx account import block**

Replace the system pages import (lines 72–81 in current App.tsx):

```typescript
import {
  DownloadPage,
  HelpPage,
  NotificationsPage,
  PayslipsPage,
  TimesheetsPage,
  ProfilePage,
  SettingsPage,
} from "@/account";
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move system pages to src/account/, rename SystemShellPage to AccountShellPage"
```

---

## Task 3: Move `requests/` (was `features/requests/`)

**Files:**
- Move: `features/requests/pages/*.tsx` → `requests/*.tsx`
- Move: `features/requests/pages/new/*.tsx` → `requests/new/*.tsx`
- Move: `features/taxonomy/TagPicker.tsx` → `requests/TagPicker.tsx`
- Keep: `features/requests/requests-data.ts` (and any non-page files) → `requests/requests-data.ts`
- Modify: `App.tsx` (requests import block)
- Modify: `account/page-helpers.tsx` (updates its import of `requests-data`)

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/pwa/src/requests/new
# Page files
git mv apps/pwa/src/features/requests/pages/ApprovalsPage.tsx apps/pwa/src/requests/ApprovalsPage.tsx
git mv apps/pwa/src/features/requests/pages/RequestDetailsPage.tsx apps/pwa/src/requests/RequestDetailsPage.tsx
git mv apps/pwa/src/features/requests/pages/RequestsListPage.tsx apps/pwa/src/requests/RequestsListPage.tsx
# New request pages
git mv "apps/pwa/src/features/requests/pages/new/FinancialRequestFormPage.tsx" apps/pwa/src/requests/new/FinancialRequestFormPage.tsx
git mv "apps/pwa/src/features/requests/pages/new/RequestFormPage.tsx" apps/pwa/src/requests/new/RequestFormPage.tsx
git mv "apps/pwa/src/features/requests/pages/new/RequestTypePage.tsx" apps/pwa/src/requests/new/RequestTypePage.tsx
# Move all remaining files in features/requests (requests-data.ts, etc.)
for f in apps/pwa/src/features/requests/*.ts apps/pwa/src/features/requests/*.tsx; do
  [ -f "$f" ] && git mv "$f" "apps/pwa/src/requests/$(basename $f)"
done
# Taxonomy
git mv apps/pwa/src/features/taxonomy/TagPicker.tsx apps/pwa/src/requests/TagPicker.tsx
rmdir apps/pwa/src/features/requests/pages/new apps/pwa/src/features/requests/pages apps/pwa/src/features/requests apps/pwa/src/features/taxonomy apps/pwa/src/features 2>/dev/null || true
```

- [ ] **Step 2: Update imports inside moved request files**

In each moved file, update any relative imports that pointed up into `features/requests/`. Run:

```bash
grep -rn "from.*features/requests\|from.*features/taxonomy" apps/pwa/src/requests/ apps/pwa/src/account/
```

Fix each result — the new path for `requests-data` is `@/requests/requests-data`.

- [ ] **Step 3: Update App.tsx requests imports**

Replace the features/requests import block (lines 67–71):

```typescript
import RequestDetailsPage from "@/requests/RequestDetailsPage";
import RequestFormPage from "@/requests/new/RequestFormPage";
import RequestTypePage from "@/requests/new/RequestTypePage";
import ApprovalsPage from "@/requests/ApprovalsPage";
import RequestsListPage from "@/requests/RequestsListPage";
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move requests pages to src/requests/, flatten features/ dir"
```

---

## Task 4: Move `admin/` (was `modules/admin/`)

**Files:**
- Move into sub-folders by concern

- [ ] **Step 1: Move files into sub-folders**

```bash
mkdir -p apps/pwa/src/admin/files apps/pwa/src/admin/groups apps/pwa/src/admin/projects
mkdir -p apps/pwa/src/admin/roles apps/pwa/src/admin/settings apps/pwa/src/admin/users
mkdir -p apps/pwa/src/admin/request-types

git mv apps/pwa/src/modules/admin/AdminFilesPage.tsx            apps/pwa/src/admin/files/AdminFilesPage.tsx
git mv apps/pwa/src/modules/admin/AdminGroupsPage.tsx           apps/pwa/src/admin/groups/AdminGroupsPage.tsx
git mv apps/pwa/src/modules/admin/AdminGroupSlideOver.tsx       apps/pwa/src/admin/groups/AdminGroupSlideOver.tsx
git mv apps/pwa/src/modules/admin/AdminGroupTypeSlideOver.tsx   apps/pwa/src/admin/groups/AdminGroupTypeSlideOver.tsx
git mv apps/pwa/src/modules/admin/AdminPermissionSlideOver.tsx  apps/pwa/src/admin/roles/AdminPermissionSlideOver.tsx
git mv apps/pwa/src/modules/admin/AdminProjectsPage.tsx         apps/pwa/src/admin/projects/AdminProjectsPage.tsx
git mv apps/pwa/src/modules/admin/AdminProjectSlideOver.tsx     apps/pwa/src/admin/projects/AdminProjectSlideOver.tsx
git mv apps/pwa/src/modules/admin/AdminRolesPage.tsx            apps/pwa/src/admin/roles/AdminRolesPage.tsx
git mv apps/pwa/src/modules/admin/AdminRoleSlideOver.tsx        apps/pwa/src/admin/roles/AdminRoleSlideOver.tsx
git mv apps/pwa/src/modules/admin/AdminSettingsPage.tsx         apps/pwa/src/admin/settings/AdminSettingsPage.tsx
git mv apps/pwa/src/modules/admin/AdminUsersPage.tsx            apps/pwa/src/admin/users/AdminUsersPage.tsx
git mv apps/pwa/src/modules/admin/AdminUserDetailPage.tsx       apps/pwa/src/admin/users/AdminUserDetailPage.tsx
git mv apps/pwa/src/modules/admin/AdminUserCreateSlideOver.tsx  apps/pwa/src/admin/users/AdminUserCreateSlideOver.tsx
git mv apps/pwa/src/modules/admin/RequestTypeSlideOver.tsx      apps/pwa/src/admin/request-types/RequestTypeSlideOver.tsx
rmdir apps/pwa/src/modules/admin
```

- [ ] **Step 2: Fix relative imports inside moved admin files**

SlideOver files import each other (e.g. `AdminGroupsPage` imports `AdminGroupSlideOver`). Run:

```bash
grep -rn "from \"./" apps/pwa/src/admin/ | grep -v "node_modules"
```

Update any broken relative paths. Since all group files are now in `admin/groups/`, imports between them remain `"./"` relative and need no change. Cross-folder imports (e.g. roles page importing permission slideover) will need `"../roles/AdminPermissionSlideOver"` style paths — fix those from TS errors.

- [ ] **Step 3: Update App.tsx admin imports**

Replace the admin import block (lines 36–50):

```typescript
import AdminRolesPage from "@/admin/roles/AdminRolesPage";
import AdminUsersPage from "@/admin/users/AdminUsersPage";
import AdminUserDetailPage from "@/admin/users/AdminUserDetailPage";
import AdminSettingsPage from "@/admin/settings/AdminSettingsPage";
import AdminGroupsPage from "@/admin/groups/AdminGroupsPage";
import AdminProjectsPage from "@/admin/projects/AdminProjectsPage";
import AdminFilesPage from "@/admin/files/AdminFilesPage";
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move admin pages to src/admin/ with grouped sub-folders"
```

---

## Task 5: Move `finance/` (was `modules/finance/`)

**Files:** Move ~35 files into themed sub-folders.

- [ ] **Step 1: Create sub-folder structure**

```bash
mkdir -p apps/pwa/src/finance/dashboard
mkdir -p apps/pwa/src/finance/requests/details
mkdir -p apps/pwa/src/finance/accounts
mkdir -p apps/pwa/src/finance/assets
mkdir -p apps/pwa/src/finance/bills
mkdir -p apps/pwa/src/finance/budgets
mkdir -p apps/pwa/src/finance/deductions
mkdir -p apps/pwa/src/finance/expenses
mkdir -p apps/pwa/src/finance/income
mkdir -p apps/pwa/src/finance/invoices
mkdir -p apps/pwa/src/finance/items
mkdir -p apps/pwa/src/finance/ledger
mkdir -p apps/pwa/src/finance/payables
mkdir -p apps/pwa/src/finance/payment-vouchers
mkdir -p apps/pwa/src/finance/receivables
mkdir -p apps/pwa/src/finance/reports
mkdir -p apps/pwa/src/finance/settings/tabs
```

- [ ] **Step 2: Move page files**

```bash
# Dashboard
git mv apps/pwa/src/modules/finance/FinanceDashboardPage.tsx         apps/pwa/src/finance/dashboard/FinanceDashboardPage.tsx

# Requests
git mv apps/pwa/src/modules/finance/FinanceRequestsPage.tsx          apps/pwa/src/finance/requests/FinanceRequestsPage.tsx
git mv apps/pwa/src/modules/finance/FinanceRequestDetailsPage.tsx    apps/pwa/src/finance/requests/FinanceRequestDetailsPage.tsx

# Accounts
git mv apps/pwa/src/modules/finance/FinanceAccountsPage.tsx          apps/pwa/src/finance/accounts/FinanceAccountsPage.tsx
git mv apps/pwa/src/modules/finance/FinanceAccountDetailPage.tsx     apps/pwa/src/finance/accounts/FinanceAccountDetailPage.tsx
git mv apps/pwa/src/modules/finance/FinanceChartAccountsPage.tsx     apps/pwa/src/finance/accounts/FinanceChartAccountsPage.tsx

# Assets
git mv apps/pwa/src/modules/finance/FinanceAssetsPage.tsx            apps/pwa/src/finance/assets/FinanceAssetsPage.tsx
git mv apps/pwa/src/modules/finance/FinanceAssetEditorPage.tsx       apps/pwa/src/finance/assets/FinanceAssetEditorPage.tsx
git mv apps/pwa/src/modules/finance/FinanceAssetDisposalsPage.tsx    apps/pwa/src/finance/assets/FinanceAssetDisposalsPage.tsx

# Bills
git mv apps/pwa/src/modules/finance/FinanceBillsPage.tsx             apps/pwa/src/finance/bills/FinanceBillsPage.tsx

# Budgets
git mv apps/pwa/src/modules/finance/FinanceBudgetsPage.tsx           apps/pwa/src/finance/budgets/FinanceBudgetsPage.tsx

# Deductions
git mv apps/pwa/src/modules/finance/FinanceDeductionTypesPage.tsx    apps/pwa/src/finance/deductions/FinanceDeductionTypesPage.tsx
git mv apps/pwa/src/modules/finance/PVDeductionsPanel.tsx            apps/pwa/src/finance/deductions/PVDeductionsPanel.tsx

# Expenses
git mv apps/pwa/src/modules/finance/FinanceExpensesPage.tsx          apps/pwa/src/finance/expenses/FinanceExpensesPage.tsx

# Income
git mv apps/pwa/src/modules/finance/FinanceIncomePage.tsx            apps/pwa/src/finance/income/FinanceIncomePage.tsx

# Invoices
git mv apps/pwa/src/modules/finance/FinanceSalesInvoicesPage.tsx     apps/pwa/src/finance/invoices/FinanceSalesInvoicesPage.tsx

# Items
git mv apps/pwa/src/modules/finance/FinanceItemsPage.tsx             apps/pwa/src/finance/items/FinanceItemsPage.tsx

# Ledger
git mv apps/pwa/src/modules/finance/FinanceLedgerPage.tsx            apps/pwa/src/finance/ledger/FinanceLedgerPage.tsx
git mv apps/pwa/src/modules/finance/FinanceManualEntryPage.tsx       apps/pwa/src/finance/ledger/FinanceManualEntryPage.tsx

# Payables
git mv apps/pwa/src/modules/finance/FinancePayablesPage.tsx          apps/pwa/src/finance/payables/FinancePayablesPage.tsx

# Payment vouchers
git mv apps/pwa/src/modules/finance/FinancePaymentVouchersPage.tsx   apps/pwa/src/finance/payment-vouchers/FinancePaymentVouchersPage.tsx

# Receivables
git mv apps/pwa/src/modules/finance/FinanceReceivablesPage.tsx       apps/pwa/src/finance/receivables/FinanceReceivablesPage.tsx

# Reports
git mv apps/pwa/src/modules/finance/FinanceReportsPage.tsx           apps/pwa/src/finance/reports/FinanceReportsPage.tsx
git mv apps/pwa/src/modules/finance/FinanceReportDetailPage.tsx      apps/pwa/src/finance/reports/FinanceReportDetailPage.tsx

# Settings + tabs
git mv apps/pwa/src/modules/finance/FinanceSettingsPage.tsx          apps/pwa/src/finance/settings/FinanceSettingsPage.tsx
git mv apps/pwa/src/modules/finance/tabs/ChartOfAccountsTab.tsx      apps/pwa/src/finance/settings/tabs/ChartOfAccountsTab.tsx
git mv apps/pwa/src/modules/finance/tabs/NonprofitSetupTab.tsx       apps/pwa/src/finance/settings/tabs/NonprofitSetupTab.tsx
git mv apps/pwa/src/modules/finance/tabs/PartiesTab.tsx              apps/pwa/src/finance/settings/tabs/PartiesTab.tsx
git mv apps/pwa/src/modules/finance/tabs/ReportingPeriodsTab.tsx     apps/pwa/src/finance/settings/tabs/ReportingPeriodsTab.tsx
rmdir apps/pwa/src/modules/finance/tabs
```

- [ ] **Step 3: Move existing sub-folder trees**

```bash
# contacts, customers, vendors — already folders, just relocate
git mv apps/pwa/src/modules/finance/contacts apps/pwa/src/finance/contacts
git mv apps/pwa/src/modules/finance/customers apps/pwa/src/finance/customers
git mv apps/pwa/src/modules/finance/vendors apps/pwa/src/finance/vendors

# finance-request-details → finance/requests/details
git mv apps/pwa/src/modules/finance/finance-request-details/components apps/pwa/src/finance/requests/details/components
git mv apps/pwa/src/modules/finance/finance-request-details/context.ts apps/pwa/src/finance/requests/details/context.ts
git mv apps/pwa/src/modules/finance/finance-request-details/index.tsx apps/pwa/src/finance/requests/details/index.tsx
for d in hooks utils; do
  [ -d "apps/pwa/src/modules/finance/finance-request-details/$d" ] && \
    git mv "apps/pwa/src/modules/finance/finance-request-details/$d" "apps/pwa/src/finance/requests/details/$d"
done
rmdir apps/pwa/src/modules/finance/finance-request-details
rmdir apps/pwa/src/modules/finance
```

- [ ] **Step 4: Update App.tsx finance imports**

Replace all `@/modules/finance/...` imports in App.tsx:

```typescript
import FinanceDashboardPage from "@/finance/dashboard/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/finance/requests/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/finance/payment-vouchers/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/finance/requests/FinanceRequestsPage";
import FinanceLedgerPage from "@/finance/ledger/FinanceLedgerPage";
import FinanceBudgetsPage from "@/finance/budgets/FinanceBudgetsPage";
import FinanceReceivablesPage from "@/finance/receivables/FinanceReceivablesPage";
import FinancePayablesPage from "@/finance/payables/FinancePayablesPage";
import FinanceAssetsPage from "@/finance/assets/FinanceAssetsPage";
import FinanceAssetEditorPage from "@/finance/assets/FinanceAssetEditorPage";
import FinanceAssetDisposalsPage from "@/finance/assets/FinanceAssetDisposalsPage";
import FinanceReportsPage from "@/finance/reports/FinanceReportsPage";
import FinanceReportDetailPage from "@/finance/reports/FinanceReportDetailPage";
import FinanceSettingsPage from "@/finance/settings/FinanceSettingsPage";
import FinanceDeductionTypesPage from "@/finance/deductions/FinanceDeductionTypesPage";
import FinanceChartAccountsPage from "@/finance/accounts/FinanceChartAccountsPage";
import FinanceCustomersPage from "@/finance/customers";
import FinanceVendorsPage from "@/finance/vendors";
import FinanceContactsPage from "@/finance/contacts";
import FinanceAccountsPage from "@/finance/accounts/FinanceAccountsPage";
import FinanceAccountDetailPage from "@/finance/accounts/FinanceAccountDetailPage";
import FinanceItemsPage from "@/finance/items/FinanceItemsPage";
import FinanceExpensesPage from "@/finance/expenses/FinanceExpensesPage";
import FinanceIncomePage from "@/finance/income/FinanceIncomePage";
import FinanceBillsPage from "@/finance/bills/FinanceBillsPage";
import FinanceSalesInvoicesPage from "@/finance/invoices/FinanceSalesInvoicesPage";
import FinanceManualEntryPage from "@/finance/ledger/FinanceManualEntryPage";
```

- [ ] **Step 5: Fix internal imports inside moved finance files**

Run:

```bash
grep -rn "from.*modules/finance\|from.*finance-request-details" apps/pwa/src/finance/ | grep -v "node_modules"
```

Update each result. Key patterns:
- `from "@/modules/finance/X"` → `from "@/finance/<section>/X"`
- `from "../../context"` (inside `finance-request-details` files) → may need adjustment since folder moved from `finance-request-details/` to `requests/details/` — relative depth is the same, no change needed
- `from "../PVDeductionsPanel"` → `from "@/finance/deductions/PVDeductionsPanel"`

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -30
```

Expected: no output. Fix any remaining import errors reported.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move finance pages to src/finance/ with themed sub-folders"
```

---

## Task 6: Move `hr/` (was `modules/hr/`)

**Files:** Mostly already well-structured. Move the top-level dashboard file and relocate the whole tree.

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/pwa/src/hr/dashboard

git mv apps/pwa/src/modules/hr/HrDashboardPage.tsx apps/pwa/src/hr/dashboard/HrDashboardPage.tsx

# Move existing sub-folder trees
git mv apps/pwa/src/modules/hr/attendance apps/pwa/src/hr/attendance
git mv apps/pwa/src/modules/hr/employees  apps/pwa/src/hr/employees
git mv apps/pwa/src/modules/hr/leave      apps/pwa/src/hr/leave
git mv apps/pwa/src/modules/hr/settings   apps/pwa/src/hr/settings

rmdir apps/pwa/src/modules/hr
rmdir apps/pwa/src/modules 2>/dev/null || true
```

- [ ] **Step 2: Update App.tsx HR imports**

Replace all `@/modules/hr/...` imports:

```typescript
import AttendancePage from "@/hr/attendance/AttendancePage";
import LeavePage from "@/hr/leave/LeavePage";
import LeaveRequestFormPage from "@/hr/leave/LeaveRequestFormPage";
import LeaveRequestDetailsPage from "@/hr/leave/LeaveRequestDetailsPage";
import HrDashboardPage from "@/hr/dashboard/HrDashboardPage";
import HrLeavePage from "@/hr/leave/HrLeavePage";
import HrEmployeesPage from "@/hr/employees/HrEmployeesPage";
import HrEmployeeCreatePage from "@/hr/employees/HrEmployeeCreatePage";
import HrEmployeeDetailPage from "@/hr/employees/HrEmployeeDetailPage";
import HrEmployeeEditPage from "@/hr/employees/HrEmployeeEditPage";
import HrAttendancePage from "@/hr/attendance/HrAttendancePage";
import HrSettingsPage from "@/hr/settings/HrSettingsPage";
```

- [ ] **Step 3: Fix internal imports inside moved HR files**

```bash
grep -rn "from.*modules/hr" apps/pwa/src/hr/ | grep -v "node_modules"
```

Update each result. Internal relative imports within subfolders (e.g. `"./AttendancePage"`) need no change.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move HR pages to src/hr/"
```

---

## Task 7: Move remaining `pages/`

**Files:** `pages/dashboard/`, `pages/files/`, `pages/projects/`.

- [ ] **Step 1: Move files**

```bash
mkdir -p apps/pwa/src/dashboard apps/pwa/src/files apps/pwa/src/projects

git mv apps/pwa/src/pages/dashboard/DashboardPage.tsx apps/pwa/src/dashboard/DashboardPage.tsx
git mv apps/pwa/src/pages/files/FilesPage.tsx         apps/pwa/src/files/FilesPage.tsx
git mv apps/pwa/src/pages/projects/ProjectsPage.tsx   apps/pwa/src/projects/ProjectsPage.tsx
git mv apps/pwa/src/pages/projects/ProjectDetailPage.tsx apps/pwa/src/projects/ProjectDetailPage.tsx

rmdir apps/pwa/src/pages/dashboard apps/pwa/src/pages/files apps/pwa/src/pages/projects
rmdir apps/pwa/src/pages 2>/dev/null || true
```

- [ ] **Step 2: Update App.tsx remaining imports**

```typescript
import DashboardPage from "@/dashboard/DashboardPage";
import ProjectsPage from "@/projects/ProjectsPage";
import ProjectDetailPage from "@/projects/ProjectDetailPage";
import FilesPage from "@/files/FilesPage";
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(pwa): move remaining pages/ to flat domain folders"
```

---

## Task 8: Final cleanup and full verification

- [ ] **Step 1: Verify no old paths remain**

```bash
grep -rn "from.*@/modules/\|from.*@/features/\|from.*@/pages/" apps/pwa/src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

Expected: no output. Fix any remaining occurrences.

- [ ] **Step 2: Verify no empty stale directories**

```bash
find apps/pwa/src -type d -empty
```

Expected: no output. Remove any listed with `rmdir`.

- [ ] **Step 3: Full TypeScript check**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "error TS" | head -30
```

Expected: no output.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "refactor(pwa): complete src/ restructure — domain folders, no features/modules/pages hierarchy"
```

---

## Out of Scope

- Applying `FinanceShellPage` / `HrShellPage` / `AdminShellPage` wrappers across all pages (follow-on task)
- Renaming component files (e.g. `FinanceBillsPage.tsx` → `BillsPage.tsx`) — keep existing names to minimise diff
- Moving `shared/` internals
- Any logic or UI changes
