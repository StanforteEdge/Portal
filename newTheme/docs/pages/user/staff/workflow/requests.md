# Page: Staff • My Leave Requests

- URL: `/my-leave/`
- Template: `templates/pages/user/staff/workflow/requests.php`
- Role: `staff`

## About
Self-service leave request system for staff. Submit new requests, view pending/approved/denied requests. Integrates with Core/Requests and Core/Workflow modules. Uses JWT auth and custom RBAC.

## Layout
1. Header card
   - Title: My Leave Requests
   - Subtitle: current leave balance
   - Primary action: New Request (opens modal)
2. Quick stats row (3 cards)
   - Available Days, Pending Requests, Upcoming Leave
3. Requests table (full width)
   - Columns: Date Range, Type, Days, Status, Actions
4. New Request modal
   - Fields: Type, Start Date, End Date, Notes

## Sections
- Leave Balance Card: annual, sick, personal days remaining
- Requests Table: filterable by status; actions: view details, cancel (if pending)
- New Request Modal: date picker, leave type select, textarea notes

## PRD
- Goal: Enable staff to manage leave requests without HR intervention
- Success Criteria: Requests submit in <2s; real-time status updates; clear balance display
- Constraints: Leave policies enforced by backend; cannot submit overlapping requests

## FRD
- Inputs (New Request):
  - type (select: annual, sick, personal, other)
  - start_date (date, required)
  - end_date (date, required, >= start_date)
  - notes (string, optional, 500 max)
- Client Validation: date range valid; no overlaps with existing pending requests
- API Contracts:
  - GET `/wp-json/api/v1/workflow/requests?scope=self&type=leave`
  - POST `/wp-json/api/v1/workflow/requests`
  - GET `/wp-json/api/v1/workflow/balance` (leave balances)
- Behavior: Submit shows loading; success toast + refresh table; error highlights fields

## States
- Empty: "No leave requests yet" + CTA to create first
- Loading: skeleton rows; disabled submit
- Error: toast on submit; inline on validation
