# RBAC Access Matrix

## Principle
- Authorization source of truth: `permissions`.
- Roles are bundles that grant permissions.
- Frontend route/menu checks must align with backend `@Permissions(...)` guards.

## Current PWA Page Mapping
- `Dashboard`, `My Media`, `Documents`, `Profile`, `Onboarding`, `Security`: authenticated (no extra permission guard in route)
- `Staff Requests` (`/app/requests/*`): request actions are permission-gated by API (`requests.create`, `requests.view`, `requests.approve`, `requests.retire`)
- `Finance Admin` pages:
  - `/app/finance`, `/app/finance/requests`, `/app/finance/accounts`, `/app/finance/ledger`: `finance.view`
  - `/app/finance/manual-entry`: `requests.manage`
  - `/app/finance/settings`: `settings.manage`
- `HR Admin` pages (`/app/hr*`): `users.manage`
- `Admin` pages:
  - `/app/admin/users`, `/app/admin/users/new`: `users.manage`
  - `/app/admin/users/:id/roles`, `/app/admin/roles`: `roles.manage`
  - `/app/admin/settings`, `/app/admin/files`, `/app/admin/projects`, `/app/admin/documents*`, `/app/admin/forms*`, `/app/admin/policies`: `settings.manage`

## Backend Endpoint Permission Groups
- Requests module (`/v1/requests/*`): `requests.create|view|manage|approve|retire`
- Finance module (`/v1/finance/*`): `requests.view|requests.manage|settings.manage`
- HR module (`/v1/hr/*`): mostly `users.manage`
- Attendance self endpoints (`/v1/hr/attendance/clock-in|clock-out|me`): `requests.view`
- RBAC admin (`/v1/admin/rbac/*`): `settings.manage`
- Users (`/v1/users*`): `users.manage` / `roles.manage`

## Default Role Bundles (from `api/scripts/seed-rbac.js`)
- `admin`, `administrator`: `*`
- `finance_manager`: `requests.view`, `requests.manage`, `requests.approve`, `finance.manage`, `finance.view`, `finance.vouchers`, `workflow_view`
- `accountant`: `requests.view`, `requests.approve`, `finance.manage`, `finance.view`, `finance.vouchers`, `workflow_view`
- `staff`: `requests.create`, `requests.view`, `requests.retire`
- `team_lead`, `coo`, `ed`: `requests.view`, `requests.approve`, `workflow_view`

## Important Note
- If a role should access a page but is blocked, assign the required permission to that role in RBAC (`/app/admin/roles`).
