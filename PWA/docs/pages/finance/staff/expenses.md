# Page: Staff • My Expenses

- URL: `/my-expenses/`
- Template: `templates/pages/finance/staff/expenses.php`
- Role: `staff`

## About
Personal expense management interface for staff to submit expense reports, track reimbursement status, and manage receipts. Integrates with financial approval workflows.

## Layout
1. Header section
   - Title + current month expense total
   - Quick action: Submit New Expense
2. Expense tabs
   - Pending, Approved, Rejected, All
3. Expense list table
   - Columns: Date, Amount, Category, Status, Actions
4. Expense form modal
   - Category, amount, date, description, receipt upload

## Sections
- Header: Stats (pending amount, approved this month, etc.)
- Tabs: Status-based filtering
- Table: Expense list with status badges and actions
- Form Modal: Multi-step expense submission with file upload
- Receipt Viewer: Image preview for attached receipts

## PRD
- Goal: Enable staff to manage business expenses efficiently
- Success Criteria: Easy submission, clear status tracking, receipt management
- Constraints: Expense policy limits, required receipts, approval routing

## FRD
- Inputs: category, amount, date, description, receipt files
- Client Validation: Required fields, amount limits, file type/size
- API Contracts:
  - GET `/wp-json/api/v1/finance/my-expenses?status=&page=`
  - POST `/wp-json/api/v1/finance/expenses` (multipart for receipts)
  - GET `/wp-json/api/v1/finance/expense-categories`
- Behavior: File upload progress, form validation feedback
- Permissions: Submit own expenses, view own reimbursement status

## States
- Loading: Skeleton table and stats
- Form: Multi-step wizard for complex expenses
- Uploading: Progress indicators for receipt uploads
- Error: Inline validation + toast messages
