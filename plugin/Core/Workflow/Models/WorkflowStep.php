<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;

/**
 * Class WorkflowStep
 * 
 * Represents a step in a workflow definition.
 */
class WorkflowStep extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflow_steps';

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
        'name',
        'description',
        'step_type',
        'order',
        'is_initial',
        'is_final',
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
        'is_initial' => 'boolean',
        'is_final' => 'boolean',
        'order' => 'integer',
        'config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the workflow that owns the step.
     *
     * @return object|null Workflow object or null
     */
    public function getWorkflow()
    {
        $workflowModel = new Workflow();
        return $workflowModel->find($this->workflow_id);
    }

    /**
     * Get the transitions where this step is the source.
     *
     * @return array Array of WorkflowTransition objects
     */
    public function getOutboundTransitions()
    {
        $transitionModel = new WorkflowTransition();
        return $transitionModel->where('from_step_id', $this->id)->get();
    }

    /**
     * Get the transitions where this step is the target.
     *
     * @return array Array of WorkflowTransition objects
     */
    public function getInboundTransitions()
    {
        $transitionModel = new WorkflowTransition();
        return $transitionModel->where('to_step_id', $this->id)->get();
    }

    /**
     * Get the approvers for this step.
     *
     * @return array Array of WorkflowApprover objects
     */
    public function getApprovers()
    {
        $approverModel = new WorkflowApprover();
        return $approverModel->where('step_id', $this->id)->get();
    }

    /**
     * Get the workflow instances at this step.
     *
     * @return array Array of WorkflowInstance objects
     */
    public function getInstances()
    {
        $instanceModel = new WorkflowInstance();
        return $instanceModel->where('current_step_id', $this->id)->get();
    }

    /**
     * Check if a user is an approver for this step.
     *
     * @param int $userId User ID to check
     * @return bool
     */
    public function isUserApprover($userId)
    {
        $approvers = $this->getApprovers();

        foreach ($approvers as $approver) {
            if ($approver->approver_type === 'user' && $approver->approver_id == $userId) {
                return true;
            }

            if ($approver->approver_type === 'role') {
                $role = $approver->getRole();
                if ($role && method_exists($role, 'hasUser')) {
                    if ($role->hasUser($userId)) {
                        return true;
                    }
                }
            }

            if ($approver->approver_type === 'group') {
                $group = $approver->getGroup();
                if ($group && method_exists($group, 'hasUser')) {
                    if ($group->hasUser($userId)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Get the next possible transitions from this step.
     *
     * @return array Array of WorkflowTransition objects with toStep data
     */
    public function getPossibleTransitions()
    {
        $transitions = $this->getOutboundTransitions();

        // Manually load toStep data for each transition
        foreach ($transitions as $transition) {
            $stepModel = new WorkflowStep();
            $transition->toStep = $stepModel->find($transition->to_step_id);
        }

        return $transitions;
    }

    /**
     * Check if this step can transition to another step.
     *
     * @param int $toStepId Target step ID
     * @param array $context Additional context for condition evaluation
     * @return bool
     */
    public function canTransitionTo($toStepId, $context = [])
    {
        $transitionModel = new WorkflowTransition();
        $transition = $transitionModel->where('from_step_id', $this->id)
                                     ->where('to_step_id', $toStepId)
                                     ->first();

        if (!$transition) {
            return false;
        }

        // Check conditions if any
        if (!empty($transition->conditions)) {
            foreach ($transition->conditions as $condition) {
                if (!$this->evaluateCondition($condition, $context)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Evaluate a condition.
     *
     * @param mixed $condition Condition to evaluate
     * @param array $context Context data for evaluation
     * @return bool
     */
    protected function evaluateCondition($condition, $context)
    {
        // TODO: Implement condition evaluation logic
        // This is a placeholder implementation
        return true;
    }
}
