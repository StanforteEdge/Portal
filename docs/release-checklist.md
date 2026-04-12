# Release Checklist (Finance Request Launch)

## 1. Database + Seed
- Run migrations: `npm run prisma:migrate -w api`
- Generate client: `npm run prisma:generate -w api`
- Seed baseline: `npm run seed:release-baseline -w api`
- Seed documents only (optional): `npm run seed:documents -w api`
- Seed first admin user: `npm run seed:first-user -w api`

## 2. Environment
- API env:
  - `DATABASE_URL`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - SMTP values (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`)
  - Upload rules (`FILE_UPLOAD_MAX_MB`, `FILE_UPLOAD_ALLOWED_MIME`)
- PWA env:
  - `VITE_API_BASE_URL`
  - `VITE_UPLOAD_MAX_MB`
  - `VITE_UPLOAD_ALLOWED_TYPES`

## 3. Core Smoke Test
- Auth: login, forgot password, reset password
- Request flow:
  - create request
  - submit
  - approval(s)
  - accountant clear
  - disburse (PV)
  - requester confirm
  - requester retirement
  - finance verify + complete
- Downloads:
  - request pdf
  - pv pdf
  - request + attachments
  - pv + retirement attachments
- Profile + onboarding:
  - invite user
  - accept invite
  - onboarding progress visible in `/app/onboarding`
  - profile page shows read-only employment block

## 4. RBAC
- Roles page loads
- Role permission matrix save works
- User role assignment works
- Non-admin cannot access admin routes
- Sidebar menu is role-filtered:
  - Staff/common menus always visible
  - Finance menus only for `accountant`, `finance_manager`, `admin`
  - HR menus only for `hr`, `admin`
  - Admin menus only for `admin`

## 5. Files
- My Media loads only own uploads
- Upload respects mime/size rules
- Delete blocked when file is attached
- Media picker works in:
  - request create item file
  - finance disbursement evidence
  - retirement files

## 6. Audit + Notification
- Audit logs for request actions and PV lifecycle events
- Email logs show send status
- SMTP send works in production credentials

## 7. Build + Deploy
- PWA build: `npm run build -w PWA`
- API build: `npm run build -w api`
- Tag release after smoke test pass

## 8. HR Readiness
- HR employee list loads (`/app/hr/employees`)
- HR can create employee record (or attach to existing user)
- HR can edit job title/JD/manager/employment status
- HR action flow works (`activate`, `suspend`, `exit`)
- Employee summary cards reflect onboarding + active/inactive counts

## 9. Documents + Acknowledgements
- Documents list works for staff (`/app/documents`)
- Policy filters work (category/status/search)
- Admin can create/edit/publish documents (`/app/admin/documents`)
- Document supports either HTML content or attached file
- Acknowledgement can be recorded and seen in admin document details
- Form field type `document_acknowledgement` can bind a document
- Onboarding submit enforces acknowledgement for bound policy fields
- If document version changes, re-ack can be tested against new version
