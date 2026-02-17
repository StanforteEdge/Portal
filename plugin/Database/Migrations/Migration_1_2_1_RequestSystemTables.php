<?php

namespace App\Database\Migrations;

class Migration_1_2_1_RequestSystemTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        self::ensureWorkflowTables($charset_collate);

        // 1. Request Groups table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_groups` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_active (is_active)
        ) $charset_collate;";
        dbDelta($sql);

        // 2. Request Types table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_types` (
            id CHAR(36) PRIMARY KEY,
            group_id CHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            code_prefix VARCHAR(10) NOT NULL,
            description TEXT,
            form_schema JSON,
            approval_flow_json JSON,
            approval_limit DECIMAL(15,2) NULL,
            sequence_counter INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES {$wpdb->prefix}sta_request_groups(id) ON DELETE CASCADE,
            INDEX idx_group_id (group_id),
            INDEX idx_code_prefix (code_prefix),
            INDEX idx_active (is_active),
            UNIQUE KEY unique_group_code_prefix (group_id, code_prefix)
        ) $charset_collate;";
        dbDelta($sql);

        // 3. Request Instances table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_instances` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            request_type_id CHAR(36) NOT NULL,
            group_id CHAR(36) NOT NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            team_id BIGINT UNSIGNED NULL,
            workflow_instance_id CHAR(36) NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'draft',
            data JSON,
            current_approval_step INT DEFAULT 0,
            audit_log_id CHAR(36) NULL,
            total_amount DECIMAL(15,2) NULL,
            currency VARCHAR(3) DEFAULT 'NGN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_type_id) REFERENCES {$wpdb->prefix}sta_request_types(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES {$wpdb->prefix}sta_request_groups(id) ON DELETE CASCADE,
            INDEX idx_request_type (request_type_id),
            INDEX idx_group (group_id),
            INDEX idx_created_by (created_by),
            INDEX idx_team (team_id),
            INDEX idx_status (status),
            INDEX idx_workflow (workflow_instance_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 4. Request Items table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_items` (
            id CHAR(36) PRIMARY KEY,
            request_id BIGINT UNSIGNED NOT NULL,
            category_id CHAR(36) NULL,
            subcategory_id CHAR(36) NULL,
            description TEXT NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            quantity INT DEFAULT 1,
            due_date DATE NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES {$wpdb->prefix}sta_request_instances(id) ON DELETE CASCADE,
            INDEX idx_request_id (request_id),
            INDEX idx_category (category_id),
            INDEX idx_subcategory (subcategory_id)
        ) $charset_collate;";
        dbDelta($sql);

        self::seedRequestGroups();
        self::seedRequestTypes();

        error_log('Stanforte Edge: Request system tables ensured by Migration_1_2_1_RequestSystemTables');
    }

    public static function down()
    {
        global $wpdb;

        $tables = [
            'sta_workflow_history',
            'sta_workflow_instances',
            'sta_workflow_transitions',
            'sta_workflow_step_approvers',
            'sta_workflow_steps',
            'sta_workflows',
            'sta_request_items',
            'sta_request_instances',
            'sta_request_types',
            'sta_request_groups'
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }

    private static function ensureWorkflowTables($charset_collate)
    {
        global $wpdb;

        // Workflows table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflows` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            description TEXT NULL,
            entity_type VARCHAR(100) NOT NULL,
            config JSON NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_by BIGINT UNSIGNED NULL,
            updated_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_entity_type (entity_type),
            INDEX idx_is_active (is_active)
        ) $charset_collate;";
        dbDelta($sql);

        // Workflow steps table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflow_steps` (
            id CHAR(36) PRIMARY KEY,
            workflow_id CHAR(36) NOT NULL,
            name VARCHAR(150) NOT NULL,
            description TEXT NULL,
            step_type VARCHAR(50) DEFAULT 'approval',
            `order` INT DEFAULT 0,
            is_initial BOOLEAN DEFAULT FALSE,
            is_final BOOLEAN DEFAULT FALSE,
            config JSON NULL,
            created_by BIGINT UNSIGNED NULL,
            updated_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workflow_id) REFERENCES {$wpdb->prefix}sta_workflows(id) ON DELETE CASCADE,
            INDEX idx_workflow (workflow_id),
            INDEX idx_order (workflow_id, `order`)
        ) $charset_collate;";
        dbDelta($sql);

        // Workflow step approvers table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflow_step_approvers` (
            id CHAR(36) PRIMARY KEY,
            step_id CHAR(36) NOT NULL,
            approver_type ENUM('user','role','group') NOT NULL,
            approver_id VARCHAR(64) NOT NULL,
            is_required BOOLEAN DEFAULT TRUE,
            approval_order INT DEFAULT 0,
            created_by BIGINT UNSIGNED NULL,
            updated_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (step_id) REFERENCES {$wpdb->prefix}sta_workflow_steps(id) ON DELETE CASCADE,
            INDEX idx_step (step_id),
            INDEX idx_approver (approver_type, approver_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Workflow transitions table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflow_transitions` (
            id CHAR(36) PRIMARY KEY,
            workflow_id CHAR(36) NOT NULL,
            from_step_id CHAR(36) NOT NULL,
            to_step_id CHAR(36) NOT NULL,
            name VARCHAR(150) NULL,
            description TEXT NULL,
            action VARCHAR(50) NOT NULL,
            conditions JSON NULL,
            config JSON NULL,
            created_by BIGINT UNSIGNED NULL,
            updated_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workflow_id) REFERENCES {$wpdb->prefix}sta_workflows(id) ON DELETE CASCADE,
            FOREIGN KEY (from_step_id) REFERENCES {$wpdb->prefix}sta_workflow_steps(id) ON DELETE CASCADE,
            FOREIGN KEY (to_step_id) REFERENCES {$wpdb->prefix}sta_workflow_steps(id) ON DELETE CASCADE,
            INDEX idx_workflow (workflow_id),
            INDEX idx_from_step (from_step_id),
            INDEX idx_to_step (to_step_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Workflow instances table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflow_instances` (
            id CHAR(36) PRIMARY KEY,
            workflow_id CHAR(36) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id CHAR(36) NOT NULL,
            current_step_id CHAR(36) NULL,
            status VARCHAR(32) DEFAULT 'pending',
            initiated_by BIGINT UNSIGNED NULL,
            completed_at TIMESTAMP NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workflow_id) REFERENCES {$wpdb->prefix}sta_workflows(id) ON DELETE CASCADE,
            FOREIGN KEY (current_step_id) REFERENCES {$wpdb->prefix}sta_workflow_steps(id) ON DELETE SET NULL,
            INDEX idx_workflow (workflow_id),
            INDEX idx_entity (entity_type, entity_id),
            INDEX idx_status (status)
        ) $charset_collate;";
        dbDelta($sql);

        // Workflow history table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_workflow_history` (
            id CHAR(36) PRIMARY KEY,
            instance_id CHAR(36) NOT NULL,
            transition_id CHAR(36) NULL,
            from_step_id CHAR(36) NULL,
            to_step_id CHAR(36) NULL,
            action VARCHAR(50) NOT NULL,
            performed_by BIGINT UNSIGNED NULL,
            comment TEXT NULL,
            data JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_instance (instance_id),
            INDEX idx_transition (transition_id),
            INDEX idx_from_step (from_step_id),
            INDEX idx_to_step (to_step_id),
            INDEX idx_performed_by (performed_by)
        ) $charset_collate;";
        dbDelta($sql);
    }

    private static function seedRequestGroups()
    {
        global $wpdb;

        $groups = [
            ['code' => 'finance', 'name' => 'Finance', 'description' => 'Finance module requests'],
            ['code' => 'HR', 'name' => 'Human Resources', 'description' => 'HR requests including leave, training, recruitment'],
            ['code' => 'PROJ', 'name' => 'Project Management', 'description' => 'Project-related requests and approvals'],
            ['code' => 'IT', 'name' => 'IT & Operations', 'description' => 'IT requests, equipment, software licenses']
        ];

        foreach ($groups as $group) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_request_groups WHERE code = %s LIMIT 1",
                $group['code']
            ));

            if ($existing) {
                $wpdb->update(
                    "{$wpdb->prefix}sta_request_groups",
                    [
                        'name' => $group['name'],
                        'description' => $group['description'],
                        'is_active' => true
                    ],
                    ['id' => $existing]
                );
                continue;
            }

            $wpdb->insert(
                "{$wpdb->prefix}sta_request_groups",
                [
                    'id' => wp_generate_uuid4(),
                    'name' => $group['name'],
                    'code' => $group['code'],
                    'description' => $group['description'],
                    'is_active' => true
                ]
            );
        }
    }

    private static function seedRequestTypes()
    {
        global $wpdb;

        $groups = $wpdb->get_results("SELECT id, code FROM {$wpdb->prefix}sta_request_groups", ARRAY_A);
        $groupMap = array_column($groups, 'id', 'code');

        $requestTypes = [
            'finance' => [
                [
                    'code_prefix' => 'EXP',
                    'name' => 'Petty Cash Request',
                    'description' => 'Request for petty cash expenses',
                    'form_schema' => '{"title":"Petty Cash Request","type":"object","properties":{"amount":{"type":"number","minimum":0},"purpose":{"type":"string"},"due_date":{"type":"string","format":"date"}},"required":["amount","purpose","due_date"]}',
                    'approval_flow_json' => '{"steps":[{"role":"team_lead","action":"approve"},{"role":"accountant","action":"clear","approval_limit":50000},{"role":"coo","action":"approve","min_amount":50001}]}',
                    'approval_limit' => 50000.00
                ],
                [
                    'code_prefix' => 'PROC',
                    'name' => 'Procurement Request',
                    'description' => 'Request for procurement of goods/services',
                    'form_schema' => '{"title":"Procurement Request","type":"object","properties":{"items":{"type":"array","items":{"type":"object","properties":{"description":{"type":"string"},"amount":{"type":"number"},"quantity":{"type":"integer","minimum":1}},"required":["description","amount","quantity"]}},"total_amount":{"type":"number"},"vendor":{"type":"string"}},"required":["items","total_amount"]}',
                    'approval_flow_json' => '{"steps":[{"role":"department_head","action":"approve"},{"role":"procurement_officer","action":"review"},{"role":"coo","action":"approve","min_amount":100000}]}',
                    'approval_limit' => 100000.00
                ]
            ],
            'HR' => [
                [
                    'code_prefix' => 'LV',
                    'name' => 'Leave Request',
                    'description' => 'Request for annual, sick, or personal leave',
                    'form_schema' => '{"title":"Leave Request","type":"object","properties":{"leave_type":{"type":"string","enum":["annual","sick","personal","maternity","paternity"]},"start_date":{"type":"string","format":"date"},"end_date":{"type":"string","format":"date"},"days_requested":{"type":"integer","minimum":1},"reason":{"type":"string"}},"required":["leave_type","start_date","end_date","days_requested"]}',
                    'approval_flow_json' => '{"steps":[{"role":"supervisor","action":"approve"},{"role":"hr_officer","action":"review"}]}',
                    'approval_limit' => null
                ]
            ]
        ];

        foreach ($requestTypes as $groupCode => $types) {
            if (!isset($groupMap[$groupCode])) {
                continue;
            }

            $groupId = $groupMap[$groupCode];

            foreach ($types as $type) {
                $existingTypeId = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}sta_request_types WHERE group_id = %s AND code_prefix = %s LIMIT 1",
                    $groupId,
                    $type['code_prefix']
                ));

                $payload = [
                    'group_id' => $groupId,
                    'name' => $type['name'],
                    'code_prefix' => $type['code_prefix'],
                    'description' => $type['description'],
                    'form_schema' => $type['form_schema'],
                    'approval_flow_json' => $type['approval_flow_json'],
                    'is_active' => true
                ];

                if (array_key_exists('approval_limit', $type) && $type['approval_limit'] !== null) {
                    $payload['approval_limit'] = $type['approval_limit'];
                }

                if ($existingTypeId) {
                    $wpdb->update(
                        "{$wpdb->prefix}sta_request_types",
                        $payload,
                        ['id' => $existingTypeId]
                    );

                    if (!array_key_exists('approval_limit', $type) || $type['approval_limit'] === null) {
                        $wpdb->update(
                            "{$wpdb->prefix}sta_request_types",
                            ['approval_limit' => null],
                            ['id' => $existingTypeId]
                        );
                    }
                } else {
                    $payload['id'] = wp_generate_uuid4();
                    $wpdb->insert(
                        "{$wpdb->prefix}sta_request_types",
                        $payload
                    );
                }
            }
        }
    }
}
