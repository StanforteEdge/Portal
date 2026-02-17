<?php

namespace App\Database\Migrations;

class Migration_1_5_3_RequestTypesFormsIntegration
{
    public static function up()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_request_types';

        // Add settings JSON column for module-specific config
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM `{$table}` LIKE 'settings'");

        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE `{$table}` 
                ADD COLUMN settings JSON NULL AFTER workflow_id");
        }

        // form_id already added in Migration_1_5_2, just verify
        $form_id_exists = $wpdb->get_results("SHOW COLUMNS FROM `{$table}` LIKE 'form_id'");

        if (empty($form_id_exists)) {
            $wpdb->query("ALTER TABLE `{$table}` 
                ADD COLUMN form_id CHAR(36) NULL,
                ADD INDEX idx_form_id (form_id)");
        }

        error_log('Stanforte Edge: Request Types Forms Integration completed by Migration_1_5_3');
    }

    public static function down()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_request_types';

        $wpdb->query("ALTER TABLE `{$table}` DROP COLUMN IF EXISTS settings");
    }
}
