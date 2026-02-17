<?php
namespace App\Database;

require_once __DIR__ . '/MigrationRunner.php';

class DatabaseInitializer
{
    const CURRENT_VERSION = '3.0.1';
    const VERSION_OPTION = 'stanfort_edge_db_version';
    
    public static function initialize()
    {
        // self::createTables();
        
        // Use the new MigrationRunner for version-based migrations
        MigrationRunner::runMigrations();
    }
    
    // public static function createTables()
    // {
    //     global $wpdb;
    //     $charset_collate = $wpdb->get_charset_collate();
        
    //     require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
    //     // Create migrations tracking table first
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_migrations` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         version VARCHAR(20) NOT NULL,
    //         migration_name VARCHAR(255) NOT NULL,
    //         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         UNIQUE KEY unique_migration (version, migration_name)
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 1. Centralized Profiles table (for all portal users)
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_profiles` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         wp_user_id BIGINT UNSIGNED NULL,
    //         username VARCHAR(100) NOT NULL UNIQUE,
    //         email VARCHAR(255) NOT NULL UNIQUE,
    //         type VARCHAR(50) NOT NULL,
    //         status VARCHAR(20) NOT NULL DEFAULT 'active',
    //         first_name VARCHAR(100) DEFAULT NULL,
    //         last_name VARCHAR(100) DEFAULT NULL,
    //         date_of_birth DATE DEFAULT NULL,
    //         gender VARCHAR(10) DEFAULT NULL,
    //         phone VARCHAR(30) DEFAULT NULL,
    //         address VARCHAR(255) DEFAULT NULL,
    //         nationality VARCHAR(100) DEFAULT NULL,
    //         state VARCHAR(100) DEFAULT NULL,
    //         lga VARCHAR(100) DEFAULT NULL,
    //         marital_status VARCHAR(30) DEFAULT NULL,
    //         avatar VARCHAR(255) DEFAULT NULL,
    //         bio TEXT DEFAULT NULL,
    //         occupation VARCHAR(100) DEFAULT NULL,
    //         last_login TIMESTAMP NULL,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         CONSTRAINT fk_wp_user FOREIGN KEY (wp_user_id) REFERENCES {$wpdb->users}(ID) ON DELETE SET NULL
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 2. Roles table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_roles` (
    //         id CHAR(36) PRIMARY KEY,
    //         name VARCHAR(50) UNIQUE NOT NULL,
    //         description VARCHAR(255),
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 2. Permissions table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_permissions` (
    //         id CHAR(36) PRIMARY KEY,
    //         name VARCHAR(100) UNIQUE NOT NULL,
    //         description VARCHAR(255),
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 3. Role Permissions junction table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_role_permissions` (
    //         role_id CHAR(36) NOT NULL,
    //         permission_id CHAR(36) NOT NULL,
    //         PRIMARY KEY (role_id, permission_id),
    //         FOREIGN KEY (role_id) REFERENCES {$wpdb->prefix}sta_roles(id) ON DELETE CASCADE,
    //         FOREIGN KEY (permission_id) REFERENCES {$wpdb->prefix}sta_permissions(id) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 4. User Roles junction table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_user_roles` (
    //         user_id BIGINT UNSIGNED NOT NULL,
    //         role_id CHAR(36) NOT NULL,
    //         assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         PRIMARY KEY (user_id, role_id),
    //         FOREIGN KEY (user_id) REFERENCES {$wpdb->users}(ID) ON DELETE CASCADE,
    //         FOREIGN KEY (role_id) REFERENCES {$wpdb->prefix}sta_roles(id) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 5. Unified Tokens table (for JWT access and refresh tokens)
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_tokens` (
    //         id VARCHAR(255) PRIMARY KEY,
    //         user_id BIGINT UNSIGNED NOT NULL,
    //         type ENUM('access', 'refresh') NOT NULL,
    //         token_hash VARCHAR(255) NOT NULL,
    //         expires_at TIMESTAMP NOT NULL,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         last_used_at TIMESTAMP NULL,
    //         user_agent TEXT,
    //         ip_address VARCHAR(45),
    //         INDEX idx_user_id (user_id),
    //         INDEX idx_token_hash (token_hash),
    //         INDEX idx_type (type),
    //         INDEX idx_expires_at (expires_at),
    //         UNIQUE KEY unique_token_hash_type (token_hash, type),
    //         FOREIGN KEY (user_id) REFERENCES {$wpdb->users}(ID) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 7. Employee Contacts table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_contacts` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         profile_id BIGINT NOT NULL,
    //         contact_type ENUM('email', 'phone', 'address') NOT NULL,
    //         contact_value TEXT NOT NULL,
    //         is_primary BOOLEAN DEFAULT false,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 8.  Contacts table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_emergency_contacts` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         profile_id BIGINT NOT NULL,
    //         name VARCHAR(100) NOT NULL,
    //         relationship VARCHAR(50) NOT NULL,
    //         phone VARCHAR(20) NOT NULL,
    //         email VARCHAR(100),
    //         address TEXT,
    //         is_primary BOOLEAN DEFAULT false,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 9. Attendance table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_attendance` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         profile_id BIGINT NOT NULL,
    //         date DATE NOT NULL,
    //         check_in_time TIME,
    //         check_out_time TIME,
    //         hours_worked DECIMAL(4,2),
    //         status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
    //         notes TEXT,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         UNIQUE KEY unique_employee_date (profile_id, date),
    //         FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // 10. Leave Requests table
    //     $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_leave_requests` (
    //         id BIGINT PRIMARY KEY AUTO_INCREMENT,
    //         profile_id BIGINT NOT NULL,
    //         leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid') NOT NULL,
    //         start_date DATE NOT NULL,
    //         end_date DATE NOT NULL,
    //         days_requested INT NOT NULL,
    //         reason TEXT,
    //         status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    //         approved_by BIGINT UNSIGNED,
    //         approved_at TIMESTAMP NULL,
    //         comments TEXT,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE,
    //         FOREIGN KEY (approved_by) REFERENCES {$wpdb->users}(ID) ON DELETE SET NULL
    //     ) $charset_collate;";
    //     dbDelta($sql);
        
    //     // Record initial migration only if not already recorded
    //     if (!self::migrationExists('1.0.2', 'initial_database_setup')) {
    //         self::recordMigration('1.0.2', 'initial_database_setup');
    //     }
        
    //     // Log successful table creation
    //     error_log('Stanforte Edge: All database tables created successfully');
        
    //     return true;
    // }
    
    // public static function runMigrations($from_version)
    // {
    //     // Add deleted_at column to sta_profiles for soft deletes
    //     if (version_compare($from_version, '1.0.3', '<')) {
    //         self::migrate_to_1_1_6();
    //     }
        
    //     // Future migrations will be added here based on version
    //     // Example:
    //     // if (version_compare($from_version, '1.1.0', '<')) {
    //     //     self::migrate_to_1_1_0();
    //     // }
    //     // if (version_compare($from_version, '1.2.0', '<')) {
    //     //     self::migrate_to_1_2_0();
    //     // }
    // }
    
    // private static function migrationExists($version, $migration_name)
    // {
    //     global $wpdb;
        
    //     $result = $wpdb->get_var($wpdb->prepare(
    //         "SELECT COUNT(*) FROM {$wpdb->prefix}sta_migrations WHERE version = %s AND migration_name = %s",
    //         $version,
    //         $migration_name
    //     ));
        
    //     return $result > 0;
    // }
    
    // // private static function migrate_to_1_0_3()
    // // {
    // //     global $wpdb;
        
    // //     // Add deleted_at column to sta_profiles table for soft deletes
    // //     $sql = "ALTER TABLE {$wpdb->prefix}sta_profiles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL";
    // //     $result = $wpdb->query($sql);
        
    // //     if ($result !== false) {
    // //         self::recordMigration('1.0.3', 'add_deleted_at_to_profiles');
    // //         error_log('Stanforte Edge: Added deleted_at column to sta_profiles table');
    // //     } else {
    // //         error_log('Stanforte Edge: Failed to add deleted_at column to sta_profiles table');
    // //     }
        
    // //     // Fix foreign key constraint in leave requests table
    // //     $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_leave_requests DROP FOREIGN KEY IF EXISTS sta_leave_requests_ibfk_1");
    // //     $sql = "ALTER TABLE {$wpdb->prefix}sta_leave_requests ADD CONSTRAINT fk_leave_profile FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE";
    // //     $result = $wpdb->query($sql);
        
    // //     if ($result !== false) {
    // //         self::recordMigration('1.0.3', 'fix_leave_requests_foreign_key');
    // //         error_log('Stanforte Edge: Fixed foreign key constraint in sta_leave_requests table');
    // //     } else {
    // //         error_log('Stanforte Edge: Failed to fix foreign key constraint in sta_leave_requests table');
    // //     }
    // // }
    
    // private static function recordMigration($version, $migration_name)
    // {
    //     global $wpdb;
        
    //     $wpdb->insert(
    //         "{$wpdb->prefix}sta_migrations",
    //         [
    //             'version' => $version,
    //             'migration_name' => $migration_name
    //         ],
    //         ['%s', '%s']
    //     );
    // }
    
    // public static function dropTables()
    // {
    //     global $wpdb;
        
    //     // Drop tables in reverse order to respect foreign key constraints
    //     $tables = [
    //         'sta_leave_requests',
    //         'sta_attendance',
    //         'sta_contacts',
    //         'sta_emergency_contacts',
    //         'sta_tokens',
    //         'sta_user_roles',
    //         'sta_role_permissions',
    //         'sta_permissions',
    //         'sta_roles',
    //         'sta_profiles',
    //         'sta_migrations'
    //     ];
        
    //     foreach ($tables as $table) {
    //         $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
    //     }
        
    //     error_log('Stanforte Edge: All database tables dropped');
    // }
}
