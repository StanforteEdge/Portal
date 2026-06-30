# Org/Team Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix org/team context for requests, profile, HR employee display — org → FK column, cascading team dropdown filtered by org, request detail display, single source of truth for user org/team membership.

**Architecture:** Backend schema changes (remove EmployeeProfile.primaryOrganizationId/primaryTeamId, add GroupUser.isPrimary), new API endpoint for org-filtered teams, update request create/detail DTOs, frontend cascading dropdown + display.

**Tech Stack:** NestJS, Prisma/Postgres, React 18, Vite, Tailwind

---

### Task 1: Prisma schema changes

**Files:**
- Modify: `api/prisma/schema.prisma`

- [ ] **Step 1: Remove primaryOrganizationId and primaryTeamId from EmployeeProfile**

In the `EmployeeProfile` model, delete these lines:
```prisma
primaryTeamId         BigInt?          @map("primary_team_id")
primaryOrganizationId BigInt?          @map("primary_organization_id")
```
And delete these relations:
```prisma
primaryTeam         Group?        @relation(fields: [primaryTeamId], references: [id], onDelete: SetNull)
primaryOrganization Organization? @relation(fields: [primaryOrganizationId], references: [id], onDelete: SetNull)
```
And delete these indices:
```prisma
@@index([primaryTeamId])
@@index([primaryOrganizationId])
```

- [ ] **Step 2: Add isPrimary to GroupUser**

After `addedBy  BigInt?       @map("added_by")` in `GroupUser`, add:
```prisma
isPrimary  Boolean  @default(false) @map("is_primary")
```

- [ ] **Step 3: Generate Prisma migration**

Run: `pnpm run prisma:migrate -w api --name org-team-context-single-source`
Expected: Migration created and applied

- [ ] **Step 4: Regenerate Prisma client**

Run: `pnpm run prisma:generate -w api`
Expected: Client regenerated

- [ ] **Step 5: Commit**

```bash
git add api/prisma/
git commit -m "db: remove EmployeeProfile primary org/team, add GroupUser.isPrimary"
```

---

### Task 2: Remove EmployeeProfile primaryOrganizationId/primaryTeamId from service code

**Files:**
- Modify: `api/src/modules/hr/hr.service.ts`
- Modify: `api/src/modules/users/users.service.ts`
- Modify: `api/src/modules/hr/dto/` (employee update/create DTOs if they reference these fields)

- [ ] **Step 1: Find all references to EmployeeProfile.primaryOrganizationId and primaryTeamId**

Run: `rg "primaryOrganizationId|primaryTeamId|primary_organization_id|primary_team_id" api/src/ --type ts`
Expected: list every file referencing these fields

- [ ] **Step 2: Update each reference**

For each file found:
- If it reads `employeeProfile.primaryOrganizationId` → replace with `organizations.find(o => o.isPrimary)?.organizationId` from `ProfileOrganization`
- If it reads `employeeProfile.primaryTeamId` → replace with `groups.find(g => g.isPrimary)?.groupId` from `GroupUser`
- If a DTO includes these fields → remove them

Key changes:

In `users.service.ts` `getMyProfile`, remove from include:
```ts
primaryTeam: {
  select: { id: true, name: true, type: true }
},
primaryOrganization: {
  select: { id: true, name: true, code: true }
}
```
And in `serializeProfile`, replace references to `employeeProfile.primaryOrganization`/`employeeProfile.primaryTeam` with:
```ts
primary_organization: user.organizations.find(o => o.isPrimary)?.organization ?? null,
primary_team: user.groups.find(g => g.isPrimary)?.group ?? null,
```

In `hr.service.ts`:
- `listEmployees` — remove `where.primaryOrganizationId` filter line. Replace with join-based filtering via `ProfileOrganization`.
- `employeeInclude` — remove `primaryTeam` and `primaryOrganization` includes
- `serializeEmployee` — read org/team from `organizations[].isPrimary` and `groups[].isPrimary`

- [ ] **Step 3: Check HR DTOs**

