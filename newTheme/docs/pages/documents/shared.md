# Page: Documents • Shared

- URL: `/documents/shared/`
- Template: `templates/pages/documents/shared.php`
- Roles: `staff`, `hr-manager`, `accountant`, `admin`

## About
Shared documents interface for users to access documents shared with them by other team members, view sharing permissions, and manage shared document collections.

## Layout
1. Shared documents overview
   - Documents shared with me, documents I shared, sharing activity
   - Recent sharing activity and access statistics
2. Document sharing table
   - Shared documents with sharer, permissions, access dates
   - Filtering by sharer, permission level, document type
3. Sharing management
   - Permission modification, sharing revocation, access logs
   - Bulk sharing actions and permission templates

## Sections
- Shared With Me: Documents shared by others with access permissions
- Shared By Me: Documents I've shared with tracking and management
- Permission Management: Access control and permission modification
- Sharing Activity: Audit trail of sharing actions and access logs
- Collaboration Tools: Document commenting and version sharing

## PRD
- Goal: Enable secure document sharing and collaboration
- Success Criteria: Clear sharing visibility, appropriate permissions, access tracking
- Constraints: Security policies, permission hierarchies, audit requirements

## FRD
- Inputs: Document template selection, file uploads, sharing recipients, permission levels
- Client Validation: Valid file formats, recipient permissions, template compatibility
- API Contracts:
  - GET `/wp-json/api/v1/documents` (list documents for sharing)
  - POST `/wp-json/api/v1/documents` (create shared document)
  - PUT `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})` (update sharing permissions)
  - GET `/wp-json/api/v1/documents/(?P<id>[a-f0-9\-]{36})` (get document details)
- Behavior: Permission validation, access logging, notification system, secure sharing links
- Permissions: Users can share documents they own or have sharing permissions for

## States
- Viewing: Shared document access and permission display
- Sharing: Document sharing with recipient selection and permission setting
- Managing: Permission modification and sharing revocation
- Monitoring: Access tracking and sharing activity review
