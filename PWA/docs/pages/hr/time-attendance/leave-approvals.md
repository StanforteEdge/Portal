# Page: HR • Time Attendance Leave Approvals

- URL: `/hr/time-attendance/leave-approvals/`
- Template: `templates/pages/hr/time-attendance/leave-approvals.php`
- Role: `hr-manager`

## About
Leave request approval interface for HR managers to review, approve, or deny employee leave requests with calendar integration and leave balance tracking.

## Layout
1. Leave dashboard
   - Pending approvals count, upcoming leave, department coverage
   - Leave calendar with team availability
2. Leave requests table
   - Employee requests with dates, type, reason, approval status
   - Filtering by status, type, department, date range
3. Leave detail panel
   - Request details, employee leave balance, approval workflow
   - Calendar conflict checking and coverage assessment

## Sections
- Approval Queue: Incoming leave requests requiring decision
- Leave Calendar: Team leave calendar with coverage indicators
- Balance Tracking: Employee leave balances and usage history
- Approval Workflow: Decision tools with approval hierarchy
- Reporting: Leave trends and approval analytics

## PRD
- Goal: Manage leave requests efficiently with proper approvals and coverage
- Success Criteria: Timely approvals, clear communication, coverage planning
- Constraints: Leave policies, approval hierarchies, business continuity

## FRD
- Inputs: Approval decisions, approval notes, alternative coverage suggestions
- Client Validation: Required justifications for denials, valid approval routing
- API Contracts:
  - GET `/wp-json/api/v1/hr/leave-requests?status=&department=` (leave requests)
  - PUT `/wp-json/api/v1/hr/leave-requests/{id}/approve` (approve request)
  - PUT `/wp-json/api/v1/hr/leave-requests/{id}/deny` (deny request)
  - GET `/wp-json/api/v1/hr/leave-balances/{employee_id}` (leave balances)
- Behavior: Automated notifications, calendar conflict detection, approval routing
- Permissions: HR managers can approve leave for authorized teams

## States
- Pending: Leave requests awaiting review and approval
- Approved: Confirmed leave with calendar updates and notifications
- Denied: Rejected requests with feedback and appeal options
- Scheduled: Approved leave integrated with team calendar
