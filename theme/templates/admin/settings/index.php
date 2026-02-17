<?php /* Template Name: Staff: Admin - System Settings */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'System Settings';

include get_template_directory() . "/layout/menu.php";

// Get current system settings
$settings = array(
    'site_name' => get_option('staff_site_name', ''),
    'site_description' => get_option('staff_site_description', ''),
    'organization_name' => get_option('staff_organization_name', ''),
    'organization_address' => get_option('staff_organization_address', ''),
    'contact_email' => get_option('staff_contact_email', ''),
    'contact_phone' => get_option('staff_contact_phone', ''),
    'default_timezone' => get_option('staff_default_timezone', 'UTC'),
    'date_format' => get_option('staff_date_format', 'Y-m-d'),
    'time_format' => get_option('staff_time_format', 'H:i'),
    'currency' => get_option('staff_currency', 'USD'),
    'fiscal_year_start' => get_option('staff_fiscal_year_start', '01-01'),
    'leave_year_start' => get_option('staff_leave_year_start', '01-01'),
    'default_leave_days' => get_option('staff_default_leave_days', '21'),
    'enable_notifications' => get_option('staff_enable_notifications', '1'),
    'smtp_host' => get_option('staff_smtp_host', ''),
    'smtp_port' => get_option('staff_smtp_port', ''),
    'smtp_username' => get_option('staff_smtp_username', ''),
    'smtp_password' => get_option('staff_smtp_password', ''),
    'smtp_encryption' => get_option('staff_smtp_encryption', 'tls'),
);

// Get available timezones
$timezones = DateTimeZone::listIdentifiers();

// Get available date formats
$date_formats = array(
    'Y-m-d' => date('Y-m-d'),
    'd-m-Y' => date('d-m-Y'),
    'm/d/Y' => date('m/d/Y'),
    'd/m/Y' => date('d/m/Y'),
    'F j, Y' => date('F j, Y'),
);

// Get available time formats
$time_formats = array(
    'H:i' => date('H:i'),
    'h:i A' => date('h:i A'),
    'h:i a' => date('h:i a'),
);

