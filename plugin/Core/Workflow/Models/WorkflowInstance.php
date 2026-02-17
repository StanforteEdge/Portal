<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;
use App\Core\User\Models\User;
use App\Core\Workflow\Models\Workflow;
use App\Core\Workflow\Models\WorkflowStep;
use App\Core\Workflow\Models\WorkflowHistory;
use App\Core\Workflow\Models\WorkflowTransition;

/**
 * Class WorkflowInstance
 * 
 * Represents an instance of a workflow for a specific entity.
 */
class WorkflowInstance extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflow_instances';

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
        'entity_type',
        'entity_id',
        'current_step_id',
        'status',
        'initiated_by',
        'completed_at',
        'metadata',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'metadata' => 'array',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the workflow definition this instance is based on.
     *
     * @return object|null Workflow object or null
     */
    public function getWorkflow()
    {
        $workflowModel = new Workflow();
        return $workflowModel->find($this->workflow_id);
    }

    /**
     * Get the current step in the workflow.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getCurrentStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->find($this->current_step_id);
    }

    /**
     * Get the history of transitions for this instance.
     *
     * @return array Array of WorkflowHistory objects
     */
    public function getHistory()
    {
        $historyModel = new WorkflowHistory();
        return $historyModel->where('instance_id', $this->id)
                           ->orderBy('created_at', 'desc')
                           ->get();
    }

    /**
     * Get the user who initiated this workflow instance.
     *
     * @return object|null User object or null
     */
    public function getInitiator()
    {
        $userModel = new User();
        return $userModel->find($this->initiated_by);
    }

    /**
     * Get all approvers for the current step.
     *
     * @return array Array of approver objects
     */
    public function getCurrentApprovers()
    {
        $currentStep = $this->getCurrentStep();
        if (!$currentStep) {
            return [];
        }

        $approvers = $currentStep->getApprovers();
        $resolved = [];

        foreach ($approvers as $approver) {
            if (is_object($approver) && method_exists($approver, 'getApprovers')) {
                $resolved = array_merge($resolved, $approver->getApprovers());
            } else {
                $resolved[] = $approver;
            }
        }

        return $resolved;
    }

    /**
     * Check if the workflow instance is completed.
     *
     * @return bool
     */
    public function isCompleted()
    {
        return $this->status === 'completed' || $this->status === 'cancelled';
    }

    /**
     * Check if a user can perform an action on this instance.
     *
     * @param int|string $userId
     * @return bool
     */
    public function canUserAct($userId)
    {
        if ($this->isCompleted()) {
            return false;
        }

        $currentStep = $this->getCurrentStep();
        if (!$currentStep) {
            return false;
        }

        // Check if user is an approver for the current step
        if ($currentStep->isUserApprover($userId)) {
            return true;
        }

        // Check if user is the initiator and has permission to cancel
        if ($this->initiated_by == $userId) {
            return true;
        }

        return false;
    }

    /**
     * Get the entity this workflow instance is for.
     *
     * @return mixed
     */
    public function getEntity()
    {
        if (!$this->entity_type || !$this->entity_id) {
            return null;
        }

        // This is a simplified example - you'll need to implement the actual logic
        // to retrieve the entity based on entity_type
        try {
            $modelClass = $this->entity_type;
            $model = new $modelClass();
            return $model->find($this->entity_id);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get the current status of the workflow instance.
     *
     * @return string
     */
    public function getStatus()
    {
        return $this->status ?? 'pending';
    }

    /**
     * Get the display name of the current status.
     *
     * @return string
     */
    public function getStatusDisplayName()
    {
        $statuses = [
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            'rejected' => 'Rejected'
        ];

        return $statuses[$this->getStatus()] ?? 'Unknown';
    }

    /**
     * Move the workflow to the next step.
     */
    public function moveToNextStep($userId, $comment = '', $data = [])
    {
        if ($this->isCompleted()) {
            return $this;
        }

        $workflow = $this->getWorkflow();
        $currentStep = $this->getCurrentStep();

        if (!$workflow || !$currentStep) {
            throw new \Exception('Workflow or current step not found');
        }

        $nextStep = $workflow->getNextStep($currentStep);

        if (!$nextStep) {
            $this->markAsCompleted($userId, $comment);
            return $this;
        }

        return $this->transitionTo($nextStep, $userId, $comment, $data);
    }

    /**
     * Transition to a specific step.
     */
    public function transitionTo($step, $userId, $comment = '', $data = [])
    {
        if ($this->isCompleted()) {
            throw new \Exception('Cannot transition a completed workflow instance');
        }

        // Check if the transition is valid
        $transitionModel = new WorkflowTransition();
        $transition = $transitionModel->where('from_step_id', $this->current_step_id)
                                     ->where('to_step_id', $step->id)
                                     ->first();

        if (!$transition) {
            throw new \Exception('Invalid workflow transition');
        }

        // Create history record
        $historyModel = new WorkflowHistory();
        $historyModel->create([
            'id' => \wp_generate_uuid4(),
            'instance_id' => $this->id,
            'from_step_id' => $this->current_step_id,
            'to_step_id' => $step->id,
            'transition_id' => $transition->id,
            'action' => $transition->action,
            'performed_by' => $userId,
            'comment' => $comment,
            'data' => $data
        ]);

        // Update current step
        $this->update($this->id, [
            'current_step_id' => $step->id
        ]);

        // If this is a final step, mark as completed
        if ($step->is_final) {
            $this->markAsCompleted($userId, 'Workflow completed');
        }

        return $this;
    }

    /**
     * Mark the workflow as completed.
     */
    public function markAsCompleted($userId, $comment = '')
    {
        $this->update($this->id, [
            'status' => 'completed',
            'completed_at' => current_time('mysql')
        ]);

        // Log the completion
        $historyModel = new WorkflowHistory();
        $historyModel->create([
            'id' => \wp_generate_uuid4(),
            'instance_id' => $this->id,
            'from_step_id' => $this->current_step_id,
            'action' => 'complete',
            'performed_by' => $userId,
            'comment' => $comment
        ]);

        return $this;
    }

    /**
     * Cancel the workflow.
     */
    public function cancel($userId, $comment = '')
    {
        $this->update($this->id, [
            'status' => 'cancelled',
            'cancelled_at' => current_time('mysql')
        ]);

        // Log the cancellation
        $historyModel = new WorkflowHistory();
        $historyModel->create([
            'id' => \wp_generate_uuid4(),
            'instance_id' => $this->id,
            'from_step_id' => $this->current_step_id,
            'action' => 'cancel',
            'performed_by' => $userId,
            'comment' => $comment
        ]);

        return $this;
    }

    /**
     * Get all files attached to this workflow instance.
     *
     * @return array Array of File objects
     */
    public function getAttachedFiles()
    {
        return \App\Core\FileStorage\Models\FileLink::getForEntity('workflow_instance', $this->id);
    }

    /**
     * Attach a file to this workflow instance.
     *
     * @param string $fileId File ID to attach
     * @param int $userId User performing the attachment
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public function attachFile($fileId, $userId)
    {
        // Check if user can attach files to this workflow
        if (!$this->canUserAct($userId)) {
            return new WP_Error('access_denied', 'User cannot attach files to this workflow');
        }

        // Create file link
        $result = \App\Core\FileStorage\Models\FileLink::createLink($fileId, 'workflow_instance', $this->id, $userId);

        if (!$result) {
            return new WP_Error('attachment_failed', 'Failed to attach file to workflow');
        }

        return true;
    }

    /**
     * Remove a file attachment from this workflow instance.
     *
     * @param string $fileId File ID to remove
     * @param int $userId User performing the removal
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public function removeFileAttachment($fileId, $userId)
    {
        // Check if user can modify files on this workflow
        if (!$this->canUserAct($userId)) {
            return new WP_Error('access_denied', 'User cannot remove files from this workflow');
        }

        // Remove file link
        $result = \App\Core\FileStorage\Models\FileLink::removeLink($fileId, 'workflow_instance', $this->id);

        if (!$result) {
            return new WP_Error('removal_failed', 'Failed to remove file from workflow');
        }

        return true;
    }

    /**
     * Get files attached to the entity this workflow is for.
     *
     * @return array Array of File objects
     */
    public function getEntityFiles()
    {
        if (!$this->entity_type || !$this->entity_id) {
            return [];
        }

        return \App\Core\FileStorage\Models\FileLink::getForEntity($this->entity_type, $this->entity_id);
    }
}
    
