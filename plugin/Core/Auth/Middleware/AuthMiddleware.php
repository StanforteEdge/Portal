<?php
namespace App\Core\Auth\Middleware;

use App\Core\Auth\Services\JWTService;
use App\Core\Auth\Services\RBACService;
use WP_REST_Request;
use WP_Error;

class AuthMiddleware
{
    /**
     * Hybrid authentication middleware - supports both JWT and WordPress cookies
     * 
     * @param WP_REST_Request $request
     * @return bool|WP_Error
     */
    public static function authenticate(WP_REST_Request $request)
    {
        // If already authenticated in this request, reuse cached user
        $cached = $request->get_param('__auth_user');
        if ($cached) {
            return $cached;
        }

        // Try JWT authentication first
        $jwt_user = self::authenticateJWT($request);
        if (!is_wp_error($jwt_user) && $jwt_user) {
            // Cache on request for reuse
            $request->set_param('__auth_user', $jwt_user);
            return $jwt_user;
        }

        // Fallback to WordPress cookie authentication
        $wp_user = self::authenticateWordPress($request);
        if (!is_wp_error($wp_user) && $wp_user) {
            // Cache on request for reuse
            $request->set_param('__auth_user', $wp_user);
            return $wp_user;
        }

        return new WP_Error(
            'authentication_failed',
            'Authentication required. Please provide a valid JWT token or WordPress session.',
            ['status' => 401]
        );
    }

    /**
     * JWT-only authentication
     * 
     * @param WP_REST_Request $request
     * @return bool|WP_Error
     */
    public static function authenticateJWT(WP_REST_Request $request)
    {
        $auth_header = $request->get_header('Authorization');

        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error(
                'missing_jwt_token',
                'JWT token required in Authorization header',
                ['status' => 401]
            );
        }

        $token = substr($auth_header, 7);
        $jwtService = new JWTService();
        $decoded = $jwtService->validateToken($token);

        if (is_wp_error($decoded)) {
            return $decoded;
        }

        // Ensure normalized object with profile_id if available
        if (is_array($decoded)) {
            $decoded = (object) $decoded;
        }
        return $decoded;
    }

    /**
     * WordPress cookie authentication
     * 
     * @param WP_REST_Request $request
     * @return bool|WP_Error
     */
    public static function authenticateWordPress(WP_REST_Request $request)
    {
        if (!is_user_logged_in()) {
            return new WP_Error(
                'not_logged_in',
                'WordPress authentication required',
                ['status' => 401]
            );
        }

        $current_user = wp_get_current_user();

        // Resolve profile_id from custom profiles table
        global $wpdb;
        $profile_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}sta_profiles WHERE wp_user_id = %d",
            $current_user->ID
        ));

        return (object) [
            'profile_id' => $profile_id ? (int) $profile_id : null,
            'wp_user_id' => (int) $current_user->ID,
            'username' => $current_user->user_login,
            'email' => $current_user->user_email,
            'roles' => $current_user->roles,
        ];
    }

    /**
     * Get current authenticated user from JWT token
     * 
     * @return array|null User data or null if not authenticated
     */
    public static function getCurrentUser()
    {
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            $jwtService = new JWTService();
            $decoded = $jwtService->validateToken($token);

            if (!is_wp_error($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * Get current authenticated user from request cache or authenticate once
     *
     * @param WP_REST_Request $request
     * @return array|null
     */
    public static function getCurrentUserFromRequest(WP_REST_Request $request)
    {
        $cached = $request->get_param('__auth_user');
        if ($cached) {
            return $cached;
        }
        $auth = self::authenticate($request);
        if (is_wp_error($auth)) {
            return null;
        }
        $request->set_param('__auth_user', $auth);
        return $auth;
    }

    /**
     * Check if user has required permissions
     * 
     * @param string|array $permissions Required permissions
     * @return callable Permission callback function
     */
    public static function requirePermissions($permissions)
    {
        return function (WP_REST_Request $request) use ($permissions) {
            $auth = self::authenticate($request);
            if (is_wp_error($auth)) {
                return $auth;
            }

            $user = $auth;

            $permissions = is_array($permissions) ? $permissions : [$permissions];

            foreach ($permissions as $permission) {
                if (!RBACService::userHasPermission($user->profile_id, $permission)) {
                    return new WP_Error(
                        'forbidden',
                        'Insufficient permissions',
                        ['status' => 403]
                    );
                }
            }

            // Cache already set by authenticate(); allow request to proceed
            return true;
        };
    }

    /**
     * Role-based authorization
     * 
     * @param string|array $required_roles
     * @return callable
     */
    public static function requireRoles($required_roles)
    {
        return function (WP_REST_Request $request) use ($required_roles) {
            $auth_result = self::authenticate($request);

            if (is_wp_error($auth_result)) {
                return $auth_result;
            }

            $user_roles = $auth_result['roles'];
            $required = (array) $required_roles;

            foreach ($required as $role) {
                if (in_array($role, $user_roles)) {
                    return true;
                }
            }

            return new WP_Error(
                'insufficient_role',
                'Required role: ' . implode(' or ', $required),
                ['status' => 403]
            );
        };
    }
}
