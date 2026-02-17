<?php

namespace App\Database\Migrations;

class Migration_1_0_6_CreateNotificationsTable
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_notifications` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` BIGINT UNSIGNED NOT NULL,
            `type` VARCHAR(50) NOT NULL DEFAULT 'info',
            `title` VARCHAR(255) NOT NULL,
            `message` TEXT NOT NULL,
            `link` VARCHAR(255) NULL DEFAULT NULL,
            `data` LONGTEXT NULL DEFAULT NULL,
            `status` VARCHAR(20) NOT NULL DEFAULT 'unread',
            `read_at` TIMESTAMP NULL DEFAULT NULL,
            `archived_at` TIMESTAMP NULL DEFAULT NULL,
            `sent_via` TEXT NULL DEFAULT NULL COMMENT 'JSON array of delivery methods',
            `notifiable_type` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Class name of the notifiable entity',
            `notifiable_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID of the notifiable entity',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `user_id` (`user_id`),
            KEY `type` (`type`),
            KEY `status` (`status`),
            KEY `notifiable` (`notifiable_type`, `notifiable_id`),
            KEY `user_status` (`user_id`, `status`)
        ) $charset_collate";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public static function down()
    {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_notifications`");
    }
}
