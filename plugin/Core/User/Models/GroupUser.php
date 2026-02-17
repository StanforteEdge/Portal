<?php

namespace App\Core\User\Models;

use App\Utils\BaseModel;

/**
 * GroupUser model for managing group memberships
 *
 * This class handles all database operations for group user relationships.
 * It extends BaseModel to leverage common CRUD operations.
 */
class GroupUser extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_group_users';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var Group Group model instance
     */
    private $groupModel;

    /**
     * @var User User model instance
     */
    private $userModel;

    /**
     * @var User Added by user model instance
     */
    private $addedByModel;

    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'group_id',
        'user_id',
        'role',
        'joined_at',
        'added_by'
    ];

    /**
     * @var array Fields that should be cast to native types
     */
    protected $casts = [
        'group_id' => 'integer',
        'user_id' => 'integer',
        'added_by' => 'integer',
        'joined_at' => 'datetime'
    ];

    /**
     * Get Group model instance
     *
     * @return Group
     */
    private function getGroupModel()
    {
        if (!$this->groupModel) {
            $this->groupModel = new Group();
        }
        return $this->groupModel;
    }

    /**
     * Get User model instance
     *
     * @return User
     */
    private function getUserModel()
    {
        if (!$this->userModel) {
            $this->userModel = new User();
        }
        return $this->userModel;
    }

    /**
     * Get AddedBy User model instance
     *
     * @return User
     */
    private function getAddedByModel()
    {
        if (!$this->addedByModel) {
            $this->addedByModel = new User();
        }
        return $this->addedByModel;
    }

    /**
     * Get the group this membership belongs to
     *
     * @return object|null Group object or null
     */
    public function getGroup()
    {
        return $this->getGroupModel()->find($this->group_id);
    }

    /**
     * Get the user this membership belongs to
     *
     * @return object|null User object or null
     */
    public function getUser()
    {
        return $this->getUserModel()->find($this->user_id);
    }

    /**
     * Get the user who added this member
     *
     * @return object|null User object or null
     */
    public function getAddedBy()
    {
        if (!$this->added_by) {
            return null;
        }
        return $this->getAddedByModel()->find($this->added_by);
    }
}
