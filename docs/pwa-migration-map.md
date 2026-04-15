# Old PWA → New UI Migration Map

Old PWA base path: `/appOld/*` (in `PWA/src/`)
New PWA base path: root routes (in `apps/pwa/src/`)

Legend: ✅ Done | 🔨 In Progress | ⬜ Not Started | ❌ Drop / Won't Port

---

## Auth

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/login` | `auth/Login` | `/login` | `pages/auth/LoginPage` | ✅ | |
| `/forgot-password` | `auth/ForgotPassword` | `/forgot-password` | `pages/auth/ForgotPasswordPage` | ✅ | |
| `/reset-password` | `auth/ResetPassword` | `/reset-password` | `pages/auth/ResetPasswordPage` | ✅ | |
| `/accept-invite` | `auth/AcceptInvite` | `/accept-invite` | `pages/auth/AcceptInvitePage` | ✅ | |
| `/register` | `auth/Register` | — | — | ❌ | Invite-only flow replaces self-registration |
| `/reauth` | — | `/reauth` | `pages/auth/SessionReauthPage` | ✅ | New — session expiry re-auth |

---

## Staff — Core

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/dashboard` | `staff/dashboard/PortalDashboard` | `/` | `pages/dashboard/DashboardPage` | ✅ | Redesigned with stat cards + activity feed |
| `/appOld/profile` | `staff/profile/UpdateProfile` | `/profile` | `pages/system/ProfilePage` | ✅ | |
| `/appOld/settings/security` | `staff/security/ChangePassword` | `/settings` | `pages/system/SettingsPage` | ✅ | Change-password form wired |
| `/appOld/help` | `help/HelpHome` | `/help` | `pages/system/HelpPage` | ✅ | |
| `/appOld/help/finance` | `help/FinanceHelp` | `/help` | `pages/system/HelpPage` | ✅ | Finance help merged into unified HelpPage tabs |
| — | — | `/notifications` | `pages/system/NotificationsPage` | ✅ | New — no old equivalent |

---

## Staff — Requests

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/requests` | `staff/requests/RequestsList` | `/requests` | `features/requests/pages/RequestsListPage` | ✅ | Rebuilt: full-width, single date filter, per-page at bottom |
| `/appOld/requests/finance` | `staff/requests/RequestsList` (finance tab) | `/requests` | `RequestsListPage` (financial tab) | ✅ | Tab-switched inside same page |
| `/appOld/requests/new` | `staff/requests/RequestsCreate` | `/requests/new` | `features/requests/pages/new/RequestTypePage` | ✅ | New: type picker step before form |
| `/appOld/requests/new` | `staff/requests/RequestsCreate` | `/requests/new/form` | `features/requests/pages/new/RequestFormPage` | ✅ | optgroup-grouped type select |
| `/appOld/requests/:id` | `staff/requests/RequestDetail` | `/requests/details?id=…` | `features/requests/pages/RequestDetailsPage` | ✅ | Query-param detail pattern |
| `/appOld/approvals` | `staff/requests/RequestApprovals` | `/requests/approvals` | `features/requests/pages/ApprovalsPage` | ✅ | Full standalone page with tailored columns |
| `/appOld/approvals/:id` | `staff/requests/RequestDetail` | `/requests/details?id=…` | `features/requests/pages/RequestDetailsPage` | ✅ | Same detail page, different entry |

---

## Staff — Attendance & Leave

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/requests/attendance` | `staff/attendance/StaffAttendance` | `/attendance` | `modules/hr/AttendancePage` | ✅ | Promoted to top-level route |
| `/appOld/requests/leave` | `staff/leave/StaffLeaveTracker` | `/leave` | `modules/hr/LeavePage` | ✅ | Leave tracker shell added with request flow bridge |

---

