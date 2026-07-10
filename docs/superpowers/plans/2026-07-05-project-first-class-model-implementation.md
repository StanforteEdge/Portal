# Project First-Class Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `Group(type='project')` as the backing storage for projects with a first-class `Project` model while preserving the existing `/projects` API shape as much as possible.

**Architecture:** Introduce dedicated `Project`, `ProjectGovernance`, and `ProjectMember` tables first, migrate existing project-group data into them, then switch the Projects module and workspace/profile payloads to read/write the new tables. Keep the current `/projects` routes and response shape stable so the frontend can continue working with minimal contract churn.

**Tech Stack:** Prisma, PostgreSQL migrations, NestJS services/controllers, React TypeScript frontend, shared resource API client.

---

## File Structure

- Modify: `api/prisma/schema.prisma`
  - Add first-class project tables and relations.
- Create: `api/prisma/migrations/<timestamp>_project_first_class_model/migration.sql`
  - Create tables and migrate existing `sta_groups` project rows.
- Modify: `api/src/modules/projects/projects.service.ts`
  - Switch all project CRUD and membership operations from `group`/`groupUser` to `project`/`projectMember`.
- Modify: `api/src/modules/projects/projects.controller.ts`
  - Preserve route contract while using the new service behavior.
- Modify: `api/src/modules/users/users.service.ts`
  - Stop sourcing `projects` from generic group memberships.
- Modify: `api/src/modules/hr/hr.service.ts`
  - Stop sourcing employee `projects` from generic group memberships.
- Modify: `apps/shared/src/api/resource-api.ts`
  - Preserve the frontend project API contract while adapting any new response details.
- Modify: `apps/pwa/src/shared/api/workspace-api.ts`
  - Keep the workspace profile type aligned with the backend response.
- Modify: `apps/pwa/src/pages/teams/TeamsPage.tsx`
  - Ensure `Workspace -> Groups` excludes projects by construction after backend split.
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
  - Keep linked project tabs aligned with true project records.
- Modify: `apps/pwa/src/pages/projects/ProjectsPage.tsx`
  - Continue using `/projects` without frontend contract breakage.
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`
  - Continue using `/projects/:id` and internal/public tabs with the new data model.
- Create: `api/src/modules/projects/__tests__/projects.service.spec.ts` or extend existing project tests
  - Cover the new data model and migration-compatible API behavior.

## Migration Strategy

The migration should happen in phases:

1. Add new project tables.
2. Copy existing `Group(type='project')` rows into those tables.
3. Copy project memberships from `groupUser` into `projectMember`.
4. Switch project reads/writes to the new tables.
5. Keep old project-group rows untouched for one release to reduce rollback risk.
6. Only after verification, plan a later cleanup migration for legacy project-group rows.

## Response Contract Rule

During this implementation, preserve these `/projects` response fields where they already exist:

```ts
{
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  organizationId: string | null;
  governance: {
    project_code: string | null;
    owner_user_id: string | null;
    start_date: string | null;
    end_date: string | null;
    governance_status: string;
  };
}
```

## Task 1: Add First-Class Project Tables To Prisma

**Files:**
- Modify: `api/prisma/schema.prisma`
- Test: `api/prisma/schema.prisma`

- [ ] **Step 1: Add the new project models to the Prisma schema**

Add models shaped like:

```prisma
model Project {
  id             BigInt   @id @default(autoincrement())
  organizationId BigInt?  @map("organization_id")
  name           String   @db.VarChar(255)
  description    String?
  isActive       Boolean  @default(true) @map("is_active")
  createdBy      BigInt?  @map("created_by")
  updatedBy      BigInt?  @map("updated_by")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization?
  governance   ProjectGovernance?
  members      ProjectMember[]

  @@index([organizationId])
  @@index([isActive])
  @@map("sta_projects")
}

model ProjectGovernance {
  id               BigInt   @id @default(autoincrement())
  projectId        BigInt   @unique @map("project_id")
  projectCode      String?  @map("project_code") @db.VarChar(50)
  ownerUserId      BigInt?  @map("owner_user_id")
  startDate        DateTime? @map("start_date") @db.Date
  endDate          DateTime? @map("end_date") @db.Date
  governanceStatus String   @default("planned") @map("governance_status") @db.VarChar(30)
  metadata         Json?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([ownerUserId])
  @@index([governanceStatus])
  @@map("sta_project_governance")
}

