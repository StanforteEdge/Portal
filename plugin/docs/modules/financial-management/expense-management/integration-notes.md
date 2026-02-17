# Expense Management – Integration Notes (Updated)

## Overview
This document outlines how the Expense Management module integrates with the existing Core systems rather than building new infrastructure. We leverage the existing Request System, Workflow Engine, Notification System, and FileStorage to provide comprehensive financial request management.

## Architecture: Extension vs. New System

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

## Integration Strategy

### 1. Request System Integration

#### Extend Existing Request Types
```php
// Add financial request types to existing sta_request_types table
$financialRequestTypes = [
    [
        'name' => 'Operational Request',
        'code_prefix' => 'OPR',
        'group_id' => 'financial',
        'max_amount' => 1000000,
        'form_schema' => [
            'is_reimbursement' => ['type' => 'boolean'],
            'team_id' => ['type' => 'string'],
            'budget_id' => ['type' => 'string'],
            'category' => ['type' => 'select'],
            'due_date' => ['type' => 'date'],
            'purpose' => ['type' => 'textarea'],
            'items' => [
                'type' => 'array',
                'schema' => [
                    'description' => ['type' => 'string'],
                    'quantity' => ['type' => 'number'],
                    'unit_price' => ['type' => 'number'],
                    'is_cash_advance' => ['type' => 'boolean'],
                    'attachment' => ['type' => 'file']
                ]
            ]
        ],
        'approval_flow_json' => [
            'steps' => [
                ['role' => 'team_lead', 'action' => 'approve'],
                ['role' => 'finance_officer', 'action' => 'clear'],
                ['role' => 'coo', 'action' => 'approve', 'min_amount' => 500001]
            ]
        ]
    ]
];
```

#### Use Existing Request Tables
- ✅ **sta_request_instances**: Store financial requests
- ✅ **sta_request_items**: Store line items
- ✅ **sta_request_types**: Define financial request types
- ✅ **sta_request_groups**: Group under 'financial' category

### 2. Workflow Engine Integration

#### Leverage Existing Workflow System
```php
// Use existing sta_workflows and sta_workflow_steps tables
$financialWorkflows = [
    [
        'name' => 'Petty Cash Approval',
        'entity_type' => 'request',
        'is_active' => true,
        'config' => [
            'request_type' => 'petty_cash',
            'max_amount' => 100000,
            'conditions' => [
                [
                    'field' => 'total_amount',
                    'operator' => '<=',
                    'value' => 50000,
                    'steps' => [
                        ['order' => 1, 'role' => 'team_lead', 'action' => 'approve'],
                        ['order' => 2, 'role' => 'finance_officer', 'action' => 'approve', 'is_final' => true]
                    ]
                ]
            ]
        ]
    ]
];
```

#### Conditional Approval Routing
- ✅ **Amount-based routing**: Different paths based on request amount
- ✅ **Role-based limits**: Approvers have approval ceilings
- ✅ **Sequential progression**: COO → ED based on conditions
- ✅ **Escalation logic**: Automatic escalation when limits exceeded

### 3. Notification System Integration

#### Use Existing Notification Templates
```php
// Leverage existing sta_notifications and sta_notification_templates
$financialNotificationTemplates = [
    [
        'name' => 'financial_request_submitted',
        'subject' => 'Financial Request Submitted: {{request_number}}',
        'content' => 'A {{request_type}} request for ₦{{amount}} has been submitted by {{requester}}.',
        'type' => 'info',
        'channels' => ['in_app', 'email']
    ],
    [
        'name' => 'financial_approval_required',
        'subject' => 'Approval Required: {{request_number}}',
        'content' => '{{request_type}} request for ₦{{amount}} requires your approval.',
        'type' => 'action',
        'channels' => ['in_app', 'email', 'sms']
    ]
];
```

