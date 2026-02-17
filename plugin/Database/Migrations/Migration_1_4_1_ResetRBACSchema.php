<?php

namespace App\Database\Migrations;

class Migration_1_4_1_ResetRBACSchema
{
    public static function up()
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        error_log('Running Migration 1.4.0: Reset RBAC Schema (UUID -> ID) and Seeding');

        // Disable foreign key checks to allow truncation and alteration
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Truncate Tables
        $tables = [
            $wpdb->prefix . 'sta_role_permissions',
            $wpdb->prefix . 'sta_user_roles',
            $wpdb->prefix . 'sta_roles',
            $wpdb->prefix . 'sta_permissions'
        ];

        foreach ($tables as $table) {
            $wpdb->query("TRUNCATE TABLE $table");
        }

        // 2. Modify Roles Table
        // Drop Primary Key first to allow modifying to Auto Increment
        // (If strictly needed, usually MODIFY works if it's the PK, but CHAR->INT might need specific handling)
        // Safest is to Drop table and recreate considering it's empty
        $roles_table = $wpdb->prefix . 'sta_roles';
        $wpdb->query("DROP TABLE IF EXISTS $roles_table");

        $sql = "CREATE TABLE $roles_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL,
            description TEXT NULL,
            slug VARCHAR(50) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) $charset_collate;";
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // 3. Modify Permissions Table
        $permissions_table = $wpdb->prefix . 'sta_permissions';
        $wpdb->query("DROP TABLE IF EXISTS $permissions_table");

        $sql = "CREATE TABLE $permissions_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL,
            description TEXT NULL,
            slug VARCHAR(50) NOT NULL,
            module VARCHAR(50) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) $charset_collate;";
        dbDelta($sql);

        // 4. Modify Role Permissions Table
        $role_perms_table = $wpdb->prefix . 'sta_role_permissions';
        $wpdb->query("DROP TABLE IF EXISTS $role_perms_table");

        $sql = "CREATE TABLE $role_perms_table (
            role_id BIGINT UNSIGNED NOT NULL,
            permission_id BIGINT UNSIGNED NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role_id, permission_id),
            CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES $roles_table(id) ON DELETE CASCADE,
            CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES $permissions_table(id) ON DELETE CASCADE
        ) $charset_collate;";
        dbDelta($sql);

        // 5. Modify User Roles Table
        // Note: keeping profile_id as INT (as per 1.3.0) and organization_id as CHAR(36)
        $user_roles_table = $wpdb->prefix . 'sta_user_roles';
        $profiles_table = $wpdb->prefix . 'sta_profiles';
        $orgs_table = $wpdb->prefix . 'sta_organizations';

        $wpdb->query("DROP TABLE IF EXISTS $user_roles_table");

        $sql = "CREATE TABLE $user_roles_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            profile_id INT UNSIGNED NOT NULL,
            role_id BIGINT UNSIGNED NOT NULL,
            organization_id CHAR(36) NULL COMMENT 'NULL = Group-level role',
            is_primary_role TINYINT(1) NOT NULL DEFAULT 0,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY profile_role_org_unique (profile_id, role_id, organization_id),
            KEY role_id (role_id),
            KEY organization_id (organization_id),
            KEY is_primary_role (is_primary_role),
            CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES $roles_table(id) ON DELETE CASCADE
            -- Note: We are not adding FK for profile_id and organization_id here to avoid issues if those tables are missing or have mismatching types during this specific migration step.
            -- Ideally they should be added, but 'sta_profiles' ID type must match. (It is INT UNSIGNED in 1.3.0).
        ) $charset_collate;";
        dbDelta($sql);

        $wpdb->query('SET FOREIGN_KEY_CHECKS = 1');

        // 6. Seed Roles
        self::seedRoles($wpdb, $roles_table);

        // 7. Seed Permissions
        self::seedPermissions($wpdb, $permissions_table);

        // 8. Assign Permissions to Roles
        self::assignPermissions($wpdb, $roles_table, $permissions_table, $role_perms_table);

        error_log('Migration 1.4.0 completed successfully');
    }

    private static function seedRoles($wpdb, $table)
    {
        $roles = [
            ['name' => 'Administrator', 'slug' => 'administrator', 'description' => 'Super User with access to everything'],
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'System Administrator'],
            ['name' => 'Finance Manager', 'slug' => 'finance_manager', 'description' => 'Head of Finance'],
            ['name' => 'Finance Officer', 'slug' => 'finance_officer', 'description' => 'Finance Department Staff'],
            ['name' => 'Finance Auditor', 'slug' => 'finance_auditor', 'description' => 'External/Internal Auditor'],
            ['name' => 'Accountant', 'slug' => 'accountant', 'description' => 'Accountant'],
            ['name' => 'Staff', 'slug' => 'staff', 'description' => 'General Staff Member']
        ];

        foreach ($roles as $role) {
            $wpdb->insert($table, $role, ['%s', '%s', '%s']);
        }
    }

    private static function seedPermissions($wpdb, $table)
    {
        $permissions = [
            // Requests
            ['name' => 'Create Requests', 'slug' => 'requests.create', 'module' => 'requests', 'description' => 'Can create new requests'],
            ['name' => 'View Requests', 'slug' => 'requests.view', 'module' => 'requests', 'description' => 'Can view requests'],
            ['name' => 'Approve Requests', 'slug' => 'requests.approve', 'module' => 'requests', 'description' => 'Can approve requests'],
            ['name' => 'Retire Requests', 'slug' => 'requests.retire', 'module' => 'requests', 'description' => 'Can submit retirement proofs'],

            // Finance
            ['name' => 'Manage Finance', 'slug' => 'finance.manage', 'module' => 'finance', 'description' => 'Full access to finance module'],
            ['name' => 'View Finance', 'slug' => 'finance.view', 'module' => 'finance', 'description' => 'Read-only access to finance module'],
            ['name' => 'Generate Vouchers', 'slug' => 'finance.vouchers', 'module' => 'finance', 'description' => 'Can generate payment vouchers'],

            // Admin
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'module' => 'admin', 'description' => 'Manage system settings'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'admin', 'description' => 'Manage users and profiles'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'module' => 'admin', 'description' => 'Manage roles and permissions'],

            // HR
            ['name' => 'Manage HR', 'slug' => 'hr.manage', 'module' => 'hr', 'description' => 'Manage HR module'],

            // Marker
            ['name' => 'Grade Applications', 'slug' => 'grading.grade', 'module' => 'grading', 'description' => 'Can grade applications'],

        ];

        foreach ($permissions as $perm) {
            $wpdb->insert($table, $perm, ['%s', '%s', '%s', '%s']);
        }
    }

    private static function assignPermissions($wpdb, $roles_table, $perms_table, $pivot_table)
    {
        // helper to get ID
        $getRoleId = function ($slug) use ($wpdb, $roles_table) {
            return $wpdb->get_var($wpdb->prepare("SELECT id FROM $roles_table WHERE slug = %s", $slug));
        };
        $getPermId = function ($slug) use ($wpdb, $perms_table) {
            return $wpdb->get_var($wpdb->prepare("SELECT id FROM $perms_table WHERE slug = %s", $slug));
        };

        $assignments = [
            'administrator' => ['*'], // Special handling
            'admin' => ['*'],
            'finance_manager' => ['requests.view', 'requests.approve', 'finance.manage', 'finance.view', 'finance.vouchers'],
            'finance_officer' => ['requests.view', 'finance.view', 'finance.vouchers'],
            'staff' => ['requests.create', 'requests.view', 'requests.retire']
        ];

        $all_perms = $wpdb->get_col("SELECT id FROM $perms_table");

        foreach ($assignments as $role_slug => $perm_slugs) {
            $role_id = $getRoleId($role_slug);
            if (!$role_id)
                continue;

            $ids_to_assign = [];
            if ($perm_slugs === ['*']) {
                $ids_to_assign = $all_perms;
            } else {
                foreach ($perm_slugs as $slug) {
                    $pid = $getPermId($slug);
                    if ($pid)
                        $ids_to_assign[] = $pid;
                }
            }

            foreach ($ids_to_assign as $pid) {
                $wpdb->insert($pivot_table, ['role_id' => $role_id, 'permission_id' => $pid], ['%d', '%d']);
            }
        }
    }
}