model ProjectMember {
  id        BigInt        @id @default(autoincrement())
  projectId BigInt        @map("project_id")
  userId    BigInt        @map("user_id")
  role      GroupUserRole @default(member)
  joinedAt  DateTime      @default(now()) @map("joined_at")
  addedBy   BigInt?       @map("added_by")
  isPrimary Boolean       @default(false) @map("is_primary")

  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId], name: "unique_project_user")
  @@index([userId])
  @@index([role])
  @@map("sta_project_members")
}
```

- [ ] **Step 2: Add reverse relations to existing models only where immediately needed**

Keep this minimal. Add only the obvious reverse relations, for example on `Organization` and `Profile`, if those models already expose neighboring collections.

- [ ] **Step 3: Run Prisma format**

Run: `npx prisma format --schema api/prisma/schema.prisma`
Expected: Schema formatted successfully.

- [ ] **Step 4: Commit**

```bash
git add api/prisma/schema.prisma
git commit -m "feat(projects): add first-class project models"
```

## Task 2: Write The Migration To Copy Existing Project Groups

**Files:**
- Create: `api/prisma/migrations/<timestamp>_project_first_class_model/migration.sql`
- Test: `api/prisma/migrations/<timestamp>_project_first_class_model/migration.sql`

- [ ] **Step 1: Create the new project tables in SQL**

Add DDL equivalent to the Prisma models above.

- [ ] **Step 2: Copy project rows from `sta_groups` into `sta_projects`**

Use migration SQL shaped like:

```sql
INSERT INTO sta_projects (id, organization_id, name, description, is_active, created_by, updated_by, created_at, updated_at)
SELECT id, organization_id, name, description, is_active, created_by, updated_by, created_at, updated_at
FROM sta_groups
WHERE lower(type) = 'project'
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Copy governance metadata into `sta_project_governance`**

Extract fields from `sta_groups.metadata`:

```sql
INSERT INTO sta_project_governance (project_id, project_code, owner_user_id, start_date, end_date, governance_status, metadata)
SELECT
  g.id,
  g.metadata->>'project_code',
  NULLIF(g.metadata->>'owner_user_id', '')::bigint,
  NULLIF(g.metadata->>'start_date', '')::date,
  NULLIF(g.metadata->>'end_date', '')::date,
  COALESCE(g.metadata->>'governance_status', CASE WHEN g.is_active THEN 'active' ELSE 'archived' END),
  g.metadata
FROM sta_groups g
WHERE lower(g.type) = 'project'
ON CONFLICT (project_id) DO NOTHING;
```

- [ ] **Step 4: Copy project memberships from `sta_group_users` into `sta_project_members`**

Use SQL shaped like:

```sql
INSERT INTO sta_project_members (project_id, user_id, role, joined_at, added_by, is_primary)
SELECT gu.group_id, gu.user_id, gu.role, gu.joined_at, gu.added_by, gu.is_primary
FROM sta_group_users gu
JOIN sta_groups g ON g.id = gu.group_id
WHERE lower(g.type) = 'project'
ON CONFLICT (project_id, user_id) DO NOTHING;
```

- [ ] **Step 5: Do not delete old group records in this migration**

Leave legacy `sta_groups(type='project')` untouched for this release.

- [ ] **Step 6: Run migration locally**

Run: `npm run prisma:migrate -w api -- --name project_first_class_model`
Expected: Migration created and applied successfully.

- [ ] **Step 7: Commit**

```bash
git add api/prisma/migrations api/prisma/schema.prisma
git commit -m "feat(projects): migrate project groups into project tables"
```

## Task 3: Switch ProjectsService To The New Tables

**Files:**
- Modify: `api/src/modules/projects/projects.service.ts`
- Test: `api/src/modules/projects/__tests__/projects.service.spec.ts`

- [ ] **Step 1: Write a failing test for list/get using `project` instead of `group`**

Add a test shaped like:

