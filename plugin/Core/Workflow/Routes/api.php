<?php
/**
 * Workflow API Routes
 * 
 * @package App\Core\Workflow\Routes
 */

defined('ABSPATH') || exit;

use App\Core\Workflow\Controllers\WorkflowController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    // Start a new workflow instance
    register_rest_route('api/v1', '/workflow/start', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'startWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow'],
        'summary' => 'Start a new workflow instance',
        'description' => 'Initiates a new workflow for the specified entity',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['workflow_name', 'entity_type', 'entity_id'],
                        'properties' => [
                            'workflow_name' => [
                                'type' => 'string',
                                'description' => 'The name of the workflow to start',
                                'example' => 'document_approval'
                            ],
                            'entity_type' => [
                                'type' => 'string',
                                'description' => 'The type of entity this workflow is for',
                                'example' => 'document'
                            ],
                            'entity_id' => [
                                'type' => 'integer',
                                'description' => 'The ID of the entity',
                                'example' => 123
                            ],
                            'data' => [
                                'type' => 'object',
                                'description' => 'Additional data for the workflow instance',
                                'example' => ['custom_field' => 'value']
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Process a workflow transition
    register_rest_route('api/v1', '/workflow/transition/(?P<instance_id>[a-f0-9-]+)', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'processTransition'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow'],
        'summary' => 'Process a workflow transition',
        'description' => 'Processes a transition in a workflow instance',
        'args' => [
            'instance_id' => [
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow instance',
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['action'],
                        'properties' => [
                            'action' => [
                                'type' => 'string',
                                'description' => 'The action to perform',
                                'example' => 'approve'
                            ],
                            'comment' => [
                                'type' => 'string',
                                'description' => 'Optional comment for the action',
                                'example' => 'Looks good!'
                            ],
                            'data' => [
                                'type' => 'object',
                                'description' => 'Additional data for the transition',
                                'example' => ['reason' => 'meets_requirements']
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get available actions for the current user
    register_rest_route('api/v1', '/workflow/actions/(?P<instance_id>[a-f0-9-]+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getAvailableActions'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_view']),
        'tags' => ['Workflow'],
        'summary' => 'Get available workflow actions',
        'description' => 'Retrieves a list of available actions for the current user on a workflow instance',
        'args' => [
            'instance_id' => [
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow instance'
            ]
        ]
    ]);

    // Get workflow history
    register_rest_route('api/v1', '/workflow/history/(?P<instance_id>[a-f0-9-]+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getHistory'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_view']),
        'tags' => ['Workflow'],
        'summary' => 'Get workflow history',
        'description' => 'Retrieves the history of actions for a workflow instance',
        'args' => [
            'instance_id' => [
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow instance'
            ],
            'limit' => [
                'required' => false,
                'type' => 'integer',
                'default' => 50,
                'sanitize_callback' => 'absint',
                'validate_callback' => function($param) {
                    return $param >= 1 && $param <= 100;
                },
                'description' => 'Number of history items to return (1-100)'
            ],
            'offset' => [
                'required' => false,
                'type' => 'integer',
                'default' => 0,
                'sanitize_callback' => 'absint',
                'description' => 'Number of history items to skip'
            ]
        ]
    ]);

    // Get workflow instance details
    register_rest_route('api/v1', '/workflow/instance/(?P<instance_id>[a-f0-9-]+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getInstance'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_view']),
        'tags' => ['Workflow'],
        'summary' => 'Get workflow instance details',
        'description' => 'Retrieves detailed information about a workflow instance',
        'args' => [
            'instance_id' => [
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow instance'
            ]
        ]
    ]);

    // Cancel a workflow instance
    register_rest_route('api/v1', '/workflow/cancel/(?P<instance_id>[a-f0-9-]+)', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'cancelWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow'],
        'summary' => 'Cancel a workflow instance',
        'description' => 'Cancels an active workflow instance',
        'args' => [
            'instance_id' => [
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow instance to cancel'
            ]
        ],
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'reason' => [
                                'type' => 'string',
                                'description' => 'Reason for cancellation',
                                'example' => 'No longer needed'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);
});
