# Page: Finance • Expense Approvals

- URL: `/finance/expenses/`
- Template: `templates/pages/finance/expenses/approvals.php`
- Role: `accountant`

## About
Expense approval interface for accountants to review, approve, or reject submitted expense reports. Shows expense details, receipts, and provides approval workflow management.

## Layout
1. Header dashboard
   - Pending approvals count + quick stats
   - Filters: status (pending/approved/rejected), date range, amount range
2. Expense list table
   - Columns: Employee, Amount, Category, Date, Status, Actions
   - Expandable rows for full expense details
3. Expense detail panel (right sidebar)
   - Expense breakdown, receipts, approval history
   - Approve/Reject buttons with notes field

## Sections
- Stats Cards: Pending count, approved this week, rejected this week, total value
- Filters: Date range, status, category, amount filters
- Expense Table: Sortable list with status badges
- Detail Panel: Full expense view with receipt images
- Approval Form: Notes textarea + approve/reject buttons

## PRD
- Goal: Streamline expense approval process for financial control
- Success Criteria: Clear expense visibility, fast approval workflow, audit trail
- Constraints: Must maintain financial compliance and approval limits

## FRD
- Inputs: approval decision (approve/reject), approval notes (optional)
- Client Validation: Notes required for rejections
- API Contracts:
  - GET `/wp-json/api/v1/finance/expenses?status=pending&limit=50`
  - PUT `/wp-json/api/v1/finance/expenses/{id}/approve`
  - PUT `/wp-json/api/v1/finance/expenses/{id}/reject`
- Behavior: Bulk approve for similar expenses; optimistic updates
- Permissions: Full expense approval authority for accountants

## States
- Loading: Skeleton cards and table
- Empty: "No pending approvals" message
- Processing: Disable buttons during API calls
- Error: Toast on approval failure with retry
