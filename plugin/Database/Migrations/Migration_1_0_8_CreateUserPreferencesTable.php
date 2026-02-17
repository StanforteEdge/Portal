<?php

namespace App\Database\Migrations;

class Migration_1_0_8_CreateUserPreferencesTable
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_user_preferences` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` BIGINT UNSIGNED NOT NULL,
            `preference_type` VARCHAR(50) NOT NULL COMMENT 'e.g., notification, display, language, etc.',
            `preference_key` VARCHAR(100) NOT NULL COMMENT 'e.g., email_notifications, sms_notifications, theme, timezone',
            `preference_value` TEXT NULL DEFAULT NULL COMMENT 'JSON-encoded preference value',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `user_preference` (`user_id`, `preference_type`, `preference_key`),
            KEY `user_id` (`user_id`),
            KEY `preference_type` (`preference_type`),
            KEY `preference_key` (`preference_key`)
        ) $charset_collate";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public static function down()
    {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_user_preferences`");
    }
}