## Staff — Other

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/onboarding` | `staff/onboarding/Onboarding` | — | — | ⬜ | Not ported — low priority |
| `/appOld/media` | `staff/media/MediaLibrary` | — | — | ⬜ | Not ported; shared `MediaPickerModal` exists |
| `/appOld/documents` | `staff/documents/Documents` | — | — | ⬜ | Not ported |
| `/appOld/profile/payslips` | `profile/MyPayslips` | — | — | ⬜ | Add as `/profile/payslips` under finance module guard |
| `/appOld/profile/timesheets` | `profile/MyTimesheets` | — | — | ⬜ | Add as `/profile/timesheets` |
| `/appOld/work` | `profile/MyWork` | — | — | ⬜ | Work/task management not ported |
| `/appOld/work/performance` | `work/PerformanceOverview` | — | — | ⬜ | Not ported |
| `/appOld/profile/payroll-notifications` | `FinancePayrollNotificationPreferences` | — | — | ⬜ | Add under `/settings` or `/profile/payroll-notifications` |

---

## Finance — Admin (module: finance, permission: finance.view)

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/finance` | `finance/dashboard/FinanceDashboard` | `/finance` | `modules/finance/FinanceDashboardPage` | ✅ | |
| `/appOld/finance/requests` | `finance/requests/FinanceRequestsList` | `/finance/requests` | `modules/finance/FinanceRequestsPage` | ✅ | |
| `/appOld/finance/requests/:id` | `finance/requests/FinanceRequestDetail` | `/finance/requests/details?id=…` | `modules/finance/FinanceRequestDetailsPage` | ✅ | |
| `/appOld/finance/payment-vouchers` | `finance/payment-vouchers/FinancePaymentVouchers` | `/finance/payment-vouchers` | `modules/finance/FinancePaymentVouchersPage` | ✅ | |
| `/appOld/finance/manual-entry` | `finance/manual-entry/FinanceManualEntry` | — | — | ⬜ | Journal/manual entry not yet in new UI |
| `/appOld/finance/accounts` | `finance/accounts/FinanceAccounts` | `/finance/accounts` | `modules/finance/FinanceAccountsPage` | ✅ | Bank/cash accounts |
| `/appOld/finance/accounts/:id` | `finance/accounts/FinanceAccountDetail` | — | — | ⬜ | Account ledger detail |
| `/appOld/finance/settings/chart-of-accounts` | `finance/settings/FinanceChartAccounts` | `/finance/chart-accounts` | `modules/finance/FinanceChartAccountsPage` | ✅ | Chart of accounts classification |
| `/appOld/finance/ledger` | `finance/ledger/FinanceLedger` | `/finance/ledger` | `modules/finance/FinanceLedgerPage` | ✅ | Ledger view (filters + totals + entries) |
| `/appOld/finance/assets` | `finance/assets/FinanceAssets` | `/finance/assets` | `modules/finance/FinanceAssetsPage` | ✅ | Asset register + disposal snapshot |
| `/appOld/finance/assets/new` | `finance/assets/FinanceAssetEditor` | — | — | ⬜ | |
| `/appOld/finance/assets/:id` | `finance/assets/FinanceAssetDetail` | — | — | ⬜ | |
| `/appOld/finance/assets/disposals` | `finance/assets/FinanceAssetDisposals` | — | — | ⬜ | |
| `/appOld/finance/budgets` | `finance/budgets/FinanceBudgets` | `/finance/budgets` | `modules/finance/FinanceBudgetsPage` | ✅ | Budget register + variance stats |
| `/appOld/finance/receivables` | `finance/receivables/FinanceReceivables` | `/finance/receivables` | `modules/finance/FinanceReceivablesPage` | ✅ | Invoice/receivables list |
| `/appOld/finance/receivables/:id` | `finance/receivables/FinanceInvoiceDetail` | — | — | ⬜ | |
| `/appOld/finance/payables` | `finance/payables/FinancePayables` | `/finance/payables` | `modules/finance/FinancePayablesPage` | ✅ | Vendor bills/payables list |
| — | — | `/finance/items` | `modules/finance/FinanceItemsPage` | ✅ | New - products/services catalog |
| — | — | `/finance/expenses` | `modules/finance/FinanceExpensesPage` | ✅ | New - direct expense register |
| — | — | `/finance/customers` | `modules/finance/FinanceCustomersPage` | ✅ | New - Customer list + detail view |
| — | — | `/finance/vendors` | `modules/finance/FinanceVendorsPage` | ✅ | New - Vendor list + detail view |

