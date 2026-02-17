# StanforteEdge Staff Portal – RBAC Matrix (Initial Draft)

This matrix defines which roles have access to which core features and actions. It will be updated as new modules are added.

| Endpoint/Action                  | Admin | Staff | Team Lead | Finance Officer | CEO | COO | Board Member | Auditor |
|----------------------------------|:-----:|:-----:|:---------:|:---------------:|:---:|:---:|:------------:|:-------:|
| /api/users (CRUD)                |   ✔   |       |           |                 |     |     |              |         |
| /api/roles (CRUD)                |   ✔   |       |           |                 |     |     |              |         |
| /api/teams (CRUD)                |   ✔   |       |           |                 |     |     |              |         |
| /api/expenses (submit)           |   ✔   |   ✔   |     ✔     |        ✔        |  ✔  |  ✔  |      ✔       |         |
| /api/expenses (view own)         |   ✔   |   ✔   |     ✔     |        ✔        |  ✔  |  ✔  |      ✔       |    ✔    |
| /api/expenses (approve team)     |   ✔   |       |     ✔     |        ✔        |  ✔  |  ✔  |      ✔       |         |
| /api/expenses (final approve)    |   ✔   |       |           |        ✔        |  ✔  |  ✔  |      ✔       |         |
| /api/expenses (view all)         |   ✔   |       |     ✔     |        ✔        |  ✔  |  ✔  |      ✔       |    ✔    |
| /api/audit-logs (view)           |   ✔   |       |           |        ✔        |  ✔  |  ✔  |      ✔       |    ✔    |
| /api/docs (Swagger)              |   ✔   |   ✔   |     ✔     |        ✔        |  ✔  |  ✔  |      ✔       |    ✔    |

- ✔ = has access
- Blank = no access

**Notes:**
- "Team Lead" acts as the primary approver for their department/team.
- "Finance Officer" handles financial processing and may have approval rights.
- "CEO/COO/Board Member" may have final approval or oversight, as required by workflow.
- "Auditor" has read-only access for compliance.
- This matrix will be updated as new modules and endpoints are added.
