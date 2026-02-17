# Stanforte Edge Portal - Page Structure & Navigation Menus

## Role-Based Navigation Menus

### Admin Menu
```
Dashboard
├── Overview
├── Recent Activity
└── Quick Stats

HR Management
├── Employees
│   ├── Directory
│   ├── Add Employee
│   ├── Roles & Permissions
│   └── Onboarding
├── Performance
│   ├── Reviews
│   ├── Goals
│   └── Reports
└── Time & Attendance
    ├── Timesheets
    ├── Leave Management
    └── Reports

Finance
├── Expenses
│   ├── Approvals
│   ├── Reimbursements
│   └── Reports
├── Payroll
│   ├── Processing
│   ├── History
│   └── Tax Management
└── Budgets
    ├── Planning
    ├── Tracking
    └── Reports

Projects
├── All Projects
├── Resource Allocation
├── Time Tracking
└── Reports

Documents
├── Library
├── Templates
├── Permissions
└── Audit Logs

Reports & Analytics
├── Executive Dashboard
├── HR Analytics
├── Financial Reports
├── Project Reports
└── Custom Reports

System Administration
├── Users & Roles
├── System Settings
├── Audit Logs
├── Notifications
└── Backup & Security
```

### HR Manager Menu
```
Dashboard
├── My Overview
├── Team Activity
└── Pending Actions

Employees
├── My Team
│   ├── Directory
│   ├── Add Team Member
│   └── Org Chart
├── Performance
│   ├── Reviews
│   ├── Goals & Objectives
│   └── Development Plans
└── Time & Attendance
    ├── Team Timesheets
    ├── Leave Approvals
    └── Reports

Recruitment
├── Job Postings
├── Applications
├── Interviews
└── Onboarding

Reports
├── Team Performance
├── Attendance Reports
├── Recruitment Analytics
└── HR Metrics
```

### Accountant Menu
```
Dashboard
├── Financial Overview
├── Pending Approvals
└── Monthly Summary

Expenses
├── Expense Approvals
├── Reimbursements
├── Vendor Payments
└── Reports

Payroll
├── Salary Processing
├── Benefits Administration
├── Tax Calculations
└── Payroll Reports

Financial Reports
├── Profit & Loss
├── Balance Sheet
├── Cash Flow
├── Budget vs Actual
└── Tax Reports

Budgets
├── Budget Planning
├── Expense Tracking
├── Variance Analysis
└── Forecasting
```

### Staff Menu
```
Dashboard
├── My Overview
├── Recent Activity
└── Quick Actions

My Profile
├── Personal Information
├── Employment Details
├── Emergency Contacts
└── Security Settings

Time & Leave
├── Timesheet
├── Leave Requests
├── Leave Balance
└── Calendar

Expenses
├── Submit Expense
├── My Expenses
├── Reimbursements
└── Receipts

Projects
├── My Tasks
├── Time Tracking
├── Project Documents
└── Team Collaboration

Documents
├── My Documents
├── Shared with Me
├── Company Policies
└── Templates

Reports
├── My Performance
├── My Time Tracking
└── My Expenses
```

### Vendor Menu (Limited Access)
```
Dashboard
├── Overview
└── Recent Activity

Documents
├── Submissions
├── Shared Documents
└── Templates

Requests
├── New Request
├── Pending Requests
└── Request History

Profile
├── Company Information
├── Contact Details
└── Settings
```

### Team Lead Menu
```
Dashboard
├── Team Overview
├── Project Status
└── Team Performance

My Team
├── Team Members
├── Task Assignments
├── Performance Reviews
└── Development Plans

Projects
├── Active Projects
├── Resource Requests
├── Budget Tracking
└── Progress Reports

Time & Attendance
├── Team Timesheets
├── Leave Approvals
├── Attendance Reports
└── Overtime Tracking

Reports
├── Team Productivity
├── Project Deliverables
├── Resource Utilization
└── Team Metrics
```

### COO Menu (Chief Operating Officer)
```
Dashboard
├── Executive Overview
├── KPI Dashboard
└── Strategic Metrics

Operations
├── Process Optimization
├── Quality Assurance
├── Risk Management
└── Compliance Monitoring

Human Resources
├── Talent Management
├── Succession Planning
├── Diversity & Inclusion
└── Employee Engagement

Finance
├── Budget Oversight
├── Cost Analysis
├── ROI Tracking
└── Financial Planning

Projects
├── Program Management
├── Portfolio Analysis
├── Resource Allocation
└── Strategic Initiatives

Reports
├── Operational Efficiency
├── Performance Dashboards
├── Strategic KPIs
└── Executive Summaries
```

### ED Menu (Executive Director)
```
Dashboard
├── Strategic Overview
├── Board Reporting
└── Key Performance Indicators

Strategy
├── Strategic Planning
├── Goal Setting
├── Market Analysis
└── Competitive Intelligence

Governance
├── Board Communications
├── Regulatory Compliance
├── Policy Development
└── Risk Oversight

Stakeholder Management
├── Partner Relations
├── Client Engagement
├── Community Relations
└── Public Affairs

Financial Oversight
├── Budget Approval
├── Financial Performance
├── Investment Decisions
└── Audit Oversight

Reports
├── Board Reports
├── Strategic Reviews
├── Impact Assessments
└── Executive Briefings
```

