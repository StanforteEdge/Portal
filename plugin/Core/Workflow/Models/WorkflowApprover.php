<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;

/**
 * Class WorkflowApprover
 * 
 * Represents an approver for a workflow step.
 */
class WorkflowApprover extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflow_step_approvers';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'step_id',
        'approver_type',
        'approver_id',
        'is_required',
        'approval_order',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'is_required' => 'boolean',
        'approval_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the workflow step this approver belongs to.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->step_id);
    }

    /**
     * Get the user approver if approver_type is 'user'.
     *
     * @return object|null User object or null
     */
    public function getUser()
    {
        if ($this->approver_type !== 'user') {
            return null;
        }
        $userModel = new \App\Core\User\Models\User();
        return $userModel->find($this->approver_id);
    }

    /**
     * Get the group approver if approver_type is 'group'.
     *
     * @return object|null Group object or null
     */
    public function getGroup()
    {
        if ($this->approver_type !== 'group') {
            return null;
        }
        $groupModel = new \App\Core\User\Models\Group();
        return $groupModel->find($this->approver_id);
    }

    /**
     * Get the role approver if approver_type is 'role'.
     *
     * @return object|null Role object or null
     */
    public function getRole()
    {
        if ($this->approver_type !== 'role') {
            return null;
        }
        $roleModel = new \App\Core\Auth\Models\Role();
        return $roleModel->find($this->approver_id);
    }

    /**
     * Get the display name of the approver.
     *
     * @return string Display name
     */
    public function getDisplayName()
    {
        switch ($this->approver_type) {
            case 'user':
                $user = $this->getUser();
                return $user ? $user->first_name . ' ' . $user->last_name : 'Unknown User';
            case 'role':
                $role = $this->getRole();
                return $role ? $role->name : 'Unknown Role';
            case 'group':
                $group = $this->getGroup();
                return $group ? $group->name : 'Unknown Group';
            default:
                return 'Unknown';
        }
    }

    /**
     * Check if this is a user approver.
     *
     * @return bool
     */
    public function isUserApprover()
    {
        return $this->approver_type === 'user';
    }

    /**
     * Check if this is a role approver.
     *
     * @return bool
     */
    public function isRoleApprover()
    {
        return $this->approver_type === 'role';
    }

    /**
     * Check if this is a group approver.
     *
     * @return bool
     */
    public function isGroupApprover()
    {
        return $this->approver_type === 'group';
    }

    /**
     * Get required approvers.
     *
     * @return array Array of required WorkflowApprover objects
     */
    public function getRequired()
    {
        return $this->where('is_required', true)->get();
    }

    /**
     * Get optional approvers.
     *
     * @return array Array of optional WorkflowApprover objects
     */
    public function getOptional()
    {
        return $this->where('is_required', false)->get();
    }

    /**
     * Get approvers ordered by approval order.
     *
     * @return array Array of WorkflowApprover objects ordered by approval_order
     */
    public function getInOrder()
    {
        return $this->orderBy('approval_order', 'asc')->get();
    }

    /**
     * Get all users who can approve this step.
     *
     * @return array Array of user objects
     */
    public function getApprovers()
    {
        if ($this->isUserApprover()) {
            $user = $this->getUser();
            return $user ? [$user] : [];
        }

        if ($this->isRoleApprover()) {
            $role = $this->getRole();
            if ($role) {
                // Prefer Role::users() if available
                return method_exists($role, 'users') ? $role->users() : [];
            }
        }

        if ($this->isGroupApprover()) {
            $group = $this->getGroup();
            if ($group) {
                return $group->getUsers();
            }
        }

        return [];
    }
}
