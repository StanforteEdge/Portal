<?php

namespace App\Core\Workflow\Services;

use App\Core\Workflow\Models\Workflow;
use App\Core\Workflow\Models\WorkflowInstance;
use App\Core\Workflow\Models\WorkflowStep;
use App\Core\Workflow\Models\WorkflowTransition;
use App\Core\Workflow\Models\WorkflowApprover;
use App\Core\User\Models\User;
use WP_Error;

class WorkflowService
{
    /**
     * Start a new workflow instance.
     *
     * @param string $workflowName
     * @param string $entityType
     * @param int $entityId
     * @param int $initiatorId
     * @param array $data
     * @return WorkflowInstance|WP_Error
     */
    /**
     * Start a new workflow instance.
     *
     * @param string $workflowName
     * @param string $entityType
     * @param int $entityId
     * @param int $initiatorId
     * @param array $data
     * @return WorkflowInstance|WP_Error
     */
    public function startWorkflow($workflowName, $entityType, $entityId, $initiatorId, $data = [])
    {
        // Find the workflow definition
        $workflow = Workflow::where('name', $workflowName)
            ->where('is_active', true)
            ->first();

        if (!$workflow) {
            return new WP_Error(
                'workflow_not_found',
                "Workflow '{$workflowName}' not found or inactive",
                ['status' => 404]
            );
        }

        // Check if there's already an active instance for this entity
        $existingInstance = WorkflowInstance::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->first();

        if ($existingInstance) {
            return new WP_Error(
                'workflow_already_started',
                'An active workflow instance already exists for this entity',
                ['status' => 409]
            );
        }

        // Get the initial step
        $initialStep = $workflow->initialStep;
        if (!$initialStep) {
            return new WP_Error(
                'invalid_workflow_definition',
                "No initial step defined for workflow '{$workflowName}'",
                ['status' => 400]
            );
        }

        // Create the workflow instance
        $instance = new WorkflowInstance([
            'workflow_id' => $workflow->id,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'current_step_id' => $initialStep->id,
            'status' => 'in_progress',
            'initiated_by' => $initiatorId,
            'metadata' => $data
        ]);

        if (!$instance->save()) {
            return new WP_Error(
                'save_failed',
                'Failed to save workflow instance',
                ['status' => 500]
            );
        }

        // Log the workflow start
        $history = (new \App\Core\Workflow\Models\WorkflowHistory())->create([
            'id' => \wp_generate_uuid4(),
            'instance_id' => $instance->id,
            'action' => 'start',
            'performed_by' => $initiatorId,
            'comment' => 'Workflow started',
            'data' => $data
        ]);

        if (!$history) {
            // Log the error but don't fail the operation
            error_log('Failed to create workflow history entry for instance: ' . $instance->id);
        }

        return $instance;
    }

    /**
     * Process a workflow transition.
     *
     * @param int $instanceId
     * @param string $action
     * @param int $userId
     * @param array $data
     * @return WorkflowInstance|WP_Error
     */
    public function processTransition($instanceId, $action, $userId, $data = [])
    {
        // Find the workflow instance
        $instance = WorkflowInstance::find($instanceId);
        if (!$instance) {
            return new WP_Error(
                'instance_not_found',
                'Workflow instance not found',
                ['status' => 404]
            );
        }

        // Check if the workflow is in a valid state
        if ($instance->isCompleted()) {
            return new WP_Error(
                'invalid_workflow_state',
                'Cannot transition a completed workflow',
                ['status' => 400]
            );
        }

        // Get the current step
        $currentStep = $instance->currentStep;
        if (!$currentStep) {
            return new WP_Error(
                'step_not_found',
                'Current step not found',
                ['status' => 404]
            );
        }

        // Find the transition
        $transition = WorkflowTransition::where('from_step_id', $currentStep->id)
            ->where('action', $action)
            ->first();

        if (!$transition) {
            return new WP_Error(
                'transition_not_found',
                "No transition found for action '{$action}' in current step",
                ['status' => 400]
            );
        }

        // Check if user can perform this action
        if (!$this->canUserPerformAction($instance, $currentStep, $userId, $action)) {
            return new WP_Error(
                'unauthorized_action',
                'You are not authorized to perform this action',
                ['status' => 403]
            );
        }

        // Get the target step
        $targetStep = $transition->toStep;
        if (!$targetStep) {
            return new WP_Error(
                'step_not_found',
                'Target step not found',
                ['status' => 404]
            );
        }

        // Process the transition
        $comment = $data['comment'] ?? '';
        unset($data['comment']);

        // Update the instance
        $instance->current_step_id = $targetStep->id;
        
        // If this is a final step, mark as completed
        if ($targetStep->is_final) {
            $instance->status = 'completed';
            $instance->completed_at = current_time('mysql', true);
        }
        
        if (!$instance->save()) {
            return new WP_Error(
                'save_failed',
                'Failed to update workflow instance',
                ['status' => 500]
            );
        }

        // Log the transition
        $history = (new \App\Core\Workflow\Models\WorkflowHistory())->create([
            'id' => \wp_generate_uuid4(),
            'instance_id' => $instance->id,
            'transition_id' => $transition->id,
            'from_step_id' => $currentStep->id,
            'to_step_id' => $targetStep->id,
            'action' => $action,
            'performed_by' => $userId,
            'comment' => $comment,
            'data' => $data
        ]);

        if (!$history) {
            // Log the error but don't fail the operation
            error_log('Failed to create workflow history entry for transition: ' . $transition->id);
        }

        return $instance;
    }

