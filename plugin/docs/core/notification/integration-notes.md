# Notification & Reminders – Integration Notes

## 1. Module Integration
- **All modules** (Finance, HR, Projects, etc.) trigger notifications for key workflow events (submission, approval, rejection, disbursement, reminders for pending actions, etc.).
- Notifications are sent in-app and/or via email based on user preferences.
- Reminders are scheduled for time-sensitive actions (e.g., retirements, approvals due, etc. daily summary).

## 2. Core Feature Integration
- **Authentication/AuthZ:**
  - Only authenticated users can receive/view notifications.
  - Security-related notifications (password reset, new device login) are triggered by auth events.
- **User/Team Management:**
  - Notifications can be targeted to users, teams, or roles (e.g., "all accountants").
  - User notification preferences are managed per user.
- **Audit Trail:**
  - All notification sends, reads, and reminders are logged for traceability.
- **Request System:**
  - Request status changes, workflow actions, and escalations trigger notifications and reminders.

## 3. Delivery & Scheduling
- In-app notifications are real-time (websocket/polling) and persist in DB (since we will be using php, it can just be an api that refreshes on page load).
- Email sent via external service (SMTP).
- Reminders are scheduled and sent by background workers at specified times.

## 4. Example Integration Flow
- On request approval:
  1. Workflow engine triggers notification to requester and next approver or any other specified user.
  2. Notification is sent in-app and by email if enabled.
  3. User receives reminder if action is not taken within SLA.
  4. All events are logged in audit trail.

## 5. Error Handling
- Failed deliveries are retried and/or logged for admin review.
- User preferences are respected for all channels.

---

For more, see API spec, DB schema, and technical spec.
