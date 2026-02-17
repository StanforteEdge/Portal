# Stanforte Edge Portal - Role-Based Menu Structure

## 1. Super Admin
- Dashboard
  - System Overview
  - Analytics
  - System Health
  - Audit Logs
- User Management
  - All Users
  - Role Management
  - Permissions
- All Other Menus (Full Access)

## 2. CEO/COO
### Main Menu
- Executive Dashboard
  - Organization Overview
  - Performance Metrics
  - Strategic Goals
  - Risk Management
- HR Overview
  - Staff Directory
  - Department Performance
  - Hiring Status
  - Leave Overview
- Financial Overview
  - Budget Summary
  - Financial Reports
  - Grant Status
  - Donor Overview
- Projects Overview
  - All Projects Status
  - Resource Allocation
  - Timeline Views
  - Risk Assessment
- Reports
  - Executive Reports
  - Department Reports
  - Financial Reports
  - Impact Reports
- Documents
  - Policy Documents
  - Strategic Documents
  - Board Reports
  - Legal Documents

## 3. HR Manager
### Main Menu
- HR Dashboard
  - Staff Overview
  - Recruitment Status
  - Leave Statistics
  - Training Status
- Employee Management
  - Staff Directory
  - Add/Edit Employee
  - Performance Reviews
  - Leave Management
- Recruitment
  - Job Postings
  - Applications
  - Interview Schedule
  - Offers & Onboarding
- Training & Development
  - Training Programs
  - Skill Assessment
  - Career Development
  - Training Calendar
- Documents
  - HR Policies
  - Employee Documents
  - Contract Templates
  - Training Materials
- Reports
  - HR Analytics
  - Attendance Reports
  - Performance Reports
  - Training Reports

## 4. Team Lead
### Main Menu
- Team Dashboard
  - Team Overview
  - Task Status
  - Team Performance
  - Team Calendar
- Project Management
  - Active Projects
  - Task Board
  - Resource Planning
  - Timeline View
- Team Management
  - Team Members
  - Leave Requests
  - Performance Reviews
  - Training Status
- Documents
  - Project Documents
  - Team Policies
  - Training Materials
- Reports
  - Team Performance
  - Project Status
  - Resource Utilization

## 5. Finance Manager/Accounts
### Main Menu
- Finance Dashboard
  - Financial Overview
  - Budget Status
  - Cash Flow
  - Pending Approvals
- Financial Management
  - Transactions
  - Budgets
  - Expenses
  - Invoices
- Donor Management
  - Donor Directory
  - Contributions
  - Pledges
  - Communication Log
- Grant Management
  - Grant Overview
  - Applications
  - Reports
  - Compliance
- Reports
  - Financial Reports
  - Audit Reports
  - Tax Documents
  - Grant Reports

## 6. Staff
### Main Menu
- Dashboard
  - Welcome with name
  - Attendance (Current time, Logged in status, Work mode (Remote/Office))
  - My Tasks
  - My Calendar
  - Announcements
  - Notifications
- Team
  - Team Members
- Time Management
  - Attendance
  - Leave Request
  - Work Schedule
  - Time Sheet
- Finance
  - Financial Requests
- Projects
  - My Projects
  - My Tasks
  - Time Tracking
  - Documents
- Documents
  - My Documents
  - Shared Files
  - Company Policies
  - Forms
- Profile
  - Personal Info
  - Documents
  - Job Description
  - Skills & Training
  - Performance

## 7. CRM Manager
### Main Menu
- CRM Dashboard
  - Stakeholder Overview
  - Communication Status
  - Event Calendar
  - Task List
- Contact Management
  - Donor Directory
  - Partner Organizations
  - Beneficiary Database
  - Communication Log
- Event Management
  - Event Calendar
  - Event Planning
  - Registration
  - Follow-ups
- Communication
  - Email Campaigns
  - Newsletters
  - Social Media
  - Analytics
- Reports
  - Engagement Reports
  - Event Reports
  - Impact Reports
  - Donor Reports

