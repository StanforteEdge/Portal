# Page: Finance • Staff Reimbursements

- URL: `/finance/staff/reimbursements/`
- Template: `templates/pages/finance/staff/reimbursements.php`
- Role: `staff`

## About
Personal reimbursement tracking interface for staff to view approved reimbursements, track payment status, and manage receipt submissions for business expenses.

## Layout
1. Reimbursements dashboard
   - Pending reimbursements, total owed, payment history
   - Monthly reimbursement summary and trends
2. Reimbursements table
   - Expense reports, amounts, approval dates, payment status
   - Filtering by status, date range, amount
3. Payment details
   - Payment method information, direct deposit confirmations
   - Tax implications and year-end summaries

## Sections
- Pending Claims: Reimbursements awaiting payment processing
- Payment History: Completed reimbursements with payment confirmations
- Tax Information: Taxable reimbursement tracking and reporting
- Receipt Management: Receipt storage and submission for claims
- Reporting: Reimbursement summaries and expense categorization

## PRD
- Goal: Provide transparent reimbursement tracking and payment visibility
- Success Criteria: Clear payment status, timely reimbursements, accurate records
- Constraints: Expense policies, reimbursement limits, tax compliance

## FRD
- Inputs: Receipt uploads, expense categorizations, payment preferences
- Client Validation: Valid receipt formats, policy compliance, amount limits
- API Contracts:
  - GET `/wp-json/api/v1/finance/my-reimbursements?status=&page=` (reimbursement list)
  - GET `/wp-json/api/v1/finance/reimbursements/{id}` (reimbursement details)
  - POST `/wp-json/api/v1/finance/reimbursements/{id}/receipt` (upload receipt)
  - GET `/wp-json/api/v1/finance/reimbursements/tax-summary` (tax information)
- Behavior: Automated payment notifications, receipt validation, tax calculations
- Permissions: Users can only access their own reimbursement data

## States
- Pending: Reimbursements approved but not yet paid
- Processing: Payments in progress with status updates
- Paid: Completed reimbursements with payment confirmations
- Rejected: Denied reimbursements with explanation and appeal options
