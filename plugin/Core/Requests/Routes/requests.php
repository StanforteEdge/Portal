<?php

namespace App\Core\Requests\Routes;

use App\Core\Requests\Controllers\RequestController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {

    // GET /api/v1/request-groups - Get request groups
    register_rest_route('api/v1', '/requests/groups', [
        [
            'methods' => 'GET',
            'callback' => [RequestController::class, 'getGroups'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
        ],
        [
            'methods' => 'POST',
            'callback' => [RequestController::class, 'createGroup'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
        ]
    ]);

    // PUT/DELETE /api/v1/request-groups/{id}
    register_rest_route('api/v1', '/requests/groups/(?P<id>[a-f0-9-]+)', [
        [
            'methods' => ['PUT', 'POST'],
            'callback' => [RequestController::class, 'updateGroup'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
        ],
        [
            'methods' => 'DELETE',
            'callback' => [RequestController::class, 'deleteGroup'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
        ]
    ]);

    // GET/POST /api/v1/request-types - Get/Create request types
    register_rest_route('api/v1', '/requests/types', [
        [
            'methods' => 'GET',
            'callback' => [RequestController::class, 'getTypes'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
            'tags' => ['Request System', 'Admin'],
            'summary' => 'List request types',
            'args' => [
                'group_id' => [
                    'required' => false,
                    'type' => 'string'
                ],
                'include_inactive' => [
                    'required' => false,
                    'type' => 'string'
                ]
            ]
        ],
        [
            'methods' => 'POST',
            'callback' => [RequestController::class, 'createType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
            'tags' => ['Request System', 'Admin'],
            'summary' => 'Create request type',
            'description' => 'Create a new request type with specific storage strategy (Level 1-4)',
            'request_body' => [
                'required' => true,
                'schema' => [
                    'type' => 'object',
                    'required' => ['group_id', 'name', 'code_prefix'],
                    'properties' => [
                        'group_id' => ['type' => 'string', 'format' => 'uuid'],
                        'name' => ['type' => 'string'],
                        'code_prefix' => ['type' => 'string'],
                        'description' => ['type' => 'string'],
                        'storage_type' => [
                            'type' => 'string',
                            'enum' => ['form', 'special', 'bypass'],
                            'default' => 'form',
                            'description' => 'Storage strategy: form (EAV/Custom), special (Module logic), bypass'
                        ],
                        'form_id' => ['type' => 'string', 'format' => 'uuid'],
                        'is_active' => ['type' => 'boolean', 'default' => true]
                    ]
                ]
            ]
        ]
    ]);

    // GET/PUT/DELETE /api/v1/request-types/{id}
    register_rest_route('api/v1', '/requests/types/(?P<id>[a-f0-9-]+)', [
        [
            'methods' => 'GET',
            'callback' => [RequestController::class, 'getType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
        ],
        [
            'methods' => ['PUT', 'POST'],
            'callback' => [RequestController::class, 'updateType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
        ],
        [
            'methods' => 'DELETE',
            'callback' => [RequestController::class, 'deleteType'],
            'permission_callback' => AuthMiddleware::requirePermissions(['requests.manage']),
        ]
    ]);

    // POST /api/v1/requests - Create new request
    register_rest_route('api/v1', '/requests', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'createRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.create']),
        'tags' => ['Request System'],
        'summary' => 'Create request',
        'description' => 'Create a new request with form data and optional items',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['request_type_id', 'data'],
                        'properties' => [
                            'request_type_id' => [
                                'type' => 'string',
                                'format' => 'uuid',
                                'description' => 'Request type ID'
                            ],
                            'data' => [
                                'type' => 'object',
                                'description' => 'Form data matching request type schema'
                            ],
                            'team_id' => [
                                'type' => 'string',
                                'format' => 'uuid',
                                'description' => 'Team context for the request'
                            ],
                            'total_amount' => [
                                'type' => 'number',
                                'description' => 'Total amount (auto-calculated from items if not provided)'
                            ],
                            'currency' => [
                                'type' => 'string',
                                'default' => 'NGN',
                                'description' => 'Currency code'
                            ],
                            'items' => [
                                'type' => 'array',
                                'description' => 'Request line items',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'description' => ['type' => 'string'],
                                        'amount' => ['type' => 'number'],
                                        'quantity' => ['type' => 'integer', 'default' => 1],
                                        'category_id' => ['type' => 'string', 'format' => 'uuid'],
                                        'subcategory_id' => ['type' => 'string', 'format' => 'uuid'],
                                        'due_date' => ['type' => 'string', 'format' => 'date'],
                                        'notes' => ['type' => 'string']
                                    ],
                                    'required' => ['description', 'amount']
                                ]
                            ]
                        ]
                    ],
                    'examples' => [
                        'petty_cash_request' => [
                            'summary' => 'Petty Cash Request Example',
                            'value' => [
                                'request_type_id' => 'uuid-here',
                                'data' => [
                                    'amount' => 25000,
                                    'purpose' => 'Office supplies',
                                    'due_date' => '2025-01-15'
                                ],
                                'team_id' => 'team-uuid-here',
                                'currency' => 'NGN'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // POST /api/v1/requests/{id}/submit - Submit request for approval
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/submit', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'submitRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.create']),
        'tags' => ['Request System'],
        'summary' => 'Submit request for approval',
        'description' => 'Submit a draft request for approval workflow processing',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ]
        ]
    ]);

    // GET /api/v1/requests - Get requests with filtering
    register_rest_route('api/v1', '/requests', [
        'methods' => 'GET',
        'callback' => [RequestController::class, 'getRequests'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
        'tags' => ['Request System'],
        'summary' => 'Get requests',
        'description' => 'Retrieve requests with optional filtering and pagination',
        'args' => [
            'page' => [
                'required' => false,
                'description' => 'Page number (1-based)',
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1
            ],
            'per_page' => [
                'required' => false,
                'description' => 'Items per page',
                'type' => 'integer',
                'default' => 20,
                'minimum' => 1,
                'maximum' => 100
            ],
            'status' => [
                'required' => false,
                'description' => 'Filter by request status',
                'type' => 'string',
                'enum' => ['draft', 'submitted', 'approved', 'rejected', 'completed']
            ],
            'request_type_id' => [
                'required' => false,
                'description' => 'Filter by request type ID',
                'type' => 'string',
                'format' => 'uuid'
            ],
            'group_id' => [
                'required' => false,
                'description' => 'Filter by request group ID',
                'type' => 'string',
                'format' => 'uuid'
            ],
            'created_by' => [
                'required' => false,
                'description' => 'Filter by creator user ID',
                'type' => 'integer'
            ],
            'my_requests' => [
                'required' => false,
                'description' => 'Filter to current user\'s requests only',
                'type' => 'boolean',
                'default' => false
            ]
        ]
    ]);

    // GET /api/v1/requests/{id} - Get specific request
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)', [
        'methods' => 'GET',
        'callback' => [RequestController::class, 'getRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
        'tags' => ['Request System'],
        'summary' => 'Get request details',
        'description' => 'Retrieve detailed information about a specific request including items, attachments, and workflow status',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ]
        ]
    ]);

    // PUT /api/v1/requests/{id} - Update request
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)', [
        'methods' => 'PUT',
        'callback' => [RequestController::class, 'updateRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.create']),
        'tags' => ['Request System'],
        'summary' => 'Update request',
        'description' => 'Update a draft request (only draft requests can be updated)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'data' => [
                                'type' => 'object',
                                'description' => 'Updated form data'
                            ],
                            'total_amount' => [
                                'type' => 'number',
                                'description' => 'Updated total amount'
                            ],
                            'team_id' => [
                                'type' => 'string',
                                'format' => 'uuid',
                                'description' => 'Updated team ID'
                            ],
                            'items' => [
                                'type' => 'array',
                                'description' => 'Updated request items',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'description' => ['type' => 'string'],
                                        'amount' => ['type' => 'number'],
                                        'quantity' => ['type' => 'integer'],
                                        'due_date' => ['type' => 'string', 'format' => 'date']
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // DELETE /api/v1/requests/{id} - Delete request
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [RequestController::class, 'deleteRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.create']),
        'tags' => ['Request System'],
        'summary' => 'Delete request',
        'description' => 'Delete a draft request (only draft requests can be deleted)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ]
        ]
    ]);

    // GET /api/v1/requests/pending-approvals - Get pending approvals
    register_rest_route('api/v1', '/requests/pending-approvals', [
        'methods' => 'GET',
        'callback' => [RequestController::class, 'getPendingApprovals'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve']),
        'tags' => ['Request System'],
        'summary' => 'Get pending approvals',
        'description' => 'Retrieve requests pending approval for the current user',
        'args' => [
            'page' => [
                'required' => false,
                'description' => 'Page number',
                'type' => 'integer',
                'default' => 1
            ],
            'per_page' => [
                'required' => false,
                'description' => 'Items per page',
                'type' => 'integer',
                'default' => 20
            ]
        ]
    ]);

    // POST /api/v1/requests/{id}/approve - Approve request
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/approve', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'approveRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve']),
        'tags' => ['Request System'],
        'summary' => 'Approve request',
        'description' => 'Approve a request at the current workflow step',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ],
            'comment' => [
                'required' => false,
                'description' => 'Optional approval comment',
                'type' => 'string'
            ]
        ]
    ]);

    // POST /api/v1/requests/{id}/reject - Reject request
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/reject', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'rejectRequest'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve']),
        'tags' => ['Request System'],
        'summary' => 'Reject request',
        'description' => 'Reject a request at the current workflow step',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ],
            'comment' => [
                'required' => true,
                'description' => 'Rejection reason (required)',
                'type' => 'string'
            ]
        ]
    ]);

    // GET /api/v1/requests/{id}/history - Get approval history
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/history', [
        'methods' => 'GET',
        'callback' => [RequestController::class, 'getApprovalHistory'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.view']),
        'tags' => ['Request System'],
        'summary' => 'Get approval history',
        'description' => 'Retrieve the complete approval history for a request',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ]
        ]
    ]);

    // POST /api/v1/requests/{id}/actions - Process workflow action
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/actions', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'processAction'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve']),
        'tags' => ['Request System'],
        'summary' => 'Process workflow action',
        'description' => 'Process approval actions on requests (approve, reject, etc.)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'Request ID',
                'type' => 'string',
                'format' => 'uuid'
            ],
            'action' => [
                'required' => true,
                'description' => 'Action to perform',
                'type' => 'string',
                'enum' => ['approve', 'reject', 'escalate', 'disburse', 'retire', 'complete']
            ],
            'comment' => [
                'required' => false,
                'description' => 'Optional comment for the action',
                'type' => 'string',
                'maxLength' => 1000
            ]
        ]
    ]);

    // POST /api/v1/requests/generate-pdf - Generate PDF from form data
    register_rest_route('api/v1', '/requests/generate-pdf', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'generatePdfFromForm'],
        'permission_callback' => '__return_true',
        'tags' => ['Request System'],
        'summary' => 'Generate PDF from form data',
        'description' => 'Generate a PDF document from form input data without database storage'
    ]);

    // POST /api/v1/requests/generate-pv - Generate Payment Voucher PDF
    register_rest_route('api/v1', '/requests/generate-pv', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'generatePaymentVoucher'],
        'permission_callback' => '__return_true', // Consider restricting this?
        'tags' => ['Request System'],
        'summary' => 'Generate Payment Voucher PDF',
        'description' => 'Generate a Payment Voucher PDF document from form input data'
    ]);

    // POST /api/v1/requests/{id}/retire - Submit Retirement
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/retire', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'retire'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.create']), // Or requests.retire?
        'tags' => ['Request System'],
        'summary' => 'Submit Retirement',
        'description' => 'Submit proofs of spending and balance for a request'
    ]);

    // POST /api/v1/requests/{id}/verify-retirement - Verify Retirement
    register_rest_route('api/v1', '/requests/(?P<id>[a-f0-9-]+)/verify-retirement', [
        'methods' => 'POST',
        'callback' => [RequestController::class, 'verifyRetirement'],
        'permission_callback' => AuthMiddleware::requirePermissions(['requests.approve']), // Finance logic
        'tags' => ['Request System'],
        'summary' => 'Verify Retirement',
        'description' => 'Verify submitted retirement proofs and complete the request'
    ]);
});
