<?php
/**
 * Database Handler
 *
 * @package    EDGD\Core\Database
 * @since      1.0.0
 */

declare(strict_types=1);

namespace EDGD\Core\Database;

use wpdb;

/**
 * Database handler class.
 *
 * Handles database operations and table management.
 *
 * @package EDGD\Core\Database
 */
class Database {
    /**
     * WordPress database instance.
     *
     * @var wpdb
     */
    protected $wpdb;

    /**
     * Database tables.
     *
     * @var array
     */
    protected $tables = [];

    /**
     * Database charset.
     *
     * @var string
     */
    protected $charset_collate;

    /**
     * The single instance of the class.
     *
     * @var Database
     */
    private static $instance = null;

    /**
     * Get the singleton instance.
     *
     * @return Database
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    private function __construct() {
        global $wpdb;
        
        $this->wpdb = $wpdb;
        $this->charset_collate = $wpdb->get_charset_collate();
        
        // Define tables
        $this->define_tables();
    }

    /**
     * Define database tables.
     */
    private function define_tables() {
        $tables = [
            'users'         => $this->wpdb->prefix . 'edgd_users',
            'user_meta'     => $this->wpdb->prefix . 'edgd_user_meta',
            'sessions'      => $this->wpdb->prefix . 'edgd_sessions',
            'api_keys'      => $this->wpdb->prefix . 'edgd_api_keys',
            'notifications' => $this->wpdb->prefix . 'edgd_notifications',
            'files'         => $this->wpdb->prefix . 'edgd_files',
            'file_meta'     => $this->wpdb->prefix . 'edgd_file_meta',
            'requests'      => $this->wpdb->prefix . 'edgd_requests',
            'request_meta'  => $this->wpdb->prefix . 'edgd_request_meta',
        ];

        $this->tables = apply_filters('edgd_database_tables', $tables);
    }

    /**
     * Get a table name.
     *
     * @param string $table Table name without prefix.
     * @return string Full table name with prefix.
     */
    public function get_table($table) {
        return $this->tables[$table] ?? '';
    }

    /**
     * Get the database schema for a table.
     *
     * @param string $table Table name.
     * @return string SQL schema.
     */
    public function get_schema($table) {
        $schemas = $this->get_schemas();
        return $schemas[$table] ?? '';
    }

    /**
     * Get all database schemas.
     *
     * @return array Array of table schemas.
     */
    public function get_schemas() {
        $tables = [];

        // Users table
        $tables['users'] = "CREATE TABLE {$this->tables['users']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            wp_user_id bigint(20) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY wp_user_id (wp_user_id)
        ) {$this->charset_collate};";

        // User meta table
        $tables['user_meta'] = "CREATE TABLE {$this->tables['user_meta']} (
            meta_id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            meta_key varchar(255) NOT NULL,
            meta_value longtext,
            PRIMARY KEY  (meta_id),
            KEY user_id (user_id),
            KEY meta_key (meta_key(191))
        ) {$this->charset_collate};";

        // Sessions table
        $tables['sessions'] = "CREATE TABLE {$this->tables['sessions']} (
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
        ) {$this->charset_collate};";

        // API keys table
        $tables['api_keys'] = "CREATE TABLE {$this->tables['api_keys']} (
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
        ) {$this->charset_collate};";

        // Notifications table
        $tables['notifications'] = "CREATE TABLE {$this->tables['notifications']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            type varchar(50) NOT NULL,
            title varchar(255) NOT NULL,
            message text NOT NULL,
            is_read tinyint(1) DEFAULT 0,
            created_at datetime NOT NULL,
            read_at datetime DEFAULT NULL,
            data longtext,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY is_read (is_read),
            KEY type (type)
        ) {$this->charset_collate};";

        // Files table
        $tables['files'] = "CREATE TABLE {$this->tables['files']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            name varchar(255) NOT NULL,
            path varchar(255) NOT NULL,
            url varchar(255) NOT NULL,
            mime_type varchar(100) NOT NULL,
            size bigint(20) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status (status)
        ) {$this->charset_collate};

        // File meta table
        $tables['file_meta'] = "CREATE TABLE {$this->tables['file_meta']} (
            meta_id bigint(20) NOT NULL AUTO_INCREMENT,
            file_id bigint(20) NOT NULL,
            meta_key varchar(255) NOT NULL,
            meta_value longtext,
            PRIMARY KEY  (meta_id),
            KEY file_id (file_id),
            KEY meta_key (meta_key(191))
        ) {$this->charset_collate};";

        // Requests table
        $tables['requests'] = "CREATE TABLE {$this->tables['requests']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            type varchar(50) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            title varchar(255) NOT NULL,
            content text,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            completed_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY type (type),
            KEY status (status)
        ) {$this->charset_collate};

        // Request meta table
        $tables['request_meta'] = "CREATE TABLE {$this->tables['request_meta']} (
            meta_id bigint(20) NOT NULL AUTO_INCREMENT,
            request_id bigint(20) NOT NULL,
            meta_key varchar(255) NOT NULL,
            meta_value longtext,
            PRIMARY KEY  (meta_id),
            KEY request_id (request_id),
            KEY meta_key (meta_key(191))
        ) {$this->charset_collate};";

        return apply_filters('edgd_database_schemas', $tables);
    }

    /**
     * Create all database tables.
     *
     * @return array Results of the database operations.
     */
    public function create_tables() {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        
        $results = [];
        $schemas = $this->get_schemas();
        
        foreach ($schemas as $table => $schema) {
            $results[$table] = dbDelta($schema);
        }
        
        return $results;
    }

    /**
     * Drop all database tables.
     * 
     * @return bool True on success, false on failure.
     */
    public function drop_tables() {
        global $wpdb;
        
        $tables = array_values($this->tables);
        
        if (empty($tables)) {
            return false;
        }
        
        // Disable foreign key checks
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop tables
        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$table}");
        }
        
        // Re-enable foreign key checks
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 1');
        
        return true;
    }

    /**
     * Check if a table exists.
     *
     * @param string $table Table name.
     * @return bool True if table exists, false otherwise.
     */
    public function table_exists($table) {
        return $this->wpdb->get_var("SHOW TABLES LIKE '{$table}'") === $table;
    }

    /**
     * Get the database version.
     *
     * @return string Database version.
     */
    public function get_db_version() {
        return get_option('edgd_db_version', '0');
    }

    /**
     * Update the database version.
     *
     * @param string $version New version number.
     * @return bool True on success, false on failure.
     */
    public function update_db_version($version) {
        return update_option('edgd_db_version', $version);
    }

    /**
     * Prevent cloning.
     */
    private function __clone() {}

    /**
     * Prevent unserializing.
     */
    public function __wakeup() {
        _doing_it_wrong(__FUNCTION__, __('Cheatin&#8217; huh?', 'edgd-core'), '1.0.0');
    }
}
