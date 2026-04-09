# Stitch Prompt: Staff Portal Auth Pages (Desktop + Mobile)

Design the complete authentication flow for **Stanforte Edge Staff Portal (PWA2)** using the already-approved visual system and app shell language.

## Pages to design
1. Login
2. Forgot Password
3. Reset Password
4. Accept Invite / Activate Account
5. Session Expired / Re-auth prompt state

## Output requirements
- Provide each page in desktop and mobile variants.
- Keep visual consistency with approved Stanforte Edge brand direction (color hierarchy, typography rhythm, spacing, rounded cards, icon style).
- Maintain strong visual hierarchy and calm enterprise tone.
- Include clear loading, success, error, and disabled states for all primary actions.
- Include accessibility-ready patterns: visible focus states, readable error messaging, high-contrast controls, large touch targets.

## Content and behavior to represent
- Login: work email + password + forgot password path.
- Forgot Password: email capture and success confirmation messaging.
- Reset Password: token context, new password, confirm password, validation state.
- Accept Invite: token, first name, last name, password, completion confirmation. This page is accessed from email links, not from the login page.
- Session Expired: quick re-auth pattern that preserves user context.

## Guardrails
- Do not redesign global navigation patterns outside auth context.
- Keep forms production-friendly for React + Tailwind implementation.
- Prioritize clarity and speed of completion over decorative complexity.