// Get available currencies
$currencies = array(
    'USD' => 'US Dollar ($)',
    'EUR' => 'Euro (€)',
    'GBP' => 'British Pound (£)',
    'JPY' => 'Japanese Yen (¥)',
    'AUD' => 'Australian Dollar (A$)',
    'CAD' => 'Canadian Dollar (C$)',
    'CHF' => 'Swiss Franc (CHF)',
    'CNY' => 'Chinese Yuan (¥)',
    'INR' => 'Indian Rupee (₹)',
);
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: System Settings -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">System Settings</h2>
            </div>
            <div class="p-5">
                <form action="<?php echo admin_url('admin-post.php'); ?>" method="post">
                    <?php wp_nonce_field('system_settings_action', 'system_settings_nonce'); ?>
                    <input type="hidden" name="action" value="system_settings_action">
                    
                    <div class="grid grid-cols-12 gap-x-5 gap-y-5">
                        <!-- Organization Settings -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <h3 class="font-medium text-base mb-5">Organization Settings</h3>
                                <div class="mb-5">
                                    <label for="site_name" class="form-label">Site Name</label>
                                    <input id="site_name" type="text" name="site_name" class="form-control" 
                                           value="<?php echo esc_attr($settings['site_name']); ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="site_description" class="form-label">Site Description</label>
                                    <textarea id="site_description" name="site_description" class="form-control" rows="3"><?php echo esc_textarea($settings['site_description']); ?></textarea>
                                </div>
                                <div class="mb-5">
                                    <label for="organization_name" class="form-label">Organization Name</label>
                                    <input id="organization_name" type="text" name="organization_name" class="form-control" 
                                           value="<?php echo esc_attr($settings['organization_name']); ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="organization_address" class="form-label">Organization Address</label>
                                    <textarea id="organization_address" name="organization_address" class="form-control" rows="3"><?php echo esc_textarea($settings['organization_address']); ?></textarea>
                                </div>
                                <div class="mb-5">
                                    <label for="contact_email" class="form-label">Contact Email</label>
                                    <input id="contact_email" type="email" name="contact_email" class="form-control" 
                                           value="<?php echo esc_attr($settings['contact_email']); ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="contact_phone" class="form-label">Contact Phone</label>
                                    <input id="contact_phone" type="tel" name="contact_phone" class="form-control" 
                                           value="<?php echo esc_attr($settings['contact_phone']); ?>">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Regional Settings -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <h3 class="font-medium text-base mb-5">Regional Settings</h3>
                                <div class="mb-5">
                                    <label for="default_timezone" class="form-label">Default Timezone</label>
                                    <select id="default_timezone" name="default_timezone" class="form-select" required>
                                        <?php foreach ($timezones as $tz): ?>
                                        <option value="<?php echo esc_attr($tz); ?>" 
                                                <?php echo ($settings['default_timezone'] == $tz) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($tz); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="date_format" class="form-label">Date Format</label>
                                    <select id="date_format" name="date_format" class="form-select" required>
                                        <?php foreach ($date_formats as $format => $example): ?>
                                        <option value="<?php echo esc_attr($format); ?>" 
                                                <?php echo ($settings['date_format'] == $format) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($example); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="time_format" class="form-label">Time Format</label>
                                    <select id="time_format" name="time_format" class="form-select" required>
                                        <?php foreach ($time_formats as $format => $example): ?>
                                        <option value="<?php echo esc_attr($format); ?>" 
                                                <?php echo ($settings['time_format'] == $format) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($example); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="currency" class="form-label">Currency</label>
                                    <select id="currency" name="currency" class="form-select" required>
                                        <?php foreach ($currencies as $code => $name): ?>
                                        <option value="<?php echo esc_attr($code); ?>" 
                                                <?php echo ($settings['currency'] == $code) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($name); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- System Settings -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <h3 class="font-medium text-base mb-5">System Settings</h3>
                                <div class="mb-5">
                                    <label for="fiscal_year_start" class="form-label">Fiscal Year Start (MM-DD)</label>
                                    <input id="fiscal_year_start" type="text" name="fiscal_year_start" class="form-control" 
                                           value="<?php echo esc_attr($settings['fiscal_year_start']); ?>" 
                                           pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])" required>
                                </div>
                                <div class="mb-5">
                                    <label for="leave_year_start" class="form-label">Leave Year Start (MM-DD)</label>
                                    <input id="leave_year_start" type="text" name="leave_year_start" class="form-control" 
                                           value="<?php echo esc_attr($settings['leave_year_start']); ?>" 
                                           pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])" required>
                                </div>
                                <div class="mb-5">
                                    <label for="default_leave_days" class="form-label">Default Annual Leave Days</label>
                                    <input id="default_leave_days" type="number" name="default_leave_days" class="form-control" 
                                           value="<?php echo esc_attr($settings['default_leave_days']); ?>" min="0" required>
                                </div>
                                <div class="mb-5">
                                    <div class="form-check">
                                        <input id="enable_notifications" class="form-check-input" type="checkbox" name="enable_notifications" value="1" 
                                               <?php echo ($settings['enable_notifications'] == '1') ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="enable_notifications">Enable Email Notifications</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Email Settings -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <h3 class="font-medium text-base mb-5">Email Settings</h3>
                                <div class="mb-5">
                                    <label for="smtp_host" class="form-label">SMTP Host</label>
                                    <input id="smtp_host" type="text" name="smtp_host" class="form-control" 
                                           value="<?php echo esc_attr($settings['smtp_host']); ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="smtp_port" class="form-label">SMTP Port</label>
                                    <input id="smtp_port" type="number" name="smtp_port" class="form-control" 
                                           value="<?php echo esc_attr($settings['smtp_port']); ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="smtp_username" class="form-label">SMTP Username</label>
                                    <input id="smtp_username" type="text" name="smtp_username" class="form-control" 
                                           value="<?php echo esc_attr($settings['smtp_username']); ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="smtp_password" class="form-label">SMTP Password</label>
                                    <input id="smtp_password" type="password" name="smtp_password" class="form-control" 
                                           value="<?php echo esc_attr($settings['smtp_password']); ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="smtp_encryption" class="form-label">SMTP Encryption</label>
                                    <select id="smtp_encryption" name="smtp_encryption" class="form-select">
                                        <option value="tls" <?php echo ($settings['smtp_encryption'] == 'tls') ? 'selected' : ''; ?>>TLS</option>
                                        <option value="ssl" <?php echo ($settings['smtp_encryption'] == 'ssl') ? 'selected' : ''; ?>>SSL</option>
                                        <option value="none" <?php echo ($settings['smtp_encryption'] == 'none') ? 'selected' : ''; ?>>None</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12 mt-5">
                            <button type="submit" class="btn btn-primary w-24 mr-1">Save</button>
                            <button type="reset" class="btn btn-outline-secondary w-24">Reset</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: System Settings -->
    </div>
</div>

<?php get_footer(); ?>
