<?php
/**
 * Admin Module - User Management Extensions
 * Migration: 1_1_5
 */

namespace App\Database\Migrations;

/**
 * Migration to add admin-specific fields to user profiles
 * and extend group_users table for team management
 */
class Migration_1_1_5_AdminUserFields 
{
    /**
     * Run the migration
     *
     * @return void
     */
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // Add admin_notes field to sta_profiles table
        $sql_profiles = "ALTER TABLE {$wpdb->prefix}sta_profiles
                        ADD COLUMN admin_notes TEXT NULL";

        // Add is_primary_team field to sta_group_users table
        $sql_group_users = "ALTER TABLE {$wpdb->prefix}sta_group_users
                           ADD COLUMN is_primary_team TINYINT(1) DEFAULT 0";

        // Create generic imports table
        $sql_imports = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}sta_imports (
            id CHAR(36) NOT NULL,
            import_type ENUM('users', 'teams', 'programs', 'financial_requests', 'other') NOT NULL,
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NULL,
            total_records INT DEFAULT 0,
            processed_records INT DEFAULT 0,
            successful_records INT DEFAULT 0,
            failed_records INT DEFAULT 0,
            status ENUM('uploading', 'validating', 'processing', 'completed', 'failed') DEFAULT 'uploading',
            error_summary TEXT NULL,
            imported_by BIGINT UNSIGNED NOT NULL,
            module_name VARCHAR(100) NULL,
            entity_type VARCHAR(100) NULL,
            config LONGTEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            PRIMARY KEY (id),
            KEY idx_status (status),
            KEY idx_type (import_type),
            KEY idx_module (module_name),
            KEY idx_entity (entity_type),
            KEY idx_user (imported_by),
            FOREIGN KEY (imported_by) REFERENCES {$wpdb->prefix}sta_profiles(id)
        ) $charset_collate";

        // Execute migrations
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // Add admin_notes to profiles (ignore if already exists)
        $wpdb->query($sql_profiles);

        // Add is_primary_team to group_users (ignore if already exists)
        $wpdb->query($sql_group_users);

        // Create imports table
        dbDelta($sql_imports);

        // Log migration completion
        error_log('Migration 1_1_5_AdminUserFields completed successfully');
    }

    /**
     * Reverse the migration
     *
     * @return void
     */
    public static function down()
    {
        global $wpdb;

        // Remove admin_notes from profiles
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_profiles DROP COLUMN IF EXISTS admin_notes");

        // Remove is_primary_team from group_users
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_group_users DROP COLUMN IF EXISTS is_primary_team");

        // Drop imports table
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_imports");

        error_log('Migration 1_1_5_AdminUserFields rolled back');
    }
}
