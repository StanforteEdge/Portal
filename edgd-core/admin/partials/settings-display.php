<?php
/**
 * Settings display template
 *
 * @package    EDGD\Core\Admin
 * @since      1.0.0
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Get the active tab
$active_tab = isset($_GET['tab']) ? sanitize_text_field(wp_unslash($_GET['tab'])) : 'general';

// Define tabs
$tabs = [
    'general'    => __('General', 'edgd-core'),
    'api'        => __('API', 'edgd-core'),
    'security'   => __('Security', 'edgd-core'),
    'appearance' => __('Appearance', 'edgd-core'),
];

// Filter tabs
$tabs = apply_filters('edgd_settings_tabs', $tabs);
?>

<div class="wrap edgd-admin">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="edgd-admin-header">
        <div class="edgd-admin-header-content">
            <h2><?php esc_html_e('EDGD Core Settings', 'edgd-core'); ?></h2>
            <p class="description"><?php esc_html_e('Configure the plugin settings to match your requirements.', 'edgd-core'); ?></p>
        </div>
    </div>

    <div class="edgd-admin-content">
        <nav class="nav-tab-wrapper edgd-nav-tab-wrapper">
            <?php foreach ($tabs as $tab_id => $tab_name) : ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=edgd-core-settings&tab=' . $tab_id)); ?>" 
                   class="nav-tab <?php echo $active_tab === $tab_id ? 'nav-tab-active' : ''; ?>">
                    <?php echo esc_html($tab_name); ?>
                </a>
            <?php endforeach; ?>
        </nav>

        <div class="edgd-settings-form">
            <form method="post" action="options.php">
                <?php
                // Output security fields for the current tab
                settings_fields('edgd_' . $active_tab . '_settings');
                
                // Output settings sections for the current tab
                do_settings_sections('edgd-core-settings-' . $active_tab);
                
                // Output save button
                submit_button();
                ?>
            </form>
        </div>
    </div>
</div>

<style>
/* Settings page styles */
.edgd-admin .form-table th {
    width: 250px;
}

.edgd-admin .form-table input[type="text"],
.edgd-admin .form-table input[type="password"],
.edgd-admin .form-table input[type="number"],
.edgd-admin .form-table input[type="email"],
.edgd-admin .form-table input[type="url"],
.edgd-admin .form-table select,
.edgd-admin .form-table textarea {
    width: 100%;
    max-width: 400px;
}

.edgd-admin .form-table textarea {
    min-height: 100px;
}

.edgd-admin .description {
    display: block;
    margin-top: 5px;
    color: #666;
    font-style: italic;
}

.edgd-admin .edgd-settings-form {
    background: #fff;
    padding: 20px;
    border: 1px solid #ccd0d4;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
    margin-top: 20px;
}

.edgd-admin .edgd-nav-tab-wrapper {
    margin-bottom: 0;
    border-bottom: 1px solid #ccd0d4;
}

.edgd-admin .edgd-nav-tab-wrapper .nav-tab {
    margin-bottom: -1px;
    border-bottom: 1px solid #ccd0d4;
}

.edgd-admin .edgd-nav-tab-wrapper .nav-tab-active {
    background: #fff;
    border-bottom: 1px solid #fff;
}

.edgd-admin .submit {
    margin-top: 20px;
    padding: 0;
    border: none;
}
</style>
