# Page: HR • Performance Reviews

- URL: `/hr/performance/reviews/`
- Template: `templates/pages/hr/performance/reviews.php`
- Role: `hr-manager`

## About
Performance management interface for HR managers to conduct employee reviews, track development goals, and manage performance improvement plans. Provides structured review workflows and goal tracking.

## Layout
1. Reviews dashboard
   - Upcoming reviews, overdue reviews, completion status
   - Quick filters: department, review type, status
2. Reviews table
   - Columns: Employee, Review Type, Due Date, Status, Reviewer
   - Expandable rows for review details and actions
3. Review form modal
   - Structured review template with rating scales
   - Goal setting section, development plan
   - Comments and approval workflow

## Sections
- Dashboard Metrics: Review completion rates, upcoming deadlines
- Active Reviews: Current review cycle with progress tracking
- Review Templates: Standardized review forms by role/level
- Goal Tracking: Employee development objectives and progress
- Historical Reviews: Past performance records and trends

## PRD
- Goal: Enable structured performance management for HR
- Success Criteria: Complete review cycles, clear feedback, measurable goals
- Constraints: Respect review confidentiality, maintain audit trails

## FRD
- Inputs: Review ratings, comments, goals, development plans
- Client Validation: Required fields for formal reviews, goal specificity
- API Contracts:
  - GET `/wp-json/api/v1/hr/performance/reviews?status=&department=&page=`
  - GET `/wp-json/api/v1/hr/performance/reviews/{id}` (review details)
  - POST `/wp-json/api/v1/hr/performance/reviews/{id}/submit` (submit review)
- Behavior: Auto-save drafts, email notifications for review milestones
- Permissions: HR managers can manage reviews for their teams

## States
- Loading: Skeleton table and metrics cards
- In Progress: Show draft reviews with save indicators
- Overdue: Highlight overdue reviews with alerts
- Completed: Archive view with historical data access
