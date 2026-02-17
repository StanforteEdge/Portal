<?php

namespace App\Database\Migrations;

class Migration_1_1_2_GroupSystem
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // Create groups table
        $sql_groups = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_groups` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `type` VARCHAR(50) NOT NULL DEFAULT 'general' COMMENT 'Dynamic group type: workflow, department, team, project, committee, etc.',
            `parent_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'For hierarchical groups',
            `metadata` LONGTEXT NULL COMMENT 'JSON-encoded additional data',
            `is_active` TINYINT(1) NOT NULL DEFAULT 1,
            `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
            `updated_by` BIGINT UNSIGNED NULL DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_type` (`type`),
            KEY `idx_parent` (`parent_id`),
            KEY `idx_active` (`is_active`),
            KEY `idx_created_by` (`created_by`)
        ) $charset_collate";

        // Create group_users table for memberships
        $sql_group_users = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_group_users` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `group_id` BIGINT UNSIGNED NOT NULL,
            `user_id` BIGINT UNSIGNED NOT NULL,
            `role` ENUM('member','admin','moderator') NOT NULL DEFAULT 'member',
            `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `added_by` BIGINT UNSIGNED NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_group_user` (`group_id`,`user_id`),
            KEY `idx_group` (`group_id`),
            KEY `idx_user` (`user_id`),
            KEY `idx_role` (`role`),
            KEY `idx_added_by` (`added_by`)
        ) $charset_collate";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_groups);
        dbDelta($sql_group_users);

        // Add foreign key constraints
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups`
            ADD CONSTRAINT `fk_groups_parent` FOREIGN KEY (`parent_id`) REFERENCES `{$wpdb->prefix}sta_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups`
            ADD CONSTRAINT `fk_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups`
            ADD CONSTRAINT `fk_groups_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users`
            ADD CONSTRAINT `fk_group_users_group` FOREIGN KEY (`group_id`) REFERENCES `{$wpdb->prefix}sta_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users`
            ADD CONSTRAINT `fk_group_users_user` FOREIGN KEY (`user_id`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users`
            ADD CONSTRAINT `fk_group_users_added_by` FOREIGN KEY (`added_by`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");
    }

    public static function down()
    {
        global $wpdb;

        // Drop foreign key constraints first
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users` DROP FOREIGN KEY IF EXISTS `fk_group_users_added_by`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users` DROP FOREIGN KEY IF EXISTS `fk_group_users_user`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_group_users` DROP FOREIGN KEY IF EXISTS `fk_group_users_group`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups` DROP FOREIGN KEY IF EXISTS `fk_groups_updated_by`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups` DROP FOREIGN KEY IF EXISTS `fk_groups_created_by`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_groups` DROP FOREIGN KEY IF EXISTS `fk_groups_parent`");

        // Drop tables
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_group_users`");
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_groups`");
    }
}
