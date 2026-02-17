# Notification & Reminders – API Specification

## 1. Send Notification
- **POST /notifications/send**
  - Request:
    ```json
    {
      "user_id": "123",
      "type": "action",
      "title": "Request Approved",
      "message": "Your expense request EXP-00123 has been approved.",
      "link": "/requests/a0e2c1a2-...",
      "send_via": ["in-app", "email"]
    }
    ```
  - Response:
    ```json
    { "notification_id": "123", "status": "sent" }
    ```

## 2. List Notifications
- **GET /notifications**
  - Query params: `status`, `type`, `since`, `limit`, `offset`
  - Response:
    ```json
    [
      {
        "id": "123",
        "type": "action",
        "title": "Request Approved",
        "message": "Your expense request EXP-00123 has been approved.",
        "status": "unread",
        "created_at": "2025-07-20T01:00:00Z"
      },
      ...
    ]
    ```

## 3. Mark as Read/Archive
- **POST /notifications/{id}/read**
  - Response: `{ "status": "read" }`
- **POST /notifications/{id}/archive**
  - Response: `{ "status": "archived" }`

## 4. Schedule Reminder
- **POST /notifications/reminder**
  - Request:
    ```json
    {
      "user_id": "123",
      "type": "reminder",
      "title": "Action Required",
      "message": "Please retire your completed request.",
      "remind_at": "2025-07-25T09:00:00Z"
    }
    ```
  - Response: `{ "reminder_id": "123", "status": "scheduled" }`

## 5. Manage Templates
- **GET /notification-templates**
- **POST /notification-templates**
- **PUT /notification-templates/{id}**

## 6. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 400, "message": "Bad Request" } }
  ```

---

For more, see technical spec and DB schema.
