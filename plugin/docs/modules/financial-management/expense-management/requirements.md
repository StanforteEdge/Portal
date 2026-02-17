# Financial Management – Requirements & Integration (Updated)

## 1. Overview
Financial Management extends the existing Core Request System to provide comprehensive financial request management. Instead of building new systems, we leverage existing infrastructure for requests, workflows, notifications, and file storage.

## 2. Architecture: Extension vs. New System

### ✅ APPROACH: Extend Existing Core Systems
**Why this approach:**
- Leverage proven, tested systems
- Maintain consistency across all request types
- Reduce development time and complexity
- Unified user experience and maintenance

### ❌ AVOIDED: Build New Financial System
**What we DON'T do:**
- No new database tables for core functionality
- No separate workflow engine
- No duplicate notification system
- No isolated file storage

## 3. Core System Integration Requirements

### A. Request System Extension
#### Extend Existing Request Types
- ✅ Add financial request types to `sta_request_types` table
- ✅ Configure form schemas with financial-specific fields
- ✅ Set up approval flows using existing workflow engine
- ✅ Use existing request lifecycle states

#### Financial Request Types to Implement:
1. **Operational Request** (OPR) - Max: ₦1M, Flow: Staff → Team Lead → Finance → COO
2. **Project Request** (PRJ) - Max: ₦5M, Flow: Staff → Team Lead → Finance → COO
3. **Petty Cash Request** (PTC) - Max: ₦100K, Flow: Staff → Team Lead → Finance
4. **Administrative Request** (ADM) - Max: ₦5M, Flow: Staff → Team Lead → Finance → COO → ED
5. **Special Request** (SPC) - Max: ₦10M, Flow: Staff → Team Lead → Finance → COO → ED → Board

### B. Workflow Engine Integration
#### Leverage Existing Workflow System
- ✅ Use existing `sta_workflows` and `sta_workflow_steps` tables
- ✅ Configure conditional approval routing based on amounts
- ✅ Implement role-based approval limits
- ✅ Set up sequential progression (COO → ED)

#### Amount-Based Conditional Routing:
```json
{
  "conditions": [
    {
      "condition": "amount <= 500000",
      "steps": [
        {"role": "team_lead", "action": "approve"},
        {"role": "finance_officer", "action": "approve", "is_final": true}
      ]
    },
    {
      "condition": "amount > 500000 && amount <= 1000000",
      "steps": [
        {"role": "team_lead", "action": "approve"},
        {"role": "finance_officer", "action": "approve"},
        {"role": "coo", "action": "approve", "is_final": true}
      ]
    },
    {
      "condition": "amount > 1000000",
      "steps": [
        {"role": "team_lead", "action": "approve"},
        {"role": "finance_officer", "action": "approve"},
        {"role": "coo", "action": "approve"},
        {"role": "executive_director", "action": "approve", "is_final": true}
      ]
    }
  ]
}
```

### C. Notification System Integration
#### Use Existing Notification Templates
- ✅ Configure financial-specific notification templates
- ✅ Set up approval stage notifications
- ✅ Configure escalation reminders
- ✅ Enable status update alerts

#### Key Notification Events:
- Request submitted to approvers
- Approval required reminders
- Request approved/rejected notifications
- Escalation alerts for overdue approvals
- Status updates to requesters

### D. File Storage Integration
#### Leverage Existing FileStorage System
- ✅ Configure file upload rules for receipts
- ✅ Set up secure storage with retention policies
- ✅ Enable virus scanning and validation
- ✅ Configure file access permissions

#### Attachment Requirements:
- File types: PDF, JPG, PNG, DOC, DOCX
- Max size: 10MB per file
- Retention: 7 years for financial records
- Security: Encrypted storage with access logging

## 4. Financial-Specific Requirements