---

## Finance — Reports

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/finance/reports` | `finance/reports/FinanceReportsDashboard` | `/finance/reports` | `modules/finance/FinanceReportsPage` | ✅ | Reports hub with endpoint snapshots |
| `/appOld/finance/reports/activities` | `finance/reports/FinanceStatementActivities` | — | — | ⬜ | Statement of activities |
| `/appOld/finance/reports/position` | `finance/reports/FinanceStatementPosition` | — | — | ⬜ | Statement of financial position |
| `/appOld/finance/reports/budget-vs-actual` | `finance/reports/FinanceBudgetVsActual` | — | — | ⬜ | |
| `/appOld/finance/reports/grant-utilization` | `finance/reports/FinanceGrantUtilization` | — | — | ⬜ | |
| `/appOld/finance/reports/aged-receivables` | `finance/reports/FinanceAgedReceivables` | — | — | ⬜ | |

---

## Finance — Settings

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/finance/settings` | `finance/settings/FinanceSettings` | `/finance/settings` | `modules/finance/FinanceSettingsPage` | ✅ | Finance settings hub with tabs |
| `/appOld/finance/settings/chart-of-accounts` | `finance/settings/FinanceChartAccounts` | — | — | ⬜ | |
| `/appOld/finance/settings/reporting-periods` | `finance/settings/FinanceReportingPeriods` | — | — | ⬜ | |
| `/appOld/finance/settings/parties` | `finance/settings/FinanceParties` | — | — | ⬜ | Vendors/parties |
| `/appOld/finance/settings/nonprofit` | `finance/settings/FinanceNonprofitSettings` | — | — | ⬜ | |
| `/appOld/finance/settings/request-types/:id` | `finance/settings/RequestTypeEditor` | — | — | ⬜ | |

---

