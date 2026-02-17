# Page: Documents • Library

- URL: `/documents/`
- Template: `templates/pages/documents/library.php`
- Roles: `staff`, `hr-manager`, `accountant`, `admin` (role-based access)

## About
Central document library for accessing company documents, policies, templates, and shared files. Provides search, filtering, and organization features with appropriate access controls.

## Layout
1. Header navigation
   - Search bar + category filters
   - Upload button (if permitted) + folder navigation
2. Document grid/list toggle
   - Grid view: document cards with thumbnails
   - List view: table with metadata columns
3. Sidebar filters
   - Categories, file types, date ranges, access levels
4. Document viewer (modal/drawer)
   - Preview for PDFs/images, download for others

## Sections
- Header: Global search, upload access, view toggles
- Filters Sidebar: Category tree, file type filters, date filters
- Document Grid/List: File cards/table with metadata
- Preview Panel: Document viewer with download/share options
- Breadcrumb Navigation: Folder path navigation

## PRD
- Goal: Provide secure, searchable document access for all users
- Success Criteria: Fast search, clear organization, appropriate access controls
- Constraints: Respect document permissions, audit access logs

## FRD
- Inputs: Document uploads, metadata, sharing permissions, search criteria
- Client Validation: Valid file formats, required metadata, permission compatibility
- API Contracts:
  - GET `/wp-json/api/v1/documents` (list documents with pagination)
  - POST `/wp-json/api/v1/documents` (create new document)
  - GET `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})` (get specific document)
  - PUT `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})` (update document)
  - DELETE `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})` (delete document)
  - GET `/wp-json/api/v1/documents/search` (search documents)
  - POST `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})/submit` (submit for review)
  - POST `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})/approve` (approve document)
  - POST `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})/reject` (reject document)
  - POST `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})/archive` (archive document)
- Behavior: File validation, automatic versioning, permission checks, workflow routing
- Permissions: Role-based access with granular permissions (view_documents, create_documents, edit_documents, publish_documents)

## States
- Loading: Skeleton grid/list items
- Empty: Category-specific empty states ("No documents in this category")
- Searching: Loading spinner + result count
- Error: Toast messages for access denied or network errors
