<?php
// Auth module REST API route registration

use App\Core\Auth\Controllers\AuthController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    register_rest_route('api/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'login'],
        'permission_callback' => '__return_true',
        'tags' => ['Authentication'], // Required
        'summary' => 'User login',    // Recommended
        'description' => 'User login', // Recommended
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['email', 'password'],
                        'properties' => [
                            'email' => [
                                'type' => 'string',
                                'format' => 'email',
                                'description' => 'User email address',
                                'example' => 'user@stanforteedge.com'
                            ],
                            'password' => [
                                'type' => 'string',
                                'format' => 'password',
                                'description' => 'User password',
                                'example' => 'your_secure_password_123!'
                            ]
                        ]
                    ],
                    'examples' => [
                        'login' => [
                            'summary' => 'Login Example',
                            'value' => [
                                'email' => 'user@stanforteedge.com',
                                'password' => 'your_secure_password_123!'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'email' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User email',
                'type' => 'string',
                'default' => 'user@stanforteedge.com',
                'format' => 'email',
                'minLength' => 5,
                'maxLength' => 100,
            ],
            'password' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User password',
                'type' => 'string',
                'default' => 'password',
            ],
        ],
    ]);
    register_rest_route('api/v1', '/auth/status', [
        'methods' => 'GET',
        'callback' => [AuthController::class, 'status'],
        'permission_callback' => '__return_true',
        'tags' => ['Authentication'],
        'summary' => 'User status',
        'description' => 'User status',
    ]);
    register_rest_route('api/v1', '/auth/logout', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'logout'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Authentication'],
        'summary' => 'User logout',
        'description' => 'User logout',
    ]);
    register_rest_route('api/v1', '/auth/change-password', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'changePassword'],
        'permission_callback' => AuthMiddleware::requirePermissions([]),
        'tags' => ['Authentication'],
        'summary' => 'Change user password',
        'description' => 'Change user password',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['current_password', 'new_password', 'confirm_password'],
                        'properties' => [
                            'current_password' => [
                                'type' => 'string',
                                'format' => 'password',
                                'description' => 'Current user password',
                                'minLength' => 8
                            ],
                            'new_password' => [
                                'type' => 'string',
                                'format' => 'password',
                                'description' => 'New password (min 8 characters)',
                                'minLength' => 8
                            ],
                            'confirm_password' => [
                                'type' => 'string',
                                'format' => 'password',
                                'description' => 'Confirm new password',
                                'minLength' => 8
                            ]
                        ]
                    ],
                    'examples' => [
                        'change_password' => [
                            'summary' => 'Change Password Example',
                            'value' => [
                                'current_password' => 'current_password_123!',
                                'new_password' => 'new_secure_password_123!',
                                'confirm_password' => 'new_secure_password_123!'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'current_password' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Current user password'
            ],
            'new_password' => [
                'required' => true,
                'type' => 'string',
                'description' => 'New password (min 8 characters)',
                'minLength' => 8
            ],
            'confirm_password' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Confirm new password',
                'minLength' => 8
            ]
        ]
    ]);

    // JWT-specific endpoints
    register_rest_route('api/v1', '/auth/refresh', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'refreshToken'],
        'permission_callback' => '__return_true',
        'tags' => ['Authentication'],
        'summary' => 'Refresh JWT token',
        'description' => 'Refresh JWT token',
    ]);
    
    // Forgot password endpoint
    register_rest_route('api/v1', '/auth/forgot-password', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'forgotPassword'],
        'permission_callback' => '__return_true',
        'tags' => ['Authentication'],
        'summary' => 'Request password reset',
        'description' => 'Send password reset link to user email',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['email'],
                        'properties' => [
                            'email' => [
                                'type' => 'string',
                                'format' => 'email',
                                'description' => 'User email address',
                                'example' => 'user@stanforteedge.com'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'email' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User email',
                'type' => 'string',
                'format' => 'email',
                'minLength' => 5,
                'maxLength' => 100,
            ]
        ]
    ]);
    
    // Reset password endpoint
    register_rest_route('api/v1', '/auth/reset-password', [
        'methods' => 'POST',
        'callback' => [AuthController::class, 'resetPassword'],
        'permission_callback' => '__return_true',
        'tags' => ['Authentication'],
        'summary' => 'Reset password',
        'description' => 'Reset user password using reset token',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['token', 'new_password'],
                        'properties' => [
                            'token' => [
                                'type' => 'string',
                                'description' => 'Password reset token',
                                'minLength' => 32
                            ],
                            'new_password' => [
                                'type' => 'string',
                                'format' => 'password',
                                'description' => 'New password (min 8 characters)',
                                'minLength' => 8
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'token' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Password reset token',
                'minLength' => 32
            ],
            'new_password' => [
                'required' => true,
                'type' => 'string',
                'description' => 'New password (min 8 characters)',
                'minLength' => 8
            ]
        ]
    ]);
});
