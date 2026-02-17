# Page: Reset Password

- URL: `/reset-password/?token=<token>`
- Template: `templates/pages/auth/password-reset.php`
- Roles: Public (via emailed token)

## PRD
- Purpose: Allow users to set a new password using a valid reset token.
- Success: Password updated; redirect to login.

## FRD
- Inputs:
  - New Password (required; min 8 chars; letters, numbers, special)
  - Confirm Password (must match)
- Validation (client): regex and match checks; live requirement indicators
- API:
  - POST `/wp-json/api/v1/auth/reset-password`
  - Headers: `Authorization: Bearer <token>` (token from URL)
  - Body: `{ token: string, new_password: string }`
  - Response (success): `{ "success": true, "data": { "message": "Your password has been reset successfully." } }`
  - Response (error): `{ "success": false, "error": { "code": string, "message": string } }`
- Client Behavior:
  - On success: toast + redirect to `/login/`

## States
- Loading: disable submit; spinner
- Errors: inline + toast

## Security
- Use one-time token; expire on use
- No token in logs; mask in UI
