# Page: Projects • My Tasks

- URL: `/projects/tasks/`
- Template: `templates/pages/projects/tasks.php`
- Role: `staff`

## About
Personal task management interface for staff to view assigned tasks, track progress, update status, and log time. Provides individual productivity tracking and project contribution visibility.

## Layout
1. Task dashboard
   - Today's tasks, overdue items, completion status
   - Priority indicators and due date warnings
2. Task list with filters
   - Tabs: Today, This Week, Overdue, Completed
   - Sortable by priority, due date, project
3. Task detail modal
   - Task description, subtasks, time tracking
   - Status updates, comments, file attachments

## Sections
- Quick Stats: Tasks completed today, hours logged, upcoming deadlines
- Task Filters: Priority, status, project, date range filtering
- Task Cards/List: Visual task overview with progress indicators
- Time Tracking: Built-in timer and manual time entry
- Task Details: Full task information with collaboration features

## PRD
- Goal: Enable efficient personal task management for staff
- Success Criteria: Clear task visibility, easy status updates, accurate time tracking
- Constraints: Respect project permissions, maintain task integrity

## FRD
- Inputs: Task status updates, time entries, comments, file uploads
- Client Validation: Required time entries, valid status transitions
- API Contracts:
  - GET `/wp-json/api/v1/projects/my-tasks?status=&priority=&page=`
  - PUT `/wp-json/api/v1/projects/tasks/{id}/status` (update status)
  - POST `/wp-json/api/v1/projects/tasks/{id}/time` (log time)
  - GET `/wp-json/api/v1/projects/tasks/{id}` (task details)
- Behavior: Real-time updates, optimistic UI, auto-save drafts
- Permissions: Users can only access tasks assigned to them

## States
- Loading: Skeleton task cards and stats
- Active Timer: Visual timer for current task tracking
- Overdue: Highlight overdue tasks with alerts
- Completed: Archive view with productivity metrics
