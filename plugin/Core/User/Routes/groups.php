<?php

namespace App\Core\User\Routes;

use App\Core\User\Controllers\GroupController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {

    // GET /groups - List groups with pagination and filtering
    register_rest_route('api/v1', '/groups', [
        'methods' => 'GET',
        'callback' => [GroupController::class, 'list'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_groups'),
        'tags' => ['Groups'],
        'summary' => 'List groups',
        'description' => 'List groups with pagination and filtering',
        'args' => [
            'page' => [
                'required' => false,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'per_page' => [
                'required' => false,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0 && $value <= 100;
                }
            ],
            'type' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ],
            'search' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ]
        ]
    ]);

    // GET /groups/{id} - Get specific group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => [GroupController::class, 'get'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_groups'),
        'tags' => ['Groups'],
        'summary' => 'Get group by ID',
        'description' => 'Get group by ID',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ]
        ]
    ]);

    // POST /groups - Create new group
    register_rest_route('api/v1', '/groups', [
        'methods' => 'POST',
        'callback' => [GroupController::class, 'create'],
        'permission_callback' => AuthMiddleware::requirePermissions('create_groups'),
        'tags' => ['Groups'],
        'summary' => 'Create new group',
        'description' => 'Create new group',
        'args' => [
            'name' => [
                'required' => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($value) {
                    return !empty(trim($value));
                }
            ],
            'description' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_textarea_field'
            ],
            'type' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default' => 'general'
            ],
            'parent_id' => [
                'required' => false,
                'validate_callback' => function ($value) {
                    return $value === null || (is_numeric($value) && $value > 0);
                }
            ]
        ]
    ]);

    // PUT /groups/{id} - Update group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)', [
        'methods' => 'PUT',
        'callback' => [GroupController::class, 'update'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_groups'),
        'tags' => ['Groups'],
        'summary' => 'Update group',
        'description' => 'Update group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'name' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($value) {
                    return !empty(trim($value));
                }
            ],
            'description' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_textarea_field'
            ],
            'type' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ],
            'parent_id' => [
                'required' => false,
                'validate_callback' => function ($value) {
                    return $value === null || (is_numeric($value) && $value > 0);
                }
            ]
        ]
    ]);

    // DELETE /groups/{id} - Delete group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [GroupController::class, 'delete'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_groups'),
        'tags' => ['Groups'],
        'summary' => 'Delete group',
        'description' => 'Delete group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ]
        ]
    ]);

    // POST /groups/{id}/users - Add user to group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/users', [
        'methods' => 'POST',
        'callback' => [GroupController::class, 'addUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Add user to group',
        'description' => 'Add user to group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'user_id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'role' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default' => 'member',
                'validate_callback' => function ($value) {
                    return in_array($value, ['member', 'admin', 'moderator']);
                }
            ]
        ]
    ]);

    // DELETE /groups/{id}/users/{userId} - Remove user from group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/users/(?P<user_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [GroupController::class, 'removeUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Remove user from group',
        'description' => 'Remove user from group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'user_id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ]
        ]
    ]);

    // DELETE /groups/{id}/users/{userId} - Remove user from group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/users/(?P<user_id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [GroupController::class, 'removeUser'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Remove user from group',
        'description' => 'Remove user from group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'user_id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ]
        ]
    ]);

    // GET /groups/{id}/members - Get group members
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/members', [
        'methods' => 'GET',
        'callback' => [GroupController::class, 'getMembers'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Get group members',
        'description' => 'Get group members',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ]
        ]
    ]);

    // POST /groups/{id}/bulk-add-users - Bulk add users to group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/bulk-add-users', [
        'methods' => 'POST',
        'callback' => [GroupController::class, 'bulkAddUsers'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Bulk add users to group',
        'description' => 'Bulk add multiple users to a group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'user_ids' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_array($value) && !empty($value);
                }
            ],
            'role' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default' => 'member',
                'validate_callback' => function ($value) {
                    return in_array($value, ['member', 'admin', 'moderator']);
                }
            ]
        ]
    ]);

    // POST /groups/{id}/bulk-remove-users - Bulk remove users from group
    register_rest_route('api/v1', '/groups/(?P<id>\d+)/bulk-remove-users', [
        'methods' => 'POST',
        'callback' => [GroupController::class, 'bulkRemoveUsers'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_group_members'),
        'tags' => ['Groups'],
        'summary' => 'Bulk remove users from group',
        'description' => 'Bulk remove multiple users from a group',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_numeric($value) && $value > 0;
                }
            ],
            'user_ids' => [
                'required' => true,
                'validate_callback' => function ($value) {
                    return is_array($value) && !empty($value);
                }
            ]
        ]
    ]);
});