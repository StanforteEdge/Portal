# Page: Projects • Time Tracking

- URL: `/projects/time-tracking/`
- Template: `templates/pages/projects/time-tracking.php`
- Role: `staff`

## About
Personal time tracking interface for staff to log time against project tasks, view time summaries, and manage work hours. Integrates with project management and payroll systems.

## Layout
1. Time tracking dashboard
   - Today's logged time, weekly total, project breakdown
   - Active timer for current task with quick start/stop
2. Time entry form
   - Project/task selection, date/time inputs
   - Description field, billable/non-billable toggle
3. Time log table
   - Columns: Date, Project, Task, Hours, Status, Actions
   - Weekly/monthly views with totals
4. Reports and exports
   - Time summaries, project breakdowns, export options

## Sections
- Active Timer: Quick time tracking for current work
- Manual Entry: Detailed time logging with project association
- Time Log: Chronological view of all time entries
- Weekly Summary: Aggregated time by project and task
- Approval Status: Time entry approval workflow integration

## PRD
- Goal: Enable accurate time tracking for project billing and productivity
- Success Criteria: Easy time logging, clear reporting, approval integration
- Constraints: Accurate time recording, project associations, approval workflows

## FRD
- Inputs: Time entries, project/task selection, descriptions
- Client Validation: Valid time ranges, required project association, reasonable hours
- API Contracts:
  - GET `/wp-json/api/v1/projects/my-time-entries?week=&month=` (time logs)
  - POST `/wp-json/api/v1/projects/time-entries` (log time)
  - PUT `/wp-json/api/v1/projects/time-entries/{id}` (edit entry)
  - GET `/wp-json/api/v1/projects/tasks` (available tasks)
- Behavior: Auto-save entries, timer persistence, approval notifications
- Permissions: Users can only log time on assigned projects/tasks

## States
- Tracking: Active timer with running time display
- Logging: Manual time entry with validation
- Reviewing: Time log review with editing capabilities
- Approving: Time approval workflow with status indicators