Read `api/src/modules/hr/dto/` for any create/update employee DTO that references primaryOrganizationId or primaryTeamId. Remove those fields.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/hr/ api/src/modules/users/
git commit -m "refactor: replace EmployeeProfile org/team with ProfileOrganization+GroupUser"
```

---

### Task 3: API — Add organization_id to CreateRequestDto and fix createRequest

**Files:**
- Modify: `api/src/modules/requests/dto/create-request.dto.ts`
- Modify: `api/src/modules/requests/requests.service.ts`

- [ ] **Step 1: Add organization_id to CreateRequestDto**

In `create-request.dto.ts`, add after `team_id`:
```ts
@ApiPropertyOptional({ example: '1' })
@IsOptional()
@IsString()
@Matches(/^\d+$/, { message: 'organization_id must be a numeric id' })
organization_id?: string;
```

- [ ] **Step 2: Update createRequest in requests.service.ts**

In the `RequestInstance.create` call in `createRequest`, add after `teamId`:
```ts
organizationId: dto.organization_id ? toBigInt(dto.organization_id) : null,
```

Also promote it from `data` JSON if provided there but not as top-level:
After the `created` block, add a fallback that copies from `data.organization_id` if the FK wasn't explicitly set:
```ts
// Fallback: promote organization_id from data JSON to FK if not set
if (!dto.organization_id && dto.data?.organization_id) {
  await tx.requestInstance.update({
    where: { id: created.id },
    data: { organizationId: toBigInt(String(dto.data.organization_id)) }
  });
}
```

Actually simpler: just set it from either source at the top:
```ts
const organizationId = dto.organization_id || dto.data?.organization_id || null;
```
Then use `organizationId` in the `create` data.

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/
git commit -m "feat(api): add organization_id to request create dto + FK column"
```

---

### Task 4: API — New GET /groups/for-user endpoint

**Files:**
- Modify: `api/src/modules/groups/groups.controller.ts`
- Modify: `api/src/modules/groups/groups.service.ts`

- [ ] **Step 1: Add forUser method to GroupsService**

In `groups.service.ts`, add:
```ts
async forUser(profileId: string, organizationId?: string) {
  const userId = this.parseId(profileId, 'profile id');

  const where: Prisma.GroupWhereInput = {
    members: { some: { userId } },
    isActive: true
  };

  if (organizationId) {
    const orgId = this.parseId(organizationId, 'organization id');
    where.OR = [
      { organizationId: orgId },
      { organizationMappings: { some: { organizationId: orgId } } }
    ];
  }

  const groups = await this.prisma.group.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true } },
      organizationMappings: {
        where: organizationId ? { organizationId: this.parseId(organizationId, 'organization id') } : undefined,
        include: { organization: { select: { id: true, name: true } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  return groups.map((g) => ({
    id: String(g.id),
    name: g.name,
    type: g.type,
    organization_id: String(g.organizationId),
    organization_name: g.organization?.name ?? null,
  }));
}
```

- [ ] **Step 2: Add forUser endpoint to GroupsController**

Add before `@Get(':id')`:
```ts
@Get('for-user')
@ApiOperation({ summary: 'List groups the current user belongs to, optionally filtered by org' })
@Permissions()  // authenticated only — no specific permission needed
async forUser(@Req() req: any, @Query('organization_id') organizationId?: string) {
  return this.groupsService.forUser(req.user?.id, organizationId);
}
```

- [ ] **Step 3: Import Prisma types in GroupsService**

