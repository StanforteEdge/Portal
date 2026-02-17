<?php /* Template Name:  Admin: Request - Add */
?>

<?php
get_header();
$b_link = '/admin/staffs';
$b_title = 'All Staff';
$p_title = 'New Staff';

include get_template_directory() . "/layout/menu.php";

if (isset($_POST['add_patient'])) {
    // Retrieve form data
    $password = wp_generate_password();
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $first_name = $_POST['first_name'];
    $last_name = $_POST['last_name'];
    $middle_name = $_POST['middle_name'];
    $staff_type = $_POST['staff_type'];
    $sex = $_POST['sex'];
    $dob = $_POST['dob'];
    $client_id = $_POST['client_id'];
    $unique_id = $_POST['unique_id'];
    $p_email = $_POST['p_email'];
    $address = $_POST['address'];

    global $wpdb;

    // Check if user already exists in WordPress
    $existing_user = get_user_by('email', $email);
    $user_profile_exists = false;

    if ($existing_user) {
        // User already exists in WordPress
        // Check if user has a corresponding record in the custom table
        $existing_profile = $wpdb->get_row("SELECT a._ID FROM staff_jet_cct_profiles a WHERE a.email = '$email' ");


        if ($existing_profile) {
            // User profile already exists
            $user_profile_exists = true;
  
        } else {
           
            // Add the custom field to the custom table
            $table_name = $wpdb->prefix . 'jet_cct_profiles';
            $addProfile = $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $existing_user->ID,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'email' => $email,
                    'class' => $patient_type,
                    'phone' => $phone,
                    'community' => $community,
                )
            );
        }
    } else {
        // Create the user
        $userdata = array(
            'user_login' => $email,
            'user_pass'  => $password,
            'user_email' => $email,
            'first_name' => $first_name,
            'last_name'  => $last_name,
            'role'       => 'patient'
        );
        $newUser_id = wp_insert_user($userdata);

        if (!is_wp_error($newUser_id)) {
            // User was created successfully
            $table_name = $wpdb->prefix . 'jet_cct_profiles';
            $addProfile = $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $newUser_id,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'email' => $email,
                    'class' => $patient_type,
                    'phone' => $phone,
                    'community' => $community,
                )
            );
        }
    }

    if (isset($addProfile)) {
        if ($addProfile) {
            // Send email to user with login details
            $to = $email;
            $subject = 'Khairo - Account Created';
            $message = 'Your profile has been added. Here are your login details:' . PHP_EOL;
            $message .= 'Username: ' . ($existing_user ? $existing_user->user_login : $userdata['user_login']) . PHP_EOL;
            $message .= 'Password: ' . ($existing_user ? $password : $userdata['user_pass']) . PHP_EOL;
            wp_mail($to, $subject, $message);
    
            // Notify info@khairodiet.com about the new user
            $admin_email = 'olalekan.owonikoko@gmail.com';
            $admin_subject = 'New Patient Added';
            $admin_message = 'A new patient has been created. Email: ' . $email . '. First Name:' . $first_name . 'Last Name: ' . $last_name;
            wp_mail($admin_email, $admin_subject, $admin_message);
    
            $success_message = 'Patient has been added successfully.';
            $error_message = 'Patient already exists.';
        } else {
            $error_message = 'Error adding patient.';
        }
    } else {
        $error_message = $existing_user ? 'Patient already exist.' : $newUser_id->get_error_message();
    }
    
    $error = '<div class="alert ' . (isset($success_message) ? 'alert-outline-success' : 'alert-outline-danger') . ' alert-dismissible show flex items-center mt-2 my-3" role="alert"> <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i>' . (isset($success_message) ? $success_message : $error_message) . '</div>';
    
}



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
        <form method="post">
            <div class="intro-y box p-5">
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label class="form-label" for="patient_type">Staff Type</label>
                        <select id="patient_type" class="form-select" name="patient_type">
                        <option disabled selected>Select</option>
                            <option value="2">Staff</option>
                            <option value="3">Intern</option>
                            <option value="4">NYSC</option>
                            <option value="5">Volunteer</option>
                            <option value="1">Management</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3 grid  hidden grid-cols-12 gap-2">
                    <div id="client_list" class="lg:col-span-6 col-span-12 hidden">
                        <label class="form-label" for="client_id" id="client_id_label">Patient Group</label>
                        <select id="client_id" class="form-select" name="client_id">
                        </select>
                    </div>
                    <div id="patient_no" class="lg:col-span-6 col-span-12 hidden">
                        <label class="form-label" for="patient_id" id="unique_id_label">Unique ID</label>
                        <input type="text" id="unique_id" class="form-control" placeholder="" aria-describedby="Unique ID" name="unique_id">
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
                        <input name="email" type="email" class="form-control" placeholder="" aria-describedby="email" required>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="p_email" class="form-label">Personal Email</label>
                        <input name="p_email" type="email" class="form-control" placeholder="" aria-describedby="p_email" required>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="phone" class="form-label">Phone</label>
                        <input name="phone" type="tel" class="form-control" placeholder="" aria-describedby="phone" required>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="a_phone" class="form-label">Other Phone</label>
                        <input name="a_phone" type="tel" class="form-control" placeholder="" aria-describedby="a_phone" required>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-12 gap-2">
                    <div class="lg:col-span-6 col-span-12">
                        <label for="sex" class="form-label">Sex</label>
                        <select id="patient_type" class="form-select" name="patient_type">
                        <option disabled selected>Select</option>
                            <option value="1">Male</option>
                            <option value="2">Female</option>
                        </select>
                    </div>
                    <div class="lg:col-span-6 col-span-12">
                        <label for="dob" class="form-label">Date of Birth</label>
                        <input name="dob" type="text" class="datepicker form-control" placeholder="" aria-describedby="dob" required>
                    </div>
                </div>
                <div class="text-right row mt-5">
                    <button type="submit" name="add_patient" class="btn btn-primary w-24">Add</button>
                </div>
            </div>
        </form>
        <!-- END: Form Layout -->
    </div>
</div>


<script>
    $(document).ready(function($) {


        $('#patient_type').on('change', function() {
            let patientClass = $(this).val();
            if (patientClass != 2) {
                $('#client_list').removeClass('hidden');
                $('#patient_no').removeClass('hidden');
            } else {
                $('#client_list').addClass('hidden');
                $('#patient_no').addClass('hidden');
            }
            $.ajax({
                url: 'https://dashboard.khairodiet.com/wp-json/jet-cct/user_group/',
                type: 'GET',
                data: {
                    class: patientClass
                },
                success: function(data) {
                    $.each(data, function(index, value) {
                        $('#client_id').html(" ");
                        $('#client_id').append(`<option>Select</option>`);
                        // do something with each value here 
                        $.each(data, function(index, item) {
                            $('#client_id').append(`<option value="${item._ID}">${item.name}</option>`);

                        });
                    });
                }
            });
        });
    });
</script>


<?php get_footer(); ?>