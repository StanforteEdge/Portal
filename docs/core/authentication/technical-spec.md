# Authentication & Authorization – Technical Specification

## 1. Overview
Provides secure user authentication and authorization for the staff portal backend. Supports JWT-based authentication, role-based access control (RBAC), and integration with user/team management.

---

## 2. Data Model
### a. User
- id (UUID)
- username (string, unique)
- email (string, unique)
- password_hash (string)
- is_active (boolean)
- last_login (timestamp)
- created_at, updated_at

### b. Role
- id (UUID)
- name (string, unique)
- description (string)

### c. Permission
- id (UUID)
- name (string, unique)
- description (string)

### d. UserRole
- user_id (FK)
- role_id (FK)
- assigned_at (timestamp)

### e. RolePermission
- role_id (FK)
- permission_id (FK)

### f. RefreshToken
- id (UUID)
- user_id (FK)
- token (string)
- expires_at (timestamp)
- created_at (timestamp)

---

## 3. API Endpoints
### a. Authentication
- `POST /auth/login` – User login (returns JWT access + refresh tokens)
- `POST /auth/logout` – User logout (invalidates refresh token)
- `POST /auth/refresh` – Refresh JWT access token
- `POST /auth/password-reset-request` – Request password reset (email)
- `POST /auth/password-reset` – Reset password
- `POST /auth/change-password` – Change password (authenticated)

### b. User Management
- `GET /users` – List users
- `POST /users` – Create user
- `GET /users/{id}` – Get user details
- `PUT /users/{id}` – Update user
- `DELETE /users/{id}` – Deactivate/delete user

### c. Role & Permission Management
- `GET /roles` – List roles
- `POST /roles` – Create role
- `PUT /roles/{id}` – Update role
- `DELETE /roles/{id}` – Delete role
- `POST /roles/{id}/assign` – Assign role to user
- `POST /roles/{id}/permissions` – Assign permissions to role
- `GET /permissions` – List permissions

---

## 4. Security Considerations
- Passwords are hashed using bcrypt or Argon2.
- JWT tokens are signed with a strong secret and have short expiry (e.g., 15 minutes for access, 7 days for refresh).
- Refresh tokens are stored securely and can be revoked.
- RBAC enforced on all endpoints and business logic.
- Sensitive actions (role/permission changes, password resets) are logged in the audit trail.

---

## 5. Example API Payloads
### a. Login Request
```json
{
  "username": "jane.doe",
  "password": "password123"
}
```
### b. Login Response
```json
{
  "access_token": "jwt-access-token...",
  "refresh_token": "jwt-refresh-token...",
  "user": {
    "id": "u1x2y3z4-...",
    "username": "jane.doe",
    "email": "jane@example.com",
    "roles": ["staff", "team_lead"]
  }
}
```

---

## 6. Integration Points
- All modules and core features check JWT and RBAC for access control.
- User/team management is integrated for context-aware permissions.
- Audit trail logs all authentication and authorization events.

---

For more, see the API and DB schema documentation in this folder.
