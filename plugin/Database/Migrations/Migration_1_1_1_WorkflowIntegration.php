<?php

namespace App\Database\Migrations;

class Migration_1_1_1_WorkflowIntegration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // Add workflow_instance_id to requests table if it doesn't exist
        $column_exists = $wpdb->get_var("SHOW COLUMNS FROM {$wpdb->prefix}sta_requests LIKE 'workflow_instance_id'");
        
        if (!$column_exists) {
            // First, check if the workflow_instances table exists
            $instances_table = $wpdb->prefix . 'sta_workflow_instances';
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$instances_table}'");
            
            if ($table_exists) {
                $wpdb->query("
                    ALTER TABLE {$wpdb->prefix}sta_requests
                    ADD COLUMN workflow_instance_id BIGINT UNSIGNED NULL AFTER status,
                    ADD CONSTRAINT fk_requests_workflow_instance 
                        FOREIGN KEY (workflow_instance_id) 
                        REFERENCES {$wpdb->prefix}sta_workflow_instances(id) 
                        ON DELETE SET NULL
                ");
                
                error_log('Added workflow_instance_id to sta_requests table');
            } else {
                error_log('Warning: sta_workflow_instances table does not exist. Skipping foreign key constraint.');
                
                $wpdb->query("
                    ALTER TABLE {$wpdb->prefix}sta_requests
                    ADD COLUMN workflow_instance_id BIGINT UNSIGNED NULL AFTER status
                ");
                
                error_log('Added workflow_instance_id to sta_requests table without foreign key');
            }
        }

        // Convert existing approval_flow_json to workflow definitions
        self::migrateExistingWorkflows();
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public static function down()
    {
        global $wpdb;
        
        // Check if the column exists before trying to drop it
        $column_exists = $wpdb->get_var("SHOW COLUMNS FROM {$wpdb->prefix}sta_requests LIKE 'workflow_instance_id'");
        
        if ($column_exists) {
            // Try to remove foreign key constraint if it exists
            $constraint_check = $wpdb->get_row($wpdb->prepare(
                "SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = %s
                AND COLUMN_NAME = 'workflow_instance_id'
                AND REFERENCED_TABLE_NAME IS NOT NULL",
                $wpdb->prefix . 'sta_requests'
            ));
            
            if ($constraint_check) {
                $wpdb->query($wpdb->prepare(
                    "ALTER TABLE {$wpdb->prefix}sta_requests
                    DROP FOREIGN KEY %s",
                    $constraint_check->CONSTRAINT_NAME
                ));
                
                error_log('Dropped foreign key constraint from sta_requests table');
            }
            
            // Drop the column
            $wpdb->query("
                ALTER TABLE {$wpdb->prefix}sta_requests
                DROP COLUMN workflow_instance_id
            ");
            
            error_log('Dropped workflow_instance_id column from sta_requests table');
        }
    }

    /**
     * Migrate existing approval flows to workflow definitions
     * 
     * @return void
     */
    protected static function migrateExistingWorkflows()
    {
        global $wpdb;
        
        // Get all request types with approval flows
        $requestTypes = $wpdb->get_results("
            SELECT id, name, description, approval_flow_json 
            FROM {$wpdb->prefix}sta_request_types 
            WHERE approval_flow_json IS NOT NULL
        ");
        
        foreach ($requestTypes as $type) {
            $flow = json_decode($type->approval_flow_json, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                continue; // Skip invalid JSON
            }
            
            // Create workflow
            $workflowId = $wpdb->insert(
                "{$wpdb->prefix}sta_workflows",
                [
                    'name' => $type->name . ' Workflow',
                    'description' => $type->description . ' (Migrated from request type)',
                    'entity_type' => 'request',
                    'is_active' => 1,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ]
            );
            
            if (!$workflowId) {
                continue;
            }
            
            self::migrateApprovalFlowToWorkflow($workflowId, $flow);
        }
    }
    
    /**
     * Convert approval flow JSON to workflow steps and transitions
     * 
     * @param int $workflowId
     * @param array $flow
     * @return void
     */
    protected static function migrateApprovalFlowToWorkflow($workflowId, array $flow)
    {
        global $wpdb;
        
        $steps = [];
        $transitions = [];
        
        // Create steps
        foreach ($flow['steps'] as $index => $stepConfig) {
            $stepType = self::mapStepType($stepConfig['action']);
            $isInitial = $index === 0;
            $isFinal = $index === count($flow['steps']) - 1;
            
            $stepId = $wpdb->insert(
                "{$wpdb->prefix}sta_workflow_steps",
                [
                    'workflow_id' => $workflowId,
                    'name' => ucfirst($stepConfig['action']),
                    'step_type' => $stepType,
                    'order_num' => $index + 1,
                    'is_initial_step' => $isInitial ? 1 : 0,
                    'is_final_step' => $isFinal ? 1 : 0,
                    'config' => json_encode([
                        'original_action' => $stepConfig['action'],
                        'approval_limit' => $stepConfig['approval_limit'] ?? null,
                        'min_amount' => $stepConfig['min_amount'] ?? null
                    ]),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ]
            );
            
            if ($stepId) {
                $steps[$index] = $stepId;
                
                // Add approvers
                if (isset($stepConfig['role'])) {
                    $wpdb->insert(
                        "{$wpdb->prefix}sta_workflow_step_approvers",
                        [
                            'step_id' => $stepId,
                            'approver_type' => 'role',
                            'approver_id' => self::getRoleIdByName($stepConfig['role']),
                            'is_required' => 1,
                            'created_at' => current_time('mysql'),
                            'updated_at' => current_time('mysql')
                        ]
                    );
                }
                
                // Create transition from previous step if exists
                if (isset($steps[$index - 1])) {
                    $transitions[] = [
                        'workflow_id' => $workflowId,
                        'from_step_id' => $steps[$index - 1],
                        'to_step_id' => $stepId,
                        'name' => 'Proceed to ' . ucfirst($stepConfig['action']),
                        'config' => json_encode(self::buildConditions($stepConfig)),
                        'actions' => '[]',
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ];
                }
            }
        }
        
        // Batch insert transitions
        if (!empty($transitions)) {
            $wpdb->insert(
                "{$wpdb->prefix}sta_workflow_transitions",
                $transitions
            );
        }
    }
    
    /**
     * Map request action to workflow step type
     * 
     * @param string $action
     * @return string
     */
    protected static function mapStepType(string $action): string
    {
        return match ($action) {
            'approve' => 'approval',
            'clear' => 'review',
            'disburse' => 'approval',
            'confirm' => 'notification',
            'retire' => 'approval',
            'complete' => 'end',
            default => 'approval'
        };
    }
    
    /**
     * Build conditions from step config
     * 
     * @param array $stepConfig
     * @return array
     */
    protected static function buildConditions(array $stepConfig): array
    {
        $conditions = [];
        
        if (isset($stepConfig['min_amount'])) {
            $conditions[] = [
                'type' => 'amount_greater_than',
                'config' => [
                    'field' => 'amount',
                    'value' => $stepConfig['min_amount']
                ]
            ];
        }
        
        if (isset($stepConfig['approval_limit'])) {
            $conditions[] = [
                'type' => 'amount_less_than',
                'config' => [
                    'field' => 'amount',
                    'value' => $stepConfig['approval_limit']
                ]
            ];
        }
        
        return $conditions;
    }
    
    /**
     * Get role ID by name
     * 
     * @param string $roleName
     * @return int|null
     */
    protected static function getRoleIdByName(string $roleName): ?int
    {
        global $wpdb;
        return $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}sta_roles WHERE name = %s",
            $roleName
        ));
    }
}
