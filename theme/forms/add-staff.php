<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve the form data sent via AJAX
    $form_data = $_POST; // Access the form data as an associative array

    // Access other form field values from $form_data array
    $type = sanitizeNonHTMLInput($_POST['staff_type']);
    $first_name = sanitizeNonHTMLInput($_POST['first_name']);
    $last_name = sanitizeNonHTMLInput($_POST['last_name']);
    $email = sanitizeNonHTMLInput($_POST['email']);
    $email_personal = sanitizeNonHTMLInput($_POST['email_personal']);
    $phone = sanitizeNonHTMLInput($_POST['phone']);
    $phone2 = sanitizeNonHTMLInput($_POST['phone2']);
    $sex = sanitizeNonHTMLInput($_POST['sex']);
    $dob = sanitizeNonHTMLInput($_POST['dob']);
    $team = sanitizeNonHTMLInput($_POST['staff_team']);
    $welcome = sanitizeNonHTMLInput($_POST['welcome']);

    // Assume you have a custom database table named 'custom_notes'
    global $wpdb;

    $pattern = "/^[^@]+@stanforteedge\.com$/";
    if (preg_match($pattern, $email)) {
        $user = get_user_by('email', $email);
        if ($user) {
            $staff = $wpdb->get_row("SELECT * FROM staff_jet_cct_profiles a WHERE a.email = '$email' ");
            if ($staff) {
                $error_message = "A staff with this Email Address already exist.";
            } else {
                $user_id = $staff->user_id;
            }
        } else {
            // Create the new user
            $user_id = wp_create_user($email, $password, $email);
            if (is_wp_error($user_id)) {
                // There was an error creating the user
                $error_message = $user_id->get_error_message();
            } else {
                wp_update_user(array('ID' => $user_id, 'role' => 'author'));
            }
        }
    } else {
        $error_message =  'Invalid email address. Email Must be a Stanforte Edge Email';
    }
    if (!empty($user_id)) {
        $table_name = 'staff_jet_cct_profiles';
        $data = array(
            'type' => $type,
            'user_id' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'email' => $email,
            'email_personal' => $email_personal,
            'phone' => $phone,
            'phone_2' => $phone2,
            'sex' => $sex,
            'status' => 1
        );
        $data_types = array(
            '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d'
        );
        // User was created successfully
        $addUser = $wpdb->insert($table_name, $data, $data_types);
        $addUser_id = $wpdb->insert_id;
        if ($addUser && $welcome) {
            $subject = 'Welcome to Stanforte Edge Staff Portal';
            $message = 'Welcome to Stanforte Edge Staff Portal. Please click the following link to confirm your email address: ';
            $sentmail = stan_email('admin@stanforteedge.com', $email, $subject, $message); // Send the confirmation email
            exit;
        } // Prepare a response
    }

    if ($addUser_id) {
        // if ($team) {
        //     $team_table = 'staff_jet_cct_team_members';
        //     $team_data= array(
        //         'member' => $addUser_id,
        //         'team' => $team,
        //     );
        //     $data_types2 = array(
        //         '%d', '%d'
        //     );
        //     $addTeam = $wpdb->insert($team_table, $team_data, $data_types2);
        //     if ($addTeam) {
        //         $success = "Team Added";
        //     }
        // } else {
        //     $success = "New User was created and then added as a staff";
        // }

        $response = array(
            'success' => true,
            'message' => $success,
        );
    } else {
        // Prepare a response
        $response = array(
            'success' => false,
            'error' => $error_message
        );
    }

    // Output the response as JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    echo json_encode(array('error' => 'Invalid request!'));
}



function sanitizeNonHTMLInput($input)
{
    // Remove leading and trailing whitespaces
    $input = trim($input);
    // Additional validation or sanitation if needed for non-HTML fields
    return $input;
}
