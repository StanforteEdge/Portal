<?php
/**
 * Workflow Controller
 * 
 * Handles all workflow-related API requests including workflow definitions,
 * instances, steps, transitions, and approvers management.
 * 
 * @package App\Core\Workflow\Controllers
 */

namespace App\Core\Workflow\Controllers;

use \WP_REST_Request;
use \WP_REST_Response;
use \WP_Error;
use App\Utils\BaseController;
use App\Core\Workflow\Services\WorkflowService;
use App\Core\Workflow\Models\Workflow;
use App\Core\Workflow\Models\WorkflowInstance;

class WorkflowController extends BaseController
{
    /**
     * @var WorkflowService
     */
    protected $workflowService;

    /**
     * WorkflowController constructor.
     *
     * @param WorkflowService $workflowService
     */
    public function __construct(WorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    // ==================== WORKFLOW INSTANCE METHODS ====================

    /**
     * Start a new workflow instance
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function startWorkflow(\WP_REST_Request $request)
    {
        try {
            $params = $request->get_json_params();
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            if (empty($params['workflow_name']) || empty($params['entity_type']) || empty($params['entity_id'])) {
                return static::error('missing_parameters', 'Missing required parameters: workflow_name, entity_type, entity_id', 400);
            }

            $result = $this->workflowService->startWorkflow(
                $params['workflow_name'],
                $params['entity_type'],
                $params['entity_id'],
                $userId,
                $params['data'] ?? []
            );

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result->toArray()], 201);

        } catch (\Exception $e) {
            error_log('Error starting workflow: ' . $e->getMessage());
            return static::error('workflow_start_error', 'Failed to start workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Process a workflow transition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function processTransition(\WP_REST_Request $request)
    {
        try {
            $params = $request->get_json_params();
            $instanceId = $request->get_param('instance_id');
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            if (empty($instanceId) || empty($params['action'])) {
                return static::error('missing_parameters', 'Missing required parameters: instance_id, action', 400);
            }

            $result = $this->workflowService->processTransition(
                $instanceId,
                $params['action'],
                $userId,
                array_merge($params['data'] ?? [], ['comment' => $params['comment'] ?? ''])
            );

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error processing transition: ' . $e->getMessage());
            return static::error('transition_error', 'Failed to process transition', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get available actions for the current user on a workflow instance
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getAvailableActions(\WP_REST_Request $request)
    {
        try {
            $instanceId = $request->get_param('instance_id');
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            if (empty($instanceId)) {
                return static::error('missing_parameters', 'Missing required parameter: instance_id', 400);
            }

            $result = $this->workflowService->getAvailableActions($instanceId, $userId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting available actions: ' . $e->getMessage());
            return static::error('actions_error', 'Failed to retrieve available actions', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get workflow history
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getHistory(\WP_REST_Request $request)
    {
        try {
            $instanceId = $request->get_param('instance_id');
            $limit = $request->get_param('limit') ?: 50;
            $offset = $request->get_param('offset') ?: 0;

            if (empty($instanceId)) {
                return static::error('missing_parameters', 'Missing required parameter: instance_id', 400);
            }

            $history = WorkflowInstance::find($instanceId)?->history()
                ->with(['performer', 'fromStep', 'toStep'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();

            return static::success(['data' => $history->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow history: ' . $e->getMessage());
            return static::error('history_error', 'Failed to retrieve workflow history', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get workflow instance details
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getInstance(\WP_REST_Request $request)
    {
        try {
            $instanceId = $request->get_param('instance_id');

            if (empty($instanceId)) {
                return static::error('missing_parameters', 'Missing required parameter: instance_id', 400);
            }

            $instance = WorkflowInstance::with([
                'workflow',
                'currentStep',
                'initiator',
                'currentStep.approvers',
                'currentStep.approvers.user',
                'currentStep.approvers.role'
            ])->find($instanceId);

            if (!$instance) {
                return static::error('not_found', 'Workflow instance not found', 404);
            }

            return static::success(['data' => $instance->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow instance: ' . $e->getMessage());
            return static::error('instance_error', 'Failed to retrieve workflow instance', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Cancel a workflow instance
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function cancelWorkflow(\WP_REST_Request $request)
    {
        try {
            $params = $request->get_json_params();
            $instanceId = $request->get_param('instance_id');
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            if (empty($instanceId)) {
                return static::error('missing_parameters', 'Missing required parameter: instance_id', 400);
            }

            $result = $this->workflowService->cancelWorkflow($instanceId, $userId, $params['reason'] ?? '');

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error canceling workflow: ' . $e->getMessage());
            return static::error('cancel_error', 'Failed to cancel workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    // ==================== WORKFLOW ADMIN METHODS ====================

    /**
     * Get all workflows
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflows(\WP_REST_Request $request)
    {
        try {
            $entityType = $request->get_param('entity_type');
            $isActive = $request->get_param('is_active');
            $perPage = $request->get_param('per_page') ?: 20;
            $page = $request->get_param('page') ?: 1;

            $query = Workflow::query();

            if (!is_null($entityType)) {
                $query->where('entity_type', $entityType);
            }

            if (!is_null($isActive)) {
                $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
            }

            $workflows = $query->with(['steps', 'steps.approvers'])
                ->paginate($perPage, ['*'], 'page', $page);

            return static::success([
                'data' => $workflows->items(),
                'pagination' => [
                    'total' => $workflows->total(),
                    'per_page' => $workflows->perPage(),
                    'current_page' => $workflows->currentPage(),
                    'last_page' => $workflows->lastPage(),
                ]
            ], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflows: ' . $e->getMessage());
            return static::error('workflows_error', 'Failed to retrieve workflows', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific workflow definition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflow(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');
            $workflow = Workflow::with(['steps', 'steps.approvers', 'steps.transitions'])->find($workflowId);

            if (!$workflow) {
                return static::error('not_found', 'Workflow not found', 404);
            }

            return static::success(['data' => $workflow->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow: ' . $e->getMessage());
            return static::error('workflow_error', 'Failed to retrieve workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new workflow definition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function createWorkflow(\WP_REST_Request $request)
    {
        try {
            $params = $request->get_json_params();
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            if (empty($params['name']) || empty($params['entity_type'])) {
                return static::error('missing_parameters', 'Missing required parameters: name, entity_type', 400);
            }

            $workflow = new Workflow([
                'name' => $params['name'],
                'description' => $params['description'] ?? '',
                'entity_type' => $params['entity_type'],
                'is_active' => $params['is_active'] ?? true,
                'config' => $params['config'] ?? [],
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            if (!$workflow->save()) {
                return static::error('save_failed', 'Failed to create workflow', 500);
            }

            return static::success(['data' => $workflow->toArray()], 201);

        } catch (\Exception $e) {
            error_log('Error creating workflow: ' . $e->getMessage());
            return static::error('workflow_create_error', 'Failed to create workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a workflow definition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function updateWorkflow(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');
            $params = $request->get_json_params();
            $user = $request->get_param('__auth_user');
            $userId = $user ? $user->ID : 0;

            $workflow = Workflow::find($workflowId);
            if (!$workflow) {
                return static::error('not_found', 'Workflow not found', 404);
            }

            $updates = ['updated_by' => $userId];

            if (isset($params['name'])) {
                $updates['name'] = $params['name'];
            }
            if (isset($params['description'])) {
                $updates['description'] = $params['description'];
            }
            if (isset($params['entity_type'])) {
                $updates['entity_type'] = $params['entity_type'];
            }
            if (isset($params['is_active'])) {
                $updates['is_active'] = $params['is_active'];
            }
            if (isset($params['config'])) {
                $updates['config'] = $params['config'];
            }

            if (!$workflow->update($updates)) {
                return static::error('update_failed', 'Failed to update workflow', 500);
            }

            return static::success(['data' => $workflow->toArray()], 200);

        } catch (\Exception $e) {
            error_log('Error updating workflow: ' . $e->getMessage());
            return static::error('workflow_update_error', 'Failed to update workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a workflow definition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function deleteWorkflow(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');
            $workflow = Workflow::find($workflowId);

            if (!$workflow) {
                return static::error('not_found', 'Workflow not found', 404);
            }

            // Check if there are any instances of this workflow
            if ($workflow->instances()->exists()) {
                return static::error('constraint_error', 'Cannot delete workflow with existing instances', 409);
            }

            if (!$workflow->delete()) {
                return static::error('delete_failed', 'Failed to delete workflow', 500);
            }

            return static::success(['message' => 'Workflow deleted successfully'], 200);

        } catch (\Exception $e) {
            error_log('Error deleting workflow: ' . $e->getMessage());
            return static::error('workflow_delete_error', 'Failed to delete workflow', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    // ==================== WORKFLOW STEP METHODS ====================

    /**
     * Get workflow steps
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflowSteps(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');

            if (empty($workflowId)) {
                return static::error('missing_parameters', 'Missing required parameter: workflow_id', 400);
            }

            $result = $this->workflowService->getWorkflowSteps($workflowId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow steps: ' . $e->getMessage());
            return static::error('steps_error', 'Failed to retrieve workflow steps', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create workflow step
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function createWorkflowStep(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');
            $params = $request->get_json_params();

            if (empty($workflowId) || empty($params['name']) || empty($params['step_type'])) {
                return static::error('missing_parameters', 'Missing required parameters: workflow_id, name, step_type', 400);
            }

            $result = $this->workflowService->createWorkflowStep($workflowId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 201);

        } catch (\Exception $e) {
            error_log('Error creating workflow step: ' . $e->getMessage());
            return static::error('step_create_error', 'Failed to create workflow step', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get specific workflow step
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflowStep(\WP_REST_Request $request)
    {
        try {
            $stepId = $request->get_param('step_id');

            if (empty($stepId)) {
                return static::error('missing_parameters', 'Missing required parameter: step_id', 400);
            }

            $result = $this->workflowService->getWorkflowStep($stepId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 404);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow step: ' . $e->getMessage());
            return static::error('step_error', 'Failed to retrieve workflow step', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update workflow step
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function updateWorkflowStep(\WP_REST_Request $request)
    {
        try {
            $stepId = $request->get_param('step_id');
            $params = $request->get_json_params();

            if (empty($stepId)) {
                return static::error('missing_parameters', 'Missing required parameter: step_id', 400);
            }

            $result = $this->workflowService->updateWorkflowStep($stepId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error updating workflow step: ' . $e->getMessage());
            return static::error('step_update_error', 'Failed to update workflow step', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete workflow step
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function deleteWorkflowStep(\WP_REST_Request $request)
    {
        try {
            $stepId = $request->get_param('step_id');

            if (empty($stepId)) {
                return static::error('missing_parameters', 'Missing required parameter: step_id', 400);
            }

            $result = $this->workflowService->deleteWorkflowStep($stepId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['message' => 'Workflow step deleted successfully'], 200);

        } catch (\Exception $e) {
            error_log('Error deleting workflow step: ' . $e->getMessage());
            return static::error('step_delete_error', 'Failed to delete workflow step', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    // ==================== APPROVER METHODS ====================

    /**
     * Get step approvers
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getStepApprovers(\WP_REST_Request $request)
    {
        try {
            $stepId = $request->get_param('step_id');

            if (empty($stepId)) {
                return static::error('missing_parameters', 'Missing required parameter: step_id', 400);
            }

            $result = $this->workflowService->getStepApprovers($stepId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting step approvers: ' . $e->getMessage());
            return static::error('approvers_error', 'Failed to retrieve step approvers', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Add step approver
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function addStepApprover(\WP_REST_Request $request)
    {
        try {
            $stepId = $request->get_param('step_id');
            $params = $request->get_json_params();

            if (empty($stepId) || empty($params['approver_type']) || empty($params['approver_id'])) {
                return static::error('missing_parameters', 'Missing required parameters: step_id, approver_type, approver_id', 400);
            }

            $result = $this->workflowService->addStepApprover($stepId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 201);

        } catch (\Exception $e) {
            error_log('Error adding step approver: ' . $e->getMessage());
            return static::error('approver_add_error', 'Failed to add step approver', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update step approver
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function updateStepApprover(\WP_REST_Request $request)
    {
        try {
            $approverId = $request->get_param('approver_id');
            $params = $request->get_json_params();

            if (empty($approverId)) {
                return static::error('missing_parameters', 'Missing required parameter: approver_id', 400);
            }

            $result = $this->workflowService->updateStepApprover($approverId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error updating step approver: ' . $e->getMessage());
            return static::error('approver_update_error', 'Failed to update step approver', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Remove step approver
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function removeStepApprover(\WP_REST_Request $request)
    {
        try {
            $approverId = $request->get_param('approver_id');

            if (empty($approverId)) {
                return static::error('missing_parameters', 'Missing required parameter: approver_id', 400);
            }

            $result = $this->workflowService->removeStepApprover($approverId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['message' => 'Approver removed successfully'], 200);

        } catch (\Exception $e) {
            error_log('Error removing step approver: ' . $e->getMessage());
            return static::error('approver_remove_error', 'Failed to remove step approver', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    // ==================== TRANSITION METHODS ====================

    /**
     * Get workflow transitions
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflowTransitions(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');

            if (empty($workflowId)) {
                return static::error('missing_parameters', 'Missing required parameter: workflow_id', 400);
            }

            $result = $this->workflowService->getWorkflowTransitions($workflowId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow transitions: ' . $e->getMessage());
            return static::error('transitions_error', 'Failed to retrieve workflow transitions', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create workflow transition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function createWorkflowTransition(\WP_REST_Request $request)
    {
        try {
            $workflowId = $request->get_param('workflow_id');
            $params = $request->get_json_params();

            if (empty($workflowId) || empty($params['from_step_id']) || empty($params['to_step_id']) || empty($params['action'])) {
                return static::error('missing_parameters', 'Missing required parameters: workflow_id, from_step_id, to_step_id, action', 400);
            }

            $result = $this->workflowService->createWorkflowTransition($workflowId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 201);

        } catch (\Exception $e) {
            error_log('Error creating workflow transition: ' . $e->getMessage());
            return static::error('transition_create_error', 'Failed to create workflow transition', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get specific workflow transition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function getWorkflowTransition(\WP_REST_Request $request)
    {
        try {
            $transitionId = $request->get_param('transition_id');

            if (empty($transitionId)) {
                return static::error('missing_parameters', 'Missing required parameter: transition_id', 400);
            }

            $result = $this->workflowService->getWorkflowTransition($transitionId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 404);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error getting workflow transition: ' . $e->getMessage());
            return static::error('transition_error', 'Failed to retrieve workflow transition', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update workflow transition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function updateWorkflowTransition(\WP_REST_Request $request)
    {
        try {
            $transitionId = $request->get_param('transition_id');
            $params = $request->get_json_params();

            if (empty($transitionId)) {
                return static::error('missing_parameters', 'Missing required parameter: transition_id', 400);
            }

            $result = $this->workflowService->updateWorkflowTransition($transitionId, $params);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error updating workflow transition: ' . $e->getMessage());
            return static::error('transition_update_error', 'Failed to update workflow transition', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete workflow transition
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function deleteWorkflowTransition(\WP_REST_Request $request)
    {
        try {
            $transitionId = $request->get_param('transition_id');

            if (empty($transitionId)) {
                return static::error('missing_parameters', 'Missing required parameter: transition_id', 400);
            }

            $result = $this->workflowService->deleteWorkflowTransition($transitionId);

            if (is_wp_error($result)) {
                return static::error($result->get_error_code(), $result->get_error_message(), 400);
            }

            return static::success(['message' => 'Transition deleted successfully'], 200);

        } catch (\Exception $e) {
            error_log('Error deleting workflow transition: ' . $e->getMessage());
            return static::error('transition_delete_error', 'Failed to delete workflow transition', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
}
