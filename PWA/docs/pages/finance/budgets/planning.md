# Page: Finance • Budget Planning

- URL: `/finance/budgets/planning/`
- Template: `templates/pages/finance/budgets/planning.php`
- Role: `accountant`

## About
Budget planning interface for accountants to create and manage organizational budgets with department allocation, cost center tracking, and variance analysis. Supports multi-year budgeting with approval workflows.

## Layout
1. Budget overview dashboard
   - Total budget, allocated amount, remaining budget
   - Department breakdown with progress indicators
2. Budget creation wizard
   - Step 1: Budget parameters (year, type, currency)
   - Step 2: Department allocations
   - Step 3: Cost center distribution
   - Step 4: Review and approval routing
3. Budget table editor
   - Hierarchical budget lines with drag-drop reallocation
   - Real-time totals and variance calculations

## Sections
- Budget Summary: High-level budget overview with key metrics
- Department Allocations: Budget distribution across organizational units
- Cost Centers: Detailed line-item budget management
- Approval Workflow: Budget submission and approval tracking
- Historical Comparison: Previous year budget vs actual analysis

## PRD
- Goal: Enable comprehensive budget planning and management
- Success Criteria: Accurate allocations, approval compliance, variance tracking
- Constraints: Financial compliance, approval hierarchies, budget cycles

## FRD
- Inputs: Budget amounts, department allocations, approval selections
- Client Validation: Budget limits, allocation rules, required approvals
- API Contracts:
  - GET `/wp-json/api/v1/finance/budgets?year=&status=` (budget listings)
  - POST `/wp-json/api/v1/finance/budgets` (create budget)
  - PUT `/wp-json/api/v1/finance/budgets/{id}` (update budget)
  - POST `/wp-json/api/v1/finance/budgets/{id}/submit` (submit for approval)
- Behavior: Auto-calculation of totals, approval routing, version control
- Permissions: Accountants can create budgets for authorized departments

## States
- Planning: Budget creation and allocation phase
- Reviewing: Internal review and adjustment phase
- Submitted: Awaiting approval with status tracking
- Approved: Active budget with monitoring capabilities
