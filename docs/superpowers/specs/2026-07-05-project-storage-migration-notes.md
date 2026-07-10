# Project Storage Migration Notes

## Current State (Post-Migration)

- Project storage is now first-class via `sta_projects`, `sta_project_governance`, and `sta_project_members` tables.
- The Projects service, Users profile serialization, and HR employee serialization all read/write from the new tables.
- Groups (`Workspace -> Groups`) no longer include projects.
- Projects (`Workspace -> Projects`) are sourced from the dedicated `/projects` API backed by the new tables.

## Legacy Data

- Legacy `sta_groups(type='project')` rows **still exist** and are **not deleted** by this migration.
- Legacy `sta_group_users` entries for project memberships **still exist** and are **not deleted**.
- No new project writes target `sta_groups(type='project')` after the migration switch.

## Rollback Safety

If rollback is needed:
1. The old project-group rows remain intact in `sta_groups` and `sta_group_users`.
2. Revert the Projects service, Users service, and HR service changes.
3. Profile payloads will again source `projects` from generic group memberships.

## Future Cleanup Phase

A later cleanup should:

1. Remove legacy project-group writes — audit for any remaining code paths that write `Group(type='project')`.
2. Optionally archive or delete legacy project-group rows after verifying no rollback is needed.
3. Migrate any remaining references that still point to group-based project ids (e.g., in request `data` fields, budget scopes, or third-party integrations).
