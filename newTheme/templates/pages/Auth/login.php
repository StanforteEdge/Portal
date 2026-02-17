<?php
/* Template Name: Auth: Login */

get_header();
?>

<div class="container sm:px-10">
    <div class="block xl:grid grid-cols-2 gap-4">
        <!-- BEGIN: Login Info -->
        <div class="hidden xl:flex flex-col min-h-screen">
            <div class="my-auto">
                <img alt="Stanforte Edge - Staff Portal" class="-intro-x w-2/4 -mt-16"
                    src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
            </div>
        </div>
        <!-- END: Login Info -->
        <!-- BEGIN: Login Form -->
        <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
            <div
                class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                <div class="flex xl:hidden flex-col items-center">
                    <a href="" class="-intro-x  items-center pt-5 pb-2">
                        <img alt="Stanforte Edge - Staff Portal" class="w-32"
                            src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                    </a>

                </div>
                <h2 class="intro-x font-medium mt-4 pt-3 text-2xl xl:text-3xl text-center xl:text-left">
                    Staff Portal
                </h2>


                <div class="intro-x mt-8">
                    <form id="login-form" class="login-form" novalidate>
                        <input type="email" name="email" id="email"
                            class="intro-x login__input form-control py-3 px-4 block"
                            placeholder="your.name@stanforteedge.com" required pattern="[^@\s]+@stanforteedge\.com$">
                        <div class="text-danger text-xs mt-1 hidden" id="email-error">Please use your @stanforteedge.com
                            email</div>

                        <input type="password" name="password" id="password"
                            class="intro-x login__input form-control py-3 px-4 block mt-4" placeholder="Password"
                            required>
                        <div class="text-danger text-xs mt-1 hidden" id="password-error">Password is required</div>

                        <div class="intro-x flex text-slate-600 dark:text-slate-500 text-xs sm:text-sm mt-4">
                            <div class="flex items-center mr-auto">
                                <input type="checkbox" name="rememberme" id="rememberme" value="forever"
                                    class="form-check-input border mr-2">
                                <label for="rememberme" class="cursor-pointer select-none">Remember Me</label>
                            </div>
                            <a href="/forgot-password">Forgot Password?</a>
                        </div>
                        <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                            <button type="submit"
                                class="btn btn-primary py-3 px-4 w-full text-black xl:w-32 xl:mr-3 align-top relative">
                                <span class="btn-text">Log In</span>
                                <span class="btn-loading absolute inset-0 flex items-center justify-center hidden">
                                    <i data-loading-icon="oval" data-color="white" class="w-5 h-5"></i>
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                <div class="intro-x mt-10 xl:mt-24 text-slate-600 dark:text-slate-500 text-center xl:text-left"> By
                    signin up, you agree to our <a class="text-primary dark:text-slate-200" href="">Terms and
                        Conditions</a> & <a class="text-primary dark:text-slate-200" href="">Privacy Policy</a> </div>
            </div>
        </div>
        <!-- END: Login Form -->
    </div>
</div>
<script>
    jQuery(document).ready(function ($) {
        // Handle form submission
        $('#login-form').on('submit', function (e) {
            e.preventDefault();
            const form = $(this);
            const submitBtn = form.find('button[type="submit"]');
            const btnText = submitBtn.find('.btn-text');
            const btnLoading = submitBtn.find('.btn-loading');

            // Reset errors
            $('.text-danger').addClass('hidden');
            $('.login__input').removeClass('border-danger');

            // Show loading state
            btnText.addClass('invisible');
            btnLoading.removeClass('hidden');
            submitBtn.prop('disabled', true);

            // Get form data
            const formData = {
                email: $('#email').val().trim(),
                password: $('#password').val()
            };

            // Basic validation
            if (!formData.email.endsWith('@stanforteedge.com')) {
                showError('email', 'Please use your @stanforteedge.com email');
                resetFormState();
                return;
            }

            if (!formData.password) {
                showError('password', 'Password is required');
                resetFormState();
                return;
            }

            // Make API request
            $.ajax({
                url: '/wp-json/api/v1/auth/login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (response) {
                    console.log('Full login response:', response);
                    console.log('response.data:', response.data);
                    console.log('response.data.user:', response.data.user);
                    console.log('response.data.user.roles:', response.data.user ? response.data.user.roles : 'user not found');

                    if (response.success && response.data && response.data.tokens && response.data.tokens.access_token) {
                        localStorage.setItem('jwt_token', response.data.tokens.access_token);
                        if (response.data.tokens.refresh_token) {
                            localStorage.setItem('refresh_token', response.data.tokens.refresh_token);
                        }

                        // Set logged_in cookie for PHP to detect
                        document.cookie = 'logged_in=true; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

                        // Store user roles in cookie for PHP menu rendering
                        const userRoles = (response.data && response.data.user && response.data.user.roles) ? response.data.user.roles : [];
                        document.cookie = 'user_roles=' + JSON.stringify(userRoles) + '; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

                        showToast(response.data.message || 'Login successful!');

                        // Let auth.js handle the redirect after token is stored
                        setTimeout(function () {
                            window.location.reload();
                        }, 500);
                    } else {
                        showToast('Unexpected response from server', 'error');
                    }
                },
                error: function (xhr) {
                    let errorMessage = 'Login failed. Please try again.';
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage = xhr.responseJSON.error.message || errorMessage;
                    }
                    showToast(errorMessage, 'error');
                },
                complete: function () {
                    resetFormState();
                }
            });

            function resetFormState() {
                btnText.removeClass('invisible');
                btnLoading.addClass('hidden');
                submitBtn.prop('disabled', false);
            }

            function showError(field, message) {
                $('#' + field).addClass('border-danger');
                $('#' + field + '-error').text(message).removeClass('hidden');
            }
        });
    });
</script>

<?php get_footer(); ?>