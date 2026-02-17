# Financial Management - Phase 1: Workflows

## Overview
This document outlines the approval workflows for financial requests in the system. The workflow engine supports configurable, multi-level approval processes with role-based routing.

## Workflow Configuration

### 1. Workflow Definition
Workflows are defined in metadata and linked to each request type (which belongs to a request group such as Financial, HR, Project, etc.). Each request type can have its own approval chain, routing logic, and limits, all stored as JSON in the `approval_flow_json` column of the `request_types` table.

#### Example: Approval Flow JSON Structure
```json
{
  "steps": [
    {"role": "team_lead", "action": "approve"},
    {"role": "accountant", "action": "clear", "approval_limit": 50000},
    {"role": "coo", "action": "approve", "min_amount": 50001},
    {"role": "ed", "action": "approve", "min_amount": 200000},
    {"role": "accountant", "action": "disburse"},
    {"role": "staff", "action": "confirm"},
    {"role": "staff", "action": "retire"},
    {"role": "accountant", "action": "complete"}
  ]
}
```

- Approval steps can be conditional on amount or request context.
- Routing is dynamic and metadata-driven.
- Each request type under a group (e.g., Financial) can have a unique flow.

---

### 2. Real-World Approval Flow Examples

#### a) Internet Purchase (Operational Request)
- **Group:** Financial
- **Type:** Internet Purchase
- **Flow:**
  1. Admin (requester)
  2. Team Lead (approve)
  3. Accountant (clear)
  4. COO (approve)
  5. Accountant (disburse)
  6. Staff (confirm/retire)
  7. Accountant (complete)

#### b) Petty Cash (<50k)
- **Group:** Financial
- **Type:** Petty Cash
- **Flow:**
  1. Staff (requester)
  2. Team Lead (approve)
  3. Accountant (clear & approve)
  4. Accountant (disburse)
  5. Staff (confirm/retire)
  6. Accountant (complete)

#### c) Salary Payment
- **Group:** Financial
- **Type:** Salary Payment
- **Flow:**
  1. Admin (requester)
  2. Team Lead (approve)
  3. Accountant (clear)
  4. COO (approve)
  5. ED (approve)
  6. Accountant (disburse)
  7. Staff (confirm/retire)
  8. Accountant (complete)

#### d) Project Flight Ticket
- **Group:** Financial
- **Type:** Project Flight Ticket
- **Flow:**
  1. Admin (requester)
  2. Team Lead (approve)
  3. Accountant (clear)
  4. Project Manager (approve)
  5. COO (approve, if required)
  6. Accountant (disburse)
  7. Staff (confirm/retire)
  8. Accountant (complete)

---

### 3. Dynamic Routing and Escalation
- Approval steps can be skipped or added based on request amount, type, project, or other metadata.
- If an approver does not act within a defined time, escalation rules (in the JSON) determine the next approver or escalate to a higher role.

### 4. Workflow Metadata Location
- All approval flows are stored in the `approval_flow_json` field of the `request_types` table, which references its parent `request_group`.
- This enables easy updates, auditing, and extensibility.

### 2. Workflow Types

#### 2.1 Amount-Based Workflow
Routes requests based on the total amount:

```json
{
  "workflow_name": "amount_based_approval",
  "description": "Approval workflow based on request amount",
  "is_active": true,
  "conditions": [
    {
      "condition_type": "amount_less_than",
      "value": 100000,
      "approval_levels": [
        {
          "level": 1,
          "approver_roles": ["department_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        }
      ]
    },
    {
      "condition_type": "amount_between",
      "min_value": 100000,
      "max_value": 500000,
      "approval_levels": [
        {
          "level": 1,
          "approver_roles": ["department_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        },
        {
          "level": 2,
          "approver_roles": ["finance_officer"],
          "is_parallel": false,
          "escalation_after_hours": 24
        }
      ]
    },
    {
      "condition_type": "amount_greater_than",
      "value": 500000,
      "approval_levels": [
        {
          "level": 1,
          "approver_roles": ["department_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        },
        {
          "level": 2,
          "approver_roles": ["finance_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        },
        {
          "level": 3,
          "approver_roles": ["finance_director"],
          "is_parallel": false,
          "escalation_after_hours": 24
        }
      ]
    }
  ]
}
```

