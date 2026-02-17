<?php

namespace App\Database\Migrations;

class Migration_1_6_9_RemoveRequestNumber
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.6.9: Removing request_number from module tables and normalizing request_items');

        $tables = [
            "{$wpdb->prefix}sta_finance_requests",
            "{$wpdb->prefix}sta_hr_requests",
            "{$wpdb->prefix}sta_admin_requests"
        ];

        foreach ($tables as $table) {
            self::dropColumnIfExists($table, 'request_number');
            self::dropIndexIfExists($table, 'unique_request_number');
            self::dropIndexIfExists($table, 'unique_global_request_number');
        }

        // Ensure request_items references request_id as BIGINT UNSIGNED
        $requestItemsTable = "{$wpdb->prefix}sta_request_items";
        if (self::columnExists($requestItemsTable, 'request_id')) {
            $wpdb->query("ALTER TABLE `{$requestItemsTable}` MODIFY COLUMN request_id BIGINT UNSIGNED NOT NULL");
        }

        error_log('Migration 1.6.9 completed');
    }

    public static function down()
    {
        // No-op: request_number intentionally removed
        error_log('Migration 1.6.9 down: No action taken');
    }

    private static function columnExists($table, $column)
    {
        global $wpdb;
        $schema = $wpdb->dbname;
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            $schema,
            $table,
            $column
        ));
        return (int) $count > 0;
    }

    private static function dropColumnIfExists($table, $column)
    {
        global $wpdb;
        if (self::columnExists($table, $column)) {
            $wpdb->query("ALTER TABLE `{$table}` DROP COLUMN {$column}");
        }
    }

    private static function dropIndexIfExists($table, $indexName)
    {
        global $wpdb;
        $schema = $wpdb->dbname;
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND INDEX_NAME = %s",
            $schema,
            $table,
            $indexName
        ));
        if ((int) $count > 0) {
            $wpdb->query("ALTER TABLE `{$table}` DROP INDEX {$indexName}");
        }
    }
}
