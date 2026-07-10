# Navigation and Workspace IA Design

**Date:** 2026-07-05
**Status:** Draft

## Goal

Define a clearer information architecture for the PWA so that:

- all staff have a simple, role-appropriate primary navigation
- shared work lives in workspaces, not scattered menus
- specialist domains remain gated to the right operators
- procurement, budgets, deductions, tasks, groups, and projects fit into one coherent model

## Selected Approach

Use a role-layered navigation model with:

- a stable staff-facing core
- specialist modules for Finance, HR, Administration, and System Settings
- a shared `Workspace` surface for group and project collaboration
- `Requests` as the universal initiation surface
- `Tasks` as the personal productivity and execution cockpit

## Core Navigation Model

### Staff-Facing Core

All staff should see:

- `Dashboard`
- `Requests`
- `Tasks`
- `Attendance`
- `Workspace`
- `Profile`

### Specialist Modules

Only permissioned users should see:

- `Finance`
- `HR`
- `Administration`
- `System Settings`

## Top-Level Navigation

### Dashboard

Purpose:

- light summary only
- alerts
- shortcuts
- immediate items needing attention

Dashboard should not become a deep operational cockpit.

### Requests

Purpose:

- universal formal submission and approval workspace

Children:

- `My Requests`
- `Approvals` when the user has approval responsibility
- `New Request`

Requests should be the initiation point for:

- procurement requests
- financial/payment-related requests
- leave and loan requests
- future structured approval workflows

### Tasks

Purpose:

- the main personal execution and productivity cockpit

Tasks should contain:

- assigned tasks
- task queue and due items
- KPI/productivity view
- personal execution tracking
- future daily logs and performance surfaces

Tasks should be **me-centered**, not workspace-centered.

### Attendance

Purpose:

- dedicated daily attendance and time-presence workspace

Attendance stays top-level because it is a frequent operational action.

### Workspace

Purpose:

- the shared collaboration and context workspace

Children:

- `Groups`
- `Projects`

Workspace should be a real working surface, not only a navigation folder.

### Profile

Purpose:

- personal records and self-service access

Children:

- `My Profile`
- `Payslips`
- `Leave`
- `Settings`

Profile should hold employee-facing outcomes, not operator control surfaces.

## Workspace Model

### Groups

Groups are backed by a shared underlying group entity and differentiated by group type.

Examples:

- department
- team
- committee
- club
- unit
- future custom types

The UI should remain stable even if new group types are added later.

#### Groups List Page

The `Groups` page should:

- show all groups the current user belongs to
- group them visually by type
- support search
- support organization filter
- support role filter

Each group item should show:

- group name
- group type
- organization
- user role
- primary marker where relevant
- quick stats later

#### Group Detail Page

The group detail page should be type-aware and role-aware.

Base tabs:

- `Overview`
- `Tasks`
- `Members`

Conditional tabs:

- `Requests`
- `Budgets`
- `Projects`

Rules:

- group type decides which tabs are available
- user role decides what the user can see and do within those tabs

### Projects

Projects remain separate from groups.

Why:

- projects are delivery/accountability containers
- projects need richer domain surfaces than generic groups
- groups may reference projects, but projects should remain their own workspace type

#### Projects List Page

The projects list should:

- be visible to all staff
- support search
- support organization/status filters
- support participation filters later

#### Project Detail Page

Projects should support two visibility layers:

##### Public View

Visible to all staff:

- `Overview`
- `Activities`

##### Internal View

Visible by role/relationship:

- `Tasks`
- `Members`
- `Requests`
- `Budgets`
- `Funds / Spend`
- `Partners`
- `Donors`

Groups may also expose a `Projects` tab showing projects relevant to that group.

## Shared Task Model

There should be one task system with multiple views.

### Personal View

Shown in `Tasks`:

- tasks assigned to me
- personal execution and KPI context

### Shared Views

Shown in:

- `Workspace -> Groups -> [Group] -> Tasks`
- `Workspace -> Projects -> [Project] -> Tasks`

The same task records should appear across those views.

Rules:

- `Tasks` is **me-centered**
- `Workspace` task tabs are **shared-scope-centered**

### Task Creation Rules

Recommended v1 rules:

- normal members can create personal tasks
- lead/moderator/project lead can create shared workspace tasks
- normal members may later suggest tasks, but should not create shared workspace tasks directly in v1

## Request Visibility Rules

### Normal Staff

In a group workspace:

- sees only their own requests belonging to that group

### Team Lead / Moderator

In a group workspace:

- sees all requests for that group

This keeps `Requests` as the personal/global submission surface and `Workspace -> Groups -> Requests` as a scoped team context view.

## Budget Model

### Ownership

Recommended ownership rules:

- departments can own budgets by default
- projects can own budgets where appropriate
- ad hoc teams/committees/clubs should not own budgets by default
- ad hoc groups may reference department/project budgets instead

### Visibility

Normal staff:

- sees approved budgets only
- read-only
- through workspace context, not a personal budget module

Lead/moderator:

- owns budget workflow for department-style groups
- can assign a preparer
- can review/submit budget work

Assigned preparer:

- can draft/edit budget work
- does not become the owner automatically

Finance:

- can prepare/manage budgets too
- remains authority in approval/control workflow

### Placement

Budgets should be visible to staff through workspace context.

Staff should not have a standalone personal budget module.

## Procurement Model

### Core Principle

