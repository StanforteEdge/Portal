<?php
/* Template Name: Admin: Settings */

$pageTitle = 'System Settings';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Settings']
];
$activeMenu = 'admin-settings';

wp_enqueue_script(
    'stanforte-admin-settings',
    get_template_directory_uri() . '/assets/js/pages/admin/settings.js',
    ['jquery', 'stanforte-data-client'],
    filemtime(get_template_directory() . '/assets/js/pages/admin/settings.js'),
    true
);

get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5" id="settings-root">
    <aside class="col-span-12 lg:col-span-3">
        <div class="intro-y box p-5 sticky top-24">
            <h2 class="text-base font-medium mb-4"><?php esc_html_e('Settings Categories', 'stanforte'); ?></h2>
            <nav class="space-y-2" id="settings-nav">
                <button type="button" class="settings-nav-link active" data-settings-target="general">
                    <i data-lucide="home" class="w-4 h-4 mr-2"></i>
                    <span><?php esc_html_e('General', 'stanforte'); ?></span>
                </button>
                <button type="button" class="settings-nav-link" data-settings-target="security">
                    <i data-lucide="shield" class="w-4 h-4 mr-2"></i>
                    <span><?php esc_html_e('Security', 'stanforte'); ?></span>
                </button>
                <button type="button" class="settings-nav-link" data-settings-target="integrations">
                    <i data-lucide="plug" class="w-4 h-4 mr-2"></i>
                    <span><?php esc_html_e('Integrations', 'stanforte'); ?></span>
                </button>
                <button type="button" class="settings-nav-link" data-settings-target="notifications">
                    <i data-lucide="bell" class="w-4 h-4 mr-2"></i>
                    <span><?php esc_html_e('Notifications', 'stanforte'); ?></span>
                </button>
                <button type="button" class="settings-nav-link" data-settings-target="compliance">
                    <i data-lucide="file-lock" class="w-4 h-4 mr-2"></i>
                    <span><?php esc_html_e('Compliance', 'stanforte'); ?></span>
                </button>
            </nav>
            <div class="mt-6 pt-6 border-t border-slate-200">
                <button type="button" class="btn btn-outline-secondary w-full" id="reset-settings-btn">
                    <i data-lucide="rotate-ccw" class="w-4 h-4 mr-2"></i>
                    <?php esc_html_e('Reset to Defaults', 'stanforte'); ?>
                </button>
                <p class="text-xs text-slate-500 mt-3">
                    <?php esc_html_e('All changes are logged for auditing. Critical updates require confirmation.', 'stanforte'); ?>
                </p>
            </div>
        </div>
    </aside>

    <section class="col-span-12 lg:col-span-9">
        <div class="intro-y box p-5" id="settings-content">
            <div class="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 class="text-lg font-medium" id="settings-section-title"><?php esc_html_e('General Settings', 'stanforte'); ?></h2>
                    <p class="text-slate-500 text-sm" id="settings-section-description">
                        <?php esc_html_e('Configure company profile, regional preferences, and core operating hours.', 'stanforte'); ?>
                    </p>
                </div>
                <div class="flex items-center gap-2" id="settings-actions">
                    <button type="button" class="btn btn-outline-secondary" id="discard-settings" disabled>
                        <i data-lucide="undo" class="w-4 h-4 mr-2"></i>
                        <?php esc_html_e('Discard Changes', 'stanforte'); ?>
                    </button>
                    <button type="button" class="btn btn-primary" id="save-settings" disabled>
                        <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                        <?php esc_html_e('Save Changes', 'stanforte'); ?>
                    </button>
                </div>
            </div>

            <div id="settings-alert" class="alert alert-pending soft-hidden mt-5" role="alert">
                <div class="flex items-center">
                    <i data-lucide="alert-circle" class="w-5 h-5 mr-2"></i>
                    <div>
                        <strong><?php esc_html_e('Unsaved changes detected.', 'stanforte'); ?></strong>
                        <span class="text-sm block"><?php esc_html_e('Please save or discard updates before leaving this section.', 'stanforte'); ?></span>
                    </div>
                </div>
            </div>

            <div id="settings-panels" class="mt-8 space-y-10">
                <form id="settings-form-general" class="settings-panel" data-settings-panel="general">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="company_name"><?php esc_html_e('Company Name', 'stanforte'); ?></label>
                            <input type="text" class="form-control" id="company_name" name="company_name" required>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="company_timezone"><?php esc_html_e('Timezone', 'stanforte'); ?></label>
                            <select class="form-select" id="company_timezone" name="company_timezone"></select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="working_hours_start"><?php esc_html_e('Working Hours Start', 'stanforte'); ?></label>
                            <input type="time" class="form-control" id="working_hours_start" name="working_hours_start">
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="working_hours_end"><?php esc_html_e('Working Hours End', 'stanforte'); ?></label>
                            <input type="time" class="form-control" id="working_hours_end" name="working_hours_end">
                        </div>
                        <div class="col-span-12">
                            <label class="form-label" for="company_logo"><?php esc_html_e('Brand Logo', 'stanforte'); ?></label>
                            <div class="flex items-center gap-4">
                                <div class="w-24 h-24 rounded border border-dashed border-slate-300 flex items-center justify-center bg-slate-50" id="company_logo_preview">
                                    <i data-lucide="image" class="w-6 h-6 text-slate-400"></i>
                                </div>
                                <div>
                                    <input type="file" id="company_logo" name="company_logo" accept="image/*" class="hidden">
                                    <button type="button" class="btn btn-outline-primary" id="upload-company-logo">
                                        <i data-lucide="upload" class="w-4 h-4 mr-2"></i>
                                        <?php esc_html_e('Upload Logo', 'stanforte'); ?>
                                    </button>
                                    <p class="text-xs text-slate-500 mt-1"><?php esc_html_e('PNG, JPG up to 2MB.', 'stanforte'); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <form id="settings-form-security" class="settings-panel hidden" data-settings-panel="security">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="password_policy"><?php esc_html_e('Password Policy', 'stanforte'); ?></label>
                            <select class="form-select" id="password_policy" name="password_policy">
                                <option value="standard"><?php esc_html_e('Standard (min 8 chars)', 'stanforte'); ?></option>
                                <option value="strict"><?php esc_html_e('Strict (min 12 chars + symbols)', 'stanforte'); ?></option>
                            </select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="session_timeout"><?php esc_html_e('Session Timeout (minutes)', 'stanforte'); ?></label>
                            <input type="number" class="form-control" id="session_timeout" name="session_timeout" min="5" step="5">
                        </div>
                        <div class="col-span-12">
                            <label class="form-label"><?php esc_html_e('IP Restrictions', 'stanforte'); ?></label>
                            <textarea class="form-control" id="ip_whitelist" name="ip_whitelist" rows="3" placeholder="192.168.0.1, 10.0.0.0/24"></textarea>
                            <p class="text-xs text-slate-500 mt-1"><?php esc_html_e('Comma-separated list of IPs or CIDR ranges.', 'stanforte'); ?></p>
                        </div>
                        <div class="col-span-12">
                            <div class="form-check form-switch">
                                <input type="checkbox" class="form-check-input" id="enforce_2fa" name="enforce_2fa">
                                <label class="form-check-label" for="enforce_2fa"><?php esc_html_e('Enforce two-factor authentication for all admins', 'stanforte'); ?></label>
                            </div>
                        </div>
                    </div>
                </form>

                <form id="settings-form-integrations" class="settings-panel hidden" data-settings-panel="integrations">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="api_key"><?php esc_html_e('Primary API Key', 'stanforte'); ?></label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="api_key" name="api_key" readonly>
                                <button type="button" class="input-group-text" id="reveal-api-key">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="webhook_url"><?php esc_html_e('Webhook Endpoint', 'stanforte'); ?></label>
                            <input type="url" class="form-control" id="webhook_url" name="webhook_url">
                        </div>
                        <div class="col-span-12">
                            <label class="form-label" for="integration_notes"><?php esc_html_e('Integration Notes', 'stanforte'); ?></label>
                            <textarea class="form-control" id="integration_notes" name="integration_notes" rows="4"></textarea>
                        </div>
                    </div>
                </form>

                <form id="settings-form-notifications" class="settings-panel hidden" data-settings-panel="notifications">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="default_channel"><?php esc_html_e('Default Delivery Channel', 'stanforte'); ?></label>
                            <select class="form-select" id="default_channel" name="default_channel">
                                <option value="email"><?php esc_html_e('Email', 'stanforte'); ?></option>
                                <option value="sms"><?php esc_html_e('SMS', 'stanforte'); ?></option>
                                <option value="in_app"><?php esc_html_e('In-App', 'stanforte'); ?></option>
                            </select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="alert_threshold"><?php esc_html_e('Alert Threshold (minutes)', 'stanforte'); ?></label>
                            <input type="number" class="form-control" id="alert_threshold" name="alert_threshold" min="1" step="1">
                        </div>
                        <div class="col-span-12">
                            <div class="form-check form-switch">
                                <input type="checkbox" class="form-check-input" id="digest_enabled" name="digest_enabled">
                                <label class="form-check-label" for="digest_enabled"><?php esc_html_e('Send weekly digest emails to administrators', 'stanforte'); ?></label>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <label class="form-label" for="notification_templates"><?php esc_html_e('Template Overrides', 'stanforte'); ?></label>
                            <textarea class="form-control" id="notification_templates" name="notification_templates" rows="4" placeholder="{"event":"template_slug"}"></textarea>
                        </div>
                    </div>
                </form>

                <form id="settings-form-compliance" class="settings-panel hidden" data-settings-panel="compliance">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="data_retention"><?php esc_html_e('Data Retention (days)', 'stanforte'); ?></label>
                            <input type="number" class="form-control" id="data_retention" name="data_retention" min="30" step="30">
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="form-label" for="audit_trail"><?php esc_html_e('Audit Trail Storage', 'stanforte'); ?></label>
                            <select class="form-select" id="audit_trail" name="audit_trail">
                                <option value="standard"><?php esc_html_e('Standard (90 days)', 'stanforte'); ?></option>
                                <option value="extended"><?php esc_html_e('Extended (365 days)', 'stanforte'); ?></option>
                            </select>
                        </div>
                        <div class="col-span-12">
                            <div class="form-check form-switch">
                                <input type="checkbox" class="form-check-input" id="gdpr_mode" name="gdpr_mode">
                                <label class="form-check-label" for="gdpr_mode"><?php esc_html_e('Enable GDPR compliance prompts', 'stanforte'); ?></label>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <label class="form-label" for="compliance_notes"><?php esc_html_e('Compliance Notes', 'stanforte'); ?></label>
                            <textarea class="form-control" id="compliance_notes" name="compliance_notes" rows="4"></textarea>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="intro-y box p-5 mt-6" id="settings-audit-log">
            <div class="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 class="text-lg font-medium"><?php esc_html_e('Recent Configuration Changes', 'stanforte'); ?></h3>
                    <p class="text-slate-500 text-sm"><?php esc_html_e('All updates are recorded for auditing and regulatory review.', 'stanforte'); ?></p>
                </div>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="export-settings-audit">
                    <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                    <?php esc_html_e('Export Audit Trail', 'stanforte'); ?>
                </button>
            </div>
            <div class="mt-5" id="settings-audit-table">
                <div class="flex items-center justify-center py-10 text-slate-500" data-settings-audit-empty>
                    <?php esc_html_e('Audit history will load after fetching settings.', 'stanforte'); ?>
                </div>
            </div>
        </div>
    </section>
</div>

<?php
get_template_part('templates/partials/detail-modal', null, [
    'id' => 'settings-reset-modal',
    'title' => __('Reset Settings', 'stanforte'),
    'body' => '<div class="space-y-4 text-left"><p class="text-slate-600">' . esc_html__('This will restore default system settings. Recent changes may be lost.', 'stanforte') . '</p><div class="bg-slate-50 p-4 rounded-md"><ul class="list-disc pl-5 text-sm space-y-2"><li>' . esc_html__('General settings revert to company defaults.', 'stanforte') . '</li><li>' . esc_html__('Security policies revert to recommended baselines.', 'stanforte') . '</li><li>' . esc_html__('Integrations disconnect until re-authorized.', 'stanforte') . '</li></ul></div></div>',
    'footer' => '<div class="flex items-center gap-3 ml-auto"><button type="button" class="btn btn-outline-secondary" data-modal-dismiss>' . esc_html__('Cancel', 'stanforte') . '</button><button type="button" class="btn btn-danger" id="settings-reset-confirm">' . esc_html__('Confirm Reset', 'stanforte') . '</button></div>'
]);
?>

<?php get_footer(); ?>
