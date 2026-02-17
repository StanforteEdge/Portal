<?php
/**
 * Workflow Admin API Routes
 * 
 * @package App\Core\Workflow\Routes
 */

defined('ABSPATH') || exit;

use App\Core\Workflow\Controllers\WorkflowController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    // Get all workflows
    register_rest_route('api/v1', '/admin/workflows', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflows'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'List workflows',
        'description' => 'Retrieves a list of workflows with optional filtering',
        'args' => [
            'entity_type' => [
                'type' => 'string',
                'description' => 'Filter workflows by entity type'
            ],
            'is_active' => [
                'type' => 'boolean',
                'description' => 'Filter workflows by active status'
            ],
            'page' => [
                'type' => 'integer',
                'default' => 1,
                'sanitize_callback' => 'absint',
                'description' => 'Page number'
            ],
            'per_page' => [
                'type' => 'integer',
                'default' => 20,
                'sanitize_callback' => 'absint',
                'description' => 'Items per page'
            ]
        ]
    ]);

    // Get a specific workflow
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Get workflow',
        'description' => 'Retrieves a specific workflow by ID',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow'
            ]
        ]
    ]);

    // Create new workflow
    register_rest_route('api/v1', '/admin/workflows', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'createWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Create workflow',
        'description' => 'Creates a new workflow',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['name', 'entity_type'],
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the workflow',
                                'example' => 'Document Approval'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Description of the workflow',
                                'example' => 'Workflow for document approval process'
                            ],
                            'entity_type' => [
                                'type' => 'string',
                                'description' => 'The type of entity this workflow applies to',
                                'example' => 'document'
                            ],
                            'is_active' => [
                                'type' => 'boolean',
                                'description' => 'Whether the workflow is active',
                                'default' => true
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the workflow'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Update workflow
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)', [
        'methods' => 'PUT',
        'callback' => [WorkflowController::class, 'updateWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Update workflow',
        'description' => 'Updates an existing workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow to update'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the workflow'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Description of the workflow'
                            ],
                            'is_active' => [
                                'type' => 'boolean',
                                'description' => 'Whether the workflow is active'
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the workflow'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete workflow
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [WorkflowController::class, 'deleteWorkflow'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Delete workflow',
        'description' => 'Deletes a workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow to delete'
            ]
        ]
    ]);

    // Get workflow steps
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)/steps', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflowSteps'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'List workflow steps',
        'description' => 'Retrieves steps for a workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow'
            ]
        ]
    ]);

    // Create workflow step
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)/steps', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'createWorkflowStep'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Create workflow step',
        'description' => 'Creates a new step in a workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['name', 'step_type'],
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the step'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'A description of the step'
                            ],
                            'step_type' => [
                                'type' => 'string',
                                'enum' => ['approval', 'notification', 'task', 'condition'],
                                'description' => 'The type of step'
                            ],
                            'order' => [
                                'type' => 'integer',
                                'default' => 0,
                                'description' => 'The order of the step in the workflow'
                            ],
                            'is_initial' => [
                                'type' => 'boolean',
                                'default' => false,
                                'description' => 'Whether this is the initial step'
                            ],
                            'is_final' => [
                                'type' => 'boolean',
                                'default' => false,
                                'description' => 'Whether this is a final step'
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the step'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get specific workflow step
    register_rest_route('api/v1', '/admin/workflows/steps/(?P<step_id>\d+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflowStep'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Get workflow step',
        'description' => 'Retrieves a specific workflow step',
        'args' => [
            'step_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow step'
            ]
        ]
    ]);

    // Update workflow step
    register_rest_route('api/v1', '/admin/workflows/steps/(?P<step_id>\d+)', [
        'methods' => 'PUT',
        'callback' => [WorkflowController::class, 'updateWorkflowStep'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Update workflow step',
        'description' => 'Updates a workflow step',
        'args' => [
            'step_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow step'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the step'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'A description of the step'
                            ],
                            'step_type' => [
                                'type' => 'string',
                                'enum' => ['approval', 'notification', 'task', 'condition'],
                                'description' => 'The type of step'
                            ],
                            'order' => [
                                'type' => 'integer',
                                'description' => 'The order of the step in the workflow'
                            ],
                            'is_initial' => [
                                'type' => 'boolean',
                                'description' => 'Whether this is the initial step'
                            ],
                            'is_final' => [
                                'type' => 'boolean',
                                'description' => 'Whether this is a final step'
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the step'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete workflow step
    register_rest_route('api/v1', '/admin/workflows/steps/(?P<step_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [WorkflowController::class, 'deleteWorkflowStep'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Delete workflow step',
        'description' => 'Deletes a workflow step',
        'args' => [
            'step_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow step to delete'
            ]
        ]
    ]);

    // Get step approvers
    register_rest_route('api/v1', '/admin/workflows/steps/(?P<step_id>\d+)/approvers', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getStepApprovers'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'List step approvers',
        'description' => 'Retrieves approvers for a workflow step',
        'args' => [
            'step_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow step'
            ]
        ]
    ]);

    // Add step approver
    register_rest_route('api/v1', '/admin/workflows/steps/(?P<step_id>\d+)/approvers', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'addStepApprover'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Add step approver',
        'description' => 'Adds an approver to a workflow step',
        'args' => [
            'step_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow step'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['approver_type', 'approver_id'],
                        'properties' => [
                            'approver_type' => [
                                'type' => 'string',
                                'enum' => ['user', 'role', 'group'],
                                'description' => 'The type of approver'
                            ],
                            'approver_id' => [
                                'type' => 'integer',
                                'description' => 'The ID of the user, role, or group'
                            ],
                            'is_required' => [
                                'type' => 'boolean',
                                'default' => true,
                                'description' => 'Whether this approver is required'
                            ],
                            'approval_order' => [
                                'type' => 'integer',
                                'default' => 0,
                                'description' => 'The order in which this approver should be processed'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Update step approver
    register_rest_route('api/v1', '/admin/workflows/approvers/(?P<approver_id>\d+)', [
        'methods' => 'PUT',
        'callback' => [WorkflowController::class, 'updateStepApprover'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Update step approver',
        'description' => 'Updates a step approver',
        'args' => [
            'approver_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the approver'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'is_required' => [
                                'type' => 'boolean',
                                'description' => 'Whether this approver is required'
                            ],
                            'approval_order' => [
                                'type' => 'integer',
                                'description' => 'The order in which this approver should be processed'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Remove step approver
    register_rest_route('api/v1', '/admin/workflows/approvers/(?P<approver_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [WorkflowController::class, 'removeStepApprover'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Remove step approver',
        'description' => 'Removes a step approver',
        'args' => [
            'approver_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the approver to remove'
            ]
        ]
    ]);

    // Get workflow transitions
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)/transitions', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflowTransitions'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'List workflow transitions',
        'description' => 'Retrieves transitions for a workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow'
            ]
        ]
    ]);

    // Create workflow transition
    register_rest_route('api/v1', '/admin/workflows/(?P<workflow_id>\d+)/transitions', [
        'methods' => 'POST',
        'callback' => [WorkflowController::class, 'createWorkflowTransition'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Create workflow transition',
        'description' => 'Creates a new transition in a workflow',
        'args' => [
            'workflow_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the workflow'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['from_step_id', 'to_step_id', 'action'],
                        'properties' => [
                            'from_step_id' => [
                                'type' => 'integer',
                                'description' => 'The ID of the source step'
                            ],
                            'to_step_id' => [
                                'type' => 'integer',
                                'description' => 'The ID of the target step'
                            ],
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the transition (defaults to action)'
                            ],
                            'action' => [
                                'type' => 'string',
                                'description' => 'The action that triggers this transition'
                            ],
                            'conditions' => [
                                'type' => 'array',
                                'description' => 'Conditions that must be met for this transition to be available'
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the transition'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get specific workflow transition
    register_rest_route('api/v1', '/admin/workflows/transitions/(?P<transition_id>\d+)', [
        'methods' => 'GET',
        'callback' => [WorkflowController::class, 'getWorkflowTransition'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Get workflow transition',
        'description' => 'Retrieves a specific workflow transition',
        'args' => [
            'transition_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the transition'
            ]
        ]
    ]);

    // Update workflow transition
    register_rest_route('api/v1', '/admin/workflows/transitions/(?P<transition_id>\d+)', [
        'methods' => 'PUT',
        'callback' => [WorkflowController::class, 'updateWorkflowTransition'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Update workflow transition',
        'description' => 'Updates a workflow transition',
        'args' => [
            'transition_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the transition'
            ]
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'The name of the transition'
                            ],
                            'action' => [
                                'type' => 'string',
                                'description' => 'The action that triggers this transition'
                            ],
                            'conditions' => [
                                'type' => 'array',
                                'description' => 'Conditions that must be met for this transition to be available'
                            ],
                            'config' => [
                                'type' => 'object',
                                'description' => 'Additional configuration for the transition'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete workflow transition
    register_rest_route('api/v1', '/admin/workflows/transitions/(?P<transition_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [WorkflowController::class, 'deleteWorkflowTransition'],
        'permission_callback' => AuthMiddleware::requirePermissions(['workflow_manage']),
        'tags' => ['Workflow Admin'],
        'summary' => 'Delete workflow transition',
        'description' => 'Deletes a workflow transition',
        'args' => [
            'transition_id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'The ID of the transition to delete'
            ]
        ]
    ]);
});
