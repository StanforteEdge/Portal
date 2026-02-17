# Page: HR • Employee Roles

- URL: `/hr/employees/roles/`
- Template: `templates/pages/hr/employees/roles.php`
- Role: `hr-manager`

## About
Employee role assignment and management interface for HR managers to assign, modify, and track role changes for employees. Integrates with the custom RBAC system for permission management.

## Layout
1. Role assignment matrix
   - Employee list with current roles and status
   - Bulk role assignment tools
2. Role details panel
   - Selected role permissions and description
   - Employee count and assignment history
3. Role change workflow
   - Effective date selection, approval requirements
   - Change justification and notification settings

## Sections
- Employee-Role Matrix: Visual assignment overview with filters
- Role Details: Permission breakdown and employee assignments
- Assignment History: Audit trail of role changes with timestamps
- Bulk Operations: Mass role assignments and modifications
- Approval Queue: Pending role changes requiring approval

## PRD
- Goal: Enable secure role management with audit trails and approvals
- Success Criteria: Accurate role assignments, approval workflows, change tracking
- Constraints: Permission hierarchy, approval requirements, audit compliance

## FRD
- Inputs: Role assignments, effective dates, approval selections, justifications
- Client Validation: Valid role combinations, approval requirements, date validations
- API Contracts:
  - GET `/wp-json/api/v1/admin/rbac/user-roles?user_id=` (employee roles)
  - PUT `/wp-json/api/v1/admin/rbac/user-roles` (assign roles)
  - GET `/wp-json/api/v1/admin/rbac/roles` (available roles)
  - GET `/wp-json/api/v1/admin/rbac/role-history?user_id=` (assignment history)
- Behavior: Real-time permission preview, approval routing, notification system
- Permissions: HR managers can assign roles within authorized permission scopes

## States
- Viewing: Role matrix display with current assignments
- Assigning: Role selection with permission preview and validation
- Pending: Changes submitted for approval with status tracking
- Approved: Role changes applied with notification and audit logging
