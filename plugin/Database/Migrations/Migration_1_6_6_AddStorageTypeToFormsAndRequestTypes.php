<?php

namespace App\Database\Migrations;

class Migration_1_6_6_AddStorageTypeToFormsAndRequestTypes
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.6.6: Add Storage Type to Forms and Request Types');

        // 1. Update sta_request_types
        $table_request_types = $wpdb->prefix . 'sta_request_types';
        $col_storage_type_exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM {$table_request_types} LIKE %s", 'storage_type'));

        if (empty($col_storage_type_exists)) {
            $wpdb->query("ALTER TABLE {$table_request_types} ADD COLUMN storage_type VARCHAR(20) DEFAULT 'form' AFTER description");
            error_log('Migration 1.6.6: Added storage_type to sta_request_types');
        }

        // 2. Update sta_forms
        $table_forms = $wpdb->prefix . 'sta_forms';

        $col_storage_type_exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM {$table_forms} LIKE %s", 'storage_type'));
        if (empty($col_storage_type_exists)) {
            $wpdb->query("ALTER TABLE {$table_forms} ADD COLUMN storage_type VARCHAR(20) DEFAULT 'default' AFTER module");
            error_log('Migration 1.6.6: Added storage_type to sta_forms');
        }

        $col_target_table_exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM {$table_forms} LIKE %s", 'target_table'));
        if (empty($col_target_table_exists)) {
            $wpdb->query("ALTER TABLE {$table_forms} ADD COLUMN target_table VARCHAR(100) NULL AFTER storage_type");
            error_log('Migration 1.6.6: Added target_table to sta_forms');
        }

        $col_column_mapping_exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM {$table_forms} LIKE %s", 'column_mapping'));
        if (empty($col_column_mapping_exists)) {
            $wpdb->query("ALTER TABLE {$table_forms} ADD COLUMN column_mapping JSON NULL AFTER target_table");
            error_log('Migration 1.6.6: Added column_mapping to sta_forms');
        }
    }

    public static function down()
    {
        global $wpdb;
        $table_request_types = $wpdb->prefix . 'sta_request_types';
        $wpdb->query("ALTER TABLE {$table_request_types} DROP COLUMN IF EXISTS storage_type");

        $table_forms = $wpdb->prefix . 'sta_forms';
        $wpdb->query("ALTER TABLE {$table_forms} DROP COLUMN IF EXISTS storage_type");
        $wpdb->query("ALTER TABLE {$table_forms} DROP COLUMN IF EXISTS target_table");
        $wpdb->query("ALTER TABLE {$table_forms} DROP COLUMN IF EXISTS column_mapping");
    }
}
