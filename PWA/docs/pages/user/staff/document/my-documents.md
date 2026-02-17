# Page: Staff • My Documents

- URL: `/my-documents/`
- Template: `templates/pages/user/staff/document/my-documents.php`
- Role: `staff`

## About
Personal document library for staff. Upload, view, and manage own documents; access shared docs. Aligns with Core/Document and Core/FileStorage modules.

## Layout
1. Header card
   - Title: My Documents
   - Subtitle: storage used; last updated time
   - Primary action: Upload Document (opens modal)
2. Quick stats row (4 small cards)
   - Total, Shared with me, Recently updated, Pending approvals
3. Two-column layout
   - Left (1/4): Filters card
     - Search, Category, Date range, Status
   - Right (3/4): Documents table
     - Columns: Name, Category, Size, Updated, Status, Actions
4. Upload modal
   - Fields: File, Category, Notes
5. Preview side panel (drawer)
   - Document preview, metadata, actions

## Sections
- Filters Card: keyword, selects (category/status), date range
- Documents Table: pageable, sortable; actions: view, download, delete
- Upload Modal: file picker, select category, textarea notes
- Preview Drawer: embedded preview for PDFs/images; metadata

## PRD
- Goal: Enable staff to manage personal documents safely
- Success Criteria: Upload < 5s; table interactions snappy; clear error handling
- Constraints: Max file size per backend; accepted types enforced

## FRD
- Inputs:
  - Upload: file (required), category (required), notes (optional, 255)
  - Filters: q, category, status, date_from, date_to
- Client Validation: file type/size; required category
- API (to confirm with plugin Document module):
  - GET `/wp-json/api/v1/documents?scope=self&category=&status=&q=&from=&to=`
  - POST `/wp-json/api/v1/documents` (multipart)
  - GET `/wp-json/api/v1/documents/{id}`
  - DELETE `/wp-json/api/v1/documents/{id}`
- Behavior:
  - Initial fetch with default filters
  - Upload refreshes table on success
  - Delete asks confirmation; optimistic update

## States
- Empty: illustration + "Upload your first document"
- Loading: skeleton rows; disabled actions
- Error: toast + retry button on table
