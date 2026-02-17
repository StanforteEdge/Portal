# Page: Profile • View

- URL: `/profile/`
- Template: `templates/pages/profile/view.php`
- Roles: All authenticated users

## About
Personal profile view for users to see their employment information, contact details, and account settings. Provides read-only access to profile data with links to edit functionality.

## Layout
1. Profile header
   - Avatar, name, job title, department
   - Contact information, employee ID
2. Employment details section
   - Job information, manager, hire date, employment status
   - Compensation details (salary, benefits)
3. Personal information
   - Address, emergency contacts, personal details
4. Account settings
   - Security preferences, notification settings
   - Account status, last login information

## Sections
- Header Card: Profile photo, basic info, quick actions
- Employment Tab: Job details, organizational info
- Personal Tab: Contact details, emergency contacts
- Security Tab: Password settings, two-factor auth, login history
- Settings Tab: Notification preferences, display options

## PRD
- Goal: Provide comprehensive profile access for all users
- Success Criteria: Clear information display, intuitive navigation, privacy compliance
- Constraints: Respect data privacy, audit access to sensitive information

## FRD
- Inputs: Tab navigation, action buttons (edit profile, change password)
- Client Validation: None (read-only view)
- API Contracts:
  - GET `/wp-json/api/v1/profile` (full profile data)
  - GET `/wp-json/api/v1/profile/security` (security settings)
- Behavior: Load profile data on mount; cache for session
- Permissions: Users can only view their own profile

## States
- Loading: Skeleton layout matching final structure
- Complete: Full profile data displayed
- Partial: Show available data, indicate missing sections
- Error: Toast with retry; show cached data if available
