# Page: HR • Edit Employee

- URL: `/hr/employees/edit/{id}/`
- Template: `templates/pages/hr/employees/edit.php`
- Role: `hr-manager`

## About
Employee editing interface for HR managers to update employee information, employment details, and account settings. Provides comprehensive employee data management with change tracking and approval workflows.

## Layout
1. Employee header
   - Profile photo, name, employee ID, status badge
   - Quick actions: save, deactivate, view profile
2. Tabbed form sections
   - Personal Information, Employment Details, Compensation, Security
3. Change history sidebar
   - Recent modifications with timestamps and users
4. Save controls
   - Save changes, discard changes, approval required indicator

## Sections
- Header Card: Employee summary with status and actions
- Personal Tab: Contact details, address, emergency contacts (editable)
- Employment Tab: Job title, department, manager, start date (editable with approvals)
- Compensation Tab: Salary, benefits, pay frequency (restricted access)
- Security Tab: Account status, password reset, access permissions
- Change Log: Audit trail of all modifications

## PRD
- Goal: Enable controlled employee data updates with audit trails
- Success Criteria: Accurate data updates, approval workflows, change tracking
- Constraints: Data privacy, approval requirements for sensitive changes

## FRD
- Inputs: Employee data updates, approval selections, change justifications
- Client Validation: Required fields, data format validation, approval requirements
- API Contracts:
  - GET `/wp-json/api/v1/hr/employees/{id}` (current employee data)
  - PUT `/wp-json/api/v1/hr/employees/{id}` (update employee)
  - GET `/wp-json/api/v1/hr/employees/{id}/history` (change history)
  - POST `/wp-json/api/v1/hr/employees/{id}/approve` (approval workflow)
- Behavior: Auto-save drafts, approval routing for sensitive changes, audit logging
- Permissions: HR managers can edit employees in authorized departments

## States
- Loading: Form skeleton with loading indicators
- Editing: Real-time validation and unsaved changes warnings
- Pending Approval: Changes submitted for approval with status tracking
- Approved: Changes applied with confirmation and notifications
