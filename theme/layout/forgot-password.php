<?php /* Template Name: Forgot Password */ ?>


<?php

get_header();
$reset_key = $_GET['key'];
$login = $_GET['login'];

// check if the form has been submitted
if (isset($_POST['submit'])) {

    // get the user's email address
    $user_email = sanitize_email($_POST['user_email']);

    // check if a user with this email exists
    $user = get_user_by('email', $user_email);
    if (!$user) {
        // no user with this email was found
        // display an error message

        $reset_error = '                                
        <div class="alert alert-outline-danger alert-dismissible show flex items-center mb-2 mt-2" role="alert">
            <i data-lucide="alert-circle" class="w-6 h-6 mr-2"></i> No user with this email address was found.
            <button type="button" class="btn-close" data-tw-dismiss="alert" aria-label="Close">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>';
    } else {
        // a user with this email was found
        // generate a password reset key
        $reset_key = get_password_reset_key($user);

        // generate the password reset URL
        $reset_url = network_site_url("/forgot-password?action=rp&key=$reset_key&login=" . rawurlencode($user->user_login), 'login');

        // send an email to the user with the password reset link
        wp_mail($user_email, 'Password Reset', "Please click the following link to reset your password: $reset_url");

        // display a success message
        $reset_error = '<div class="alert alert-outline-success alert-dismissible show flex items-center mb-2 mt-2" role="alert">
            <i data-lucide="alert-circle" class="w-6 h-6 mr-2"></i> An email with a password reset link has been sent to your email address.
            <button type="button" class="btn-close" data-tw-dismiss="alert" aria-label="Close">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>';
    }
}

if (isset($_POST['reset'])) {

    // get the password reset key and login name from the URL


    // check if the reset key and login name are valid
    $user = check_password_reset_key($reset_key, $login);
    if (!$user || is_wp_error($user)) {
        // the key is invalid or has expired
        // display an error message
        $reset_error = '<div class="alert alert-outline-danger alert-dismissible show flex items-center mb-2 mt-2" role="alert">
        <i data-lucide="alert-circle" class="w-6 h-6 mr-2"></i>Invalid password reset key or login name.<button type="button" class="btn-close" data-tw-dismiss="alert" aria-label="Close">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
    </div>';
    } else {
        // the key is valid
        // get the new password from the form
        $new_password = sanitize_text_field($_POST['new_password']);

        // update the user's password
        reset_password($user, $new_password);

        // log the user in automatically
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID);

        // redirect the user to the dashboard
        wp_redirect(home_url('/home'));
        exit;
    }
}

?>

<body class="login">
    <div class="container sm:px-10">
        <div class="block xl:grid grid-cols-2 gap-4">
            <!-- BEGIN: Login Info -->
            <div class="hidden xl:flex flex-col min-h-screen">
                <a href="" class="-intro-x flex items-center pt-5">
                    <img alt="CYFI Application - Dashboard" class="w-6" src="https://application.carringtonfellows.org/wp-content/uploads/2023/02/CYFI-LOGO-ON-DARK-BG-TPN-1.png">
                    <span class="text-white text-lg ml-3"> Carrington Fellows</span>
                </a>
                <div class="my-auto">
                    <img alt="CYFI Application - Dashboard" class="-intro-x w-1/4 -mt-16" src="https://application.carringtonfellows.org/wp-content/uploads/2023/02/CYFI-LOGO-ON-DARK-BG-TPN-1.png">
                    <div class="-intro-x text-white font-medium text-2xl leading-tight mt-10">
                        Sign in to your<br>CYFI Dashboard.
                    </div>

                </div>
            </div>
            <!-- END: Login Info -->
            <!-- BEGIN: Forget Password Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x  items-center pt-5">
                            <img alt="Khairo Diet Clinic - Dashboard" class="w-20" src="https://dashboard.carringtonfellows.org/wp-content/uploads/2023/03/CYFI-LOGO-ON-WHITE-BG-TPN-copy.png">
                            <span class="text-black text-lg"> Carrington Fellows</span> </a>

                    </div>
                    <h2 class="intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left">
                        Forgot Password
                    </h2>

                    <?php echo $reset_error; ?>

                    <?php if ($reset_key && $login) : ?>
                        <!-- Reset Password -->
                        <form action="" method="post">
                            <div class="intro-x mt-8">
                                <input type="password" id="new_password " name="new_password" class="intro-x login__input form-control py-3 px-4 block" placeholder="New Password " />
                            </div>
                            <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                                <button name="reset" value="Reset Password" type="submit" class="btn btn-primary text-white py-3 px-4 w-full xl:w-32 xl:mr-3 align-top">Reset</button>
                                <a href="/login" class="btn btn-outline-primary py-3 px-4 w-full xl:w-32 mt-3 xl:mt-0 align-top">Get Reset Link</a>
                            </div>
                        </form>
                        <!-- Reset Password  End -->

                    <?php else : ?>
                        <!-- Get Reset Link  -->
                        <form action="" method="post">
                            <div class="intro-x mt-8">
                                <input type="email" id="user_email " name="user_email" class="intro-x login__input form-control py-3 px-4 block" placeholder="Email " />
                            </div>
                            <div class="intro-x mt-5 xl:mt-8 mb-3 text-center xl:text-left">
                                <button name="submit" value="Reset Password" type="submit" class="btn btn-primary py-3 px-4 w-full text-white xl:mr-3 align-top">Get Reset Link</button>
                                <a href="/login" class=" btn btn-outline-primary py-3 px-4 w-full xl:w-32 mt-3  align-center">Login </a>
                            </div>
                        </form>
                        <!-- Get Reset Link ENd -->
                    <?php endif; ?>
                </div>
            </div>
            <!-- END: Forget Password Form -->
        </div>
    </div>


    <?php get_footer(); ?>