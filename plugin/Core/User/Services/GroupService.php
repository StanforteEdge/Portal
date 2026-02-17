<?php

namespace App\Core\User\Services;

use App\Core\User\Models\Group;
use WP_Error;

class GroupService
{

    private $group;

    public function __construct()
    {
        $this->group = new Group();
    }


    /**
     * Get all groups with pagination and filtering
     *
     * @param array $filters Optional filters
     * @param int $page Page number (1-based)
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public static function getAllGroups(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $group = new Group();

        // Apply filters
        if (!empty($filters['type'])) {
            $group->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $group->where('name', 'LIKE', '%' . $filters['search'] . '%')
                ->orWhere('description', 'LIKE', '%' . $filters['search'] . '%');
        }

        if (isset($filters['parent_id'])) {
            if ($filters['parent_id'] === null) {
                $group->where('parent_id', null);
            } else {
                $group->where('parent_id', $filters['parent_id']);
            }
        }

        // Only active groups by default
        $group->where('is_active', true);

        $result = $group->paginate($perPage, $page);
        return [
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page']
            ]
        ];
    }

    /**
     * Get group by ID
     *
     * @param int $id Group ID
     * @return object|null Group object or null
     */
    public static function getGroupById(int $id)
    {
        $group = new Group();
        return $group->where('is_active', true)->find($id);
    }

    /**
     * Create a new group (returns validation result, not error)
     *
     * @param array $data Group data
     * @return array Validation result with 'success' => true/false and 'group' or 'errors'
     */
    public static function createGroup(array $data): array
    {
        // Validate required fields
        $errors = [];
        if (empty($data['name'])) {
            $errors[] = 'Group name is required';
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors
            ];
        }

        // Sanitize input
        $groupData = [
            'name' => sanitize_text_field($data['name']),
            'description' => !empty($data['description']) ? sanitize_textarea_field($data['description']) : null,
            'type' => !empty($data['type']) ? sanitize_text_field($data['type']) : 'general',
            'organization_id' => !empty($data['organization_id']) ? (int) $data['organization_id'] : null,
            'parent_id' => !empty($data['parent_id']) ? (int) $data['parent_id'] : null,
            'metadata' => !empty($data['metadata']) ? $data['metadata'] : null,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
            'created_by' => !empty($data['created_by']) ? (int) $data['created_by'] : null,
            'updated_by' => !empty($data['updated_by']) ? (int) $data['updated_by'] : null
        ];

        // Validate parent group if specified
        if ($groupData['parent_id']) {
            $parentGroup = self::getGroupById($groupData['parent_id']);
            if (!$parentGroup) {
                return [
                    'success' => false,
                    'errors' => ['Parent group not found or inactive']
                ];
            }
        }

        $group = new Group();
        $result = $group->create($groupData);

        if (!$result) {
            return [
                'success' => false,
                'errors' => ['Failed to create group']
            ];
        }

