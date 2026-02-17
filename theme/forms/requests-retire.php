<?php
// Ensure that WordPress is loaded
require_once('../../../../wp-load.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Decode the JSON-encoded data from 'items' key
    $amount = floatval(sanitize_text_field($_POST['amount'])); // Sanitize amount
    $request = absint(sanitize_key($_POST['request'])); // Sanitize request ID
    $staff = absint(sanitize_text_field($_POST['staff'])); // Sanitize staff
    $status = absint(sanitize_text_field($_POST['status'])); // Sanitize status

    // Process data from each row in the submitted items array
    $formData = json_decode(stripslashes($_POST['items']), true); // Decode and sanitize items data

    // Loop through each row data
    foreach ($formData as $index => $rowData) {

        $item = sanitize_text_field($rowData['item']); // Sanitize item
        $qty = sanitize_key($rowData['qty']); // Sanitize quantity
        $price = absint($rowData['price']); // Sanitize price
        $note = sanitize_text_field($rowData['note']); // Sanitize price
        $file = sanitize_key($rowData['file']); // Sanitize price

        // Prepare data for staff_jet_cct_financial_items
        $financialData = array(
            'type' => 'retire',
            'request' => $request,
            'item' => $item,
            'quantity' => $qty,
            'price' => $price,
            'account' => $note,
            'amount' => number_format(($price * $qty), 2, '.', ''),
            'index_no' => $index,
            'file' => $file  // Use inserted file ID if available
        );
        $retireAdded = $wpdb->insert('staff_jet_cct_financial_items', $financialData);
        if ($retireAdded) {
            $message[$index] = 'Items have been Retired';
        } else {
            $message[$index] = 'Something went wrong';
        }
    }

    if(!empty($retireAdded)){
        $tablename = "staff_jet_cct_requests_financial";
        $update = $wpdb->update($tablename, array('status' => $status), array('_ID' => $request), array('%d'), array('%d'));
        $response = array(
            'success' => true,
            'message' => $message,
        );
    } else {
        $response = array(
            'success' => false,
            'message' => $message,
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
