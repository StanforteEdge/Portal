# Stanforte Edge Staff Portal – Frontend Page Inventory

This catalogue enumerates the React pages we need for the portal, mapped to business capabilities in `docs/stanforteedge.md` and backend APIs (see `docs/frontend-api-mapping.md`). Use it to drive routing, component reuse, and sprint planning.

## Legend

| Status | Meaning |
|--------|---------|
| Reuse | Keep existing template screen with minimal tweaks |
| Adapt | Start from template page but refactor for portal UX/data |
| New | Build net-new view |

## Core Shell

| Page Key | Route (suggested) | Purpose | Source Status |
|----------|--------------------|---------|---------------|
| `Dashboard.Home` | `/dashboard` | Executive overview (metrics, quick links per module). | Adapt (use `DashboardOverview1`) |
| `Dashboard.MyTasks` | `/dashboard/tasks` | Personal queue (requests awaiting action). | New |

## Authentication & Account

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Auth.Login` | `/login` | JWT login flow. | Adapt (`pages/Login`) |
| `Auth.ForgotPassword` | `/forgot-password` | Trigger password reset email. | New |
| `Auth.ResetPassword` | `/reset-password` | Complete reset with token. | New |
| `Account.Profile` | `/account/profile` | Read-only profile overview. | Adapt (`ProfileOverview1`) |
| `Account.EditProfile` | `/account/profile/edit` | Update personal details. | Adapt (`UpdateProfile`) |
| `Account.ChangePassword` | `/account/change-password` | Change password (authenticated). | Adapt (`ChangePassword`) |

## Requests & Workflow

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Requests.List` | `/requests` | Paginated list with filters (status, type). | Adapt (`CrudDataList`) |
| `Requests.Create` | `/requests/new` | Dynamic schema-driven wizard. | Adapt (`WizardLayout1`) |
| `Requests.Detail` | `/requests/:id` | Timeline, attachments, workflow actions. | New |
| `Requests.Approvals` | `/requests/approvals` | Queue for approvers (permission-based). | New |

## Teams & RBAC

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Teams.Groups` | `/admin/groups` | Manage groups, pagination, create/edit. | Adapt (`UsersLayout2`) |
| `Teams.GroupDetail` | `/admin/groups/:id` | View members, manage membership. | New |
| `RBAC.Roles` | `/admin/rbac/roles` | Role list + CRUD. | Adapt (`RegularTable`) |
| `RBAC.RoleDetail` | `/admin/rbac/roles/:id` | Assign/remove permissions, member list. | New |
| `RBAC.Permissions` | `/admin/rbac/permissions` | Permission catalogue. | Adapt (`RegularTable`) |

## Document & File Management

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Documents.Library` | `/documents` | Browse/search shared documents. | Adapt (`FileManager`) |
| `Documents.Upload` | `/documents/upload` | Upload new resource (permission-gated). | Adapt (modal within FileManager) |
| `Documents.Policies` | `/documents/policies` | Filtered policy collection. | New |

## Notifications & Comms

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Notifications.Center` | `/notifications` | Full feed, mark read. | New |
| `Notifications.Templates` | `/admin/notifications/templates` | Manage templates (RBAC). | Adapt (`CrudForm`) |

## Analytics & Reporting (Phase 2)

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Reports.Executive` | `/reports/executive` | Cross-module KPIs. | New |
| `Reports.Finance` | `/reports/finance` | Budget vs actual, grants. | New |
| `Reports.HR` | `/reports/hr` | Headcount, leave stats. | New |

## System Administration

| Page Key | Route | Purpose | Source Status |
|----------|-------|---------|---------------|
| `Admin.Settings` | `/admin/settings` | Portal configuration, links to Swagger. | New |
| `Admin.AuditTrail` | `/admin/audit` | Searchable audit log. | New |
| `Admin.Integrations` | `/admin/integrations` | Configure external services (email/SMS). | New |

## Mobile Responsiveness Checklist

All above pages must scale to tablet/mobile per `docs/stanforteedge.md` section 8. Use Tailwind responsive utilities already in template.

---

**Implementation guidance:**
- Group pages into feature modules under `src/pages/` (e.g., `Auth/`, `Requests/`, `Admin/`).
- Pair each page with service hooks/types described in `frontend-api-mapping.md`.
- Reference RBAC permissions from `docs/rbac-matrix.md` when guarding routes and UI actions.
