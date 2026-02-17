# Core Features Directory

This directory contains all application-wide, reusable features ("core services") for the staff portal backend. These are foundational components that power multiple business modules (Finance, HR, Projects, etc.) and should be built and maintained as shared services.

## Structure
- **request-system/**: Dynamic request engine (forms, metadata, workflow)
- **authentication/**: User authentication and authorization
- **notification/**: Notification, email, reminders
- **file-storage/**: Document upload, storage, and retrieval
- **audit-trail/**: System-wide audit logging
- **user-team-management/**: User, team, and role management

## Principles
- **Reusability:** Core features are designed to be used across all modules.
- **Extensibility:** New features or modules should integrate with these services, not duplicate them.
- **Consistency:** Provides a standard way to handle requests, approvals, files, users, etc.

## How to Use
- When adding a new cross-cutting feature, create a new folder here and document its API and integration points.
- Business modules should consume these services via well-defined APIs.

---

For questions on structure or contribution guidelines, see the project technical documentation.
