# Authentication & Authorization (Core Feature)

## Overview
This core service provides secure user authentication and authorization for the entire portal. It supports JWT-based authentication, role-based access control (RBAC), and integration with team and module permissions.

## Key Capabilities
- JWT login and token refresh
- Password management (reset, change, policy)
- Role and permission assignment
- Integration with user/team management
- API protection and middleware

## Why Core?
- Used by all modules for access control
- Ensures consistent security across the platform
- Extensible for SSO, OAuth, or external identity providers

## Structure
- /api-spec.md: API endpoints for authentication
- /roles-permissions.md: Permission model and RBAC

---

See technical documentation for implementation details.
