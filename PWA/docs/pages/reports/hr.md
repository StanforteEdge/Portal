# Page: Reports • HR Analytics

- URL: `/reports/hr/`
- Template: `templates/pages/reports/hr.php`
- Roles: `hr-manager`, `admin`, `ed`, `coo`

## About
HR analytics dashboard providing insights into workforce metrics, recruitment analytics, performance trends, and organizational health indicators. Enables data-driven HR decision making.

## Layout
1. Executive summary cards
   - Headcount, turnover rate, average tenure, diversity metrics
   - Key KPIs with period-over-period changes
2. Workforce analytics charts
   - Department distribution, role composition, location breakdown
   - Age/gender diversity, promotion rates, training completion
3. Recruitment funnel
   - Application volume, conversion rates, time-to-hire, offer acceptance
4. Performance metrics
   - Review completion rates, average ratings, development progress

## Sections
- Executive Summary: High-level HR KPIs and trends
- Workforce Demographics: Employee composition and diversity analytics
- Recruitment Analytics: Hiring funnel and sourcing effectiveness
- Performance Insights: Review trends and development metrics
- Retention Analytics: Turnover analysis and engagement indicators

## PRD
- Goal: Provide actionable HR insights for strategic decision making
- Success Criteria: Clear visualizations, accurate data, actionable insights
- Constraints: Employee privacy protection, data aggregation requirements

## FRD
- Inputs: Date range filters, department selections, metric categories
- Client Validation: Valid date ranges, authorized department access
- API Contracts:
  - GET `/wp-json/api/v1/reports/hr/dashboard?period=&department=`
  - GET `/wp-json/api/v1/reports/hr/workforce-metrics` (demographics data)
  - GET `/wp-json/api/v1/reports/hr/recruitment-analytics` (hiring data)
  - GET `/wp-json/api/v1/reports/hr/performance-trends` (review data)
- Behavior: Auto-refresh data, drill-down capabilities, export options
- Permissions: HR managers see team data, executives see organization-wide data

## States
- Loading: Skeleton charts and metric cards
- Filtered: Show filtered data with clear filter indicators
- Drill-down: Detailed views for specific metrics or departments
- Export: Data export options with progress indicators
