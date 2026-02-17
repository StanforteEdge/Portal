<?php

namespace App\Database\Migrations;

class Migration_1_5_2_ModuleRequestDataTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // 1. Finance Request Data (EAV)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_request_data` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            request_id CHAR(36) NOT NULL COMMENT 'FK to sta_request_instances',
            field_id CHAR(36) NULL COMMENT 'FK to sta_form_fields if form-based',
            field_key VARCHAR(100) NOT NULL COMMENT 'Field identifier',
            value_text VARCHAR(1000) NULL,
            value_number DECIMAL(15,4) NULL,
            value_date DATE NULL,
            value_datetime DATETIME NULL,
            value_file_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_request (request_id),
            INDEX idx_field_id (field_id),
            INDEX idx_field_key (field_key),
            INDEX idx_value_text (field_key, value_text(100)),
            INDEX idx_value_number (field_key, value_number),
            INDEX idx_value_date (field_key, value_date),
            UNIQUE KEY unique_request_field (request_id, field_key)
        ) $charset_collate;";
        dbDelta($sql);

        // 2. HR Request Data (EAV)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_hr_request_data` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            request_id CHAR(36) NOT NULL COMMENT 'FK to sta_request_instances',
            field_id CHAR(36) NULL COMMENT 'FK to sta_form_fields if form-based',
            field_key VARCHAR(100) NOT NULL COMMENT 'Field identifier',
            value_text VARCHAR(1000) NULL,
            value_number DECIMAL(15,4) NULL,
            value_date DATE NULL,
            value_datetime DATETIME NULL,
            value_file_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_request (request_id),
            INDEX idx_field_id (field_id),
            INDEX idx_field_key (field_key),
            INDEX idx_value_text (field_key, value_text(100)),
            INDEX idx_value_number (field_key, value_number),
            INDEX idx_value_date (field_key, value_date),
            UNIQUE KEY unique_request_field (request_id, field_key)
        ) $charset_collate;";
        dbDelta($sql);

        // 3. Admin Request Data (EAV)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_admin_request_data` (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            request_id CHAR(36) NOT NULL COMMENT 'FK to sta_request_instances',
            field_id CHAR(36) NULL COMMENT 'FK to sta_form_fields if form-based',
            field_key VARCHAR(100) NOT NULL COMMENT 'Field identifier',
            value_text VARCHAR(1000) NULL,
            value_number DECIMAL(15,4) NULL,
            value_date DATE NULL,
            value_datetime DATETIME NULL,
            value_file_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_request (request_id),
            INDEX idx_field_id (field_id),
            INDEX idx_field_key (field_key),
            INDEX idx_value_text (field_key, value_text(100)),
            INDEX idx_value_number (field_key, value_number),
            INDEX idx_value_date (field_key, value_date),
            UNIQUE KEY unique_request_field (request_id, field_key)
        ) $charset_collate;";
        dbDelta($sql);

        // 4. Add form_id column to sta_request_types (link to reusable forms)
        $table = $wpdb->prefix . 'sta_request_types';
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM `{$table}` LIKE 'form_id'");

        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE `{$table}` 
                ADD COLUMN form_id CHAR(36) NULL AFTER form_schema,
                ADD INDEX idx_form_id (form_id)");
        }

        error_log('Stanforte Edge: Module request data tables created by Migration_1_5_2_ModuleRequestDataTables');
    }

    public static function down()
    {
        global $wpdb;

        // Remove form_id column from request_types
        $table = $wpdb->prefix . 'sta_request_types';
        $wpdb->query("ALTER TABLE `{$table}` DROP COLUMN IF EXISTS form_id");

        // Drop module data tables
        $tables = [
            'sta_admin_request_data',
            'sta_hr_request_data',
            'sta_finance_request_data'
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }
}
