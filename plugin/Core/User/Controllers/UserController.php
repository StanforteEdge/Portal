<?php
namespace App\Core\User\Controllers;

use WP_REST_Request;
use App\Core\User\Services\UserService;
use App\Core\Auth\Middleware\AuthMiddleware;
use App\Utils\BaseController;

class UserController extends BaseController
{
    /**
     * Return the profile of the currently authenticated user (/me endpoint)
     * Uses JWT authentication with WordPress fallback
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function me(WP_REST_Request $request)
    {
        try {
            // Get current user from JWT or WordPress session
            $user = AuthMiddleware::getCurrentUser();
            if (!$user) {
                return static::error('unauthenticated', 'Not authenticated', 401);
            }

            // Access profile_id from object
            if (!isset($user->profile_id) || empty($user->profile_id)) {
                return static::error('bad_request', 'Profile ID not found in token', 400);
            }

            $profile = UserService::getProfileById($user->profile_id);

            if (!$profile) {
                return static::error('not_found', 'Profile not found', 404, ['id' => $user->profile_id]);
            }

            return static::success((array) $profile, 200);

        } catch (\Exception $e) {
            error_log('Error in UserController::me: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while retrieving your profile', 500);
        }
    }


    /**
     * Update current user's profile (/me, PATCH)
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateMe(WP_REST_Request $request)
    {
        try {
            // Get current user from JWT or WordPress session
            $user = AuthMiddleware::getCurrentUser();
            if (!$user) {
                return static::error('unauthenticated', 'Not authenticated', 401);
            }

            // Access profile_id from object
            if (!isset($user->profile_id) || empty($user->profile_id)) {
                return static::error('bad_request', 'Profile ID not found in token', 400);
            }

            $profile = UserService::getProfileById($user->profile_id);

            if (!$profile) {
                return static::error('not_found', 'Profile not found', 404, ['id' => $user->profile_id]);
            }

            $data = $request->get_json_params();
            $result = UserService::updateUser($profile->id, $data);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            $updatedProfile = UserService::getProfileById($profile->id);
            return static::success(['data' => (array) $updatedProfile], 200);

        } catch (\Exception $e) {
            error_log('Error updating profile: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while updating the profile', 500);
        }
    }

    /**
     * Admin: List all users with pagination
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    /**
     * Admin: List all users with pagination
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function list(WP_REST_Request $request)
    {
        // Permission check handled by route middleware
        // This method should only be called if user has 'manage_users' permission

        try {
            $page = max(1, (int) $request->get_param('page') ?: 1);
            $perPage = min(100, max(1, (int) $request->get_param('per_page') ?: 20));

            $filters = [];
            $order = ['id' => 'DESC'];

            // Add any filters from query params
            $filterable = ['status', 'type'];
            foreach ($filterable as $field) {
                $value = $request->get_param($field);
                if ($value !== null && $value !== '') {
                    $filters[$field] = sanitize_text_field($value);
                }
            }

            // Add search filter if provided
            $search = $request->get_param('search');
            if (!empty($search)) {
                $filters['search'] = sanitize_text_field($search);
            }

            $result = UserService::getAllUsers($filters, $order, $page, $perPage);

            // Convert objects to arrays for JSON response
            $data = array_map(function ($item) {
                return (array) $item;
            }, $result['data']);

            return static::respond([
                'data' => $data,
                'meta' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'per_page' => $result['per_page'],
                    'total_pages' => $result['total_pages']
                ]
            ], 200);

        } catch (\Exception $e) {
            error_log('Error listing users: ' . $e->getMessage());
            return static::error('server_error', 'Failed to retrieve users', 500);
        }
    }

    /**
     * Admin: Get user by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    /**
     * Admin: Get user by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get(WP_REST_Request $request)
    {
        // Permission check handled by route middleware
        // This method should only be called if user has 'manage_users' permission

        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'User ID is required and must be a number', 400);
            }

            $user = UserService::getProfileById($id);
            if (!$user) {
                return static::error('not_found', 'User not found', 404);
            }

            return static::success(['data' => (array) $user], 200);

        } catch (\Exception $e) {
            error_log('Error getting user: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while retrieving the user', 500);
        }
    }

    /**
     * Create a new user
     * 
     * Required fields in request:
     * - username
     * - email
     * - password
     * 
     * Optional fields:
     * - role (defaults to 'subscriber')
     * - first_name
     * - last_name
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function create(WP_REST_Request $request)
    {
        // Prepare user data from request
        $userData = [
            'username' => $request->get_param('username'),
            'email' => $request->get_param('email'),
            'password' => $request->get_param('password'),
            'first_name' => $request->get_param('first_name') ?? '',
            'last_name' => $request->get_param('last_name') ?? '',
            'role' => $request->get_param('role') ?? 'subscriber'
        ];

        try {
            // Delegate to service layer for business logic
            $result = UserService::createUser($userData);

            // Handle error response
            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            // Return success response with created user data
            return static::success(['data' => $result], 201);

        } catch (\Exception $e) {
            // Log the error
            error_log('Error creating user: ' . $e->getMessage());

            // Return a generic error response
            return static::error('server_error', 'An error occurred while creating the user', 500);
        }
    }

    /**
     * Admin: Update user
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function update(WP_REST_Request $request)
    {
        // Permission check handled by route middleware
        // This method should only be called if user has 'manage_users' permission

        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'User ID is required and must be a number', 400);
            }

            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for update', 400);
            }

            // Use the service layer to handle the update
            $result = UserService::updateUser($id, $data);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            // Get the updated user data
            $user = UserService::getProfileById($id);
            if (!$user) {
                return static::error('not_found', 'User not found after update', 404);
            }

            return static::success(['data' => $user], 200);

        } catch (\Exception $e) {
            error_log('Error updating user: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while updating the user', 500);
        }
    }

    /**
     * Admin: Delete user
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function delete(WP_REST_Request $request)
    {
        // Permission check handled by route middleware
        // This method should only be called if user has 'delete_users' permission

        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'User ID is required and must be a number', 400);
            }

            // Check if we should also delete the WordPress user
            $deleteWpUser = (bool) $request->get_param('delete_wp_user');

            // Use the service layer to handle the deletion
            $result = UserService::deleteUser($id, $deleteWpUser);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            return static::success(['data' => ['message' => 'User deleted successfully']], 200);

        } catch (\Exception $e) {
            error_log('Error deleting user: ' . $e->getMessage());
            return static::error('server_error', 'Failed to delete user', 500);
        }
    }

    /**
     * Get user roles
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getUserRoles(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'User ID is required', 400);
            }

            $user = UserService::getProfileById($id);
            if (!$user) {
                return static::error('not_found', 'User not found', 404);
            }

            $roles = UserService::getUserRoles($id);
            return static::success(['data' => $roles], 200);

        } catch (\Exception $e) {
            error_log('Error getting user roles: ' . $e->getMessage());
            return static::error('server_error', 'Failed to get user roles', 500);
        }
    }

    /**
     * Assign role to user
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function assignUserRole(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $role = $request->get_param('role');

            if (empty($id) || empty($role)) {
                return static::error('bad_request', 'User ID and role are required', 400);
            }

            $result = UserService::assignRole($id, $role);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            return static::success(['data' => ['message' => 'Role assigned successfully']], 200);

        } catch (\Exception $e) {
            error_log('Error assigning user role: ' . $e->getMessage());
            return static::error('server_error', 'Failed to assign role', 500);
        }
    }

    /**
     * Remove role from user
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function removeUserRole(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $role = $request->get_param('role');

            if (empty($id) || empty($role)) {
                return static::error('bad_request', 'User ID and role are required', 400);
            }

            $result = UserService::removeRole($id, $role);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            return static::success(['data' => ['message' => 'Role removed successfully']], 200);

        } catch (\Exception $e) {
            error_log('Error removing user role: ' . $e->getMessage());
            return static::error('server_error', 'Failed to remove role', 500);
        }
    }

}