#### 2.2 Request Type Workflow
Routes requests based on the type of request:

```json
{
  "workflow_name": "request_type_approval",
  "description": "Approval workflow based on request type",
  "is_active": true,
  "conditions": [
    {
      "condition_type": "request_type_equals",
      "value": "travel",
      "approval_levels": [
        {
          "level": 1,
          "approver_roles": ["department_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        },
        {
          "level": 2,
          "approver_roles": ["hr_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        }
      ]
    },
    {
      "condition_type": "request_type_equals",
      "value": "purchase",
      "approval_levels": [
        {
          "level": 1,
          "approver_roles": ["department_manager"],
          "is_parallel": false,
          "escalation_after_hours": 24
        },
        {
          "level": 2,
          "approver_roles": ["procurement_officer"],
          "is_parallel": true
        },
        {
          "level": 2,
          "approver_roles": ["finance_officer"],
          "is_parallel": true
        }
      ]
    }
  ]
}
```

## Workflow States

### 1. Draft
- Request is being prepared by the requester
- Can be modified or deleted
- Not visible to approvers

### 2. Submitted
- Request has been submitted for approval
- Cannot be modified by requester
- Visible to approvers based on workflow

### 3. Pending Approval
- Request is awaiting action from approvers
- Approvers can approve, reject, or request changes
- System sends reminders based on configuration

### 4. Approved
- All required approvals have been obtained
- Request moves to fulfillment stage
- Notifications sent to relevant parties

### 5. Rejected
- Request has been rejected by an approver
- Requester is notified with reason
- Can be resubmitted after changes

### 6. Changes Requested
- Approver has requested changes
- Request returns to draft status
- Requester is notified of required changes

### 7. Completed
- Request has been fulfilled
- All required documentation submitted
- No further action required

## Escalation Process

### 1. Time-Based Escalation
- If an approver doesn't act within the specified time:
  - Notification is sent to the next person in the escalation chain
  - Original approver is marked as "escalated"
  - System logs the escalation for audit purposes

### 2. Hierarchy Escalation
- If primary approver is unavailable:
  - Request is escalated to their manager
  - System notifies the manager of the escalation
  - Original approver is kept in the loop

## Notifications

### 1. Request Submitted
- Sent to first-level approvers
- Includes request details and action link

### 2. Approval Required
- Sent to approvers when action is needed
- Includes due date and priority

### 3. Request Approved/Rejected
- Sent to requester and all involved approvers
- Includes decision and comments

### 4. Escalation Notice
- Sent when a request is escalated
- Informs of the delay and next steps

### 5. Completion Notice
- Sent when request is fully processed
- Includes summary and next steps

## Configuration Options

### 1. Approval Levels
- Define multiple levels of approval
- Set parallel or sequential approval paths
- Configure approvers by role or specific users

### 2. Conditions
- Route requests based on amount, type, department, etc.
- Support for complex conditions using AND/OR logic
- Fallback to default workflow if no conditions match

### 3. Notifications
- Customize email templates
- Configure notification channels (email, in-app, SMS)
- Set notification schedules and reminders

### 4. Escalation Rules
- Define escalation timeframes
- Configure escalation paths
- Set maximum escalation levels

## Implementation Notes

1. **Performance Considerations**
   - Cache workflow definitions
   - Optimize database queries for approval lookups
   - Use background jobs for notifications

2. **Security Considerations**
   - Validate all workflow configurations
   - Implement proper access controls
   - Log all workflow actions

3. **Audit Trail**
   - Record all state changes
   - Track approver actions and comments
   - Maintain history of workflow changes
