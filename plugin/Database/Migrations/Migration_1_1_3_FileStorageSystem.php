<?php

namespace App\Database\Migrations;

class Migration_1_1_3_FileStorageSystem
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // Create files table for storing file metadata
        $sql_files = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_files` (
            `id` VARCHAR(36) NOT NULL,
            `owner_id` BIGINT UNSIGNED NOT NULL COMMENT 'User who uploaded the file',
            `file_name` VARCHAR(255) NOT NULL COMMENT 'Original file name',
            `file_type` VARCHAR(100) NOT NULL COMMENT 'MIME type',
            `file_size` BIGINT UNSIGNED NOT NULL COMMENT 'File size in bytes',
            `storage_path` VARCHAR(500) NOT NULL COMMENT 'Path to stored file',
            `storage_provider` VARCHAR(50) DEFAULT 'local' COMMENT 'Storage provider (local, s3, etc.)',
            `status` ENUM('active', 'archived', 'deleted') DEFAULT 'active' COMMENT 'File status',
            `version` INT DEFAULT 1 COMMENT 'File version number',
            `parent_file_id` VARCHAR(36) NULL COMMENT 'Parent file ID for versioning',
            `metadata` LONGTEXT NULL COMMENT 'JSON metadata (tags, description, etc.)',
            `hash` VARCHAR(128) NULL COMMENT 'File hash for integrity checking',
            `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_owner` (`owner_id`),
            KEY `idx_status` (`status`),
            KEY `idx_file_type` (`file_type`),
            KEY `idx_uploaded_at` (`uploaded_at`),
            KEY `idx_parent_file` (`parent_file_id`)
        ) $charset_collate";

        // Create file_links table for linking files to entities
        $sql_file_links = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_file_links` (
            `id` VARCHAR(36) NOT NULL,
            `file_id` VARCHAR(36) NOT NULL COMMENT 'Reference to the file',
            `linked_entity_type` VARCHAR(50) NOT NULL COMMENT 'Type of entity (request, user, workflow, etc.)',
            `linked_entity_id` VARCHAR(36) NOT NULL COMMENT 'ID of the linked entity',
            `linked_by` BIGINT UNSIGNED NOT NULL COMMENT 'User who created the link',
            `linked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_file` (`file_id`),
            KEY `idx_entity` (`linked_entity_type`, `linked_entity_id`),
            KEY `idx_linked_by` (`linked_by`),
            KEY `idx_linked_at` (`linked_at`)
        ) $charset_collate";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_files);
        dbDelta($sql_file_links);

        // Add foreign key constraints
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_files`
            ADD CONSTRAINT `fk_files_owner` FOREIGN KEY (`owner_id`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_files`
            ADD CONSTRAINT `fk_files_parent` FOREIGN KEY (`parent_file_id`) REFERENCES `{$wpdb->prefix}sta_files` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_file_links`
            ADD CONSTRAINT `fk_file_links_file` FOREIGN KEY (`file_id`) REFERENCES `{$wpdb->prefix}sta_files` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");

        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_file_links`
            ADD CONSTRAINT `fk_file_links_linked_by` FOREIGN KEY (`linked_by`) REFERENCES `{$wpdb->prefix}sta_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");
    }

    public static function down()
    {
        global $wpdb;

        // Drop foreign key constraints first
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_file_links` DROP FOREIGN KEY IF EXISTS `fk_file_links_linked_by`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_file_links` DROP FOREIGN KEY IF EXISTS `fk_file_links_file`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_files` DROP FOREIGN KEY IF EXISTS `fk_files_parent`");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_files` DROP FOREIGN KEY IF EXISTS `fk_files_owner`");

        // Drop tables
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_file_links`");
        $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}sta_files`");
    }
}
