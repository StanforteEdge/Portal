<?php /* Template Name: Auth: Forgot Password */ ?>

<?php get_header(); ?>

<body class="">
    <div class="container sm:px-10">
        <div class="block xl:grid grid-cols-2 gap-4">
            <!-- BEGIN: Forgot Password Info -->
            <div class="hidden xl:flex flex-col min-h-screen">
                <div class="my-auto">
                    <img alt="Stanforte Edge - Staff Portal" class="-intro-x w-2/4 -mt-16" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                </div>
            </div>
            <!-- END: Forgot Password Info -->
            <!-- BEGIN: Forgot Password Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x items-center pt-5 pb-2">
                            <img alt="Stanforte Edge - Staff Portal" class="w-32" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                        </a>
                    </div>
                    <h2 class="intro-x font-medium mt-4 pt-3 text-2xl xl:text-3xl text-center xl:text-left">
                        Forgot Password
                    </h2>
                    <div class="intro-x mt-8">
                        <form id="forgot-password-form" class="forgot-password-form" novalidate>
                            <input type="email" name="email" id="email" class="intro-x form-control" placeholder="your.name@stanforteedge.com" required>
                            <div class="text-danger text-xs mt-1 hidden" id="email-error">Please enter a valid @stanforteedge.com email</div>
                            <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                                <button type="submit" class="btn btn-primary  w-full text-black  relative">
                                    <span class="btn-text">Send Reset Link</span>
                                    <span class="btn-loading absolute inset-0 flex items-center justify-center hidden">
                                        <i data-loading-icon="oval" data-color="white" class="w-5 h-5"></i>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <!-- END: Forgot Password Form -->
        </div>
    </div>
    <?php get_footer(); ?>

    <script>
        jQuery(document).ready(function($) {
            $('#forgot-password-form').on('submit', function(e) {
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

                const email = $('#email').val().trim();

                // Validation
                if (!email || !email.includes('@stanforteedge.com')) {
                    showError('email', 'Please enter a valid @stanforteedge.com email');
                    resetFormState();
                    return;
                }

                // API call
                $.ajax({
                    url: '/wp-json/api/v1/auth/forgot-password',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: email
                    }),
                    success: function(response) {
                        showNotification.success(response.data?.message || 'If the email exists, a reset link has been sent.');
                    },
                    error: function(xhr) {
                        let errorMessage = 'Failed to send reset link.';
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