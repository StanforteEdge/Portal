<?php

namespace App\Database\Migrations;

class Migration_1_0_4_CreateAdminUserAndRoles
{
    public static function up()
    {
        global $wpdb;
        
        // 1. Create default roles
        $roles = [
            ['id' => wp_generate_uuid4(), 'name' => 'admin', 'description' => 'System Administrator'],
            ['id' => wp_generate_uuid4(), 'name' => 'hr', 'description' => 'Human Resources'],
            ['id' => wp_generate_uuid4(), 'name' => 'employee', 'description' => 'Regular Employee'],
            ['id' => wp_generate_uuid4(), 'name' => 'manager', 'description' => 'Department Manager']
        ];
        
        foreach ($roles as $role) {
            $wpdb->insert(
                "{$wpdb->prefix}sta_roles",
                $role,
                ['%s', '%s', '%s']
            );
        }
        
        // 2. Create default permissions
        $permissions = [
            ['id' => wp_generate_uuid4(), 'name' => 'manage_users', 'description' => 'Manage user accounts'],
            ['id' => wp_generate_uuid4(), 'name' => 'manage_roles', 'description' => 'Manage roles and permissions'],
            ['id' => wp_generate_uuid4(), 'name' => 'view_reports', 'description' => 'View system reports'],
            ['id' => wp_generate_uuid4(), 'name' => 'manage_leave', 'description' => 'Manage leave requests'],
            ['id' => wp_generate_uuid4(), 'name' => 'view_profile', 'description' => 'View user profiles'],
            ['id' => wp_generate_uuid4(), 'name' => 'edit_profile', 'description' => 'Edit user profiles']
        ];
        
        foreach ($permissions as $permission) {
            $wpdb->insert(
                "{$wpdb->prefix}sta_permissions",
                $permission,
                ['%s', '%s', '%s']
            );
        }
        
        // 3. Assign permissions to admin role
        $admin_role = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}sta_roles WHERE name = %s",
            'admin'
        ));
        
        if ($admin_role) {
            $all_permissions = $wpdb->get_results(
                "SELECT id FROM {$wpdb->prefix}sta_permissions"
            );
            
            foreach ($all_permissions as $permission) {
                $wpdb->insert(
                    "{$wpdb->prefix}sta_role_permissions",
                    [
                        'role_id' => $admin_role,
                        'permission_id' => $permission->id
                    ],
                    ['%s', '%s']
                );
            }
        }
        
        // 4. Create admin user profile (if WordPress user exists)
        $admin_wp_user = get_user_by('email', 'olalekan@stanforteedge.com');
        if (!$admin_wp_user) {
            // Create WordPress user first
            $user_id = wp_create_user('admin', 'admin123!', 'admin@stanforteedge.com');
            if (!is_wp_error($user_id)) {
                $admin_wp_user = get_user_by('id', $user_id);
            }
        }
        
        if ($admin_wp_user) {
            // Create profile
            $wpdb->insert(
                "{$wpdb->prefix}sta_profiles",
                [
                    'wp_user_id' => $admin_wp_user->ID,
                    'username' => $admin_wp_user->user_login,
                    'email' => $admin_wp_user->user_email,
                    'type' => 'admin',
                    'status' => 'active',
                    'first_name' => 'Olalekan',
                    'last_name' => 'Owonikoko'
                ],
                ['%d', '%s', '%s', '%s', '%s', '%s', '%s']
            );
            
            // Assign admin role to user
            if ($admin_role) {
                $wpdb->insert(
                    "{$wpdb->prefix}sta_user_roles",
                    [
                        'user_id' => $admin_wp_user->ID,
                        'role_id' => $admin_role
                    ],
                    ['%d', '%s']
                );
            }
        }
        
        error_log('Stanforte Edge: Created default roles, permissions, and admin user');
    }
    
    public static function down()
    {
        global $wpdb;
        
        // Remove admin user
        $admin_user = get_user_by('email', 'admin@stanforteedge.com');
        if ($admin_user) {
            wp_delete_user($admin_user->ID);
        }
        
        // Clear all role assignments
        $wpdb->query("DELETE FROM {$wpdb->prefix}sta_user_roles");
        $wpdb->query("DELETE FROM {$wpdb->prefix}sta_role_permissions");
        $wpdb->query("DELETE FROM {$wpdb->prefix}sta_permissions");
        $wpdb->query("DELETE FROM {$wpdb->prefix}sta_roles");
    }
}