```ts
it('lists projects from the project table', async () => {
  prisma.project.findMany.mockResolvedValue([
    { id: 1n, name: 'Alpha', description: null, isActive: true, organizationId: 2n, governance: null, members: [] },
  ]);

  const result = await service.list({ active_only: 'true' });

  expect(prisma.project.findMany).toHaveBeenCalled();
  expect(result.items?.[0]?.name ?? result.result?.[0]?.name).toBe('Alpha');
});
```

- [ ] **Step 2: Run the project service test to verify it fails**

Run: `npm test -- api/src/modules/projects/__tests__/projects.service.spec.ts`
Expected: FAIL because the service still uses `prisma.group`.

- [ ] **Step 3: Replace `prisma.group` reads with `prisma.project` reads**

Update service methods:

- `list()` -> `prisma.project.findMany`
- `get()` -> `prisma.project.findUnique`
- `create()` -> `prisma.project.create` + `projectGovernance.create` + `projectMember.create`
- `update()` -> `prisma.project.update` + `projectGovernance.upsert`
- `archive()` / `unarchive()` -> update `project` + `projectGovernance`

Keep the serializer returning the same response shape.

- [ ] **Step 4: Replace `groupUser` membership logic with `projectMember`**

Update:

- `ensureProjectAccess()` -> query `projectMember`
- `addMember()` / `removeMember()` -> use `projectMember`

- [ ] **Step 5: Stop reading governance from `metadata`**

Replace metadata parsing with explicit fields from `projectGovernance`.

- [ ] **Step 6: Run the project service test to verify it passes**

Run: `npm test -- api/src/modules/projects/__tests__/projects.service.spec.ts`
Expected: PASS

- [ ] **Step 7: Run API build and note baseline failures separately**

Run: `npm run build -w api`
Expected: Either PASS, or if the known unrelated baseline failures remain, confirm there are no new project-module failures introduced by this task.

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/projects/projects.service.ts api/src/modules/projects/__tests__/projects.service.spec.ts
git commit -m "refactor(projects): use project tables in service"
```

## Task 4: Keep ProjectsController Stable While Updating DTO Expectations

**Files:**
- Modify: `api/src/modules/projects/projects.controller.ts`
- Modify: `api/src/modules/projects/dto/create-project.dto.ts`
- Modify: `api/src/modules/projects/dto/update-project.dto.ts`

- [ ] **Step 1: Verify existing routes remain unchanged**

Preserve:

```ts
GET /projects
GET /projects/:id
POST /projects
POST /projects/:id
POST /projects/:id/members
DELETE /projects/:id/members/:userId
POST /projects/:id/archive
POST /projects/:id/unarchive
GET /projects/:id/governance
```

- [ ] **Step 2: Keep DTOs focused on first-class project fields**

Ensure DTOs still expose:

- `name`
- `description`
- `organization_id`
- `owner_user_id`
- `project_code`
- `start_date`
- `end_date`
- `governance_status`

Do not add unrelated fields yet.

- [ ] **Step 3: Run API build and inspect controller/project DTO errors only**

Run: `npm run build -w api`
Expected: No new errors in `projects.controller.ts` or project DTO files.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/projects/projects.controller.ts api/src/modules/projects/dto/create-project.dto.ts api/src/modules/projects/dto/update-project.dto.ts
git commit -m "refactor(projects): preserve project route contract"
```

## Task 5: Clean Workspace Profile Payloads

**Files:**
- Modify: `api/src/modules/users/users.service.ts`
- Modify: `api/src/modules/hr/hr.service.ts`
- Modify: `apps/pwa/src/shared/api/workspace-api.ts`

- [ ] **Step 1: Write a failing serialization test note**

Expected profile behavior:

```ts
groups -> non-project groups only
teams -> team/department membership only
projects -> project membership only
```

- [ ] **Step 2: Update users profile serialization**

Change `users.service.ts` so:

```ts
groups: groupMemberships.filter((item: any) => String(item.type).toLowerCase() !== 'project'),
teams: groupMemberships.filter((item: any) => {
  const type = String(item.type).toLowerCase();
  return type === 'team' || type === 'department';
}),
projects: projectMemberships,
```

Where `projectMemberships` comes from the new `projectMember`/`project` relation, not `groupMemberships`.

