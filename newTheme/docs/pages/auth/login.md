# Page: Login

- URL: `/login/`
- Template: `templates/pages/auth/login.php`
- Roles: Public (unauthenticated)

## About
Authentication entry point for the portal. Collects corporate email and password and issues JWT tokens on success. Aligned with custom RBAC and JWT backend.

## Layout
- Centered card with portal branding
- Form: Email, Password, Remember me, Submit button
- Footer links: Forgot password, Help

## Sections
1. Hero header (logo + title)
2. Login form (email, password, remember me)
3. Footer actions (forgot password)

## PRD
- Purpose: Allow users to authenticate using corporate email and password.
- Success: Valid credentials return JWT; user redirected to role-specific dashboard.
- Failure: Clear error messaging; no email enumeration; throttle on repeated failures (backend).

## FRD
- Inputs:
  - Email (required, must end with `@stanforteedge.com`)
  - Password (required)
  - Remember me (optional)
- Validation (client): email domain check; non-empty password
- API:
  - POST `/wp-json/api/v1/auth/login`
  - Request: `{ email: string, password: string }`
  - Response (success):
    ```json
    {"success":true,"data":{"message":"Login successful","tokens":{"access_token":"<JWT>","refresh_token":"<JWT>","expires_in":3600},"user":{"id":1,"roles":["staff"]}}}
    ```
  - Response (error): `{ "success": false, "error": { "code": string, "message": string } }`
- Client Behavior:
  - On success: store `data.tokens.access_token` in `localStorage.jwt_token`; call status endpoint to route by role
  - On error: display `error.message`
- Secondary API:
  - GET `/wp-json/api/v1/auth/status` with `Authorization: Bearer <token>` for routing
- Routing Rules (example):
  - admin → `/admin/dashboard/`
  - hr-manager → `/hr/dashboard/`
  - accountant → `/finance/dashboard/`
  - staff → `/dashboard/`

## States
- Loading: disable button; show spinner
- Error: inline field errors + toast
- Success: toast + redirect

## Security
- JWT only (no WP cookies)
- Prevent email enumeration; rate-limit (backend)
