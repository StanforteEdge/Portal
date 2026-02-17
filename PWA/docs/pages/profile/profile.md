# Page: Staff • My Profile

- URL: `/my-profile/`
- Template: `templates/pages/user/staff/user/profile.php`
- Role: `staff`

## About
Self-service page for staff to view and update their personal and contact information, view employment details (read-only), and access account security actions. Mirrors User and Auth modules in the plugin. Uses JWT and custom RBAC; no WP cookies.

## Layout
1. Hero bar (full width)
   - Title: My Profile
   - Subtitle: Full name and primary role from status API
2. Two-column grid
   - Left (1/3) Profile Card
     - Avatar, name, email, department, role badges
     - Primary action: Edit Profile (toggles inline form)
     - Secondary action: Change Password (link to `/reset-password/`)
   - Right (2/3) Tabbed Content
     - Tabs: Personal Info • Employment • Contacts • Security
3. Bottom row (full width)
   - Recent Activity table (last 10 account events)

## Sections
- Profile Card
  - Avatar (upload optional future enhancement)
  - Name, Email, Department
  - Role badges (from `data.roles`)
  - Buttons: Edit Profile, Change Password

- Tabs
  - Personal Info (editable form)
    - First Name, Last Name, Phone, Address
  - Employment (read-only)
    - Employee ID, Department, Manager, Hire Date
  - Contacts (editable form)
    - Emergency Contact Name, Relationship, Phone
  - Security
    - CTA: Change password → `/reset-password/`

- Recent Activity Table
  - Columns: Date, Action, IP, Status
  - Empty state: "No recent activity"

## PRD
- Goal: Empower staff to self-manage personal/contact details and view employment data.
- Success Criteria:
  - Profile loads under 1s after status fetch
  - Updates persist and reflect immediately
  - Clear validation and error feedback
- Constraints:
  - Employment data is read-only for staff
  - Security actions route to existing auth flows

## FRD
- Inputs (editable):
  - first_name (string, required)
  - last_name (string, required)
  - phone (string, optional, E.164 preferred)
  - address (string, optional, max 255)
  - emergency_contact_name (string, optional)
  - emergency_contact_relationship (string, optional)
  - emergency_contact_phone (string, optional)
- Client Validation:
  - Required: first_name, last_name
  - Phone format: basic regex; sanitize non-digits
  - Address length <= 255
- API Contracts:
  - GET `/wp-json/api/v1/auth/status`
    - Use: name, roles
  - GET `/wp-json/api/v1/user/profile`
    - Response: `{ success, data: { personal: {...}, employment: {...}, contacts: {...} } }`
  - PUT `/wp-json/api/v1/user/profile`
    - Body: `{ personal: {...}, contacts: {...} }`
    - Success: `{ success: true, data: { message } }`
  - GET `/wp-json/api/v1/audit/logs?scope=self&limit=10`
    - Table rows source
- Behavior:
  - Load status → profile → render
  - Edit toggles inline; Save via PUT; show toast; keep form open
  - Activity table paginated client-side (10 rows)

## States
- Loading
  - Skeleton for profile card and tabs; spinner on table
- Empty
  - Activity table: empty state card
- Error
  - API error toast; inline field messages on save
- Success
  - Toast: "Profile updated"
