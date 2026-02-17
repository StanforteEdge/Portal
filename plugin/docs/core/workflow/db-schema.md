# Workflow Database Schema

## Core Tables

### sta_workflows
Stores workflow definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| name | VARCHAR(255) | Workflow name |
| description | TEXT | Workflow description |
| entity_type | VARCHAR(50) | Type of entity this workflow applies to (e.g., 'request', 'document') |
| is_active | TINYINT(1) | Whether the workflow is active |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### sta_workflow_steps
Defines the steps within a workflow.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| workflow_id | BIGINT | Foreign key to workflows |
| name | VARCHAR(255) | Step name |
| step_type | VARCHAR(50) | Type of step (e.g., 'approval', 'notification') |
| order_num | INT | Order of the step in the workflow |
| is_initial_step | TINYINT(1) | Whether this is the first step |
| is_final_step | TINYINT(1) | Whether this is the final step |
| config | JSON | Step-specific configuration |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### sta_workflow_step_approvers
Defines who can approve each step.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| step_id | BIGINT | Foreign key to workflow_steps |
| approver_type | VARCHAR(50) | Type of approver ('role', 'user', 'group') |
| approver_id | BIGINT | ID of the approver (role_id, user_id, etc.) |
| is_required | TINYINT(1) | Whether approval is required |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### sta_workflow_instances
Tracks individual workflow executions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| workflow_id | BIGINT | Foreign key to workflows |
| entity_type | VARCHAR(50) | Type of entity this instance is for |
| entity_id | BIGINT | ID of the entity this instance is for |
| current_step_id | BIGINT | Current step in the workflow |
| status | VARCHAR(50) | Current status of the workflow |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| completed_at | TIMESTAMP | When the workflow was completed |

### sta_workflow_history
Audit log of all workflow actions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| instance_id | BIGINT | Foreign key to workflow_instances |
| from_step_id | BIGINT | Step transitioned from |
| to_step_id | BIGINT | Step transitioned to |
| action | VARCHAR(100) | Action that triggered the transition |
| performed_by | BIGINT | User ID who performed the action |
| comment | TEXT | Optional comment |
| metadata | JSON | Additional metadata about the action |
| created_at | TIMESTAMP | When the action occurred |

## Relationships

- A Workflow has many WorkflowSteps
- A WorkflowStep has many WorkflowStepApprovers
- A WorkflowInstance belongs to a Workflow
- A WorkflowInstance has many WorkflowHistory entries
- A WorkflowInstance has one current WorkflowStep
