<?php

namespace App\Database\Migrations;

class Migration_1_5_5_ChangeOrganizationIdToInt
{
    public static function up()
    {
        global $wpdb;

        $orgs_table = $wpdb->prefix . 'sta_organizations';
        $profile_orgs_table = $wpdb->prefix . 'sta_profile_organizations';
        $profiles_table = $wpdb->prefix . 'sta_profiles';
        $teams_table = $wpdb->prefix . 'sta_teams';
        $roles_table = $wpdb->prefix . 'sta_user_roles';

        error_log('Running Migration 1.5.5: Change Organization ID to INT');

        // 1. Drop constraints
        // We use an array of [table, constraint_name]
        $constraints = [
            [$profile_orgs_table, 'fk_profile_org_organization'],
            [$profiles_table, 'fk_profile_primary_org'],
            [$roles_table, 'fk_user_role_organization'],
            [$teams_table, 'fk_team_organization'],
            [$orgs_table, 'fk_org_parent'] // Self reference
        ];

        foreach ($constraints as $constraint) {
            $check = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = %s AND CONSTRAINT_NAME = %s AND TABLE_SCHEMA = DATABASE()",
                    $constraint[0],
                    $constraint[1]
                )
            );
            if ($check) {
                $wpdb->query("ALTER TABLE {$constraint[0]} DROP FOREIGN KEY {$constraint[1]}");
            }
        }

        // 2. Clear incompatible data (Foreign Keys pointing to UUIDs) and Data in Organization Tables
        // Since we cannot convert UUID -> INT, we must clear referencing data or set to NULL.
        // For Organizations table, existing UUIDs are invalid for INT column -> Truncate.

        // Nullify referencing columns
        $wpdb->query("UPDATE $profiles_table SET primary_organization_id = NULL");
        $wpdb->query("UPDATE $teams_table SET organization_id = NULL");
        $wpdb->query("UPDATE $roles_table SET organization_id = NULL WHERE organization_id IS NOT NULL");

        // Truncate main tables
        $wpdb->query("TRUNCATE TABLE $profile_orgs_table");
        // We must disable FK checks to truncate if there are lingering internal constraints (though we dropped ours)
        $wpdb->query("SET FOREIGN_KEY_CHECKS = 0");
        $wpdb->query("TRUNCATE TABLE $orgs_table");
        $wpdb->query("SET FOREIGN_KEY_CHECKS = 1");

        // 3. Modify Columns to BIGINT UNSIGNED

        // sta_organizations (PK)
        // We need to change id to BIGINT and add AUTO_INCREMENT. 
        // Since table is empty (Truncated), we can modify directly.
        $wpdb->query("ALTER TABLE $orgs_table MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        $wpdb->query("ALTER TABLE $orgs_table MODIFY COLUMN parent_organization_id BIGINT UNSIGNED NULL");

        // Dependent tables
        $wpdb->query("ALTER TABLE $profile_orgs_table MODIFY COLUMN organization_id BIGINT UNSIGNED NOT NULL");
        $wpdb->query("ALTER TABLE $profiles_table MODIFY COLUMN primary_organization_id BIGINT UNSIGNED NULL");
        $wpdb->query("ALTER TABLE $roles_table MODIFY COLUMN organization_id BIGINT UNSIGNED NULL");
        $wpdb->query("ALTER TABLE $teams_table MODIFY COLUMN organization_id BIGINT UNSIGNED NULL");

        // 4. Re-add Constraints

        $wpdb->query("ALTER TABLE $orgs_table
            ADD CONSTRAINT fk_org_parent FOREIGN KEY (parent_organization_id) 
            REFERENCES $orgs_table(id) ON DELETE SET NULL");

        $wpdb->query("ALTER TABLE $profile_orgs_table
            ADD CONSTRAINT fk_profile_org_organization FOREIGN KEY (organization_id) 
            REFERENCES $orgs_table(id) ON DELETE CASCADE");

        $wpdb->query("ALTER TABLE $profiles_table
            ADD CONSTRAINT fk_profile_primary_org FOREIGN KEY (primary_organization_id) 
            REFERENCES $orgs_table(id) ON DELETE SET NULL");

        $wpdb->query("ALTER TABLE $roles_table
            ADD CONSTRAINT fk_user_role_organization FOREIGN KEY (organization_id) 
            REFERENCES $orgs_table(id) ON DELETE CASCADE");

        $wpdb->query("ALTER TABLE $teams_table
            ADD CONSTRAINT fk_team_organization FOREIGN KEY (organization_id) 
            REFERENCES $orgs_table(id) ON DELETE SET NULL");

        error_log('Migration 1.5.5 completed successfully');
    }

    public static function down()
    {
        // Reversal is complex (Data loss back to UUID). 
        // We strictly focus on Up for now as requested.
    }
}
