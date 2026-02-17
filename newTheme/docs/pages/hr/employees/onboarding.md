# Page: HR • Employee Onboarding

- URL: `/hr/employees/onboarding/`
- Template: `templates/pages/hr/employees/onboarding.php`
- Role: `hr-manager`

## About
Employee onboarding workflow management interface for HR managers to track new hire progress, assign tasks, and monitor completion of onboarding requirements across departments.

## Layout
1. Onboarding dashboard
   - New hires overview, completion status, overdue tasks
   - Department-wise onboarding progress
2. Employee onboarding timeline
   - Personalized onboarding checklist with due dates
   - Task assignment and progress tracking
3. Onboarding templates
   - Standardized checklists by role and department
   - Custom task creation and assignment

## Sections
- Dashboard Overview: New hire pipeline and completion metrics
- Employee Timeline: Individual onboarding progress with milestones
- Task Management: Assign, track, and complete onboarding tasks
- Template Library: Standardized onboarding workflows
- Communication Hub: Automated notifications and reminders

## PRD
- Goal: Ensure smooth new employee integration with structured onboarding
- Success Criteria: Complete onboarding tracking, task automation, progress visibility
- Constraints: Timeline adherence, task dependencies, compliance requirements

## FRD
- Inputs: Onboarding tasks, due dates, assignments, completion status
- Client Validation: Valid dates, required tasks, dependency logic
- API Contracts:
  - GET `/wp-json/api/v1/hr/onboarding/employees?status=` (onboarding list)
  - GET `/wp-json/api/v1/hr/onboarding/tasks/{employee_id}` (employee tasks)
  - PUT `/wp-json/api/v1/hr/onboarding/tasks/{id}` (update task status)
  - POST `/wp-json/api/v1/hr/onboarding/tasks` (assign new tasks)
- Behavior: Automated reminders, progress notifications, dependency enforcement
- Permissions: HR managers can manage onboarding for authorized departments

## States
- Planning: Task assignment and timeline setup
- Active: Ongoing onboarding with progress tracking
- Overdue: Highlighted overdue tasks with escalation options
- Complete: Finished onboarding with feedback collection
