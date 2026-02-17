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
  - department_id (UUID, FK, nullable)
  - summary (string, optional)
  - content (rich text/Markdown/HTML)
  - content_type (enum: wysiwyg, upload, link)
  - external_url (string, nullable for links)
  - status (enum: draft, review, published, archived, rejected)
  - version (string, semantic: 1.0.0)
  - tags (JSON array)
  - metadata (JSON object for custom fields)
  - created_by (UUID, FK user)
  - reviewed_by (UUID, FK user, nullable)
  - published_by (UUID, FK user, nullable)
  - published_at (datetime, nullable)
  - updated_at (datetime)
  - created_at (datetime)
- **Taxonomy** (shared across features)
  - id (UUID)
  - name (string, unique) -- 'document_categories', 'project_categories'
  - feature (string) -- 'documents', 'projects', 'finance'
  - description (text, optional)
  - created_at (datetime)
- **TaxonomyTerm** (replaces Category)
  - id (UUID)
  - taxonomy_id (UUID, FK)
  - name (string)
  - slug (string, unique within taxonomy)
  - parent_id (UUID, nullable, for hierarchy)
  - taxonomy_type (enum: team, department, document_type)
  - metadata (JSON, feature-specific data)
  - sort_order (integer)
  - is_active (boolean)
  - created_at (datetime)
- **DocumentAttachment**
  - id (UUID)
  - document_id (UUID, FK)
  - file_id (UUID, FK to file storage)
  - attachment_type (enum: primary, supporting)
  - uploaded_at (datetime)
- **DocumentVersion**
  - id (UUID)
  - document_id (UUID, FK)
  - version (string, semantic)
  - content (rich text/Markdown/HTML)
  - content_type (enum: wysiwyg, upload, link)
  - external_url (string, nullable)
  - change_notes (text, optional)
  - created_by (UUID, FK user)
  - created_at (datetime)
- **DocumentTag**
  - id (UUID)
  - name (string, unique)
  - created_at (datetime)
- **DocumentSubscription** (integrates with core notification system)
  - id (UUID)
  - document_id (UUID, FK, nullable)
  - category_id (UUID, FK to taxonomy_terms, nullable)
  - department_id (UUID, FK, nullable)
  - user_id (UUID, FK)
  - subscription_type (enum: document, category, department)
  - notify_on_update (boolean)
  - notify_on_publish (boolean)
  - created_at (datetime)

---

## 3. Key Capabilities
- Create, update, archive, and publish documents
- Support multiple content types: WYSIWYG text, file uploads, external links
- Unified taxonomy system: organize by teams, departments, and document types using shared taxonomy infrastructure
- Attach multiple files (PDFs, DOCX, etc.) to documents
- Semantic versioning with full history and rollback
- Workflow: Draft → Review → Published/Rejected → Edit cycle
- Advanced search: title, content, tags, metadata, category, status
- Custom metadata fields and tagging system
- Role-based permissions using existing RBAC system
- Notification system for document updates and publications
- Full integration with audit trail for compliance

---

## 4. Security & Compliance
- RBAC integration with permissions: view_documents, create_documents, edit_documents, publish_documents, manage_taxonomies
- Workflow state transitions controlled by permissions
- All changes logged in audit trail with user attribution
- Published documents are read-only except for users with edit_documents permission
- File attachments leverage core file storage security
- External links validated and sanitized

## 5. Workflow States
- **Draft**: Editable by creator and users with edit_documents permission
- **Review**: Submitted for approval, editable by reviewers only
- **Published**: Live document, read-only except for authorized editors
- **Archived**: Historical document, read-only
- **Rejected**: Returned to draft with reviewer comments

## 6. Integration Points
- **File Storage**: Leverages core file storage for attachments
- **RBAC**: Uses existing permission system
- **Audit Trail**: Logs all document operations
- **Notifications**: Uses core notification system for:
  - Document workflow transitions (draft→review→published)
  - New document publications
  - Document updates and new versions
  - Category-based subscriptions (e.g., all HR documents)
  - Department-based notifications (team-specific documents)
- **User Management**: Author attribution and ownership
- **Team/Department Management**: Documents can be tagged for specific teams, triggering team-wide notifications

---

For more, see API spec and DB schema.
