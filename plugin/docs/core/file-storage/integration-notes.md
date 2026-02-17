# File Storage & Document Management – Integration Notes

## 1. Module Integration
- **All modules** (Finance, HR, Projects, etc.) can attach files to requests, items, comments, and user profiles.
- File upload endpoints are used whenever supporting documents (receipts, contracts, HR docs, etc.) are required.
- File retrieval endpoints are used to display/download files in module UIs.
- Permissions are enforced so only authorized users can upload, view, or delete files.

## 2. Core Feature Integration
- **Authentication/AuthZ:**
  - Only authenticated users can upload/download files.
  - File ownership is tied to the uploader (owner_id).
- **User/Team Management:**
  - Files can be linked to teams or users for access control.
- **Audit Trail:**
  - All file actions (upload, download, archive, delete, restore, version) are logged for compliance.
- **Notification:**
  - Notifications can be triggered for file uploads (e.g., "New receipt uploaded").
- **Request System:**
  - Files are linked to requests via file_links (linked_entity_type = "request").
  - File versioning supports updates to supporting documents during a request lifecycle.

## 3. Security & Compliance
- Virus/malware scanning is recommended on upload.
- Retention and deletion policies are enforced per file type/entity.
- Files are soft-deleted/archived for auditability.

## 4. Example Integration Flow
- On request submission:
  1. User uploads supporting files via `/files/upload`.
  2. File is linked to the request.
  3. File upload triggers a notification to approvers (optional).
  4. All actions are logged in audit trail.

---

For more, see API spec, DB schema, and technical spec.
