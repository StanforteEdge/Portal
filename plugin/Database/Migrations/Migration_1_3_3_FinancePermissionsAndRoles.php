<?php

namespace App\Database\Migrations;

class Migration_1_3_3_FinancePermissionsAndRoles
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.3.3: Finance Permissions and Roles');

        // 1. Seed Request System Permissions (these were missing!)
        self::seedRequestPermissions($wpdb);

        // 2. Seed Finance Module Permissions
        self::seedFinancePermissions($wpdb);

        // 3. Create Finance Roles
        self::createFinanceRoles($wpdb);

        // 4. Assign Permissions to Roles
        self::assignPermissionsToRoles($wpdb);

        error_log('Migration 1.3.3 completed successfully');
    }

    private static function seedRequestPermissions($wpdb)
    {
        $permissions = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'requests.create',
                'description' => 'Create new requests'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'requests.view',
                'description' => 'View all requests'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'requests.view_own',
                'description' => 'View own requests only'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'requests.approve',
                'description' => 'Approve/reject requests'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'requests.manage',
                'description' => 'Full request management (edit, delete, etc.)'
            ]
        ];

        foreach ($permissions as $permission) {
            // Check if permission already exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_permissions WHERE name = %s",
                $permission['name']
            ));

            if (!$exists) {
                $wpdb->insert(
                    "{$wpdb->prefix}sta_permissions",
                    $permission,
                    ['%s', '%s', '%s']
                );
                error_log("Created permission: {$permission['name']}");
            }
        }
    }

    private static function seedFinancePermissions($wpdb)
    {
        $permissions = [
            // Payment Voucher Permissions
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.view_vouchers',
                'description' => 'View payment vouchers'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.create_vouchers',
                'description' => 'Create payment vouchers from approved requests'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.approve_vouchers',
                'description' => 'Mark payment vouchers as paid'
            ],

            // Retirement Permissions
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.view_retirements',
                'description' => 'View retirement submissions'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.submit_retirements',
                'description' => 'Submit retirement with receipts'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.verify_retirements',
                'description' => 'Verify and approve retirement submissions'
            ],

            // Reporting
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.view_reports',
                'description' => 'View financial reports and analytics'
            ],

            // Administration
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance.manage',
                'description' => 'Full finance module administration'
            ]
        ];

        foreach ($permissions as $permission) {
            // Check if permission already exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_permissions WHERE name = %s",
                $permission['name']
            ));

            if (!$exists) {
                $wpdb->insert(
                    "{$wpdb->prefix}sta_permissions",
                    $permission,
                    ['%s', '%s', '%s']
                );
                error_log("Created permission: {$permission['name']}");
            }
        }
    }

    private static function createFinanceRoles($wpdb)
    {
        $roles = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance_officer',
                'slug' => 'finance-officer',
                'description' => 'Finance Officer - Creates payment vouchers and manages requests'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'accountant',
                'slug' => 'accountant',
                'description' => 'Accountant - Processes payments and verifies retirements'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'finance_manager',
                'slug' => 'finance-manager',
                'description' => 'Finance Manager - Full finance module access'
            ]
        ];

        foreach ($roles as $role) {
            // Check if role already exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_roles WHERE name = %s",
                $role['name']
            ));

            if (!$exists) {
                $wpdb->insert(
                    "{$wpdb->prefix}sta_roles",
                    $role,
                    ['%s', '%s', '%s', '%s']
                );
                error_log("Created role: {$role['name']}");
            }
        }
    }

    private static function assignPermissionsToRoles($wpdb)
    {
        // Define role-permission mappings
        $roleMappings = [
            'finance_officer' => [
                // Request permissions
                'requests.create',
                'requests.view',
                'requests.view_own',
                // Finance permissions
                'finance.view_vouchers',
                'finance.create_vouchers',
                'finance.view_retirements',
                'finance.view_reports'
            ],
            'accountant' => [
                // Request permissions
                'requests.view',
                'requests.approve',
                // Finance permissions
                'finance.view_vouchers',
                'finance.approve_vouchers',  // Can mark as paid
                'finance.view_retirements',
                'finance.verify_retirements',  // Can verify retirements
                'finance.view_reports'
            ],
            'finance_manager' => [
                // All request permissions
                'requests.create',
                'requests.view',
                'requests.view_own',
                'requests.approve',
                'requests.manage',
                // All finance permissions
                'finance.view_vouchers',
                'finance.create_vouchers',
                'finance.approve_vouchers',
                'finance.view_retirements',
                'finance.submit_retirements',
                'finance.verify_retirements',
                'finance.view_reports',
                'finance.manage'
            ],
            // Update admin role to have all finance permissions
            'admin' => [
                'requests.create',
                'requests.view',
                'requests.view_own',
                'requests.approve',
                'requests.manage',
                'finance.view_vouchers',
                'finance.create_vouchers',
                'finance.approve_vouchers',
                'finance.view_retirements',
                'finance.submit_retirements',
                'finance.verify_retirements',
                'finance.view_reports',
                'finance.manage'
            ]
        ];

        foreach ($roleMappings as $roleName => $permissions) {
            $roleId = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_roles WHERE name = %s",
                $roleName
            ));

            if (!$roleId) {
                error_log("Role not found: $roleName");
                continue;
            }

            foreach ($permissions as $permissionName) {
                $permissionId = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}sta_permissions WHERE name = %s",
                    $permissionName
                ));

                if (!$permissionId) {
                    error_log("Permission not found: $permissionName");
                    continue;
                }

                // Check if assignment already exists
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT role_id FROM {$wpdb->prefix}sta_role_permissions 
                     WHERE role_id = %s AND permission_id = %s",
                    $roleId,
                    $permissionId
                ));

                if (!$exists) {
                    $wpdb->insert(
                        "{$wpdb->prefix}sta_role_permissions",
                        [
                            'role_id' => $roleId,
                            'permission_id' => $permissionId
                        ],
                        ['%s', '%s']
                    );
                }
            }

            error_log("Assigned permissions to role: $roleName");
        }
    }

    public static function down()
    {
        global $wpdb;

        error_log('Rolling back Migration 1.3.3: Finance Permissions and Roles');

        // Get IDs of permissions to remove
        $permissionNames = [
            'requests.create',
            'requests.view',
            'requests.view_own',
            'requests.approve',
            'requests.manage',
            'finance.view_vouchers',
            'finance.create_vouchers',
            'finance.approve_vouchers',
            'finance.view_retirements',
            'finance.submit_retirements',
            'finance.verify_retirements',
            'finance.view_reports',
            'finance.manage'
        ];

        $placeholders = implode(',', array_fill(0, count($permissionNames), '%s'));
        $permissionIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}sta_permissions WHERE name IN ($placeholders)",
            ...$permissionNames
        ));

        // Remove role-permission assignments
        if (!empty($permissionIds)) {
            $idPlaceholders = implode(',', array_fill(0, count($permissionIds), '%s'));
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}sta_role_permissions WHERE permission_id IN ($idPlaceholders)",
                ...$permissionIds
            ));
        }

        // Remove permissions
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->prefix}sta_permissions WHERE name IN ($placeholders)",
            ...$permissionNames
        ));

        // Remove finance roles
        $roleNames = ['finance_officer', 'accountant', 'finance_manager'];
        $rolePlaceholders = implode(',', array_fill(0, count($roleNames), '%s'));

        $roleIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}sta_roles WHERE name IN ($rolePlaceholders)",
            ...$roleNames
        ));

        if (!empty($roleIds)) {
            $roleIdPlaceholders = implode(',', array_fill(0, count($roleIds), '%s'));

            // Remove user-role assignments
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}sta_user_roles WHERE role_id IN ($roleIdPlaceholders)",
                ...$roleIds
            ));
        }

        // Remove roles
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->prefix}sta_roles WHERE name IN ($rolePlaceholders)",
            ...$roleNames
        ));

        error_log('Migration 1.3.3 rollback completed');
    }
}
