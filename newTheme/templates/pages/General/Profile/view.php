<?php /* Template Name: Profile: View */


get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <div class="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
        <div class="intro-y box mt-5 lg:mt-0">
            <div class="relative flex items-center p-5">
                <div class="w-12 h-12 image-fit">
                    <img alt="Profile Picture" class="rounded-full" src="dist/images/profile-15.jpg">
                </div>
                <div class="ml-4 mr-auto">
                    <div class="font-medium text-base" id="profile-name">John Travolta</div>
                    <div class="text-slate-500" id="profile-title">DevOps Engineer</div>
                </div>
                <div class="dropdown">
                    <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i> </a>
                    <div class="dropdown-menu w-56">
                        <ul class="dropdown-content">
                            <li>
                                <a href="/profile" class="dropdown-item active"> <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile </a>
                            </li>
                            <li>
                                <a href="/profile/edit" class="dropdown-item"> <i data-lucide="edit" class="w-4 h-4 mr-2"></i> Edit Profile </a>
                            </li>
                            <li>
                                <a href="/profile/settings" class="dropdown-item"> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Settings </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                <a href="/profile" class="flex items-center px-3 py-2 rounded-md bg-primary text-white mb-2">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Profile</span>
                </a>
                <a href="/profile/edit" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 mb-2">
                    <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Edit Profile</span>
                </a>
                <a href="/profile/settings" class="flex items-center px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100">
                    <i data-lucide="shield" class="w-4 h-4 mr-2"></i>
                    <span class="text-sm font-medium">Security & Settings</span>
                </a>
            </div>
        </div>
    </div>
    <!-- END: Profile Menu -->

    <!-- BEGIN: Profile Content -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- Profile Header -->
        <div class="intro-y box px-5 pt-5 mt-5 lg:mt-0">
            <div class="flex flex-col lg:flex-row border-b border-slate-200/60 dark:border-darkmode-400 pb-5 -mx-5">
                <div class="flex flex-1 px-5 items-center justify-center lg:justify-start">
                    <div class="w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative">
                        <img alt="Profile Picture" class="rounded-full" id="profile-avatar" src="dist/images/profile-10.jpg">
                    </div>
                    <div class="ml-5">
                        <div class="w-24 sm:w-40 truncate sm:whitespace-normal font-medium text-lg" id="profile-fullname">Johnny Depp</div>
                        <div class="text-slate-500" id="profile-position">Backend Engineer</div>
                        <div class="text-slate-500 text-sm" id="profile-employee-id">Employee ID: EMP001</div>
                    </div>
                </div>
                <div class="mt-6 lg:mt-0 flex-1 px-5 border-l border-r border-slate-200/60 dark:border-darkmode-400 border-t lg:border-t-0 pt-5 lg:pt-0">
                    <div class="font-medium text-center lg:text-left lg:mt-3">Contact Details</div>
                    <div class="flex flex-col justify-center items-center lg:items-start mt-4">
                        <div class="truncate sm:whitespace-normal flex items-center" id="profile-email"> <i data-lucide="mail" class="w-4 h-4 mr-2"></i> johnnydepp@left4code.com </div>
                        <div class="truncate sm:whitespace-normal flex items-center mt-3" id="profile-phone"> <i data-lucide="instagram" class="w-4 h-4 mr-2"></i> +234 801 234 5678 </div>
                    </div>
                </div>
                <div class="mt-6 lg:mt-0 flex-1 flex items-center justify-center px-5 border-t lg:border-0 border-slate-200/60 dark:border-darkmode-400 pt-5 lg:pt-0">
                    <div class="text-center rounded-md w-20 py-3">
                        <div class="font-medium text-primary text-xl" id="profile-stat-1">201</div>
                        <div class="text-slate-500">Projects</div>
                    </div>
                    <div class="text-center rounded-md w-20 py-3">
                        <div class="font-medium text-primary text-xl" id="profile-stat-2">1k</div>
                        <div class="text-slate-500">Tasks</div>
                    </div>
                    <div class="text-center rounded-md w-20 py-3">
                        <div class="font-medium text-primary text-xl" id="profile-stat-3">492</div>
                        <div class="text-slate-500">Reviews</div>
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
        <div class="intro-y box px-5 pt-5 mt-5">
            <!-- Personal Information Tab -->
            <div class="tab-content" id="personal">
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
            <div class="tab-content hidden" id="employment">
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
            <div class="tab-content hidden" id="contact">
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
    <!-- END: Profile Content -->
