<?php
namespace App;

use App\Database\DatabaseInitializer;

class Init {
    private static $instance = null;
    private static $modules = [];
    private $pdo;

    private function __construct() {
        // Private constructor to prevent direct instantiation
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function register_module($module) {
        self::$modules[] = $module;
    }

    public static function initialize() {
        $instance = self::getInstance();
        
        // Load autoloader
        require_once SE_DIR . 'autoload.php';
        
        // Initialize database connection
        $instance->initDatabase();
        
        // Load security guards and role manager
        require_once SE_DIR . 'Core/Auth/Security/LoginGuards.php';
        require_once SE_DIR . 'Core/Auth/Utils/RoleManager.php';
        
        // Initialize REST API authentication handler
        require_once SE_DIR . 'Routes/rest-api.php';

        // Initialize all registered modules
        foreach (self::$modules as $module) {
            if (method_exists($module, 'initialize')) {
                $module->initialize();
            }
        }
    }
    
    private function initDatabase() {
        try {
            // Initialize database with versioning support
            DatabaseInitializer::initialize();
            
        } catch (\Exception $e) {
            error_log('Database initialization failed: ' . $e->getMessage());
            if (defined('WP_DEBUG') && WP_DEBUG) {
                wp_die('Database initialization failed: ' . $e->getMessage());
            } else {
                wp_die('An error occurred while initializing the database.');
            }
        }
    }
    

    
    public static function activate() {
        // Run migrations on plugin activation
        $instance = self::getInstance();
        $instance->initDatabase();
    }
    
    public static function deactivate() {
        // Cleanup on deactivation if needed
    }
}

