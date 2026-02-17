<?php
// Admin Module - User Management Routes

use App\Modules\Admin\Controllers\UserManagementController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    // List users (Admin)
    register_rest_route('api/v1', '/admin/users', [
        'methods' => 'GET',
        'callback' => [UserManagementController::class, 'getUsers'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin'],
        'summary' => 'List users',
        'description' => 'List users with pagination and filters',
        'args' => [
            'search' => ['type' => 'string', 'required' => false, 'description' => 'Search term'],
            'type' => ['type' => 'string', 'required' => false, 'description' => 'User type e.g. staff, client'],
            'status' => ['type' => 'string', 'required' => false, 'description' => 'User status e.g. active'],
            'team_id' => ['type' => 'integer', 'required' => false, 'description' => 'Filter by team ID'],
            'has_team' => ['type' => 'boolean', 'required' => false, 'description' => 'Filter users that belong to a team'],
            'role' => ['type' => 'string', 'required' => false, 'description' => 'Filter by custom RBAC role'],
            'page' => ['type' => 'integer', 'required' => false, 'description' => 'Page number', 'default' => 1, 'minimum' => 1],
            'per_page' => ['type' => 'integer', 'required' => false, 'description' => 'Items per page', 'default' => 15, 'minimum' => 1],
        ],
    ]);

    // Create user (Admin)
    register_rest_route('api/v1', '/admin/users', [
        'methods' => 'POST',
        'callback' => [UserManagementController::class, 'createUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Create user',
        'description' => 'Create a new user profile (and WP user if provided)',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['username', 'email'],
                        'properties' => [
                            'username' => ['type' => 'string'],
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'password' => ['type' => 'string', 'minLength' => 8],
                            'first_name' => ['type' => 'string'],
                            'last_name' => ['type' => 'string'],
                            'type' => ['type' => 'string', 'description' => 'User type e.g. staff, client'],
                            'profile' => ['type' => 'object'],
                        ],
                    ],
                ],
            ],
        ],
    ]);

    // Get user by ID (Admin)
    register_rest_route('api/v1', '/admin/users/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => [UserManagementController::class, 'getUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Get user',
        'description' => 'Get a user by profile ID',
        'args' => [
            'id' => ['type' => 'integer', 'required' => true, 'description' => 'Profile ID'],
        ],
    ]);

    // Update user (Admin)
    register_rest_route('api/v1', '/admin/users/(?P<id>\d+)', [
        'methods' => 'PUT,PATCH',
        'callback' => [UserManagementController::class, 'updateUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Update user',
        'description' => 'Update a user by profile ID',
        'args' => [
            'id' => ['type' => 'integer', 'required' => true, 'description' => 'Profile ID'],
        ],
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'first_name' => ['type' => 'string'],
                            'last_name' => ['type' => 'string'],
                            'role' => ['type' => 'string'],
                            'status' => ['type' => 'string'],
                            'profile' => ['type' => 'object'],
                        ],
                    ],
                ],
            ],
        ],
    ]);

    // Delete user (Admin)
    register_rest_route('api/v1', '/admin/users/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [UserManagementController::class, 'deleteUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Delete user',
        'description' => 'Delete a user by profile ID',
        'args' => [
            'id' => ['type' => 'integer', 'required' => true, 'description' => 'Profile ID'],
        ],
    ]);

    // Get user teams (Admin)
    register_rest_route('api/v1', '/admin/users/(?P<id>\d+)/teams', [
        'methods' => 'GET',
        'callback' => [UserManagementController::class, 'getUserTeams'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Get user teams',
        'description' => 'Get teams a user belongs to',
        'args' => [
            'id' => ['type' => 'integer', 'required' => true, 'description' => 'Profile ID'],
        ],
    ]);

    // Assign user to team (Admin)
    register_rest_route('api/v1', '/admin/users/team-assign', [
        'methods' => 'POST',
        'callback' => [UserManagementController::class, 'assignToTeam'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Assign user to team',
        'description' => 'Assign a user to a team with optional role and primary flag',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['user_id', 'team_id'],
                        'properties' => [
                            'user_id' => ['type' => 'integer'],
                            'team_id' => ['type' => 'integer'],
                            'role' => ['type' => 'string', 'default' => 'member'],
                            'is_primary' => ['type' => 'boolean', 'default' => false],
                        ],
                    ],
                ],
            ],
        ],
    ]);

    // Remove user from team (Admin)
    register_rest_route('api/v1', '/admin/users/team-remove', [
        'methods' => 'DELETE',
        'callback' => [UserManagementController::class, 'removeFromTeam'],
        'permission_callback' => AuthMiddleware::requirePermissions('users.manage'),
        'tags' => ['Admin', 'Users'],
        'summary' => 'Remove user from team',
        'description' => 'Remove a user from a team',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['user_id', 'team_id'],
                        'properties' => [
                            'user_id' => ['type' => 'integer'],
                            'team_id' => ['type' => 'integer'],
                        ],
                    ],
                ],
            ],
        ],
    ]);
});
