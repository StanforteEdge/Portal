<?php /* Template Name: Staff: Account Settings */
?>

<?php
get_header();
$b_link = '/settings';
$b_title = 'Settings';
$p_title = 'Account Settings';

include get_template_directory() . "/layout/menu.php";

// Get user settings
$account_settings = $wpdb->get_row("SELECT * FROM staff_jet_cct_user_settings WHERE user_id = $staff->_ID");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Settings Menu -->
    <?php include get_template_directory() . "/layout/settings-menu.php"; ?>
    <!-- END: Settings Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Account Settings</h2>
            </div>
            <div class="p-5">
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                    <input type="hidden" name="action" value="update_account_settings">
                    <?php wp_nonce_field('update_account_settings', 'account_settings_nonce'); ?>
                    
                    <div class="grid grid-cols-12 gap-6">
                        <!-- Email Preferences -->
                        <div class="col-span-12">
                            <div class="text-base font-medium">Email Notifications</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="email_tasks" name="email_tasks" <?php echo ($account_settings->email_tasks ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="email_tasks">Notify me about new tasks</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="email_projects" name="email_projects" <?php echo ($account_settings->email_projects ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="email_projects">Notify me about project updates</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="email_requests" name="email_requests" <?php echo ($account_settings->email_requests ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="email_requests">Notify me about request status changes</label>
                                </div>
                            </div>
                        </div>

                        <!-- Privacy Settings -->
                        <div class="col-span-12 mt-5">
                            <div class="text-base font-medium">Privacy Settings</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="show_profile" name="show_profile" <?php echo ($account_settings->show_profile ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="show_profile">Show my profile to team members</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="show_status" name="show_status" <?php echo ($account_settings->show_status ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="show_status">Show my online status</label>
                                </div>
                            </div>
                        </div>

                        <!-- Language and Time Zone -->
                        <div class="col-span-12 sm:col-span-6 mt-5">
                            <label for="language" class="form-label">Language</label>
                            <select id="language" name="language" class="form-select">
                                <option value="en" <?php echo ($account_settings->language == 'en' ? 'selected' : ''); ?>>English</option>
                                <option value="fr" <?php echo ($account_settings->language == 'fr' ? 'selected' : ''); ?>>French</option>
                                <option value="es" <?php echo ($account_settings->language == 'es' ? 'selected' : ''); ?>>Spanish</option>
                            </select>
                        </div>
                        <div class="col-span-12 sm:col-span-6 mt-5">
                            <label for="timezone" class="form-label">Time Zone</label>
                            <select id="timezone" name="timezone" class="form-select">
                                <option value="UTC" <?php echo ($account_settings->timezone == 'UTC' ? 'selected' : ''); ?>>UTC</option>
                                <option value="GMT+1" <?php echo ($account_settings->timezone == 'GMT+1' ? 'selected' : ''); ?>>GMT+1</option>
                                <option value="GMT+2" <?php echo ($account_settings->timezone == 'GMT+2' ? 'selected' : ''); ?>>GMT+2</option>
                            </select>
                        </div>

                        <!-- Save Button -->
                        <div class="col-span-12 mt-5">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
