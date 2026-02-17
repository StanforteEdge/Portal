<?php
namespace App\Database\Migrations;

use function wp_generate_uuid4;

class Migration_1_1_0_seed_send_notifications
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $permissions_table = $wpdb->prefix . 'sta_permissions';
        $roles_table = $wpdb->prefix . 'sta_roles';
        $role_permissions_table = $wpdb->prefix . 'sta_role_permissions';

        // Ensure permission exists
        $permission_name = 'send_notifications';
        $permission_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$permissions_table} WHERE name = %s",
            $permission_name
        ));

        if (!$permission_id) {
            $permission_id = wp_generate_uuid4();
            $wpdb->insert(
                $permissions_table,
                [
                    'id' => $permission_id,
                    'name' => $permission_name,
                    'description' => 'Send notifications to users',
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                ],
                ['%s', '%s', '%s', '%s', '%s']
            );
        }

        // Map to 'admin' role if it exists
        $admin_role_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$roles_table} WHERE name = %s",
            'admin'
        ));

        if ($admin_role_id && $permission_id) {
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$role_permissions_table} WHERE role_id = %s AND permission_id = %s",
                $admin_role_id,
                $permission_id
            ));

            if ((int)$exists === 0) {
                $wpdb->insert(
                    $role_permissions_table,
                    [
                        'role_id' => $admin_role_id,
                        'permission_id' => $permission_id,
                    ],
                    ['%s', '%s']
                );
            }
        }
    }
}
