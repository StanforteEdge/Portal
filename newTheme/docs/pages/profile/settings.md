# Page: Profile • Settings

- URL: `/profile/settings/`
- Template: `templates/pages/profile/settings.php`
- Roles: All authenticated users

## About
Personal settings interface for users to manage account settings, including password changes, two-factor authentication, login sessions, notification preferences, and display preferences.

## Layout
1. Security dashboard
   - Account security status, recent login activity, security alerts
   - Security score and improvement recommendations
2. Password management
   - Current password change, password strength requirements
   - Password history and reset options
3. Two-factor authentication
   - 2FA setup and configuration, backup codes management
   - Authentication method preferences
4. Session management
   - Active sessions display, remote logout capabilities
   - Session timeout configuration and device management
5. Notification preferences
   - Email, SMS, and in-app notification preferences
6. Display preferences
   - Theme, language, timezone, and other display settings

## Sections
- Security Overview: Account security status and recent activity
- Password Settings: Password change and security requirements
- Two-Factor Auth: 2FA setup, backup codes, and recovery options
- Session Control: Active sessions management and device tracking
- Security Preferences: Login notifications and security alerts
- Notification Preferences: Email, SMS, and in-app notification preferences
- Display Preferences: Theme, language, timezone, and other display settings

## PRD
- Goal: Enable users to manage their account settings effectively
- Success Criteria: Secure password management, successful 2FA setup, session control
- Constraints: Security policies, authentication standards, privacy requirements

## FRD
- Inputs: Password changes, 2FA setup codes, session selections, security preferences
- Client Validation: Password strength requirements, valid 2FA codes, secure preferences
- API Contracts:
  - POST `/wp-json/api/v1/auth/change-password` (change password)
  - GET `/wp-json/api/v1/profile` (get current user profile)
  - PATCH `/wp-json/api/v1/profile` (update user profile)
  - PUT `/wp-json/api/v1/profile/preferences` (update user preferences)
  - GET `/wp-json/api/v1/auth/sessions` (get user sessions)
  - DELETE `/wp-json/api/v1/auth/sessions/{session_id}` (terminate session)
  - POST `/wp-json/api/v1/auth/two-factor/setup` (setup 2FA)
  - POST `/wp-json/api/v1/auth/two-factor/verify` (verify 2FA code)
  - POST `/wp-json/api/v1/auth/two-factor/disable` (disable 2FA)

- Behavior: Password validation, 2FA code verification, secure session termination, preference updates, 2FA setup and disable
- Permissions: Users can only manage their own settings

## States
- Overview: Security dashboard with status and recent activity
- Changing: Password change with validation and confirmation
- Setting Up: 2FA configuration with code verification
- Managing: Session control and security preference updates
- Disabling: 2FA disable confirmation
- Terminating: Session termination confirmation


