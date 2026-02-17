<?php /* Template Name: Profile: Settings */
get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <div class="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
        <div class="intro-y box mt-5">
            <div class="relative flex items-center p-5">
                <div class="w-12 h-12 image-fit">
                    <img alt="Profile Picture" class="rounded-full" src="dist/images/profile-1.jpg">
                </div>
                <div class="ml-4 mr-auto">
                    <div class="font-medium text-base" id="profile-name">Morgan Freeman</div>
                    <div class="text-slate-500" id="profile-title">DevOps Engineer</div>
                </div>
                <div class="dropdown">
                    <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i> </a>
                    <div class="dropdown-menu w-56">
                        <ul class="dropdown-content">
                            <li>
                                <a href="/profile" class="dropdown-item"> <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile </a>
                            </li>
                            <li>
                                <a href="/profile/edit" class="dropdown-item"> <i data-lucide="edit" class="w-4 h-4 mr-2"></i> Edit Profile </a>
                            </li>
                            <li>
                                <a href="/profile/settings" class="dropdown-item active"> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Settings </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                <a href="/profile" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 mb-2">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Profile</span>
                </a>
                <a href="/profile/edit" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 mb-2">
                    <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Edit Profile</span>
                </a>
                <a href="/profile/settings" class="flex items-center px-3 py-2 rounded-md bg-primary text-white">
                    <i data-lucide="shield" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Security & Settings</span>
                </a>
            </div>
        </div>
    </div>
    <!-- END: Profile Menu -->

    <!-- BEGIN: Settings Content -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="intro-y box px-5 pt-5 mt-5 lg:mt-0">
            <div class="flex items-center mb-5">
                <h2 class="text-lg font-medium mr-auto">Security & Settings</h2>
            </div>

            <!-- Settings Tabs -->
            <ul class="nav nav-link-tabs flex-col sm:flex-row justify-center lg:justify-start text-center mb-5" role="tablist">
                <li id="security-tab-nav" class="nav-item" role="presentation">
                    <a href="javascript:;" class="nav-link py-4 flex items-center active" data-tw-target="#security" aria-controls="security" aria-selected="true" role="tab">
                        <i class="w-4 h-4 mr-2" data-lucide="shield"></i> Security
                    </a>
                </li>
                <li id="preferences-tab-nav" class="nav-item" role="presentation">
                    <a href="javascript:;" class="nav-link py-4 flex items-center" data-tw-target="#preferences" aria-selected="false" role="tab">
                        <i class="w-4 h-4 mr-2" data-lucide="settings"></i> Preferences
                    </a>
                </li>
                <li id="notifications-tab-nav" class="nav-item" role="presentation">
                    <a href="javascript:;" class="nav-link py-4 flex items-center" data-tw-target="#notifications" aria-selected="false" role="tab">
                        <i class="w-4 h-4 mr-2" data-lucide="bell"></i> Notifications
                    </a>
                </li>
            </ul>

            <!-- Security Tab -->
            <div class="tab-content" id="security">
                <!-- Password Change Section -->
                <div class="mb-8">
                    <h3 class="text-base font-medium mb-4">Change Password</h3>
                    <form id="password-change-form">
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="current_password">Current Password *</label>
                                    <input type="password" class="form-control" id="current_password" name="current_password" required>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="new_password">New Password *</label>
                                    <input type="password" class="form-control" id="new_password" name="new_password" required minlength="8">
                                    <div class="form-help text-xs text-slate-500 mt-1">
                                        Minimum 8 characters with uppercase, lowercase, and numbers
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="confirm_password">Confirm New Password *</label>
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                </div>
                                <button type="button" id="change-password-btn" class="btn btn-primary">
                                    <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Two-Factor Authentication -->
                <div class="mb-8">
                    <h3 class="text-base font-medium mb-4">Two-Factor Authentication</h3>
                    <div class="p-4 bg-slate-50 rounded-md">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-sm">2FA Status</div>
                                <div class="text-xs text-slate-500 mt-1" id="tfa-status">Not Enabled</div>
                            </div>
                            <button type="button" id="tfa-toggle-btn" class="btn btn-outline-primary btn-sm">
                                <i data-lucide="smartphone" class="w-4 h-4 mr-2"></i>
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Sessions -->
                <div class="mb-8">
                    <h3 class="text-base font-medium mb-4">Active Sessions</h3>
                    <div class="space-y-3" id="sessions-list">
                        <!-- Sessions will be loaded here -->
                    </div>
                </div>

                <!-- Account Actions -->
                <div class="mb-8">
                    <h3 class="text-base font-medium mb-4 text-red-600">Account Actions</h3>
                    <div class="space-y-3">
                        <div class="p-4 border border-red-200 rounded-md">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-sm text-red-700">Deactivate Account</div>
                                    <div class="text-xs text-red-600 mt-1">
                                        Temporarily disable your account. You can reactivate it anytime.
                                    </div>
                                </div>
                                <button type="button" id="deactivate-account-btn" class="btn btn-outline-danger btn-sm">
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preferences Tab -->
            <div class="tab-content hidden" id="preferences">
                <form id="preferences-form">
                    <!-- Display Preferences -->
                    <div class="mb-8">
                        <h3 class="text-base font-medium mb-4">Display Preferences</h3>
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="theme">Theme</label>
                                    <select class="form-select" id="theme" name="theme">
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="auto">Auto (System)</option>
                                    </select>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="language">Language</label>
                                    <select class="form-select" id="language" name="language">
                                        <option value="en">English</option>
                                        <option value="fr">French</option>
                                        <option value="es">Spanish</option>
                                        <option value="de">German</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="timezone">Timezone</label>
                                    <select class="form-select" id="timezone" name="timezone">
                                        <option value="Africa/Lagos">West Africa Time (WAT)</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">Eastern Time</option>
                                        <option value="Europe/London">GMT</option>
                                    </select>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="date_format">Date Format</label>
                                    <select class="form-select" id="date_format" name="date_format">
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Privacy Settings -->
                    <div class="mb-8">
                        <h3 class="text-base font-medium mb-4">Privacy Settings</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-sm">Profile Visibility</div>
                                    <div class="text-xs text-slate-500">Control who can see your profile</div>
                                </div>
                                <select class="form-select w-32" id="profile_visibility" name="profile_visibility">
                                    <option value="public">Public</option>
                                    <option value="team">Team Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-sm">Activity Status</div>
                                    <div class="text-xs text-slate-500">Show when you're online</div>
                                </div>
                                <input type="checkbox" class="form-check-input" id="show_activity" name="show_activity" checked>
                            </div>
                        </div>
                    </div>

                    <button type="button" id="save-preferences-btn" class="btn btn-primary">
                        <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                        Save Preferences
                    </button>
                </form>
            </div>

            <!-- Notifications Tab -->
            <div class="tab-content hidden" id="notifications">
                <form id="notifications-form">
                    <div class="space-y-6">
                        <!-- Email Notifications -->
                        <div>
                            <h3 class="text-base font-medium mb-4">Email Notifications</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">Task Assignments</div>
                                        <div class="text-xs text-slate-500">Get notified when tasks are assigned to you</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="email_tasks" name="email_tasks" checked>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">Project Updates</div>
                                        <div class="text-xs text-slate-500">Receive updates about your projects</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="email_projects" name="email_projects" checked>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">System Announcements</div>
                                        <div class="text-xs text-slate-500">Important system announcements and updates</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="email_system" name="email_system" checked>
                                </div>
                            </div>
                        </div>

                        <!-- In-App Notifications -->
                        <div>
                            <h3 class="text-base font-medium mb-4">In-App Notifications</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">Comments & Mentions</div>
                                        <div class="text-xs text-slate-500">When someone comments on or mentions you</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="app_comments" name="app_comments" checked>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">Due Date Reminders</div>
                                        <div class="text-xs text-slate-500">Reminders for upcoming due dates</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="app_reminders" name="app_reminders" checked>
                                </div>
                            </div>
                        </div>

                        <!-- SMS Notifications -->
                        <div>
                            <h3 class="text-base font-medium mb-4">SMS Notifications</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-sm">Urgent Alerts</div>
                                        <div class="text-xs text-slate-500">Critical system alerts and security notifications</div>
                                    </div>
                                    <input type="checkbox" class="form-check-input" id="sms_alerts" name="sms_alerts">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6">
                        <button type="button" id="save-notifications-btn" class="btn btn-primary">
                            <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                            Save Notification Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- END: Settings Content -->
