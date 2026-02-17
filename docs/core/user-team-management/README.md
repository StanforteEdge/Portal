# User & Team Management (Core Feature)

## Overview
Central service for managing users, teams, roles, and their relationships. Supports multi-team membership and integration with approval routing and permissions.

## Key Capabilities
- User creation, profile, and status
- Team creation and membership (users can belong to multiple teams)
- Team lead and management roles
- Role and permission assignment
- Integration with authentication and workflow

## Why Core?
- All modules depend on user/team context for routing, permissions, and reporting
- Enables flexible org structures (matrix, project-based, etc.)

## Structure
- /api-spec.md: User/team endpoints
- /integration.md: How modules use user/team data

---

See technical documentation for org model and integration.
