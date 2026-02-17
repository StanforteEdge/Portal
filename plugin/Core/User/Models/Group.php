<?php

namespace App\Core\User\Models;

use App\Utils\BaseModel;
use WP_Error;

/**
 * Group model for managing user groups and memberships
 *
 * This class handles all database operations for user groups.
 * It extends BaseModel to leverage common CRUD operations.
 */
class Group extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_groups';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var GroupUser GroupUser model instance
     */
    private $groupUserModel;

    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'name',
        'description',
        'type',
        'organization_id',
        'parent_id',
        'metadata',
        'is_active',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    /**
     * @var array Fields that should be cast to native types
     */
    protected $casts = [
        'organization_id' => 'integer',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'parent_id' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get GroupUser model instance
     *
     * @return GroupUser
     */
    private function getGroupUserModel()
    {
        if (!$this->groupUserModel) {
            $this->groupUserModel = new GroupUser();
        }
        return $this->groupUserModel;
    }

    /**
     * Find groups by type
     *
     * @param string $type Group type (workflow, department, team, etc.)
     * @return array Array of Group objects
     */
    public function getByType($type)
    {
        return $this->where('type', $type)->where('is_active', true)->getModels();
    }

    /**
     * Get active groups
     *
     * @return array Array of active Group objects
     */
    public function getActive()
    {
        return $this->where('is_active', true)->getModels();
    }

    /**
     * Get child groups (hierarchical)
     *
     * @param int $parentId Parent group ID
     * @return array Array of child Group objects
     */
    public function getChildren($parentId)
    {
        return $this->where('parent_id', $parentId)->where('is_active', true)->getModels();
    }

    /**
     * Get parent group
     *
     * @return object|null Parent Group object or null
     */
    public function getParent()
    {
        if (!$this->parent_id) {
            return null;
        }
        $groupModel = new self();
        return $groupModel->find($this->parent_id);
    }

    /**
     * Get all users in this group
     *
     * @return array Array of User objects
     */
    public function getUsers()
    {
        $memberships = $this->getGroupUserModel()->where('group_id', $this->id)->getModels();

        error_log('[Membership] ' . json_encode($memberships));


        if (empty($memberships)) {
            return [];
        }

        $users = [];
        foreach ($memberships as $membership) {
            $user = $membership->getUser();
            error_log('[User] ' . json_encode($user));
            if ($user) {
                $users[] = $user;
            }
        }

        return $users;
    }

    /**
     * Add user to group
     *
     * @param int $userId User ID to add
     * @param string $role User role in group (member, admin, moderator)
     * @param int $addedBy ID of user adding the member
     * @return bool Success status
     */
    public function addUser($userId, $role = 'member', $addedBy = null)
    {
        error_log("addUser called: groupId={$this->id}, userId={$userId}, role={$role}, addedBy={$addedBy}");

        // Check if user is already in group
        $existing = $this->getGroupUserModel()->where('group_id', $this->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            error_log("User {$userId} already in group {$this->id}");
            return false; // Already a member
        }

        $data = [
            'group_id' => $this->id,
            'user_id' => $userId,
            'role' => $role,
            'added_by' => $addedBy,
            'joined_at' => current_time('mysql')
        ];

        error_log("Creating group user with data: " . json_encode($data));

        $result = $this->getGroupUserModel()->create($data);

        error_log("Create result: " . ($result ? "SUCCESS (ID: {$result->id})" : "FAILED"));

        return $result !== false;
    }

    /**
     * Remove user from group
     *
     * @param int $userId User ID to remove
     * @return bool Success status
     */
    public function removeUser($userId)
    {
        $membership = $this->getGroupUserModel()->where('group_id', $this->id)
            ->where('user_id', $userId)
            ->first();

        if (!$membership) {
            return false; // Not a member
        }

        return $this->getGroupUserModel()->delete($membership->id) !== false;
    }

    /**
     * Check if user is in group
     *
     * @param int $userId User ID to check
     * @return bool Whether user is in group
     */
    public function hasUser($userId)
    {
        $membership = $this->getGroupUserModel()->where('group_id', $this->id)
            ->where('user_id', $userId)
            ->first();

        return $membership !== null;
    }

    /**
     * Get user's role in group
     *
     * @param int $userId User ID
     * @return string|null User role or null if not in group
     */
    public function getUserRole($userId)
    {
        $membership = $this->getGroupUserModel()->where('group_id', $this->id)
            ->where('user_id', $userId)
            ->first();

        return $membership ? $membership->role : null;
    }

    /**
     * Get group administrators
     *
     * @return array Array of User objects who are admins
     */
    public function getAdmins()
    {
        $adminMemberships = $this->getGroupUserModel()->where('group_id', $this->id)
            ->where('role', 'admin')
            ->getModels();

        if (empty($adminMemberships)) {
            return [];
        }

        $admins = [];
        foreach ($adminMemberships as $membership) {
            $user = $membership->getUser();
            if ($user) {
                $admins[] = $user;
            }
        }

        return $admins;
    }
}
