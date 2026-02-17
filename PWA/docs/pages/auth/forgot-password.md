# Page: Forgot Password

- URL: `/forgot-password/`
- Template: `templates/pages/auth/password-forgot.php`
- Roles: Public (unauthenticated)

## PRD
- Purpose: Allow users to request a password reset email.
- Success: Always show generic success message to avoid email enumeration.

## FRD
- Inputs:
  - Email (required, `@stanforteedge.com`)
- Validation (client): domain check
- API:
  - POST `/wp-json/api/v1/auth/forgot-password`
  - Request: `{ email: string }`
  - Response (success): `{ "success": true, "data": { "message": "If the email exists, a reset link has been sent." } }`
  - Response (error): `{ "success": false, "error": { "code": string, "message": string } }`
- Client Behavior:
  - Show success toast regardless; no redirect

## States
- Loading: disable button; show spinner
- Error: show toast but keep generic copy in success path

## Security
- No info leak on whether email exists
