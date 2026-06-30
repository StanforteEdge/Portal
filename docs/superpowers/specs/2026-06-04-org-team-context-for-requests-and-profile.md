# Org/Team Context for Requests, Profile & HR

## Problem

1. **Organization not stored in FK column** — `createRequest()` writes `organization_id` into `data` JSON field but not the `RequestInstance.organizationId` FK column. The FK column exists but is only used by manual entry.

2. **Team not displayed** — `teamId` FK is stored on `RequestInstance` but not resolved/displayed in the request detail view.

3. **Org-unaware team filter** — team dropdown shows all user's teams regardless of selected org. Should filter by org.

4. **Duplicated org/team on EmployeeProfile** — `primaryOrganizationId` and `primaryTeamId` on `EmployeeProfile` duplicate data already in `ProfileOrganization` and `GroupUser`. This causes inconsistent display (HR employee list reads one source, edit form shows another).

5. **Groups not org-aware** — "Administration" must be created per-org instead of one group linked to multiple orgs.

## Approach

Approach A — minimal changes, existing schema supports the model.

## Data Model Changes

### Remove from EmployeeProfile

```prisma
model EmployeeProfile {
  // REMOVE these two fields:
  // primaryOrganizationId  Organization?  @relation(...)
  // primaryTeamId          Group?         @relation(...)
}
```

### Add to GroupUser

```prisma
model GroupUser {
  // ADD:
  isPrimary  Boolean  @default(false)
}
```

### Single source of truth

| Concept | Table | Flag |
|---------|-------|------|
| User's org membership | `ProfileOrganization` | `isPrimary` |
| User's team membership | `GroupUser` | `isPrimary` (new) |

## API Changes

### New: `GET /groups/for-user`

Query param: `?organizationId=<bigint>`

Returns groups where:
- Current user is a member (`GroupUser.userId = :profileId`)
- Group is linked to the org (`Group.organizationId = :orgId` OR `GroupOrganization.organizationId = :orgId`)

Response:
```json
[
  { "id": 1, "name": "Administration", "type": "department", "role": "member" }
]
```

Guard: authenticated. Purpose: powers cascading team dropdown.

### Update: `POST /requests`

- Add `organization_id` to `CreateRequestDto` (top-level BigInt field, alongside `team_id`)
- Write to `RequestInstance.organizationId` FK
- Keep inside `data` JSON for backward compat

### Update: `GET /requests/:id`

- Include resolved `organization.name` and `group.name` (team) in response
- These display in the "work context" section of request detail

### Update: HR employee endpoints

- `GET /hr/employees` — select org from `ProfileOrganization`, team from `GroupUser` (use `isPrimary` flag for the displayed org/team)
- Profile view — same approach
- Employee edit form — save to `ProfileOrganization`/`GroupUser` instead of `EmployeeProfile.primaryOrganizationId`/`primaryTeamId`

## Frontend Changes

### Request creation cascading dropdown

```
┌─ Organization ────────────────────────────────────┐
│  [▼] StanforteEdge Lafiami      (auto if 1 org)  │
└───────────────────────────────────────────────────┘
│  [▼] Administration              (reloaded on     │
│       (filtered by org+user)      org change)     │
│                                    auto if 1      │
└───────────────────────────────────────────────────┘
```

- Org dropdown: `GET /organizations/my`
- On org change → team dropdown: `GET /groups/for-user?organizationId=X`
- Both auto-select if single option

### Request detail

- In "work context" section: show org name + team name from resolved FK relations

### HR employee list/profile

- Read org/team from `ProfileOrganization.isPrimary` + `GroupUser.isPrimary` joins
- Edit form writes to these tables, not `EmployeeProfile`
- Remove org/team fields from EmployeeProfile editor

## Migration Steps

1. Add `isPrimary` to `GroupUser` (nullable, backfill: set the single `GroupUser` per user as primary; if multiple, leave null)
2. Remove `primaryOrganizationId` + `primaryTeamId` from `EmployeeProfile`
3. Migrate existing `RequestInstance` rows: copy `data->>'organization_id'` into `organizationId` FK column where set
4. Seed `GroupOrganization` rows for groups that should span multiple orgs
5. Deploy API changes, then frontend changes

## Files to Change

**Schema/migrations:**
- `api/prisma/schema.prisma`

**API:**
- `api/src/modules/requests/requests.service.ts` — createRequest, detail response
- `api/src/modules/requests/requests.controller.ts` — new group-for-user endpoint
- `api/src/modules/requests/dto/create-request.dto.ts` — add organization_id
- `api/src/modules/requests/dto/request-response.dto.ts` — add org/team names
- `api/src/modules/groups/groups.service.ts` — new forUser method
- `api/src/modules/groups/groups.controller.ts` — new GET /for-user
- `api/src/modules/hr/hr.service.ts` — employee list/profile queries
- `api/src/modules/users/users.service.ts` — profile query

**Frontend:**
- `apps/pwa/src/pages/requests/new/RequestFormPage.tsx` — cascading dropdown, send org_id
- `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` — display org+team in work context
- `apps/pwa/src/pages/requests/requests-api.ts` — update create payload

**Shared:**
- `apps/shared/src/api/request-api.ts` — update types
