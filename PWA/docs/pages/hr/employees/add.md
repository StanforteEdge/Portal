# Page: HR • Add Employee

- URL: `/hr/employees/add/`
- Template: `templates/pages/hr/employees/add.php`
- Role: `hr-manager`

## About
Employee onboarding form for HR managers to create new employee records with complete profile information, job details, and initial account setup.

## Layout
1. Multi-step form wizard
   - Step 1: Personal Information
   - Step 2: Employment Details
   - Step 3: Compensation & Benefits
   - Step 4: Account Setup & Review
2. Progress indicator
   - Visual progress bar showing completion status
3. Form validation
   - Real-time validation with error messages

## Sections
- Personal Info: Name, contact details, emergency contacts, address
- Employment Details: Job title, department, manager, start date, employment type
- Compensation: Salary, benefits enrollment, tax information
- Account Setup: Email, temporary password, role assignment, system access
- Review & Submit: Complete profile review before creation

## PRD
- Goal: Streamline new employee onboarding process
- Success Criteria: Complete profile creation, automatic account setup, email notifications
- Constraints: Required compliance fields, data validation, audit logging

## FRD
- Inputs: Comprehensive employee data (personal, employment, compensation)
- Client Validation: Required fields, email format, date validation, unique identifiers
- API Contracts:
  - POST `/wp-json/api/v1/hr/employees` (create employee)
  - GET `/wp-json/api/v1/hr/departments` (department options)
  - GET `/wp-json/api/v1/admin/roles` (available roles)
- Behavior: Auto-save drafts, prevent navigation with unsaved changes
- Permissions: HR managers can create employees in their authorized departments

## States
- Form Steps: Navigate between wizard steps with validation
- Saving: Progress indicator during API submission
- Success: Confirmation with employee details and next steps
- Error: Field-level validation, API error handling