    /**
     * Check if a user can perform an action on a workflow instance.
     *
     * @param WorkflowInstance $instance
     * @param WorkflowStep $step
     * @param int $userId
     * @param string $action
     * @return bool|WP_Error
     */
    protected function canUserPerformAction($instance, $step, $userId, $action)
    {
        // System actions (like system timeouts) can always be performed
        if (strpos($action, 'system.') === 0) {
            return true;
        }

        try {
            // Check if user is an approver for this step
            $isApprover = WorkflowApprover::where('step_id', $step->id)
                ->where(function ($query) use ($userId) {
                    $query->where(function ($q) use ($userId) {
                        $q->where('approver_type', 'user')
                            ->where('approver_id', $userId);
                    })->orWhereHas('role', function ($q) use ($userId) {
                        $q->whereHas('users', function ($q) use ($userId) {
                            $q->where('user_id', $userId);
                        });
                    });
                })
                ->exists();

            if (!$isApprover) {
                return false;
            }

            // Check if the action is allowed in the current state
            $transition = WorkflowTransition::where('from_step_id', $step->id)
                ->where('action', $action)
                ->exists();

            return $transition;
            
        } catch (\Exception $e) {
            return new WP_Error(
                'permission_check_failed',
                'Failed to verify user permissions: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Get the available actions for the current user on a workflow instance.
     *
     * @param int $instanceId
     * @param int $userId
     * @return array|WP_Error
     */
    public function getAvailableActions($instanceId, $userId)
    {
        $instance = WorkflowInstance::find($instanceId);
        if (!$instance) {
            return new WP_Error(
                'instance_not_found',
                'Workflow instance not found',
                ['status' => 404]
            );
        }

        if ($instance->isCompleted()) {
            return [];
        }

        $currentStep = $instance->currentStep;
        if (!$currentStep) {
            return new WP_Error(
                'step_not_found',
                'Current step not found',
                ['status' => 404]
            );
        }

        // Get all outbound transitions from the current step
        $transitions = $currentStep->outboundTransitions;
        $availableActions = [];

        foreach ($transitions as $transition) {
            $canPerform = $this->canUserPerformAction($instance, $currentStep, $userId, $transition->action);
            if (is_wp_error($canPerform)) {
                // Log the error but continue with other transitions
                error_log('Error checking user permissions: ' . $canPerform->get_error_message());
                continue;
            }
            
            if ($canPerform) {
                $availableActions[] = [
                    'id' => $transition->id,
                    'action' => $transition->action,
                    'name' => $transition->display_name,
                    'to_step_id' => $transition->to_step_id,
                    'to_step_name' => $transition->toStep->name ?? null,
                ];
            }
        }

        return $availableActions;
    }

    /**
     * Cancel a workflow instance.
     *
     * @param int $instanceId
     * @param int $userId
     * @param string $reason
     * @return WorkflowInstance|WP_Error
     */
    public function cancelWorkflow($instanceId, $userId, $reason = '')
    {
        $instance = WorkflowInstance::find($instanceId);
        if (!$instance) {
            return new WP_Error(
                'instance_not_found',
                'Workflow instance not found',
                ['status' => 404]
            );
        }

        if ($instance->isCompleted()) {
            return new WP_Error(
                'invalid_workflow_state',
                'Cannot cancel a completed workflow',
                ['status' => 400]
            );
        }

        $instance->status = 'cancelled';
        $instance->completed_at = current_time('mysql', true);
        
        if (!$instance->save()) {
            return new WP_Error(
                'save_failed',
                'Failed to cancel workflow instance',
                ['status' => 500]
            );
        }

        // Log the cancellation
        $history = $instance->history()->create([
            'action' => 'cancel',
            'performed_by' => $userId,
            'comment' => $reason ?: 'Workflow cancelled',
            'data' => ['reason' => $reason]
        ]);

        if (!$history) {
            // Log the error but don't fail the operation
            error_log('Failed to create workflow history entry for cancellation: ' . $instance->id);
        }

        return $instance;
    }
}
