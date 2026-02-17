# Core Request System – Technical Specification

## 1. Overview
The Request System is a metadata-driven engine for defining, submitting, and managing requests of any type across modules (Finance, HR, Projects, etc.). It supports dynamic forms, configurable approval workflows, and integration with all core services.

---

## 2. Metadata Model
### a. Request Group
- id (UUID)
- name (e.g., Financial, HR, Project)
- code
- description

### b. Request Type
- id (UUID)
- group_id (FK)
- name (e.g., Petty Cash, Leave Request)
- code_prefix
- description
- form_schema (JSON Schema)
- approval_flow_json
- approval_limit
- is_active

### c. Request Instance
- id (UUID)
- request_type_id (FK)
- group_id (FK, denormalized)
- request_number (integer, sequential per type, unique within request type; prefix is appended on the frontend using request_type.code_prefix)
- created_by (user_id)
- team_id (the team context for the request)
- status
- data (JSON: field values)
- current_approval_step
- audit_log_id (FK)
- created_at, updated_at

#### Database Schema Example (PostgreSQL/MySQL)
```sql
CREATE TABLE request_instances (
    id UUID PRIMARY KEY,
    request_type_id UUID NOT NULL,
    group_id UUID,
    request_number INTEGER NOT NULL,
    created_by UUID NOT NULL,
    team_id UUID,
    status VARCHAR(32) NOT NULL,
    data JSONB,
    current_approval_step INTEGER,
    audit_log_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (request_type_id, request_number),
    FOREIGN KEY (request_type_id) REFERENCES request_types(id),
    FOREIGN KEY (group_id) REFERENCES request_groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);
```
- The pair `(request_type_id, request_number)` is unique.
- Use a per-type sequence or atomic transaction to increment `request_number` safely.
- Never update `request_number` after assignment.


### d. Request Item
- id
- request_id (FK)
- category_id, subcategory_id
- description, amount, due_date, quantity

#### d. Request Number Generation
- Each request type maintains its own sequence counter.
- When a new request is created, increment the counter for that type.
- The backend stores only the sequential integer `request_number`, unique within each request type (e.g., 123).
- The frontend/app composes the user-facing identifier as `{request_type.code_prefix}-{request_number}` (e.g., `EXP-00123`).
- This approach allows changing the request type or prefix in the future without affecting the core identifier.
- The backend UUID remains the primary key for security and integrity.

---

## 3. API Endpoints

### a. Request Type & Form Management
- `POST /request-types` – Create new request type (with form schema, approval flow)
- `GET /request-types` – List request types (filter by group)
- `GET /request-types/{id}` – Get details (including form schema, approval flow)
- `PUT /request-types/{id}` – Update request type

### b. Request Submission & Management
- `POST /requests` – Submit a new request (dynamic fields, items, attachments)
- `GET /requests` – List/search requests (by type, status, user, team, etc.)
- `GET /requests/{id}` – Get request details (fields, status, audit, workflow)
- `PUT /requests/{id}` – Update request (if allowed)
- `POST /requests/{id}/actions` – Workflow actions (approve, reject, escalate, disburse, retire, complete)

### c. Integration Points
- **File Upload**: Attach files to requests/items
- **Notification**: Trigger notifications on status/actions
- **Audit Trail**: Log all actions and status changes
- **User/Team**: Select team context, route approvals

---

## Example API Response
```json
{
  "id": "a0e2c1a2-...",
  "request_type_id": "b1f3d2e4-...",
  "group_id": "c2g4h5j6-...",
  "request_number": 123,
  "created_by": "u1x2y3z4-...",
  "team_id": "t1a2b3c4-...",
  "status": "SUBMITTED",
  "data": {
    "amount": 50000,
    "purpose": "Internet subscription",
    "due_date": "2025-07-25"
  },
  "current_approval_step": 2,
  "created_at": "2025-07-20T00:51:11Z",
  "updated_at": "2025-07-20T00:51:11Z",
  "request_type": {
    "code_prefix": "EXP",
    "name": "Expense Request"
  }
}
```
- The frontend displays this as `EXP-00123` using `request_type.code_prefix` and zero-padded `request_number`.

---

## 4. Sample: Request Type JSON Schema

### a. Example Request Number Generation
- For a new Expense Request (type code: EXP), if the current sequence is 122, the next request will be:
  - `request_number`: `123` (integer, backend only)
  - Displayed to the user as: `EXP-00123` (composed in the frontend)
  - `id`: `a0e2c1a2-...` (UUID, backend only)

### b. JSON Schema Example
```json
{
  "title": "Petty Cash Request",
  "type": "object",
  "properties": {
    "amount": { "type": "number", "minimum": 0 },
    "purpose": { "type": "string" },
    "due_date": { "type": "string", "format": "date" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "amount": { "type": "number" },
          "category_id": { "type": "string" },
          "subcategory_id": { "type": "string" },
          "due_date": { "type": "string", "format": "date" },
          "quantity": { "type": "integer", "minimum": 1 }
        },
        "required": ["description", "amount"]
      }
    }
  },
  "required": ["amount", "purpose", "due_date"]
}
```

---

## 5. Approval Workflow Example (in approval_flow_json)
```json
{
  "steps": [
    {"role": "team_lead", "action": "approve"},
    {"role": "accountant", "action": "clear", "approval_limit": 50000},
    {"role": "coo", "action": "approve", "min_amount": 50001},
    {"role": "ed", "action": "approve", "min_amount": 200000},
    {"role": "accountant", "action": "disburse"},
    {"role": "staff", "action": "confirm"},
    {"role": "staff", "action": "retire"},
    {"role": "accountant", "action": "complete"}
  ],
  "escalation": {
    "timeout_hours": 24,
    "escalate_to": "next_level"
  }
}
```

---

## 6. Integration Example
- On request submission, files are uploaded via `/files` and linked to the request.
- On status change, notifications are sent via `/notifications`.
- Every action is logged via `/audit-logs`.
- Team context is set at creation, and all workflow steps use user/team management for routing.

---

## 7. Security & Permissions
- Only authorized users can create/approve requests based on roles/teams.
- Field-level validation and access control enforced by schema and workflow config.

---

For more, see the API specs and integration docs in the core folder.
