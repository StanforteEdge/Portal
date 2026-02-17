# Document Library – API Specification

## 1. Document Management
- **POST /api/v1/documents** – Create new document (draft)
- **GET /api/v1/documents** – List/search documents (by title, category, status, tags)
- **GET /api/v1/documents/{id}** – Get document details
- **PUT /api/v1/documents/{id}** – Update document (edit draft, create new version)
- **POST /api/v1/documents/{id}/submit-review** – Submit document for review
- **POST /api/v1/documents/{id}/approve** – Approve document (review → published)
- **POST /api/v1/documents/{id}/reject** – Reject document (review → rejected)
- **POST /api/v1/documents/{id}/publish** – Publish document directly (bypass review)
- **POST /api/v1/documents/{id}/archive** – Archive document
- **POST /api/v1/documents/{id}/restore** – Restore archived document

## 2. Taxonomy Management
- **GET /api/v1/taxonomies** – List all taxonomies (with feature filtering)
- **GET /api/v1/taxonomies/{id}/terms** – Get taxonomy terms (categories)
- **GET /api/v1/taxonomies/{id}/terms/tree** – Get hierarchical taxonomy tree
- **POST /api/v1/taxonomy-terms** – Create taxonomy term (category)
- **PUT /api/v1/taxonomy-terms/{id}** – Update taxonomy term
- **DELETE /api/v1/taxonomy-terms/{id}** – Delete taxonomy term
- **GET /api/v1/document-tags** – List all tags
- **POST /api/v1/document-tags** – Create tag

## 3. Attachments
- **POST /api/v1/documents/{id}/attachments** – Attach file (integrates with file storage)
- **GET /api/v1/documents/{id}/attachments** – List document attachments
- **DELETE /api/v1/documents/{id}/attachments/{attachment_id}** – Remove attachment

## 4. Versioning
- **GET /api/v1/documents/{id}/versions** – List all versions
- **GET /api/v1/documents/{id}/versions/{version}** – Get specific version
- **POST /api/v1/documents/{id}/rollback/{version}** – Rollback to previous version
- **GET /api/v1/documents/{id}/compare/{version1}/{version2}** – Compare versions

## 5. Search & Filtering
- **GET /api/v1/documents/search** – Advanced search with parameters:
  - `query` – Full-text search in title, summary, content
  - `category` – Filter by category ID
  - `department` – Filter by department
  - `status` – Filter by status (draft, review, published, etc.)
  - `tags` – Filter by tags (comma-separated)
  - `content_type` – Filter by content type
  - `created_by` – Filter by author
  - `date_from` / `date_to` – Date range filtering
  - `sort` – Sort by (title, created_at, updated_at, published_at)
  - `order` – Sort order (asc, desc)

## 6. Notifications & Settings
- **GET /api/v1/documents/{id}/notifications** – Get notification settings
- **POST /api/v1/documents/{id}/notifications** – Subscribe to document notifications
- **DELETE /api/v1/documents/{id}/notifications** – Unsubscribe from notifications

## 7. Permissions & Workflow
- **Required Permissions:**
  - `view_documents` – View published documents
  - `create_documents` – Create new documents
  - `edit_documents` – Edit existing documents
  - `publish_documents` – Publish/approve documents
  - `manage_taxonomies` – Manage taxonomy terms and tags
- **Workflow State Transitions:**
  - Draft → Review (creator or edit_documents)
  - Review → Published (publish_documents)
  - Review → Rejected (publish_documents)
  - Published → Archived (publish_documents)
  - Any → Draft (edit_documents for corrections)
- Audit trail integration for all document operations

## 8. Request/Response Examples

### Create Document
```json
POST /api/v1/documents
{
  "title": "Employee Handbook 2024",
  "category_id": "taxonomy-term-uuid-here",
  "content_type": "wysiwyg",
  "content": "<h1>Welcome to...</h1>",
  "tags": ["hr", "handbook", "2024"],
  "metadata": {
    "effective_date": "2024-01-01",
    "review_cycle": "annual"
  }
}
```

### Get Taxonomy Terms
```json
GET /api/v1/taxonomies/document-categories-uuid/terms
{
  "terms": [
    {
      "id": "uuid",
      "name": "HR Policies",
      "slug": "hr-policies",
      "taxonomy_type": "document_type",
      "parent_id": null,
      "children": [...]
    }
  ]
}
```

### Search Documents
```json
GET /api/v1/documents/search?query=handbook&status=published&tags=hr
{
  "documents": [...],
  "total": 15,
  "page": 1,
  "per_page": 10
}
```

## 9. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 403, "message": "Forbidden" } }
  ```
- Validation errors include field-specific details

---

For more, see technical spec and DB schema.