#### Automatic Notifications
- ✅ **Submission alerts**: Notify approvers when requests submitted
- ✅ **Approval reminders**: Escalation notifications for overdue approvals
- ✅ **Status updates**: Keep requestors informed of progress
- ✅ **Completion notices**: Final notifications when requests processed

### 4. File Storage Integration

#### Use Existing FileStorage System
```php
// Leverage existing sta_files and file upload functionality
$receiptUploadConfig = [
    'entity_type' => 'financial_request_item',
    'allowed_extensions' => ['pdf', 'jpg', 'png', 'doc', 'docx'],
    'max_file_size' => 10 * 1024 * 1024, // 10MB
    'virus_scanning' => true,
    'retention_policy' => [
        'duration' => '7_years',
        'auto_delete' => false
    ]
];
```

#### Attachment Management
- ✅ **Receipt uploads**: Attach receipts to request items
- ✅ **Secure storage**: Encrypted file storage with access controls
- ✅ **Version control**: Track document versions
- ✅ **Audit trail**: Log all file access and modifications

### 5. User Management Integration

#### Leverage Existing User Roles
```php
// Use existing user roles and permissions
$financialRoles = [
    'staff' => [
        'permissions' => [
            'create_financial_requests',
            'view_own_requests',
            'upload_receipts',
            'cancel_draft_requests'
        ]
    ],
    'team_lead' => [
        'permissions' => [
            'view_assigned_requests',
            'approve_requests',
            'reject_requests',
            'add_comments',
            'delegate_approval'
        ]
    ],
    'coo' => [
        'permissions' => [
            'view_all_financial_requests',
            'approve_requests',
            'reject_requests',
            'add_comments',
            'delegate_approval',
            'override_approvals',
            'generate_reports',
            'manage_categories'
        ]
    ],
    'ed' => [
        'permissions' => [
            'view_all_financial_requests',
            'approve_requests',
            'reject_requests',
            'add_comments',
            'delegate_approval',
            'override_approvals',
            'generate_reports',
            'manage_categories'
        ]
    ],
    'board_member' => [
        'permissions' => [
            'view_all_financial_requests',
            'approve_requests',
            'reject_requests',
            'add_comments',
            'delegate_approval',
            'override_approvals',
            'generate_reports',
            'manage_categories'
        ]
    ],
    'finance_officer' => [
        'permissions' => [
            'view_all_financial_requests',
            'approve_requests',
            'reject_requests',
            'add_comments',
            'delegate_approval',
            'override_approvals',
            'generate_reports',
            'manage_categories'
        ]
    ]
];
```

#### Team-Based Access
- ✅ **Team filtering**: Users see requests for their teams
- ✅ **Role hierarchies**: Different access levels based on position
- ✅ **Delegation support**: Approvers can delegate to substitutes
- ✅ **Audit logging**: Track all user actions

## Request Lifecycle Integration

### Standard Request States
```
Draft → Submitted → Under Review → Approved → Disbursed → Confirmed → Retired → Completed
```

### Financial-Specific Extensions
```php
$financialStates = [
    'disbursed' => [
        'description' => 'Funds have been disbursed to requester',
        'allowed_actions' => ['confirm_receipt'],
        'notification_template' => 'funds_disbursed'
    ],
    'retired' => [
        'description' => 'Receipts submitted and retirement approved',
        'allowed_actions' => ['mark_complete'],
        'notification_template' => 'retirement_approved'
    ]
];
```

## Budget Integration

### Link to Existing Budget System
```php
// Extend existing budget tracking
$budgetIntegration = [
    'validation_rules' => [
        'check_available_budget' => true,
        'prevent_over_allocation' => true,
        'require_budget_approval' => 'amount > 50000'
    ],
    'reporting' => [
        'budget_utilization' => true,
        'forecasting' => true,
        'variance_analysis' => true
    ]
];
```

## Reporting Integration