### Board Member Menu
```
Dashboard
├── Board Overview
├── Meeting Materials
└── Key Metrics

Board Materials
├── Meeting Agendas
├── Financial Reports
├── Strategic Updates
└── Committee Reports

Governance
├── Policy Documents
├── Compliance Reports
├── Audit Findings
└── Risk Assessments

Performance Monitoring
├── Strategic KPIs
├── Financial Performance
├── Operational Metrics
└── Impact Reports

Stakeholder Reports
├── Client Outcomes
├── Community Impact
├── Partner Updates
└── Industry Trends

Board Administration
├── Meeting Scheduling
├── Document Sharing
├── Voting Records
└── Contact Directory
```

## Business-Focused Page Directory Structure

```
templates/pages/
├── auth/                     # Authentication pages (public)
│   ├── login.php
│   ├── forgot-password.php
│   └── reset-password.php
│
├── dashboard/                # Single dynamic dashboard (adapts to user roles)
│   └── index.php             # Main dashboard - shows role-based sections
│
├── hr/                       # HR Management
│   ├── employees/            # HR Manager
│   │   ├── directory.php
│   │   ├── add.php
│   │   ├── edit.php
│   │   ├── roles.php
│   │   └── onboarding.php
│   ├── performance/          # HR Manager
│   │   ├── reviews.php
│   │   ├── goals.php
│   │   └── reports.php
│   ├── recruitment/          # HR Manager
│   │   ├── jobs.php
│   │   ├── applications.php
│   │   └── interviews.php
│   └── time-attendance/      # HR Manager
│       ├── timesheets.php
│       ├── leave-approvals.php
│       └── reports.php
│
├── finance/                  # Finance Management
│   ├── expenses/             # Accountant
│   │   ├── approvals.php
│   │   ├── reimbursements.php
│   │   └── reports.php
│   ├── payroll/              # Accountant
│   │   ├── processing.php
│   │   ├── history.php
│   │   └── tax-management.php
│   ├── budgets/              # Accountant
│   │   ├── planning.php
│   │   ├── tracking.php
│   │   └── reports.php
│   └── staff/                # Staff Finance
│       ├── expenses.php
│       ├── payslips.php
│       └── reimbursements.php
│
├── projects/                 # Project Management
│   ├── overview.php          # Project Manager
│   ├── create.php            # Project Manager
│   ├── edit.php              # Project Manager
│   ├── team.php              # Project Manager
│   ├── budget.php            # Project Manager
│   ├── reports.php           # Project Manager
│   ├── tasks.php             # Staff
│   └── time-tracking.php     # Staff
│
├── documents/                # Document Management
│   ├── library.php
│   ├── upload.php
│   ├── shared.php
│   ├── templates.php
│   └── permissions.php
│
├── reports/                  # Reports & Analytics
│   ├── executive.php
│   ├── hr.php
│   ├── finance.php
│   ├── projects.php
│   └── custom.php
│
├── admin/                    # System Administration
│   ├── users.php
│   ├── roles.php
│   ├── settings.php
│   ├── audit-logs.php
│   └── notifications.php
│
└── profile/                  # User Profile (all roles)
    ├── view.php
    ├── edit.php
    └── security.php
```

## Dashboard Architecture

### Single Dynamic Dashboard
- **URL**: `/dashboard/`
- **Template**: `templates/pages/dashboard/index.php`
- **Behavior**: Adapts content based on user roles from JWT token
- **Multi-Role Support**: Shows all role sections for users with multiple roles

### Role Section Rendering
```javascript
// Dashboard loads user's roles and renders appropriate sections
const userRoles = getUserRoles(); // ['hr-manager', 'team-lead', 'staff']
const primaryRole = getPrimaryRole(userRoles); // 'hr-manager'

// Render all role sections, highlight primary
userRoles.forEach(role => {
  renderRoleSection(role, role === primaryRole ? 'active' : 'inactive');
});
```

### Role Hierarchy (for primary role determination)
1. Board Member
2. ED (Executive Director)
3. COO
4. Admin
5. HR Manager
6. Accountant
7. Team Lead
8. Staff
9. Vendor

### Role Section Components
Each role gets a dashboard section with:
- Key metrics and KPIs
- Pending actions/approvals
- Quick action buttons
- Recent activity
- Role-specific widgets

## URL Structure Notes
- All URLs are case-insensitive
- Trailing slashes are optional
- IDs in URLs are numeric
- Query parameters for filtering/sorting (e.g., `?status=pending`)

## Template Hierarchy
1. `page-{role}-{module}-{action}.php`
2. `page-{module}-{action}.php`
3. `page-{slug}.php`
4. `page-{id}.php`
5. `page.php`
6. `singular.php`
7. `index.php`
