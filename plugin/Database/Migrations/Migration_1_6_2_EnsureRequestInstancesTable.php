<?php

namespace App\Database\Migrations;

class Migration_1_6_2_EnsureRequestInstancesTable
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        error_log('Running Migration 1.6.2: Ensure Request Instances Table Exists');

        // 1. Request Groups table (must exist first for foreign keys)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_groups` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_active (is_active)
        ) $charset_collate;";
        dbDelta($sql);

        // 2. Request Types table (must exist before instances)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_types` (
            id CHAR(36) PRIMARY KEY,
            group_id CHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            code_prefix VARCHAR(10) NOT NULL,
            description TEXT,
            form_id CHAR(36) NULL COMMENT 'Link to reusable forms',
            form_schema JSON COMMENT 'Inline form schema',
            approval_flow_json JSON,
            approval_limit DECIMAL(15,2) NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_group (group_id),
            INDEX idx_code_prefix (code_prefix),
            INDEX idx_form_id (form_id),
            INDEX idx_active (is_active)
        ) $charset_collate;";
        dbDelta($sql);

        // 3. Finance Request Instances (auto-increment per finance group)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_requests` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Finance request ID for URLs',
            uuid CHAR(36) UNIQUE NOT NULL COMMENT 'Globally unique identifier',
            request_type_id CHAR(36) NOT NULL,
            organization_id CHAR(36) NULL,
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
            INDEX idx_uuid (uuid),
            INDEX idx_request_type (request_type_id),
            INDEX idx_organization (organization_id),
            INDEX idx_created_by (created_by),
            INDEX idx_team (team_id),
            INDEX idx_status (status),
            INDEX idx_workflow (workflow_instance_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 4. HR Request Instances (auto-increment per HR group)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_hr_requests` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'HR request ID for URLs',
            uuid CHAR(36) UNIQUE NOT NULL COMMENT 'Globally unique identifier',
            request_type_id CHAR(36) NOT NULL,
            organization_id CHAR(36) NULL,
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
            INDEX idx_uuid (uuid),
            INDEX idx_request_type (request_type_id),
            INDEX idx_organization (organization_id),
            INDEX idx_created_by (created_by),
            INDEX idx_team (team_id),
            INDEX idx_status (status),
            INDEX idx_workflow (workflow_instance_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 5. Admin Request Instances (auto-increment per Admin group)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_admin_requests` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Admin request ID for URLs',
            uuid CHAR(36) UNIQUE NOT NULL COMMENT 'Globally unique identifier',
            request_type_id CHAR(36) NOT NULL,
            organization_id CHAR(36) NULL,
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
            INDEX idx_uuid (uuid),
            INDEX idx_request_type (request_type_id),
            INDEX idx_organization (organization_id),
            INDEX idx_created_by (created_by),
            INDEX idx_team (team_id),
            INDEX idx_status (status),
            INDEX idx_workflow (workflow_instance_id)
        ) $charset_collate;";
        dbDelta($sql);

        // 6. Request Items table (shared across all request types)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_request_items` (
            id CHAR(36) PRIMARY KEY,
            request_id BIGINT UNSIGNED NOT NULL,
            item_description TEXT NOT NULL,
            quantity DECIMAL(10,2) DEFAULT 1,
            unit_price DECIMAL(15,2) DEFAULT 0,
            total_price DECIMAL(15,2) DEFAULT 0,
            notes TEXT,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_request (request_id),
            INDEX idx_sort (sort_order)
        ) $charset_collate;";
        dbDelta($sql);

        error_log('Migration 1.6.2 completed: Module-specific request tables created');
    }

    public static function down()
    {
        global $wpdb;

        // Note: Only drop if explicitly needed, as these are core tables
        error_log('Migration 1.6.2 down: Skipping table drops (core tables)');
    }
}
