<?php
/**
 * Admin display template
 *
 * @package    EDGD\Core\Admin
 * @since      1.0.0
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}
?>
<div class="wrap edgd-admin">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="edgd-admin-header">
        <div class="edgd-admin-header-content">
            <h2><?php esc_html_e('EDGD Core Dashboard', 'edgd-core'); ?></h2>
            <p class="description"><?php esc_html_e('Manage your EDGD Core settings and features.', 'edgd-core'); ?></p>
        </div>
    </div>

    <div class="edgd-admin-content">
        <div class="edgd-admin-row">
            <div class="edgd-admin-col">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('Quick Links', 'edgd-core'); ?></h3>
                    <ul class="edgd-admin-links">
                        <li>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=edgd-core-settings')); ?>">
                                <span class="dashicons dashicons-admin-settings"></span>
                                <?php esc_html_e('Settings', 'edgd-core'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=edgd-core-tools')); ?>">
                                <span class="dashicons dashicons-admin-tools"></span>
                                <?php esc_html_e('Tools', 'edgd-core'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url('https://docs.stanforteedge.com/edgd-core/'); ?>" target="_blank" rel="noopener noreferrer">
                                <span class="dashicons dashicons-book"></span>
                                <?php esc_html_e('Documentation', 'edgd-core'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url('https://stanforteedge.com/support/'); ?>" target="_blank" rel="noopener noreferrer">
                                <span class="dashicons dashicons-sos"></span>
                                <?php esc_html_e('Support', 'edgd-core'); ?>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="edgd-admin-col">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('System Status', 'edgd-core'); ?></h3>
                    <table class="edgd-status-table">
                        <tbody>
                            <tr>
                                <th><?php esc_html_e('Plugin Version', 'edgd-core'); ?>:</th>
                                <td><?php echo esc_html(EDGD_CORE_VERSION); ?></td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('WordPress Version', 'edgd-core'); ?>:</th>
                                <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('PHP Version', 'edgd-core'); ?>:</th>
                                <td><?php echo esc_html(phpversion()); ?></td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('Database Version', 'edgd-core'); ?>:</th>
                                <td><?php echo esc_html(get_option('edgd_db_version', '1.0.0')); ?></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="edgd-admin-row">
            <div class="edgd-admin-col-full">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('Getting Started', 'edgd-core'); ?></h3>
                    <div class="edgd-getting-started">
                        <div class="edgd-getting-started-item">
                            <h4><span class="dashicons dashicons-admin-settings"></span> <?php esc_html_e('Configure Settings', 'edgd-core'); ?></h4>
                            <p><?php esc_html_e('Configure the plugin settings to match your requirements.', 'edgd-core'); ?></p>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=edgd-core-settings')); ?>" class="button button-primary">
                                <?php esc_html_e('Go to Settings', 'edgd-core'); ?>
                            </a>
                        </div>
                        <div class="edgd-getting-started-item">
                            <h4><span class="dashicons dashicons-rest-api"></span> <?php esc_html_e('API Documentation', 'edgd-core'); ?></h4>
                            <p><?php esc_html_e('Learn how to use the REST API endpoints in your applications.', 'edgd-core'); ?></p>
                            <a href="<?php echo esc_url('https://docs.stanforteedge.com/edgd-core/api/'); ?>" target="_blank" rel="noopener noreferrer" class="button">
                                <?php esc_html_e('View API Docs', 'edgd-core'); ?>
                            </a>
                        </div>
                        <div class="edgd-getting-started-item">
                            <h4><span class="dashicons dashicons-editor-help"></span> <?php esc_html_e('Need Help?', 'edgd-core'); ?></h4>
                            <p><?php esc_html_e('Check out our documentation or contact support.', 'edgd-core'); ?></p>
                            <a href="<?php echo esc_url('https://stanforteedge.com/support/'); ?>" target="_blank" rel="noopener noreferrer" class="button">
                                <?php esc_html_e('Get Support', 'edgd-core'); ?>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
