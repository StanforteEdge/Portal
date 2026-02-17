<?php

namespace App\Core\User\Controllers;

use WP_REST_Request;
use App\Core\User\Services\GroupService;
use App\Core\Auth\Middleware\AuthMiddleware;
use App\Utils\BaseController;

class GroupController extends BaseController
{
    /**
     * List groups with pagination and filtering
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function list(WP_REST_Request $request)
    {
        try {
            $page = max(1, (int) $request->get_param('page') ?: 1);
            $perPage = min(100, max(1, (int) $request->get_param('per_page') ?: 20));

            $filters = [];

            // Add type filter
            $type = $request->get_param('type');
            if (!empty($type)) {
                $filters['type'] = sanitize_text_field($type);
            }

            // Add search filter
            $search = $request->get_param('search');
            if (!empty($search)) {
                $filters['search'] = sanitize_text_field($search);
            }

            // Add parent filter for hierarchical groups
            $parentId = $request->get_param('parent_id');
            if ($parentId !== null) {
                $filters['parent_id'] = (int) $parentId;
            }

            $result = GroupService::getAllGroups($filters, $page, $perPage);

            return static::success($result['data'], 200, $result['meta']);
        } catch (\Exception $e) {
            error_log('Error listing groups: ' . $e->getMessage());
            return static::error('server_error', 'Failed to retrieve groups', 500);
        }
    }

    /**
     * Get group by ID
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Group ID is required and must be a number', 400);
            }

            $group = GroupService::getGroupById($id);
            if (!$group) {
                return static::error('not_found', 'Group not found', 404);
            }
            return static::success($group->toArray(), 200);
        } catch (\Exception $e) {
            error_log('Error getting group: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while retrieving the group', 500);
        }
    }

    /**
     * Create a new group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function create(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for group creation', 400);
            }

            // Get current user for created_by field
            $currentUser = $request->get_param('__auth_user');
            if ($currentUser && isset($currentUser->profile_id)) {
                $data['created_by'] = $currentUser->profile_id;
            }

            $result = GroupService::createGroup($data);

            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success(['data' => (array) $result['group']], 201);
        } catch (\Exception $e) {
            error_log('Error creating group: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while creating the group', 500);
        }
    }

    /**
     * Update group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function update(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Group ID is required and must be a number', 400);
            }

            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for update', 400);
            }

            // Get current user for updated_by field
            $currentUser = $request->get_param('__auth_user');
            if ($currentUser && isset($currentUser->profile_id)) {
                $data['updated_by'] = $currentUser->profile_id;
            }

            $result = GroupService::updateGroup($id, $data);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            $updatedGroup = GroupService::getGroupById($id);
            return static::success(['data' => (array) $updatedGroup], 200);
        } catch (\Exception $e) {
            error_log('Error updating group: ' . $e->getMessage());
            return static::error('server_error', 'An error occurred while updating the group', 500);
        }
    }

    /**
     * Delete group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function delete(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Group ID is required and must be a number', 400);
            }

            $result = GroupService::deleteGroup($id);

            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success(['data' => ['message' => 'Group deleted successfully']], 200);
        } catch (\Exception $e) {
            error_log('Error deleting group: ' . $e->getMessage());
            return static::error('server_error', 'Failed to delete group', 500);
        }
    }

    /**
     * Add user to group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function addUser(WP_REST_Request $request)
    {
        try {
            $groupId = (int) $request->get_param('id');
            $userId = (int) $request->get_param('user_id');
            $role = $request->get_param('role') ?: 'member';

            if (empty($groupId) || empty($userId)) {
                return static::error('bad_request', 'Group ID and User ID are required', 400);
            }

            // Get current user for added_by field
            $currentUser = $request->get_param('__auth_user');
            $addedBy = $currentUser && isset($currentUser->profile_id) ? $currentUser->profile_id : null;

            $result = GroupService::addUserToGroup($groupId, $userId, $role, $addedBy);

            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success(['data' => ['message' => 'User added to group successfully']], 200);
        } catch (\Exception $e) {
            error_log('Error adding user to group: ' . $e->getMessage());
            return static::error('server_error', 'Failed to add user to group', 500);
        }
    }

    /**
     * Remove user from group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function removeUser(WP_REST_Request $request)
    {
        try {
            $groupId = (int) $request->get_param('id');
            $userId = (int) $request->get_param('user_id');

            if (empty($groupId) || empty($userId)) {
                return static::error('bad_request', 'Group ID and User ID are required', 400);
            }

            // Get current user for removed_by field
            $currentUser = $request->get_param('__auth_user');
            $removedBy = $currentUser && isset($currentUser->profile_id) ? $currentUser->profile_id : null;

            $result = GroupService::removeUserFromGroup($groupId, $userId, $removedBy);

            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success(['data' => ['message' => 'User removed from group successfully']], 200);
        } catch (\Exception $e) {
            error_log('Error removing user from group: ' . $e->getMessage());
            return static::error('server_error', 'Failed to remove user from group', 500);
        }
    }

    /**
     * Get group members
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getMembers(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Group ID is required and must be a number', 400);
            }

            $result = GroupService::getGroupMembers($id);



            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success($result['members'], 200);
        } catch (\Exception $e) {
            error_log('Error getting group members: ' . $e->getMessage());
            return static::error('server_error', 'Failed to get group members', 500);
        }
    }

    /**
     * Bulk remove users from group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function bulkRemoveUsers(WP_REST_Request $request)
    {
        try {
            $groupId = (int) $request->get_param('id');
            $userIds = $request->get_param('user_ids');

            if (empty($groupId) || empty($userIds) || !is_array($userIds)) {
                return static::error('bad_request', 'Group ID and user_ids array are required', 400);
            }

            // Get current user for removed_by field
            $currentUser = $request->get_param('__auth_user');
            $removedBy = $currentUser && isset($currentUser->profile_id) ? $currentUser->profile_id : null;

            $results = GroupService::bulkRemoveUsersFromGroup($groupId, $userIds, $removedBy);

            if (!$results['success']) {
                return static::error('validation_error', implode(', ', $results['errors']), 400);
            }

            return static::success([
                'data' => [
                    'message' => 'Bulk operation completed',
                    'removed' => $results['removed'],
                    'skipped' => $results['skipped'],
                    'errors' => $results['error_details']
                ]
            ], 200);
        } catch (\Exception $e) {
            error_log('Error bulk removing users from group: ' . $e->getMessage());
            return static::error('server_error', 'Failed to bulk remove users from group', 500);
        }
    }

    /**
     * Get user's groups
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getUserGroups(WP_REST_Request $request)
    {
        try {
            $userId = (int) $request->get_param('user_id');
            if (empty($userId)) {
                return static::error('bad_request', 'User ID is required', 400);
            }

            $result = GroupService::getUserGroups($userId);

            if (!$result['success']) {
                return static::error('validation_error', implode(', ', $result['errors']), 400);
            }

            return static::success(['data' => array_map(function ($item) {
                return (array) $item;
            }, $result['groups'])], 200);
        } catch (\Exception $e) {
            error_log('Error getting user groups: ' . $e->getMessage());
            return static::error('server_error', 'Failed to get user groups', 500);
        }
    }

    /**
     * Bulk add users to group
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function bulkAddUsers(WP_REST_Request $request)
    {
        try {
            $groupId = (int) $request->get_param('id');
            $userIds = $request->get_param('user_ids');
            $role = $request->get_param('role') ?: 'member';

            if (empty($groupId) || empty($userIds) || !is_array($userIds)) {
                return static::error('bad_request', 'Group ID and user_ids array are required', 400);
            }

            // Get current user for added_by field
            $currentUser = $request->get_param('__auth_user');
            $addedBy = $currentUser && isset($currentUser->profile_id) ? $currentUser->profile_id : null;

            $results = GroupService::bulkAddUsersToGroup($groupId, $userIds, $role, $addedBy);

            if (!$results['success']) {
                return static::error('validation_error', implode(', ', $results['errors']), 400);
            }

            return static::success(['message' => 'Bulk operation completed'], 200);
        } catch (\Exception $e) {
            error_log('Error removing user from group: ' . $e->getMessage());
            return static::error('server_error', 'Failed to remove user from group', 500);
        }
    }
}
