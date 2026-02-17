<?php

namespace App\Database\Migrations;

class Migration_1_5_1_FormsSystemTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // 1. Forms table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_forms` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            description TEXT NULL,
            module ENUM('finance','hr','admin','general') NOT NULL DEFAULT 'general',
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_pattern JSON NULL COMMENT 'e.g. {\"type\":\"weekly\",\"day\":\"friday\"}',
            workflow_enabled BOOLEAN DEFAULT FALSE COMMENT 'Enable workflow for tickets/assignments',
            workflow_statuses JSON NULL COMMENT 'Custom statuses if workflow_enabled',
            created_by_profile_id INT UNSIGNED NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_module (module),
            INDEX idx_active (is_active),
            INDEX idx_recurring (is_recurring),
            INDEX idx_workflow (workflow_enabled)
        ) $charset_collate;";
        dbDelta($sql);

        // 2. Form Fields table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_form_fields` (
            id CHAR(36) PRIMARY KEY,
            form_id CHAR(36) NOT NULL,
            field_key VARCHAR(100) NOT NULL COMMENT 'Unique identifier for field',
            field_label VARCHAR(255) NOT NULL,
            field_type ENUM('text','textarea','number','date','datetime','select','checkbox','radio','file') NOT NULL,
            field_options JSON NULL COMMENT 'Options for select/checkbox/radio',
            is_required BOOLEAN DEFAULT FALSE,
            validation_rules JSON NULL COMMENT 'Custom validation rules',
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES {$wpdb->prefix}sta_forms(id) ON DELETE CASCADE,
            INDEX idx_form (form_id),
            INDEX idx_field_key (form_id, field_key),
            INDEX idx_order (form_id, display_order),
            UNIQUE KEY unique_form_field_key (form_id, field_key)
        ) $charset_collate;";
        dbDelta($sql);

        // 3. Form Assignments table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_form_assignments` (
            id CHAR(36) PRIMARY KEY,
            form_id CHAR(36) NOT NULL,
            assigned_to_role VARCHAR(100) NULL COMMENT 'e.g. it_support_officer',
            assigned_to_profile_id INT UNSIGNED NULL,
            assigned_to_department_id CHAR(36) NULL,
            visibility_roles JSON NULL COMMENT 'Who can view submissions',
            due_date DATE NULL COMMENT 'For one-time forms',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES {$wpdb->prefix}sta_forms(id) ON DELETE CASCADE,
            INDEX idx_form (form_id),
            INDEX idx_role (assigned_to_role),
            INDEX idx_profile (assigned_to_profile_id),
            INDEX idx_department (assigned_to_department_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 4. Form Submissions table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_form_submissions` (
            id CHAR(36) PRIMARY KEY,
            form_id CHAR(36) NOT NULL,
            submission_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'e.g. AUDIT-2024-001',
            submitted_by_profile_id INT UNSIGNED NOT NULL,
            organization_id CHAR(36) NULL COMMENT 'Multi-org support',
            status VARCHAR(50) NOT NULL DEFAULT 'submitted' COMMENT 'Dynamic based on form workflow',
            assigned_to_profile_id INT UNSIGNED NULL COMMENT 'For workflow forms',
            resolved_at DATETIME NULL,
            resolution_notes TEXT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES {$wpdb->prefix}sta_forms(id) ON DELETE CASCADE,
            INDEX idx_form (form_id),
            INDEX idx_submitter (submitted_by_profile_id),
            INDEX idx_organization (organization_id),
            INDEX idx_status (status),
            INDEX idx_assigned (assigned_to_profile_id),
            INDEX idx_submitted_date (submitted_at)
        ) $charset_collate;";
        dbDelta($sql);

        // 5. Form Submission Data table (EAV with type-specific columns)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_form_submission_data` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id CHAR(36) NOT NULL,
            field_id CHAR(36) NOT NULL,
            field_key VARCHAR(100) NOT NULL COMMENT 'Denormalized for performance',
            value_text VARCHAR(1000) NULL,
            value_number DECIMAL(15,4) NULL,
            value_date DATE NULL,
            value_datetime DATETIME NULL,
            value_file_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id) REFERENCES {$wpdb->prefix}sta_form_submissions(id) ON DELETE CASCADE,
            FOREIGN KEY (field_id) REFERENCES {$wpdb->prefix}sta_form_fields(id) ON DELETE CASCADE,
            INDEX idx_submission (submission_id),
            INDEX idx_field (field_id),
            INDEX idx_field_key (field_key),
            INDEX idx_value_text (field_key, value_text(100)),
            INDEX idx_value_number (field_key, value_number),
            INDEX idx_value_date (field_key, value_date),
            UNIQUE KEY unique_submission_field (submission_id, field_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 6. Form Submission History table (for workflow forms)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_form_submission_history` (
            id CHAR(36) PRIMARY KEY,
            submission_id CHAR(36) NOT NULL,
            action_type ENUM('created','assigned','status_changed','resolved','commented','updated') NOT NULL,
            performed_by_profile_id INT UNSIGNED NULL,
            old_value TEXT NULL,
            new_value TEXT NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id) REFERENCES {$wpdb->prefix}sta_form_submissions(id) ON DELETE CASCADE,
            INDEX idx_submission (submission_id),
            INDEX idx_action (action_type),
            INDEX idx_performed_by (performed_by_profile_id),
            INDEX idx_created (created_at)
        ) $charset_collate;";
        dbDelta($sql);

        error_log('Stanforte Edge: Forms system tables created by Migration_1_5_1_FormsSystemTables');
    }

    public static function down()
    {
        global $wpdb;

        $tables = [
            'sta_form_submission_history',
            'sta_form_submission_data',
            'sta_form_submissions',
            'sta_form_assignments',
            'sta_form_fields',
            'sta_forms'
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }
}
