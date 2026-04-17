# Groups API Rollout Checklist (April 17, 2026)

## Context
- Production docs (`https://api.stanforteedge.com/docs`) currently expose `/v1/teams` routes.
- Local docs (`http://localhost:3000/docs`) expose `/v1/groups` routes.
- Frontend pages such as `/admin/groups` and HR staff edit profile now read groups from `/v1/groups`.

## Goal
Deploy backend build that includes `GroupsController` so production serves `/v1/groups` and matches current frontend behavior.

## Required Backend State
- `app.setGlobalPrefix('v1')` is enabled.
- `GroupsModule` is imported in `api/src/app.module.ts`.
- `GroupsController` routes are registered under `/v1/groups`.

## Post-Deploy Verification
1. Open `https://api.stanforteedge.com/docs-json`.
2. Confirm these paths exist:
   - `/v1/groups` (GET, POST)
   - `/v1/groups/{id}` (GET, POST)
   - `/v1/groups/{id}/members` (POST)
   - `/v1/groups/{id}/organizations` (POST)
3. Confirm `/admin/groups` loads without `Cannot GET /v1/groups`.
4. Confirm HR staff edit profile page shows group options in the Teams/Groups selector.

## Expected Outcome
- Production and local API docs align on `groups`.
- Group-dependent admin and HR pages populate values correctly.
