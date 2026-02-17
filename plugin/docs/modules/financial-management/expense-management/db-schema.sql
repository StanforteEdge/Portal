-- Financial Management - Database Integration (Updated)
-- NO NEW TABLES REQUIRED - Uses Existing Core System Tables

/*
===============================================================================
FINANCIAL MODULE DATABASE INTEGRATION
===============================================================================

This module extends the existing Core systems rather than creating new tables.
All financial functionality is built on top of existing infrastructure.

===============================================================================
EXISTING TABLES USED (No New Tables Created)
===============================================================================
*/

-- =============================================================================
-- EXISTING REQUEST SYSTEM TABLES (Extended for Financial Use)
-- =============================================================================

-- sta_request_types: Extended with financial request types
/*
INSERT INTO sta_request_types (
    id, name, code_prefix, group_id, form_schema, approval_flow_json, is_active
) VALUES
(
    'operational-request',
    'Operational Request',
    'OPR',
    'financial',
    '{
        "is_reimbursement": {"type": "boolean", "default": false},
        "team_id": {"type": "string"},
        "budget_id": {"type": "string"},
        "category": {"type": "select", "options": ["supplies", "services", "equipment"]},
        "due_date": {"type": "date", "required": true},
        "purpose": {"type": "textarea", "max_length": 500},
        "items": {
            "type": "array",
            "schema": {
                "description": {"type": "string", "required": true},
                "quantity": {"type": "number", "minimum": 1},
                "unit_price": {"type": "number", "minimum": 0},
                "is_cash_advance": {"type": "boolean", "default": false},
                "attachment": {"type": "file", "optional": true}
            }
        }
    }',
    '{
        "steps": [
            {"role": "team_lead", "action": "approve"},
            {"role": "finance_officer", "action": "clear"},
            {"role": "coo", "action": "approve", "min_amount": 500001}
        ]
    }',
    TRUE
);
*/

-- sta_request_instances: Stores all financial requests
-- sta_request_items: Stores financial request line items
-- sta_request_groups: Contains 'financial' group

-- =============================================================================
-- EXISTING WORKFLOW SYSTEM TABLES (Extended for Financial Approvals)
-- =============================================================================

-- sta_workflows: Contains financial approval workflows
-- sta_workflow_steps: Contains approval steps with conditions
-- sta_workflow_instances: Tracks approval progress for each request

-- =============================================================================
-- EXISTING NOTIFICATION SYSTEM TABLES (Extended for Financial Alerts)
-- =============================================================================

-- sta_notifications: Stores financial-related notifications
-- sta_notification_templates: Contains financial notification templates

-- =============================================================================
-- EXISTING FILE STORAGE TABLES (Used for Receipt Attachments)
-- =============================================================================

-- sta_files: Stores receipt attachments and supporting documents
-- File metadata includes entity_type = 'financial_request_item'

-- =============================================================================
-- EXISTING USER MANAGEMENT TABLES (Used for Permissions & Roles)
-- =============================================================================

-- wp_users: Core WordPress users table
-- sta_user_roles: User role assignments
-- sta_permissions: System permissions
-- sta_role_permissions: Role-permission mappings

/*
===============================================================================
FINANCIAL-SPECIFIC EXTENSIONS (Optional - If Needed)
===============================================================================
*/

-- Optional: Financial Categories (could be taxonomy instead)
/*
CREATE TABLE IF NOT EXISTS sta_financial_categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- operational, project, petty_cash, administrative
    parent_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (parent_id) REFERENCES sta_financial_categories(id)
);
*/

-- Optional: Budget Tracking (could extend existing budget system)
/*
CREATE TABLE IF NOT EXISTS sta_budget_allocations (
    id CHAR(36) PRIMARY KEY,
    budget_id CHAR(36) NOT NULL,
    department_id CHAR(36),
    category_id CHAR(36),
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    fiscal_year YEAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_budget (budget_id),
    INDEX idx_department (department_id),
    INDEX idx_category (category_id),
    INDEX idx_fiscal_year (fiscal_year)
);
*/

-- Optional: Approval Limits (could be configuration instead)
/*
CREATE TABLE IF NOT EXISTS sta_approval_limits (
    id CHAR(36) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    request_type VARCHAR(50),
    max_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role_name),
    INDEX idx_request_type (request_type)
);
*/

-- Optional: Reimbursement Tracking (could extend request items)
/*
CREATE TABLE IF NOT EXISTS sta_reimbursements (
    id CHAR(36) PRIMARY KEY,
    request_item_id CHAR(36) NOT NULL,
    reimbursement_amount DECIMAL(15,2) NOT NULL,
    reimbursement_date DATE,
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_request_item (request_item_id),
    INDEX idx_status (status),
    FOREIGN KEY (request_item_id) REFERENCES sta_request_items(id)
);
*/

/*
===============================================================================
CONFIGURATION INSTEAD OF TABLES
===============================================================================

Many "financial-specific" features can be implemented as configuration
rather than requiring new database tables:

1. Approval Limits: JSON configuration in request type settings
2. Categories: Taxonomy system or simple configuration arrays
3. Budget Tracking: Extend existing budget system if available
4. Reimbursements: Additional fields in request items

This keeps the system lean while maintaining flexibility.
===============================================================================
*/

-- Sample configuration for approval limits (stored in request type)
/*
{
  "approval_limits": {
    "team_lead": 50000,
    "finance_officer": 250000,
    "coo": 1000000,
    "executive_director": 5000000,
    "board_member": 10000000
  },
  "escalation_rules": {
    "auto_escalate_after_days": 3,
    "notify_higher_approver": true,
    "allow_delegation": true
  }
}
*/

-- This approach leverages existing infrastructure while adding financial-specific features through configuration and minimal extensions.
