<?php

namespace App\Database\Migrations;

class Migration_1_6_4_AddOrganizationToGroups
{
    public static function up()
    {
        global $wpdb;

        $groups_table = $wpdb->prefix . 'sta_groups';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        error_log('Running Migration 1.6.4: Add organization_id to sta_groups');

        // Add organization_id column to sta_groups
        $wpdb->query("
            ALTER TABLE $groups_table 
            ADD COLUMN IF NOT EXISTS organization_id BIGINT UNSIGNED NULL AFTER type
        ");

        // Add foreign key constraint
        // First check if it exists to be safe
        $check = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = %s AND CONSTRAINT_NAME = %s AND TABLE_SCHEMA = DATABASE()",
                $groups_table,
                'fk_groups_organization'
            )
        );

        if (!$check) {
            $wpdb->query("
                ALTER TABLE $groups_table 
                ADD CONSTRAINT fk_groups_organization FOREIGN KEY (organization_id) 
                REFERENCES $orgs_table(id) ON DELETE SET NULL
            ");
        }

        error_log('Migration 1.6.1 completed successfully');
    }

    public static function down()
    {
        global $wpdb;
        $groups_table = $wpdb->prefix . 'sta_groups';

        error_log('Rolling back Migration 1.6.1: Add organization_id to sta_groups');

        // Drop foreign key
        $wpdb->query("ALTER TABLE $groups_table DROP FOREIGN KEY IF EXISTS fk_groups_organization");

        // Drop column
        $wpdb->query("ALTER TABLE $groups_table DROP COLUMN IF EXISTS organization_id");

        error_log('Migration 1.6.1 rollback completed');
    }
}
