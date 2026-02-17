<?php /* Template Name: Profile */
// Set page variables
$pageTitle = 'Profile';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/profile')],
    ['name' => 'Profile']
];
$activeMenu = 'profile';

get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <div class="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
        <div class="intro-y box mt-5 lg:mt-0">
            <div class="relative flex items-center p-5">
                <div class="w-12 h-12 image-fit">
                    <img alt="Profile Picture" class="rounded-full" id="profile-avatar" src="/wp-content/uploads/2025/07/user.jpg">
                </div>
                <div class="ml-4 mr-auto">
                    <div class="font-medium text-base" id="profile-name">
                        <div class="animate-pulse bg-slate-200 h-4 w-32 rounded skeleton"></div>
                    </div>
                    <div class="text-slate-500" id="profile-title">
                        <div class="animate-pulse bg-slate-200 h-3 w-24 rounded skeleton mt-1"></div>
                    </div>
                </div>
                <div class="dropdown">
                    <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i> </a>
                    <div class="dropdown-menu w-56">
                        <ul class="dropdown-content">
                            <li>
                                <a href="/profile" class="dropdown-item active"> <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile </a>
                            </li>
                            <li>
                                <a href="/profile#edit" class="dropdown-item"> <i data-lucide="edit" class="w-4 h-4 mr-2"></i> Edit Profile </a>
                            </li>
                            <li>
                                <a href="/profile#settings" class="dropdown-item"> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Settings </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                <a href="/profile" class="flex items-center px-3 py-2 rounded-md bg-primary text-white mb-2" id="nav-view">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Profile</span>
                </a>
                <a href="/profile#edit" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 mb-2" id="nav-edit">
                    <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Edit Profile</span>
                </a>
                <a href="/profile#settings" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100" id="nav-settings">
                    <i data-lucide="shield" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Security & Settings</span>
                </a>
            </div>
        </div>
    </div>
    <!-- END: Profile Menu -->

    <!-- BEGIN: Dynamic Content Area -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- Profile View Content (Default) -->
        <div id="profile-view" class="profile-section">
            <!-- Profile Header -->
            <div class="intro-y box px-5 pt-5 mt-5 lg:mt-0">
                <div class="flex flex-col lg:flex-row border-b border-slate-200/60 dark:border-darkmode-400 pb-5 -mx-5">
                    <div class="flex flex-1 px-5 items-center justify-center lg:justify-start">
                        <div class="w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative">
                            <img alt="Profile Picture" class="rounded-full" id="profile-avatar-main" src="/wp-content/uploads/2025/07/user.jpg">
                        </div>
                        <div class="ml-5">
                            <div class="w-24 sm:w-40 truncate sm:whitespace-normal font-medium text-lg" id="profile-fullname">
                                <div class="animate-pulse bg-slate-200 h-5 w-40 rounded skeleton"></div>
                            </div>
                            <div class="text-slate-500" id="profile-position">
                                <div class="animate-pulse bg-slate-200 h-4 w-32 rounded skeleton mt-1"></div>
                            </div>
                            <div class="text-slate-500 text-sm" id="profile-employee-id">
                                <div class="animate-pulse bg-slate-200 h-3 w-24 rounded skeleton mt-1"></div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 lg:mt-0 flex-1 px-5 border-l border-r border-slate-200/60 dark:border-darkmode-400 border-t lg:border-t-0 pt-5 lg:pt-0">
                        <div class="font-medium text-center lg:text-left lg:mt-3">Contact Details</div>
                        <div class="flex flex-col justify-center items-center lg:items-start mt-4">
                            <div class="truncate sm:whitespace-normal flex items-center" id="profile-email">
                                <div class="animate-pulse bg-slate-200 h-4 w-48 rounded skeleton"></div>
                            </div>
                            <div class="truncate sm:whitespace-normal flex items-center mt-3" id="profile-phone">
                                <div class="animate-pulse bg-slate-200 h-4 w-40 rounded skeleton"></div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 lg:mt-0 flex-1 hidden flex items-center justify-center px-5 border-t lg:border-0 border-slate-200/60 dark:border-darkmode-400 pt-5 lg:pt-0">
                        <div class="text-center rounded-md w-20 py-3">
                            <div class="font-medium text-primary text-xl" id="profile-stat-1">
                                <div class="animate-pulse bg-slate-200 h-6 w-8 rounded skeleton mx-auto"></div>
                            </div>
                            <div class="text-slate-500">
                                <div class="animate-pulse bg-slate-200 h-3 w-12 rounded skeleton mx-auto mt-1"></div>
                            </div>
                        </div>
                        <div class="text-center rounded-md w-20 py-3">
                            <div class="font-medium text-primary text-xl" id="profile-stat-2">
                                <div class="animate-pulse bg-slate-200 h-6 w-8 rounded skeleton mx-auto"></div>
                            </div>
                            <div class="text-slate-500">
                                <div class="animate-pulse bg-slate-200 h-3 w-10 rounded skeleton mx-auto mt-1"></div>
                            </div>
                        </div>
                        <div class="text-center rounded-md w-20 py-3">
                            <div class="font-medium text-primary text-xl" id="profile-stat-3">
                                <div class="animate-pulse bg-slate-200 h-6 w-8 rounded skeleton mx-auto"></div>
                            </div>
                            <div class="text-slate-500">
                                <div class="animate-pulse bg-slate-200 h-3 w-12 rounded skeleton mx-auto mt-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <ul class="nav nav-link-tabs flex-col sm:flex-row justify-center lg:justify-start text-center mt-5" role="tablist">
                    <li id="personal-tab-nav" class="nav-item" role="presentation">
                        <a href="javascript:;" class="nav-link py-4 flex items-center active" data-tw-target="#personal" aria-controls="personal" aria-selected="true" role="tab">
                            <i class="w-4 h-4 mr-2" data-lucide="user"></i> Personal
                        </a>
                    </li>
                    <li id="employment-tab-nav" class="nav-item" role="presentation">
                        <a href="javascript:;" class="nav-link py-4 flex items-center" data-tw-target="#employment" aria-selected="false" role="tab">
                            <i class="w-4 h-4 mr-2" data-lucide="briefcase"></i> Employment
                        </a>
                    </li>
                    <li id="contact-tab-nav" class="nav-item" role="presentation">
                        <a href="javascript:;" class="nav-link py-4 flex items-center" data-tw-target="#contact" aria-selected="false" role="tab">
                            <i class="w-4 h-4 mr-2" data-lucide="phone"></i> Contact
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Tab Content -->
            <div class="intro-y tab-content box px-5 pt-5 mt-5">
                <!-- Personal Information Tab -->
                <div id="personal" class="tab-pane active" role="tabpanel" aria-labelledby="personal-tab-nav">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">First Name</label>
                                <div class="form-control-plaintext skeleton" id="personal-firstname"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Last Name</label>
                                <div class="form-control-plaintext skeleton" id="personal-lastname"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Date of Birth</label>
                                <div class="form-control-plaintext skeleton" id="personal-dob"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Gender</label>
                                <div class="form-control-plaintext skeleton" id="personal-gender"></div>
                            </div>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">Marital Status</label>
                                <div class="form-control-plaintext skeleton" id="personal-marital"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Nationality</label>
                                <div class="form-control-plaintext skeleton" id="personal-nationality"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Bio</label>
                                <div class="form-control-plaintext skeleton" id="personal-bio"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Employment Details Tab -->
                <div id="employment" class="tab-pane " role="tabpanel" aria-labelledby="employment-tab-nav">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">Job Title</label>
                                <div class="form-control-plaintext skeleton" id="employment-title"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Department</label>
                                <div class="form-control-plaintext skeleton" id="employment-dept"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Manager</label>
                                <div class="form-control-plaintext skeleton" id="employment-manager"></div>
                            </div>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">Hire Date</label>
                                <div class="form-control-plaintext skeleton" id="employment-hire"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Employment Status</label>
                                <div class="form-control-plaintext skeleton" id="employment-status"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Employee Type</label>
                                <div class="form-control-plaintext skeleton" id="employment-type"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact Information Tab -->
                <div id="contact" class="tab-pane " role="tabpanel" aria-labelledby="contact-tab-nav">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">Email</label>
                                <div class="form-control-plaintext skeleton" id="contact-email"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Phone</label>
                                <div class="form-control-plaintext skeleton" id="contact-phone"></div>
                            </div>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <div class="mb-4">
                                <label class="form-label">Address</label>
                                <div class="form-control-plaintext skeleton" id="contact-address"></div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label">Emergency Contact</label>
                                <div class="form-control-plaintext skeleton" id="contact-emergency"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Edit Content (Hidden by default) -->
        <div id="profile-edit" class="profile-section hidden">
            <div class="intro-y box px-5 pt-5 mt-5 lg:mt-0">
                <div class="flex items-center mb-5">
                    <h2 class="text-lg font-medium mr-auto">Update Profile</h2>
                    <div class="flex space-x-2">
                        <a href="/profile" class="btn btn-outline-secondary">
                            <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
                            Cancel
                        </a>
                        <button type="button" id="save-profile" class="btn btn-primary">
                            <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                            Save Changes
                        </button>
                    </div>
                </div>

                <form id="profile-edit-form">
                    <!-- Personal Information -->
                    <div class="mb-8">
                        <h3 class="text-base font-medium mb-4">Personal Information</h3>
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="first_name">First Name *</label>
                                    <input type="text" class="form-control" id="first_name" name="first_name" required>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="last_name">Last Name *</label>
                                    <input type="text" class="form-control" id="last_name" name="last_name" required>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="date_of_birth">Date of Birth</label>
                                    <input type="date" class="form-control" id="date_of_birth" name="date_of_birth">
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="gender">Gender</label>
                                    <select class="form-select" id="gender" name="gender">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="marital_status">Marital Status</label>
                                    <select class="form-select" id="marital_status" name="marital_status">
                                        <option value="">Select Status</option>
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="divorced">Divorced</option>
                                        <option value="widowed">Widowed</option>
                                    </select>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="nationality">Nationality</label>
                                    <input type="text" class="form-control" id="nationality" name="nationality">
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="bio">Bio</label>
                                    <textarea class="form-control" id="bio" name="bio" rows="3" placeholder="Tell us about yourself..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="mb-8">
                        <h3 class="text-base font-medium mb-4">Contact Information</h3>
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="email">Email Address *</label>
                                    <input type="email" class="form-control" id="email" name="email" required>
                                    <div class="form-help text-xs text-slate-500 mt-1">
                                        Changing email requires verification
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="phone">Phone Number</label>
                                    <input type="tel" class="form-control" id="phone" name="phone">
                                </div>
                            </div>
                            <div class="col-span-12 lg:col-span-6">
                                <div class="mb-4">
                                    <label class="form-label" for="address">Address</label>
                                    <textarea class="form-control" id="address" name="address" rows="2"></textarea>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label" for="emergency_contact">Emergency Contact</label>
                                    <input type="text" class="form-control" id="emergency_contact" name="emergency_contact"
                                        placeholder="Name: Phone Number">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Profile Picture Upload -->
                    <div class="mb-8">
                        <h3 class="text-base font-medium mb-4">Profile Picture</h3>
                        <div class="flex items-center">
                            <div class="w-20 h-20 image-fit relative mr-5">
                                <img alt="Profile Picture" class="rounded-full" id="current-avatar-edit" src="">
                                <div class="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer" onclick="document.getElementById('avatar-upload').click()">
                                    <i data-lucide="camera" class="w-4 h-4 text-white"></i>
                                </div>
                            </div>
                            <div class="flex-1">
                                <input type="file" id="avatar-upload" name="avatar" accept="image/*" class="hidden">
                                <div class="mb-2">
                                    <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('avatar-upload').click()">
                                        <i data-lucide="upload" class="w-4 h-4 mr-2"></i>
                                        Upload New Picture
                                    </button>
                                </div>
                                <div class="text-xs text-slate-500">
                                    JPG, PNG or GIF. Max size 2MB.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Change Request Section -->
                    <div class="mb-8 p-4 bg-slate-50 rounded-md">
                        <h4 class="text-sm font-medium mb-2 text-slate-700">Need to Change Restricted Information?</h4>
                        <p class="text-xs text-slate-600 mb-3">
                            For sensitive information like name, email, or employment details, submit a change request for approval.
                        </p>
                        <button type="button" id="submit-change-request" class="btn btn-outline-primary btn-sm">
                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i>
                            Submit Change Request
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Profile Settings Content (Hidden by default) -->
        <div id="profile-settings" class="profile-section hidden">
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
    </div>
    <!-- END: Dynamic Content Area -->