## Finance — Payroll

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/finance/payroll` | `finance/payroll/FinancePayrollDashboard` | — | — | ⬜ | Payroll is a major sub-module; scope separately |
| `/appOld/finance/payroll/inbox` | `finance/payroll/FinancePayrollInbox` | — | — | ⬜ | |
| `/appOld/finance/payroll/workers` | `finance/payroll/FinancePayrollWorkers` | — | — | ⬜ | |
| `/appOld/finance/payroll/components` | `finance/payroll/FinancePayrollComponents` | — | — | ⬜ | |
| `/appOld/finance/payroll/loans` | `finance/payroll/FinancePayrollLoans` | — | — | ⬜ | |
| `/appOld/finance/payroll/timesheets` | `finance/payroll/FinancePayrollTimesheets` | — | — | ⬜ | |
| `/appOld/finance/payroll/runs` | `finance/payroll/FinancePayrollRuns` | — | — | ⬜ | |
| `/appOld/finance/payroll/approvals` | `finance/payroll/FinancePayrollApprovals` | — | — | ⬜ | |
| `/appOld/finance/payroll/reports` | `finance/payroll/FinancePayrollReports` | — | — | ⬜ | |
| `/appOld/finance/payroll/templates` | `finance/payroll/FinancePayrollTemplates` | — | — | ⬜ | |
| `/appOld/finance/payroll/import` | `finance/payroll/FinancePayrollImport` | — | — | ⬜ | |
| `/appOld/finance/payroll/settings` | `finance/payroll/FinancePayrollSettings` | — | — | ⬜ | |

---

## HR Module (module: hr)

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/hr` | `hr/dashboard/HrDashboard` | `/hr` | `modules/hr/HrDashboardPage` | ✅ | Stats + quick actions |
| `/appOld/hr/employees` | `hr/employees/HrEmployees` | `/hr/employees` | `modules/hr/employees/HrEmployeesPage` | ✅ | Full filter bar + table |
| `/appOld/hr/employees/:id` | `hr/employees/HrEmployeeEditor` | `/hr/employees/:id` | `modules/hr/employees/HrEmployeeDetailPage` | ✅ | Tabbed editor (Profile, Job, Orgs, Actions) |
| `/appOld/hr/attendance` | `hr/attendance/HrAttendance` | `/hr/attendance` | `modules/hr/attendance/HrAttendancePage` | ✅ | HR-side attendance view |
| `/appOld/hr/leave` | `hr/leave/HrLeaveTracker` | `/hr/leave` | `modules/hr/leave/HrLeavePage` | ✅ | Leave tracker (HR view) |
| `/appOld/hr/leave/requests` | `hr/leave/HrLeaveRequests` | — | — | ⬜ | |
| `/appOld/hr/onboarding` | `hr/onboarding/HrOnboarding` | — | — | ⬜ | |
| `/appOld/hr/onboarding/:id` | `hr/onboarding/HrOnboardingEditor` | — | — | ⬜ | |
| `/appOld/hr/work` | `hr/work/HrWorkManagement` | — | — | ⬜ | |
| `/appOld/hr/settings` | `hr/settings/HrSettings` | `/hr/settings` | `modules/hr/settings/HrSettingsPage` | ✅ | Dashboard for Attendance, Leave, Locations |
| `/appOld/hr/settings/leave` | `hr/settings/HrLeaveSettings` | `/hr/settings` | `modules/hr/settings/HrSettingsPage` | ✅ | Integrated into SettingsPage tabs |
| `/appOld/hr/settings/request-types/:id` | `hr/settings/HrRequestTypeEditor` | `/hr/settings` | `modules/hr/settings/LeaveTypeSlideOver` | ✅ | Replaced with SlideOver for Leave Types |

---

## Admin Module

| Old Route | Old Page | New Route | New Page | Status | Notes |
|---|---|---|---|---|---|
| `/appOld/admin/users` | `admin/users/UserManagement` | `/admin/users` | `modules/admin/AdminUsersPage` | ✅ | User list + invite |
| `/appOld/admin/users/new` | `admin/users/UserCreate` | — | — | ⬜ | |
| `/appOld/admin/users/:id` | `admin/users/UserEdit` | `/admin/users/:id` | `modules/admin/AdminUserDetailPage` | ✅ | User detail + edit |
| `/appOld/admin/users/:id/roles` | `admin/users/UserRoles` | — | — | ⬜ | |
| `/appOld/admin/roles` | `admin/roles/AdminRoles` | `/admin/roles` | `modules/admin/AdminRolesPage` | ✅ | Role management |
| `/appOld/admin/policies` | `admin/policies/AdminPolicies` | — | — | ⬜ | Policy/permissions |
| `/appOld/admin/groups` | `admin/groups/AdminGroups` | `/admin/groups` | `modules/admin/AdminGroupsPage` | ✅ | |
| `/appOld/admin/files` | `admin/files/AdminFiles` | `/admin/files` | `modules/admin/AdminFilesPage` | ✅ | |
| `/appOld/admin/projects` | `admin/projects/AdminProjects` | `/admin/projects` | `modules/admin/AdminProjectsPage` | ✅ | |
| `/appOld/admin/documents` | `admin/documents/AdminDocuments` | — | — | ⬜ | |
| `/appOld/admin/documents/:id` | `admin/documents/AdminDocumentEditor` | — | — | ⬜ | |
| `/appOld/admin/forms` | `admin/forms/AdminForms` | — | — | ⬜ | |
| `/appOld/admin/forms/:id` | `admin/forms/AdminFormEditor` | — | — | ⬜ | |
| `/appOld/admin/settings` | `admin/settings/AdminSettings` | `/admin/settings` | `modules/admin/AdminSettingsPage` | ✅ | Org/system global settings hub |

