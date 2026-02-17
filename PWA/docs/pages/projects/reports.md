# Page: Projects • Reports

- URL: `/projects/reports/`
- Template: `templates/pages/projects/reports.php`
- Role: `project-manager`

## About
Project reporting and analytics interface for project managers to generate project reports, track project performance metrics, and provide insights for project decision making and stakeholder communication.

## Layout
1. Reports dashboard
   - Project portfolio overview, key performance indicators
   - Recent reports and scheduled report deliveries
2. Report generation tools
   - Pre-built report templates and custom report builder
   - Project selection, date ranges, metric filtering
3. Report visualization
   - Charts and graphs for project progress, budget, and timeline
   - Interactive dashboards with drill-down capabilities

## Sections
- Executive Summary: High-level project portfolio performance and metrics
- Individual Project Reports: Detailed reports for specific projects
- Portfolio Analytics: Cross-project analysis and trend identification
- Resource Utilization: Team and resource allocation reports
- Budget Performance: Project budget vs actual spending analysis

## PRD
- Goal: Provide comprehensive project insights for management and stakeholders
- Success Criteria: Clear project visibility, accurate reporting, actionable insights
- Constraints: Data accuracy, stakeholder access levels, reporting frequency

## FRD
- Inputs: Report parameters, project selection, date ranges, custom metrics
- Client Validation: Valid date ranges, authorized project access, report limits
- API Contracts:
  - GET `/wp-json/api/v1/projects/reports/portfolio?period=` (portfolio overview)
  - GET `/wp-json/api/v1/projects/{id}/reports` (individual project reports)
  - GET `/wp-json/api/v1/projects/reports/analytics` (project analytics)
  - POST `/wp-json/api/v1/projects/reports/custom` (generate custom report)
- Behavior: Cached reports for performance, scheduled report generation, stakeholder notifications
- Permissions: Project managers can generate reports for their assigned projects

## States
- Overview: Dashboard view with project metrics and recent reports
- Generating: Report creation with progress indicators and status updates
- Viewing: Report display with interactive charts and drill-down capabilities
- Distributing: Report sharing with stakeholders and delivery tracking
