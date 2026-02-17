<?php

namespace App\Database\Migrations;

class Migration_1_3_2_AddOrganizationToRequests
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.3.2: Add Organization to Request Tables');

        // Add organization_id to request instances
        $wpdb->query("
            ALTER TABLE {$wpdb->prefix}sta_request_instances
            ADD COLUMN IF NOT EXISTS organization_id CHAR(36) NULL AFTER group_id,
            ADD KEY idx_organization (organization_id),
            ADD CONSTRAINT fk_request_organization FOREIGN KEY (organization_id) 
                REFERENCES {$wpdb->prefix}sta_organizations(id) ON DELETE SET NULL
        ");

        error_log('Migration 1.3.2 completed: organization_id added to Request tables');
    }

    public static function down()
    {
        global $wpdb;

        // Remove foreign key and column
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_request_instances DROP FOREIGN KEY fk_request_organization");
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_request_instances DROP COLUMN organization_id");
    }
}