---

## Migration Priority Order

### Phase 1 — Already Done (ship-ready)
- Auth flow (login, forgot/reset, accept invite, reauth)
- Staff dashboard
- Requests (list, create, detail, approvals)
- Attendance
- Finance (dashboard, requests, request detail, payment vouchers, ledger, budgets, receivables, payables, assets, reports, settings, customers, vendors)
- Profile & Settings stubs

### Phase 2 — High Impact, Low Complexity
1. ✅ **Leave tracker** (`/leave`) — Staff leave self-service; reuse `AttendancePage` structure
2. ✅ **Change Password** — Add to `SettingsPage` as a form section (already in old PWA)
3. ✅ **My Payslips** (`/profile/payslips`) — Payroll module guard; simple table + download
4. ✅ **My Timesheets** (`/profile/timesheets`) — Table + filter; reuse `RequestsListPage` pattern
5. **Finance Manual Entry** (`/finance/journal`) — New journal entry form; reuse `RequestFormPage` pattern
6. **Finance Accounts** (`/finance/accounts`) — Chart of accounts table + detail; new `modules/finance/` pages

### Phase 3 — Finance Depth
7. ✅ Finance Ledger
8. ✅ Finance Budgets
9. ✅ Finance Receivables + Payables
10. ✅ Finance Assets (register, editor, disposals)
11. ✅ Finance Reports dashboard + individual reports
12. ✅ Finance Settings (chart of accounts, periods, parties, nonprofit, request types)
13. ✅ Finance Customers (new)
14. ✅ Finance Vendors (new)

### Phase 4 — HR Admin
13. ✅ HR Dashboard + Employee directory/editor
14. ✅ HR Attendance + Leave (HR views)
15. HR Onboarding
16. HR Work Management
17. ✅ HR Settings (leave, request types)

### Phase 5 — Payroll (large sub-module, scope separately)
18. Payroll Dashboard → Runs → Workers → Components
19. Payroll Timesheets, Loans, Approvals
20. Payroll Reports, Templates, Import, Settings
21. Staff: My Payroll Notification Preferences

### Phase 6 — Admin
22. ✅ User Management (list, create, edit)
23. ✅ Roles Management
24. Role & Policy Management
25. ✅ Groups Management
26. Files, Projects
27. Documents + Document Editor
28. Forms + Form Editor
29. ✅ Org/System Settings

---

## Architectural Improvements Applied in New UI

| Old Pattern | New Pattern | Benefit |
|---|---|---|
| Global theme (Enigma/Rubick/Tinker/Icewall) with CSS overrides | Single design system (Material 3 tokens + Tailwind) | Consistent, maintainable |
| `ModuleRoute` + `PermissionRoute` + `RoleRoute` nested 3 deep | Flat `ModuleRoute` + `ApprovalRoute` wrappers | Simpler auth tree |
| Right-rail sidebar on every list page | Full-width list, context in detail page | More scan space |
| Date range picker for filtering | Single date picker | Simpler UX for most use cases |
| `perPage` in top filter bar | `perPage` select + pagination at bottom | Standard table UX |
| Approval list = thin wrapper over request list | Standalone `ApprovalsPage` with approval-tailored columns | Reviewers see what they need |
| Request type = flat `<select>` | `<optgroup>` grouped by family | Faster type selection |
| Activity feed: chronological, all items | Newest-first, limited to 3 with expand | Surfacing most recent activity |
| `TomSelect`, `Litepicker`, `CKEditor`, `TinySlider` | Native inputs + Material Icons + Tailwind | Fewer dependencies, faster load |
| Page-level help guide overlay (`PageGuide`) | `/help` with tabs | Less intrusive |
| Lazy-loaded routes via `React.lazy` | Same pattern preserved | Good — keep |
| `useRoutes` array config | `<Routes>/<Route>` JSX | Minor style difference, both fine |
