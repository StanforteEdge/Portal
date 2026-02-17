# Page: Reports • Executive Dashboard

- URL: `/reports/executive/`
- Template: `templates/pages/reports/executive.php`
- Roles: `board-member`, `ed`, `coo`, `admin`

## About
Executive-level dashboard providing high-level KPIs, strategic metrics, and business intelligence for senior leadership decision-making. Aggregates data from all business units with drill-down capabilities.

## Layout
1. Executive summary cards
   - Revenue, profit, headcount, project completion rates
   - Year-over-year growth indicators
2. Strategic KPIs section
   - Balanced scorecard metrics, goal progress
   - Risk indicators, compliance status
3. Department performance grid
   - HR, Finance, Projects, Operations metrics
   - Trend charts and performance ratings
4. Interactive charts (drill-down)
   - Financial trends, headcount analytics, project portfolio

## Sections
- Executive Summary: Key business metrics and KPIs
- Strategic Objectives: Goal tracking and milestone progress
- Department Dashboards: Individual business unit performance
- Risk & Compliance: Key risk indicators and compliance status
- Interactive Analytics: Charts with drill-down to detailed reports

## PRD
- Goal: Provide executive visibility into organizational performance
- Success Criteria: Clear KPIs, actionable insights, fast loading
- Constraints: Data privacy, executive-level aggregations only

## FRD
- Inputs: date range filters, department selection, metric categories
- Client Validation: Valid date ranges, authorized executive access
- API Contracts:
  - GET `/wp-json/api/v1/reports/executive/dashboard?period=&department=`
  - GET `/wp-json/api/v1/reports/executive/kpis` (strategic KPIs)
  - GET `/wp-json/api/v1/reports/executive/drilldown/{metric}` (detailed data)
- Behavior: Auto-refresh every 15 minutes; cached for performance
- Permissions: Executive-level access only (Board, ED, COO, Admin)

## States
- Loading: Skeleton cards and charts
- Filtered: Show filtered data with date range indicators
- Drill-down: Modal/detail view for specific metrics
- Error: Fallback to summary view with error toast
