# Page: HR • Recruitment Jobs

- URL: `/hr/recruitment/jobs/`
- Template: `templates/pages/hr/recruitment/jobs.php`
- Role: `hr-manager`

## About
Job posting management interface for HR managers to create, publish, and manage job openings. Includes job lifecycle management from creation to closure with application tracking.

## Layout
1. Jobs dashboard
   - Active jobs count, total applications, hiring progress
   - Quick stats: open positions, filled this month, time-to-fill average
2. Job listings table
   - Columns: Job Title, Department, Status, Applications, Posted Date, Actions
   - Status badges: Draft, Published, Closed, Filled
3. Job creation wizard
   - Step 1: Job details (title, department, type)
   - Step 2: Requirements and responsibilities
   - Step 3: Application settings and publishing

## Sections
- Jobs Overview: Portfolio view of all job postings with metrics
- Active Jobs: Currently published positions with application counts
- Job Templates: Pre-built job descriptions for common roles
- Application Tracking: Integration with applicant tracking system
- Reporting: Recruitment metrics and hiring funnel analytics

## PRD
- Goal: Streamline recruitment process from job posting to hire
- Success Criteria: Easy job creation, clear application tracking, hiring analytics
- Constraints: Compliance with employment laws, consistent job descriptions

## FRD
- Inputs: Job details, requirements, application settings, status updates
- Client Validation: Required fields, valid salary ranges, compliance checkboxes
- API Contracts:
  - GET `/wp-json/api/v1/hr/jobs?status=&department=&page=` (job listings)
  - POST `/wp-json/api/v1/hr/jobs` (create job posting)
  - PUT `/wp-json/api/v1/hr/jobs/{id}/status` (update job status)
  - GET `/wp-json/api/v1/hr/jobs/templates` (job templates)
- Behavior: Auto-save drafts, publish confirmation dialogs, status tracking
- Permissions: HR managers can create jobs for authorized departments

## States
- Creating: Multi-step job creation wizard with validation
- Publishing: Confirmation dialog with preview and compliance check
- Managing: Job status updates and application monitoring
- Closing: Job closure with feedback collection
