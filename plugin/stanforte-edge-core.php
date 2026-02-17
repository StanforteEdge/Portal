<?php
/**
 * Plugin Name: Stanfort Edge Core
 * Description: Core functionality for Stanfort Edge portal
 * Version: 1.0.0
 * Author: Stanfort Edge
 */

// Prevent direct access
defined('ABSPATH') || exit;

// Define plugin constants
define('SE_DIR', plugin_dir_path(__FILE__));
define('SE_URL', plugin_dir_url(__FILE__));

// Initialize the application
require_once SE_DIR . 'autoload.php';
require_once SE_DIR . 'Init.php';

// Initialize the application when WordPress loads
add_action('plugins_loaded', function() {
    // Initialize the core application
    \App\Init::initialize();
    
    // Register activation/deactivation hooks
    register_activation_hook(__FILE__, ['\App\Init', 'activate']);
register_deactivation_hook(__FILE__, ['\App\Init', 'deactivate']);
});

// Load text domain for translations
add_action('init', function() {
    load_plugin_textdomain('stanforte-edge', false, dirname(plugin_basename(__FILE__)) . '/languages');
});

// Register REST API endpoints
add_action('rest_api_init', function() {
    // This will load all routes defined in the Routes directory
    require_once SE_DIR . 'Routes/rest-api.php';
}, 10); // Priority 10 to ensure autoloader has fully loaded
