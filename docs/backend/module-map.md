# Backend Module Map (from current WP plugin code)

This map is derived from the existing WordPress plugin routes and services, not the earlier spec doc.

## Core Modules
- Auth + RBAC
  - Routes: `plugin/Core/Auth/Routes/routes.php`, `plugin/Core/Auth/Routes/Admin.php`
  - Endpoints: `POST /auth/login`, `GET /auth/status`, `POST /auth/logout`, `POST /auth/change-password`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`
  - Admin RBAC: `/admin/rbac/roles`, `/admin/rbac/permissions`, `/admin/rbac/roles/{id}/permissions`
- User + Profile
  - Routes: `plugin/Core/User/Routes/routes.php`
  - Endpoints: `GET /profile`, `PATCH /profile`
- Organization
  - Routes: `plugin/Core/Organization/Routes/routes.php`
  - Endpoints: `GET /organizations`, `GET /organizations/my`, `POST /organizations`, `PUT /organizations/{id}`, `DELETE /organizations/{id}`
- Contact
  - Routes: `plugin/Core/Contact/Routes/routes.php`
  - Endpoints: `GET /contacts`, `GET /contacts/{id}`, `POST /contacts`, `PUT /contacts/{id}`, `DELETE /contacts/{id}`, `POST /contacts/{id}/set-primary`
- Forms + Submissions
  - Routes: `plugin/Core/Forms/Routes/api.php`
  - Endpoints: `/forms`, `/forms/{id}`, `/forms/{id}/assign`, `/forms/assigned`, `/forms/{id}/submit`, `/forms/{id}/submissions`, `/submissions/{id}`, `/submissions/{id}/status`, `/submissions/{id}/assign`, `/submissions/{id}/resolve`, `/submissions/my`, `/forms/schema/tables`, `/forms/schema/tables/{table}/columns`
- Requests + Approvals
  - Routes: `plugin/Core/Requests/Routes/requests.php`
  - Endpoints: `/requests/groups`, `/requests/types`, `/requests`, `/requests/{id}`, `/requests/{id}/submit`, `/requests/{id}/approve`, `/requests/{id}/reject`, `/requests/pending-approvals`, `/requests/{id}/history`, `/requests/{id}/actions`, `/requests/generate-pdf`, `/requests/generate-pv`, `/requests/{id}/retire`, `/requests/{id}/verify-retirement`
- Workflow
  - Routes: `plugin/Core/Workflow/Routes/api.php`
  - Endpoints: `/workflow/start`, `/workflow/transition/{instance_id}`, `/workflow/actions/{instance_id}`, `/workflow/history/{instance_id}`, `/workflow/instance/{instance_id}`, `/workflow/cancel/{instance_id}`
- Notifications
  - Routes: `plugin/Core/Notification/Routes/routes.php`
  - Endpoints: notification list, mark read, preferences (see routes file for full list)
- Documents
  - Routes: `plugin/Core/Document/Routes/routes.php`
  - Endpoints: `/documents`, `/documents/search`, plus document lifecycle endpoints (create/update/approve/archive)
- Taxonomy
  - Routes: `plugin/Core/Taxonomy/Routes/routes.php`
  - Endpoints: taxonomy list + CRUD (categories, tags, etc.)
- API + Health
  - Routes: `plugin/Core/Api/Routes/swagger.php`
  - Endpoints: `/docs`, `/swagger.json`, `/health`

## Admin Module
- User management
  - Routes: `plugin/Modules/Admin/Routes/users.php`
  - Endpoints: `/admin/users`, `/admin/users/{id}`, `/admin/users/{id}/teams`, `/admin/users/team-assign`, `/admin/users/team-remove`

## HR Module
- Employee management
  - Routes: `plugin/Modules/HR/Routes/routes.php`
  - Endpoints: `/hr/profiles`, `/hr/employees`, `/hr/employees/{id}`, `/hr/employees/{id}/status`, `/hr/employees/{id}/contacts`
- Attendance + Time Off (current WP ajax)
  - Source: `plugin/Modules/HR/Attendance/*`
  - Actions: record attendance, check-out, request time off, department attendance

## Finance Module
- Routes: `plugin/Modules/Finance/Routes/api.php`
- Endpoints: `/finance/requests/types`, `/finance/lookup-data`, `/finance/requests`, `/finance/requests/{id}`, `/finance/requests/approvals`, `/finance/requests/{id}/status`, `/finance/vouchers`, `/finance/payment-vouchers`, `/finance/payment-vouchers/{id}/pay`, `/finance/requests/{id}/pv`, `/finance/retirements`, `/finance/retirements/{id}/verify`, `/finance/retirements/{id}/reject`, `/finance/requests/{id}/retirement`

## Projects (future)
- Current plugin references projects in finance lookup data; no dedicated routes found yet.
