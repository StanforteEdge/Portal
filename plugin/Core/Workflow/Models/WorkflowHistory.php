<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;
use App\Core\Workflow\Models\WorkflowInstance;
use App\Core\Workflow\Models\WorkflowTransition;
use App\Core\Workflow\Models\WorkflowStep;

/**
 * Class WorkflowHistory
 * 
 * Represents the history of workflow transitions and actions.
 */
class WorkflowHistory extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflow_history';

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
        'instance_id',
        'transition_id',
        'from_step_id',
        'to_step_id',
        'action',
        'performed_by',
        'comment',
        'data',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the workflow instance this history belongs to.
     *
     * @return object|null WorkflowInstance object or null
     */
    public function getInstance()
    {
        $instanceModel = new WorkflowInstance();
        return $instanceModel->find($this->instance_id);
    }

    /**
     * Get the transition that was taken.
     *
     * @return object|null WorkflowTransition object or null
     */
    public function getTransition()
    {
        $transitionModel = new WorkflowTransition();
        return $transitionModel->find($this->transition_id);
    }


    /**
     * Get the source step of the transition.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getFromStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->from_step_id);
    }

    /**
     * Get the target step of the transition.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getToStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->to_step_id);
    }

    /**
     * Get the user who performed the action.
     *
     * @return object|null User object or null
     */
    public function getPerformer()
    {
        $userModel = new \App\Core\User\Models\User();
        return $userModel->find($this->performed_by);
    }

    /**
     * Get the display name of the action.
     *
     * @return string Display name of the action
     */
    public function getActionName()
    {
        $transition = $this->getTransition();
        if ($transition) {
            return $transition->display_name;
        }

        return ucfirst($this->action);
    }

    /**
     * Get history records by a specific user.
     *
     * @param int $userId User ID
     * @return array Array of WorkflowHistory objects
     */
    public function getByUser($userId)
    {
        return $this->where('performed_by', $userId)->get();
    }

    /**
     * Get history records for a specific step.
     *
     * @param int $stepId Step ID
     * @return array Array of WorkflowHistory objects
     */
    public function getForStep($stepId)
    {
        return $this->where('from_step_id', $stepId)
                    ->orWhere('to_step_id', $stepId)
                    ->get();
    }

    /**
     * Get the data as an array with key support.
     *
     * @param string|null $key Specific key to retrieve
     * @param mixed $default Default value if key not found
     * @return mixed Data value or entire data array
     */
    public function getData($key = null, $default = null)
    {
        $data = $this->data ?? [];

        if (is_null($key)) {
            return $data;
        }

        // Simple dot notation support
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $value = $data;
            foreach ($keys as $k) {
                if (isset($value[$k])) {
                    $value = $value[$k];
                } else {
                    return $default;
                }
            }
            return $value;
        }

        return isset($data[$key]) ? $data[$key] : $default;
    }
}
