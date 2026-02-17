<?php

namespace App\Database\Migrations;

class Migration_1_3_0_OrganizationRBAC
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        error_log('Running Migration 1.3.0: Organization-Scoped RBAC');

        // 1. Create sta_organizations
        self::createOrganizationsTable($wpdb, $charset_collate);

        // 2. Create sta_profile_organizations  
        self::createProfileOrganizationsTable($wpdb, $charset_collate);

        // 3. Update sta_profiles (add employment fields)
        self::updateProfilesTable($wpdb);

        // 4. Replace sta_user_roles (organization-scoped)
        self::replaceUserRolesTable($wpdb, $charset_collate);

        // 5. Update sta_teams (add organization_id)
        self::updateTeamsTable($wpdb);

        error_log('Migration 1.3.0 completed successfully');
    }

    private static function createOrganizationsTable($wpdb, $charset_collate)
    {
        $table_name = $wpdb->prefix . 'sta_organizations';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
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
                REFERENCES $table_name(id) ON DELETE SET NULL
        ) $charset_collate;";

        dbDelta($sql);

        error_log('Created sta_organizations table');
    }

    private static function createProfileOrganizationsTable($wpdb, $charset_collate)
    {
        $table_name = $wpdb->prefix . 'sta_profile_organizations';
        $profiles_table = $wpdb->prefix . 'sta_profiles';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
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
            KEY is_primary (is_primary),
            CONSTRAINT fk_profile_org_profile FOREIGN KEY (profile_id) 
                REFERENCES $profiles_table(id) ON DELETE CASCADE,
            CONSTRAINT fk_profile_org_organization FOREIGN KEY (organization_id) 
                REFERENCES $orgs_table(id) ON DELETE CASCADE
        ) $charset_collate;";

        dbDelta($sql);

        error_log('Created sta_profile_organizations table');
    }

    private static function updateProfilesTable($wpdb)
    {
        $table_name = $wpdb->prefix . 'sta_profiles';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        // Add employment_type column
        $wpdb->query("
            ALTER TABLE $table_name 
            ADD COLUMN IF NOT EXISTS employment_type ENUM('full_time', 'part_time', 'consulting') NULL AFTER bio
        ");

        // Add primary_organization_id column
        $wpdb->query("
            ALTER TABLE $table_name 
            ADD COLUMN IF NOT EXISTS primary_organization_id BIGINT UNSIGNED NULL AFTER employment_type,
            ADD CONSTRAINT fk_profile_primary_org FOREIGN KEY (primary_organization_id) 
                REFERENCES $orgs_table(id) ON DELETE SET NULL
        ");

        error_log('Updated sta_profiles table with employment fields');
    }

    private static function replaceUserRolesTable($wpdb, $charset_collate)
    {
        $old_table = $wpdb->prefix . 'sta_user_roles';
        $new_table = $wpdb->prefix . 'sta_user_roles_new';
        $profiles_table = $wpdb->prefix . 'sta_profiles';
        $roles_table = $wpdb->prefix . 'sta_roles';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        // Create new table structure
        $sql = "CREATE TABLE IF NOT EXISTS $new_table (
            id CHAR(36) NOT NULL,
            profile_id INT UNSIGNED NOT NULL,
            role_id CHAR(36) NOT NULL,
            organization_id BIGINT UNSIGNED NULL COMMENT 'NULL = Group-level role',
            is_primary_role TINYINT(1) NOT NULL DEFAULT 0,
            assigned_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY profile_role_org_unique (profile_id, role_id, organization_id),
            KEY role_id (role_id),
            KEY organization_id (organization_id),
            KEY is_primary_role (is_primary_role),
            CONSTRAINT fk_user_role_profile FOREIGN KEY (profile_id) 
                REFERENCES $profiles_table(id) ON DELETE CASCADE,
            CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) 
                REFERENCES $roles_table(id) ON DELETE CASCADE,
            CONSTRAINT fk_user_role_organization FOREIGN KEY (organization_id) 
                REFERENCES $orgs_table(id) ON DELETE CASCADE
        ) $charset_collate;";

        dbDelta($sql);

        // Drop old table and rename new table
        $wpdb->query("DROP TABLE IF EXISTS $old_table");
        $wpdb->query("RENAME TABLE $new_table TO $old_table");

        error_log('Replaced sta_user_roles with organization-scoped version');
    }

    private static function updateTeamsTable($wpdb)
    {
        $table_name = $wpdb->prefix . 'sta_teams';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        // Add organization_id column
        $wpdb->query("
            ALTER TABLE $table_name 
            ADD COLUMN IF NOT EXISTS organization_id BIGINT UNSIGNED NULL AFTER name,
            ADD CONSTRAINT fk_team_organization FOREIGN KEY (organization_id) 
                REFERENCES $orgs_table(id) ON DELETE SET NULL
        ");

        error_log('Updated sta_teams table with organization_id');
    }

    public static function down()
    {
        global $wpdb;

        error_log('Rolling back Migration 1.3.0: Organization-Scoped RBAC');

        // Drop tables in reverse order
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_profile_organizations");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_organizations");

        // Note: Cannot easily rollback column additions to sta_profiles, sta_teams, sta_user_roles
        // Manual intervention required for complete rollback

        error_log('Migration 1.3.0 rollback completed (partial)');
    }
}
