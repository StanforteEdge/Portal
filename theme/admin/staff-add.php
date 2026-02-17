<?php /* Template Name:  Admin: Staff - New */
?>

<?php
get_header();
$b_link = '/admin/staffs';
$b_title = 'All Staff';
$p_title = 'New Staff';

include get_template_directory() . "/layout/menu.php";
$teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
$staffTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_staff_types");

// if (isset($_POST['add_patient'])) {
//     // Retrieve form data
//     $password = wp_generate_password();
//     $email = $_POST['email'];
//     $phone = $_POST['phone'];
//     $first_name = $_POST['first_name'];
//     $last_name = $_POST['last_name'];
//     $middle_name = $_POST['middle_name'];
//     $staff_type = $_POST['staff_type'];
//     $sex = $_POST['sex'];
//     $dob = $_POST['dob'];
//     $client_id = $_POST['client_id'];
//     $unique_id = $_POST['unique_id'];
//     $p_email = $_POST['p_email'];
//     $address = $_POST['address'];

//     global $wpdb;

//     // Check if user already exists in WordPress
//     $existing_user = get_user_by('email', $email);
//     $user_profile_exists = false;

//     if ($existing_user) {
//         // User already exists in WordPress
//         // Check if user has a corresponding record in the custom table
//         $existing_profile = $wpdb->get_row("SELECT a._ID FROM staff_jet_cct_profiles a WHERE a.email = '$email' ");


//         if ($existing_profile) {
//             // User profile already exists
//             $user_profile_exists = true;
//         } else {

//             // Add the custom field to the custom table
//             $table_name = $wpdb->prefix . 'jet_cct_profiles';
//             $addProfile = $wpdb->insert(
//                 $table_name,
//                 array(
//                     'user_id' => $existing_user->ID,
//                     'first_name' => $first_name,
//                     'last_name' => $last_name,
//                     'email' => $email,
//                     'class' => $patient_type,
//                     'phone' => $phone,
//                     'community' => $community,
//                 )
//             );
//         }
//     } else {
//         // Create the user
//         $userdata = array(
//             'user_login' => $email,
//             'user_pass'  => $password,
//             'user_email' => $email,
//             'first_name' => $first_name,
//             'last_name'  => $last_name,
//             'role'       => 'patient'
//         );
//         $newUser_id = wp_insert_user($userdata);

//         if (!is_wp_error($newUser_id)) {
//             // User was created successfully
//             $table_name = $wpdb->prefix . 'jet_cct_profiles';
//             $addProfile = $wpdb->insert(
//                 $table_name,
//                 array(
//                     'user_id' => $newUser_id,
//                     'first_name' => $first_name,
//                     'last_name' => $last_name,
//                     'email' => $email,
//                     'class' => $patient_type,
//                     'phone' => $phone,
//                     'community' => $community,
//                 )
//             );
//         }
//     }

//     if (isset($addProfile)) {
//         if ($addProfile) {
//             // Send email to user with login details
//             $to = $email;
//             $subject = 'Khairo - Account Created';
//             $message = 'Your profile has been added. Here are your login details:' . PHP_EOL;
//             $message .= 'Username: ' . ($existing_user ? $existing_user->user_login : $userdata['user_login']) . PHP_EOL;
//             $message .= 'Password: ' . ($existing_user ? $password : $userdata['user_pass']) . PHP_EOL;
//             wp_mail($to, $subject, $message);

//             // Notify info@khairodiet.com about the new user
//             $admin_email = 'olalekan.owonikoko@gmail.com';
//             $admin_subject = 'New Patient Added';
//             $admin_message = 'A new patient has been created. Email: ' . $email . '. First Name:' . $first_name . 'Last Name: ' . $last_name;
//             wp_mail($admin_email, $admin_subject, $admin_message);

//             $success_message = 'Patient has been added successfully.';
//             $error_message = 'Patient already exists.';
//         } else {
//             $error_message = 'Error adding patient.';
//         }
//     } else {
//         $error_message = $existing_user ? 'Patient already exist.' : $newUser_id->get_error_message();
//     }

//     $error = '<div class="alert ' . (isset($success_message) ? 'alert-outline-success' : 'alert-outline-danger') . ' alert-dismissible show flex items-center mt-2 my-3" role="alert"> <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i>' . (isset($success_message) ? $success_message : $error_message) . '</div>';
// }

?>


<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Add Staff
    </h2>
