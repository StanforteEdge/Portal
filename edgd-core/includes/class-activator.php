<?php
/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    EDGD\Core
 */

namespace EDGD\Core;

class Activator {
    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function activate() {
        // Create necessary database tables
        self::create_tables();
        
        // Set default options
        self::set_default_options();
        
        // Add rewrite rules and flush
        flush_rewrite_rules();
    }
    
    /**
     * Create necessary database tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        $table_prefix = $wpdb->prefix . 'edgd_';
        
        $sql = [];
        
        // Users table
        $sql[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}users (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            wp_user_id bigint(20) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY wp_user_id (wp_user_id)
        ) $charset_collate;";
        
        // User meta table
        $sql[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}user_meta (
            meta_id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            meta_key varchar(255) NOT NULL,
            meta_value longtext,
            PRIMARY KEY  (meta_id),
            KEY user_id (user_id),
            KEY meta_key (meta_key(191))
        ) $charset_collate;";
        
        // Sessions table
        $sql[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}sessions (
            session_id varchar(191) NOT NULL,
            user_id bigint(20) NOT NULL,
            expires_at datetime NOT NULL,
            ip_address varchar(45) NOT NULL,
            user_agent text NOT NULL,
            payload longtext NOT NULL,
            last_activity datetime NOT NULL,
            PRIMARY KEY  (session_id),
            KEY user_id (user_id),
            KEY expires_at (expires_at)
        ) $charset_collate;";
        
        // API keys table
        $sql[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}api_keys (
            key_id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            consumer_key char(64) NOT NULL,
            consumer_secret char(43) NOT NULL,
            description varchar(200) NOT NULL,
            permissions varchar(10) NOT NULL,
            created_at datetime NOT NULL,
            last_access datetime DEFAULT NULL,
            revoked tinyint(1) DEFAULT 0,
            PRIMARY KEY  (key_id),
            KEY consumer_key (consumer_key),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        foreach ($sql as $query) {
            dbDelta($query);
        }
        
        // Store the current database version
        update_option('edgd_db_version', '1.0.0');
    }
    
    /**
     * Set default plugin options
     */
    private static function set_default_options() {
        // JWT Secret Key
        if (!get_option('edgd_jwt_secret_key')) {
            update_option('edgd_jwt_secret_key', bin2hex(random_bytes(32)));
        }
        
        // Default settings
        $default_settings = [
            'jwt_expire' => 3600, // 1 hour
            'jwt_refresh_expire' => 1209600, // 14 days
            'require_email_verification' => 0,
            'enable_api_logging' => 1,
        ];
        
        foreach ($default_settings as $key => $value) {
            if (!get_option('edgd_' . $key)) {
                update_option('edgd_' . $key, $value);
            }
        }
    }
}
