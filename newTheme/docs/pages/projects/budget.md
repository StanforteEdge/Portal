# Page: Projects • Budget

- URL: `/projects/budget/{id}/`
- Template: `templates/pages/projects/budget.php`
- Role: `project-manager`

## About
Project budget management interface for project managers to allocate project budgets, track expenses, monitor budget utilization, and manage budget changes and approvals.

## Layout
1. Budget overview dashboard
   - Total budget, spent amount, remaining budget, burn rate
   - Budget vs actual spending with variance indicators
2. Budget breakdown table
   - Budget categories, allocated amounts, actual spending, variances
   - Cost center and expense type tracking
3. Budget adjustment tools
   - Budget reallocation between categories
   - Budget increase requests and approval workflows

## Sections
- Budget Summary: High-level budget status and utilization metrics
- Category Breakdown: Budget allocation by expense categories and phases
- Expense Tracking: Actual spending against budgeted amounts
- Variance Analysis: Budget variances with explanations and corrective actions
- Change Management: Budget modification requests and approval tracking

## PRD
- Goal: Enable effective project budget planning and control
- Success Criteria: Accurate budget tracking, timely variance detection, cost control
- Constraints: Budget authority limits, approval workflows, financial policies

## FRD
- Inputs: Budget allocations, expense tracking, variance explanations, change requests
- Client Validation: Budget limits, approval requirements, variance thresholds
- API Contracts:
  - GET `/wp-json/api/v1/projects/{id}/budget` (project budget details)
  - PUT `/wp-json/api/v1/projects/{id}/budget` (update budget allocations)
  - GET `/wp-json/api/v1/projects/{id}/expenses` (project expenses)
  - POST `/wp-json/api/v1/projects/{id}/budget/adjust` (budget adjustment request)
- Behavior: Real-time budget updates, variance alerts, automated approval routing
- Permissions: Project managers can manage budgets for their assigned projects

## States
- Planning: Initial budget allocation and approval
- Active: Ongoing budget monitoring and expense tracking
- Adjustment: Budget modifications with approval workflows
- Review: Budget performance analysis and completion assessment
