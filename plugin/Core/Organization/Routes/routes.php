<?php

/**
 * Routes for Organization Module
 */

use App\Core\Organization\Controllers\OrganizationController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    $controller = new OrganizationController();

    register_rest_route('api/v1', '/organizations', [
        [
            'methods' => 'GET',
            'callback' => [$controller, 'index'],
            'permission_callback' => AuthMiddleware::requirePermissions(['settings.manage'])
        ],
        [
            'methods' => 'POST',
            'callback' => [$controller, 'create'],
            'permission_callback' => AuthMiddleware::requirePermissions(['settings.manage'])
        ]
    ]);

    register_rest_route('api/v1', '/organizations/my', [
        'methods' => 'GET',
        'callback' => [$controller, 'getMyOrganizations'],
        'permission_callback' => [AuthMiddleware::class, 'isAuthenticated']
    ]);

    register_rest_route('api/v1', '/organizations/(?P<id>[a-zA-Z0-9-]+)', [
        [
            'methods' => 'PUT',
            'callback' => [$controller, 'update'],
            'permission_callback' => AuthMiddleware::requirePermissions(['settings.manage'])
        ],
        [
            'methods' => 'DELETE',
            'callback' => [$controller, 'delete'],
            'permission_callback' => AuthMiddleware::requirePermissions(['settings.manage'])
        ]
    ]);
});
