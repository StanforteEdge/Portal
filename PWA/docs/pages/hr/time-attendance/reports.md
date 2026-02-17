# Page: HR • Time Attendance Reports

- URL: `/hr/time-attendance/reports/`
- Template: `templates/pages/hr/time-attendance/reports.php`
- Role: `hr-manager`

## About
Time and attendance analytics interface for HR managers to generate reports on employee attendance patterns, leave utilization, overtime trends, and compliance metrics.

## Layout
1. Reports dashboard
   - Key attendance metrics, leave utilization rates
   - Compliance indicators and policy adherence
2. Report builder interface
   - Pre-built report templates and custom report creation
   - Date ranges, employee filters, metric selection
3. Report visualization
   - Charts and graphs for attendance trends and patterns
   - Interactive dashboards with drill-down capabilities

## Sections
- Executive Summary: High-level attendance and leave metrics
- Attendance Analytics: Patterns, trends, and compliance tracking
- Leave Utilization: Leave balances, utilization rates, forecasting
- Overtime Tracking: Overtime hours, costs, and distribution
- Custom Reports: User-defined attendance and leave reports

## PRD
- Goal: Provide comprehensive attendance insights for HR management
- Success Criteria: Clear attendance visibility, trend analysis, compliance reporting
- Constraints: Employee privacy, aggregated data, regulatory compliance

## FRD
- Inputs: Report parameters, date ranges, employee filters, custom metrics
- Client Validation: Valid date ranges, authorized data access, privacy compliance
- API Contracts:
  - GET `/wp-json/api/v1/hr/reports/attendance?period=&department=` (attendance data)
  - GET `/wp-json/api/v1/hr/reports/leave?period=` (leave analytics)
  - GET `/wp-json/api/v1/hr/reports/overtime` (overtime metrics)
  - POST `/wp-json/api/v1/reports/time-attendance/custom` (generate custom report)
- Behavior: Cached reports for performance, real-time filtering, export capabilities
- Permissions: HR managers can access attendance data for authorized teams

## States
- Overview: Dashboard view with key metrics and recent reports
- Generating: Report creation with progress indicators
- Viewing: Report display with filtering and drill-down
- Exporting: Data export with format selection and scheduling
