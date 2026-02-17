<?php

namespace App\Modules\Admin\Controllers;

use App\Modules\Admin\Services\UserManagementService;
use App\Core\Auth\Middleware\AuthMiddleware;
use App\Utils\BaseController;
use WP_REST_Request;
use WP_REST_Response;

/**
 * User Management Controller
 *
 * Handles HTTP requests for user management operations in the Admin Module.
 * Provides REST API endpoints for user CRUD, team assignments, and user administration.
 * 
 * All methods are static per API unification plan standards.
 * Controllers handle HTTP layer only - business logic is in UserManagementService.
 */
class UserManagementController extends BaseController
{
    /**
     * Get user by ID with admin-specific fields
     *
     * @param WP_REST_Request $request Request object containing user ID
     * @return WP_REST_Response Response with user data or error
     */
    public static function getUser(WP_REST_Request $request)
    {
        $userId = $request->get_param('id');

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        $result = UserManagementService::getUser((int) $userId);

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        if ($result === null) {
            return static::respondErrorMessage(
                'user_not_found',
                'User not found',
                404,
                ['user_id' => $userId]
            );
        }

        return static::respondData('user', $result, 200);
    }

    /**
     * Get users list with pagination and filters
     *
     * @return WP_REST_Response Response with paginated users list
     */
    public static function getUsers(WP_REST_Request $request)
    {
        $filters = $request->get_params();
        $order = $request->get_param('order') ?: ['created_at' => 'desc'];
        $page = (int) ($request->get_param('page') ?: 1);
        $perPage = (int) ($request->get_param('per_page') ?: 15);

        // Remove pagination, ordering, and auth params from filters
        // Service will filter to only valid database columns
        unset($filters['page'], $filters['per_page'], $filters['order'], $filters['__auth_user']);

        $result = UserManagementService::getUsers($filters, $order, $page, $perPage);

        // Support both shapes:
        // 1) [ 'data' => ..., 'pagination' => ['page','per_page','total','total_pages'] ]
        // 2) [ 'data' => ..., 'page' => ..., 'per_page' => ..., 'total' => ..., 'total_pages' => ... ]
        $pagination = $result['pagination'] ?? null;
        $meta = [
            'page' => (int) ($pagination['page'] ?? ($result['page'] ?? $page)),
            'per_page' => (int) ($pagination['per_page'] ?? ($result['per_page'] ?? $perPage)),
            'total' => (int) ($pagination['total'] ?? ($result['total'] ?? 0)),
            'total_pages' => (int) ($pagination['total_pages'] ?? ($result['total_pages'] ?? 0)),
        ];

        return static::success($result['data'] ?? [], 200, $meta);
    }

    /**
     * Create new user
     *
     * @param WP_REST_Request $request Request object with user data
     * @return WP_REST_Response Response with created user data
     */
    public static function createUser(WP_REST_Request $request)
    {
        $userData = $request->get_json_params();

        if (empty($userData)) {
            return static::respondErrorMessage(
                'invalid_request',
                'User data is required',
                400
            );
        }

        // Get authenticated user from request (cached by AuthMiddleware)
        $authUser = $request->get_param('__auth_user');
        $currentUserId = static::extractUserId($authUser);

        $result = UserManagementService::createUser($userData, $currentUserId);

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respondData('user', $result, 201);
    }

    /**
     * Update existing user
     *
     * @param WP_REST_Request $request Request object with user ID and update data
     * @return WP_REST_Response Response with updated user data
     */
    public static function updateUser(WP_REST_Request $request)
    {
        $userId = $request->get_param('id');
        $userData = $request->get_json_params();

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        if (empty($userData)) {
            return static::respondErrorMessage(
                'invalid_request',
                'User data is required',
                400
            );
        }

        // Get authenticated user from request
        $authUser = $request->get_param('__auth_user');
        $currentUserId = static::extractUserId($authUser);

        $result = UserManagementService::updateUser((int) $userId, $userData, $currentUserId);

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respondData('user', $result, 200);
    }

    /**
     * Delete user
     *
     * @param WP_REST_Request $request Request object with user ID
     * @return WP_REST_Response Response confirming deletion
     */
    public static function deleteUser(WP_REST_Request $request)
    {
        $userId = $request->get_param('id');

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        // Get authenticated user from request
        $authUser = $request->get_param('__auth_user');
        $currentUserId = static::extractUserId($authUser);

        $result = UserManagementService::deleteUser((int) $userId, $currentUserId);

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respond(['message' => 'User deleted successfully'], 200);
    }

    /**
     * Assign user to team
     *
     * @param WP_REST_Request $request Request object with user_id, team_id, role, is_primary
     * @return WP_REST_Response Response confirming assignment
     */
    public static function assignToTeam(WP_REST_Request $request)
    {
        $userId = $request->get_param('user_id');
        $teamId = $request->get_param('team_id');
        $role = $request->get_param('role') ?: 'member';
        $isPrimary = (bool) $request->get_param('is_primary');

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        if (empty($teamId) || !is_numeric($teamId)) {
            return static::respondErrorMessage(
                'invalid_team_id',
                'Invalid team ID provided',
                400,
                ['team_id' => $teamId]
            );
        }

        // Get authenticated user from request
        $authUser = $request->get_param('__auth_user');
        $currentUserId = static::extractUserId($authUser);

        $result = UserManagementService::assignUserToTeam(
            (int) $userId,
            (int) $teamId,
            $role,
            $isPrimary,
            $currentUserId
        );

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respond([
            'message' => 'User assigned to team successfully',
            'user_id' => $userId,
            'team_id' => $teamId
        ], 200);
    }

    /**
     * Remove user from team
     *
     * @param WP_REST_Request $request Request object with user_id and team_id
     * @return WP_REST_Response Response confirming removal
     */
    public static function removeFromTeam(WP_REST_Request $request)
    {
        $userId = $request->get_param('user_id');
        $teamId = $request->get_param('team_id');

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        if (empty($teamId) || !is_numeric($teamId)) {
            return static::respondErrorMessage(
                'invalid_team_id',
                'Invalid team ID provided',
                400,
                ['team_id' => $teamId]
            );
        }

        // Get authenticated user from request
        $authUser = $request->get_param('__auth_user');
        $currentUserId = static::extractUserId($authUser);

        $result = UserManagementService::removeUserFromTeam(
            (int) $userId,
            (int) $teamId,
            $currentUserId
        );

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respond([
            'message' => 'User removed from team successfully',
            'user_id' => $userId,
            'team_id' => $teamId
        ], 200);
    }

    /**
     * Get user's teams
     *
     * @param WP_REST_Request $request Request object with user ID
     * @return WP_REST_Response Response with user's teams
     */
    public static function getUserTeams(WP_REST_Request $request)
    {
        $userId = $request->get_param('id');

        if (empty($userId) || !is_numeric($userId)) {
            return static::respondErrorMessage(
                'invalid_user_id',
                'Invalid user ID provided',
                400,
                ['user_id' => $userId]
            );
        }

        $result = UserManagementService::getUserTeams((int) $userId);

        if (is_wp_error($result)) {
            return static::respondWpError($result);
        }

        return static::respondData('teams', $result, 200);
    }

    /**
     * Extract user ID from authenticated user object/array
     *
     * @param mixed $authUser Authenticated user from request
     * @return int|null User profile ID or null
     */
    private static function extractUserId($authUser)
    {
        if (is_array($authUser)) {
            return $authUser['profile_id'] ?? ($authUser['id'] ?? null);
        }
        
        if (is_object($authUser)) {
            return $authUser->profile_id ?? ($authUser->id ?? null);
        }
        
        return null;
    }
}
