<?php

namespace App\Core\Requests\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Core\Requests\Services\RequestService;
use App\Core\Requests\Services\RequestWorkflowAdapter;
use App\Utils\BaseController;

// Include theme's vendor autoload to access dompdf
$theme_vendor_path = get_template_directory() . '/vendor/autoload.php';
if (file_exists($theme_vendor_path)) {
    require_once $theme_vendor_path;
}

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * RequestController
 *
 * Handles request-related API endpoints
 */
class RequestController extends BaseController
{
    /**
     * Get request groups
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getGroups(WP_REST_Request $request)
    {
        try {
            $includeInactive = $request->get_param('include_inactive') === 'true';
            $result = RequestService::getGroups($includeInactive);
            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting groups: ' . $e->getMessage());
            return static::error('groups_error', 'Failed to retrieve request groups', 500);
        }
    }

    /**
     * Create a request group
     */
    public static function createGroup(WP_REST_Request $request)
    {
        try {
            $data = $request->get_params();
            $group = RequestService::createGroup($data);
            return static::success($group, 201);
        } catch (\Exception $e) {
            return static::error('creation_error', $e->getMessage(), 400);
        }
    }

    /**
     * Update a request group
     */
    public static function updateGroup(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_params();
            $group = RequestService::updateGroup($id, $data);
            return static::success($group, 200);
        } catch (\Exception $e) {
            return static::error('update_error', $e->getMessage(), 400);
        }
    }

    /**
     * Delete a request group
     */
    public static function deleteGroup(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            RequestService::deleteGroup($id);
            return static::success(['message' => 'Group deleted'], 200);
        } catch (\Exception $e) {
            return static::error('delete_error', $e->getMessage(), 400);
        }
    }

    /**
     * Get request types
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getTypes(WP_REST_Request $request)
    {
        try {
            $filters = [
                'group_id' => $request->get_param('group_id')
            ];
            $includeInactive = $request->get_param('include_inactive') === 'true';

            $result = RequestService::getTypes($filters, $includeInactive);
            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting types: ' . $e->getMessage());
            return static::error('types_error', 'Failed to retrieve request types', 500);
        }
    }

    /**
     * Create a request type
     */
    public static function createType(WP_REST_Request $request)
    {
        try {
            $data = $request->get_params();
            $type = RequestService::createType($data);
            return static::success($type, 201);
        } catch (\Exception $e) {
            return static::error('creation_error', $e->getMessage(), 400);
        }
    }

    /**
     * Update a request type
     */
    public static function updateType(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_params();
            $type = RequestService::updateType($id, $data);
            return static::success($type, 200);
        } catch (\Exception $e) {
            return static::error('update_error', $e->getMessage(), 400);
        }
    }

    /**
     * Delete a request type
     */
    public static function deleteType(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            RequestService::deleteType($id);
            return static::success(['message' => 'Type deleted'], 200);
        } catch (\Exception $e) {
            return static::error('delete_error', $e->getMessage(), 400);
        }
    }

    /**
     * Get specific request type with full details
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getType(WP_REST_Request $request)
    {
        try {
            $typeId = $request->get_param('id');
            $result = RequestService::getType($typeId);

            if (!$result) {
                return static::error('type_not_found', 'Request type not found', 404);
            }

            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting type: ' . $e->getMessage());
            return static::error('type_error', 'Failed to retrieve request type', 500);
        }
    }

    /**
     * Create a new request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('authentication_required', 'Authentication required', 401);
            }

            $requestData = [
                'request_type_id' => $request->get_param('request_type_id'),
                'data' => $request->get_param('data'),
                'team_id' => $request->get_param('team_id'),
                'total_amount' => $request->get_param('total_amount'),
                'currency' => $request->get_param('currency') ?? 'NGN'
            ];

            $items = $request->get_param('items') ?? [];

            // Get organization ID from user profile
            $organizationId = $user->primary_organization_id ?? null;

            $result = RequestService::createRequest($requestData, $user->profile_id, $organizationId, $items);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 400);
            }

            return static::success([
                'request' => [
                    'id' => $result['request']->id,
                    'request_number' => $result['request']->request_number ?: $result['request']->id,
                    'formatted_number' => $result['formatted_number'],
                    'status' => $result['request']->status,
                    'created_at' => $result['request']->created_at
                ]
            ], 201);
        } catch (\Exception $e) {
            error_log('RequestController: Error creating request: ' . $e->getMessage());
            return static::error('creation_error', 'Failed to create request', 500);
        }
    }

    /**
     * Submit a request for approval
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function submitRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('authentication_required', 'Authentication required', 401);
            }

            $requestId = $request->get_param('id');

            $result = RequestService::submitRequest($requestId, $user->profile_id);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 400);
            }

            return static::success([
                'message' => $result['message'],
                'workflow_id' => $result['workflow_id']
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error submitting request: ' . $e->getMessage());
            return static::error('submission_error', 'Failed to submit request', 500);
        }
    }

    /**
     * Get pending approvals for the current user
     */

    /**
     * Approve a request at the current workflow step
     */
    public static function approveRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('authentication_required', 'Authentication required', 401);
            }

            $requestId = $request->get_param('id');
            $comment = $request->get_param('comment') ?? '';

            $result = RequestService::processAction($requestId, 'approve', $user->profile_id, $comment);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'] ?? 'Failed to approve', 400);
            }

            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error approving request: ' . $e->getMessage());
            return static::error('approve_error', 'Failed to approve request', 500);
        }
    }

    /**
     * Reject a request at the current workflow step
     */
    public static function rejectRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('authentication_required', 'Authentication required', 401);
            }

            $requestId = $request->get_param('id');
            $comment = $request->get_param('comment') ?? '';

            if (empty($comment)) {
                return static::error('validation_error', 'Rejection reason is required', 400);
            }

            $result = RequestService::processAction($requestId, 'reject', $user->profile_id, $comment);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'] ?? 'Failed to reject', 400);
            }

            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error rejecting request: ' . $e->getMessage());
            return static::error('reject_error', 'Failed to reject request', 500);
        }
    }

    /**
     * Get requests with filtering
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRequests(WP_REST_Request $request)
    {
        try {
            $filters = $request->get_params();
            $page = $request->get_param('page') ?? 1;
            $perPage = $request->get_param('per_page') ?? 20;
            $user = $request->get_param('__auth_user');

            $result = RequestService::getRequests($filters, $user, $page, $perPage);

            return static::success($result, 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting requests: ' . $e->getMessage());
            return static::error('requests_error', 'Failed to retrieve requests', 500);
        }
    }

    /**
     * Get specific request details
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRequest(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');
            $user = $request->get_param('__auth_user');

            $result = RequestService::getRequest($requestId, $user);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : 403;
                return static::error($result['error'], $result['message'], $status);
            }

            return static::success($result['data'], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting request: ' . $e->getMessage());
            return static::error('request_error', 'Failed to retrieve request', 500);
        }
    }

    /**
     * Process workflow action
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function processAction(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('authentication_required', 'Authentication required', 401);
            }

            $requestId = $request->get_param('id');
            $action = $request->get_param('action');
            $comment = $request->get_param('comment') ?? '';

            $result = RequestService::processAction(
                $requestId,
                $action,
                $user->profile_id,
                $comment
            );

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 400);
            }

            return static::success([
                'message' => 'Action processed successfully',
                'action' => $result['action'],
                'new_status' => $result['new_status']
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error processing action: ' . $e->getMessage());
            return static::error('action_error', 'Failed to process action', 500);
        }
    }

    /**
     * Generate PDF from form data
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function generatePdfFromForm(WP_REST_Request $request)
    {
        try {

            error_log('Generating PDF from form data: ' . json_encode($request->get_json_params()));
            // Get form data
            $formData = $request->get_json_params();

            // Validate required fields
            if (empty($formData['request_id']) || empty($formData['staff_name']) || !isset($formData['amount'])) {
                return static::error('validation_error', 'Missing required fields: request_id, staff_name, amount', 400);
            }

            // Configure Dompdf with Unicode support (DejaVu Sans default)
            $options = new \Dompdf\Options();
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isPhpEnabled', true);
            $options->set('isRemoteEnabled', true);
            $options->set('dpi', 96);
            $dompdf = new \Dompdf\Dompdf($options);

            if (!$dompdf) {
                throw new \Exception('Failed to initialize Dompdf');
            }

            // Get logo
            $logo_path = get_template_directory() . '/assets/images/logo.png';
            $logo_html = '';
            if (file_exists($logo_path)) {
                $logo_base64 = base64_encode(file_get_contents($logo_path));
                $logo_html = 'data:image/png;base64,' . $logo_base64;
            } else {
                // Try newTheme logo
                $logo_path = get_template_directory() . '/assets/images/Stanforte-Edge-Logo.png';
                if (file_exists($logo_path)) {
                    $logo_base64 = base64_encode(file_get_contents($logo_path));
                    $logo_html = 'data:image/png;base64,' . $logo_base64;
                }
            }

            // Get signature images (pass team for team lead signature)
            $team = $formData['team'] ?? null;
            $signatures = self::loadSignatureImages($team);

            // Build HTML template
            $html = self::buildPdfHtml($formData, $logo_html, $signatures);

            // Load and render PDF
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Get PDF content
            $output = $dompdf->output();

            // Return PDF as download
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="request-' . $formData['request_id'] . '.pdf"');
            header('Content-Length: ' . strlen($output));
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');

            echo $output;
            exit;
        } catch (\Exception $e) {
            error_log('RequestController: Error generating PDF: ' . $e->getMessage());
            return static::error('pdf_error', 'Failed to generate PDF: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Submit Retirement
     */
    public static function retire(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $files = $request->get_file_params();
            $params = $request->get_params();
            $user = $request->get_param('__auth_user');

            $result = RequestService::retire($id, $params, $files, $user->profile_id);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : 400;
                return static::error($result['error'], $result['message'], $status);
            }

            return static::success($result);
        } catch (\Exception $e) {
            return static::error('error', $e->getMessage(), 500);
        }
    }

    /**
     * Verify Retirement
     */
    public static function verifyRetirement(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $params = $request->get_json_params();

            $result = RequestService::verifyRetirement($id, $params);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : 400;
                return static::error($result['error'], $result['message'], $status);
            }

            return static::success($result);
        } catch (\Exception $e) {
            return static::error('error', $e->getMessage(), 500);
        }
    }

    /**
     * Generate Payment Voucher PDF
     */
    public static function generatePaymentVoucher(WP_REST_Request $request)
    {
        try {
            error_log('Generating Payment Voucher PDF: ' . json_encode($request->get_json_params()));

            // Get form data
            $formData = $request->get_json_params();

            // Validate required fields
            if (empty($formData['voucher_number']) || empty($formData['payee_name']) || !isset($formData['amount'])) {
                return static::error('validation_error', 'Missing required fields: voucher_number, payee_name, amount', 400);
            }

            // Persist PV details if linked to a request
            if (!empty($formData['request_id'])) {
                $user = $request->get_param('__auth_user');
                RequestService::recordPaymentVoucher($formData['request_id'], $formData, $user ? $user->profile_id : get_current_user_id());
            }

            // Configure Dompdf with Unicode support (DejaVu Sans default)
            $options = new \Dompdf\Options();
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isPhpEnabled', true);
            $options->set('isRemoteEnabled', true);
            $options->set('dpi', 96);
            $dompdf = new \Dompdf\Dompdf($options);

            if (!$dompdf) {
                throw new \Exception('Failed to initialize Dompdf');
            }

            // Get logo
            $logo_path = get_template_directory() . '/assets/images/logo.png';
            $logo_html = '';
            if (file_exists($logo_path)) {
                $logo_base64 = base64_encode(file_get_contents($logo_path));
                $logo_html = 'data:image/png;base64,' . $logo_base64;
            } else {
                // Try newTheme logo
                $logo_path = get_template_directory() . '/assets/images/Stanforte-Edge-Logo.png';
                if (file_exists($logo_path)) {
                    $logo_base64 = base64_encode(file_get_contents($logo_path));
                    $logo_html = 'data:image/png;base64,' . $logo_base64;
                }
            }

            // Get signature images
            $signatures = self::loadSignatureImages();

            // Build HTML template
            $html = self::buildPaymentVoucherHtml($formData, $logo_html, $signatures);

            // Load and render PDF
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Get PDF content
            $output = $dompdf->output();

            // Return PDF as download
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="PV-' . $formData['voucher_number'] . '.pdf"');
            header('Content-Length: ' . strlen($output));
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');

            echo $output;
            exit;
        } catch (\Exception $e) {
            error_log('RequestController: Error generating Payment Voucher PDF: ' . $e->getMessage());
            return static::error('pdf_error', 'Failed to generate Payment Voucher PDF: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Load signature images as base64
     */
    private static function loadSignatureImages($team = null)
    {
        $signaturePath = get_template_directory() . '/assets/images/signatures/';
        $signatures = [];

        $signatureFiles = [
            'account_officer' => 'account-officer.png',
            'coo' => 'coo.png',
            'ed' => 'ed.png',
            'prepared_by' => 'prepared-by.png',
            'received_by' => 'received-by.png',
            'team_lead_administration' => 'team-lead-administration.png',
            'team_lead_it' => 'team-lead-it.png',
            'team_lead_programs' => 'team-lead-programs.png',
            'team_lead_communications' => 'team-lead-communications.png',
            'team_lead_operations' => 'team-lead-operations.png'
        ];

        foreach ($signatureFiles as $key => $filename) {
            $filePath = $signaturePath . $filename;
            if (file_exists($filePath)) {
                $signatures[$key] = 'data:image/png;base64,' . base64_encode(file_get_contents($filePath));
                error_log('✓ Signature loaded: ' . $filename);
            } else {
                $signatures[$key] = ''; // Empty if signature not found
                error_log('✗ Signature missing: ' . $filePath);
            }
        }

        // Add team-specific team lead signature
        if ($team) {
            $teamKey = 'team_lead_' . strtolower(str_replace(' ', '_', $team));
            if (isset($signatures[$teamKey])) {
                $signatures['team_lead'] = $signatures[$teamKey];
            } else {
                $signatures['team_lead'] = '';
            }
        }

        return $signatures;
    }

    /**
     * Build HTML for Payment Voucher PDF
     */
    private static function buildPaymentVoucherHtml($formData, $logo_html, $signatures)
    {
        $voucherNumber = htmlspecialchars($formData['voucher_number'] ?? '');
        $voucherDate = !empty($formData['voucher_date']) ? date('d M Y', strtotime($formData['voucher_date'])) : '';
        $payeeName = htmlspecialchars($formData['payee_name'] ?? '');
        $payeeContact = htmlspecialchars($formData['payee_contact'] ?? '');
        $purpose = htmlspecialchars($formData['purpose'] ?? '');
        $amount = number_format((float) ($formData['amount'] ?? 0), 2);
        $amountWords = htmlspecialchars($formData['amount_words'] ?? '');
        $paymentMethod = htmlspecialchars($formData['payment_method'] ?? '');
        $paymentDetails = htmlspecialchars($formData['payment_details'] ?? '');
        $preparedBy = htmlspecialchars($formData['prepared_by'] ?? '');
        $remarks = htmlspecialchars($formData['remarks'] ?? '');

        // Hardcoded approver names
        $accountantName = 'Oyinkansola Aje'; // Accountant/Prepared By
        $cooName = 'Olalekan Owonikoko'; // COO
        $edName = 'Olusola Owonikoko'; // ED

        // Build items table
        $itemsHtml = '';
        $totalAmount = 0;
        if (!empty($formData['items']) && is_array($formData['items'])) {
            foreach ($formData['items'] as $index => $item) {
                $description = htmlspecialchars($item['description'] ?? '');
                $itemAmount = (float) ($item['amount'] ?? 0);
                $totalAmount += $itemAmount;
                $itemsHtml .= sprintf(
                    '<tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;">%d</td>
                        <td style="border: 1px solid #000; padding: 8px;">%s</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;">₦%s</td>
                    </tr>',
                    $index + 1,
                    $description,
                    number_format($itemAmount, 2)
                );
            }
            // Add total row
            $itemsHtml .= sprintf(
                '<tr style="background-color: #f0f0f0;">
                    <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">₦%s</td>
                </tr>',
                number_format($totalAmount, 2)
            );
        }

        // Payment method checkboxes
        $cashChecked = $paymentMethod === 'Cash' ? '☑' : '☐';
        $transferChecked = $paymentMethod === 'Transfer' ? '☑' : '☐';
        $chequeChecked = $paymentMethod === 'Cheque' ? '☑' : '☐';

        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: "DejaVu Sans", sans-serif; 
                    margin: 0; 
                    padding: 20px;
                    font-size: 11px;
                }
                .voucher-container {
                    max-width: 700px;
                    margin: 0 auto;
                    border: 2px solid #000;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header h1 {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 10px 0;
                    text-decoration: underline;
                }
                .row {
                    margin-bottom: 15px;
                }
                .label {
                    font-weight: bold;
                    display: inline-block;
                    width: 100px;
                }
                .underline {
                    border-bottom: 1px solid #000;
                    display: inline-block;
                    min-width: 150px;
                    padding: 2px 5px;
                }
                .full-width {
                    width: 100%;
                }
                .signature-section {
                    margin-top: 30px;
                    border-top: 1px solid #000;
                    padding-top: 20px;
                }
                .signature-row {
                    display: table;
                    width: 100%;
                    margin-bottom: 25px;
                }
                .signature-cell {
                    display: table-cell;
                    width: 50%;
                    padding: 5px;
                }
                .signature-box {
                    border-bottom: 1px solid #000;
                    min-height: 40px;
                    text-align: center;
                }
                .signature-img {
                    max-height: 35px;
                    max-width: 150px;
                }
                .checkbox {
                    font-size: 14px;
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="voucher-container">
                <!-- Header -->
                <div class="header">';

        if (!empty($logo_html)) {
            $html .= '<img src="' . $logo_html . '" alt="Logo" style="height: 50px; margin-bottom: 10px;">';
        }

        $html .= '
                    <h1>PAYMENT VOUCHER</h1>
                </div>

                <!-- Voucher Details -->
                <div class="row">
                    <span class="label">Voucher No:</span>
                    <span class="underline">' . $voucherNumber . '</span>
                    <span style="margin-left: 20px;"><span class="label">Date:</span>
                    <span class="underline">' . $voucherDate . '</span></span>
                </div>

                <!-- Payee Information -->
                <div class="row">
                    <span class="label">Payee Name:</span>
                    <span class="underline full-width">' . $payeeName . '</span>
                </div>
                <div class="row">
                    <span class="label">Address / Contact:</span>
                    <span class="underline full-width">' . $payeeContact . '</span>
                </div>

                <!-- Items Table -->
                ' . (!empty($itemsHtml) ? '
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Payment Items</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 50px;">S/N</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Description / Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px;">Amount</th>
                        </tr>
                        ' . $itemsHtml . '
                    </table>
                </div>
                ' : '') . '

                <!-- Purpose -->
                <div class="row" style="margin-top: 20px;">
                    <div class="label">Description / Purpose of Payment:</div>
                    <div style="border: 1px solid #000; padding: 10px; min-height: 60px; margin-top: 5px;">
                        ' . nl2br($purpose) . '
                    </div>
                </div>

                <!-- Amount -->
                <div class="row" style="margin-top: 20px;">
                    <span class="label">Amount:</span>
                    <span class="underline">₦' . $amount . '</span>
                </div>
                <div class="row">
                    <span class="label">Amount in Words:</span>
                    <span class="underline full-width">' . $amountWords . '</span>
                </div>

                <!-- Payment Method -->
                <div class="row" style="margin-top: 20px;">
                    <div class="label">Payment Method:</div>
                    <div style="margin-top: 5px;">
                        <span class="checkbox">' . $cashChecked . '</span> Cash &nbsp;&nbsp;&nbsp;
                        <span class="checkbox">' . $transferChecked . '</span> Transfer &nbsp;&nbsp;&nbsp;
                        <span class="checkbox">' . $chequeChecked . '</span> Cheque
                    </div>
                </div>';

        if (!empty($paymentDetails)) {
            $html .= '
                <div class="row">
                    <span class="label">If Transfer / Cheque, Details:</span>
                    <div class="underline full-width">' . nl2br($paymentDetails) . '</div>
                </div>';
        }

        // Approvals Section (one line per approver with date)
        $html .= '
                <div style="margin-top: 30px;">
                    <h3 style="margin-bottom: 15px; font-size: 14px;">Approvals:</h3>';

        // Prepared By (Accountant)
        $preparedDate = !empty($formData['prepared_date']) ? date('d M Y', strtotime($formData['prepared_date'])) : date('d M Y');
        $html .= '
                    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-weight: bold;">Prepared By (Accountant): ' . $accountantName . '</span>
                            <span style="font-size: 10px; color: #666;">' . $preparedDate . '</span>
                        </div>';

        if (!empty($signatures['prepared_by'])) {
            $html .= '<div style="margin-top: 5px;"><img src="' . $signatures['prepared_by'] . '" style="max-height: 30px; max-width: 120px;" /></div>';
        }

        $html .= '
                    </div>';

        // Approved By COO
        $cooDate = !empty($formData['approved_coo_date']) ? date('d M Y', strtotime($formData['approved_coo_date'])) : '';
        $html .= '
                    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-weight: bold;">[' . ($formData['approved_coo'] ? '✓' : ' ') . '] Approved By (COO): ' . $cooName . '</span>';

        if ($cooDate) {
            $html .= '<span style="font-size: 10px; color: #666;">' . $cooDate . '</span>';
        }

        $html .= '
                        </div>';

        if ($formData['approved_coo'] && !empty($signatures['coo'])) {
            $html .= '<div style="margin-top: 5px;"><img src="' . $signatures['coo'] . '" style="max-height: 30px; max-width: 120px;" /></div>';
        }

        $html .= '
                    </div>';

        // Approved By ED (if included)
        if ($formData['include_ed']) {
            $edDate = !empty($formData['approved_ed_date']) ? date('d M Y', strtotime($formData['approved_ed_date'])) : '';
            $html .= '
                    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-weight: bold;">[' . ($formData['approved_ed'] ? '✓' : ' ') . '] Approved By (ED): ' . $edName . '</span>';

            if ($edDate) {
                $html .= '<span style="font-size: 10px; color: #666;">' . $edDate . '</span>';
            }

            $html .= '
                        </div>';

            if ($formData['approved_ed'] && !empty($signatures['ed'])) {
                $html .= '<div style="margin-top: 5px;"><img src="' . $signatures['ed'] . '" style="max-height: 30px; max-width: 120px;" /></div>';
            }

            $html .= '
                    </div>';
        }

        $html .= '
                </div>';

        // Remarks
        if (!empty($remarks)) {
            $html .= '
                <div class="row" style="margin-top: 20px; border-top: 1px solid #000; padding-top: 15px;">
                    <div class="label">Remarks:</div>
                    <div style="margin-top: 5px;">' . nl2br($remarks) . '</div>
                </div>';
        }

        $html .= '
            </div>
        </body>
        </html>';

        return $html;
    }

    /**
     * Build HTML template for PDF
     */
    private static function buildPdfHtml($formData, $logo_html, $signatures = [])
    {
        // Build request items table
        $requestItemsHtml = '';
        $requestTotal = 0;

        if (!empty($formData['request_items'])) {
            foreach ($formData['request_items'] as $itemGroup) {
                foreach ($itemGroup as $item) {
                    if (!empty($item['item'])) {
                        $amount = (float) ($item['price'] ?? 0) * (float) ($item['qty'] ?? 0);
                        $requestTotal += $amount;
                        $requestItemsHtml .= sprintf(
                            '<tr><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>',
                            htmlspecialchars($item['item'] ?? ''),
                            htmlspecialchars($item['qty'] ?? ''),
                            number_format((float) ($item['price'] ?? 0), 2),
                            number_format($amount, 2)
                        );
                    }
                }
            }

            // Add total row
            $requestItemsHtml .= sprintf(
                '<tr><td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Total</strong></td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>',
                number_format($requestTotal, 2)
            );
        }

        // Build disbursement items table
        $disbursementItemsHtml = '';
        $disbursementTotal = 0;
        if (!empty($formData['disbursement_items'])) {
            foreach ($formData['disbursement_items'] as $itemGroup) {
                foreach ($itemGroup as $item) {
                    if (!empty($item['item'])) {
                        $amount = (float) ($item['price'] ?? 0) * (float) ($item['qty'] ?? 0);
                        $disbursementTotal += $amount;
                        $itemDate = !empty($item['date']) ? date('d M Y', strtotime($item['date'])) : '-';
                        $disbursementItemsHtml .= sprintf(
                            '<tr><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td><td style="border: 1px solid #000; padding: 8px;">%s</td></tr>',
                            htmlspecialchars($item['item'] ?? ''),
                            htmlspecialchars($item['qty'] ?? ''),
                            number_format((float) ($item['price'] ?? 0), 2),
                            number_format($amount, 2),
                            $itemDate
                        );
                    }
                }
            }

            // Add total row for disbursement
            $disbursementItemsHtml .= sprintf(
                '<tr><td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Total</strong></td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>',
                number_format($disbursementTotal, 2)
            );
        }

        // Calculate disbursement difference (Items total - Disbursement total)
        $disbursementDifference = $requestTotal - $disbursementTotal;

        // Build retirement items table
        $retirementItemsHtml = '';
        $retirementTotal = 0;
        if (!empty($formData['retirement_items'])) {
            foreach ($formData['retirement_items'] as $itemGroup) {
                foreach ($itemGroup as $item) {
                    if (!empty($item['item'])) {
                        $amount = (float) ($item['price'] ?? 0) * (float) ($item['qty'] ?? 0);
                        $retirementTotal += $amount;
                        $retirementItemsHtml .= sprintf(
                            '<tr><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>',
                            htmlspecialchars($item['item'] ?? ''),
                            htmlspecialchars($item['qty'] ?? ''),
                            number_format((float) ($item['price'] ?? 0), 2),
                            number_format($amount, 2)
                        );
                    }
                }
            }

            // Add total row for retirement
            $retirementItemsHtml .= sprintf(
                '<tr><td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Total</strong></td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>',
                number_format($retirementTotal, 2)
            );
        }

        // Calculate retirement difference (Disbursement total - Retirement total)
        $retirementDifference = $disbursementTotal - $retirementTotal;

        // Build approval flow with signatures
        $approvals = $formData['approvals'] ?? [];
        $team = $formData['team'] ?? '';

        // Team lead names mapping
        $teamLeadNames = [
            'Administration' => 'Team Lead - Administration',
            'IT' => 'Team Lead - IT',
            'Programs' => 'Team Lead - Programs',
            'Communications' => 'Team Lead - Communications',
            'Operations' => 'Team Lead - Operations'
        ];

        $teamLeadName = $teamLeadNames[$team] ?? 'Team Lead';

        // Hardcoded approver names (same as PV)
        $accountOfficerName = 'Oyinkansola Aje';
        $cooName = 'Olalekan Owonikoko';
        $edName = 'Olusola Owonikoko';

        // Build approval HTML with signatures (simple single-line format)
        $approvalHtml = '<div style="margin-top: 20px;">';

        // Request Sent
        $sentDate = !empty($approvals['sent_date']) ? date('d M Y', strtotime($approvals['sent_date'])) : '';
        $approvalHtml .= '<div style="margin-bottom: 8px;">';
        $approvalHtml .= '<span style="font-weight: bold;">[' . (($approvals['sent'] ?? false) ? '✓' : ' ') . '] Request Sent</span>';
        if ($sentDate)
            $approvalHtml .= '<span style="margin-left: 10px; font-size: 10px; color: #666;">' . $sentDate . '</span>';
        $approvalHtml .= '</div>';

        // Team Lead
        $teamLeadDate = !empty($approvals['team_lead_date']) ? date('d M Y', strtotime($approvals['team_lead_date'])) : '';
        $approvalHtml .= '<div style="margin-bottom: 8px;">';
        $approvalHtml .= '<span style="font-weight: bold;">[' . (($approvals['team_lead'] ?? false) ? '✓' : ' ') . '] ' . $teamLeadName . '</span>';
        if ($teamLeadDate)
            $approvalHtml .= '<span style="margin-left: 10px; font-size: 10px; color: #666;">' . $teamLeadDate . '</span>';
        if (($approvals['team_lead'] ?? false) && !empty($signatures['team_lead'])) {
            $approvalHtml .= '<div style="margin-top: 3px; margin-left: 15px;"><img src="' . $signatures['team_lead'] . '" style="max-height: 25px; max-width: 100px;" /></div>';
        }
        $approvalHtml .= '</div>';

        // Account Officer
        $accountDate = !empty($approvals['account_officer_date']) ? date('d M Y', strtotime($approvals['account_officer_date'])) : '';
        $approvalHtml .= '<div style="margin-bottom: 8px;">';
        $approvalHtml .= '<span style="font-weight: bold;">[' . (($approvals['account_officer'] ?? false) ? '✓' : ' ') . '] Account Officer: ' . $accountOfficerName . '</span>';
        if ($accountDate)
            $approvalHtml .= '<span style="margin-left: 10px; font-size: 10px; color: #666;">' . $accountDate . '</span>';
        if (($approvals['account_officer'] ?? false) && !empty($signatures['account_officer'])) {
            $approvalHtml .= '<div style="margin-top: 3px; margin-left: 15px;"><img src="' . $signatures['account_officer'] . '" style="max-height: 25px; max-width: 100px;" /></div>';
        }
        $approvalHtml .= '</div>';

        // COO
        $cooDate = !empty($approvals['coo_date']) ? date('d M Y', strtotime($approvals['coo_date'])) : '';
        $approvalHtml .= '<div style="margin-bottom: 8px;">';
        $approvalHtml .= '<span style="font-weight: bold;">[' . (($approvals['coo'] ?? false) ? '✓' : ' ') . '] COO: ' . $cooName . '</span>';
        if ($cooDate)
            $approvalHtml .= '<span style="margin-left: 10px; font-size: 10px; color: #666;">' . $cooDate . '</span>';
        if (($approvals['coo'] ?? false) && !empty($signatures['coo'])) {
            $approvalHtml .= '<div style="margin-top: 3px; margin-left: 15px;"><img src="' . $signatures['coo'] . '" style="max-height: 25px; max-width: 100px;" /></div>';
        }
        $approvalHtml .= '</div>';

        // ED (optional)
        if ($approvals['ed'] ?? false) {
            $edDate = !empty($approvals['ed_date']) ? date('d M Y', strtotime($approvals['ed_date'])) : '';
            $approvalHtml .= '<div style="margin-bottom: 8px;">';
            $approvalHtml .= '<span style="font-weight: bold;">[✓] Executive Director: ' . $edName . '</span>';
            if ($edDate)
                $approvalHtml .= '<span style="margin-left: 10px; font-size: 10px; color: #666;">' . $edDate . '</span>';
            if (!empty($signatures['ed'])) {
                $approvalHtml .= '<div style="margin-top: 3px; margin-left: 15px;"><img src="' . $signatures['ed'] . '" style="max-height: 25px; max-width: 100px;" /></div>';
            }
            $approvalHtml .= '</div>';
        }

        $approvalHtml .= '</div>';

        // Format dates
        $dateCreated = !empty($formData['date_created']) ? date('d, M Y', strtotime($formData['date_created'])) : '';
        $dueDate = !empty($formData['due_date']) ? date('d, M Y', strtotime($formData['due_date'])) : '';

        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: "DejaVu Sans", sans-serif; 
                    margin: 0; 
                    padding: 20px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="pdf-container" style="padding: 20px; font-family: \'DejaVu Sans\', sans-serif;">
                <!-- Header Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #000; width: 50%;">
                                ' . (!empty($logo_html) ? '<img src="' . $logo_html . '" alt="Stanforte Edge" style="height: 50px;">' : '<div style="font-size: 18px; font-weight: bold;">Stanforte Edge</div>') . '
                            </td>
                            <td style="padding: 15px; border-bottom: 1px solid #000; text-align: right; width: 50%;">
                                <div style="font-size: 18px; font-weight: bold;">Request ' . htmlspecialchars($formData['request_id'] ?? '') . '</div>
                                <div>Status: ' . htmlspecialchars($formData['status'] ?? '') . '</div>
                            </td>
                        </tr>
                    </table>
                    <div style="padding: 15px; border-bottom: 1px solid #000;">
                        <div style="font-size: 16px; font-weight: bold;">Amount: ₦' . number_format((float) ($formData['amount'] ?? 0), 2) . '</div>
                        ' . (($formData['reimburse'] ?? false) ? '<div>(Reimbursement)</div>' : '') . '
                    </div>
                    <!-- Two Column Layout -->
                    <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #000;">
                        <tr>
                            <td style="width: 50%; padding: 15px; border-right: 1px solid #000; vertical-align: top;">
                                <h3 style="margin-top: 0;">Details</h3>
                                <ul style="margin: 0; padding-left: 20px;">
                                   <li> Date: ' . $dateCreated . '</li>
                                   <li> Due: ' . $dueDate . '</li>
                                   <li> Team: ' . htmlspecialchars($formData['team'] ?? '') . '</li>
                                   <li> Project: ' . htmlspecialchars($formData['project'] ?? '') . '</li>
                                   <li> By: ' . htmlspecialchars($formData['staff_name'] ?? '') . '</li>
                                   <li> Purpose: ' . htmlspecialchars($formData['purpose'] ?? '') . '</li>
                                </ul>
                            </td>
                            <td style="width: 50%; padding: 15px; vertical-align: top;">
                                <h3 style="margin-top: 0;">Approval Flow</h3>
                                ' . $approvalHtml . '
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Items Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Items</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                        </tr>
                        ' . $requestItemsHtml . '
                    </table>
                </div>

                <!-- Disbursement Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Disbursement</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Date</th>
                        </tr>
                        ' . $disbursementItemsHtml . '
                        ' . (!empty($disbursementItemsHtml) ? sprintf('<tr><td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Difference</strong></td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>', number_format($disbursementDifference, 2)) : '<tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center;">No disbursement done yet.</td></tr>') . '
                    </table>
                </div>

                <!-- Retirement Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Retirement</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                        </tr>
                        ' . $retirementItemsHtml . '
                        ' . (!empty($retirementItemsHtml) ? sprintf('<tr><td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Difference</strong></td><td style="border: 1px solid #000; padding: 8px;">₦%s</td></tr>', number_format($retirementDifference, 2)) : '<tr><td colspan="4" style="padding: 8px; text-align: center;">No retirement done yet.</td></tr>') . '
                    </table>
                </div>

                <!-- Reconciliation Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Reconciliation</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Category</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Status</th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Items (Budget)</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format($requestTotal, 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">Requested</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Disbursement (Released)</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format($disbursementTotal, 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">' . ($disbursementTotal > 0 ? 'Paid' : 'Pending') . '</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Retirement (Spent)</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format($retirementTotal, 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">' . ($retirementTotal > 0 ? 'Accounted' : 'Pending') . '</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Unreleased Funds</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format(max(0, $requestTotal - $disbursementTotal), 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">' . (($requestTotal > $disbursementTotal) ? '⚠️ Under-disbursed' : '✅ Fully disbursed') . '</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Unspent Funds</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format(max(0, $disbursementTotal - $retirementTotal), 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">' . (($disbursementTotal > $retirementTotal) ? '⚠️ Unspent' : '✅ Fully utilized') . '</td>
                        </tr>
                        <tr style="background-color: #e8f4fd; border-top: 2px solid #000;">
                            <td style="border: 1px solid #000; padding: 8px;"><strong>Net Variance</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦' . number_format($requestTotal - $retirementTotal, 2) . '</td>
                            <td style="border: 1px solid #000; padding: 8px;">' . (($requestTotal == $retirementTotal) ? '✅ Balanced' : (($requestTotal > $retirementTotal) ? '⚠️ Under-spent' : '❌ Over-spent')) . '</td>
                        </tr>
                    </table>
                </div>

                <!-- Notes Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Notes</h3>
                    </div>
                    <div style="padding: 15px;">
                        ' . (empty($formData['notes']) ? 'No notes provided.' : nl2br(htmlspecialchars($formData['notes']))) . '
                    </div>
                </div>

                <!-- Files Box (placeholder for future use) -->
                <div style="border: 1px solid #000; border-radius:5px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Attached Files</h3>
                    </div>
                    <div style="padding: 10px;">
                        No files attached.
                    </div>
                </div>
            </div>
        </body>
        </html>';

        return $html;
    }

    /**
     * Get approval history for a request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getApprovalHistory(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');
            $result = RequestService::getApprovalHistory($requestId);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : 400;
                return static::error($result['error'], $result['message'], $status);
            }

            return static::success([
                'history' => $result['history'],
                'message' => $result['message'] ?? ''
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting approval history: ' . $e->getMessage());
            return static::error('history_error', 'Failed to retrieve approval history', 500);
        }
    }

    /**
     * Get pending approvals for the current user
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getPendingApprovals(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('unauthorized', 'User not authenticated', 401);
            }

            $page = (int) ($request->get_param('page') ?: 1);
            $perPage = (int) ($request->get_param('per_page') ?: 20);

            $result = RequestService::getPendingApprovals($user, $page, $perPage);

            return static::success([
                'requests' => $result['requests'] ?? [],
                'pagination' => $result['pagination'] ?? []
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting pending approvals: ' . $e->getMessage());
            return static::error('approvals_error', 'Failed to retrieve pending approvals', 500);
        }
    }

    // ========================================
    // ADDITIONAL REQUEST METHODS
    // ========================================

    /**
     * Update a request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('unauthorized', 'User not authenticated', 401);
            }

            $requestId = $request->get_param('id');
            if (!$requestId) {
                return static::error('invalid_request', 'Request ID is required', 400);
            }

            $updateData = [
                'data' => $request->get_param('data'),
                'total_amount' => $request->get_param('total_amount'),
                'team_id' => $request->get_param('team_id')
            ];

            // Filter out null values to avoid overwriting with nulls if not provided
            $updateData = array_filter($updateData, function ($v) {
                return $v !== null;
            });

            $items = $request->get_param('items');

            $result = RequestService::updateRequest($requestId, $updateData, $items, $user->profile_id);

            if (!$result['success']) {
                return static::error(
                    $result['error'] ?? 'update_failed',
                    $result['message'] ?? 'Failed to update request',
                    400
                );
            }

            return static::success([
                'message' => 'Request updated successfully',
                'request' => $result['request']
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error updating request: ' . $e->getMessage());
            return static::error('server_error', 'Failed to update request', 500);
        }
    }

    /**
     * Delete a request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteRequest(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return static::error('unauthorized', 'User not authenticated', 401);
            }

            $requestId = $request->get_param('id');
            if (!$requestId) {
                return static::error('invalid_request', 'Request ID is required', 400);
            }

            $result = RequestService::deleteRequest($requestId, $user->profile_id);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : (($result['error'] === 'forbidden') ? 403 : 400);
                return static::error(
                    $result['error'] ?? 'delete_failed',
                    $result['message'] ?? 'Failed to delete request',
                    $status
                );
            }

            return static::success([
                'message' => 'Request deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error deleting request: ' . $e->getMessage());
            return static::error('server_error', 'Failed to delete request', 500);
        }
    }
}
