# Page: Staff • My Payslips

- URL: `/my-payslips/`
- Template: `templates/pages/finance/staff/payslips.php`
- Role: `staff`

## About
Personal payroll history interface for staff to view past payslips, download PDF copies, and track compensation details. Provides secure access to salary information with download capabilities.

## Layout
1. Payslip history table
   - Columns: Pay Period, Gross Pay, Net Pay, Status, Actions
   - Sortable by date, searchable by period
2. Payslip detail view
   - Full breakdown: earnings, deductions, taxes, benefits
   - PDF download and email options
3. Year selector
   - Filter payslips by year with summary statistics

## Sections
- Year Summary: Annual totals and averages
- Payslip List: Chronological list with status indicators
- Detail Modal: Complete payslip breakdown with explanations
- Download Options: PDF generation and secure sharing

## PRD
- Goal: Provide transparent access to payroll information for staff
- Success Criteria: Clear payslip visibility, easy PDF downloads, data security
- Constraints: Financial data privacy, regulatory compliance, audit trails

## FRD
- Inputs: Year filter, search queries, download requests
- Client Validation: Valid year selection, authorized access only
- API Contracts:
  - GET `/wp-json/api/v1/finance/my-payslips?year=&page=` (payslip list)
  - GET `/wp-json/api/v1/finance/payslips/{id}` (detailed payslip)
  - GET `/wp-json/api/v1/finance/payslips/{id}/pdf` (PDF download)
- Behavior: Lazy loading for performance, secure PDF generation
- Permissions: Users can only access their own payslip data

## States
- Loading: Skeleton table with loading indicators
- Empty: No payslips message with contact information
- Viewing: Detail modal with full payslip information
- Downloading: Progress indicators for PDF generation
