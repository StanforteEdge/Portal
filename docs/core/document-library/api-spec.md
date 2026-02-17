# Document Library – API Specification

## 1. Document Management
- **POST /documents** – Create new document (draft)
- **GET /documents** – List/search documents (by title, category, status)
- **GET /documents/{id}** – Get document details
- **PUT /documents/{id}** – Update document (edit draft, new version)
- **POST /documents/{id}/publish** – Publish document
- **POST /documents/{id}/archive** – Archive document

## 2. Categories
- **GET /categories** – List all categories
- **POST /categories** – Create category
- **PUT /categories/{id}** – Update category
- **DELETE /categories/{id}** – Delete category

## 3. Attachments
- **POST /documents/{id}/attachments** – Attach file (link to file storage)
- **DELETE /documents/{id}/attachments/{attachment_id}** – Remove attachment

## 4. Versioning
- **GET /documents/{id}/versions** – List all versions
- **GET /documents/{id}/versions/{version}** – Get specific version
- **POST /documents/{id}/rollback/{version}** – Rollback to previous version

## 5. Search
- **GET /documents/search?query=...&category=...&status=...**

## 6. Permissions & Workflow
- Role-based access enforced for all endpoints
- Only authorized users can edit, publish, or archive
- Audit trail for all changes

## 7. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 403, "message": "Forbidden" } }
  ```

---

For more, see technical spec and DB schema.
