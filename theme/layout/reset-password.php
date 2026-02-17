<?php /* Template Name: Reset Password */ ?>


<?php

 get_header();

 if ( isset( $_POST['submit'] ) ) {

    // get the password reset key and login name from the URL
    $reset_key = $_GET['key'];
    $login = $_GET['login'];

    // check if the reset key and login name are valid
    $user = check_password_reset_key( $reset_key, $login );
    if ( ! $user || is_wp_error( $user ) ) {
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
        $new_password = sanitize_text_field( $_POST['new_password'] );

        // update the user's password
        reset_password( $user, $new_password );

        // log the user in automatically
        wp_set_current_user( $user->ID );
        wp_set_auth_cookie( $user->ID );

        // redirect the user to the dashboard
        wp_redirect( home_url('/home') );
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
                        Sign in to manage your<br>CYFI Application.
                    </div>

                </div>
            </div>
            <!-- END: Login Info -->
            <!-- BEGIN: Forget Password Form -->
            <div class="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
                <div class="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
                    <div class="flex xl:hidden flex-col items-center">
                        <a href="" class="-intro-x  items-center pt-5">
                            <img alt="Khairo Diet Clinic - Dashboard" class="w-20" src="https://khairodiet.com/wp-content/uploads/2019/02/15590962_205804503160297_3349051207048072455_o-Recovered.png">
                            <span class="text-black text-lg"> Khairo Diet</span> </a>
                        
                    </div>
                    <h2 class="intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left">
                        Forgot Password
                    </h2>

                    <?php echo $reset_error; ?>





                    <div class="intro-x mt-8">
                        <form action="" method="post">
                            <input type="password" id="new_password " name="new_password" class="intro-x login__input form-control py-3 px-4 block" placeholder="New Password " />
                            
                    </div>
                    <div class="intro-x mt-5 xl:mt-8 text-center xl:text-left">
                        <button name="submit" value="Reset Password" type="submit" class="btn btn-primary text-white py-3 px-4 w-full xl:w-32 xl:mr-3 align-top">Reset</button>
                        <a href="Get Reset Link" class="btn btn-outline-primary py-3 px-4 w-full xl:w-32 mt-3 xl:mt-0 align-top">Get Reset Link</a>
                    </div>
                
                    </form>
                </div>
            </div>
            <!-- END: Forget Password Form -->
        </div>
    </div>


<?php get_footer(); ?>