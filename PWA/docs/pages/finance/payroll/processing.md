# Page: Finance • Payroll Processing

- URL: `/finance/payroll/processing/`
- Template: `templates/pages/finance/payroll/processing.php`
- Role: `accountant`

## About
Payroll processing interface for accountants to manage salary calculations, deductions, benefits administration, and payroll execution. Provides batch processing capabilities with approval workflows.

## Layout
1. Processing dashboard
   - Current pay period, processing status, total payroll amount
   - Quick stats: employees processed, pending approvals, errors
2. Employee payroll table
   - Columns: Employee, Base Salary, Overtime, Deductions, Net Pay, Status
   - Batch operations: calculate, approve, process payments
3. Payroll configuration
   - Tax rates, benefit deductions, payment methods
   - Bulk adjustment tools for special cases

## Sections
- Period Selection: Choose pay period with validation
- Employee List: Payroll calculations with individual adjustments
- Batch Controls: Calculate all, approve batch, process payments
- Tax Calculations: Automatic tax withholding and reporting
- Payment Methods: Direct deposit, check, wire transfer options

## PRD
- Goal: Enable accurate, compliant payroll processing for accountants
- Success Criteria: Error-free calculations, timely processing, audit compliance
- Constraints: Tax law compliance, payment deadlines, financial accuracy

## FRD
- Inputs: Pay period selection, employee adjustments, approval confirmations
- Client Validation: Valid pay periods, authorized adjustments, approval requirements
- API Contracts:
  - GET `/wp-json/api/v1/finance/payroll/periods` (available periods)
  - POST `/wp-json/api/v1/finance/payroll/calculate` (batch calculation)
  - PUT `/wp-json/api/v1/finance/payroll/approve` (batch approval)
  - POST `/wp-json/api/v1/finance/payroll/process` (execute payments)
- Behavior: Calculation previews, approval workflows, payment confirmations
- Permissions: Accountants can process payroll for authorized departments

## States
- Setup: Period selection and configuration
- Calculating: Progress indicators for batch calculations
- Review: Display calculated amounts with adjustment options
- Approved: Ready for payment processing
- Processing: Payment execution with transaction tracking
