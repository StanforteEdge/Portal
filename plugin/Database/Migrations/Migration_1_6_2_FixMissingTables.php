<?php

namespace App\Database\Migrations;

class Migration_1_6_2_FixMissingTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        error_log('Running Migration 1.6.2: Fixing missing core tables');

        // 1. Ensure sta_organizations exists
        $orgs_table = $wpdb->prefix . 'sta_organizations';
        $sql = "CREATE TABLE IF NOT EXISTS $orgs_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) NOT NULL,
            parent_organization_id BIGINT UNSIGNED NULL,
            organization_type ENUM('group', 'venture', 'shared_function') NOT NULL DEFAULT 'venture',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            metadata JSON NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY code (code),
            KEY parent_organization_id (parent_organization_id),
            KEY organization_type (organization_type),
            CONSTRAINT fk_org_parent FOREIGN KEY (parent_organization_id) 
                REFERENCES $orgs_table(id) ON DELETE SET NULL
        ) $charset_collate;";
        dbDelta($sql);

        // 2. Ensure sta_profile_organizations exists
        $profile_orgs_table = $wpdb->prefix . 'sta_profile_organizations';
        $profiles_table = $wpdb->prefix . 'sta_profiles';

        $sql = "CREATE TABLE IF NOT EXISTS $profile_orgs_table (
            id CHAR(36) NOT NULL,
            profile_id INT UNSIGNED NOT NULL,
            organization_id BIGINT UNSIGNED NOT NULL,
            is_primary TINYINT(1) NOT NULL DEFAULT 0,
            start_date DATE NULL,
            end_date DATE NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY profile_org_unique (profile_id, organization_id),
            KEY organization_id (organization_id),
            KEY is_primary (is_primary)
        ) $charset_collate;";
        dbDelta($sql);

        // Add constraints separately
        $constraints = [
            'fk_profile_org_profile' => "ALTER TABLE $profile_orgs_table ADD CONSTRAINT fk_profile_org_profile FOREIGN KEY (profile_id) REFERENCES $profiles_table(id) ON DELETE CASCADE",
            'fk_profile_org_organization' => "ALTER TABLE $profile_orgs_table ADD CONSTRAINT fk_profile_org_organization FOREIGN KEY (organization_id) REFERENCES $orgs_table(id) ON DELETE CASCADE"
        ];

        foreach ($constraints as $name => $sql) {
            $check = $wpdb->get_row($wpdb->prepare(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = %s AND CONSTRAINT_NAME = %s AND TABLE_SCHEMA = DATABASE()",
                $profile_orgs_table,
                $name
            ));
            if (!$check) {
                $wpdb->query($sql);
            }
        }

        error_log('Migration 1.6.2 completed successfully');
    }

    public static function down()
    {
        // No-op
    }
}