</div>

<script>
    // Global profile data cache
    let profileData = null;

    jQuery(document).ready(function($) {

        // Initialize hash-based routing
        initializeRouting();

        // Load initial profile data
        loadProfileData();

        // Initialize form handlers for edit and settings
        initializeFormHandlers();

        function initializeRouting() {
            // Handle initial route
            handleRoute(window.location.hash);

            // Handle hash changes (browser back/forward)
            $(window).on('hashchange', function() {
                handleRoute(window.location.hash);
            });

            // Handle navigation clicks
            $('#nav-view, #nav-edit, #nav-settings').on('click', function(e) {
                e.preventDefault();
                const hash = $(this).attr('href').replace('/profile', '');
                window.location.hash = hash;
            });
        }

        function handleRoute(hash) {
            // Update navigation active states
            $('.profile-section').addClass('hidden');
            $('#nav-view, #nav-edit, #nav-settings').removeClass('bg-primary text-white').addClass('text-slate-600 hover:bg-slate-100');

            // Show appropriate section and update navigation
            switch (hash) {
                case '#edit':
                    $('#profile-edit').removeClass('hidden');
                    $('#nav-edit').removeClass('text-slate-600 hover:bg-slate-100').addClass('bg-primary text-white');
                    populateEditForm();
                    break;
                case '#settings':
                    $('#profile-settings').removeClass('hidden');
                    $('#nav-settings').removeClass('text-slate-600 hover:bg-slate-100').addClass('bg-primary text-white');
                    loadPreferences();
                    loadNotificationSettings();
                    break;
                default: // '#view' or empty
                    $('#profile-view').removeClass('hidden');
                    $('#nav-view').removeClass('text-slate-600 hover:bg-slate-100').addClass('bg-primary text-white');
                    break;
            }

            // Update page title
            updatePageTitle(hash);
        }

        function updatePageTitle(hash) {
            const titles = {
                '#edit': 'Edit Profile',
                '#settings': 'Profile Settings',
                'default': 'Profile'
            };
            document.title = (titles[hash] || titles.default) + ' - Stanforte Edge';
        }

        function loadProfileData() {
            // Show loading state
            // showSkeletons();

            // Load profile data from API
            $.ajax({
                url: '/wp-json/api/v1/profile',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + AuthUtils.getAuthToken() || ''
                },
                success: function(response) {
                    profileData = response.data; // Cache for reuse

                    // Update all sections progressively
                    updateProfileHeader(profileData);
                    updateContactDetails(profileData);
                    updatePersonalInfo(profileData);
                    updateEmploymentInfo(profileData);
                    updateContactInfo(profileData);
                    updateStatistics(profileData);

                    // Hide skeletons
                    // hideSkeletons();
                    showToast('Profile loaded successfully');
                },
                error: function(xhr, status, error) {
                    // hideSkeletons();
                    let errorMessage = 'Error loading profile data';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    showToast(errorMessage, 'error');
                }
            });
        }

        // All the helper functions remain the same as before
        function showSkeletons() {
            $('.skeleton').show();
        }

        function hideSkeletons() {
            $('.skeleton').hide();
        }

        function updateProfileHeader(response) {
            $('#profile-name').text(response.first_name + ' ' + response.last_name);
            $('#profile-title').text(response.position || 'Employee');
            $('#profile-fullname').text(response.first_name + ' ' + response.last_name);
            $('#profile-position').text(response.position || 'Employee');
            $('#profile-employee-id').text('Employee ID: ' + (response.employee_id || 'N/A'));
            $('#profile-avatar, #profile-avatar-main').attr('src', response.avatar || '/wp-content/uploads/2025/07/user.jpg');
        }

        function updateContactDetails(response) {
            $('#profile-email').html('<i data-lucide="mail" class="w-4 h-4 mr-2"></i> ' + (response.email || ''));
            $('#profile-phone').html('<i data-lucide="phone" class="w-4 h-4 mr-2"></i> ' + (response.phone || 'N/A'));

            lucide.createIcons();
        }

        function updatePersonalInfo(response) {
            $('#personal-firstname').text(response.first_name || '');
            $('#personal-lastname').text(response.last_name || '');
            $('#personal-dob').text(formatDate(response.date_of_birth) || '');
            $('#personal-gender').text(response.gender || '');
            $('#personal-marital').text(response.marital_status || '');
            $('#personal-nationality').text(response.nationality || '');
            $('#personal-bio').text(response.bio || '');
        }

        function updateEmploymentInfo(response) {
            $('#employment-title').text(response.position || '');
            $('#employment-dept').text(response.department || '');
            $('#employment-manager').text(response.manager || '');
            $('#employment-hire').text(formatDate(response.hire_date) || '');
            $('#employment-status').text(response.employment_status || '');
            $('#employment-type').text(response.employee_type || '');
        }

        function updateContactInfo(response) {
            $('#contact-email').text(response.email || '');
            $('#contact-phone').text(response.phone || '');
            $('#contact-address').text(response.address || '');
            $('#contact-emergency').text(response.emergency_contact || '');
        }

        function updateStatistics(response) {
            if (response.stats) {
                $('#profile-stat-1').text(response.stats.projects || '0');
                $('#profile-stat-2').text(response.stats.tasks || '0');
                $('#profile-stat-3').text(response.stats.reviews || '0');
            } else {
                $('#profile-stat-1').text('0');
                $('#profile-stat-2').text('0');
                $('#profile-stat-3').text('0');
            }
        }

        function populateEditForm() {
            if (!profileData) return;

            $('#first_name').val(profileData.first_name || '');
            $('#last_name').val(profileData.last_name || '');
            $('#email').val(profileData.email || '');
            $('#phone').val(profileData.phone || '');
            $('#date_of_birth').val(profileData.date_of_birth ? formatDateForInput(profileData.date_of_birth) : '');
            $('#gender').val(profileData.gender || '');
            $('#marital_status').val(profileData.marital_status || '');
            $('#nationality').val(profileData.nationality || '');
            $('#bio').val(profileData.bio || '');
            $('#address').val(profileData.address || '');
            $('#emergency_contact').val(profileData.emergency_contact || '');
            $('#current-avatar-edit').attr('src', profileData.avatar || 'dist/images/profile-10.jpg');
        }

        function initializeFormHandlers() {
            // Profile edit form
            $('#save-profile').on('click', function() {
                saveProfileData();
            });

            $('#avatar-upload').on('change', function() {
                handleAvatarUpload();
            });

            $('#submit-change-request').on('click', function() {
                showChangeRequestModal();
            });

            // Settings forms
            $('#change-password-btn').on('click', function() {
                changePassword();
            });

            $('#tfa-toggle-btn').on('click', function() {
                toggle2FA();
            });

            $('#save-preferences-btn').on('click', function() {
                savePreferences();
            });

            $('#save-notifications-btn').on('click', function() {
                saveNotificationSettings();
            });

            $('#deactivate-account-btn').on('click', function() {
                deactivateAccount();
            });
        }

        // Include all the form handler functions from previous implementations
        function saveProfileData() {
            const formData = new FormData(document.getElementById('profile-edit-form'));
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            $('#save-profile').prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin"></i> Saving...');

            $.ajax({
                url: '/wp-json/api/v1/profile',
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + AuthUtils.getAuthToken() || ''
                },
                data: JSON.stringify(data),
                success: function(response) {
                    showNotification.success('Profile updated successfully!');
                    // Reload profile data to reflect changes
                    loadProfileData();
                    // Switch back to view after short delay
                    setTimeout(function() {
                        window.location.hash = '';
                    }, 1500);
                },
                error: function(xhr, status, error) {
                    let errorMessage = 'Error saving profile';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    showNotification.error(errorMessage);
                },
                complete: function() {
                    $('#save-profile').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Changes');
                }
            });
        }

        function handleAvatarUpload() {
            const fileInput = document.getElementById('avatar-upload');
            const file = fileInput.files[0];

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showNotification.error('File size too large. Maximum 2MB allowed.');
                    return;
                }

                if (!file.type.match('image.*')) {
                    showNotification.error('Please select a valid image file.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#current-avatar-edit').attr('src', e.target.result);
                };
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append('avatar', file);

                $.ajax({
                    url: '/wp-json/api/v1/profile/avatar',
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') || ''
                    },
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        showNotification.success('Profile picture updated successfully!');
                        loadProfileData(); // Refresh profile data
                    },
                    error: function(xhr, status, error) {
                        showNotification.error('Error uploading profile picture');
                    }
                });
            }
        }

        function showChangeRequestModal() {
            const confirmSubmit = confirm('This will submit a change request for sensitive information that requires approval. Continue?');
            if (confirmSubmit) {
                showNotification.info('Change request feature coming soon. Please contact HR for sensitive information changes.');
            }
        }

        function loadPreferences() {
            $.ajax({
                url: '/wp-json/api/v1/profile/preferences',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') || ''
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
                    console.log('Preferences API not available yet, using defaults');
                }
            });
        }

        function loadNotificationSettings() {
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
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') || ''
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
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') || ''
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
                        'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') || ''
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

    });
</script>

<?php get_footer(); ?>