<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'];
    $to = $_POST['to'];
    $staff = $_POST['staff'];
    $content = $_POST['content'];

    $data = array(
        'request' => $id,
        'staff' => $staff,
        'comment' => $comment,
    );

    $sent = $wpdb->insert('staff_jet_cct_request_financial_comment', $data);

    if ($sent) {
        $sendmail = stanmail('accounts@stanforteedge.com', $to, $subject, $content);
        $response = array(
            'success' => true,
            'message' => " Message Sent",
            'id' => $id
        );
    } 

    // Output the response as JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    echo json_encode(array('error' => 'Invalid request!'));
}
