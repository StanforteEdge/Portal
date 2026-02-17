# Page: Admin • Roles

- URL: `/admin/roles/`
- Template: `templates/pages/admin/roles.php`
- Role: `admin`

## About
Role management interface for system administrators to create, modify, and manage user roles within the custom RBAC system, including permission assignment and role hierarchy configuration.

## Layout
1. Roles overview dashboard
   - Active roles count, user distribution, permission statistics
   - Role hierarchy visualization and relationship mapping
2. Role management table
   - Role list with assigned users, permissions, and status
   - Bulk role operations and hierarchy management
3. Role creation wizard
   - Role definition, permission assignment, hierarchy positioning
   - User assignment and notification settings

## Sections
- Roles Overview: System-wide role statistics and hierarchy visualization
- Role Management: Individual role configuration and permission assignment
- Permission Matrix: Role-permission relationship management
- User Assignment: Role assignment to users with approval workflows
- Hierarchy Management: Role precedence and inheritance configuration

## PRD
- Goal: Provide comprehensive role management for access control
- Success Criteria: Clear role definitions, proper permission assignment, hierarchy management
- Constraints: Security policies, role conflicts, audit requirements

## FRD
- Inputs: Role definitions, permission assignments, hierarchy settings, user assignments
- Client Validation: Valid permission combinations, hierarchy logic, conflict detection
- API Contracts:
  - GET `/wp-json/api/v1/admin/rbac/roles` (roles list)
  - POST `/wp-json/api/v1/admin/rbac/roles` (create role)
  - PUT `/wp-json/api/v1/admin/rbac/roles/{id}` (update role)
  - GET `/wp-json/api/v1/admin/rbac/roles/{id}/permissions` (role permissions)
- Behavior: Permission validation, hierarchy conflict resolution, audit logging
- Permissions: System administrators can manage roles and permissions

## States
- Overview: Role dashboard with system statistics and hierarchy view
- Creating: Role creation with permission assignment and validation
- Managing: Role modification with impact assessment and approval
- Assigning: User role assignment with notification and training requirements
