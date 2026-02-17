<?php

use App\Modules\Finance\Controllers\PaymentVoucherController;
use App\Modules\Finance\Controllers\RetirementController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    $namespace = 'api/v1';

    $pvController = new PaymentVoucherController();
    $retirementController = new RetirementController();
    $financeReqController = new \App\Modules\Finance\Controllers\FinanceRequestController();

    // --- Finance Request Routes ---

    // Get Finance Request Types
    register_rest_route($namespace, '/finance/requests/types', [
        [
            'methods' => 'GET',
            'callback' => [$financeReqController, 'getTypes'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.view_requests'])
        ],
        [
            'methods' => 'POST',
            'callback' => [$financeReqController, 'createType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.manage_requests'])
        ]

    ]);

    // Update Finance Request Type
    register_rest_route($namespace, '/finance/requests/types/(?P<id>[0-9]+)', [
        [
            'methods' => 'POST', // Using POST for update/put usually in WP
            'callback' => [$financeReqController, 'updateType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.manage_requests'])
        ],
        [
            // Delete Finance Request Type
            'methods' => 'DELETE',
            'callback' => [$financeReqController, 'deleteType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.manage_requests'])
        ]
    ]);

    // Get Finance Lookup Data (Profile, Global Teams, Projects)
    register_rest_route($namespace, '/finance/lookup-data', [
        'methods' => 'GET',
        'callback' => [$financeReqController, 'getLookupData'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view_requests'])
    ]);

    // Create Finance Request
    register_rest_route($namespace, '/finance/requests', [
        [
            'methods' => 'POST',
            'callback' => [$financeReqController, 'create'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.create_requests'])
        ],
        [
            'methods' => 'GET',
            'callback' => [$financeReqController, 'index'],
            'permission_callback' => AuthMiddleware::requirePermissions(['finance.view'])
        ]
    ]);

    // Get Single Finance Request
    register_rest_route($namespace, '/finance/requests/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => [$financeReqController, 'getRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view'])
    ]);

    // Finance approvals (pending/approved/rejected)
    register_rest_route($namespace, '/finance/requests/approvals', [
        'methods' => 'GET',
        'callback' => [$financeReqController, 'getApprovals'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve'])
    ]);

    // Update Request Status (Finance-specific for draft->pending)
    register_rest_route($namespace, '/finance/requests/(?P<id>\d+)/status', [
        'methods' => 'POST',
        'callback' => [$financeReqController, 'updateStatus'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.create_requests'])
    ]);

    // --- Payment Voucher Routes ---

    // List Payment Vouchers
    register_rest_route($namespace, '/finance/vouchers', [
        'methods' => 'GET',
        'callback' => [$pvController, 'index'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view_vouchers'])
    ]);

    // Create PV
    register_rest_route($namespace, '/finance/payment-vouchers', [
        'methods' => 'POST',
        'callback' => [$pvController, 'create'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.create_vouchers'])
    ]);

    // Mark PV as Paid
    register_rest_route($namespace, '/finance/payment-vouchers/(?P<id>[a-zA-Z0-9-]+)/pay', [
        'methods' => 'POST',
        'callback' => [$pvController, 'markPaid'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.approve_vouchers'])
    ]);

    register_rest_route($namespace, '/finance/vouchers/(?P<id>[a-zA-Z0-9-]+)/mark-paid', [
        'methods' => 'POST',
        'callback' => [$pvController, 'markPaid'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.approve_vouchers'])
    ]);

    // Get PVs for a Request
    register_rest_route($namespace, '/finance/requests/(?P<id>[a-zA-Z0-9-]+)/pv', [
        'methods' => 'GET',
        'callback' => [$pvController, 'getByRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view_vouchers'])
    ]);


    // --- Retirement Routes ---

    // List Retirements
    register_rest_route($namespace, '/finance/retirements', [
        'methods' => 'GET',
        'callback' => [$retirementController, 'index'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view'])
    ]);

    // Submit Retirement
    register_rest_route($namespace, '/finance/retirements', [
        'methods' => 'POST',
        'callback' => [$retirementController, 'submit'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.submit_retirements'])
    ]);

    // Verify Retirement
    register_rest_route($namespace, '/finance/retirements/(?P<id>[a-zA-Z0-9-]+)/verify', [
        'methods' => 'POST',
        'callback' => [$retirementController, 'verify'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.verify_retirements'])
    ]);

    // Reject Retirement
    register_rest_route($namespace, '/finance/retirements/(?P<id>[a-zA-Z0-9-]+)/reject', [
        'methods' => 'POST',
        'callback' => [$retirementController, 'reject'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.verify_retirements'])
    ]);

    // Get Retirement for Request
    register_rest_route($namespace, '/finance/requests/(?P<id>[a-zA-Z0-9-]+)/retirement', [
        'methods' => 'GET',
        'callback' => [$retirementController, 'getByRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['finance.view_retirements'])
    ]);
});
