<?php
/**
 * Tools display template
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
            <h2><?php esc_html_e('EDGD Core Tools', 'edgd-core'); ?></h2>
            <p class="description"><?php esc_html_e('Various tools to help you manage the EDGD Core plugin.', 'edgd-core'); ?></p>
        </div>
    </div>

    <div class="edgd-admin-content">
        <div class="edgd-admin-row">
            <div class="edgd-admin-col">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('System Information', 'edgd-core'); ?></h3>
                    <p><?php esc_html_e('View system information for debugging purposes.', 'edgd-core'); ?></p>
                    <a href="#" id="edgd-show-system-info" class="button">
                        <?php esc_html_e('Show System Info', 'edgd-core'); ?>
                    </a>
                    <div id="edgd-system-info" class="edgd-system-info" style="display: none; margin-top: 15px;">
                        <textarea readonly="readonly" class="large-text code" style="width: 100%; min-height: 300px; font-family: monospace;"><?php echo esc_textarea($this->get_system_info()); ?></textarea>
                        <p class="submit">
                            <button type="button" class="button button-primary" id="edgd-copy-system-info">
                                <?php esc_html_e('Copy to Clipboard', 'edgd-core'); ?>
                            </button>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="edgd-admin-col">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('Clear Cache', 'edgd-core'); ?></h3>
                    <p><?php esc_html_e('Clear all cached data used by the plugin.', 'edgd-core'); ?></p>
                    <button type="button" id="edgd-clear-cache" class="button" data-nonce="<?php echo esc_attr(wp_create_nonce('edgd_clear_cache')); ?>">
                        <?php esc_html_e('Clear Cache', 'edgd-core'); ?>
                    </button>
                    <span id="edgd-clear-cache-message" style="margin-left: 10px; display: none;"></span>
                </div>
                
                <div class="edgd-admin-card" style="margin-top: 20px;">
                    <h3><?php esc_html_e('Reset Settings', 'edgd-core'); ?></h3>
                    <p><?php esc_html_e('Reset all plugin settings to their default values.', 'edgd-core'); ?></p>
                    <button type="button" id="edgd-reset-settings" class="button" data-nonce="<?php echo esc_attr(wp_create_nonce('edgd_reset_settings')); ?>">
                        <?php esc_html_e('Reset Settings', 'edgd-core'); ?>
                    </button>
                    <span id="edgd-reset-settings-message" style="margin-left: 10px; display: none;"></span>
                </div>
            </div>
        </div>
        
        <div class="edgd-admin-row" style="margin-top: 20px;">
            <div class="edgd-admin-col-full">
                <div class="edgd-admin-card">
                    <h3><?php esc_html_e('API Tools', 'edgd-core'); ?></h3>
                    <div class="edgd-tools-api">
                        <div class="edgd-tools-api-item">
                            <h4><?php esc_html_e('Generate API Keys', 'edgd-core'); ?></h4>
                            <p><?php esc_html_e('Generate new API keys for external applications.', 'edgd-core'); ?></p>
                            <button type="button" id="edgd-generate-api-keys" class="button" data-nonce="<?php echo esc_attr(wp_create_nonce('edgd_generate_api_keys')); ?>">
                                <?php esc_html_e('Generate API Keys', 'edgd-core'); ?>
                            </button>
                            <div id="edgd-api-keys-result" style="margin-top: 10px; display: none;">
                                <p><strong><?php esc_html_e('Consumer Key:', 'edgd-core'); ?></strong> <span id="edgd-consumer-key"></span></p>
                                <p><strong><?php esc_html_e('Consumer Secret:', 'edgd-core'); ?></strong> <span id="edgd-consumer-secret"></span></p>
                                <div class="notice notice-warning">
                                    <p><?php esc_html_e('Make sure to copy these keys now as they will not be shown again!', 'edgd-core'); ?></p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="edgd-tools-api-item" style="margin-top: 20px;">
                            <h4><?php esc_html_e('Test API Connection', 'edgd-core'); ?></h4>
                            <p><?php esc_html_e('Test the connection to the REST API.', 'edgd-core'); ?></p>
                            <button type="button" id="edgd-test-api" class="button" data-nonce="<?php echo esc_attr(wp_create_nonce('edgd_test_api')); ?>">
                                <?php esc_html_e('Test API', 'edgd-core'); ?>
                            </button>
                            <span id="edgd-test-api-message" style="margin-left: 10px; display: none;"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
/* Tools page styles */
.edgd-admin .edgd-admin-card {
    background: #fff;
    border: 1px solid #ccd0d4;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 3px;
}

