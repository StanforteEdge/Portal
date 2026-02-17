<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the JSON data sent from the client-side
    $json_data = file_get_contents('php://input');

    // Check if the JSON data was successfully retrieved
    if ($json_data !== false) {
        // Decode the JSON data into an associative array
        $form_data = json_decode($json_data, true);
        // Check if the JSON data was successfully decoded
        if ($form_data !== null) {
            // Sanitize input using WordPress functions
            $position = sanitize_text_field($form_data['position']);
            $summary = wp_kses_post($form_data['summary']);
            $responsibility = wp_kses_post($form_data['responsibility']);
            $qualifications = wp_kses_post($form_data['qualifications']);
            $additional = wp_kses_post($form_data['additional']);
            $status = isset($form_data['status']) ? absint($form_data['status']) : 1;
            $ID = isset($form_data['ID']) ? absint($form_data['ID']) : null;

            // Assume you have a custom database table named 'staff_jet_cct_job_descriptions'
            global $wpdb;
            $table_name = $wpdb->prefix . 'jet_cct_job_descriptions';
            $data = array(
                'position' => $position,
                'summary' => $summary,
                'responsibility' => $responsibility,
                'qualifications' => $qualifications,
                'additional' => $additional,
                'status' => $status
            );
            $data_types = array('%s', '%s', '%s', '%s', '%s', '%d');

            // Perform database operation
            if (!empty($ID)) {
                // Update existing job description
                $update_result = $wpdb->update($table_name, $data, array('_ID' => $ID), $data_types, array('%d'));
                if ($update_result !== false) {
                    $response = array(
                        'success' => true,
                        'message' => 'Updated Succesfully',
                    );
                } else {
                    $response = array(
                        'success' => false,
                        'message' => 'Failed to update',
                    );
                }
            } else {
                // Insert new job description
                $insert_result = $wpdb->insert($table_name, $data, $data_types);
                if ($insert_result !== false) {
                    $last_inserted_id = $wpdb->insert_id;
                    $response = array(
                        'success' => true,
                        'message' => 'Added successfully',
                        'redirect_url' => '/admin/jds/view/?id=' . $last_inserted_id,
                    );
                } else {
                    $response = array(
                        'success' => false,
                        'message' => 'Failed to add',
                    );
                }
            }

            // Output the response as JSON
            $response = array(
                'success' => true,
                'message' => 'Form data processed successfully',
            );

        } else {
            // Error decoding JSON data
            $response = array(
                'success' => false,
                'error' => 'Failed to decode JSON data',
            ); 
        }
    } else {
        // Error retrieving JSON data
        $response = array(
            'success' => false,
            'error' => 'Failed to retrieve JSON data',
        );
    }
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    // Invalid request method
    $response = array(
        'success' => false,
        'error' => 'Invalid request method',
    );
    header('Content-Type: application/json');
    echo json_encode($response);
}
?>
