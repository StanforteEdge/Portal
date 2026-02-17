# Page: Reports • Projects

- URL: `/reports/projects/`
- Template: `templates/pages/reports/projects.php`
- Roles: `project-manager`, `admin`, `ed`, `coo`

## About
Project portfolio reporting and analytics interface for project stakeholders to generate project reports, track portfolio performance, and provide insights for project management and strategic decision making.

## Layout
1. Project portfolio dashboard
   - Project portfolio overview, completion rates, budget performance
   - Key project metrics and milestone achievements
2. Report generation tools
   - Pre-built project report templates and custom report builder
   - Project filters, date ranges, status selections
3. Project visualizations
   - Gantt charts, burndown charts, resource utilization graphs
   - Interactive dashboards with project drill-down capabilities

## Sections
- Portfolio Overview: High-level project portfolio performance and metrics
- Individual Project Reports: Detailed reports for specific projects
- Resource Analytics: Team utilization and resource allocation reports
- Budget Performance: Project budget vs actual spending analysis
- Timeline Analysis: Project schedules, delays, and critical path tracking

## PRD
- Goal: Provide comprehensive project insights for portfolio management
- Success Criteria: Clear project visibility, accurate reporting, actionable insights
- Constraints: Project access permissions, data accuracy, stakeholder requirements

## FRD
- Inputs: Report parameters, project selection, date ranges, metric filters
- Client Validation: Valid project access, authorized data ranges, report limits
- API Contracts:
  - GET `/wp-json/api/v1/reports/projects/portfolio?period=` (portfolio overview)
  - GET `/wp-json/api/v1/reports/projects/{id}` (individual project reports)
  - GET `/wp-json/api/v1/reports/projects/resources` (resource analytics)
  - POST `/wp-json/api/v1/reports/projects/custom` (generate custom report)
- Behavior: Cached reports for performance, automated stakeholder notifications
- Permissions: Project managers and executives can access project reports

## States
- Overview: Portfolio dashboard with project metrics and recent reports
- Generating: Report creation with progress indicators and validation
- Viewing: Report display with interactive charts and detailed breakdowns
- Distributing: Report sharing with stakeholders and delivery tracking
