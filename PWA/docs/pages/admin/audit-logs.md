# Page: Admin • Audit Logs

- URL: `/admin/audit-logs/`
- Template: `templates/pages/admin/audit-logs.php`
- Role: `admin`

## About
System audit log viewer for administrators to monitor system activity, track user actions, and investigate security incidents. Provides comprehensive logging of all system operations with filtering and search capabilities.

## Layout
1. Audit dashboard
   - Total events, critical alerts, recent activity summary
   - Activity trends and anomaly detection
2. Log filters and search
   - Date range, user, action type, resource type filters
   - Advanced search with regex support
3. Audit log table
   - Columns: Timestamp, User, Action, Resource, IP Address, Details
   - Expandable rows for full event details
4. Export controls
   - Filtered log export, scheduled reports

## Sections
- Activity Overview: Summary statistics and trend charts
- Filter Panel: Advanced filtering options with saved filter sets
- Log Viewer: Paginated audit log with real-time updates
- Event Details: Full context for individual audit events
- Export Tools: Data export and automated reporting

## PRD
- Goal: Provide comprehensive system auditing for security and compliance
- Success Criteria: Complete activity visibility, fast search, regulatory compliance
- Constraints: Data retention policies, performance impact minimization

## FRD
- Inputs: Filter criteria, search queries, export parameters
- Client Validation: Valid date ranges, authorized access levels
- API Contracts:
  - GET `/wp-json/api/v1/admin/audit-logs?filters=&page=` (log entries)
  - GET `/wp-json/api/v1/admin/audit-logs/{id}` (detailed event)
  - POST `/wp-json/api/v1/admin/audit-logs/export` (export logs)
- Behavior: Real-time log streaming, advanced filtering, performance optimization
- Permissions: Full audit access for system administrators

## States
- Loading: Skeleton table with loading indicators
- Filtering: Show filtered results with active filter badges
- Searching: Highlight search terms in results
- Exporting: Progress indicators for large data exports
