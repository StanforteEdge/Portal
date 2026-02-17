# Notification & Reminders – Technical Specification

## 1. Overview
Centralized notification engine for the staff portal backend. Delivers in-app notifications, email alerts, and scheduled reminders for all modules (Finance, HR, Projects, etc.).

---

## 2. Data Model
### a. Notification
- id (UUID)
- user_id (FK, recipient)
- type (enum: info, warning, action, reminder, etc.)
- title (string)
- message (string)
- link (string, optional)
- status (enum: unread, read, archived)
- sent_via (array: [in-app, email, sms])
- created_at, read_at, archived_at

### b. NotificationTemplate
- id (UUID)
- name (string, unique)
- type (enum: workflow, reminder, system, etc.)
- subject (string)
- body (string, markdown or HTML)
- language (string, default 'en')
- is_active (boolean)

### c. UserNotificationPreference
- user_id (FK)
- channel (enum: in-app, email, sms)
- enabled (boolean)

---

## 3. API Endpoints
- `POST /notifications/send` – Send notification to user(s) (in-app, email, or both)
- `GET /notifications` – List user notifications
- `GET /notifications/{id}` – Get notification details
- `POST /notifications/{id}/read` – Mark as read
- `POST /notifications/{id}/archive` – Archive notification
- `POST /notifications/reminder` – Schedule or trigger a reminder
- `GET /notification-templates` – List templates
- `POST /notification-templates` – Create template
- `PUT /notification-templates/{id}` – Update template

---

## 4. Integration Scenarios
- Trigger notifications on workflow events (submission, approval, rejection, disbursement, etc.)
- Send reminders for pending actions (approvals, retirements, etc.)
- Use templates for consistent messaging
- Respect user notification preferences
- Log notification events in audit trail

---

## 5. Example API Payloads
### a. Send Notification
```json
{
  "user_id": "u1x2y3z4-...",
  "type": "action",
  "title": "Request Approved",
  "message": "Your expense request EXP-00123 has been approved.",
  "link": "/requests/a0e2c1a2-...",
  "send_via": ["in-app", "email"]
}
```

### b. Schedule Reminder
```json
{
  "user_id": "u1x2y3z4-...",
  "type": "reminder",
  "title": "Action Required",
  "message": "Please retire your completed request.",
  "remind_at": "2025-07-25T09:00:00Z"
}
```

---

## 6. Delivery Strategy
- In-app: Real-time via websocket/polling, stored in DB
- Email: Via SMTP or transactional email service
- Reminders: Scheduled job/worker triggers at specified time

---

## 7. Security & Privacy
- Only intended recipients can view notifications
- Sensitive data is not sent via insecure channels
- All notification actions are auditable

---

For more, see API and DB schema documentation in this folder.
