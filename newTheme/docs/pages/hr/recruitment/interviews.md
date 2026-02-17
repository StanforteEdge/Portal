# Page: HR • Recruitment Interviews

- URL: `/hr/recruitment/interviews/`
- Template: `templates/pages/hr/recruitment/interviews.php`
- Role: `hr-manager`

## About
Interview scheduling and management interface for HR managers to coordinate candidate interviews, manage interviewer availability, and track interview progress through the recruitment pipeline.

## Layout
1. Interview calendar
   - Calendar view of scheduled interviews with time slots
   - Interviewer availability and conflict detection
2. Interview pipeline
   - Candidates progressing through interview stages
   - Interview status tracking and feedback collection
3. Interview setup wizard
   - Interview scheduling with stakeholder coordination
   - Interview kit preparation and distribution

## Sections
- Calendar Overview: Visual interview scheduling with availability
- Interview Stages: Multi-round interview progress tracking
- Interviewer Management: Panel coordination and feedback collection
- Feedback System: Structured interview feedback and scoring
- Communication Tools: Automated scheduling emails and reminders

## PRD
- Goal: Coordinate efficient interview process with stakeholder alignment
- Success Criteria: Smooth scheduling, timely feedback, candidate experience
- Constraints: Interviewer availability, scheduling conflicts, feedback deadlines

## FRD
- Inputs: Interview scheduling, stakeholder selection, feedback forms, ratings
- Client Validation: Valid time slots, required participants, conflict checking
- API Contracts:
  - GET `/wp-json/api/v1/hr/interviews?date=&interviewer=` (scheduled interviews)
  - POST `/wp-json/api/v1/hr/interviews` (schedule interview)
  - PUT `/wp-json/api/v1/hr/interviews/{id}/feedback` (submit feedback)
  - GET `/wp-json/api/v1/hr/interviewers/availability` (availability data)
- Behavior: Conflict detection, automated notifications, feedback reminders
- Permissions: HR managers can schedule interviews for authorized positions

## States
- Scheduling: Interview setup with stakeholder coordination
- Scheduled: Confirmed interviews with preparation materials
- In Progress: Active interviews with real-time updates
- Completed: Post-interview feedback collection and decision making
