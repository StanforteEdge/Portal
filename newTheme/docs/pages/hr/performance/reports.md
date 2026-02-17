# Page: HR • Performance Reports

- URL: `/hr/performance/reports/`
- Template: `templates/pages/hr/performance/reports.php`
- Role: `hr-manager`

## About
Performance analytics and reporting interface for HR managers to generate insights on employee performance, review completion rates, development progress, and organizational performance trends.

## Layout
1. Reports dashboard
   - Key performance indicators and trends
   - Report generation tools and saved reports
2. Performance metrics grid
   - Review completion rates, average ratings, goal achievement
   - Department and team comparisons
3. Custom report builder
   - Drag-and-drop metric selection and filtering
   - Date ranges, employee segments, performance criteria

## Sections
- Executive Summary: High-level performance metrics and trends
- Review Analytics: Review completion, rating distributions, feedback themes
- Development Tracking: Training completion, skill development progress
- Comparative Analysis: Department/team performance comparisons
- Custom Reports: User-defined performance reports and dashboards

## PRD
- Goal: Provide comprehensive performance insights for HR decision making
- Success Criteria: Clear performance visibility, actionable insights, trend analysis
- Constraints: Employee privacy, aggregated data, compliance requirements

## FRD
- Inputs: Report parameters, date ranges, filters, custom metrics
- Client Validation: Valid date ranges, authorized data access, privacy compliance
- API Contracts:
  - GET `/wp-json/api/v1/hr/reports/performance?period=&department=` (performance data)
  - GET `/wp-json/api/v1/hr/reports/reviews?period=` (review analytics)
  - GET `/wp-json/api/v1/hr/reports/development` (development metrics)
  - POST `/wp-json/api/v1/reports/custom` (generate custom report)
- Behavior: Cached reports for performance, real-time filtering, export capabilities
- Permissions: HR managers can access performance data for authorized teams

## States
- Overview: Dashboard view with key metrics and recent reports
- Generating: Report creation with progress indicators
- Viewing: Report display with filtering and drill-down
- Exporting: Data export with format selection and scheduling
