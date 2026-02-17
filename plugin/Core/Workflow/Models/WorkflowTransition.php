<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;

/**
 * Class WorkflowTransition
 * 
 * Represents a transition between workflow steps.
 */
class WorkflowTransition extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflow_transitions';

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
        'workflow_id',
        'from_step_id',
        'to_step_id',
        'name',
        'description',
        'action',
        'conditions',
        'config',
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
        'conditions' => 'array',
        'config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the workflow that owns the transition.
     *
     * @return object|null Workflow object or null
     */
    public function getWorkflow()
    {
        $workflowModel = new Workflow();
        return $workflowModel->find($this->workflow_id);
    }

    /**
     * Get the source step.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getFromStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->from_step_id);
    }

    /**
     * Get the target step.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getToStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->to_step_id);
    }

    /**
     * Get the transition history.
     *
     * @return array Array of WorkflowHistory objects
     */
    public function getHistory()
    {
        $historyModel = new WorkflowHistory();
        return $historyModel->where('transition_id', $this->id)->get();
    }

    /**
     * Check if the transition is valid for the given context.
     *
     * @param array $context Context data for validation
     * @return bool
     */
    public function isValid($context = [])
    {
        if (empty($this->conditions)) {
            return true;
        }

        // TODO: Implement condition evaluation logic
        // This is a placeholder implementation
        return true;
    }

    /**
     * Get the transition name for display.
     *
     * @return string Display name
     */
    public function getDisplayName()
    {
        return $this->name ?? ucfirst(str_replace('_', ' ', $this->action));
    }

    /**
     * Get transitions from a specific step.
     *
     * @param int $stepId Step ID
     * @return array Array of WorkflowTransition objects
     */
    public function getFromStepTransitions($stepId)
    {
        return $this->where('from_step_id', $stepId)->get();
    }

    /**
     * Get transitions to a specific step.
     *
     * @param int $stepId Step ID
     * @return array Array of WorkflowTransition objects
     */
    public function getToStepTransitions($stepId)
    {
        return $this->where('to_step_id', $stepId)->get();
    }

    /**
     * Get the transition by action name.
     *
     * @param int $workflowId Workflow ID
     * @param string $action Action name
     * @return object|null WorkflowTransition object or null
     */
    public function findByAction($workflowId, $action)
    {
        return $this->where('workflow_id', $workflowId)
                   ->where('action', $action)
                   ->first();
    }
}
