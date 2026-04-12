# 15-Minute Launch Smoke Test

## Pre-check (2 min)
- API running and reachable at `/v1/health`.
- PWA running with correct `VITE_API_BASE_URL`.
- DB migrated: `npm run prisma:migrate -w api`.
- Baseline seeded: `npm run seed:release-baseline -w api`.

## Auth + Role Guard (3 min)
- Login as `admin` and open:
  - `/app/admin/documents`
  - `/app/hr`
  - `/app/finance`
- Login as `staff` and verify direct URL block for:
  - `/app/admin/documents`
  - `/app/hr`
  - `/app/finance`
- Expected: redirected to `/app/dashboard`.

## Documents + Ack (4 min)
- As admin, create/publish one policy in `/app/admin/documents/new`.
- As staff, open `/app/documents` and filter `policy` + `published`.
- Open/preview the policy and click `Acknowledge`.
- Verify admin document detail shows acknowledgement row.

## Onboarding Policy Binding (4 min)
- As admin, open `/app/admin/forms/:id` (onboarding form).
- Add field type `document_acknowledgement` and bind created policy.
- As staff, submit onboarding form:
  - Must read doc section
  - Must tick acknowledgement checkbox
- Verify:
  - Form submission created
  - Document acknowledgement created (same user + version)

## Finance Flow Spot Check (2 min)
- Create request -> send -> approve -> clear -> disburse.
- Confirm request appears in correct lists and role views.

## Exit Criteria
- No 500s in core flow.
- Role guards and menu filters both working.
- Policy acknowledgement recorded and visible.
