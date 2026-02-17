# Audit Trail & Logging – Integration Notes

## 1. Module Integration
- **All modules** (Finance, HR, Projects, etc.) log all critical actions (create, update, approve, reject, retire, disburse, file upload, etc.) via the audit trail API.
- Each business action should include actor, action, entity type, entity id, and before/after details where relevant.

## 2. Core Feature Integration
- **Authentication/AuthZ:**
  - All login, logout, password changes, and role/permission changes are logged.
- **Notification:**
  - All notification sends, reads, and reminders are logged.
- **File Storage:**
  - All file uploads, downloads, deletions, and versioning are logged.
- **Request System:**
  - All request lifecycle events, workflow actions, and escalations are logged.
- **User/Team Management:**
  - All user creation, updates, team assignments, and role changes are logged.

## 3. Security & Compliance
- Audit log entries are immutable (append-only).
- Only authorized users (e.g., auditors, admins) can query or export logs.
- Retention and export policies are enforced for compliance.

## 4. Example Integration Flow
- On request approval:
  1. Workflow engine logs the approval action with before/after status.
  2. Audit log entry includes actor, action, entity type ("request"), entity id, and details.

---

For more, see API spec, DB schema, and technical spec.
