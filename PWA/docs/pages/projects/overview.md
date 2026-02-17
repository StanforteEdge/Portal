# Page: Projects • Overview

- URL: `/projects/`
- Template: `templates/pages/projects/overview.php`
- Role: `project-manager`

## About
Project portfolio dashboard for project managers to view all active projects, track progress, monitor budgets, and identify issues requiring attention.

## Layout
1. Header metrics
   - Active projects count, total budget, completion percentage
   - Quick filters: status, priority, department
2. Project grid/cards
   - Card layout: project name, progress bar, budget vs spent, team size
   - Status badges, priority indicators
3. Project table (detailed view toggle)
   - Columns: Name, Status, Progress, Budget, Due Date, Team
4. Action buttons
   - Create New Project, Export Report, Bulk Actions

## Sections
- Metrics Dashboard: KPI cards with trends
- Project Cards: Visual project overview with progress indicators
- Filters: Status, priority, date range, department filters
- Project Table: Detailed tabular view with sorting
- Quick Actions: New project, reports, bulk operations

## PRD
- Goal: Provide comprehensive project portfolio management for PMs
- Success Criteria: Clear project status visibility, budget tracking, issue identification
- Constraints: Respect project access permissions, real-time data updates

## FRD
- Inputs: filters (status, priority, department, date range)
- Client Validation: Valid date ranges, authorized department access
- API Contracts:
  - GET `/wp-json/api/v1/projects?status=&priority=&department=&page=`
  - GET `/wp-json/api/v1/projects/metrics` (portfolio KPIs)
- Behavior: Auto-refresh every 5 minutes; real-time progress updates
- Permissions: View projects assigned to managed teams/departments

## States
- Loading: Skeleton cards and metrics
- Empty: "No active projects" with create project CTA
- Error: Toast with retry; fallback to cached data
- Filtered: Show filtered results with clear filter indicators
