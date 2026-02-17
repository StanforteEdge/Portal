<?php

namespace App\Database\Migrations;

class Migration_1_1_9_MigrateUserRolesToProfileId 
{
    public static function up()
    {
        global $wpdb;
        
        error_log('[Migration 1.1.9] Starting migration: User roles from wp_user_id to profile_id');
        
        // Step 1: Create temporary table with new structure
        // Get the collation from sta_roles table to ensure compatibility
        $roles_collation = $wpdb->get_row("SHOW TABLE STATUS LIKE '{$wpdb->prefix}sta_roles'");
        $collation = $roles_collation ? $roles_collation->Collation : 'utf8mb4_unicode_520_ci';
        $charset = explode('_', $collation)[0];
        
        error_log('[Migration 1.1.9] Using collation: ' . $collation);
        
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_user_roles_new` (
            user_id VARCHAR(36) CHARACTER SET {$charset} COLLATE {$collation} NOT NULL COMMENT 'Profile ID from sta_profiles',
            role_id CHAR(36) CHARACTER SET {$charset} COLLATE {$collation} NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id),
            KEY idx_user_id (user_id),
            KEY idx_role_id (role_id),
            KEY fk_role_id (role_id)
        ) CHARACTER SET {$charset} COLLATE {$collation};";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            error_log('[Migration 1.1.8] Failed to create new table: ' . $wpdb->last_error);
            return false;
        }
        
        error_log('[Migration 1.1.8] Created new table sta_user_roles_new');
        
        // Step 2: Migrate data from old table to new table
        // Map wp_user_id to profile_id
        $migrate_sql = "
            INSERT INTO {$wpdb->prefix}sta_user_roles_new (user_id, role_id, assigned_at)
            SELECT 
                p.id as user_id,
                ur.role_id,
                ur.assigned_at
            FROM {$wpdb->prefix}sta_user_roles ur
            INNER JOIN {$wpdb->prefix}sta_profiles p ON ur.user_id = p.wp_user_id
            ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)
        ";
        
        $migrated = $wpdb->query($migrate_sql);
        
        if ($migrated === false) {
            error_log('[Migration 1.1.8] Failed to migrate data: ' . $wpdb->last_error);
            // Rollback: drop new table
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_user_roles_new");
            return false;
        }
        
        error_log('[Migration 1.1.8] Migrated ' . $migrated . ' role assignments');
        
        // Step 3: Check for orphaned records (wp_user_id without profile)
        $orphaned = $wpdb->get_results("
            SELECT ur.user_id, ur.role_id, u.user_login
            FROM {$wpdb->prefix}sta_user_roles ur
            LEFT JOIN {$wpdb->prefix}sta_profiles p ON ur.user_id = p.wp_user_id
            LEFT JOIN {$wpdb->users} u ON ur.user_id = u.ID
            WHERE p.id IS NULL
        ");
        
        if (!empty($orphaned)) {
            error_log('[Migration 1.1.8] WARNING: Found ' . count($orphaned) . ' orphaned role assignments (wp_user_id without profile):');
            foreach ($orphaned as $record) {
                error_log('  - WP User ID: ' . $record->user_id . ' (' . ($record->user_login ?? 'unknown') . '), Role ID: ' . $record->role_id);
            }
            error_log('[Migration 1.1.8] These records will NOT be migrated. Create profiles for these users first.');
        }
        
        // Step 4: Backup old table
        $backup_result = $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}sta_user_roles_backup_wp_user_id LIKE {$wpdb->prefix}sta_user_roles");
        
        if ($backup_result !== false) {
            $wpdb->query("INSERT INTO {$wpdb->prefix}sta_user_roles_backup_wp_user_id SELECT * FROM {$wpdb->prefix}sta_user_roles");
            error_log('[Migration 1.1.8] Backed up old table to sta_user_roles_backup_wp_user_id');
        }
        
        // Step 5: Drop old table
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_user_roles");
        error_log('[Migration 1.1.8] Dropped old sta_user_roles table');
        
        // Step 6: Rename new table to original name
        $wpdb->query("RENAME TABLE {$wpdb->prefix}sta_user_roles_new TO {$wpdb->prefix}sta_user_roles");
        error_log('[Migration 1.1.9] Renamed sta_user_roles_new to sta_user_roles');
        
        // Step 7: Log completion summary
        error_log('[Migration 1.1.9] ========================================');
        error_log('[Migration 1.1.9] MIGRATION COMPLETED SUCCESSFULLY');
        error_log('[Migration 1.1.9] ========================================');
        error_log('[Migration 1.1.9] Summary:');
        error_log('[Migration 1.1.9] - Migrated ' . $migrated . ' role assignments');
        error_log('[Migration 1.1.9] - Old structure: user_id BIGINT (wp_user_id)');
        error_log('[Migration 1.1.9] - New structure: user_id VARCHAR(36) (profile_id)');
        error_log('[Migration 1.1.9] - Backup table: sta_user_roles_backup_wp_user_id (KEPT for rollback)');
        error_log('[Migration 1.1.9] ========================================');
        
        // Store migration metadata
        update_option('stanfort_edge_migration_1_1_9_completed', [
            'completed_at' => current_time('mysql'),
            'records_migrated' => $migrated,
            'orphaned_records' => count($orphaned ?? []),
            'backup_table' => 'sta_user_roles_backup_wp_user_id'
        ]);
        
        return true;
    }
    
    public static function down()
    {
        global $wpdb;
        
        error_log('[Migration 1.1.9] Rolling back: Restoring user roles to wp_user_id');
        
        // Check if backup exists
        $backup_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}sta_user_roles_backup_wp_user_id'");
        
        if (!$backup_exists) {
            error_log('[Migration 1.1.9] ERROR: Backup table not found. Cannot rollback.');
            return false;
        }
        
        // Drop current table
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_user_roles");
        
        // Restore from backup
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE `{$wpdb->prefix}sta_user_roles` (
            user_id BIGINT UNSIGNED NOT NULL,
            role_id CHAR(36) NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES {$wpdb->users}(ID) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES {$wpdb->prefix}sta_roles(id) ON DELETE CASCADE
        ) $charset_collate;";
        
        $wpdb->query($sql);
        
        // Copy data back
        $wpdb->query("INSERT INTO {$wpdb->prefix}sta_user_roles SELECT * FROM {$wpdb->prefix}sta_user_roles_backup_wp_user_id");
        
        error_log('[Migration 1.1.9] Rollback completed');
        
        // Clear migration metadata
        delete_option('stanfort_edge_migration_1_1_9_completed');
        
        return true;
    }
}
