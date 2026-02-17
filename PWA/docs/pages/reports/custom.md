# Page: Reports • Custom

- URL: `/reports/custom/`
- Template: `templates/pages/reports/custom.php`
- Roles: `hr-manager`, `accountant`, `project-manager`, `admin`

## About
Custom report builder interface for authorized users to create tailored reports by combining data from multiple business modules, applying custom filters, and designing personalized analytics dashboards.

## Layout
1. Report builder interface
   - Drag-and-drop data source selection and metric configuration
   - Visual query builder with filter and grouping options
2. Custom report dashboard
   - Saved custom reports, recent reports, report templates
   - Report scheduling and automated delivery options
3. Visualization designer
   - Chart type selection, data mapping, and customization options
   - Interactive preview and real-time data updates

## Sections
- Report Builder: Visual interface for creating custom report queries
- Data Sources: Selection of business modules and data entities
- Filter & Grouping: Advanced filtering and data aggregation tools
- Visualization: Chart and graph customization for report presentation
- Report Management: Saved reports, templates, and scheduling options

## PRD
- Goal: Enable flexible custom reporting across business domains
- Success Criteria: User-friendly report creation, accurate data aggregation, actionable insights
- Constraints: Data access permissions, performance limitations, security controls

## FRD
- Inputs: Data source selections, filter criteria, grouping options, visualization settings
- Client Validation: Valid data combinations, authorized access, query complexity limits
- API Contracts:
  - GET `/wp-json/api/v1/reports/custom/builder` (report builder interface)
  - POST `/wp-json/api/v1/reports/custom` (create custom report)
  - GET `/wp-json/api/v1/reports/custom/saved` (saved reports list)
  - PUT `/wp-json/api/v1/reports/custom/{id}/schedule` (schedule report)
- Behavior: Query validation, performance monitoring, automated report generation
- Permissions: Role-based access to data sources and report creation capabilities

## States
- Building: Report creation with data source selection and configuration
- Previewing: Report preview with sample data and visualization options
- Saving: Report saving with naming and access permission settings
- Running: Report execution with progress tracking and result display
