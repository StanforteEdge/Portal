# Page: Documents • Upload

- URL: `/documents/upload/`
- Template: `templates/pages/documents/upload.php`
- Roles: `staff`, `hr-manager`, `accountant`, `admin`

## About
Document upload interface for users to securely upload files to the document management system with metadata tagging, access controls, and version management.

## Layout
1. Upload zone
   - Drag-and-drop area with file browser fallback
   - Multiple file selection with progress indicators
2. File metadata form
   - Document title, description, category selection
   - Access permissions, tags, expiration settings
3. Upload queue
   - File list with upload progress and status
   - Individual file controls (cancel, retry, remove)

## Sections
- Upload Area: Primary drag-drop interface with visual feedback
- File Queue: List of selected files with individual status
- Metadata Panel: Bulk or individual metadata entry
- Permission Settings: Access control configuration
- Upload Controls: Start upload, clear queue, settings

## PRD
- Goal: Enable secure, organized document uploads for all users
- Success Criteria: Successful uploads, proper metadata, access controls
- Constraints: File size limits, type restrictions, storage quotas

## FRD
- Inputs: File selections, metadata fields, permission settings
- Client Validation: File type/size validation, required metadata, permission logic
- API Contracts:
  - POST `/wp-json/api/v1/documents/upload` (multipart file upload)
  - GET `/wp-json/api/v1/documents/categories` (category options)
  - GET `/wp-json/api/v1/documents/tags` (available tags)
- Behavior: Chunked uploads for large files, progress tracking, error recovery
- Permissions: Role-based upload permissions and file type restrictions

## States
- File Selection: Drag-drop or browse file selection
- Metadata Entry: Form validation and permission setting
- Uploading: Progress bars and status indicators
- Success: Confirmation with document links and sharing options
- Error: File-level error handling with retry options
