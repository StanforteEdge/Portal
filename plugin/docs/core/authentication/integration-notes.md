# Authentication & Authorization – Integration Notes

## 1. Module Integration
- **All modules** (Finance, HR, Projects, etc.) must require JWT authentication for all endpoints.
- RBAC (Role-Based Access Control) is enforced at the API and business logic level using user roles and permissions.
- User/team context is checked for actions that require team-level or cross-team permissions.

## 2. Core Feature Integration
- **User/Team Management:**
  - User creation and assignment to teams/roles is managed via the user/team management core service.
  - Role changes and team membership updates are reflected in authentication/authorization checks in real time.
- **Audit Trail:**
  - All authentication events (login, logout, password change, failed login, role/permission changes) are logged in the audit trail for compliance and monitoring.
- **Notification:**
  - Security-related actions (password reset, new device login, role assignment) can trigger notifications to users.

## 3. Security Practices
- JWTs are validated on every request to protected endpoints.
- Refresh tokens are securely stored and can be revoked on logout or password change.
- Passwords are never exposed; only hashes are stored.

## 4. Example Integration Flow
- On user login:
  1. User submits credentials to `/auth/login`.
  2. On success, receives JWT and refresh token.
  3. All subsequent requests include JWT in the Authorization header.
  4. Module endpoints check JWT validity and required roles/permissions.
- On role change:
  1. Admin assigns new role to user via `/roles/{id}/assign`.
  2. User's permissions are updated immediately for new sessions.
  3. Audit log records the change.

## 5. Error Handling
- Unauthorized or forbidden actions return standard error responses.
- All auth errors are logged for monitoring.

---

For more, see the technical spec, API spec, and DB schema.