        return [
            'success' => true,
            'group' => $result
        ];
    }

    /**
     * Update an existing group (returns validation result, not error)
     *
     * @param int $id Group ID
     * @param array $data Update data
     * @return array Validation result with 'success' => true/false and 'group' or 'errors'
     */
    public static function updateGroup(int $id, array $data): array
    {
        $group = new Group();
        $existingGroup = $group->find($id);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found']
            ];
        }

        // Prepare update data
        $updateData = [];
        $errors = [];

        if (isset($data['name'])) {
            $name = sanitize_text_field($data['name']);
            if (empty($name)) {
                $errors[] = 'Group name cannot be empty';
            } else {
                $updateData['name'] = $name;
            }
        }

        if (isset($data['description'])) {
            $updateData['description'] = sanitize_textarea_field($data['description']);
        }

        if (isset($data['type'])) {
            $updateData['type'] = sanitize_text_field($data['type']);
        }

        if (isset($data['organization_id'])) {
            $updateData['organization_id'] = $data['organization_id'] ? (int) $data['organization_id'] : null;
        }

        if (isset($data['parent_id'])) {
            $updateData['parent_id'] = $data['parent_id'] ? (int) $data['parent_id'] : null;

            // Validate parent group if specified
            if ($updateData['parent_id']) {
                $parentGroup = self::getGroupById($updateData['parent_id']);
                if (!$parentGroup) {
                    $errors[] = 'Parent group not found or inactive';
                }

                // Prevent circular reference
                if ($updateData['parent_id'] == $id) {
                    $errors[] = 'Group cannot be its own parent';
                }
            }
        }

        if (isset($data['metadata'])) {
            $updateData['metadata'] = $data['metadata'];
        }

        if (isset($data['is_active'])) {
            $updateData['is_active'] = (bool) $data['is_active'];
        }

        if (isset($data['updated_by'])) {
            $updateData['updated_by'] = (int) $data['updated_by'];
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors
            ];
        }

        if (empty($updateData)) {
            return [
                'success' => false,
                'errors' => ['No valid data provided for update']
            ];
        }

        $result = $group->update($id, $updateData);

        if (!$result) {
            return [
                'success' => false,
                'errors' => ['Failed to update group']
            ];
        }

        return [
            'success' => true,
            'group' => $result
        ];
    }

    /**
     * Delete a group (returns validation result, not error)
     *
     * @param int $id Group ID
     * @return array Validation result with 'success' => true/false and 'errors'
     */
    public static function deleteGroup(int $id): array
    {
        $group = new Group();
        $existingGroup = $group->find($id);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found']
            ];
        }

        // Check if group has child groups
        $children = $group->getChildren($id);
        if (!empty($children)) {
            return [
                'success' => false,
                'errors' => ['Cannot delete group with child groups']
            ];
        }

        // Check if group has members
        $members = $group->getUsers();
        if (!empty($members)) {
            return [
                'success' => false,
                'errors' => ['Cannot delete group with members']
            ];
        }

        $result = $group->delete($id);

        if (!$result) {
            return [
                'success' => false,
                'errors' => ['Failed to delete group']
            ];
        }

        return [
            'success' => true
        ];
    }

    /**
     * Add user to group (returns validation result, not error)
     *
     * @param int $groupId Group ID
     * @param int $userId User ID
     * @param string $role User role in group
     * @param int|null $addedBy ID of user adding the member
     * @return array Validation result with 'success' => true/false and 'errors'
     */
    public static function addUserToGroup(int $groupId, int $userId, string $role = 'member', int $addedBy = null): array
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found']
            ];
        }

        if (!$existingGroup->is_active) {
            return [
                'success' => false,
                'errors' => ['Cannot add users to inactive group']
            ];
        }

        $result = $group->addUser($userId, $role, $addedBy);

        if (!$result) {
            return [
                'success' => false,
                'errors' => ['Failed to add user to group']
            ];
        }

        // Send notification about the user being added
        self::notifyUserAddedToGroup($groupId, $userId, $addedBy);

        return [
            'success' => true
        ];
    }

    /**
     * Remove user from group (returns validation result, not error)
     *
     * @param int $groupId Group ID
     * @param int $userId User ID
     * @param int|null $removedBy ID of user removing the member
     * @return array Validation result with 'success' => true/false and 'errors'
     */
    public static function removeUserFromGroup(int $groupId, int $userId, int $removedBy = null): array
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found']
            ];
        }

        $result = $group->removeUser($userId);

        if (!$result) {
            return [
                'success' => false,
                'errors' => ['Failed to remove user from group']
            ];
        }

        // Send notification about the user being removed
        self::notifyUserRemovedFromGroup($groupId, $userId, $removedBy);

        return [
            'success' => true
        ];
    }

    /**
     * Get group members (returns validation result, not error)
     *
     * @param int $groupId Group ID
     * @return array Validation result with 'success' => true/false, 'members' or 'errors'
     */
    public static function getGroupMembers(int $groupId): array
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found']
            ];
        }

        $users = $existingGroup->getUsers();

        // Format members with only needed fields
        $members = array_map(function ($user) {
            return [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'profile_picture' => $user->profile_picture ?? null,
                // Later you can add group-specific fields:
                // 'group_role' => $membership->role,
                // 'joined_at' => $membership->joined_at,
            ];
        }, $users);
        return [
            'success' => true,
            'members' => $members
        ];
    }

    /**
     * Get user's groups with optional type filtering
     *
     * @param int $userId User ID
     * @param string|null $type Optional group type
     * @return array Validation result with 'success' => true/false, 'groups' or 'errors'
     */
    public static function getUserGroups(int $userId, string $type = null): array
    {
        // Use the Group model to get user's groups instead of direct SQL
        $group = new Group();

        // Get all active groups
        if ($type) {
            $group->where('type', $type);
        }
        $allGroups = $group->where('is_active', true)->getModels();

        $userGroups = [];
        foreach ($allGroups as $groupItem) {
            if ($groupItem->hasUser($userId)) {
                $userGroups[] = $groupItem;
            }
        }

        return [
            'success' => true,
            'groups' => $userGroups
        ];
    }

    /**
     * Get groups by type
     *
     * @param string $type Group type
     * @return array Array of groups of the specified type
     */
    public static function getGroupsByType(string $type)
    {
        $group = new Group();
        return $group->getByType($type);
    }

    /**
     * Get child groups
     *
     * @param int $parentId Parent group ID
     * @return array Array of child groups
     */
    public static function getChildGroups(int $parentId)
    {
        $group = new Group();
        return $group->getChildren($parentId);
    }

    /**
     * Check if user is in group
     *
     * @param int $groupId Group ID
     * @param int $userId User ID
     * @return bool Whether user is in group
     */
    public static function isUserInGroup(int $groupId, int $userId)
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return false;
        }

        return $existingGroup->hasUser($userId);
    }

    /**
     * Send notification when user is added to group
     *
     * @param int $groupId Group ID
     * @param int $userId User ID that was added
     * @param int $addedBy User ID who added them
     * @return void
     */
    private static function notifyUserAddedToGroup($groupId, $userId, $addedBy = null)
    {
        try {
            $group = new Group();
            $groupData = $group->find($groupId);

            if (!$groupData) {
                return;
            }

            // Get user details
            $user = new \App\Core\User\Models\User();
            $userData = $user->find($userId);

            if (!$userData) {
                return;
            }

            // Notify the added user
            $notificationData = [
                'user_id' => $userId,
                'type' => 'success',
                'title' => 'Added to Group',
                'message' => sprintf('You have been added to the group "%s"', $groupData->name),
                'data' => [
                    'group_id' => $groupId,
                    'group_name' => $groupData->name,
                    'added_by' => $addedBy
                ]
            ];

            \App\Core\Notification\Services\NotificationService::sendNotification($notificationData);

            // Notify group admins (if not the same as the adder)
            if ($addedBy !== $userId) {
                $adminIds = self::getGroupAdmins($groupId);
                if (!empty($adminIds)) {
                    $adminNotificationData = [
                        'user_id' => $adminIds,
                        'type' => 'info',
                        'title' => 'New Group Member',
                        'message' => sprintf('%s has been added to the group "%s"', $userData->name ?? 'A user', $groupData->name),
                        'data' => [
                            'group_id' => $groupId,
                            'group_name' => $groupData->name,
                            'added_user_id' => $userId,
                            'added_by' => $addedBy
                        ]
                    ];

                    \App\Core\Notification\Services\NotificationService::sendNotification($adminNotificationData);
                }
            }
        } catch (\Exception $e) {
            error_log('Failed to send group addition notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification when user is removed from group
     *
     * @param int $groupId Group ID
     * @param int $userId User ID that was removed
     * @param int $removedBy User ID who removed them
     * @return void
     */
    private static function notifyUserRemovedFromGroup($groupId, $userId, $removedBy = null)
    {
        try {
            $group = new Group();
            $groupData = $group->find($groupId);

            if (!$groupData) {
                return;
            }

            // Get user details
            $user = new \App\Core\User\Models\User();
            $userData = $user->find($userId);

            if (!$userData) {
                return;
            }

            // Notify the removed user
            $notificationData = [
                'user_id' => $userId,
                'type' => 'warning',
                'title' => 'Removed from Group',
                'message' => sprintf('You have been removed from the group "%s"', $groupData->name),
                'data' => [
                    'group_id' => $groupId,
                    'group_name' => $groupData->name,
                    'removed_by' => $removedBy
                ]
            ];

            \App\Core\Notification\Services\NotificationService::sendNotification($notificationData);

            // Notify group admins (if not the same as the remover)
            if ($removedBy !== $userId) {
                $adminIds = self::getGroupAdmins($groupId);
                if (!empty($adminIds)) {
                    $adminNotificationData = [
                        'user_id' => $adminIds,
                        'type' => 'info',
                        'title' => 'Group Member Removed',
                        'message' => sprintf('%s has been removed from the group "%s"', $userData->name ?? 'A user', $groupData->name),
                        'data' => [
                            'group_id' => $groupId,
                            'group_name' => $groupData->name,
                            'removed_user_id' => $userId,
                            'removed_by' => $removedBy
                        ]
                    ];

                    \App\Core\Notification\Services\NotificationService::sendNotification($adminNotificationData);
                }
            }
        } catch (\Exception $e) {
            error_log('Failed to send group removal notification: ' . $e->getMessage());
        }
    }

    /**
     * Get group admin user IDs (removed direct SQL)
     *
     * @param int $groupId Group ID
     * @return array Array of admin user IDs
     */
    private static function getGroupAdmins($groupId)
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [];
        }

        $members = $existingGroup->getUsers();
        $adminIds = [];

        foreach ($members as $member) {
            if (isset($member->role) && $member->role === 'admin') {
                $adminIds[] = $member->user_id;
            }
        }

        return $adminIds;
    }

    /**
     * Bulk add users to group (returns validation result, not error)
     *
     * @param int $groupId Group ID
     * @param array $userIds Array of user IDs to add
     * @param string $role Role to assign to users
     * @param int|null $addedBy ID of user performing the operation
     * @return array Results array with success/error tracking
     */
    public static function bulkAddUsersToGroup(int $groupId, array $userIds, string $role = 'member', int $addedBy = null): array
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found'],
                'added' => [],
                'skipped' => [],
                'error_details' => []
            ];
        }

        if (!$existingGroup->is_active) {
            return [
                'success' => false,
                'errors' => ['Cannot add users to inactive group'],
                'added' => [],
                'skipped' => [],
                'error_details' => []
            ];
        }

        $results = [
            'success' => true,
            'added' => [],
            'skipped' => [],
            'errors' => [],
            'error_details' => []
        ];

        foreach ($userIds as $userId) {
            try {
                $addResult = $existingGroup->addUser($userId, $role, $addedBy);

                if ($addResult) {
                    $results['added'][] = $userId;
                    // Send notification for successful addition
                    self::notifyUserAddedToGroup($groupId, $userId, $addedBy);
                } else {
                    $results['skipped'][] = $userId;
                }
            } catch (\Exception $e) {
                $results['error_details'][] = [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Bulk remove users from group (returns validation result, not error)
     *
     * @param int $groupId Group ID
     * @param array $userIds Array of user IDs to remove
     * @param int|null $removedBy ID of user performing the operation
     * @return array Results array with success/error tracking
     */
    public static function bulkRemoveUsersFromGroup(int $groupId, array $userIds, int $removedBy = null): array
    {
        $group = new Group();
        $existingGroup = $group->find($groupId);

        if (!$existingGroup) {
            return [
                'success' => false,
                'errors' => ['Group not found'],
                'removed' => [],
                'skipped' => [],
                'error_details' => []
            ];
        }

        $results = [
            'success' => true,
            'removed' => [],
            'skipped' => [],
            'errors' => [],
            'error_details' => []
        ];

        foreach ($userIds as $userId) {
            try {
                $removeResult = $existingGroup->removeUser($userId);

                if ($removeResult) {
                    $results['removed'][] = $userId;
                    // Send notification for successful removal
                    self::notifyUserRemovedFromGroup($groupId, $userId, $removedBy);
                } else {
                    $results['skipped'][] = $userId;
                }
            } catch (\Exception $e) {
                $results['error_details'][] = [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }
}
