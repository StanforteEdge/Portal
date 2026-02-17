<?php /* Template Name: Staff: Profile - Settings */
?>

<?php
get_header();
$b_link = '/profile';
$b_title = 'Profile';
$p_title = 'Settings';

include get_template_directory() . "/layout/menu.php";
// Handle form submission
if (isset($_POST['submit_change_password'])) {
    $current_password = sanitize_text_field($_POST['current_password']);
    $new_password = sanitize_text_field($_POST['new_password']);
    $confirm_password = sanitize_text_field($_POST['confirm_password']);

    $errors = array();

    if (empty($current_password)) {
        $errors[] = 'Please enter your current password.';
    } else if (!wp_check_password($old_password, wp_get_current_user()->user_pass, $user_id)) {
        $errors[] = 'Your current password is incorrect.';
    }

    if (empty($new_password)) {
        $errors[] = 'Please enter your new password.';
    } else if (strlen($new_password) < 8) {
        $errors[] = 'Your new password must be at least 8 characters long.';
    }

    if (empty($confirm_password)) {
        $errors[] = 'Please confirm your new password.';
    } else if ($new_password !== $confirm_password) {
        $errors[] = 'Your new passwords do not match.';
    }

    if (!empty($errors)) {
         if (!empty($errors)){
             foreach ($errors as $error_message){
                $error = $error_message;
             }
            }
    } else {
        wp_set_password($new_password, $user_id);

        if (is_wp_error($update_user)) {
            $error = $update_user->get_error_message();
        }else{
            $success = "Your password has been changed successfully! ";
        }
    }
}


?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php"; ?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="grid grid-cols-12 gap-6">
            <!-- BEGIN: Bio -->
            <div id="jd" class="intro-y box col-span-12 2xl:col-span-6">
                <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-lg text-base mr-auto">Password Change</h2>
                </div>

                <div class="p-5 w-2/3">
                    <?php if ($errors) : ?>
                        <div class="alert alert-outline-danger alert-dismissible show flex items-center mb-2" role="alert"> <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i> <?= $error;?> <button type="button" class="btn-close bg-white border rounded" data-tw-dismiss="alert" aria-label="Close"> <i data-lucide="x" class="w-4 h-4"></i> </button> </div>
                    <?php  elseif($success):?>
                        <div class="alert alert-outline-success alert-dismissible show flex items-center mb-2" role="alert"> <i data-lucide="alert-triangle" class="w-6 h-6 mr-2"></i> <?= $success;?><button type="button" class="btn-close bg-white border rounded" data-tw-dismiss="alert" aria-label="Close"> <i data-lucide="x" class="w-4 h-4"></i> </button> </div>
                    <?php endif; ?>

                    <form method="post" action="<?php echo esc_url(get_permalink()); ?>" >
                        <div class="mt-3">
                            <label for="current_password">Current Password:</label>
                            <input class="form-control" type="password" name="current_password" id="current_password">
                        </div>
                        <div class="mt-3">
                            <label for="new_password">New Password:</label>
                            <input class="form-control" type="password" name="new_password" id="new_password"><br>
                        </div>
                        <div class="mt-3">
                            <label for="confirm_password">Confirm New Password:</label>
                            <input class="form-control" type="password" name="confirm_password" id="confirm_password"><br>
                        </div>
                        <div class="mt-3">
                            <input type="submit" class=" btn btn-primary" name="submit_change_password" value="Change Password">
                        </div>

                    </form>
                </div>

            </div>
            <!-- END: BIo -->

        </div>
    </div>
</div>

<?php get_footer(); ?>