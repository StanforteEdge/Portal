# Page: HR • Performance Goals

- URL: `/hr/performance/goals/`
- Template: `templates/pages/hr/performance/goals.php`
- Role: `hr-manager`

## About
Employee goal setting and tracking interface for HR managers to establish performance objectives, monitor progress, and align individual goals with organizational objectives.

## Layout
1. Goals dashboard
   - Team goal completion overview, progress metrics
   - Goal alignment with organizational objectives
2. Employee goals matrix
   - Individual employee goals with progress tracking
   - Goal categories: individual, team, organizational
3. Goal creation wizard
   - SMART goal framework with measurement criteria
   - Timeline setting and milestone definition

## Sections
- Goals Overview: Team and individual goal progress summaries
- Goal Matrix: Visual goal tracking with progress indicators
- Goal Templates: Standardized goal frameworks by role/department
- Progress Tracking: Milestone updates and achievement monitoring
- Alignment Dashboard: Goal alignment with company objectives

## PRD
- Goal: Enable structured goal setting and performance tracking
- Success Criteria: Clear goal definition, progress visibility, objective alignment
- Constraints: SMART goal framework, measurable outcomes, regular reviews

## FRD
- Inputs: Goal definitions, measurement criteria, timelines, progress updates
- Client Validation: SMART criteria validation, timeline logic, measurement specificity
- API Contracts:
  - GET `/wp-json/api/v1/hr/goals?employee_id=&status=` (employee goals)
  - POST `/wp-json/api/v1/hr/goals` (create goal)
  - PUT `/wp-json/api/v1/hr/goals/{id}` (update progress)
  - GET `/wp-json/api/v1/hr/goals/templates` (goal templates)
- Behavior: Progress notifications, review reminders, achievement celebrations
- Permissions: HR managers can manage goals for team members

## States
- Setting: Goal creation and objective definition
- Tracking: Ongoing progress monitoring and updates
- Reviewing: Periodic goal reviews and adjustments
- Complete: Goal achievement with feedback and new goal setting
