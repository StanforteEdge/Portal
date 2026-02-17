<?php /* Template Name: Staff: Notification Settings */
?>

<?php
get_header();
$b_link = '/settings';
$b_title = 'Settings';
$p_title = 'Notification Settings';

include get_template_directory() . "/layout/menu.php";

// Get notification settings
$notification_settings = $wpdb->get_row("SELECT * FROM staff_jet_cct_notification_settings WHERE user_id = $staff->_ID");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Settings Menu -->
    <?php include get_template_directory() . "/layout/settings-menu.php"; ?>
    <!-- END: Settings Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Notification Settings</h2>
            </div>
            <div class="p-5">
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                    <input type="hidden" name="action" value="update_notification_settings">
                    <?php wp_nonce_field('update_notification_settings', 'notification_settings_nonce'); ?>
                    
                    <div class="grid grid-cols-12 gap-6">
                        <!-- Task Notifications -->
                        <div class="col-span-12">
                            <div class="text-base font-medium">Task Notifications</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="task_assigned" name="task_assigned" <?php echo ($notification_settings->task_assigned ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="task_assigned">When a task is assigned to me</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="task_updated" name="task_updated" <?php echo ($notification_settings->task_updated ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="task_updated">When a task is updated</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="task_completed" name="task_completed" <?php echo ($notification_settings->task_completed ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="task_completed">When a task is completed</label>
                                </div>
                            </div>
                        </div>

                        <!-- Project Notifications -->
                        <div class="col-span-12 mt-5">
                            <div class="text-base font-medium">Project Notifications</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="project_updates" name="project_updates" <?php echo ($notification_settings->project_updates ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="project_updates">Project updates and milestones</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="project_comments" name="project_comments" <?php echo ($notification_settings->project_comments ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="project_comments">Comments on projects</label>
                                </div>
                            </div>
                        </div>

                        <!-- Team Notifications -->
                        <div class="col-span-12 mt-5">
                            <div class="text-base font-medium">Team Notifications</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="team_announcements" name="team_announcements" <?php echo ($notification_settings->team_announcements ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="team_announcements">Team announcements</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="team_events" name="team_events" <?php echo ($notification_settings->team_events ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="team_events">Team events and meetings</label>
                                </div>
                            </div>
                        </div>

                        <!-- Notification Delivery -->
                        <div class="col-span-12 mt-5">
                            <div class="text-base font-medium">Notification Delivery</div>
                            <div class="mt-3">
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="email_notifications" name="email_notifications" <?php echo ($notification_settings->email_notifications ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="email_notifications">Send notifications to my email</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="browser_notifications" name="browser_notifications" <?php echo ($notification_settings->browser_notifications ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="browser_notifications">Enable browser notifications</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" id="mobile_notifications" name="mobile_notifications" <?php echo ($notification_settings->mobile_notifications ? 'checked' : ''); ?>>
                                    <label class="form-check-label" for="mobile_notifications">Enable mobile notifications</label>
                                </div>
                            </div>
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
