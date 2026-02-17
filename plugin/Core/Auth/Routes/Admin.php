<?php

use App\Core\Auth\Controllers\RBACController;
use App\Core\Auth\Middleware\AuthMiddleware;

// REST API endpoints for admin RBAC management
add_action('rest_api_init', function () {

    // RBAC Management Endpoints - Roles
    register_rest_route('api/v1', '/admin/rbac/roles', [
        'methods' => 'GET',
        'callback' => [RBACController::class, 'listRoles'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'tags' => ['RBAC'],
        'summary' => 'List all roles',
        'description' => 'List all roles',
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles', [
        'methods' => 'POST',
        'callback' => [RBACController::class, 'createRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'tags' => ['RBAC'],
        'summary' => 'Create a new role',
        'description' => 'Create a new role',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['name'],
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'Role name',
                                'example' => 'user'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Role description',
                                'example' => 'User role'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'name' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                }
            ],
            'description' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'GET',
        'callback' => [RBACController::class, 'getRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'tags' => ['RBAC'],
        'summary' => 'Get a role by ID',
        'description' => 'Get a role by ID',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT,PATCH',
        'callback' => [RBACController::class, 'updateRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'tags' => ['RBAC'],
        'summary' => 'Update a role',
        'description' => 'Update a role',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['name', 'description'],
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'Role name',
                                'example' => 'user'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Role description',
                                'example' => 'User role'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ],
            'name' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                }
            ],
            'description' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [RBACController::class, 'deleteRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'tags' => ['RBAC'],
        'summary' => 'Delete a role',
        'description' => 'Delete a role',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    // RBAC Management Endpoints - Permissions
    register_rest_route('api/v1', '/admin/rbac/permissions', [
        'methods' => 'GET',
        'callback' => [RBACController::class, 'listPermissions'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_permissions'),
        'tags' => ['RBAC'],
        'summary' => 'List all permissions',
        'description' => 'List all permissions'
    ]);

    register_rest_route('api/v1', '/admin/rbac/permissions', [
        'methods' => 'POST',
        'callback' => [RBACController::class, 'createPermission'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_permissions'),
        'tags' => ['RBAC'],
        'summary' => 'Create a permission',
        'description' => 'Create a permission',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['name', 'description'],
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'Permission name',
                                'example' => 'user.create'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Permission description',
                                'example' => 'Create a user'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'name' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                }
            ],
            'description' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/permissions/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'GET',
        'callback' => [RBACController::class, 'getPermission'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_permissions'),
        'tags' => ['RBAC'],
        'summary' => 'Get a permission by ID',
        'description' => 'Get a permission by ID',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/permissions/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT,PATCH',
        'callback' => [RBACController::class, 'updatePermission'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_permissions'),
        'tags' => ['RBAC'],
        'summary' => 'Update a permission',
        'description' => 'Update a permission',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['id', 'name', 'description'],
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Permission ID',
                                'example' => '1'
                            ],
                            'name' => [
                                'type' => 'string',
                                'description' => 'Permission name',
                                'example' => 'user.create'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Permission description',
                                'example' => 'Create a user'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    register_rest_route('api/v1', '/admin/rbac/permissions/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [RBACController::class, 'deletePermission'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_permissions'),
        'tags' => ['RBAC'],
        'summary' => 'Delete a permission',
        'description' => 'Delete a permission',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ]
    ]);

    // Role-Permission Relationship Management
    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)/permissions', [
        'methods' => 'GET',
        'callback' => [RBACController::class, 'getRolePermissions'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ],
        'tags' => ['RBAC'],
        'summary' => 'Get role permissions',
        'description' => 'Get role permissions',
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)/permissions', [
        'methods' => 'POST',
        'callback' => [RBACController::class, 'assignPermissionToRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ],
            'permission_id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ],
        ],
        'tags' => ['RBAC'],
        'summary' => 'Assign a permission to a role',
        'description' => 'Assign a permission to a role',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['id', 'permission_id'],
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Role ID',
                                'example' => '1'
                            ],
                            'permission_id' => [
                                'type' => 'string',
                                'description' => 'Permission ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ],
        ],
    ]);

    register_rest_route('api/v1', '/admin/rbac/roles/(?P<id>[a-zA-Z0-9-]+)/permissions/(?P<permission_id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [RBACController::class, 'removePermissionFromRole'],
        'permission_callback' => AuthMiddleware::requirePermissions('roles.manage'),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ],
            'permission_id' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param);
                }
            ]
        ],
        'tags' => ['RBAC'],
        'summary' => 'Remove a permission from a role',
        'description' => 'Remove a permission from a role',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['id', 'permission_id'],
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Role ID',
                                'example' => '1'
                            ],
                            'permission_id' => [
                                'type' => 'string',
                                'description' => 'Permission ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);
    // Dashboard Endpoints
    register_rest_route('api/v1', '/admin/stats', [
        'methods' => 'GET',
        'callback' => [\App\Modules\Admin\Controllers\AdminDashboardController::class, 'getStats'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_options'),
        'tags' => ['Dashboard'],
        'summary' => 'Get dashboard statistics'
    ]);

    register_rest_route('api/v1', '/admin/activity', [
        'methods' => 'GET',
        'callback' => [\App\Modules\Admin\Controllers\AdminDashboardController::class, 'getRecentActivity'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_options'),
        'tags' => ['Dashboard'],
        'summary' => 'Get recent activity'
    ]);

    register_rest_route('api/v1', '/admin/roles/distribution', [
        'methods' => 'GET',
        'callback' => [\App\Modules\Admin\Controllers\AdminDashboardController::class, 'getRoleDistribution'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_options'),
        'tags' => ['Dashboard'],
        'summary' => 'Get user distribution by role'
    ]);

    register_rest_route('api/v1', '/admin/health', [
        'methods' => 'GET',
        'callback' => [\App\Modules\Admin\Controllers\AdminDashboardController::class, 'getSystemHealth'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_options'),
        'tags' => ['Dashboard'],
        'summary' => 'Get system health status'
    ]);
});
