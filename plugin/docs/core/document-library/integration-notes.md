# Document Library – Integration Notes

## 1. Core Feature Integration
- **Authentication/AuthZ:**
  - Only authorized users can create, edit, publish, or archive documents.
  - Permissions are enforced at the API and UI level.
- **User/Team Management:**
  - Documents can be tagged for specific teams or departments (using categories or metadata).
  - Team leads or designated roles may have publishing rights.
- **Notification:**
  - Integrates with core notification system for workflow transitions and publications
  - Supports multiple subscription types:
    - Document-specific: Get notified about a specific document's updates
    - Category-based: Get notified about all documents in "HR Policies" category
    - Department-based: Get notified about documents tagged for your department
  - Notification triggers:
    - Document published (new or updated version)
    - Document submitted for review (for reviewers)
    - Document approved/rejected (for authors)
    - New documents in subscribed categories
- **File Storage:**
  - Attachments (PDFs, templates, forms) are managed via the file storage core service and linked to documents.
- **Audit Trail:**
  - All document creation, edits, publishing, archiving, and version rollbacks are logged for compliance and traceability.

## 2. Module Integration
- All business modules (Finance, HR, Projects, etc.) can reference or embed documents from the library (e.g., link to policies, onboarding guides, templates).
- Document Library serves as the single source of truth for official reference content across the organization.

## 3. Example Integration Flows

### New Policy Publication:
1. HR creates "Remote Work Policy" document (status: draft)
2. HR submits for review (status: review) → Notification sent to reviewers
3. Manager approves document (status: published) → Notification sent to author
4. Core notification system sends alerts to:
   - Users subscribed to "HR Policies" category
   - Users subscribed to "All Staff" department
   - Users with document-specific subscriptions
5. Document is available in library and can be linked from other modules
6. All actions logged in audit trail

### Team-Specific Document:
1. IT creates "Security Guidelines" tagged for "Engineering" department
2. Document published → Core notification system sends alerts to:
   - All Engineering team members (via department subscription)
   - Users subscribed to "IT Procedures" category
3. Engineering team receives targeted notification about relevant policy

---

For more, see technical spec, API spec, and DB schema.
