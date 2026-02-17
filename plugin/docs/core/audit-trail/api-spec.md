# Audit Trail & Logging – API Specification

## 1. Log Action/Event
- **POST /audit-logs**
  - Request:
    ```json
    {
      "actor_id": "u1x2y3z4-...",
      "action": "approve",
      "entity_type": "request",
      "entity_id": "r1a2b3c4-...",
      "details": { "before": {"status": "PENDING"}, "after": {"status": "APPROVED"} }
    }
    ```
  - Response:
    ```json
    { "audit_log_id": "a1b2c3d4-...", "status": "logged" }
    ```

## 2. Query Logs
- **GET /audit-logs**
  - Query params: `actor_id`, `entity_type`, `entity_id`, `action`, `date_from`, `date_to`, `limit`, `offset`
  - Response: Array of audit log entries

## 3. Get Log Details
- **GET /audit-logs/{id}**
  - Response: Audit log entry details

## 4. Export Logs
- **GET /audit-logs/export**
  - Download logs as CSV/JSON

## 5. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 403, "message": "Forbidden" } }
  ```

---

For more, see technical spec and DB schema.
