# Frontend ↔ Backend Integration Map

This document links the Stanforte Edge Core plugin APIs to the planned React (Vite) frontend modules. Review alongside `docs/technical-spec.md` and `docs/stanforteedge.md` to ensure alignment with documented workflows.

## Authentication & Session Management

| Backend Endpoint                                    | Method | Purpose                                       | Frontend Module                                    |
| --------------------------------------------------- | ------ | --------------------------------------------- | -------------------------------------------------- |
| `api/v1/auth/login` (`Core/Auth/Routes/routes.php`) | POST   | Issue access/refresh tokens for staff login.  | `src/pages/Auth/Login`, `src/services/auth.ts`     |
| `api/v1/auth/refresh`                               | POST   | Rotate access tokens using refresh token.     | `src/services/auth.ts`, axios interceptor          |
| `api/v1/auth/logout`                                | POST   | Invalidate refresh token record (JWT memory). | `src/services/auth.ts`, global store logout action |
| `api/v1/auth/status`                                | GET    | Lightweight check for session validity.       | App bootstrap guard (optional)                     |
| `api/v1/auth/change-password`                       | POST   | Change current password.                      | `src/pages/Account/ChangePassword`                 |
| `api/v1/auth/forgot-password`                       | POST   | Request reset email/SMS.                      | `src/pages/Auth/ForgotPassword`                    |
| `api/v1/auth/reset-password`                        | POST   | Complete password reset flow.                 | `src/pages/Auth/ResetPassword`                     |

## User Profile & Identity

| Backend Endpoint | Method | Purpose                                        | Frontend Module                                            |
| ---------------- | ------ | ---------------------------------------------- | ---------------------------------------------------------- |
| `api/v1/profile` | GET    | Fetch current staff profile with RBAC context. | `src/pages/Profile/ProfileOverview`, `authSlice` bootstrap |
| `api/v1/profile` | PATCH  | Update personal details (per request schema).  | `src/pages/Profile/UpdateProfile`, `profileService`        |

## RBAC Administration

| Backend Endpoint                           | Method(s)            | Purpose                      | Frontend Module                                      |
| ------------------------------------------ | -------------------- | ---------------------------- | ---------------------------------------------------- |
| `api/v1/admin/rbac/roles`                  | GET/POST             | List and create roles.       | `src/pages/Admin/Roles/RoleList`, `RoleCreateDialog` |
| `api/v1/admin/rbac/roles/{id}`             | GET/PUT/PATCH/DELETE | Manage role definitions.     | `RoleDetail`, `RoleEditDialog`                       |
| `api/v1/admin/rbac/roles/{id}/permissions` | GET/POST/DELETE      | Assign permissions to roles. | `RolePermissions` management widgets                 |
| `api/v1/admin/rbac/permissions`            | GET/POST             | List/create permissions.     | `PermissionList`, `PermissionCreateDialog`           |
| `api/v1/admin/rbac/permissions/{id}`       | GET/PUT/PATCH/DELETE | Edit permission metadata.    | `PermissionDetail`                                   |

## Group & Team Management

| Backend Endpoint                       | Method(s)      | Purpose                             | Frontend Module                  |
| -------------------------------------- | -------------- | ----------------------------------- | -------------------------------- |
| `api/v1/groups`                        | GET/POST       | List groups & create new groupings. | `src/pages/Teams/GroupList`      |
| `api/v1/groups/{id}`                   | GET/PUT/DELETE | Inspect/update/delete a group.      | `GroupDetail`, `GroupEditDialog` |
| `api/v1/groups/{id}/users`             | POST           | Add member to group with role.      | `GroupMembers` tab               |
| `api/v1/groups/{id}/users/{user_id}`   | DELETE         | Remove member from group.           | `GroupMembers` tab               |
| `api/v1/groups/{id}/members`           | GET            | Fetch members for listing views.    | `GroupMembers` tab               |
| `api/v1/groups/{id}/bulk-add-users`    | POST           | Bulk membership import.             | `BulkAddMembersDialog`           |
| `api/v1/groups/{id}/bulk-remove-users` | POST           | Bulk membership removal.            | `BulkRemoveMembersDialog`        |

