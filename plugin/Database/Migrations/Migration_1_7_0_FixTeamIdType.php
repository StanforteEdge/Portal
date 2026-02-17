<?php

namespace App\Database\Migrations;

class Migration_1_7_0_FixTeamIdType
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.7.0: Fix team_id column types');

        $tables = [
            "{$wpdb->prefix}sta_request_instances",
            "{$wpdb->prefix}sta_finance_requests",
            "{$wpdb->prefix}sta_hr_requests",
            "{$wpdb->prefix}sta_admin_requests"
        ];

        foreach ($tables as $table) {
            self::modifyTeamId($table);
        }

        error_log('Migration 1.7.0 completed: team_id columns normalized');
    }

    public static function down()
    {
        // No-op: data-safe rollback not attempted
        error_log('Migration 1.7.0 down: No action taken');
    }

    private static function modifyTeamId($table)
    {
        global $wpdb;

        $schema = $wpdb->dbname;
        $column = $wpdb->get_row($wpdb->prepare(
            "SELECT COLUMN_TYPE, IS_NULLABLE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'team_id'",
            $schema,
            $table
        ), ARRAY_A);

        if (!$column) {
            return;
        }

        $wpdb->query("ALTER TABLE `{$table}` MODIFY COLUMN team_id BIGINT UNSIGNED NULL");
    }
}
