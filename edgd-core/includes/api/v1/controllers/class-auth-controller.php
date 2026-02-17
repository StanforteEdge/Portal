<?php
/**
 * Authentication Controller
 *
 * Handles user authentication endpoints.
 *
 * @package    EDGD\Core\API\V1
 * @since      1.0.0
 */

namespace EDGD\Core\API\V1\Controllers;

use EDGD\Core\API\REST_Controller;
use EDGD\Core\JWT_Auth;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_User;

/**
 * Authentication Controller class.
 *
 * @package EDGD\Core\API\V1\Controllers
 */
class Auth_Controller extends REST_Controller {
    /**
     * JWT Auth instance.
     *
     * @var JWT_Auth
     */
    protected $jwt_auth;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->rest_base = 'auth';
        $this->jwt_auth = JWT_Auth::get_instance();
    }

    /**
     * Register the routes for the objects of the controller.
     */
    public function register_routes() {
        // POST /wp-json/edgd/v1/auth/register
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/register',
            [
                [
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'register'],
                    'permission_callback' => [$this, 'register_permissions_check'],
                    'args'                => $this->get_endpoint_args_for_item_schema(\WP_REST_Server::CREATABLE),
                ],
                'schema' => [$this, 'get_item_schema'],
            ]
        );

        // POST /wp-json/edgd/v1/auth/login
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/login',
            [
                [
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'login'],
                    'permission_callback' => '__return_true',
                    'args'                => [
                        'username' => [
                            'description' => __('Username or email address.', 'edgd-core'),
                            'type'        => 'string',
                            'required'    => true,
                        ],
                        'password' => [
                            'description' => __('User password.', 'edgd-core'),
                            'type'        => 'string',
                            'required'    => true,
                        ],
                    ],
                ],
                'schema' => [$this, 'get_item_schema'],
            ]
        );

        // POST /wp-json/edgd/v1/auth/refresh
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/refresh',
            [
                [
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'refresh_token'],
                    'permission_callback' => '__return_true',
                    'args'                => [
                        'refresh_token' => [
                            'description' => __('Refresh token.', 'edgd-core'),
                            'type'        => 'string',
                            'required'    => true,
                        ],
                    ],
                ],
                'schema' => [$this, 'get_item_schema'],
            ]
        );

        // POST /wp-json/edgd/v1/auth/logout
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/logout',
            [
                [
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'logout'],
                    'permission_callback' => [$this, 'check_permissions'],
                ],
                'schema' => [$this, 'get_item_schema'],
            ]
        );
    }

    /**
     * Check if a given request has access to register a user.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return bool|WP_Error
     */
    public function register_permissions_check($request) {
        // By default, allow registration if the site allows it
        if (!get_option('users_can_register')) {
            return new WP_Error(
                'registration_disabled',
                __('User registration is currently not allowed.', 'edgd-core'),
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * Register a new user.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function register($request) {
        $params = $request->get_params();

        // Validate required fields
        $required = ['username', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return $this->error(
                    sprintf(__('%s is required.', 'edgd-core'), $field),
                    'missing_field',
                    400
                );
            }
        }

        // Validate email
        if (!is_email($params['email'])) {
            return $this->error(
                __('Invalid email address.', 'edgd-core'),
                'invalid_email',
                400
            );
        }

        // Check if username exists
        if (username_exists($params['username'])) {
            return $this->error(
                __('Username already exists.', 'edgd-core'),
                'username_exists',
                400
            );
        }

        // Check if email exists
        if (email_exists($params['email'])) {
            return $this->error(
                __('Email already exists.', 'edgd-core'),
                'email_exists',
                400
            );
        }

        // Create user
        $user_data = [
            'user_login' => $params['username'],
            'user_email' => $params['email'],
            'user_pass'  => $params['password'],
            'first_name' => $params['first_name'] ?? '',
            'last_name'  => $params['last_name'] ?? '',
            'role'       => $params['role'] ?? 'subscriber',
        ];

        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            return $this->error(
                $user_id->get_error_message(),
                'user_creation_failed',
                400
            );
        }

        // Get the user
        $user = get_user_by('id', $user_id);

        // Generate tokens
        $tokens = $this->jwt_auth->authenticate($user->user_login, $params['password']);

        if (is_wp_error($tokens)) {
            return $tokens;
        }

        return $this->success($tokens);
    }

    /**
     * Authenticate a user and return JWT tokens.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function login($request) {
        $params = $request->get_params();
        $result = $this->jwt_auth->authenticate(
            $params['username'],
            $params['password']
        );

        if (is_wp_error($result)) {
            return $result;
        }

        return $this->success($result);
    }

    /**
     * Refresh an access token.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function refresh_token($request) {
        $params = $request->get_params();
        $result = $this->jwt_auth->refresh_token($params['refresh_token']);

        if (is_wp_error($result)) {
            return $result;
        }

        return $this->success($result);
    }

    /**
     * Logout the current user (invalidate tokens).
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function logout($request) {
        // In a stateless JWT system, logout is handled client-side by removing tokens
        // You could implement a token blacklist here if needed
        return $this->success([
            'message' => __('Successfully logged out.', 'edgd-core'),
        ]);
    }

    /**
     * Get the schema for authentication.
     *
     * @return array
     */
    public function get_item_schema() {
        return [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'auth',
            'type'       => 'object',
            'properties' => [
                'access_token'  => [
                    'description' => __('JWT access token.', 'edgd-core'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit'],
                    'readonly'    => true,
                ],
                'refresh_token' => [
                    'description' => __('JWT refresh token.', 'edgd-core'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit'],
                    'readonly'    => true,
                ],
                'expires_in'    => [
                    'description' => __('Token expiration time in seconds.', 'edgd-core'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit'],
                    'readonly'    => true,
                ],
                'user'          => [
                    'description' => __('User data.', 'edgd-core'),
                    'type'        => 'object',
                    'context'     => ['view', 'edit'],
                    'readonly'    => true,
                    'properties'  => [
                        'id'        => [
                            'description' => __('Unique identifier for the user.', 'edgd-core'),
                            'type'        => 'integer',
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                        'email'     => [
                            'description' => __('The email address for the user.', 'edgd-core'),
                            'type'        => 'string',
                            'format'      => 'email',
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                        'username'  => [
                            'description' => __('Login name for the user.', 'edgd-core'),
                            'type'        => 'string',
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                        'firstName' => [
                            'description' => __('First name of the user.', 'edgd-core'),
                            'type'        => 'string',
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                        'lastName'  => [
                            'description' => __('Last name of the user.', 'edgd-core'),
                            'type'        => 'string',
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                        'roles'     => [
                            'description' => __('Roles assigned to the user.', 'edgd-core'),
                            'type'        => 'array',
                            'items'       => [
                                'type' => 'string',
                            ],
                            'context'     => ['view', 'edit'],
                            'readonly'    => true,
                        ],
                    ],
                ],
            ],
        ];
    }
}
