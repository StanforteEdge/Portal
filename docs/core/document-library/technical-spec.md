# Document Library – Technical Specification

## 1. Overview
A centralized, structured repository for official company documents (policies, job descriptions, SOPs, templates, handbooks, onboarding guides, etc.), supporting categories, versioning, permissions, and workflow for publishing and updating content.

---

## 2. Data Model
- **Document**
  - id (UUID)
  - title (string)
  - slug (string, unique)
  - category_id (UUID, FK)
  - summary (string, optional)
  - content (rich text/Markdown/HTML)
  - status (draft, published, archived)
  - version (integer)
  - created_by (UUID, FK user)
  - published_by (UUID, FK user, nullable)
  - published_at (datetime, nullable)
  - updated_at (datetime)
  - created_at (datetime)
- **Category**
  - id (UUID)
  - name (string, unique)
  - parent_category_id (UUID, nullable, for hierarchy)
- **DocumentAttachment**
  - id (UUID)
  - document_id (UUID, FK)
  - file_id (UUID, FK to file storage)
  - uploaded_at (datetime)
- **DocumentVersion**
  - id (UUID)
  - document_id (UUID, FK)
  - version (integer)
  - content (rich text/Markdown/HTML)
  - created_by (UUID, FK user)
  - created_at (datetime)

---

## 3. Key Capabilities
- Create, update, archive, and publish documents
- Organize documents by category and subcategory
- Attach files (PDFs, DOCX, etc.) to documents
- Full version history and rollback
- Draft, review, and publish workflow
- Search and filter by title, category, status
- Role-based permissions for view, edit, publish
- Integration with notifications and audit trail

---

## 4. Security & Compliance
- Only authorized users can create, edit, or publish documents
- All changes are logged in the audit trail
- Published documents are read-only for most users

---

For more, see API spec and DB schema.
