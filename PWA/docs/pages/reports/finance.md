# Page: Reports • Finance

- URL: `/reports/finance/`
- Template: `templates/pages/reports/finance.php`
- Roles: `accountant`, `admin`, `ed`, `coo`

## About
Financial reporting and analytics interface for finance professionals to generate comprehensive financial reports, analyze financial performance, and provide insights for financial decision making.

## Layout
1. Financial reports dashboard
   - Key financial metrics, profit & loss summary, balance sheet overview
   - Budget vs actual comparisons and variance analysis
2. Report generation tools
   - Pre-built financial report templates and custom report builder
   - Date ranges, account filters, consolidation options
3. Financial visualizations
   - Charts and graphs for revenue trends, expense analysis, cash flow
   - Interactive dashboards with drill-down to transaction details

## Sections
- Executive Summary: High-level financial performance and key metrics
- Income Statement: Revenue, expenses, and profitability analysis
- Balance Sheet: Assets, liabilities, and equity position
- Cash Flow: Operating, investing, and financing cash flow analysis
- Budget Analysis: Budget vs actual performance and variance reporting

## PRD
- Goal: Provide comprehensive financial insights for management and stakeholders
- Success Criteria: Accurate financial reporting, clear visualizations, compliance adherence
- Constraints: Financial regulations, data accuracy, audit requirements

## FRD
- Inputs: Report parameters, date ranges, account selections, consolidation options
- Client Validation: Valid accounting periods, authorized data access, compliance checks
- API Contracts:
  - GET `/wp-json/api/v1/reports/finance/summary?period=` (financial summary)
  - GET `/wp-json/api/v1/reports/finance/pnl?period=` (profit & loss)
  - GET `/wp-json/api/v1/reports/finance/balance-sheet?period=` (balance sheet)
  - POST `/wp-json/api/v1/reports/finance/custom` (generate custom report)
- Behavior: Automated report generation, data validation, compliance watermarking
- Permissions: Finance professionals and executives can access financial reports

## States
- Overview: Financial dashboard with key metrics and recent reports
- Generating: Report creation with progress indicators and validation
- Viewing: Report display with interactive charts and detailed breakdowns
- Exporting: Financial report export with proper formatting and compliance
