<?php /* Template Name: Login */ ?>

<?php
global $wpdb;
$user = wp_get_current_user();
if (is_user_logged_in()) {
    re_direct(home_url('/home'));
    exit();
}

if (!is_user_logged_in()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
        $username = $_POST['username'];
        $password = $_POST['password'];

        $pattern = '/@stanforteedge\.com$/';

        if (preg_match($pattern, $username)) {
            $user = wp_authenticate($username, $password);

            if (is_wp_error($user)) {
                $error = $user->get_error_message();
            } else {
                $userConfirm = get_user_meta($user->ID, 'staff_confirmed', true);
                if ($userConfirm == 1) {
                    wp_set_auth_cookie($user->ID);
                    if (in_array('admin', (array) $user->roles)) {
                        re_direct(home_url('/admin'));
                        exit();
                    } else {
                        re_direct(home_url('/home'));
                        exit();
                    }
                } else {
                    $error = "Your account has not been approved. Please contact the IT Support";
                }
            }
        } else {
            $error =  "Only authorized emails are accepted";
        }
    }
}

get_header();




if (isset($_GET['login']) && $_GET['login'] == 'failed') {
    $error = '<div class="alert alert-outline-danger alert-dismissible show flex items-center mb-2" role="alert">
    <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i> Invalid email or password
    <button type="button" class="btn-close btn-primary" data-tw-dismiss="alert" aria-label="Close" style="background-color:white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="x" data-lucide="x" class="lucide lucide-x block mx-auto"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
</div>';
}

?>


<body class="login">
    <div class="container sm:px-10">
        <div class="block xl:grid grid-cols-2 gap-4">
            <!-- BEGIN: Login Info -->
            <div class="hidden xl:flex flex-col min-h-screen">
                <div class="my-auto">
                    <img alt="Stanforte Edge - Staff Portal" class="-intro-x w-2/4 -mt-16" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                </div>
            </div>
            <!-- END: Login Info -->
            <!-- BEGIN: Login Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x  items-center pt-5 pb-2">
                            <img alt="Stanforte Edge - Staff Portal" class="w-48" src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                        </a>

                    </div>
                    <h2 class="intro-x font-medium mt-4 pt-3 text-2xl xl:text-3xl text-center xl:text-left">
                        Staff Portal
                    </h2>

                    <?php if ($error) : ?>
                        <div class="mt-2">
                            <div class="alert alert-outline-danger alert-dismissible show flex items-center justify-between mb-2" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="alert-octagon" data-lucide="alert-octagon" class="lucide lucide-alert-octagon block mr-2">
                                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span><?php echo $error; ?></span>
                                <button type="button" class="btn-close " data-tw-dismiss="alert" aria-label="Close" style="background-color: #ffffff;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="x" data-lucide="x" class="lucide text-danger lucide-x block mx-auto">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    <?php endif; ?>
                    <div class="intro-x mt-8">
                        <form action="<?php echo esc_url(home_url($_SERVER['REQUEST_URI'])); ?>" method="post">
                            <input type="text" name="username" id="username" class="intro-x login__input form-control py-3 px-4 block" placeholder="Email">
                            <input type="password" name="password" id="password" class="intro-x login__input form-control py-3 px-4 block mt-4" placeholder="Password">
                            <div class="intro-x flex text-slate-600 dark:text-slate-500 text-xs sm:text-sm mt-4">
                                <div class="flex items-center mr-auto">
                                    <input type="checkbox" name="rememberme" id="rememberme" value="forever" class="form-check-input border mr-2">
                                    <label for="rememberme" class="cursor-pointer select-none">Remember Me</label>
                                </div>
                                <a href="/forgot-password">Forgot Password?</a>
                            </div>
                            <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                                <button type="submit" name="login" class="btn btn-primary py-3 px-4 w-full text-black xl:w-32 xl:mr-3 align-top">Log In</button>
                            </div>
                        </form>
                    </div>

                    <div class="intro-x mt-10 xl:mt-24 text-slate-600 dark:text-slate-500 text-center xl:text-left"> By signin up, you agree to our <a class="text-primary dark:text-slate-200" href="">Terms and Conditions</a> & <a class="text-primary dark:text-slate-200" href="">Privacy Policy</a> </div>
                </div>
            </div>

            <!-- END: Login Form -->
        </div>
    </div>
    <?php get_footer(); ?>