- [ ] **Step 3: Update HR employee serialization**

Make the same split in `hr.service.ts`:

```ts
teams: groupMemberships.filter((entry: any) => ['team', 'department'].includes(String(entry.type).toLowerCase())),
projects: projectMemberships,
```

- [ ] **Step 4: Keep frontend workspace profile types stable**

Update `apps/pwa/src/shared/api/workspace-api.ts` only if the response shape changes materially. Prefer keeping the same `groups[]`, `teams[]`, `projects[]` fields.

- [ ] **Step 5: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/users/users.service.ts api/src/modules/hr/hr.service.ts apps/pwa/src/shared/api/workspace-api.ts
git commit -m "refactor(workspace): separate projects from group payloads"
```

## Task 6: Update Frontend Group And Project Surfaces To Trust The New Boundary

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamsPage.tsx`
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Modify: `apps/pwa/src/pages/projects/ProjectsPage.tsx`
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`

- [ ] **Step 1: Stop Groups page fallback from using mixed project data**

Prefer explicit non-project groups:

```ts
const groups = profile?.groups ?? [];
```

Do not merge in `profile.projects` here.

- [ ] **Step 2: Stop Group detail from using project entries as group candidates**

Prefer:

```ts
const allGroups = profile?.groups ?? [];
const group = allGroups.find((t: any) => t.id === id);
```

- [ ] **Step 3: Keep Projects page using `/projects` only**

Do not read project membership from generic group lists in project pages.

- [ ] **Step 4: Keep project internal/public tab logic, but trust project identity as first-class**

No major contract change needed here beyond removing fallback assumptions that project is “just a group”.

- [ ] **Step 5: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/teams/TeamsPage.tsx apps/pwa/src/pages/teams/TeamDetailPage.tsx apps/pwa/src/pages/projects/ProjectsPage.tsx apps/pwa/src/pages/projects/ProjectDetailPage.tsx
git commit -m "refactor(workspace): separate group and project surfaces"
```

## Task 7: Add Manual Legacy Cleanup Guardrails

**Files:**
- Modify: `docs/superpowers/specs/2026-07-05-navigation-ia-design.md`
- Create: `docs/superpowers/specs/2026-07-05-project-storage-migration-notes.md`

- [ ] **Step 1: Document that legacy `Group(type='project')` rows remain during transition**

Add a short migration note file describing:

```md
- project storage is now first-class
- legacy project-group rows remain temporarily for rollback safety
- no new project writes should target sta_groups(type='project') after the switch
```

- [ ] **Step 2: Note a later cleanup phase explicitly**

Document that a future cleanup should:

- remove legacy project-group writes
- optionally archive or delete legacy project-group rows
- migrate any remaining references that still point to group-based project ids

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-05-navigation-ia-design.md docs/superpowers/specs/2026-07-05-project-storage-migration-notes.md
git commit -m "docs(projects): add first-class migration notes"
```

## Task 8: Verification And Release Readiness

**Files:**
- Review only unless fixes are required

- [ ] **Step 1: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 2: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 3: Run API build**

Run: `npm run build -w api`
Expected: PASS, or if the known unrelated baseline failures remain, confirm there are no newly introduced project-model failures in:

- `projects.service.ts`
- `projects.controller.ts`
- `users.service.ts`
- `hr.service.ts`
- Prisma-generated project types

- [ ] **Step 4: Manual verification checklist**

Check:

- `/projects` still lists projects
- `/projects/:id` still loads
- creating a new project uses the new tables
- adding/removing project members works
- profile payload shows projects separately from groups
- `Workspace -> Groups` no longer includes projects
- `Workspace -> Projects` still functions normally

- [ ] **Step 5: Final commit for verification fixes only if needed**

```bash
git add api apps/pwa docs
git commit -m "fix(projects): finalize first-class project migration"
```

## Spec Coverage Check

- First-class `Project` DB model: covered in Tasks 1 and 2.
- Preserve `/projects` API shape: covered in Tasks 3 and 4.
- Separate project membership from generic groups: covered in Task 5.
- Stop project leakage into group/workspace surfaces: covered in Task 6.
- Keep storage cleanup phased and reversible: covered in Task 7.
