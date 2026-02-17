<?php
/*
Template Name: Register
*/

get_header();
$current_user = wp_get_current_user();
if (in_array('applicant', (array) $current_user->roles)) {
    re_direct(home_url('/home'));
    exit();
}


if (isset($_POST['signup'])) {
    $email = sanitize_email($_POST['email']);
    $password = $_POST['password'];
    $first_name = sanitize_text_field($_POST['first_name']);
    $last_name = sanitize_text_field($_POST['last_name']);
    $sex = sanitize_text_field($_POST['sex']);
    $team = intval($_POST['team']);
    $year = sanitize_text_field($_POST['year']);

    // Validate the email address
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error_message = "Invalid email address";
    } else {
        // Check if the email address is already in use
        $newuser = get_user_by('email', $email);
        
        if ($user) {
            $error_message = "Email address is already in use";
        } else {
            // Create the new user
            $user_id = wp_create_user($email, $password, $email);

            if (is_wp_error($user_id)) {
                // There was an error creating the user
                $error_message = $user_id->get_error_message();
            } else {
                // User was created successfully
                // Add user details to custom table
                global $wpdb;
                $table_name = $wpdb->prefix . 'jet_cct_profiles';
                $adduser = $wpdb->insert($table_name, array(
                    'user_id' => $user_id,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'sex' => $sex,
                    'year' => $year,
                    'team' => $team,
                ));

                update_user_meta($user_id, 'cyfi_user_level', false); // Store the confirmation key in user meta data

                $email2 = "hello@carringtonfellows.org";
                $subject2 = 'Confirm new CYFAN Member';
                $message2 = "There's a new Member registration. Please review and confirm.";

                $subject = 'Pending Approval - Carrington Fellows';
                $message = "Your account has been created and is being reviewed. You will be notified as soon as you are confirmed.";

                cyfi_email($email, $subject, $message );
                cyfi_email($email2, $subject2, $message2 );
                $error_message2 = "Your account has been created and is being reviewed. You will be notified as soon as you are confirmed.";
                
            }

           

            
        }
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
                        Sign up to manage your<br>CYFI Application.
                    </div>

                </div>
            </div>
            <!-- END: Login Info -->
            <!-- BEGIN: Login Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x  items-center pt-5">
                            <img alt="CYFI Application - Dashboard" class="w-20" src="https://application.carringtonfellows.org/wp-content/uploads/2023/02/CYFI-LOGO-ON-WHITE-BG-TPN.png">
                        </a>

                    </div>
                    <h2 class="intro-x font-bold text-2xl mt-4 xl:text-3xl text-center xl:text-left">
                        Create Account
                    </h2>
                    <div class="-intro-x text-black xl:text-left text-center leading-tight mb-4">
                        Sign up to manage your CYFI Application.
                    </div>

                    <?php if (!empty($error_message)) : ?>

                        <div class="alert mt-2 alert-outline-danger error     alert-dismissible show flex items-center mb-2" role="alert">
                            <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i><span><?php echo $error_message; ?>
                                </ul><button class="btn-close btn btn-outline-danger" data-tw-dismiss="alert" aria-label="Close" style="background:#fff; color:red;">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($error_message2)) : ?>
                        <div class="alert mt-2 alert-outline-success error     alert-dismissible show flex items-center mb-2" role="alert">
                            <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i><span><?php echo $error_message2; ?>
                                </ul><button class="btn-close btn btn-outline-success text-primary" data-tw-dismiss="alert" aria-label="Close" style="background:#fff; ">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                        </div>
                    <?php endif; ?>

                    <div class="intro-x mt-8">
                        <form method="post">
                            <input type="text" name="email" id="email" class="intro-x w-auto login__input input-form form-control py-3 px-4 block" placeholder="Email " required>
                            <input type="text" name="first_name" id="first_name" class="intro-x  w-auto form-control py-3 px-4  mt-1" placeholder="First Name " required>
                            <input type="text" name="last_name" id="last_name" class="intro-x mt-1 w-auto form-control py-3 px-4 " placeholder="Last Name " required>
                            <select name="sex" class="intro-x mt-1 w-auto input-form  login__input form-control py-3 px-4 " placeholder="Gender">
                                <option selected disabled>Select Sex</option>
                                <option value="Male" >Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <input type="number" name="year" id="year" class="intro-x mt-1    form-control w-auto py-3 px-4 " placeholder="CYFI Year " required>
                            <input type="text" name="team" id="team" class="intro-x mt-1    form-control py-3 w-auto px-4 " placeholder="CYFI Team " required>
                            <input type="password" name="password" id="password" class="intro-x mt-1  w-auto form-control py-3 px-4  " placeholder="Password" required>
                            <input type="password" name="con_password" id="con_password" class="intro-x mt-1  w-auto form-control py-3 px-4  " placeholder="Confirm Password" required>
                            <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                                <input id="submit_button" type="submit" name="signup" value="Create" class="btn btn-primary py-3 px-4 w-full text-black xl:w-32 xl:mr-3 align-top">
                                <a href="/login" class="btn btn-outline-primary py-3 px-4 w-full text-black xl:w-32 xl:mr-3 mt-2 xl:mt-0 align-top">Login</a>
                                <input type="hidden" name="redirect_to" value="<?php echo esc_url(home_url('/login')); ?>">
                                <?php wp_nonce_field('khairo-login-action', '_wpnonce'); ?>
                            </div>
                        </form>
                    </div>

                    <div class="intro-x mt-10 xl:mt-14 text-slate-600 dark:text-slate-500 text-center xl:text-left"> By signup up, you agree to our <a class="text-primary dark:text-slate-200" href="">Terms and Conditions</a> & <a class="text-primary dark:text-slate-200" href="">Privacy Policy</a> </div>
                </div>
            </div>

            <!-- END: Login Form -->
        </div>
    </div>
    <script>
        jQuery(document).ready(function($) {
            $('#password, #con_password').on('input', function() {
                if ($('#password').val() !== $('#con_password').val()) {
                    $('#con_password')[0].setCustomValidity('Passwords do not match');
                } else {
                    $('#con_password')[0].setCustomValidity('');
                }
            });

            $('#submit_button').on('click', function() {
                $('#password, #confirm_password').trigger('input');
            });
        });
    </script>
    <?php get_footer(); ?>