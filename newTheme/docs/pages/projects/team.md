# Page: Projects • Team

- URL: `/projects/team/{id}/`
- Template: `templates/pages/projects/team.php`
- Role: `project-manager`

## About
Project team management interface for project managers to assemble project teams, assign roles, track team member contributions, and manage team communications and performance.

## Layout
1. Team overview dashboard
   - Team composition, role distribution, contribution metrics
   - Team performance indicators and workload balance
2. Team member management
   - Current team members with roles, responsibilities, and status
   - Team member addition and removal capabilities
3. Role assignment matrix
   - Project roles and responsibilities definition
   - Skill matching and capacity planning

## Sections
- Team Overview: Team composition and performance metrics
- Member Management: Individual team member profiles and assignments
- Role Definitions: Project role descriptions and responsibility matrices
- Capacity Planning: Workload distribution and resource allocation
- Communication Tools: Team collaboration and communication features

## PRD
- Goal: Enable effective project team assembly and management
- Success Criteria: Clear role definitions, balanced workloads, team performance tracking
- Constraints: Resource availability, skill requirements, team size limits

## FRD
- Inputs: Team member selections, role assignments, capacity allocations
- Client Validation: Skill matching, availability conflicts, team size limits
- API Contracts:
  - GET `/wp-json/api/v1/projects/{id}/team` (current team members)
  - PUT `/wp-json/api/v1/projects/{id}/team` (update team assignments)
  - GET `/wp-json/api/v1/users/available?skills=` (available team members)
  - GET `/wp-json/api/v1/projects/roles` (available project roles)
- Behavior: Skill matching algorithms, conflict detection, automated notifications
- Permissions: Project managers can manage teams for their assigned projects

## States
- Planning: Team assembly and role assignment phase
- Active: Team working with performance tracking and adjustments
- Adjustment: Team composition changes and rebalancing
- Completion: Team performance evaluation and feedback collection
