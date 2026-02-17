<?php
/**
 * Plugin Name: EDGD Core
 * Plugin URI: https://stanforteedge.com/plugins/edgd-core
 * Description: Core functionality for EDGD applications including authentication, user management, and API endpoints.
 * Version: 1.0.0
 * Author: Stanforte Edge
 * Author URI: https://stanforteedge.com
 * Text Domain: edgd-core
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 *
 * @package EDGD\Core
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Define plugin constants
define('EDGD_CORE_VERSION', '1.0.0');
define('EDGD_CORE_PLUGIN_FILE', __FILE__);
define('EDGD_CORE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('EDGD_CORE_PLUGIN_URL', plugin_dir_url(__FILE__));

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'EDGD\\Core\\';
    $base_dir = __DIR__ . '/includes/';

    // Does the class use the namespace prefix?
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get the relative class name
    $relative_class = substr($class, $len);

    // Replace the namespace prefix with the base directory
    // Replace namespace separators with directory separators
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});

// Initialize the plugin
function edgd_core_init() {
    // Load the main plugin class
    $plugin = new EDGD\Core\Plugin();
    $plugin->run();
}
add_action('plugins_loaded', 'edgd_core_init');

// Activation and deactivation hooks
register_activation_hook(__FILE__, ['EDGD\Core\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['EDGD\Core\Deactivator', 'deactivate']);
