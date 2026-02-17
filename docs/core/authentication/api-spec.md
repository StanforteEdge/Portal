# Authentication & Authorization – API Specification

## 1. Authentication
### a. Login
- **POST /auth/login**
  - Request:
    ```json
    { "username": "jane.doe", "password": "password123" }
    ```
  - Response:
    ```json
    { "access_token": "jwt-access-token...", "refresh_token": "jwt-refresh-token...", "user": { "id": "u1x2y3z4-...", "username": "jane.doe", "email": "jane@example.com", "roles": ["staff", "team_lead"] } }
    ```

### b. Logout
- **POST /auth/logout**
  - Request: `{ "refresh_token": "..." }`
  - Response: `{ "message": "Logged out" }`

### c. Refresh Token
- **POST /auth/refresh**
  - Request: `{ "refresh_token": "..." }`
  - Response: `{ "access_token": "new-token..." }`

### d. Password Reset
- **POST /auth/password-reset-request**
  - Request: `{ "email": "jane@example.com" }`
  - Response: `{ "message": "Reset email sent" }`
- **POST /auth/password-reset**
  - Request: `{ "token": "reset-token", "new_password": "..." }`
  - Response: `{ "message": "Password reset" }`

### e. Change Password
- **POST /auth/change-password**
  - Auth required
  - Request: `{ "old_password": "...", "new_password": "..." }`
  - Response: `{ "message": "Password changed" }`

---

## 2. User Management
### a. List Users
- **GET /users**
  - Query params: `role`, `team`, `status`
- **POST /users**
  - Create user
- **GET /users/{id}**
  - Get user details
- **PUT /users/{id}**
  - Update user
- **DELETE /users/{id}**
  - Deactivate/delete user

---

## 3. Role & Permission Management
### a. List/Create/Update/Delete Roles
- **GET /roles**
- **POST /roles**
- **PUT /roles/{id}**
- **DELETE /roles/{id}**

### b. Assign Role to User
- **POST /roles/{id}/assign**
  - Request: `{ "user_id": "..." }`

### c. Assign Permissions to Role
- **POST /roles/{id}/permissions**
  - Request: `{ "permission_ids": ["...", "..."] }`

### d. List Permissions
- **GET /permissions**

---

## 4. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 401, "message": "Unauthorized" } }
  ```

---

For more, see the technical spec and DB schema.
