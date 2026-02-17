<?php

namespace App\Core\Auth\Controllers;

use \WP_REST_Request;
use \WP_REST_Response;
use \WP_Error;
use App\Core\Auth\Services\AuthService;
use App\Core\Auth\Services\JWTService;
use App\Core\User\Services\UserService;
use App\Core\Notification\Services\NotificationService;
use App\Utils\BaseController;

class AuthController extends BaseController
{
    /**
     * Check if a user is currently logged in
     * 
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public static function status(\WP_REST_Request $request)
    {
        // Check for JWT token in Authorization header
        $auth_header = $request->get_header('Authorization');

        // No token provided
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return static::error('unauthenticated', 'No authentication token provided', 401);
        }

        $token = substr($auth_header, 7);

        $jwtService = new JWTService();
        $decoded = $jwtService->validateToken($token);

        if (is_wp_error($decoded)) {
            error_log('[AuthController] Token validation failed: ' . $decoded->get_error_message());
            return static::error('invalid_token', $decoded->get_error_message(), 401);
        }

        // Token is valid, return rich user profile data
        $user = null;
        if (!empty($decoded->profile_id)) {
            $user = UserService::getProfileById($decoded->profile_id);
        } else {
            $user = UserService::getProfileByWpUserId($decoded->user_id);
        }

        if (!$user) {
            return static::error('profile_not_found', 'User profile could not be loaded', 404);
        }

        return static::success([
            'loggedIn' => true,
            'user' => $user
        ], 200);
    }

    /**
     * Handle user login and return JWT tokens
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function login(\WP_REST_Request $request)
    {
        try {
            $email = $request->get_param('email');
            $password = $request->get_param('password');

            if (empty($email) || empty($password)) {
                throw new \InvalidArgumentException('Email and password are required');
            }

            // Authenticate user (this will throw exceptions for failures)
            $user = AuthService::authenticate($email, $password);

            // Generate JWT tokens
            $jwtService = new JWTService();
            $accessToken = $jwtService->generateAccessToken($user->ID);
            $refreshToken = $jwtService->generateRefreshToken($user->ID);

            // Get user roles from JWT payload
            $decoded = $jwtService->validateToken($accessToken);
            $customRoles = !is_wp_error($decoded) ? ($decoded->roles ?? []) : [];

            // Set WordPress Auth Cookie for server-side rendering (menus, etc.)
            wp_set_auth_cookie($user->ID, true);

            return static::success([
                'user' => [
                    'ID' => $user->ID,
                    'email' => $user->user_email,
                    'display_name' => $user->display_name,
                    'roles' => $customRoles
                ],
                'tokens' => [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'expires_in' => 3600
                ]
            ]);
        } catch (\InvalidArgumentException $e) {
            return static::error('invalid_arguments', $e->getMessage(), 400);
        } catch (\DomainException $e) {
            return static::error('account_inactive', $e->getMessage(), 403);
        } catch (\RuntimeException $e) {
            return static::error('authentication_failed', $e->getMessage(), 401);
        } catch (\Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred during login', 500);
        }
    }


    /**
     * Change the current user's password
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function changePassword(\WP_REST_Request $request)
    {
        try {
            $user = wp_get_current_user();

            if (!$user || !$user->ID) {
                throw new \RuntimeException('You must be logged in to change your password', 401);
            }

            $currentPassword = $request->get_param('current_password');
            $newPassword = $request->get_param('new_password');

            if (empty($currentPassword) || empty($newPassword)) {
                throw new \InvalidArgumentException('Current password and new password are required');
            }

            // Change the password (this will throw exceptions on failure)
            AuthService::changePassword($user->ID, $currentPassword, $newPassword);

            return static::success([
                'message' => 'Password changed successfully',
                'status' => 'success'
            ]);
        } catch (\InvalidArgumentException $e) {
            return static::error('invalid_request', $e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            $statusCode = $e->getCode() ?: 400;
            $message = $statusCode >= 500 ? 'An error occurred while changing your password' : $e->getMessage();
            return static::error('password_change_error', $message, $statusCode);
        } catch (\Exception $e) {
            error_log('Unexpected error in changePassword: ' . $e->getMessage());
            return static::error('server_error', 'An unexpected error occurred', 500);
        }
    }

    /**
     * Refresh an access token using a refresh token
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function refreshToken(\WP_REST_Request $request)
    {
        try {
            $refreshToken = $request->get_param('refresh_token');

            if (empty($refreshToken)) {
                throw new \InvalidArgumentException('Refresh token is required');
            }

            $jwtService = new JWTService();
            $tokens = $jwtService->refreshToken($refreshToken);

            return static::success([
                'tokens' => $tokens
            ]);
        } catch (\InvalidArgumentException $e) {
            return static::error('invalid_request', $e->getMessage(), 400);
        } catch (\DomainException $e) {
            return static::error('invalid_token', $e->getMessage(), 401);
        } catch (\RuntimeException $e) {
            error_log('Token refresh failed: ' . $e->getMessage());
            return static::error('token_refresh_failed', 'Failed to refresh token', 400);
        } catch (\Exception $e) {
            error_log('Unexpected error in refreshToken: ' . $e->getMessage());
            return static::error('server_error', 'An unexpected error occurred', 500);
        }
    }

    /**
     * Logout the current user and revoke tokens
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function logout(\WP_REST_Request $request)
    {
        try {
            $authHeader = $request->get_header('Authorization');
            $logoutAll = $request->get_param('logout_all') === 'true';

            // Handle JWT logout if token is provided
            if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
                $jwtService = new JWTService();

                try {
                    $decoded = $jwtService->validateToken($token);

                    if ($logoutAll) {
                        $jwtService->revokeAllUserTokens($decoded->user_id);
                    } else {
                        $jwtService->revokeToken($token);
                    }
                } catch (\DomainException $e) {
                    // Token is invalid or expired, but we'll still proceed with logout
                    error_log('Token validation failed during logout: ' . $e->getMessage());
                } catch (\RuntimeException $e) {
                    // Log the error but don't fail the request
                    error_log('Error during token revocation: ' . $e->getMessage());
                }
            }

            // Clear WordPress authentication cookies
            wp_clear_auth_cookie();

            return static::success([
                'message' => 'You have been successfully logged out.'
            ]);
        } catch (\Exception $e) {
            // Log the error but still return success to the client
            error_log('Unexpected error during logout: ' . $e->getMessage());
            return static::success([
                'message' => 'You have been logged out.'
            ]);
        }
    }

    /**
     * Handle forgot password request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function forgotPassword(WP_REST_Request $request)
    {
        try {
            $email = $request->get_param('email');

            if (empty($email)) {
                throw new \InvalidArgumentException('Email is required');
            }

            AuthService::forgotPassword($email);

            // Always return success to prevent email enumeration
            return static::success([
                'message' => 'If the email exists, a reset link has been sent.'
            ]);
        } catch (\InvalidArgumentException $e) {
            return static::error('invalid_request', $e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            error_log('Forgot password failed: ' . $e->getMessage());
            // Still return success to prevent email enumeration
            return static::success([
                'message' => 'If the email exists, a reset link has been sent.'
            ]);
        } catch (\Exception $e) {
            error_log('Unexpected error in forgotPassword: ' . $e->getMessage());
            // Still return success to prevent email enumeration
            return static::success([
                'message' => 'If the email exists, a reset link has been sent.'
            ]);
        }
    }

    /**
     * Handle password reset request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function resetPassword(WP_REST_Request $request)
    {
        try {
            $token = $request->get_param('token');
            $new_password = $request->get_param('new_password');

            if (empty($token) || empty($new_password)) {
                throw new \InvalidArgumentException('Token and new password are required');
            }

            AuthService::resetPassword($token, $new_password);

            return static::success([
                'message' => 'Your password has been reset successfully. You can now log in with your new password.',
                'status' => 'success'
            ]);
        } catch (\InvalidArgumentException $e) {
            return static::error('invalid_request', $e->getMessage(), 400);
        } catch (\DomainException $e) {
            // For invalid/expired tokens
            return static::error('invalid_token', $e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            return static::error('reset_error', $e->getMessage(), 400);
        } catch (\Exception $e) {
            error_log('Password reset failed: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while resetting your password', 500);
        }
    }
}
