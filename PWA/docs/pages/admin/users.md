# Page: Admin • User Management

- URL: `/admin/users/`
- Template: `templates/pages/admin/users.php`
- Role: `admin`

## About
System administration interface for managing users, roles, and permissions. Provides full CRUD operations for user accounts and role assignments within the custom RBAC system.

## Layout
1. Header controls
   - User count stats + search input
   - Filters: role, status, department
   - Add User button + bulk actions
2. Users table
   - Columns: Name, Email, Role, Status, Last Login, Actions
   - Sortable, paginated, selectable rows
3. User detail modal
   - Profile info, role assignment, account status
   - Edit/save functionality

## Sections
- Stats Cards: Total users, active users, pending activations
- Filters: Role dropdown, status filter, department select
- Users Table: Data table with avatar, status badges, action menus
- Bulk Actions: Multi-select operations (activate, deactivate, change role)
- User Modal: Full user profile editing with role management

## PRD
- Goal: Provide comprehensive user administration for system admins
- Success Criteria: Fast user search, clear role management, secure operations
- Constraints: Respect data privacy; audit all admin actions

## FRD
- Inputs: user details (name, email, role, department), bulk selections
- Client Validation: Valid email format, required role assignment
- API Contracts:
  - GET `/wp-json/api/v1/admin/users?search=&role=&status=&page=`
  - POST `/wp-json/api/v1/admin/users` (create user)
  - PUT `/wp-json/api/v1/admin/users/{id}` (update user)
  - DELETE `/wp-json/api/v1/admin/users/{id}` (deactivate user)
  - GET `/wp-json/api/v1/admin/roles` (available roles)
- Behavior: Real-time search; optimistic updates; confirmation dialogs for destructive actions
- Permissions: Full user management authority for system admins

## States
- Loading: Skeleton table and stats
- Empty: "No users found" with filters CTA
- Processing: Loading states during API operations
- Error: Toast messages with retry options
