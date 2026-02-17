<?php

namespace App\Database\Migrations;

class Migration_1_5_4_AdvancedFormFields
{
    public static function up()
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        $fields_table = $wpdb->prefix . 'sta_form_fields';

        // Add advanced field properties to sta_form_fields
        $columns_to_add = [
            "field_width VARCHAR(10) DEFAULT 'full' COMMENT 'Field width: sm(25%), md(50%), lg(75%), full(100%)'",
            "field_placeholder VARCHAR(255) NULL COMMENT 'Placeholder text for input'",
            "help_text TEXT NULL COMMENT 'Help text displayed below field'",
            "conditional_rules JSON NULL COMMENT 'Show/hide rules based on other fields'",
            "validation_rules JSON NULL COMMENT 'Custom validation rules'",
            "field_score INT NULL COMMENT 'Score value for assessments/KPIs'",
            "min_value DECIMAL(10,2) NULL COMMENT 'Minimum value for number/range fields'",
            "max_value DECIMAL(10,2) NULL COMMENT 'Maximum value for number/range fields'",
            "max_characters INT NULL COMMENT 'Maximum character limit for text fields'",
            "allow_multiple BOOLEAN DEFAULT FALSE COMMENT 'Allow multiple selections/files'",
            "section_id CHAR(36) NULL COMMENT 'FK to sta_form_sections for grouping'"
        ];

        foreach ($columns_to_add as $column_def) {
            $column_name = explode(' ', $column_def)[0];

            // Check if column exists
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM `{$fields_table}` LIKE '{$column_name}'");

            if (empty($column_exists)) {
                $wpdb->query("ALTER TABLE `{$fields_table}` ADD COLUMN {$column_def}");
            }
        }

        // Create sta_form_sections table for grouping fields
        $sections_table = $wpdb->prefix . 'sta_form_sections';

        $sql = "CREATE TABLE IF NOT EXISTS `{$sections_table}` (
            id CHAR(36) PRIMARY KEY,
            form_id CHAR(36) NOT NULL,
            section_title VARCHAR(255) NOT NULL,
            section_description TEXT NULL,
            display_order INT DEFAULT 0,
            is_collapsible BOOLEAN DEFAULT FALSE,
            is_repeatable BOOLEAN DEFAULT FALSE COMMENT 'Allow adding multiple instances of this section',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES {$wpdb->prefix}sta_forms(id) ON DELETE CASCADE,
            INDEX idx_form_id (form_id),
            INDEX idx_display_order (display_order)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        error_log('Stanforte Edge: Advanced form fields migration completed by Migration_1_5_4');
    }

    public static function down()
    {
        global $wpdb;
        $fields_table = $wpdb->prefix . 'sta_form_fields';
        $sections_table = $wpdb->prefix . 'sta_form_sections';

        // Drop columns from sta_form_fields
        $columns_to_remove = [
            'field_width',
            'field_placeholder',
            'help_text',
            'conditional_rules',
            'validation_rules',
            'field_score',
            'min_value',
            'max_value',
            'max_characters',
            'allow_multiple',
            'section_id'
        ];

        foreach ($columns_to_remove as $column) {
            $wpdb->query("ALTER TABLE `{$fields_table}` DROP COLUMN IF EXISTS {$column}");
        }

        // Drop sections table
        $wpdb->query("DROP TABLE IF EXISTS `{$sections_table}`");
    }
}