</div>
<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 lg:col-span-8">
        <!-- BEGIN: Form Layout -->
        <div class=mt-2><?php echo $error; ?></div>
        <form method="post" id="add_staff_form">
            <div class="intro-y box p-5">
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label class="form-label" for="staff_type">Staff Type</label>
                        <select id="staff_type" class="form-select" name="staff_type" required>
                            <option disabled selected>Select</option>
                            <?php foreach ($staffTypes as $staffType) : ?>
                                <option value="<?= $staffType->_ID; ?>"><?= $staffType->name; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="staff_team" class="form-label">Team</label>
                        <select id="staff_team" class="form-select" name="staff_team" required>
                            <option disabled selected>Select</option>
                            <?php foreach ($teams as $team) : ?>
                                <option value="<?= $team->_ID; ?>"><?= $team->name; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="staff_team" class="form-label">Role</label>
                        <select id="staff_team" class="form-select" name="staff_team" required>
                            <option disabled selected>Select</option>
                            <?php foreach ($teams as $team) : ?>
                                <option value="<?= $team->_ID; ?>"><?= $team->name; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" name="first_name" class="form-control" placeholder="" aria-describedby="first_name" required>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input name="last_name" type="text" class="form-control" placeholder="" aria-describedby="last_name" required>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="email" class="form-label">Official Email</label>
                        <input id="email" name="email" type="email" class="form-control" placeholder="" aria-describedby="email" required>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="personal_email" class="form-label">Personal Email</label>
                        <input name="personal_email" type="email" class="form-control" placeholder="" aria-describedby="personal_email" >
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="phone" class="form-label">Phone</label>
                        <input name="phone" type="tel" class="form-control" placeholder="" aria-describedby="phone" required>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="phone_2" class="form-label">Other Phone</label>
                        <input name="phone_2" type="tel" class="form-control" placeholder="" aria-describedby="phone_2" >
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="sex" class="form-label">Sex</label>
                        <select id="sex" class="form-select" name="sex" required>
                            <option disabled selected>Select</option>
                            <option value="1">Male</option>
                            <option value="2">Female</option>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="dob" class="form-label">Date of Birth</label>
                        <input name="dob" type="text" data-single-mode="true" class="datepicker form-control" aria-describedby="dob" >
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-12 col-span-12">
                        <label for="address" class="form-label">Address</label>
                        <textarea name="address" class="form-control" rows="3" placeholder="Enter residential address"></textarea>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="state" class="form-label">State</label>
                        <select name="state" class="form-select" required>
                            <option value="" selected disabled>Select State</option>
                            <?php 
                            $states = array('Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara');
                            foreach($states as $state): ?>
                                <option value="<?= $state ?>"><?= $state ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="lga" class="form-label">LGA</label>
                        <input name="lga" type="text" class="form-control" placeholder="Enter LGA">
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="education" class="form-label">Highest Education</label>
                        <select name="education" class="form-select" required>
                            <option value="" selected disabled>Select Education Level</option>
                            <option value="High School">High School</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Bachelor">Bachelor's Degree</option>
                            <option value="Masters">Master's Degree</option>
                            <option value="PhD">PhD</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="employment_date" class="form-label">Employment Date</label>
                        <input name="employment_date" type="text" data-single-mode="true" class="datepicker form-control" required>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-12 col-span-12">
                        <label for="skills" class="form-label">Skills & Expertise</label>
                        <textarea name="skills" class="form-control" rows="3" placeholder="Enter key skills and expertise"></textarea>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-12 col-span-12">
                        <label for="bio" class="form-label">Brief Bio</label>
                        <textarea name="bio" class="form-control" rows="3" placeholder="Enter a brief bio"></textarea>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <div class="form-check form-switch">
                            <input id="welcome" name="welcome" class="form-check-input" type="checkbox"> <label class="form-check-label" for="welcome">Send Welcome Email</label>
                        </div>
                    </div>
                </div>
                <div class="lg:col-span-6 hidden col-span-12">
                    <div class="form-check form-switch">
                        <input id="checkbox-switch-7" class="form-check-input" type="checkbox"> <label class="form-check-label" for="checkbox-switch-7">Default switch checkbox input</label>
                    </div>
                </div>
                <div class="text-right row mt-5">
                <button type="submit" class="btn btn-primary w-24">Add Staff</button>
            </div>
            </div>
            
        </form>
        <!-- END: Form Layout -->
    </div>
</div>

<!-- BEGIN: Notification Content -->
<div id="staff-add-notification" class="toastify-content hidden items-center flex flex-col sm:flex-row">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="alert-octagon" data-lucide="alert-octagon" class="lucide lucide-alert-octagon text-black block mr-2">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <div id="staff-add-content" class='font-normal'></div>

</div>
<script>
    $(document).ready(function($) {


        $('#add_staff_form').submit(function(e) {
            e.preventDefault(); // Prevent the default form submission
            // Gather form data
            var formData = $(this).serialize();
            // Send the data via AJAX
            console.log(formData);

            $.ajax({
                url: '/wp-content/themes/stanforte/forms/add-staff.php',
                method: 'POST',
                data: formData,
                dataType: 'json', // Expect JSON response
                success: function(response) {
                    if (response.success) {
                        $("#staff-add-content").removeClass('text-danger').addClass('text-success').html(response.message);
                        $('#add_staff_form')[0].reset();
                        Toastify({
                            node: $("#staff-add-notification").clone().removeClass("hidden")[0],
                            duration: 3000,
                            newWindow: true,
                            close: true,
                            gravity: "top",
                            position: "right",
                            stopOnFocus: true,
                        }).showToast();
                        
                    } else {
                        $("#staff-add-content").removeClass('text-success').addClass('text-danger').html(response.error);
                        Toastify({
                            node: $("#staff-add-notification").clone().removeClass("hidden")[0],
                            duration: 3000,
                            newWindow: true,
                            close: true,
                            gravity: "top",
                            position: "right",
                            stopOnFocus: true,
                        }).showToast();
                    }

                },
                error: function(err) {
                    console.error(err);
                }
            });
        });
    });
</script>


<?php get_footer(); ?>