### Use Existing Reporting Framework
```php
// Extend existing reporting system
$financialReports = [
    'request_summary' => [
        'data_source' => 'sta_request_instances',
        'filters' => ['request_group' => 'financial'],
        'group_by' => ['request_type', 'status', 'month'],
        'metrics' => ['count', 'total_amount', 'avg_approval_time']
    ],
    'approval_efficiency' => [
        'data_source' => 'sta_workflow_instances',
        'filters' => ['entity_type' => 'request'],
        'metrics' => ['avg_approval_time', 'bottleneck_steps', 'escalation_rate']
    ]
];
```

## Implementation Phases

### Phase 1: Core Configuration (Week 1)
1. ✅ Configure financial request types in existing system
2. ✅ Set up approval workflows using existing workflow engine
3. ✅ Create notification templates for financial processes
4. ✅ Configure file upload rules for receipts

### Phase 2: Business Logic (Week 2)
1. ✅ Implement amount-based conditional routing
2. ✅ Add approval limit validation
3. ✅ Configure budget integration
4. ✅ Set up financial categories and taxonomy

### Phase 3: User Experience (Week 3)
1. ✅ Create role-based dashboards
2. ✅ Implement financial-specific form validations
3. ✅ Add financial reporting views
4. ✅ Configure mobile-optimized interfaces

### Phase 4: Advanced Features (Week 4)
1. ✅ Implement reimbursement workflow
2. ✅ Add retirement process
3. ✅ Configure disbursement tracking
4. ✅ Add advanced audit and compliance features

## Benefits of Integration Approach

### ✅ Development Efficiency
- **Reuse existing systems**: No need to rebuild core functionality
- **Faster time-to-market**: Leverage tested components
- **Reduced complexity**: Single codebase to maintain

### ✅ User Experience Consistency
- **Unified interface**: Same experience across all request types
- **Consistent workflows**: Familiar patterns for all users
- **Seamless navigation**: Integrated with existing portal features

### ✅ System Reliability
- **Proven components**: Use battle-tested systems
- **Unified security**: Single authentication and authorization
- **Centralized monitoring**: All systems monitored together

### ✅ Maintenance Advantages
- **Single update cycle**: Updates applied to all systems
- **Unified testing**: Test financial features with existing test suite
- **Shared resources**: Database connections, caching, logging

## Configuration Examples

### Request Type Configuration
```json
{
  "name": "Administrative Request",
  "code_prefix": "ADM",
  "group_id": "financial",
  "max_amount": 5000000,
  "form_schema": {
    "is_reimbursement": {"type": "boolean", "default": false},
    "team_id": {"type": "select", "source": "user_teams"},
    "category": {"type": "select", "options": ["supplies", "services", "equipment"]},
    "due_date": {"type": "date", "required": true},
    "purpose": {"type": "textarea", "max_length": 500},
    "items": {
      "type": "array",
      "min_items": 1,
      "schema": {
        "description": {"type": "string", "required": true},
        "quantity": {"type": "number", "minimum": 1},
        "unit_price": {"type": "number", "minimum": 0},
        "attachment": {"type": "file", "optional": true}
      }
    }
  }
}
```

### Workflow Configuration
```json
{
  "name": "Administrative Request Approval",
  "entity_type": "request",
  "is_active": true,
  "config": {
    "request_type": "administrative",
    "conditions": [
      {
        "condition": "amount <= 1000000",
        "steps": [
          {"order": 1, "role": "team_lead", "action": "approve"},
          {"order": 2, "role": "finance_officer", "action": "clear"},
          {"order": 3, "role": "coo", "action": "approve", "is_final": true}
        ]
      },
      {
        "condition": "amount > 1000000",
        "steps": [
          {"order": 1, "role": "team_lead", "action": "approve"},
          {"order": 2, "role": "finance_officer", "action": "clear"},
          {"order": 3, "role": "coo", "action": "approve"},
          {"order": 4, "role": "executive_director", "action": "approve", "is_final": true}
        ]
      }
    ]
  }
}
```

This integration approach provides a robust, scalable financial management system while leveraging the existing Core infrastructure for maximum efficiency and reliability.
