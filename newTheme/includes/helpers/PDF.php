<?php
// Ensure WordPress is loaded
require_once('../../../../../wp-load.php');



use Dompdf\Dompdf;
use Dompdf\Options;

try {
    // Get request ID
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        throw new Exception('Invalid request ID');
    }

    global $wpdb;

    // Fetch request details using prepared statements
    $requested = $wpdb->get_row($wpdb->prepare(
        "SELECT a._ID, a.staff, a.description, a.reimburse, a.amount, a.cct_created, a.due_date, a.status, a.team, a.project, 
                b.title, c.first_name, c.last_name, c.email, d.name AS team_name, 
                e.name AS request_type, e.code, e.approval 
         FROM staff_jet_cct_requests_financial a 
         LEFT JOIN staff_jet_cct_projects b ON b._ID = a.project 
         LEFT JOIN staff_jet_cct_profiles c ON c._ID = a.staff
         LEFT JOIN staff_jet_cct_teams d ON d._ID = a.team
         LEFT JOIN staff_jet_cct_request_types e ON e._ID = a.type 
         WHERE a._ID = %d",
        $id
    ));

    if (!$requested) {
        throw new Exception('Request not found');
    }

    // Fetch items using prepared statement
    $items = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM staff_jet_cct_financial_items WHERE request = %d",
        $id
    ));

    // Fetch approvals using prepared statement
    $approvals = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM staff_jet_cct_request_financial_approval WHERE request = %d",
        $id
    ));

    // Fetch files using prepared statement
    $files = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM staff_jet_cct_files WHERE request = %d",
        $id
    ));

    // Configure Dompdf
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isPhpEnabled', true);
    $options->set('isRemoteEnabled', true);
    $dompdf = new Dompdf($options);

    if (!$dompdf) {
        throw new Exception('Failed to initialize Dompdf');
    }

    // Convert logo to base64 for embedding in HTML
    $logo_path = get_template_directory() . '/assets/images/logo.png';
    if (file_exists($logo_path)) {
        $logo_base64 = base64_encode(file_get_contents($logo_path));
        $logo_html = 'data:image/png;base64,' . $logo_base64;
    } else {
        throw new Exception('Logo file not found');
    }

    // Build HTML content
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <style>
            /* Your CSS styles here */
        </style>
    </head>
    <body>
        <img src="' . $logo_html . '" alt="Logo" style="width: 150px;"/>
        <h1>Request Details</h1>
        <p><strong>Request ID:</strong> ' . htmlspecialchars($requested->_ID) . '</p>
        <!-- Additional HTML for details -->
    </body>
    </html>';

    // Load HTML content
    $dompdf->loadHtml($html);

    // Set paper size and orientation
    $dompdf->setPaper('A4', 'portrait');

    // Render PDF
    $dompdf->render();

    // Get the generated PDF content
    $output = $dompdf->output();

    // Set response headers for PDF download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Request_' . $requested->code . $requested->_ID . '.pdf"');
    header('Content-Length: ' . strlen($output));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');

    // Output the PDF content
    echo $output;
    exit;
} catch (Exception $e) {
    // Set HTTP status code for error
    http_response_code(500);

    // Return JSON response for AJAX error handling
    header('Content-Type: application/json');
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
    exit;
}
