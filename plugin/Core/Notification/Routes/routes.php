<?php

/**
 * Notification module REST API routes
 * 
 * This file registers all REST API endpoints for the Notification system.
 * All routes use the 'api/v1' namespace and require authentication.
 */

use App\Core\Notification\Controllers\NotificationController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    // Send notification
    register_rest_route('api/v1', '/notifications', [
        'methods' => 'POST',
        'callback' => [NotificationController::class, 'sendNotification'],
        'permission_callback' => AuthMiddleware::requirePermissions(['send_notifications']),
        'tags' => ['Notifications'],
        'summary' => 'Send a notification to one or more users',
        'description' => 'Sends a notification to one or more users with specified details.',
        'args' => [
            'user_id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param) || (is_array($param) && !empty($param));
                },
                'sanitize_callback' => function ($param) {
                    return is_array($param) ? array_map('intval', $param) : intval($param);
                },
                'description' => 'Single user ID or array of user IDs to receive the notification',
            ],
            'type' => [
                'required' => false,
                'validate_callback' => function ($param) {
                    $validTypes = ['info', 'warning', 'success', 'error', 'action', 'reminder', 'system'];
                    return in_array($param, $validTypes);
                },
                'default' => 'info',
                'description' => 'Type of notification (info, warning, success, error, action, reminder, system)',
            ],
            'title' => [
                'required' => true,
                'sanitize_callback' => 'sanitize_text_field',
                'description' => 'Notification title',
            ],
            'message' => [
                'required' => true,
                'sanitize_callback' => 'sanitize_textarea_field',
                'description' => 'Notification message',
            ],
            'link' => [
                'required' => false,
                'sanitize_callback' => 'esc_url_raw',
                'description' => 'Optional link for the notification',
            ],
            'data' => [
                'required' => false,
                'validate_callback' => function ($param) {
                    if (!is_array($param)) {
                        return false;
                    }
                    return true;
                },
                'sanitize_callback' => function ($param) {
                    return is_array($param) ? $param : [];
                },
                'description' => 'Additional data to include with the notification (must be an array)',
            ],
            'send_via' => [
                'required' => false,
                'validate_callback' => function ($param) {
                    if (!is_array($param)) {
                        return false;
                    }
                    $validChannels = ['in-app', 'email', 'sms'];
                    foreach ($param as $channel) {
                        if (!in_array($channel, $validChannels)) {
                            return false;
                        }
                    }
                    return true;
                },
                'sanitize_callback' => function ($param) {
                    return is_array($param) ? $param : ['in-app'];
                },
                'default' => ['in-app'],
                'description' => 'Array of delivery methods (in-app, email, sms)',
            ],
            'notifiable_type' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'description' => 'Type of notifiable entity (e.g., request, user)',
            ],
            'notifiable_id' => [
                'required' => false,
                'sanitize_callback' => 'absint',
                'description' => 'ID of the notifiable entity',
            ],
        ],
    ]);

    // Get user notifications
    register_rest_route('api/v1', '/notifications', [
        [
            'methods' => 'GET',
            'callback' => [NotificationController::class, 'getUserNotifications'],
            'permission_callback' => AuthMiddleware::requirePermissions([]),
            'tags' => ['Notifications'],
            'summary' => 'Get user notifications',
            'description' => 'Retrieves a paginated list of notifications for the authenticated user.',
            'request_body' => [
                'required' => false,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                // No request body expected for GET request
                            ],
                        ],
                    ],
                ],
            ],
            'args' => [
                'status' => [
                    'type' => 'string',
                    'enum' => ['read', 'unread'],
                    'description' => 'Filter notifications by status',
                ],
                'page' => [
                    'type' => 'integer',
                    'minimum' => 1,
                    'default' => 1,
                    'description' => 'Page number for pagination',
                ],
                'per_page' => [
                    'type' => 'integer',
                    'minimum' => 1,
                    'maximum' => 100,
                    'default' => 20,
                    'description' => 'Number of items per page',
                ],
                'orderby' => [
                    'type' => 'string',
                    'enum' => ['created_at', 'read_at'],
                    'default' => 'created_at',
                    'description' => 'Field to order by',
                ],
                'order' => [
                    'type' => 'string',
                    'enum' => ['asc', 'desc'],
                    'default' => 'desc',
                    'description' => 'Sort order',
                ],
            ],
        ],
    ]);

    // Get single notification
    register_rest_route('api/v1', '/notifications/(?P<id>\\d+)', [
        'methods' => 'GET',
        'callback' => [NotificationController::class, 'getNotification'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Notifications'],
        'summary' => 'Get single notification',
        'description' => 'Retrieves a single notification for the authenticated user.',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => 'is_numeric',
                'sanitize_callback' => 'absint',
                'description' => 'ID of the notification to retrieve',
            ],
        ],
    ]);

    // Get unread notifications count
    register_rest_route('api/v1', '/notifications/unread-count', [
        'methods' => 'GET',
        'callback' => [NotificationController::class, 'getUnreadCount'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Notifications'],
        'summary' => 'Get unread notifications count',
        'description' => 'Returns the count of unread notifications for the authenticated user.',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            // No request body expected for GET request
                        ],
                    ],
                ],
            ],
        ],
    ]);

    // Mark notification as read
    register_rest_route('api/v1', '/notifications/(?P<id>\d+)/read', [
        'methods' => 'PUT',
        'callback' => [NotificationController::class, 'markAsRead'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Notifications'],
        'summary' => 'Mark notification as read',
        'description' => 'Marks a specific notification as read for the authenticated user.',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'integer',
                                'validate_callback' => 'absint',
                                'required' => true,
                                'description' => 'The ID of the notification to mark as read',
                            ],
                        ],
                    ],
                ],
            ],
        ],
        'args' => [
            'id' => [
                'type' => 'integer',
                'validate_callback' => 'absint',
                'required' => true,
                'description' => 'The ID of the notification to mark as read',
            ],
        ],
    ]);

    // Mark all notifications as read
    register_rest_route('api/v1', '/notifications/mark-all-read', [
        'methods' => 'PUT',
        'callback' => [NotificationController::class, 'markAllAsRead'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Notifications'],
        'summary' => 'Mark all notifications as read',
        'description' => 'Marks all unread notifications as read for the authenticated user.',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            // No specific properties required in the request body
                        ],
                    ],
                ],
            ],
        ],
    ]);

    // Delete notification
    register_rest_route('api/v1', '/notifications/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [NotificationController::class, 'deleteNotification'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Notifications'],
        'summary' => 'Delete notification',
        'description' => 'Deletes a specific notification for the authenticated user.',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'integer',
                                'validate_callback' => 'absint',
                                'required' => true,
                                'description' => 'The ID of the notification to delete',
                            ],
                        ],
                    ],
                ],
            ],
        ],
        'args' => [
            'id' => [
                'type' => 'integer',
                'validate_callback' => 'absint',
                'required' => true,
                'description' => 'The ID of the notification to delete',
            ],
        ],
    ]);
});
