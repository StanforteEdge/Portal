<?php
// Register Core/User API routes (including /me)
use App\Core\User\Controllers\UserController;
use App\Core\User\Controllers\DashboardController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {
    register_rest_route('api/v1', '/profile', [
        'methods' => 'GET',
        'callback' => [UserController::class, 'me'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate'],
        'tags' => ['User'],
        'summary' => 'Get current user',
        'description' => 'Get current user',
    ]);
    register_rest_route('api/v1', '/profile', [
        'methods' => 'PATCH',
        'callback' => [UserController::class, 'updateMe'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate'],
        'tags' => ['User'],
        'summary' => 'Update current user',
        'description' => 'Update current user',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['first_name', 'last_name'],
                        'properties' => [
                            'first_name' => [
                                'type' => 'string',
                                'description' => 'User first name',
                                'example' => 'user'
                            ],
                            'last_name' => [
                                'type' => 'string',
                                'description' => 'User last name',
                                'example' => 'user'
                            ],
                            'date_of_birth' => [
                                'type' => 'string',
                                'description' => 'User date of birth',
                                'example' => '2000-01-01'
                            ],
                            'gender' => [
                                'type' => 'string',
                                'description' => 'User gender',
                                'example' => 'male'
                            ],
                            'phone' => [
                                'type' => 'string',
                                'description' => 'User phone',
                                'example' => '08123456789'
                            ],
                            'address' => [
                                'type' => 'string',
                                'description' => 'User address',
                                'example' => '19 Yesufu Sanusi'
                            ],
                            'nationality' => [
                                'type' => 'string',
                                'description' => 'User nationality',
                                'example' => 'Nigerian'
                            ],
                            'state' => [
                                'type' => 'string',
                                'description' => 'User state',
                                'example' => 'Lagos'
                            ],
                            'lga' => [
                                'type' => 'string',
                                'description' => 'User LGA',
                                'example' => 'Surulere'
                            ],
                            'city' => [
                                'type' => 'string',
                                'description' => 'User city',
                                'example' => 'Surulere'
                            ],
                            'marital_status' => [
                                'type' => 'string',
                                'description' => 'User marital status',
                                'example' => 'single'
                            ],
                            'avatar' => [
                                'type' => 'string',
                                'description' => 'User avatar',
                                'example' => 'https://example.com/avatar.jpg'
                            ],
                            'bio' => [
                                'type' => 'string',
                                'description' => 'User bio',
                                'example' => 'I am a user'
                            ],
                            'occupation' => [
                                'type' => 'string',
                                'description' => 'User occupation',
                                'example' => 'Software Engineer'
                            ]
                        ]
                    ],
                    'examples' => [
                        'update' => [
                            'summary' => 'Update User Example',
                            'value' => [
                                'first_name' => 'user',
                                'last_name' => 'user',
                                'date_of_birth' => '2020-01-01',
                                'gender' => 'male',
                                'phone' => '08012345678',
                                'address' => '19 Yesufu Sanusi',
                                'nationality' => 'Nigerian',
                                'state' => 'Lagos',
                                'lga' => 'Surulere',
                                'city' => 'Surulere',
                                'marital_status' => 'single',
                                'avatar' => 'https://example.com/avatar.jpg',
                                'bio' => 'I am a user',
                                'occupation' => 'Software Engineer'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'first_name' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User first name',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'last_name' => [
                'required' => true,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User last name',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'date_of_birth' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User date of birth',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'gender' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User gender',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'phone' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User phone',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'address' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User address',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'nationality' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User nationality',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'state' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User state',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'lga' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User LGA',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'city' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User city',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'marital_status' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User marital status',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'avatar' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User avatar',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'bio' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User bio',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
            'occupation' => [
                'required' => false,
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'User occupation',
                'type' => 'string',
                'default' => 'user',
                'minLength' => 2,
                'maxLength' => 100,
            ],
        ],
    ]);

    // Dashboard summary endpoint
    register_rest_route('api/v1', '/dashboard/summary', [
        'methods' => 'GET',
        'callback' => [DashboardController::class, 'getSummary'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate'],
        'tags' => ['Dashboard'],
        'summary' => 'Get unified dashboard summary',
        'description' => 'Returns role-based dashboard data in a single response (admin, finance, staff sections based on user capabilities)',
    ]);

});
