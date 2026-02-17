<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode JSON data sent via AJAX
    $formData = json_decode(file_get_contents("php://input"), true);

    if ($formData) {
        $type = absint($formData['type']);
        $team = absint($formData['team']);
        $project = absint($formData['project']);
        $staff = absint($formData['staff']);
        $purpose = sanitize_text_field($formData['purpose']);
        $note = sanitize_text_field($formData['note']);
        $amount = absint($formData['amount']);
        $date = sanitize_text_field($formData['date']);
        $status = absint($formData['status']);
        $items = $formData['itemslist'];
        $from = $wpdb->get_row("SELECT a.first_name, a.email FROM staff_jet_cct_profiles a where a._ID = $staff ");
        if ($project >= 1) {
            $projectDetails = $wpdb->get_row("SELECT * FROM staff_jet_cct_projects a where a._ID = $project ");
        }

        $teamDetails = $wpdb->get_row("SELECT * FROM staff_jet_cct_teams a where a._ID = $team ");
        $requestType = $wpdb->get_row("SELECT a.name, a.code FROM staff_jet_cct_request_types a WHERE a.type = 1 AND a._ID = $type ");

        global $wpdb;

        $due_date = date('Y-m-d H:i:s', strtotime($date));

        $tablename = 'staff_jet_cct_requests_financial';
        $data = array(
            'type' => $type,
            'staff' => $staff,
            'due_date' => $due_date,
            'team' => $team,
            'project' => $project,
            'description' => $purpose,
            'amount' => $amount,
            'status' => $status,
            'note' => $note
        );
        $datatypes = array(
            '%s', '%d', '%s', '%d', '%d', '%s', '%d', '%d','%s'
        );
        $addrequest = $wpdb->insert($tablename, $data);
        $new_id = $wpdb->insert_id;
        if ($addrequest !== false) {
            $tablename2 = 'staff_jet_cct_financial_items';
            // Loop through each item in the items array
            foreach ($items as $index => $item) {
                // Access individual fields of each item
                $itemName = $item['item'];
                $itemQty = $item['qty'];
                $itemPrice = $item['price'];
                $itemIndex = $item['index'];

                $data2 = array(
                    'type' => 'request',
                    'item' => $itemName,
                    'quantity' => $itemQty,
                    'price' => $itemPrice,
                    'request' => $new_id,
                    'index_no' => $itemIndex
                );
                $additems = $wpdb->insert($tablename2, $data2);
            }

            if($status == 2){
                $teamlead = $wpdb->get_row("SELECT b.first_name, b.last_name, b.email FROM staff_jet_cct_team_members a INNER JOIN staff_jet_cct_profiles b ON a.staff = b._ID where a.team = $team AND a.team_status = 2");
                if ($teamlead) {
                    $to = $teamlead->email;
                    $toName = $teamlead->first_name . ''. $teamlead->last_name;
                    $subject = "New $requestType->name from Team Member";
                    $message = "<p>Hello $toName,</p>
                    <p>There is a new $requestType->name from your team member with the following details:'.</p>
                    <ul>
                    <li>Request: $requestType->code"."$new_id</li>
                    <li>Amount: ₦" . number_format($amount, 2) . " </li>
                    <li>Request By: $from->first_name $from->last_name</li>";
                    if ($projectDetails) {
                        $message .= "<li>Project: $projectDetails->name </li>";
                    }
                    $message .= "<li>Purpose: $purpose</li>
                    <li>Due Date:$date </li>
                    </ul>
                    <p>Please login to your portal to review and approve. Or click the button below:</p> 
                    <a href='https://staff.stanforteedge.com/team/requests/request/?id=$new_id'/><button>Approve</button></a>";
                    $sendmail = stanmail($from->email, $to, $subject, $message);
                } else {
                    $to = 'accounts@stanforteedge.com';
                    $toName = "Accounts";
                    $subject = "$requestType->code"."$new_id - New";
                    $message = "<p>Hello Accounts,</p>
                    <p>There is a new $requestType->name from  with the following details:'.</p>
                    <ul>
                    <li>Request: $requestType->code"."$new_id</li>
                    <li>Amount: ₦" . number_format($amount, 2) . " </li>
                    <li>Request By: $from->first_name $last_name</li>
                    <li>Team: $teamDetails->name</li>";
                    if ($projectDetails) {
                        $message .= "<li>Project: $projectDetails->name </li>";
                    }
                    $message .= "<li>Purpose: $purpose</li>
                    <li>Due Date: $date</li>
                    </ul>
                    <p>Please login to your portal to review and approve. Or click the button below:</p> 
                    <a class='btn' href='https://staff.stanforteedge.com/accounts/requests/request/?id=$new_id'/>Approve</a>";
                    $sendmail = stanmail($from->email, $to, $subject, $message);
                }
                if ($sendmail) {
                    $subject = "Your Request $requestType->code$new_id has been received.";
                    $message = "<p>Hello $from->first_name,</p>
                    <p>Your $requestType->name has been received. You can follow-up on your staff dashboard. </p>
                    <p>
                    <ul>
                        <li>Request: $requestType->code"."$new_id</li>
                        <li>Amount: ₦" . number_format($amount, 2) . " </li>
                        <li>Team: $teamDetails->name</li>";
                        if ($projectDetails) {
                            $message .= "<li>Project: $projectDetails->name </li>";
                        }
                        $message .= "<li>Purpose: $purpose</li>
                        <li>Due Date: $date</li>
                        </ul>
                    <a class='btn' href='https://staff.stanforteedge.com/requests/request/?id=$new_id'/>Dashboard</a></p>";
                    $sendmail = stanmail($from->email, $from->email, $subject, $message);
                    // Error retrieving JSON data
                    $response = array(
                        'success' => true,
                        'id' => $new_id,
                        'message' => 'Request has been sent.',
                    );
                }else{
                    // Error retrieving JSON data
                    $response = array(
                        'success' => true,
                        'message' => 'Request has been sent',
                        'id' => $new_id,
                    );
                }
            }
        } else {
            $response = array(
                'success' => false,
                'message' => 'Request was not added',
            );
        }
    } else {
        // Error retrieving JSON data
        $response = array(
            'success' => false,
            'error' => 'Failed to retrieve JSON data',
        );
    }

    // Output the response as JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    echo json_encode(array('error' => 'Invalid request!'));
}
