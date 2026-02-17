# Page: HR • Recruitment Applications

- URL: `/hr/recruitment/applications/`
- Template: `templates/pages/hr/recruitment/applications.php`
- Role: `hr-manager`

## About
Job application management interface for HR managers to review, evaluate, and process candidate applications with integrated applicant tracking and decision workflows.

## Layout
1. Applications dashboard
   - Application pipeline overview, status distribution
   - Key metrics: applications received, review completion, offer rates
2. Applications table
   - Candidate list with status, application date, job position
   - Filtering by status, position, date range, rating
3. Application detail view
   - Candidate profile, resume, application responses
   - Rating and evaluation tools, decision workflow

## Sections
- Pipeline Overview: Application funnel with stage tracking
- Application Queue: Incoming applications requiring review
- Candidate Profiles: Detailed applicant information and documents
- Evaluation Tools: Rating scales, comparison matrices, decision templates
- Communication Hub: Automated emails, interview scheduling, offer management

## PRD
- Goal: Streamline recruitment process from application to offer
- Success Criteria: Efficient candidate evaluation, consistent decision making, compliance tracking
- Constraints: Equal opportunity compliance, data privacy, timely responses

## FRD
- Inputs: Application reviews, ratings, decisions, feedback, scheduling
- Client Validation: Required evaluations, decision justifications, timeline compliance
- API Contracts:
  - GET `/wp-json/api/v1/hr/applications?status=&job_id=&page=` (application list)
  - GET `/wp-json/api/v1/hr/applications/{id}` (application details)
  - PUT `/wp-json/api/v1/hr/applications/{id}/status` (update status)
  - POST `/wp-json/api/v1/hr/applications/{id}/schedule` (schedule interview)
- Behavior: Automated status updates, email notifications, deadline tracking
- Permissions: HR managers can review applications for authorized positions

## States
- Reviewing: Application evaluation with rating and feedback
- Interviewing: Interview scheduling and coordination
- Deciding: Final decisions with offer generation
- Closed: Application closure with feedback and archiving