## Menu Access Rules
1. Role Hierarchy
   - Super Admin > CEO/COO > Department Managers > Team Leads > Staff
   - Each role inherits viewing permissions from roles below
   - Edit/Delete permissions are role-specific

2. Cross-Department Access
   - HR can view all employee profiles
   - Finance can view project budgets
   - Team Leads can view their team's details
   - Staff can only view their own information

3. Document Access
   - Confidential documents restricted by role
   - Department-specific documents limited to department members
   - Public documents accessible to all

4. Report Access
   - Executive reports limited to C-level and above
   - Department reports accessible to respective managers
   - Team reports visible to team leads and above
   - Personal reports visible to individual staff





   # Stanforte Edge Portal - Menu Structure

- Dashboard (All)
- Profile (All)
  - Profile/Settings (All)
  - Profile/Documents (All)
  - Profile/Skills (All)

- Employee Management
  - Employee Directory (HR, CEO, COO, Team Lead)
  - Employee/Add (HR)
  - Employee/Edit (HR)
  - Employee/View/{id} (HR, CEO, COO, Team Lead for their team)

- Leave Management
  - Leave/Apply (All)
  - Leave/History (All)
  - Leave/Approve (HR, Team Lead for their team)
  - Leave/Overview (HR, CEO, COO)

- Projects
  - Projects/Overview (All)
  - Projects/Create (Team Lead, HR, CEO, COO)
  - Projects/Edit (Team Lead, Project Owner)
  - Projects/View/{id} (All involved in project)
  - Projects/Reports (Team Lead, HR, CEO, COO)

- Tasks
  - Tasks/My-Tasks (All)
  - Tasks/Create (Team Lead, Project Owner)
  - Tasks/Edit (Team Lead, Task Owner)
  - Tasks/Board (All involved in project)

- Finance
  - Finance/Overview (Finance, CEO, COO)
  - Finance/Income
    - Income/Records (Finance)
    - Income/Invoices (Finance)
    - Income/Receipts (Finance)
  - Finance/Requests (All Staff)
    - Requests/List (All Staff)
    - Requests/Request (All Staff) # Single page with tabs for request details, approvals, disbursement, retirement, and evidence
  - Finance/Budgets (Finance, CEO, COO)
  - Finance/Reports
    - Reports/Income (Finance, CEO, COO)
    - Reports/Expenses (Finance, CEO, COO)
    - Reports/Budget-Analysis (Finance, CEO, COO)
    - Reports/Audit-Trail (Finance, CEO, COO)
  - Finance/Compliance (Finance, CEO, COO)
  - Finance/Vendors
    - Vendors/Directory (Finance)
    - Vendors/Payments (Finance)
    - Vendors/Contracts (Finance, CEO, COO)
  - Finance/Settings (Finance)

- Donors
  - Donors/Overview (Finance, CRM, CEO, COO)
  - Donors/Add (Finance, CRM)
  - Donors/Edit (Finance, CRM)
  - Donors/Communications (Finance, CRM)

- Documents
  - Documents/My-Files (All)
  - Documents/Department (All - their department only)
  - Documents/Company (All)
  - Documents/Upload (All - to their permitted folders)

- Training
  - Training/Available (All)
  - Training/My-Courses (All)
  - Training/Create (HR)
  - Training/Reports (HR, Team Lead)

- Reports
  - Reports/HR (HR, CEO, COO)
  - Reports/Projects (Team Lead, CEO, COO)
  - Reports/Finance (Finance, CEO, COO)
  - Reports/Performance (HR, Team Lead, CEO, COO)

- Administration (Super Admin only)
  - Admin/Users
  - Admin/Roles
  - Admin/Settings
  - Admin/Logs

- Time Management
  - Time/Attendance (All)
  - Time/Timesheet (All)
  - Time/Overview (HR, Team Lead, CEO, COO)

- Events
  - Events/Calendar (All)
  - Events/Create (HR, CRM)
  - Events/Manage (HR, CRM)

- Settings
  - Settings/Personal (All)
  - Settings/Notifications (All)
  - Settings/System (Super Admin)

- Help
  - Help/Documentation (All)
  - Help/Support (All)
  - Help/FAQs (All)