### A. Form Schema Requirements
Each financial request type requires specific form fields:
```json
{
  "is_reimbursement": {"type": "boolean", "default": false},
  "team_id": {"type": "select", "source": "user_teams"},
  "project_id": {"type": "select", "conditional": "request_type=project"},
  "budget_id": {"type": "select", "conditional": "request_type!=petty_cash"},
  "category": {"type": "select", "options": ["supplies", "services", "equipment", "travel"]},
  "due_date": {"type": "date", "required": true},
  "purpose": {"type": "textarea", "max_length": 500},
  "items": {
    "type": "array",
    "schema": {
      "description": {"type": "string", "required": true},
      "quantity": {"type": "number", "minimum": 1},
      "unit_price": {"type": "number", "minimum": 0},
      "amount": {"type": "number", "calculated": true},
      "is_cash_advance": {"type": "boolean", "default": false},
      "attachment": {"type": "file", "optional": true}
    }
  }
}
```

### B. Approval Limit Requirements
Approval limits configured by role and request type:
```json
{
  "approval_limits": {
    "team_lead": {"default": 50000, "petty_cash": 15000},
    "finance_officer": {"default": 250000, "petty_cash": 50000},
    "coo": {"default": 1000000, "petty_cash": 100000},
    "executive_director": {"default": 5000000},
    "board_member": {"default": 10000000}
  },
  "escalation_rules": {
    "auto_escalate_after_days": 3,
    "notify_higher_approver": true,
    "allow_delegation": true
  }
}
```

### C. Request Lifecycle States
Extended request states for financial process:
```
Draft → Submitted → Under Review → Approved → Disbursed → Confirmed → Retired → Completed
```

## 5. User Role Requirements

### A. Requester Role
- ✅ Create and submit financial requests
- ✅ Upload receipts and supporting documents
- ✅ View request status and history
- ✅ Cancel draft requests
- ✅ Receive status notifications

### B. Approver Roles
- ✅ View requests pending approval
- ✅ Approve, reject, or request changes
- ✅ Add approval comments
- ✅ Delegate approval authority
- ✅ View request audit trails

### C. Finance Officer Role
- ✅ View all financial requests
- ✅ Override approvals when necessary
- ✅ Generate financial reports
- ✅ Manage financial categories and policies

## 6. Integration Points

### A. User Management Integration
- ✅ Role-based permissions using existing system
- ✅ Team-based request filtering
- ✅ User profile integration
- ✅ Multi-team user support

### B. Document Library Integration
- ✅ Link policy documents to forms
- ✅ Reference financial guidelines
- ✅ Compliance document access
- ✅ Version control for policies

### C. Audit Trail Integration
- ✅ Complete logging of all financial actions
- ✅ Compliance-ready audit reports
- ✅ Action tracking and reporting
- ✅ Financial transaction history

## 7. Performance Requirements

### A. Response Times
- ✅ Request list loading: < 2 seconds
- ✅ Form submission: < 3 seconds
- ✅ File upload: < 5 seconds
- ✅ Report generation: < 10 seconds

### B. Scalability
- ✅ Support 100+ concurrent users
- ✅ Handle 1000+ requests per month
- ✅ File storage up to 100GB
- ✅ Notification delivery within 30 seconds

## 8. Security Requirements

### A. Data Protection
- ✅ Encrypt all financial data at rest and in transit
- ✅ Role-based access control for all operations
- ✅ Secure file storage with access logging
- ✅ Audit all financial transactions

### B. Compliance
- ✅ Financial record retention (7 years minimum)
- ✅ Complete audit trails for all actions
- ✅ Secure approval workflows
- ✅ Compliance reporting capabilities

## 9. Configuration Requirements

### A. Metadata-Driven Configuration
- ✅ Request types configured via JSON schemas
- ✅ Approval workflows defined as metadata
- ✅ Notification templates configured via system
- ✅ Categories and limits managed as configuration

### B. Flexible Rule Engine
- ✅ Amount-based routing rules
- ✅ Role-specific approval limits
- ✅ Conditional workflow branching
- ✅ Escalation rule configuration

This requirements document reflects the integration approach that leverages existing Core systems while adding comprehensive financial management capabilities.
