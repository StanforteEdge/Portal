# File Storage & Document Management – API Specification

## 1. Upload File
- **POST /files/upload**
  - Multipart/form-data:
    - file: (binary)
    - owner_id: (UUID)
    - linked_entity_type: (e.g., "request")
    - linked_entity_id: (UUID)
  - Response:
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

## 2. Download File
- **GET /files/{id}**
  - Returns file binary with metadata headers

## 3. List Files for Entity
- **GET /files?entity_type=request&entity_id=...**
  - Response: Array of file metadata

## 4. Archive/Delete/Restore
- **POST /files/{id}/archive**
- **POST /files/{id}/delete**
- **POST /files/{id}/restore**
  - Response: `{ "status": "archived" }`, `{ "status": "deleted" }`, `{ "status": "active" }`

## 5. Upload New Version
- **POST /files/{id}/version**
  - Multipart/form-data: file (binary)
  - Response: New file version metadata

## 6. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 404, "message": "File not found" } }
  ```

---

For more, see technical spec and DB schema.
