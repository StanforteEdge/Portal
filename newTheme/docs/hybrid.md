Hybrid Dynamic Request & Form System (WordPress Custom Tables)
Purpose

This system is designed to power a staff portal that handles multiple internal modules such as:

HR requests (leave, onboarding, appraisals)

Finance requests (expenses, approvals, reimbursements)

IT tickets (issues, audits, access requests)

Admin logs (generator usage, asset tracking)

The system must:

Support dynamic forms and request types

Avoid database schema changes when new forms or fields are added

Remain queryable, filterable, and performant

Scale to large volumes of data

Work cleanly inside a WordPress custom-plugin context

Be future-proof for workflows, approvals, and audits

Core Design Philosophy

Structure what is stable

Keep what is variable flexible

Never create new tables per module

Never add new columns per field

Promote fields to columns only when they become operationally critical

Separate definition, data, and history

This avoids both:

Rigid schemas that require constant migrations

Unstructured blobs that are impossible to query

High-Level Architecture

The system uses four core concepts:

Request Types – define what a request looks like

Requests – store actual submitted data

JSON Data – store dynamic fields without schema changes

Events – track state changes and actions (audit trail)

Database Tables
1. staff_request_types

Defines each request or form type.

staff_request_types
- id (PK)
- key (unique, e.g. "IT_TICKET", "GENERATOR_LOG")
- name (Human-readable)
- module (HR, IT, Finance, Admin)
- schema JSON (field definitions & validation rules)
- workflow JSON (approval flow, SLAs, escalation)
- created_at
- updated_at

Example schema JSON
{
  "fields": [
    { "key": "priority", "type": "select", "options": ["Low", "Medium", "High"], "required": true },
    { "key": "issue", "type": "text", "required": true },
    { "key": "attachment", "type": "file" }
  ]
}


This allows:

Dynamic form rendering

App-level validation

Admin-managed form evolution

2. staff_requests

Stores actual submissions.

staff_requests
- id (PK)
- request_type_id (FK → staff_request_types.id)
- data JSON (dynamic fields & values)
- status (draft, submitted, approved, rejected, closed)
- created_by (WP user ID)
- assigned_to (WP user ID / role)
- created_at
- updated_at

Example data JSON
{
  "priority": "High",
  "issue": "VPN not connecting",
  "device": "MacBook Pro",
  "date_reported": "2026-01-10"
}


Important:

This table NEVER changes when new fields or forms are added.

All form variability lives in the data JSON column.

3. Generated / Indexed Columns (Selective)

When certain fields become frequently queried (e.g. amount, department, generator_id), they are promoted to generated columns.

ALTER TABLE staff_requests
ADD COLUMN generator_id VARCHAR(50)
AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.generator_id'))) STORED,
ADD INDEX idx_generator_id (generator_id);


This preserves:

Query speed

Filterability

Reporting performance

Without sacrificing flexibility.

4. staff_request_events (Audit & History)

Tracks everything that happens to a request.

staff_request_events
- id (PK)
- request_id (FK → staff_requests.id)
- event_type (created, submitted, approved, reassigned, commented)
- payload JSON (who, what, optional notes)
- created_at

Example Event Payload
{
  "actor": 12,
  "action": "approved",
  "note": "Approved by finance manager"
}


This enables:

Full audit trail

Compliance

Timeline views

Debugging and accountability

Data Flow

User selects a request type

System reads the schema from staff_request_types

Form is rendered dynamically

Submission is validated using schema rules

Data is stored as JSON in staff_requests

Status transitions generate staff_request_events

Queries use:

Normal columns for status, dates, users

Indexed generated columns for key filters

JSON queries for secondary data

Querying Strategy
Basic Filter
SELECT *
FROM staff_requests
WHERE request_type_id = 3
AND status = 'approved';

JSON-Based Filter
SELECT *
FROM staff_requests
WHERE JSON_EXTRACT(data, '$.priority') = 'High';

Indexed Filter (Preferred)
SELECT *
FROM staff_requests
WHERE generator_id = 'GEN-02';

WordPress Integration Rules

Implemented as a custom plugin, not a theme

Uses wpdb or custom repository classes

Exposed via custom REST API endpoints

Permissions enforced via:

current_user_can()

Custom capabilities per module

Admin UI built with:

WP List Tables or

React (via WP REST API)

What This System Avoids (By Design)

❌ One table per module
❌ One column per form field
❌ Serialized PHP arrays
❌ Unindexed meta-style key-value tables
❌ Business logic in themes
❌ Schema migrations for operational changes

Why This Is a “Hybrid” System

Because it intentionally combines:

Relational structure → stability, performance

JSON flexibility → dynamic forms, no migrations

Generated columns → fast queries

Event sourcing (light) → auditability

Form definitions → low-code extensibility

When to Extend (Rules)

If a field becomes operationally critical → promote to column

If analytics become heavy → add summary/materialized tables

If workflows grow → expand workflow JSON

If compliance matters → rely on event logs

End Goal

A single internal platform that can support:

Today’s HR, IT, Admin needs

Tomorrow’s new departments

Without rewriting schemas

Without slowing down queries

Without breaking WordPress conventions