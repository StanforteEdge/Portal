<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package    EDGD\Core\Admin
 * @since      1.0.0
 */

namespace EDGD\Core\Admin;

/**
 * The admin-specific functionality of the plugin.
 *
 * @package    EDGD\Core\Admin
 * @author     Stanforte Edge <info@stanforteedge.com>
 */
class Admin {
    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param    string $plugin_name The name of this plugin.
     * @param    string $version     The version of this plugin.
     */
    public function __construct($plugin_name, $version) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Enqueue admin assets.
     *
     * @since 1.0.0
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'edgd-core') === false) {
            return;
        }
        
        wp_enqueue_style(
            $this->plugin_name . '-admin',
            plugin_dir_url(__FILE__) . 'css/admin.css',
            [],
            $this->version,
            'all'
        );
        
        wp_enqueue_script(
            $this->plugin_name . '-admin',
            plugin_dir_url(__FILE__) . 'js/admin.js',
            ['jquery'],
            $this->version,
            false
        );
        
        wp_localize_script(
            $this->plugin_name . '-admin',
            'edgdCoreAdmin',
            [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce'   => wp_create_nonce('edgd_admin_nonce'),
            ]
        );
    }



    /**
     * Add admin menu items.
     *
     * @since 1.0.0
     */
    public function add_admin_menu() {
        // Main menu item
        add_menu_page(
            __('EDGD API', 'edgd-core'),
            __('EDGD API', 'edgd-core'),
            'manage_options',
            'edgd-core',
            [$this, 'display_settings_page'],
            'dashicons-rest-api',
            30
        );

        // Settings submenu
        add_submenu_page(
            'edgd-core',
            __('API Settings', 'edgd-core'),
            __('Settings', 'edgd-core'),
            'manage_options',
            'edgd-core',
            [$this, 'display_settings_page']
        );

        // API Keys submenu
        add_submenu_page(
            'edgd-core',
            __('API Keys', 'edgd-core'),
            __('API Keys', 'edgd-core'),
            'manage_options',
            'edgd-core-keys',
            [$this, 'display_api_keys_page']
        );
        
        // Documentation submenu
        add_submenu_page(
            'edgd-core',
            __('API Documentation', 'edgd-core'),
            __('Documentation', 'edgd-core'),
            'manage_options',
            'edgd-core-docs',
            [$this, 'display_documentation_page']
        );
    }

    /**
     * Display the API settings page.
     *
     * @since 1.0.0
     */
    public function display_settings_page() {
        include plugin_dir_path(__FILE__) . 'partials/settings-page.php';
    }
    
    /**
     * Display the API keys management page.
     *
     * @since 1.0.0
     */
    public function display_api_keys_page() {
        include plugin_dir_path(__FILE__) . 'partials/keys-page.php';
    }
    
    /**
     * Display the API documentation page.
     *
     * @since 1.0.0
     */
    public function display_documentation_page() {
        include plugin_dir_path(__FILE__) . 'partials/documentation-page.php';
    }



    /**
     * Register plugin settings.
     *
     * @since 1.0.0
     */
    public function register_settings() {
        // API Settings section
        register_setting('edgd_api_settings', 'edgd_api_enabled');
        register_setting('edgd_api_settings', 'edgd_api_namespace', 'sanitize_title_with_dashes');
        register_setting('edgd_api_settings', 'edgd_api_version', 'sanitize_title_with_dashes');
        
        // Authentication settings
        register_setting('edgd_auth_settings', 'edgd_jwt_secret_key');
        register_setting('edgd_auth_settings', 'edgd_jwt_expire', 'absint');
        register_setting('edgd_auth_settings', 'edgd_jwt_refresh_expire', 'absint');
        
        // API Settings section
        add_settings_section(
            'edgd_api_settings_section',
            __('API Configuration', 'edgd-core'),
            [$this, 'api_settings_section_callback'],
            'edgd-core-settings'
        );
        
        add_settings_field(
            'edgd_api_enabled',
            __('Enable API', 'edgd-core'),
            [$this, 'checkbox_field_callback'],
            'edgd-core-settings',
            'edgd_api_settings_section',
            [
                'label_for' => 'edgd_api_enabled',
                'description' => __('Enable the REST API endpoints', 'edgd-core')
            ]
        );
        
        add_settings_field(
            'edgd_api_namespace',
            __('API Namespace', 'edgd-core'),
            [$this, 'text_field_callback'],
            'edgd-core-settings',
            'edgd_api_settings_section',
            [
                'label_for' => 'edgd_api_namespace',
                'description' => __('The base namespace for all API endpoints', 'edgd-core'),
                'default' => 'edgd',
                'placeholder' => 'edgd'
            ]
        );
        
        add_settings_field(
            'edgd_api_version',
            __('API Version', 'edgd-core'),
            [$this, 'text_field_callback'],
            'edgd-core-settings',
            'edgd_api_settings_section',
            [
                'label_for' => 'edgd_api_version',
                'description' => __('The API version (e.g., v1)', 'edgd-core'),
                'default' => 'v1',
                'placeholder' => 'v1'
            ]
        );
        
        // Authentication Settings section
        add_settings_section(
            'edgd_auth_settings_section',
            __('Authentication Settings', 'edgd-core'),
            [$this, 'auth_settings_section_callback'],
            'edgd-core-settings'
        );
        
        add_settings_field(
            'edgd_jwt_secret_key',
            __('JWT Secret Key', 'edgd-core'),
            [$this, 'jwt_secret_key_field_callback'],
            'edgd-core-settings',
            'edgd_auth_settings_section'
        );
        
        add_settings_field(
            'edgd_jwt_expire',
            __('Access Token Expiration (seconds)', 'edgd-core'),
            [$this, 'number_field_callback'],
            'edgd-core-settings',
            'edgd_auth_settings_section',
            [
                'label_for' => 'edgd_jwt_expire',
                'description' => __('How long access tokens are valid (default: 3600 - 1 hour)', 'edgd-core'),
                'default' => 3600,
                'min' => 60,
                'step' => 60
            ]
        );
        
        add_settings_field(
            'edgd_jwt_refresh_expire',
            __('Refresh Token Expiration (seconds)', 'edgd-core'),
            [$this, 'number_field_callback'],
            'edgd-core-settings',
            'edgd_auth_settings_section',
            [
                'label_for' => 'edgd_jwt_refresh_expire',
                'description' => __('How long refresh tokens are valid (default: 1209600 - 14 days)', 'edgd-core'),
                'default' => 1209600,
                'min' => 3600,
                'step' => 3600
            ]
        );
    }

    /**
     * API Settings section callback.
     *
     * @since 1.0.0
     */
    public function api_settings_section_callback() {
        echo '<p>' . esc_html__('Configure the REST API settings.', 'edgd-core') . '</p>';
    }
    
    /**
     * Authentication Settings section callback.
     *
     * @since 1.0.0
     */
    public function auth_settings_section_callback() {
        echo '<p>' . esc_html__('Configure authentication settings for the API.', 'edgd-core') . '</p>';
    }

    /**
     * JWT Secret Key field callback.
     *
     * @since 1.0.0
     */
    public function jwt_secret_key_field_callback() {
        $jwt_secret_key = get_option('edgd_jwt_secret_key', '');
        echo '<div class="edgd-field-group">';
        echo '<input type="password" id="edgd_jwt_secret_key" name="edgd_jwt_secret_key" value="' . esc_attr($jwt_secret_key) . '" class="regular-text" autocomplete="off" />';
        echo '<button type="button" id="toggle-jwt-secret" class="button button-secondary">' . esc_html__('Show', 'edgd-core') . '</button>';
        echo '<button type="button" id="generate-jwt-secret" class="button button-secondary">' . esc_html__('Generate', 'edgd-core') . '</button>';
        echo '</div>';
        echo '<p class="description">' . esc_html__('The secret key used for JWT token generation. Keep this secure!', 'edgd-core') . '</p>';
        
        // Add nonce for AJAX
        wp_nonce_field('edgd_generate_jwt_secret', 'edgd_jwt_secret_nonce');
    }

    /**
     * Text field callback.
     *
     * @since 1.0.0
     * 
     * @param array $args Field arguments.
     */
    public function text_field_callback($args) {
        $value = get_option($args['label_for'], $args['default'] ?? '');
        $placeholder = $args['placeholder'] ?? '';
        
        echo sprintf(
            '<input type="text" id="%1$s" name="%1$s" value="%2$s" class="regular-text" placeholder="%3$s" />',
            esc_attr($args['label_for']),
            esc_attr($value),
            esc_attr($placeholder)
        );
        
        if (!empty($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * Number field callback.
     *
     * @since 1.0.0
     * 
     * @param array $args Field arguments.
     */
    public function number_field_callback($args) {
        $value = get_option($args['label_for'], $args['default'] ?? 0);
        
        echo sprintf(
            '<input type="number" id="%1$s" name="%1$s" value="%2$s" class="small-text" min="%3$d" step="%4$d" />',
            esc_attr($args['label_for']),
            esc_attr($value),
            esc_attr($args['min'] ?? 0),
            esc_attr($args['step'] ?? 1)
        );
        
        if (!empty($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * Checkbox field callback.
     *
     * @since 1.0.0
     * 
     * @param array $args Field arguments.
     */
    public function checkbox_field_callback($args) {
        $value = get_option($args['label_for'], 'no');
        
        echo sprintf(
            '<label><input type="checkbox" id="%1$s" name="%1$s" value="yes" %2$s /> %3$s</label>',
            esc_attr($args['label_for']),
            checked('yes', $value, false),
            esc_html__('Enable', 'edgd-core')
        );
        
        if (!empty($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }

    /**
     * AJAX handler for generating a JWT secret key.
     *
     * @since 1.0.0
     */
    public function ajax_generate_jwt_secret() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'edgd_generate_jwt_secret')) {
            wp_send_json_error(['message' => __('Security check failed.', 'edgd-core')], 403);
        }

        // Check user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'edgd-core')], 403);
        }

        // Generate a new secret key
        $secret_key = bin2hex(random_bytes(32));
        
        // Update the option
        update_option('edgd_jwt_secret_key', $secret_key);

        // Return the new key
        wp_send_json_success([
            'secret_key' => $secret_key,
            'message' => __('JWT secret key generated successfully.', 'edgd-core')
        ]);
    }

    /**
     * Add action links to the plugins page.
     *
     * @since 1.0.0
     * @param array $links Plugin action links.
     * @return array Modified plugin action links.
     */
    public function add_action_links($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=edgd-core') . '">' . __('Settings', 'edgd-core') . '</a>';
        $docs_link = '<a href="' . admin_url('admin.php?page=edgd-core-docs') . '">' . __('Documentation', 'edgd-core') . '</a>';
        
        array_unshift($links, $docs_link);
        array_unshift($links, $settings_link);
        
        return $links;
    }

    /**
     * Add plugin documentation link to the plugin meta.
     *
     * @since 1.0.0
     * @param array  $plugin_meta Array of plugin metadata.
     * @param string $plugin_file Path to the plugin file.
     * @param array  $plugin_data Array of plugin data.
     * @param string $status Status of the plugin.
     * @return array Modified plugin metadata.
     */
    public function add_plugin_meta_links($plugin_meta, $plugin_file, $plugin_data, $status) {
        if (plugin_basename(EDGD_CORE_PLUGIN_FILE) === $plugin_file) {
            $plugin_meta[] = '<a href="https://docs.stanforteedge.com/edgd-core/" target="_blank" rel="noopener noreferrer">' . __('Documentation', 'edgd-core') . '</a>';
            $plugin_meta[] = '<a href="https://stanforteedge.com/support/" target="_blank" rel="noopener noreferrer">' . __('Support', 'edgd-core') . '</a>';
        }
        return $plugin_meta;
    }
}
