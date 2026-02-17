# Page: Staff • My Approvals

- URL: `/my-approvals/`
- Template: `templates/pages/user/staff/workflow/approvals.php`
- Role: `staff`

## About
Personal approval dashboard for staff with approval permissions. View and act on pending requests (leave, expenses, etc.) assigned to them. Integrates with Core/Workflow module.

## Layout
1. Header card
   - Title: My Approvals
   - Subtitle: items pending your approval
   - Filters: type (all, leave, expenses), status (pending, approved, denied)
2. Stats row (3 cards)
   - Pending, Approved Today, Denied Today
3. Approvals table
   - Columns: Requestor, Type, Details, Submitted, Actions (Approve/Deny)
4. Approval modal
   - Request details, Approve/Deny buttons, optional notes

## Sections
- Filters: type and status dropdowns
- Table: sortable by date; bulk actions for same type
- Modal: read-only request details + approval form (notes field)

## PRD
- Goal: Streamline approval workflows for staff approvers
- Success Criteria: Clear request visibility; one-click approvals; audit trail maintained
- Constraints: Permissions checked per request type; cannot approve own requests

## FRD
- Inputs (Approval):
  - action (approve/deny)
  - notes (string, optional, 255 max)
- API Contracts:
  - GET `/wp-json/api/v1/workflow/approvals?scope=my-pending`
  - PUT `/wp-json/api/v1/workflow/approvals/{id}`
- Behavior: Bulk approve via checkbox select; modal for individual; refresh on action

## States
- Empty: "No items pending approval"
- Loading: skeleton table
- Error: toast on approval failure