</div>

<script>
$(document).ready(function() {
    // Load profile data on page load
    loadProfileData();

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
});

function loadProfileData() {
    // Show loading state - hide skeletons when data is loaded
    showSkeletons();

    // Load profile data from API with progressive loading
    $.ajax({
        url: '/wp-json/api/v1/profile',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + getAuthToken()
        },
        success: function(response) {
            // Progressive loading: update sections as data becomes available
            updateProfileHeader(response);
            updateContactDetails(response);
            updatePersonalInfo(response);
            updateEmploymentInfo(response);
            updateContactInfo(response);
            updateStatistics(response);

            // Hide all skeletons after successful load
            hideSkeletons();

            showNotification.success('Profile loaded successfully');
        },
        error: function(xhr, status, error) {
            console.error('Error loading profile data:', error);
            hideSkeletons();

            let errorMessage = 'Error loading profile data';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            showNotification.error(errorMessage);
        }
    });
}

function showSkeletons() {
    // Show all skeleton elements
    $('.skeleton').show();
}

function hideSkeletons() {
    // Hide all skeleton elements
    $('.skeleton').hide();
}

function updateProfileHeader(response) {
    // Update profile menu
    $('#profile-name').text(response.first_name + ' ' + response.last_name);
    $('#profile-title').text(response.position || 'Employee');

    // Update profile header
    $('#profile-fullname').text(response.first_name + ' ' + response.last_name);
    $('#profile-position').text(response.position || 'Employee');
    $('#profile-employee-id').text('Employee ID: ' + (response.employee_id || 'N/A'));
    $('#profile-avatar').attr('src', response.avatar || 'dist/images/profile-10.jpg');
}

function updateContactDetails(response) {
    // Update contact details in header
    $('#profile-email').html('<i data-lucide="mail" class="w-4 h-4 mr-2"></i> ' + (response.email || ''));
    $('#profile-phone').html('<i data-lucide="phone" class="w-4 h-4 mr-2"></i> ' + (response.phone || ''));
}

function updatePersonalInfo(response) {
    // Update personal information tab
    $('#personal-firstname').text(response.first_name || '');
    $('#personal-lastname').text(response.last_name || '');
    $('#personal-dob').text(formatDate(response.date_of_birth) || '');
    $('#personal-gender').text(response.gender || '');
    $('#personal-marital').text(response.marital_status || '');
    $('#personal-nationality').text(response.nationality || '');
    $('#personal-bio').text(response.bio || '');
}

function updateEmploymentInfo(response) {
    // Update employment details tab
    $('#employment-title').text(response.position || '');
    $('#employment-dept').text(response.department || '');
    $('#employment-manager').text(response.manager || '');
    $('#employment-hire').text(formatDate(response.hire_date) || '');
    $('#employment-status').text(response.employment_status || '');
    $('#employment-type').text(response.employee_type || '');
}

function updateContactInfo(response) {
    // Update contact information tab
    $('#contact-email').text(response.email || '');
    $('#contact-phone').text(response.phone || '');
    $('#contact-address').text(response.address || '');
    $('#contact-emergency').text(response.emergency_contact || '');
}

function updateStatistics(response) {
    // Update statistics if available
    if (response.stats) {
        $('#profile-stat-1').text(response.stats.projects || '0');
        $('#profile-stat-2').text(response.stats.tasks || '0');
        $('#profile-stat-3').text(response.stats.reviews || '0');
    } else {
        // Default statistics
        $('#profile-stat-1').text('0');
        $('#profile-stat-2').text('0');
        $('#profile-stat-3').text('0');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getAuthToken() {
    // Get auth token from localStorage or wherever it's stored
    return localStorage.getItem('auth_token') || '';
}

function showNotification(message, type = 'info') {
    // Implement notification system
    console.log(`${type.toUpperCase()}: ${message}`);
}
</script>

<?php get_footer(); ?>