## Requests & Workflow Engine

| Backend Endpoint               | Method(s) | Purpose                                                              | Frontend Module                                      |
| ------------------------------ | --------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `api/v1/request-groups`        | GET       | Retrieve request categories (HR/Finance/etc.).                       | `src/pages/Requests/RequestCatalog`, filter controls |
| `api/v1/request-types`         | GET       | List types (optionally by group).                                    | `RequestCatalog`, dynamic form builder               |
| `api/v1/request-types/{id}`    | GET       | Fetch schema & approval flow for a type.                             | `RequestCreateWizard`                                |
| `api/v1/requests`              | GET/POST  | List existing requests, create new draft.                            | `RequestList`, `RequestCreateWizard`                 |
| `api/v1/requests/{id}`         | GET       | Detailed request view with timeline.                                 | `RequestDetail`                                      |
| `api/v1/requests/{id}/submit`  | POST      | Submit draft into workflow.                                          | `RequestDetail`, submit CTA                          |
| `api/v1/requests/{id}/actions` | POST      | Perform approval/disbursement actions (requires `approve_requests`). | `RequestActionPanel`                                 |

## File Storage

| Backend Endpoint                               | Method(s)       | Purpose                             | Frontend Module                                        |
| ---------------------------------------------- | --------------- | ----------------------------------- | ------------------------------------------------------ |
| `Core/FileStorage/Routes/files.php` (multiple) | GET/POST/DELETE | Upload, list, and delete documents. | `src/pages/Documents/FileManager`, request attachments |

## Forms & Dynamic Schema

| Backend Endpoint                             | Method(s)      | Purpose                                                    | Frontend Module                                 |
| -------------------------------------------- | -------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `api/v1/forms`                               | GET/POST       | List and create forms.                                     | `src/pages/Admin/Forms/FormList`, `FormBuilder` |
| `api/v1/forms/{id}`                          | GET/PUT/DELETE | Manage form definitions and fields.                        | `FormBuilder`, `FormSettings`                   |
| `api/v1/forms/schema/tables`                 | GET            | List available database tables for custom storage mapping. | `FormBuilder` -> `StorageSettings`              |
| `api/v1/forms/schema/tables/{table}/columns` | GET            | List columns for a selected table to map form fields.      | `FormBuilder` -> `ColumnMapping`                |

## Notifications

| Backend Endpoint                         | Method(s)           | Purpose                                 | Frontend Module                                              |
| ---------------------------------------- | ------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `Core/Notification/Routes/routes.php`    | GET/POST            | Fetch notification feed & mark as read. | `src/components/NotificationsDropdown`, `NotificationCenter` |
| `Core/Notification/Routes/templates.php` | GET/POST/PUT/DELETE | Administer notification templates.      | `src/pages/Admin/Notifications/Templates`                    |

## Taxonomy & Metadata

| Backend Endpoint                  | Method(s)     | Purpose                                       | Frontend Module                                 |
| --------------------------------- | ------------- | --------------------------------------------- | ----------------------------------------------- |
| `Core/Taxonomy/Routes/routes.php` | GET/POST/etc. | Manage categories, tags for cross-module use. | `TaxonomyManager`, select controls across forms |

## Document Library

| Backend Endpoint                  | Method(s)     | Purpose                                | Frontend Module                       |
| --------------------------------- | ------------- | -------------------------------------- | ------------------------------------- |
| `Core/Document/Routes/routes.php` | GET/POST/etc. | CRUD for policy documents & resources. | `src/pages/Documents/DocumentLibrary` |

## API Documentation

| Backend Endpoint                                      | Method | Purpose                                               | Frontend Module               |
| ----------------------------------------------------- | ------ | ----------------------------------------------------- | ----------------------------- |
| `api/v1/swagger.json` (`Core/Api/Routes/swagger.php`) | GET    | Serve OpenAPI document for client generation/testing. | Link from admin settings page |

---

**Next:** Implement typed services (`src/services/*`) that align with the above endpoints, ensuring JWT handling and RBAC permission checks are enforced client-side per `docs/technical-spec.md` and RBAC policies in `docs/rbac-matrix.md`.
