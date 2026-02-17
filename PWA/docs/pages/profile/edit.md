# Page: Profile • Edit

- URL: `/profile/edit/`
- Template: `templates/pages/profile/edit.php`
- Roles: All authenticated users

## About
Profile editing interface for users to update their personal information, employment details, security settings, and account preferences. Provides secure, validated profile management.

## Layout
1. Profile tabs
   - Personal Information, Employment Details, Security, Preferences
2. Form sections with validation
   - Real-time validation feedback and error messages
   - Required field indicators and help text
3. Save controls
   - Save changes, discard changes, preview profile
4. Change confirmation
   - Email verification for sensitive changes

## Sections
- Personal Tab: Name, contact details, address, emergency contacts
- Employment Tab: Job title, department, manager (read-only for most users)
- Security Tab: Password change, two-factor auth, login sessions
- Preferences Tab: Notification settings, display options, language

## PRD
- Goal: Enable secure, user-friendly profile management
- Success Criteria: Complete profile updates, data validation, change confirmation
- Constraints: Privacy compliance, data integrity, security requirements

## FRD
- Inputs: Personal data, security settings, preference selections
- Client Validation: Email format, password strength, required fields
- API Contracts:
  - GET `/wp-json/api/v1/profile` (current profile data)
  - PUT `/wp-json/api/v1/profile` (update profile)
  - PUT `/wp-json/api/v1/profile/security` (security updates)
  - POST `/wp-json/api/v1/profile/verify-email` (email verification)
- Behavior: Auto-save drafts, change confirmation dialogs, email verification
- Permissions: Users can only edit their own profile data

## States
- Loading: Form skeleton with loading indicators
- Editing: Real-time validation and unsaved changes warnings
- Saving: Progress indicators and success confirmations
- Verification: Email verification flow for security changes
