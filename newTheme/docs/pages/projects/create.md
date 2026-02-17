# Page: Projects • Create

- URL: `/projects/create/`
- Template: `templates/pages/projects/create.php`
- Role: `project-manager`

## About
Project creation wizard for project managers to initiate new projects with comprehensive setup including team assignment, budget allocation, timeline definition, and stakeholder identification.

## Layout
1. Project creation wizard
   - Step 1: Basic project information (name, description, type)
   - Step 2: Timeline and milestones definition
   - Step 3: Budget allocation and resource planning
   - Step 4: Team assignment and stakeholder identification
   - Step 5: Review and project initiation
2. Progress indicator
   - Visual progress through creation steps
3. Validation feedback
   - Real-time validation and requirement checking

## Sections
- Project Basics: Core project information and categorization
- Timeline Setup: Start/end dates, milestones, and critical path
- Resource Planning: Budget allocation and resource requirements
- Team Assembly: Team member assignment and role definition
- Stakeholder Management: Key stakeholders and communication planning
- Project Review: Complete project setup validation and approval

## PRD
- Goal: Enable structured project initiation with proper planning and approvals
- Success Criteria: Complete project setup, stakeholder alignment, resource allocation
- Constraints: Project approval workflows, budget limits, resource availability

## FRD
- Inputs: Project details, timeline data, budget allocations, team assignments
- Client Validation: Required fields, budget limits, resource availability, date logic
- API Contracts:
  - POST `/wp-json/api/v1/projects` (create project)
  - GET `/wp-json/api/v1/projects/templates` (project templates)
  - GET `/wp-json/api/v1/projects/budgets/available` (available budget)
  - GET `/wp-json/api/v1/users?role=` (available team members)
- Behavior: Auto-save drafts, validation feedback, approval routing for complex projects
- Permissions: Project managers can create projects within authorized budget and resource limits

## States
- Draft: Project creation in progress with draft saving
- Validation: Form validation and requirement checking
- Approval: Project submitted for approval with workflow tracking
- Active: Project created and ready for execution
