<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $status = $_POST['status'];
    $id = $_POST['id'];
    $to = $_POST['to'];
    $staff = $_POST['staff'];
    $message = $_POST['message'];
    $content = $_POST['content'];
    $subject = $_POST['subject'];
    $approveMsg = $_POST['approve-msg'];

    // $requestMail = $wpdb->get_row("SELECT a.message_id, a.subject FROM staff_wpmailsmtp_emails_log a WHERE a.subject LIKE '%$id%' ");

    $tablename = "staff_jet_cct_requests_financial";
    $update = $wpdb->update('staff_jet_cct_requests_financial', array('status' => $status), array('_ID' => $id));

    if ($update) {
        $tablename2 = "staff_jet_cct_request_financial_approval";
        $data2 = array(
            'request' => $id,
            'staff' => $staff,
            'status' => $status,
        );
        $approved = $wpdb->insert($tablename2, $data2);
        if ($approved && !empty($to)) {
            $sendmail = stanmail('accounts@stanforteedge.com', $to, $subject, $content);

            $response = array(
                'success' => true,
                'message' => $approveMsg ? $approveMsg : " Sent",
                'id' => $id
            );
        }
        if (isset($_FILES['paymentFile'])) {
            $file = $_FILES['paymentFile'];
            if (!empty($file['name'])) {
                
                // Get the uploaded file information
                $file_name = $file['name'];
                $file_size = $file['size'];
                $file_tmp = $file['tmp_name'];
                $file_type = $file['type'];
                $file_ext = strtolower(end(explode('.', $file['name'])));

                // Check if the file type is valid
                $valid_extensions = array("jpg", "jpeg", "png", "pdf");
                if (in_array($file_ext, $valid_extensions) === false) {
                    $response = array(
                        'success' => false,
                         'message' => 'Error: Invalid file extension. Allowed extensions: jpg, jpeg, png.'
                     );
                } else {
                    // Check if the file size is valid (less than 2MB)
                    if ($file_size > 2097152) {
                        $response = array(
                            'success' => false,
                             'message' => 'Error: File size must be less than 2MB.'
                         );
                        exit();
                    } else {
                        // Generate a unique name for the uploaded file
                        $new_file_name = uniqid() . '.' . $file_ext;

                        // Upload the file to the WordPress media library
                        $upload_dir = wp_upload_dir();
                        $upload_path = $upload_dir['path'] . '/' . $new_file_name;
                        move_uploaded_file($file_tmp, $upload_path);

                        if ($upload_dir) {
                            // Save the URL of the uploaded file to a custom table
                            global $wpdb;
                            $table_name = $wpdb->prefix . "jet_cct_files";
                            $wpdb->insert(
                                $table_name,
                                array(
                                    'url' => $upload_dir['url'] . '/' . $new_file_name,
                                    'type' => 1,
                                    'row_id' => $id,
                                    'staff' => $staff->_ID  // Assuming user_id is a field in your table
                                )
                            );
                        }else{
                            $response = array(
                                'success' => false,
                                 'message' => 'didnt upload'
                             );
                        }
                    }
                }
            }else{
                $response = array(
                    'success' => True,
                     'message' => 'No name',
                 );
            }
            
        }
        if (empty($message)) {
        } else {
            $tablename3 = "staff_jet_cct_request_financial_comment";
            $data3 = array(
                'request' => $id,
                'staff' => $staff,
                'comment' => $message,
            );
            $wpdb->insert($tablename3, $data3);
        }
        $response = array(
            'success' => true,
            'message' => 'Approved',
            'id' => $id
        );
    } else {
        $response = array(
            'success' => false,
            'message' => 'Not approved',
            'id' => $id
        );
    }

    // Output the response as JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    echo json_encode(array('error' => 'Invalid request!'));
}
