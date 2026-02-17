<?php
/**
 * REST API Class
 *
 * @package    EDGD\Core\API
 * @since      1.0.0
 */

namespace EDGD\Core\API;

use EDGD\Core\Plugin;

/**
 * Main API class.
 *
 * @package EDGD\Core\API
 */
class API {
    /**
     * The plugin instance.
     *
     * @var Plugin
     */
    private $plugin;

    /**
     * The namespace for the API.
     *
     * @var string
     */
    private $namespace;

    /**
     * The API version.
     *
     * @var string
     */
    private $version;

    /**
     * Constructor.
     *
     * @param Plugin $plugin The plugin instance.
     */
    public function __construct($plugin) {
        $this->plugin = $plugin;
        $this->version = 'v1';
        $this->namespace = 'edgd/' . $this->version;
    }

    /**
     * Initialize the API.
     */
    public function init() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register the routes for the objects of the controller.
     */
    public function register_routes() {
        // Include all controllers
        $controllers = $this->get_controllers();
        
        // Initialize each controller
        foreach ($controllers as $controller) {
            $controller_instance = new $controller();
            $controller_instance->register_routes();
        }
    }

    /**
     * Get all API controllers.
     *
     * @return array List of controller class names.
     */
    protected function get_controllers() {
        return [
            'EDGD\Core\API\V1\Controllers\Auth_Controller',
            // Add more controllers here as they are created
        ];
    }

    /**
     * Get the API namespace.
     *
     * @return string The API namespace.
     */
    public function get_namespace() {
        return $this->namespace;
    }

    /**
     * Get the API version.
     *
     * @return string The API version.
     */
    public function get_version() {
        return $this->version;
    }
}