- `Requests` owns procurement initiation and approval
- `Procurement` owns procurement fulfillment and execution

### Navigation Placement

Procurement should live under `Administration`, not under staff-facing top-level navigation.

Why:

- procurement officers are operational specialists
- procurement is not a universal staff workspace
- procurement is not platform configuration, so it should not live under `System Settings`

### Administration -> Procurement

Recommended initial structure:

- `Intake`
- `Purchase Orders`

### Procurement Flow

1. staff creates procurement request in `Requests`
2. request is approved through request workflow
3. approved item appears in procurement intake
4. procurement officer clicks `Create Procurement Case`
5. officer manages sourcing / execution / PO / GRN
6. item becomes ready for finance/payment linkage

### Procurement Request Category and Types

Procurement should be seeded/configured as a request category with multiple request types.

Recommended initial types:

- `Goods Purchase`
- `Service Procurement`
- `Works Request`

Later types may include:

- `Emergency Procurement`
- `Vendor Onboarding Request`
- other procurement-specific workflows

## Vendor Model

Vendor ownership should be shared carefully between Procurement and Finance.

### Procurement

Can:

- create vendor drafts
- use active vendors in PO flow
- maintain operational vendor context

### Finance

Can:

- create vendors
- validate financial/compliance details
- activate/deactivate vendors
- remain owner of vendor master integrity

### Best-Practice v1 Flow

1. procurement or finance creates vendor draft
2. finance completes/validates financial and compliance fields
3. finance activates vendor
4. only active vendors are used in standard PO flow

## Finance IA

Finance should be reorganized around work-based buckets instead of a broad feature dump.

### Finance Navigation

- `Dashboard`

#### Workflows

- `Requests`
- `Payment Vouchers`
- `Budgets`
- `Statutory Deductions`

#### Accounting

- `Ledger`
- `Journal Entry`
- `Chart of Accounts`
- `Bank & Cash`
- `Reports`

#### Receivables

- `Sales Invoices`
- `Income`
- `Receivables`
- `Customers`

#### Payables

- `Bills`
- `Expenses`
- `Payables`
- `Vendors`
- `All Contacts`

#### Assets

- `Asset Register`
- `Disposals`

#### Payroll

- `Payroll`
- `Salary Components`
- `Tax Tables`
- `Deduction Types`

#### Setup

- `Products & Services`
- finance-local settings only

### Deductions

Two deduction visibility layers exist:

#### Employee-facing deduction outcomes

Visible to staff in:

- `Profile`
- `Payslips`

#### Finance-facing deduction control

Visible in `Finance`:

- `Statutory Deductions`
- `Deduction Types`
- remittance/compliance workflows
- vendor/request deduction handling where relevant

## HR IA

HR remains a specialist operator module.

Recommended areas:

- `Overview`
- `Employees`
- `Attendance`
- `Leave`
- `Payroll`
  - `Payroll Runs`
  - `Workers`
  - `Loans`
- `Settings`

Staff-facing versions of attendance/leave stay outside HR as part of staff navigation.

## Administration vs System Settings

### Administration

Purpose:

- business administration and operational control surfaces

Recommended contents:

- `Procurement`
- `Groups`
- `Users`
- `Roles`
- `Projects` admin setup
- `Files`
- other admin-operational tools

### System Settings

Purpose:

- true platform/system configuration

This should contain only global, platform-wide, or dangerous system controls.

### Rule

- `Administration` manages business structure and operations
- `System Settings` manages the platform itself

## Files Model

Recommended visibility model:

- contextual files under `Workspace -> Groups` and `Workspace -> Projects`
- personal documents under `Profile`
- admin file management under `Administration`

There should not be a broad top-level staff `Files` module if files can be contextualized more clearly.

## Dashboard Model

Dashboard should remain intentionally light.

Recommended content:

- alerts
- pending approvals where relevant
- pending requests
- tasks due today
- attendance action/summary
- quick links
- recent groups/projects later

Dashboard should not absorb full task, attendance, or workspace functionality.

## Role Summary

### Normal Staff

Primary navigation:

- `Dashboard`
- `Requests`
- `Tasks`
- `Attendance`
- `Workspace`
- `Profile`

### Team Lead / Moderator

Same core navigation, plus broader scoped authority inside group/project workspaces:

- can see all group requests
- can create/assign shared tasks
- can own and submit budgets where applicable

### Procurement Officer

- uses `Administration -> Procurement`
- intake-first workflow
- not a procurement request initiator by primary role

### Finance Operator

- uses `Finance`
- owns budget governance, payment execution, deductions, vendor activation, and accounting truth

### HR Operator

- uses `HR`
- owns employee/admin HR operations

### Administrator

- uses `Administration`
- manages business/admin structures

### System Admin

- uses `System Settings`
- platform configuration authority

## Implementation Notes

### Seed / Config Requirements

Needed:

- procurement request category if not already configured
- procurement request types if not already configured

### Dynamic Group Behavior Matrix

Still needs explicit implementation rules by group type, including at least:

- department
- team
- committee
- club
- unit

### Project Visibility Modes

Recommended simplification:

- `Public`
- `Internal`

This should drive tab access and content depth.

## Open Decisions

- final group type behavior matrix
- exact dashboard shortcut set
- whether members can suggest shared tasks in v1
- exact approval entry pattern between global approvals and finance/hr local queues
- whether some current top-level staff items such as files should be fully absorbed into contextual surfaces