.edgd-admin .edgd-admin-row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -10px;
}

.edgd-admin .edgd-admin-col {
    flex: 1;
    min-width: 300px;
    padding: 0 10px;
}

.edgd-admin .edgd-admin-col-full {
    flex: 100%;
    padding: 0 10px;
}

.edgd-admin .edgd-tools-api-item {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.edgd-admin .edgd-tools-api-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.edgd-admin .edgd-system-info {
    background: #f5f5f5;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

.edgd-admin .notice {
    margin: 10px 0 0 0;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Toggle system info
    $('#edgd-show-system-info').on('click', function(e) {
        e.preventDefault();
        $('#edgd-system-info').slideToggle();
    });
    
    // Copy system info to clipboard
    $('#edgd-copy-system-info').on('click', function() {
        var textarea = document.getElementById('edgd-system-info').querySelector('textarea');
        textarea.select();
        document.execCommand('copy');
        
        var $button = $(this);
        var originalText = $button.text();
        $button.text('Copied!');
        
        setTimeout(function() {
            $button.text(originalText);
        }, 2000);
    });
    
    // Clear cache
    $('#edgd-clear-cache').on('click', function() {
        var $button = $(this);
        var $message = $('#edgd-clear-cache-message');
        var nonce = $button.data('nonce');
        
        $button.prop('disabled', true);
        $message.html('Clearing cache...').show();
        
        $.post(ajaxurl, {
            action: 'edgd_clear_cache',
            nonce: nonce
        }, function(response) {
            if (response.success) {
                $message.html('Cache cleared successfully!').css('color', 'green');
            } else {
                $message.html('Error: ' + response.data).css('color', 'red');
            }
            $button.prop('disabled', false);
            
            setTimeout(function() {
                $message.fadeOut();
            }, 3000);
        });
    });
    
    // Reset settings
    $('#edgd-reset-settings').on('click', function() {
        if (!confirm('Are you sure you want to reset all settings to their default values? This cannot be undone.')) {
            return;
        }
        
        var $button = $(this);
        var $message = $('#edgd-reset-settings-message');
        var nonce = $button.data('nonce');
        
        $button.prop('disabled', true);
        $message.html('Resetting settings...').show();
        
        $.post(ajaxurl, {
            action: 'edgd_reset_settings',
            nonce: nonce
        }, function(response) {
            if (response.success) {
                $message.html('Settings reset successfully!').css('color', 'green');
                setTimeout(function() {
                    window.location.reload();
                }, 1000);
            } else {
                $message.html('Error: ' + response.data).css('color', 'red');
                $button.prop('disabled', false);
            }
        });
    });
    
    // Generate API keys
    $('#edgd-generate-api-keys').on('click', function() {
        var $button = $(this);
        var $result = $('#edgd-api-keys-result');
        var nonce = $button.data('nonce');
        
        $button.prop('disabled', true).text('Generating...');
        
        $.post(ajaxurl, {
            action: 'edgd_generate_api_keys',
            nonce: nonce
        }, function(response) {
            if (response.success) {
                $('#edgd-consumer-key').text(response.data.consumer_key);
                $('#edgd-consumer-secret').text(response.data.consumer_secret);
                $result.slideDown();
            } else {
                alert('Error: ' + response.data);
            }
            
            $button.prop('disabled', false).text('Generate API Keys');
        });
    });
    
    // Test API connection
    $('#edgd-test-api').on('click', function() {
        var $button = $(this);
        var $message = $('#edgd-test-api-message');
        var nonce = $button.data('nonce');
        
        $button.prop('disabled', true);
        $message.html('Testing API connection...').show();
        
        $.get(edgdCore.ajaxUrl, {
            action: 'edgd_test_api',
            nonce: nonce
        }, function(response) {
            if (response.success) {
                $message.html('API connection successful!').css('color', 'green');
            } else {
                $message.html('Error: ' + response.data).css('color', 'red');
            }
            $button.prop('disabled', false);
            
            setTimeout(function() {
                $message.fadeOut();
            }, 3000);
        });
    });
});
</script>