Ensure `Prisma` is imported from `@prisma/client` (already is).

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/groups/
git commit -m "feat(api): add GET /groups/for-user endpoint filtered by org"
```

---

### Task 5: API — Include org/team names in request detail response

**Files:**
- Modify: `api/src/modules/requests/requests.service.ts`
- Modify: `api/src/modules/requests/dto/request-response.dto.ts`

- [ ] **Step 1: Check the getRequest method's include**

Find `getRequest` in `requests.service.ts`. Ensure the `include` for RequestInstance inclues `organization` and `team` relations:
```ts
organization: { select: { id: true, name: true, code: true } },
team: { select: { id: true, name: true, type: true } },
```

- [ ] **Step 2: Add team to RequestResponseDto**

In `request-response.dto.ts`, after the `organization` property, add:
```ts
@ApiProperty({ required: false, nullable: true })
team?: {
  id: string;
  name: string;
  type: string;
} | null;
```

- [ ] **Step 3: Check serialization in getRequest**

Find where the response is serialized and ensure `team` is included in the returned object. If the method returns the raw object from Prisma, it may already be passed through. If it has manual serialization, add:
```ts
team: request.team ? { id: String(request.team.id), name: request.team.name, type: request.team.type } : null,
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/requests/
git commit -m "feat(api): include team name in request detail response"
```

---

### Task 6: Frontend — Cascading org/team dropdown on request creation

**Files:**
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`
- Modify: `apps/pwa/src/pages/requests/requests-api.ts` (if create payload needs org_id)

- [ ] **Step 1: Read current RequestFormPage.tsx**

Read the full file to understand current org/team selectors, state, and create payload structure.

- [ ] **Step 2: Update create payload in requests-api.ts**

In the `createRequest` API function, add `organization_id` to the payload:
```ts
body: {
  ...payload,
  organization_id: payload.organization_id || undefined,
  team_id: payload.team_id || undefined,
}
```

- [ ] **Step 3: Implement cascading dropdown in RequestFormPage.tsx**

```tsx
// State
const [organizations, setOrganizations] = useState<Org[]>([]);
const [selectedOrgId, setSelectedOrgId] = useState<string | ''>('');
const [teams, setTeams] = useState<Team[]>([]);
const [selectedTeamId, setSelectedTeamId] = useState<string | ''>('');

// On mount: load user's organizations
useEffect(() => {
  loadOrganizations();
}, []);

// On org change: load teams
useEffect(() => {
  if (selectedOrgId) {
    loadTeamsForOrg(selectedOrgId);
  } else {
    setTeams([]);
  }
}, [selectedOrgId]);

function loadOrganizations() {
  // GET /organizations/my (already exists in shared API)
  // If only 1 org: auto-select
  // Set organizations state
}

function loadTeamsForOrg(orgId: string) {
  // GET /groups/for-user?organization_id=orgId (new endpoint)
  // If only 1 team: auto-select
  // Set teams state
}
```

- [ ] **Step 4: Wire the payload**

When saving, include `organization_id` in the create request body:
```ts
const payload = {
  request_type_id,
  organization_id: selectedOrgId,
  team_id: selectedTeamId,
  data: { ...formData, organization_id: selectedOrgId },
  items,
  total_amount,
  currency,
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/requests/
git commit -m "feat(pwa): cascading org/team dropdown on request form"
```

---

### Task 7: Frontend — Display org/team in request detail work context

**Files:**
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`

- [ ] **Step 1: Read current RequestDetailsPage.tsx**

Find the "work context" section. Read how it currently displays organization (likely from `data.organization_id`).

- [ ] **Step 2: Update to show org + team from the response**

In the work context section, display:
```
Organization: {response.organization?.name ?? '—'}
Team: {response.team?.name ?? '—'}
```

If the response doesn't include `team` yet, it will after Task 5.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/requests/RequestDetailsPage.tsx
git commit -m "feat(pwa): show org+team in request detail work context"
```

---

### Task 8: Frontend — HR employee list reads from membership tables

**Files:**
- Modify: `apps/pwa/src/modules/hr/` (employee list page component)
- Modify: `apps/pwa/src/modules/hr/` (employee detail/profile page)

- [ ] **Step 1: Read current HR employee list page**

Find the component(s) that display the employee list and detail. Note how they currently show org/team.

- [ ] **Step 2: Update display to use membership data**

The API response after Task 2 will return org/team from `ProfileOrganization` + `GroupUser`. The frontend just needs to display:
- `employee.primary_organization?.name` or `employee.organizations?.find(o => o.isPrimary)?.organization?.name`
- `employee.primary_team?.name` or `employee.groups?.find(g => g.isPrimary)?.group?.name`

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/
git commit -m "fix(pwa): HR employee list reads org/team from membership"
```
