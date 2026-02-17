# Page: Dashboard

- URL: `/dashboard/`
- Template: `templates/pages/dashboard/index.php`
- Roles: All authenticated users

## About
Central hub that dynamically adapts to show role-specific sections and content based on user's assigned roles. Supports multi-role users with role switching capability. Loads user roles from JWT token and renders appropriate dashboard sections.

## Layout
1. Header section
   - Welcome message with user name
   - Primary role indicator with role switcher dropdown
   - Role tabs/pills showing all user's roles
2. Role sections container
   - Expandable/collapsible sections for each role
   - Active role section highlighted
   - Role-specific metrics and quick actions
3. System-wide notifications/alerts (if any)

## Sections
- Header: User greeting + role switcher
- Role Tabs: Visual indicators for all assigned roles
- Role Sections: Individual containers for each role's dashboard content
  - KPIs/Metrics cards
  - Pending actions lists
  - Quick action buttons
  - Recent activity feeds
- Global Alerts: System notifications (maintenance, updates, etc.)

## PRD
- Goal: Provide unified access point for all user responsibilities
- Success Criteria: Fast loading (<2s), clear role context, intuitive navigation
- Constraints: Must support users with 1-9 concurrent roles

## FRD
- Inputs: JWT token (contains user roles)
- API Contracts:
  - GET `/wp-json/api/v1/auth/status` (user info + roles)
  - GET `/wp-json/api/v1/dashboard/{role}/metrics` (role-specific KPIs)
  - GET `/wp-json/api/v1/dashboard/{role}/actions` (pending actions)
- Client Behavior:
  - Load user roles from token
  - Determine primary role via hierarchy
  - Render all role sections, highlight primary
  - Lazy-load section content on demand
- Role Hierarchy: Board Member > ED > COO > Admin > HR Manager > Accountant > Team Lead > Staff > Vendor

## States
- Loading: Skeleton for header, role tabs, and primary section
- Multi-role: Show all role tabs with switcher
- Single-role: Hide switcher, show single section
- Error: Toast on API failure, fallback to basic dashboard