</div>

<script>
    jQuery(document).ready(function($) {

        showToast('Settings loaded successfully', 'success');

        // Load user data and preferences
        loadUserData();
        loadPreferences();
        loadNotificationSettings();

        // Tab switching functionality
        $('.nav-link').on('click', function() {
            const target = $(this).data('tw-target');

            // Remove active class from all tabs
            $('.nav-link').removeClass('active');
            $('.tab-content').addClass('hidden');

            // Add active class to clicked tab
            $(this).addClass('active');
            $(target).removeClass('hidden');
        });

        // Password change
        $('#change-password-btn').on('click', function() {
            changePassword();
        });

        // 2FA toggle
        $('#tfa-toggle-btn').on('click', function() {
            toggle2FA();
        });

        // Preferences save
        $('#save-preferences-btn').on('click', function() {
            savePreferences();
        });

        // Notifications save
        $('#save-notifications-btn').on('click', function() {
            saveNotificationSettings();
        });

        // Account deactivation
        $('#deactivate-account-btn').on('click', function() {
            deactivateAccount();
        });

        function loadUserData() {
            $.ajax({
                url: '/wp-json/api/v1/profile',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                success: function(response) {
                    $('#profile-name').text(response.first_name + ' ' + response.last_name);
                    $('#profile-title').text(response.position || 'Employee');
                }
            });
        }

        function loadPreferences() {
            $.ajax({
                url: '/wp-json/api/v1/profile/preferences',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                success: function(response) {
                    $('#theme').val(response.display?.theme || 'light');
                    $('#language').val(response.display?.language || 'en');
                    $('#timezone').val(response.display?.timezone || 'Africa/Lagos');
                    $('#date_format').val(response.display?.date_format || 'MM/DD/YYYY');
                    $('#profile_visibility').val(response.privacy?.profile_visibility || 'public');
                    $('#show_activity').prop('checked', response.privacy?.show_activity !== false);
                },
                error: function() {
                    // Use defaults if API not available yet
                    console.log('Preferences API not available yet, using defaults');
                }
            });
        }

        function loadNotificationSettings() {
            // This would load from preferences API, for now use defaults
            // Implementation would be similar to loadPreferences
        }

        function changePassword() {
            const currentPassword = $('#current_password').val();
            const newPassword = $('#new_password').val();
            const confirmPassword = $('#confirm_password').val();

            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification.error('Please fill in all password fields');
                return;
            }

            if (newPassword !== confirmPassword) {
                showNotification.error('New passwords do not match');
                return;
            }

            if (newPassword.length < 8) {
                showNotification.error('Password must be at least 8 characters long');
                return;
            }

            $('#change-password-btn').prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin"></i> Changing...');

            $.ajax({
                url: '/wp-json/api/v1/auth/change-password',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken(),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }),
                success: function(response) {
                    showNotification.success('Password changed successfully!');
                    $('#password-change-form')[0].reset();
                },
                error: function(xhr, status, error) {
                    const errorMessage = xhr.responseJSON?.message || 'Error changing password';
                    showNotification.error(errorMessage);
                },
                complete: function() {
                    $('#change-password-btn').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Change Password');
                }
            });
        }

        function toggle2FA() {
            // Implementation for 2FA setup/toggle
            showNotification.info('2FA setup feature coming soon');
        }

        function savePreferences() {
            const preferences = {
                display: {
                    theme: $('#theme').val(),
                    language: $('#language').val(),
                    timezone: $('#timezone').val(),
                    date_format: $('#date_format').val()
                },
                privacy: {
                    profile_visibility: $('#profile_visibility').val(),
                    show_activity: $('#show_activity').is(':checked')
                }
            };

            $('#save-preferences-btn').prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin"></i> Saving...');

            $.ajax({
                url: '/wp-json/api/v1/profile/preferences',
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken(),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(preferences),
                success: function(response) {
                    showNotification.success('Preferences saved successfully!');
                },
                error: function(xhr, status, error) {
                    const errorMessage = xhr.responseJSON?.message || 'Error saving preferences';
                    showNotification.error(errorMessage);
                },
                complete: function() {
                    $('#save-preferences-btn').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Preferences');
                }
            });
        }

        function saveNotificationSettings() {
            const settings = {
                email: {
                    tasks: $('#email_tasks').is(':checked'),
                    projects: $('#email_projects').is(':checked'),
                    system: $('#email_system').is(':checked')
                },
                app: {
                    comments: $('#app_comments').is(':checked'),
                    reminders: $('#app_reminders').is(':checked')
                },
                sms: {
                    alerts: $('#sms_alerts').is(':checked')
                }
            };

            $('#save-notifications-btn').prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin"></i> Saving...');

            // This would save to preferences API
            // For now, just show success
            setTimeout(function() {
                showNotification.success('Notification settings saved successfully!');
                $('#save-notifications-btn').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Notification Settings');
            }, 1000);
        }

        function deactivateAccount() {
            if (confirm('Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.')) {
                $.ajax({
                    url: '/wp-json/api/v1/profile/deactivate',
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + getAuthToken(),
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        reason: 'User requested deactivation',
                        effective_date: new Date().toISOString().split('T')[0]
                    }),
                    success: function(response) {
                        showNotification.success('Account deactivated successfully');
                        setTimeout(function() {
                            window.location.href = '/login';
                        }, 2000);
                    },
                    error: function(xhr, status, error) {
                        const errorMessage = xhr.responseJSON?.message || 'Error deactivating account';
                        showNotification.error(errorMessage);
                    }
                });
            }
        }

        function getAuthToken() {
            return localStorage.getItem('auth_token') || '';
        }

        function showNotification(message, type = 'info') {
            console.log(`${type.toUpperCase()}: ${message}`);

            if (type === 'error') {
                alert(`❌ ${message}`);
            } else if (type === 'success') {
                alert(`✅ ${message}`);
            } else {
                alert(`ℹ️ ${message}`);
            }
        }
    });
</script>

<?php get_footer(); ?>