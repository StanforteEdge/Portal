<?php /* Template Name: Auth: Reset Password */ ?>

<?php get_header(); ?>

<body class="login">
    <div class="container sm:px-10">
        <div class="block xl:grid grid-cols-2 gap-4">
            <!-- BEGIN: Change Password Info -->
            <div class="hidden xl:flex flex-col min-h-screen">
                <div class="my-auto">
                    <img alt="Stanforte Edge - Staff Portal" class="-intro-x w-2/4 -mt-16" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                </div>
            </div>
            <!-- END: Change Password Info -->
            <!-- BEGIN: Change Password Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x items-center pt-5 pb-2">
                            <img alt="Stanforte Edge - Staff Portal" class="w-32" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                        </a>
                    </div>
                    <h2 class="intro-x font-medium mt-4 pt-3 text-2xl xl:text-3xl text-center xl:text-left">
                        Reset Password
                    </h2>
                    <div class="intro-x mt-8">
                        <form id="change-password-form" class="change-password-form" novalidate>
                            <input type="password" name="new_password" id="new_password" class="intro-x form-control py-3 px-4 block" placeholder="New Password" required minlength="8" pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$" title="Password must be at least 8 characters long and include letters, numbers, and special characters">
                            <div class="text-danger text-xs mt-1 hidden" id="new_password-error">New password must be at least 8 characters long and include letters, numbers, and special characters</div>
                            <input type="password" name="confirm_password" id="confirm_password" class="intro-x form-control py-3 px-4 block mt-4" placeholder="Confirm New Password" required>
                            <div class="text-danger text-xs mt-1 hidden" id="confirm_password-error">Passwords do not match</div>

                            <div class="intro-y col-span-12">
                                <div class="text-xs text-slate-500 mt-2">Password requirements:</div>
                                <div class="password-requirements mt-1 ml-3">
                                    <div class="requirement text-xs m-3 flex  items-center gap-3" data-requirement="length">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-danger"></i>
                                        <i data-lucide="check-circle" class="w-4 h-4 text-success" style="display: none;"></i>
                                        <span>At least 8 characters long</span>
                                    </div>
                                    <div class="requirement text-xs m-3 flex  items-center gap-3" data-requirement="letter">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-danger"></i>
                                        <i data-lucide="check-circle" class="w-4 h-4 text-success" style="display: none;"></i>
                                        <span>Contains a letter</span>
                                    </div>
                                    <div class="requirement text-xs m-3 flex  items-center gap-3" data-requirement="number">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-danger"></i>
                                        <i data-lucide="check-circle" class="w-4 h-4 text-success" style="display: none;"></i>
                                        <span>Contains a number</span>
                                    </div>
                                    <div class="requirement text-xs m-3 flex  items-center gap-3" data-requirement="special">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-danger"></i>
                                        <i data-lucide="check-circle" class="w-4 h-4 text-success" style="display: none;"></i>
                                        <span>Contains a special character (@$!%*#?&)</span>
                                    </div>
                                </div>
                            </div>
                            <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                                <button type="submit" class="btn btn-primary py-3 px-4 w-full text-black xl:w-32 xl:mr-3 align-top relative">
                                    <span class="btn-text">Change Password</span>
                                    <span class="btn-loading absolute inset-0 flex items-center justify-center hidden">
                                        <i data-loading-icon="oval" data-color="white" class="w-5 h-5"></i>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <!-- END: Change Password Form -->
        </div>
    </div>
    <?php get_footer(); ?>

    <script>
        jQuery(document).ready(function($) {
            // Initialize password validation
            const $password = $('#new_password');
            const $confirmPassword = $('#confirm_password');
            const $passwordError = $('#confirm_password-error');

            // Password requirement checks
            function checkPasswordRequirements(password) {
                const requirements = {
                    length: password.length >= 8,
                    letter: /[A-Za-z]/.test(password),
                    number: /\d/.test(password),
                    special: /[@$!%*#?&]/.test(password)
                };

                // Update visual indicators
                Object.entries(requirements).forEach(([requirement, isMet]) => {
                    const $requirement = $(`.requirement[data-requirement="${requirement}"]`);
                    $requirement.find('[data-lucide="x-circle"]').toggle(!isMet);
                    $requirement.find('[data-lucide="check-circle"]').toggle(isMet);
                });

                return Object.values(requirements).every(Boolean);
            }

            // Add real-time password requirement checking
            $password.on('input', function() {
                const password = $(this).val();
                checkPasswordRequirements(password);
            });

            $confirmPassword.on('input', function() {
                validatePasswords();
            });

            function validatePasswords() {
                const password = $password.val();
                const confirmPassword = $confirmPassword.val();

                // Check if passwords match
                if (password !== confirmPassword) {
                    $passwordError.show();
                    return false;
                }

                // Check all password requirements
                if (!checkPasswordRequirements(password)) {
                    return false;
                }

                $passwordError.hide();
                return true;
            }

            $('#change-password-form').on('submit', function(e) {
                e.preventDefault();
                const form = $(this);
                const submitBtn = form.find('button[type="submit"]');
                const btnText = submitBtn.find('.btn-text');
                const btnLoading = submitBtn.find('.btn-loading');

                // Reset errors
                $('.text-danger').addClass('hidden');
                $('.form-control').removeClass('border-danger');

                // Show loading
                btnText.addClass('invisible');
                btnLoading.removeClass('hidden');
                submitBtn.prop('disabled', true);

                const token = new URLSearchParams(window.location.search).get('token');
                const newPassword = $('#new_password').val().trim();
                const confirmPassword = $('#confirm_password').val().trim();

                // Validation
                if (!token) {
                    showNotification.error('Invalid reset link. Missing token.');
                    resetFormState();
                    return;
                }
                if (!newPassword || newPassword.length < 8) {
                    showError('new_password', 'New password must be at least 8 characters');
                    resetFormState();
                    return;
                }
                if (newPassword !== confirmPassword) {
                    showError('confirm_password', 'Passwords do not match');
                    resetFormState();
                    return;
                }

                // API call
                $.ajax({
                    url: '/wp-json/api/v1/auth/reset-password',
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        token: token,
                        new_password: newPassword
                    }),
                    success: function(response) {
                        showNotification.success(response.data?.message || 'Password changed successfully! Please log in.');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    },
                    error: function(xhr) {
                        let errorMessage = 'Failed to change password.';
                        if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) {
                            errorMessage = xhr.responseJSON.error.message;
                        }
                        showNotification.error(errorMessage);
                    },
                    complete: function() {
                        resetFormState();
                    }
                });

                function resetFormState() {
                    btnText.removeClass('invisible');
                    btnLoading.addClass('hidden');
                    submitBtn.prop('disabled', false);
                }

                function showError(field, message) {
                    $(`#${field}`).addClass('border-danger');
                    $(`#${field}-error`).text(message).removeClass('hidden');
                }
            });
        });
    </script>
</body>

</html>