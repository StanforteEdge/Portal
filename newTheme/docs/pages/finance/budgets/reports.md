# Page: Finance • Budget Reports

- URL: `/finance/budgets/reports/`
- Template: `templates/pages/finance/budgets/reports.php`
- Role: `accountant`

## About
Budget reporting and analytics interface for accountants to generate comprehensive budget reports, analyze spending patterns, and provide financial insights for decision making.

## Layout
1. Reports dashboard
   - Budget utilization summaries, variance reports, trend analysis
   - Key financial metrics and budget health indicators
2. Report generation tools
   - Pre-built budget report templates and custom report builder
   - Date ranges, department filters, budget category selection
3. Budget visualizations
   - Charts and graphs showing budget vs actual spending
   - Trend analysis and forecasting visualizations

## Sections
- Executive Summary: High-level budget performance and key metrics
- Department Reports: Individual department budget analysis and comparisons
- Category Analysis: Budget performance by spending categories and cost centers
- Variance Reports: Budget variances with explanations and impact analysis
- Forecasting: Budget completion projections and recommendation reports

## PRD
- Goal: Provide comprehensive budget insights for financial decision making
- Success Criteria: Clear budget visibility, accurate reporting, actionable insights
- Constraints: Financial data accuracy, compliance requirements, timely reporting

## FRD
- Inputs: Report parameters, date ranges, department filters, custom metrics
- Client Validation: Valid date ranges, authorized data access, report limits
- API Contracts:
  - GET `/wp-json/api/v1/finance/budgets/reports/summary?period=` (budget summaries)
  - GET `/wp-json/api/v1/finance/budgets/reports/department?dept=` (department reports)
  - GET `/wp-json/api/v1/finance/budgets/reports/variances` (variance analysis)
  - POST `/wp-json/api/v1/finance/budgets/reports/custom` (generate custom report)
- Behavior: Cached reports for performance, scheduled report generation, export capabilities
- Permissions: Accountants can generate budget reports for authorized departments

## States
- Overview: Dashboard view with budget metrics and recent reports
- Generating: Report creation with progress indicators and status updates
- Viewing: Report display with interactive charts and drill-down capabilities
- Exporting: Data export with multiple formats and scheduling options
