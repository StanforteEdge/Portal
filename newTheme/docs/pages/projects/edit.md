# Page: Projects • Edit

- URL: `/projects/edit/{id}/`
- Template: `templates/pages/projects/edit.php`
- Role: `project-manager`

## About
Project editing interface for project managers to modify project details, update timelines, adjust budgets, and manage team changes throughout the project lifecycle.

## Layout
1. Project header
   - Project name, status, progress percentage, key dates
   - Quick action buttons: save, archive, export
2. Tabbed editing sections
   - Overview: Basic project information and status
   - Timeline: Schedule adjustments and milestone updates
   - Budget: Budget modifications and cost tracking
   - Team: Team member changes and role assignments
   - Stakeholders: Stakeholder updates and communication
3. Change tracking
   - Audit trail of modifications with timestamps
   - Approval requirements for major changes

## Sections
- Project Overview: Core project information and status updates
- Timeline Management: Schedule adjustments and deadline modifications
- Budget Control: Budget revisions and cost variance management
- Team Management: Team member additions, removals, and role changes
- Stakeholder Updates: Stakeholder communication and engagement tracking
- Change History: Complete audit trail of project modifications

## PRD
- Goal: Enable controlled project modifications with proper change management
- Success Criteria: Accurate project updates, stakeholder communication, change tracking
- Constraints: Change approval workflows, budget authority, contract implications

## FRD
- Inputs: Project updates, timeline changes, budget adjustments, team modifications
- Client Validation: Change impact assessment, approval requirements, validation rules
- API Contracts:
  - GET `/wp-json/api/v1/projects/{id}` (current project data)
  - PUT `/wp-json/api/v1/projects/{id}` (update project)
  - GET `/wp-json/api/v1/projects/{id}/history` (change history)
  - POST `/wp-json/api/v1/projects/{id}/approve-change` (change approval)
- Behavior: Auto-save changes, impact analysis, approval workflow triggering
- Permissions: Project managers can edit projects they own or are assigned to

## States
- Viewing: Current project information display
- Editing: Form modifications with validation feedback
- Pending Approval: Changes submitted for approval with status tracking
- Approved: Changes applied with notification and audit logging
