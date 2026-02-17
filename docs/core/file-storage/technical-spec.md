# File Storage & Document Management – Technical Specification

## 1. Overview
Centralized service for secure upload, storage, retrieval, and management of files and documents. Used by all modules for attachments (receipts, contracts, HR docs, etc.).

---

## 2. Data Model
### a. File
- id (UUID)
- owner_id (FK, user)
- file_name (string)
- file_type (string, MIME)
- file_size (integer)
- storage_path (string)
- status (enum: active, archived, deleted)
- uploaded_at (timestamp)
- version (integer, default 1)
- metadata (JSON, optional)

### b. FileLink
- id (UUID)
- file_id (FK)
- linked_entity_type (enum: request, user, comment, etc.)
- linked_entity_id (UUID)
- linked_at (timestamp)

---

## 3. API Endpoints
- `POST /files/upload` – Upload file (returns file metadata)
- `GET /files/{id}` – Download file
- `GET /files?entity_type=request&entity_id=...` – List files for an entity
- `POST /files/{id}/archive` – Archive file
- `POST /files/{id}/delete` – Mark file as deleted (soft delete)
- `POST /files/{id}/restore` – Restore file
- `POST /files/{id}/version` – Upload new version

---

## 4. Integration Scenarios
- Attach files to requests, items, comments, users, etc.
- Retrieve and display files in module UIs
- Versioning for updated documents (e.g., revised receipts)
- Permissions enforced via authentication and entity ownership
- File actions logged in audit trail

---

## 5. Example API Payloads
### a. Upload File
Multipart/form-data:
- file: (binary)
- owner_id: (UUID)
- linked_entity_type: (e.g., "request")
- linked_entity_id: (UUID)

### b. Upload Response
```json
{
  "id": "f1a2b3c4-...",
  "file_name": "receipt.pdf",
  "file_type": "application/pdf",
  "file_size": 234567,
  "status": "active",
  "version": 1,
  "uploaded_at": "2025-07-20T01:00:00Z"
}
```

---

## 6. Storage & Security
- Files stored outside DB (filesystem, S3, etc.), DB stores metadata and path
- Access control enforced on download/list endpoints
- Virus/malware scanning on upload (optional)
- Soft delete/archiving for compliance

---

## 7. Retention & Compliance
- Retention policies configurable per file type/entity
- Audit log for all file actions

---

For more, see API and DB schema documentation in this folder.
