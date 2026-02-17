# Page: HR • Employee Directory

- URL: `/hr/employees/`
- Template: `templates/pages/hr/employees/directory.php`
- Role: `hr-manager`

## About
Complete employee directory for HR managers to view, search, and manage all organizational employees. Shows employment details, contact information, and provides access to employee profiles and management actions.

## Layout
1. Header controls
   - Page title + employee count
   - Search input + filters (department, status, role)
   - Export button + Add Employee button
2. Employee table
   - Columns: Name, Department, Role, Status, Hire Date, Actions
   - Sortable columns, pagination
3. Bulk actions bar (appears when items selected)
   - Bulk edit, bulk export, bulk status change

## Sections
- Header: Title, stats, search/filter controls
- Table: Employee data with actions (view, edit, deactivate)
- Bulk Actions: Multi-select operations
- Pagination: Standard pagination controls

## PRD
- Goal: Provide comprehensive employee management interface for HR
- Success Criteria: Fast search (<500ms), clear employee status, intuitive actions
- Constraints: Respect data privacy; show only authorized information

## FRD
- Inputs: search query, department filter, status filter, role filter
- Client Validation: Minimum 2 characters for search
- API Contracts:
  - GET `/wp-json/api/v1/user/employees?search=&department=&status=&role=&page=`
  - Response: `{ success, data: { employees: [...], total, page, pages } }`
- Behavior: Real-time search with 300ms debounce; preserve filters in URL
- Permissions: Full employee data access for HR managers

## States
- Loading: Skeleton table rows
- Empty: "No employees found" with clear filters CTA
- Error: Toast + retry button
- Bulk Mode: Highlight selected rows, show bulk action bar
