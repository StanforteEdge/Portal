<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $form = sanitize_text_field($_POST['form']);
    $type = absint($_POST['type']);
    $team = absint($_POST['team']);
    $project = absint($_POST['project']);
    $staff = absint($_POST['staff']);
    $purpose = sanitize_text_field($_POST['purpose']);
    $note = sanitize_text_field($_POST['note']);
    $amount = floatval(sanitize_text_field($_POST['amount']));
    $date = sanitize_text_field($_POST['date']);
    $approvedby = absint($_POST['approvedby']);
    $status = absint($_POST['status']);
    $itemData = json_decode(stripslashes($_POST['items']), true); // Decode and sanitize items data

    $requestby = $wpdb->get_row("SELECT a.first_name, a.last_name, a.email FROM staff_jet_cct_profiles a where a._ID = $staff ");
    if ($project >= 1) {
        $projectDetails = $wpdb->get_row("SELECT * FROM staff_jet_cct_projects a where a._ID = $project ");
    }

    $teamDetails = $wpdb->get_row("SELECT * FROM staff_jet_cct_teams a where a._ID = $team ");
    $teamlead = $wpdb->get_row("SELECT b.first_name, b.last_name, b.email FROM staff_jet_cct_team_members a INNER JOIN staff_jet_cct_profiles b ON a.staff = b._ID where a.team = $team AND a.team_status = 2");
    $requestType = $wpdb->get_row("SELECT a.name, a.code, a.approval FROM staff_jet_cct_request_types a WHERE a.type = 1 AND a._ID = $type ");

    global $wpdb;

    $due_date = $date;
    $tablename = '              ';

    if ($form == 'request') {
        $reimburse = absint($_POST['reimburse']);
        $category = absint($_POST['category']);
        $data = array(
            'type' => $type,
            'staff' => $staff,
            'due_date' => $due_date,
            'team' => $team,
            'project' => $project,
            'description' => $purpose,
            'amount' => $amount,
            'status' => $status,
            'note' => $note,
            'category' => $category,
            'reimburse' => $reimburse
        );
        $datatypes = array(
            '%s', '%d', '%s', '%d', '%d', '%s', '%d', '%d', '%s'
        );
        $addrequest = $wpdb->insert($tablename, $data);
        $request = $wpdb->insert_id;
        if (!empty($request)) {
            $tablename2 = 'staff_jet_cct_financial_items';
            // Loop through each item in the items array

            // $uploadedFi = [];

            foreach ($itemData as $index => $rowData) {
                $item = sanitize_text_field($rowData['item']); // Sanitize item
                $qty = absint($rowData['qty']); // Sanitize quantity
                $price = floatval(sanitize_text_field($rowData['price'])); // Sanitize price
                $cashAdvance = sanitize_text_field($rowData['cash-advance']); // Sanitize price
                $account = sanitize_text_field($rowData['account']); // Sanitize price
                $data2 = array(
                    'type' => 'request',
                    'item' => $item,
                    'quantity' => $qty,
                    'price' => $price,
                    'request' => $request,
                    'index_no' => $index,
                    'cash' => $cashAdvance,
                    'account' => $account,
                );
                $additem = $wpdb->insert($tablename2, $data2);
                $itemId = $wpdb->insert_id;

                // // Handle file uploads for the current item index
                if (!empty($_FILES['files']['name'][$index])) {
                    // $fileMsg = 'File Not empty';
                    $fileCount = count($_FILES['files']['name'][$index]);
                    // $uploadedFi[] = $index .'-File Count: ' . $fileCount;
                    for ($i = 0; $i < $fileCount; $i++) {
                        $uploadedFi[] = $index . '-File Count Index: ' . $i;
                        $uploadedFile = $_FILES['files'];
                        $tmpName = $uploadedFile['tmp_name'][$index][$i];
                        $fileName = $uploadedFile['name'][$index][$i];

                        // Rename the file with the value of $request
                        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
                        $newFileName = 'request-' . $request . '-' . $itemId . '_' . $i . '(' . $fileName . ').' . $fileExtension;
                        // $uploadedFi[] = $index .'-File New Name: ' . $newFileName;

                        // Use WordPress upload functions
                        $wp_upload_dir = wp_upload_dir();
                        $uploadDir = $wp_upload_dir['path'];
                        $destination = $uploadDir . '/' . $newFileName;
                        // $uploadedFi[] = $index .'-File Destination: ' . $destination;

                        if (move_uploaded_file($tmpName, $destination)) {


                            // Generate relative file URL based on WordPress upload directory
                            $fileUrl = str_replace(ABSPATH, site_url('/'), $destination);
                            // $uploadedFi[] = $index .'-File Url: ' . $fileUrl;

                            // Insert file data into staff_jet_cct_files
                            $fileData = array(
                                'type' => 'request',
                                'row_id' => $itemId,
                                'staff' => $staff,
                                'url' => $fileUrl,
                                'request' => $request
                            );

                            $addfile = $wpdb->insert('staff_jet_cct_files', $fileData);
                        }
                    }
                } else {
                    $message = 'No file found';
                }
            }

            if ($status === 1) {
                $subject = 'Request: ' . $requestType->code .  $request . ' - Draft';
                $content = '<p>Your ' . $requestType->name . ' has been saved as draft.</p>
                <p>Login to your dashboard to edit or send.</p>
                <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message .= " Your request has been saved.";
            } elseif ($status === 2) {
                //Send notification to staff
                $subject = 'Request: ' . $requestType->code . $request . ' - Sent';
                $content = '<p>Your ' . $requestType->name . 'has been sent to your team Lead for Approval.</p>
                <p>Login to your dashboard to follow up.</p>
                <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                //Send notification to teamLead
                $subject = 'Request: ' . $requestType->code . $request . '- Notification';
                $content = '<p>Here is ' . $requestType->name . 'request from your team member with the following details:</p>
                <ul>
                    <li>Request:' . $requestType->code .  $request . '</li>
                    <li>Amount:₦' . number_format($amount, 2) . ' </li>
                    <li>Request By:' . $requestby->first_name . ' ' . $requestby->last_name . '</li>
                    <li>Project:' . (isset($projectDetails) ? $projectDetails->title  : 'None') .
                    '<li>Purpose:' . $purpose . '</li>
                    <li>Due Date:' . $date . '</li>
                </ul>
                <p>Login to your dashboard to approve.</p>
                <p> <a class="btn" href="https://staff.stanforteedge.com/requests/team/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to2 = $teamlead->email;
                stanmail('it@stanforteedge.com', $to2, $subject, $content, $request);
                $message = "Your request has been sent.";
            } elseif ($status === 4) {
                //Send notification to staff
                $subject = 'Request:' . $requestType->code . $request . ' - Sent';
                $content = '<p>Your ' . $requestType->name . 'has been sent to Accounts for clearance.</p>
                 <p>Login to your dashboard to follow up.</p>
                 <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);

                //send request to Accounts
                $subject = 'Request:' . $requestType->code . $request . ' - New';
                $content = '<p>Here is a new ' . $requestType->name . 'request with the following details:</p>
                <ul>
                    <li>Request:' . $requestType->code .  $request . '</li>
                    <li>Amount:₦' . number_format($amount, 2) . ' </li>
                    <li>Request By:' . $requestby->first_name . ' ' . $requestby->last_name . '</li>
                    <li>Team:' . $teamDetails->name . '</li>
                    <li>Project:' . (isset($projectDetails) ? $projectDetails->title  : 'None') .
                    '<li>Purpose:' . $purpose . '</li>
                    <li>Due Date:' . $date . '</li>
                </ul>
                <p>Login to your dashboard to clear.</p>
                <p> <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $message = "Your request has been sent.";
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject, $content, $request);
            }
            $response = array(
                'success' => true,
                'message' => $message,
                'id' => $request,
            );
        } else {
            $response = array(
                'success' => false,
                'message' => 'Request was not added',
            );
        }
    } elseif ($form == 'approval') {
        $request = absint($_POST['id']);
        $update = $wpdb->update('staff_jet_cct_requests_financial', array('status' => $status), array('_ID' => $request));

        $tablename2 = "staff_jet_cct_request_financial_approval";
        $data2 = array(
            'request' => $request,
            'staff' => $approvedby,
            'status' => $status,
        );
        $approved = $wpdb->insert($tablename2, $data2);
        if ($approved) {
            if ($status === 3) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Unapproved';
                $content = '<p>Your ' . $requestName . ' has been unapproved by the Team Lead.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message = "Request Unpproved.";
            } elseif ($status === 4) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Sent';
                $content = '<p>Your ' . $requestName . ' has been sent to Accounts for clearance.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                $sent = stanmail('it@stanforteedge.com', $to, $subject, $content, $request);

                //send request to Accounts
                $subject2 = 'Request: ' . $requestCode . ' - New';
                $content2 = '<p>Here is a new ' . $requestName . ' with the following details:</p>
                    <ul>
                        <li>Request: ' . $requestCode . '</li>
                        <li>Amount: ₦' . number_format($amount, 2) . ' </li>
                        <li>Request By: ' . $requestby->first_name . ' ' . $requestby->last_name . '</li>
                        <li>Team: ' . $teamDetails->name . '</li>
                        <li>Project: ' . (isset($projectDetails) ? $projectDetails->title : 'None') . '</li>
                        <li>Purpose: ' . $purpose . '</li>
                        <li>Due Date: ' . date("d, M Y", strtotime($date)) . '</li>
                    </ul>

                    <p>Login to your dashboard to clear.</p>
                    <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a>';
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject2, $content2, $request);

                $message = "Request sent: ";
            } elseif ($status === 5) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Unapproved';
                $content = '<p>Your ' . $requestName . ' has been unapproved by the Accounts for clearance.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message = "Request Unapproved.";
            } elseif ($status === 6) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Cleared';
                $content = '<p>Your ' . $requestName . ' has been approved by the Accounts for clearance.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);

                //send request to COO
                $subject2 = 'Request: ' . $requestCode . ' - Cleared';
                $content2 = '<p>Here is a new ' . $requestName . ' with the following details:</p>
                    <ul>
                        <li>Request: ' . $requestCode . '</li>
                        <li>Amount: ₦' . number_format($amount, 2) . ' </li>
                        <li>Request By: ' . $requestby->first_name . ' ' . $requestby->last_name . '</li>
                        <li>Team: ' . $teamDetails->name . '</li>
                        <li>Project: ' . (isset($projectDetails) ? $projectDetails->title : 'None') . '</li>
                        <li>Purpose: ' . $purpose . '</li>
                        <li>Due Date: ' . date("d, M Y", strtotime($date)) . '</li>
                    </ul>

                    <p>Login to your dashboard to clear.</p>
                    <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a>';
                stanmail('it@stanforteedge.com', 'olalekan@stanforteedge.com', $subject2, $content2, $request);

                $message = "Request Approved.";
            } elseif ($status === 7) {
                //Send notification to Account
                $subject = 'Request: ' . $requestCode . ' - Unapproved';
                $content = '<p>Your ' . $requestName . ' has been unapproved by the COO.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject, $content, $request);
                $message = "Request Unapproved.";
            } elseif ($status === 8) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Approved';
                $content = '<p>Your ' . $requestName . ' has been approved by the COO.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);

                if ($requestType->approval === 2) {
                    //send request to ED
                    $subject2 = 'Request: ' . $requestCode . ' - Cleared';
                    $content2 = '<p>Here is a ' . $requestName . ' with the following details for your approval. The request has been approved by the COO:</p>
                        <ul>
                            <li>Request: ' . $requestCode . '</li>
                            <li>Amount: ₦' . number_format($amount, 2) . ' </li>
                            <li>Request By: ' . $requestby->first_name . ' ' . $requestby->last_name . '</li>
                            <li>Team: ' . $teamDetails->name . '</li>
                            <li>Project: ' . (isset($projectDetails) ? $projectDetails->title : 'None') . '</li>
                            <li>Purpose: ' . $purpose . '</li>
                            <li>Due Date: ' . date("d, M Y", strtotime($date)) . '</li>
                        </ul>

                    <p>Login to your dashboard to approve.</p>
                    <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a>';
                    stanmail('it@stanforteedge.com', 'olusola@stanforteedge.com', $subject2, $content2, $request);
                } else {
                    //send request to Accounts
                    $subject2 = 'Request: ' . $requestCode . ' - Approved';
                    $content2 = '<p>The' . $requestName . ' has been approved. Please disburse:</p>
                            <p>Login to your dashboard to disburse.</p>
                            <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a>';
                    stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject2, $content2, $request);
                }

                $message = "Request Approved.";
            } elseif ($status === 9) {
                //Send notification to Account
                $subject = 'Request: ' . $requestCode . ' - Unapproved';
                $content = '<p>Your ' . $requestName . ' has been unapproved by the ED.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                stanmail('it@stanforteedge.com', 'olalekan@stanforteedge.com', $subject, $content, $request);
                $message = "Request Unapproved.";
            } elseif ($status === 10) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Approved';
                $content = '<p>Your ' . $requestName . ' has been approved. Please await disbursement.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);

                //send request to Accounts
                $subject2 = 'Request: ' . $requestCode . ' - Approved';
                $content2 = '<p>The' . $request . ' has been approved. Please disburse:</p>
                        <p>Login to your dashboard to disburse.</p>
                        <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a>';
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject2, $content2, $request);
                $message = "Request Approved.";
            } elseif ($status === 11) {

                $tablename2 = 'staff_jet_cct_financial_items';
                // Loop through each item in the items array

                // $uploadedFi = [];

                foreach ($itemData as $index => $rowData) {
                    $item = sanitize_text_field($rowData['item']); // Sanitize item
                    $qty = absint($rowData['qty']); // Sanitize quantity
                    $row = absint($rowData['row']); // Sanitize quantity
                    $file = absint($rowData['file']); // Sanitize quantity
                    $price = floatval(sanitize_text_field($rowData['price'])); // Sanitize price
                    $data2 = array(
                        'type' => 'disburse',
                        'item' => $item,
                        'quantity' => $qty,
                        'price' => $price,
                        'request' => $request,
                        'index_no' => $row,
                        'file' => $file,
                        'status' => 1
                    );
                    $additem = $wpdb->insert($tablename2, $data2);
                    $itemId = $wpdb->insert_id;
                    $updateFile = $wpdb->update('staff_jet_cct_files', array('type' => 'reimburse', 'row_id' => $itemId), array('_ID' => $file));
                }
                //Send notification to staff
                $subject = 'Request: ' . $requestType->code . $request . ' - Approved';
                $content = '<p>Your ' . $requestType->name. ' has been disbursed. Please confirm.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message = "Your confirmation has been received.";
            } elseif ($status === 12) {
                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Disburse Confirmed';
                $content = '<p>Disbursement for ' . $requestCode . 'has been confirmed.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject, $content, $request);

                //Send notification to staff
                $subject = 'Request: ' . $requestCode . ' - Awaiting Retirement';
                $content = '<p>You have confirmed disbursement for ' . $requestCode . '. Please retire as soon as possible.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message = "Your confirmation has been received.";
            } elseif ($status === 13) {
                //Send notification to Accounts
                $subject = 'Request: ' . $requestType->code . $request . ' - Retired';
                $content = '<p>Retirment for ' . $requestCode . 'has been made.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                stanmail('it@stanforteedge.com', 'accounts@stanforteedge.com', $subject, $content, $request);
                $message = "Your retirement has been received.";
            } elseif ($status === 14) {
                //Send notification to Accounts
                $subject = 'Request: ' . $requestCode . ' - Completed';
                $content = '<p>Your ' . $requestCode . ' has been completed. And the request will now be closed.</p>
                     <p>Login to your dashboard to follow up.</p>
                     <p> <a class="btn" href="https://staff.stanforteedge.com/accounts/requests/request/?id=' . $request . '"/>Dashboard</a></p>';
                $to = $requestby->email;
                stanmail('it@stanforteedge.com', $to, $subject, $content, $request);
                $message = "The request is now complete.";
            }
        }

        $response = array(
            'success' => true,
            'message' => $message,
            'id' => $request
        );
    } elseif ($form == 'edit') {
        $request = absint($_POST['id']);
        $reimburse = absint($_POST['reimburse']);
        $category = absint($_POST['category']);
        $data = array(
            'type' => $type,
            'staff' => $staff,
            'due_date' => $due_date,
            'team' => $team,
            'project' => $project,
            'description' => $purpose,
            'amount' => $amount,
            'status' => $status,
            'note' => $note,
            'category' => $category,
            'reimburse' => $reimburse
        );
        $datatypes = array(
            '%s', '%d', '%s', '%d', '%d', '%s', '%d', '%d', '%s'
        );
        $update = $wpdb->update($tablename, $data,  array('_ID' => $request));
        if ($update) {
            $response = array(
                'success' => true,
                'message' => 'Request Updated',
                'id' => $request,
            );
        } else {
            $response = array(
                'success' => false,
                'message' => 'hhdhdhd',
                'id' => $request,
            );
        }
    } elseif ($form == 'new') {
        $requestType = $wpdb->get_row("SELECT a.name, a.code, a.approval FROM staff_jet_cct_request_types a WHERE a.type = 1 AND a._ID = $type ");
        $reimburse = absint($_POST['reimburse']);
        $category = absint($_POST['category']);
        $data = array(
            'type' => $type,
            'staff' => $staff,
            'due_date' => $due_date,
            'team' => $team,
            'project' => $project,
            'description' => $purpose,
            'amount' => $amount,
            'status' => $status,
            'category' => $category,
            'reimburse' => $reimburse
        );
        $datatypes = array(
            '%s', '%d', '%s', '%d', '%d', '%s', '%d', '%d', '%s'
        );
        $addrequest = $wpdb->insert($tablename, $data);
        $request = $wpdb->insert_id;

        $response = array(
            'success' => true,
            'message' => 'Draft saved',
            'request' => $requestType->code . $request,
            'id' => $request
        );
    } else {
        $response = array(
            'success' => false,
            'message' => 'Something went wrong' . $form,
            'id' => $request
        );
    }




    // Output the response as JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    // Invalid request response
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Invalid request!'));
}
