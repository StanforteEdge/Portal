<?php

namespace App\Database\Migrations;

class Migration_1_1_7_NewUserRoles
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

     // 4. User Roles junction table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_user_roles` (
            user_id BIGINT UNSIGNED NOT NULL,
            role_id CHAR(36) NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES `{$wpdb->prefix}sta_profiles` (`wp_user_id`) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES `{$wpdb->prefix}sta_roles` (`id`) ON DELETE CASCADE
        ) $charset_collate;";
        dbDelta($sql);

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_user_roles);

        
    }

    public static function down()
    {

        
    }
}


