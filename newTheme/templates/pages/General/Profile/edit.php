<?php /* Template Name: Profile: Edit */
get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <div class="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
        <div class="intro-y box mt-5">
            <div class="relative flex items-center p-5">
                <div class="w-12 h-12 image-fit">
                    <img alt="Profile Picture" class="rounded-full" src="dist/images/profile-15.jpg">
                </div>
                <div class="ml-4 mr-auto">
                    <div class="font-medium text-base" id="profile-name">Robert De Niro</div>
                    <div class="text-slate-500" id="profile-title">Software Engineer</div>
                </div>
                <div class="dropdown">
                    <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i> </a>
                    <div class="dropdown-menu w-56">
                        <ul class="dropdown-content">
                            <li>
                                <a href="/profile" class="dropdown-item"> <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile </a>
                            </li>
                            <li>
                                <a href="/profile/edit" class="dropdown-item active"> <i data-lucide="edit" class="w-4 h-4 mr-2"></i> Edit Profile </a>
                            </li>
                            <li>
                                <a href="/profile/settings" class="dropdown-item"> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Settings </a>
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
                <a href="/profile/edit" class="flex items-center px-3 py-2 rounded-md bg-primary text-white mb-2">
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

    <!-- BEGIN: Profile Edit Content -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
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
                            <img alt="Profile Picture" class="rounded-full" id="current-avatar" src="dist/images/profile-15.jpg">
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
    <!-- END: Profile Edit Content -->
</div>

<script>
$(document).ready(function() {
    // Load current profile data
    loadProfileData();

    // Handle form submission
    $('#save-profile').on('click', function() {
        saveProfileData();
    });

    // Handle avatar upload preview
    $('#avatar-upload').on('change', function() {
        handleAvatarUpload();
    });

    // Handle change request
    $('#submit-change-request').on('click', function() {
        showChangeRequestModal();
    });
});

function loadProfileData() {
    $.ajax({
        url: '/wp-json/api/v1/profile',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + getAuthToken()
        },
        success: function(response) {
            // Update profile header
            $('#profile-name').text(response.first_name + ' ' + response.last_name);
            $('#profile-title').text(response.position || 'Employee');

            // Populate form fields
            $('#first_name').val(response.first_name || '');
            $('#last_name').val(response.last_name || '');
            $('#email').val(response.email || '');
            $('#phone').val(response.phone || '');
            $('#date_of_birth').val(response.date_of_birth ? formatDateForInput(response.date_of_birth) : '');
            $('#gender').val(response.gender || '');
            $('#marital_status').val(response.marital_status || '');
            $('#nationality').val(response.nationality || '');
            $('#bio').val(response.bio || '');
            $('#address').val(response.address || '');
            $('#emergency_contact').val(response.emergency_contact || '');

            // Update avatar
            if (response.avatar) {
                $('#current-avatar').attr('src', response.avatar);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading profile data:', error);
            showNotification('Error loading profile data', 'error');
        }
    });
}

function saveProfileData() {
    const formData = new FormData(document.getElementById('profile-edit-form'));

    // Convert FormData to JSON for PATCH request
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Show loading state
    $('#save-profile').prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin" data-lucide="loader"></i> Saving...');

    $.ajax({
        url: '/wp-json/api/v1/profile',
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + getAuthToken(),
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data),
        success: function(response) {
            showNotification.success('Profile updated successfully!');
            // Redirect to profile view after short delay
            setTimeout(function() {
                window.location.href = '/profile';
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.error('Error saving profile:', error);
            let errorMessage = 'Error saving profile';

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }

            showNotification.error(errorMessage);
        },
        complete: function() {
            // Reset button state
            $('#save-profile').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Changes');
        }
    });
}

function handleAvatarUpload() {
    const fileInput = document.getElementById('avatar-upload');
    const file = fileInput.files[0];

    if (file) {
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            showNotification.error('File size too large. Maximum 2MB allowed.');
            return;
        }

        // Validate file type
        if (!file.type.match('image.*')) {
            showNotification.error('Please select a valid image file.');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#current-avatar').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('avatar', file);

        $.ajax({
            url: '/wp-json/api/v1/profile/avatar',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken()
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                showNotification.success('Profile picture updated successfully!');
            },
            error: function(xhr, status, error) {
                console.error('Error uploading avatar:', error);
                showNotification.error('Error uploading profile picture');
            }
        });
    }
}

function showChangeRequestModal() {
    // This would open a modal for change requests
    // For now, we'll implement a simple redirect or alert
    const confirmSubmit = confirm('This will submit a change request for sensitive information that requires approval. Continue?');

    if (confirmSubmit) {
        // In a real implementation, this would open a modal with fields for:
        // - Field to change
        // - New value
        // - Reason for change
        // - Supporting documents

        // For now, redirect to a change request form or show message
        showNotification.info('Change request feature coming soon. Please contact HR for sensitive information changes.');
    }
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function getAuthToken() {
    return localStorage.getItem('auth_token') || '';
}

function showNotification(message, type = 'info') {
    // Implement notification system (could use toast notifications)
    console.log(`${type.toUpperCase()}: ${message}`);

    // Simple alert for now - in production, use a proper notification system
    if (type === 'error') {
        alert(`❌ ${message}`);
    } else if (type === 'success') {
        alert(`✅ ${message}`);
    } else {
        alert(`ℹ️ ${message}`);
    }
}
</script>

<?php get_footer(); ?>