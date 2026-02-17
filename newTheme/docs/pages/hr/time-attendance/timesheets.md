# Page: HR • Time Attendance Timesheets

- URL: `/hr/time-attendance/timesheets/`
- Template: `templates/pages/hr/time-attendance/timesheets.php`
- Role: `hr-manager`

## About
Team timesheet management interface for HR managers to review, approve, and manage employee time entries with attendance tracking and payroll integration.

## Layout
1. Timesheet dashboard
   - Team attendance overview, pending approvals, overtime tracking
   - Weekly/monthly summary statistics
2. Timesheet review table
   - Employee timesheets with hours, projects, approval status
   - Filtering by employee, period, approval status
3. Timesheet detail view
   - Individual timesheet breakdown with daily entries
   - Edit capabilities for corrections and adjustments

## Sections
- Attendance Overview: Team attendance metrics and patterns
- Timesheet Queue: Pending timesheets requiring approval
- Approval Workflow: Bulk approval tools and individual reviews
- Time Tracking: Detailed time entries with project allocation
- Reporting Tools: Attendance reports and export capabilities

## PRD
- Goal: Enable accurate time tracking and attendance management for payroll
- Success Criteria: Complete timesheet approval, accurate attendance data, compliance tracking
- Constraints: Payroll deadlines, attendance policies, approval hierarchies

## FRD
- Inputs: Timesheet approvals, time adjustments, approval notes, bulk actions
- Client Validation: Valid time entries, policy compliance, approval authorization
- API Contracts:
  - GET `/wp-json/api/v1/hr/timesheets?period=&status=&employee=` (timesheet list)
  - GET `/wp-json/api/v1/hr/timesheets/{id}` (detailed timesheet)
  - PUT `/wp-json/api/v1/hr/timesheets/{id}/approve` (approve timesheet)
  - PUT `/wp-json/api/v1/hr/timesheets/{id}/adjust` (adjust entries)
- Behavior: Bulk approval workflows, automated reminders, deadline tracking
- Permissions: HR managers can approve timesheets for authorized teams

## States
- Pending: Timesheets awaiting submission or approval
- Reviewing: Timesheet evaluation with adjustment capabilities
- Approved: Completed timesheets ready for payroll processing
- Rejected: Timesheets requiring corrections with feedback
