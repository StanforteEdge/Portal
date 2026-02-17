<?php

namespace App\Core\Requests\Services;

use App\Core\Requests\Models\RequestType;
use App\Core\Workflow\Models\WorkflowInstance;
use App\Core\Requests\Models\RequestInstance;
use App\Core\Workflow\Models\Workflow;
use App\Core\Workflow\Models\WorkflowStep;


/**
 * RequestWorkflowAdapter
 *
 * Connects the Request System to the existing Core/Workflow engine
 * Handles creation and management of approval workflows for requests
 */
class RequestWorkflowAdapter
{
    /**
     * Create approval workflow for a request
     *
     * @param string $requestId Request instance ID
     * @param string $requestTypeId Request type ID
     * @return string|null Workflow instance ID or null on failure
     */
    public static function createApprovalWorkflow($requestId, $requestTypeId)
    {
        try {
            // 1. Get the request object and determine its model/table
            // We use RequestService::getRequest to find it across module tables
            $requestResult = RequestService::getRequest($requestId);
            if (!$requestResult['success']) {
                error_log("RequestWorkflowAdapter: Request not found: $requestId");
                return null;
            }
            $request = (object) $requestResult['data'];

            // Determine the correct model for updating status
            // We can infer this from the group code
            $groupCode = $request->group->code ?? 'generic';
            $requestModel = RequestService::getModuleRequestModel($groupCode);

            // 2. Get request type to determine workflow
            $typeData = (new RequestType())->find($requestTypeId);

            if (!$typeData) {
                error_log("RequestWorkflowAdapter: Request type not found: $requestTypeId");
                return null;
            }

            // Get or create appropriate workflow for this request type
            $workflowId = self::getWorkflowForRequestType($typeData);

            if (!$workflowId) {
                error_log("RequestWorkflowAdapter: No workflow found for request type: " . $typeData->name);
                return null;
            }

            // Get initial step
            $workflowModel = new Workflow();
            $workflow = $workflowModel->find($workflowId);
            $initialStep = $workflow->getInitialStep();

            if (!$initialStep) {
                error_log("RequestWorkflowAdapter: No initial step found for workflow: $workflowId");
                return null;
            }

            // Create workflow instance
            // CRITICAL: Use UUID as entity_id for requests to ensure uniqueness across module tables
            $initiatorId = null;
            if (isset($request->created_by)) {
                if (is_object($request->created_by) && isset($request->created_by->id)) {
                    $initiatorId = $request->created_by->id;
                } elseif (is_array($request->created_by) && isset($request->created_by['id'])) {
                    $initiatorId = $request->created_by['id'];
                } elseif (is_numeric($request->created_by)) {
                    $initiatorId = $request->created_by;
                }
            }
            $workflowInstanceModel = new WorkflowInstance();
            $workflowInstance = $workflowInstanceModel->create([
                'id' => \wp_generate_uuid4(),
                'workflow_id' => $workflowId,
                'entity_type' => 'request',
                'entity_id' => $request->id ?? $requestId,
                'current_step_id' => $initialStep->id,
                'status' => 'pending',
                'initiated_by' => $initiatorId
            ]);

            if (!$workflowInstance) {
                error_log("RequestWorkflowAdapter: Failed to create workflow instance for request: $requestId");
                return null;
            }

            // Update request with workflow instance ID using the correct module model
            $requestModel->update($requestId, [
                'workflow_instance_id' => $workflowInstance->id,
                'status' => 'submitted',
                'current_approval_step' => 1
            ]);

            error_log("RequestWorkflowAdapter: Created workflow instance {$workflowInstance->id} for request $requestId");

            // Auto-advance if current step has no approver (e.g., no team lead)
            $workflowInstance = self::autoAdvanceIfNoApprover($workflowInstance, $request, $initiatorId);

            // Update request status if workflow completed due to auto-skip
            if ($workflowInstance->isCompleted()) {
                $requestModel->update($requestId, ['status' => 'approved']);
                self::sendWorkflowNotifications($workflowInstance, $request, 'complete', $initiatorId);
            } else {
                // Send initial notification to first approvers
                self::sendWorkflowNotifications($workflowInstance, $request, 'approve', $initiatorId);
            }

            return $workflowInstance->id;
        } catch (\Exception $e) {
            error_log("RequestWorkflowAdapter: Error creating workflow for request $requestId: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get or create workflow for request type
     *
     * @param object $requestType RequestType object
     * @return string|null Workflow ID or null
     */
    private static function getWorkflowForRequestType($requestType)
    {
        // First, try to find existing workflow for this request type
        // Since BaseModel doesn't support JSON_EXTRACT directly, we'll use a different approach
        $workflowModel = new Workflow();

        // Get all workflows for 'request' entity type and check their config manually
        $allRequestWorkflows = $workflowModel->where('entity_type', 'request')->get();

        foreach ($allRequestWorkflows as $workflow) {
            $config = json_decode($workflow->config, true);
            if (isset($config['request_type_id']) && $config['request_type_id'] === $requestType->id) {
                return $workflow->id;
            }
        }

        // If no existing workflow found, create a new one
        return self::createWorkflowFromApprovalFlow($requestType);
    }

    /**
     * Create workflow from request type's approval flow JSON
     *
     * @param object $requestType RequestType object
     * @return string|null Workflow ID or null on failure
     */
    private static function createWorkflowFromApprovalFlow($requestType)
    {
        try {
            $approvalFlow = $requestType->approval_flow_json;
            if (is_string($approvalFlow)) {
                $approvalFlow = json_decode($approvalFlow, true);
            }

            if (!$approvalFlow || !isset($approvalFlow['steps']) || !is_array($approvalFlow['steps'])) {
                error_log("RequestWorkflowAdapter: Invalid approval flow for request type: " . $requestType->name);
                return null;
            }

            // Create workflow definition
            $workflowId = \wp_generate_uuid4();
            $workflowModel = new Workflow();
            $workflowCreated = $workflowModel->create([
                'id' => $workflowId,
                'name' => $requestType->name . ' Approval Workflow',
                'description' => 'Auto-generated workflow for ' . $requestType->name,
                'entity_type' => 'request',
                'is_active' => true,
                'config' => [
                    'request_type_id' => $requestType->id,
                    'approval_limit' => $requestType->approval_limit,
                    'source' => 'request_system'
                ]
            ]);

            if (!$workflowCreated) {
                error_log("RequestWorkflowAdapter: Failed to create workflow definition");
                return null;
            }

            // Create workflow steps from approval flow
            $stepOrder = 1;
            $previousStepId = null;
            foreach ($approvalFlow['steps'] as $stepConfig) {
                $stepId = \wp_generate_uuid4();
                $workflowStep = new WorkflowStep();
                $stepCreated = $workflowStep->create([
                    'id' => $stepId,
                    'workflow_id' => $workflowId,
                    'name' => ucfirst($stepConfig['action']) . ' by ' . ucfirst(str_replace('_', ' ', $stepConfig['role'])),
                    'description' => "Approval step: {$stepConfig['action']}",
                    'order' => $stepOrder,
                    'is_initial' => ($stepOrder === 1),
                    'is_final' => false,
                    'config' => $stepConfig
                ]);

                if (!$stepCreated) {
                    error_log("RequestWorkflowAdapter: Failed to create workflow step");
                    return null;
                }

                // Create approver mapping (role-based by default)
                if (!empty($stepConfig['role'])) {
                    $roleModel = new \App\Core\Auth\Models\Role();
                    $role = $roleModel->where('slug', $stepConfig['role'])->first();

                    if ($role) {
                        (new \App\Core\Workflow\Models\WorkflowApprover())->create([
                            'id' => \wp_generate_uuid4(),
                            'step_id' => $stepId,
                            'approver_type' => 'role',
                            'approver_id' => $role->id,
                            'is_required' => true,
                            'approval_order' => $stepOrder
                        ]);
                    }
                }

                // Create transition from previous step to this step
                if ($previousStepId) {
                    (new \App\Core\Workflow\Models\WorkflowTransition())->create([
                        'id' => \wp_generate_uuid4(),
                        'workflow_id' => $workflowId,
                        'from_step_id' => $previousStepId,
                        'to_step_id' => $stepId,
                        'name' => 'Approve',
                        'description' => 'Approve and move to next step',
                        'action' => 'approve'
                    ]);
                }

                $stepOrder++;
                $previousStepId = $stepId;
            }

            // Mark last step as final
            $lastStep = new WorkflowStep();
            $lastStep->where('workflow_id', $workflowId)
                ->orderBy('order', 'desc')
                ->first();

            if ($lastStep) {
                $lastStep->update($lastStep->id, ['is_final' => true]);
            }

            error_log("RequestWorkflowAdapter: Created workflow $workflowId for request type " . $requestType->name);
            return $workflowId;
        } catch (\Exception $e) {
            error_log("RequestWorkflowAdapter: Error creating workflow from approval flow: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get workflow status for a request
     *
     * @param string $requestId Request ID
     * @return array Workflow status information
     */
    public static function getWorkflowStatus($requestId)
    {
        try {
            // Get request instance
            $requestInstance = new RequestInstance();
            $request = $requestInstance->find($requestId);

            if (!$request || !$request->workflow_instance_id) {
                return [
                    'success' => false,
                    'error' => 'No workflow found for request'
                ];
            }

            // Get workflow instance
            $workflowInstance = new WorkflowInstance();
            $workflow = $workflowInstance->find($request->workflow_instance_id);

            if (!$workflow) {
                return [
                    'success' => false,
                    'error' => 'Workflow instance not found'
                ];
            }

            return [
                'success' => true,
                'workflow_id' => $workflow->id,
                'status' => $workflow->status,
                'current_step' => $request->current_approval_step,
                'history' => $workflow->getHistory()
            ];
        } catch (\Exception $e) {
            error_log("RequestWorkflowAdapter: Error getting workflow status for request $requestId: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to get workflow status'
            ];
        }
    }

    /**
     * Process workflow action (approve, reject, etc.)
     *
     * @param string $requestId Request ID
     * @param string $action Action to perform (approve, reject, etc.)
     * @param int $userId User performing the action
     * @param string $comment Optional comment
     * @return array Result of the action
     */
    public static function processWorkflowAction($requestId, $action, $userId, $comment = '')
    {
        try {
            // Get request instance
            $requestInstance = new RequestInstance();
            $request = $requestInstance->find($requestId);

            if (!$request || !$request->workflow_instance_id) {
                return [
                    'success' => false,
                    'error' => 'No workflow found for request'
                ];
            }

            // Get workflow instance
            $workflowInstance = new WorkflowInstance();
            $workflow = $workflowInstance->find($request->workflow_instance_id);

            if (!$workflow) {
                return [
                    'success' => false,
                    'error' => 'Workflow instance not found'
                ];
            }

            // Process the action
            switch ($action) {
                case 'reject':
                    $result = $workflow->cancel($userId, $comment);
                    $requestInstance->update($requestId, ['status' => 'rejected']);
                    self::sendWorkflowNotifications($workflow, $request, 'reject', $userId, $comment);
                    break;
                default:
                    // Treat any non-reject action as an approval step advancement
                    $workflow->moveToNextStep($userId, $comment);
                    $workflow = (new WorkflowInstance())->find($workflow->id);
                    $workflow = self::autoAdvanceIfNoApprover($workflow, $request, $userId);
                    if (!$workflow->isCompleted()) {
                        self::sendWorkflowNotifications($workflow, $request, 'approve', $userId, $comment);
                    }
                    break;
            }

            // Update request status based on workflow status
            if ($workflow->isCompleted()) {
                $newStatus = $workflow->status === 'completed' ? 'approved' : 'rejected';
                $requestInstance->update($requestId, ['status' => $newStatus]);

                // If this was the final approval that completed the workflow
                if ($action === 'approve' && $newStatus === 'approved') {
                    self::sendWorkflowNotifications($workflow, $request, 'complete', $userId);
                }
            }

            return [
                'success' => true,
                'action' => $action,
                'new_status' => $request->status,
                'workflow_status' => $workflow->status
            ];
        } catch (\Exception $e) {
            error_log("RequestWorkflowAdapter: Error processing workflow action for request $requestId: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to process workflow action'
            ];
        }
    }

    /**
     * Send workflow notifications
     */
    private static function sendWorkflowNotifications($workflow, $request, $type, $actorId, $comment = '')
    {
        try {
            // Ensure NotificationService is available
            if (!class_exists('\App\Core\Notification\Services\NotificationService')) {
                error_log('NotificationService not found, skipping notifications');
                return;
            }

            $requesterId = $request->created_by;
            if (is_array($requesterId) && isset($requesterId['id'])) {
                $requesterId = $requesterId['id'];
            } elseif (is_object($requesterId) && isset($requesterId->id)) {
                $requesterId = $requesterId->id;
            }
            $requestNumber = self::formatRequestNumber($request);

            $payload = [
                'type' => 'info',
                'link' => '/requests/view/' . $request->id,
                'data' => [
                    'request_id' => $request->id,
                    'request_number' => $requestNumber,
                    'actor_id' => $actorId
                ]
            ];

            if ($type === 'reject') {
                // Notify requester of rejection
                $payload['user_id'] = $requesterId;
                $payload['title'] = "Request Rejected: $requestNumber";
                $payload['message'] = "Your request $requestNumber has been rejected. Reason: $comment";
                $payload['type'] = 'error';

                \App\Core\Notification\Services\NotificationService::sendNotification($payload);
            } elseif ($type === 'complete') {
                // Notify requester of approval/completion
                $payload['user_id'] = $requesterId;
                $payload['title'] = "Request Approved: $requestNumber";
                $payload['message'] = "Your request $requestNumber has been fully approved.";
                $payload['type'] = 'success';

                \App\Core\Notification\Services\NotificationService::sendNotification($payload);
            } elseif ($type === 'approve') {
                // Determine if we should notify next approvers
                if (!$workflow->isCompleted()) {
                    $approverIds = self::getCurrentApproverIds($workflow, $request, $actorId);

                    if (!empty($approverIds)) {
                        $payload['user_id'] = $approverIds;
                        $payload['title'] = "Approval Required: $requestNumber";
                        $payload['message'] = "A request $requestNumber requires your approval.";
                        $payload['type'] = 'action';

                        \App\Core\Notification\Services\NotificationService::sendNotification($payload);
                    }
                }
            }
        } catch (\Exception $e) {
            error_log("RequestWorkflowAdapter: Error sending notifications: " . $e->getMessage());
        }
    }

    /**
     * Format request number using the request's actual type.
     *
     * @param object $request
     * @return string
     */
    private static function formatRequestNumber($request)
    {
        $requestId = $request->id ?? null;
        $requestTypeId = $request->request_type_id ?? null;

        if ($requestTypeId) {
            $typeModel = new \App\Core\Requests\Models\RequestType();
            $type = $typeModel->find($requestTypeId);
            if ($type && method_exists($type, 'formatRequestNumber')) {
                return $type->formatRequestNumber($requestId ?: ($request->request_number ?? $requestId));
            }
        }

        if (isset($request->request_type) && is_object($request->request_type) && isset($request->request_type->code_prefix)) {
            $year = date('Y');
            $month = date('m');
            return $request->request_type->code_prefix . '/' . $month . '/' . $year . '/' . ($requestId ?: ($request->request_number ?? $requestId));
        }

        return $request->formatted_number ?? $request->request_number ?? $requestId;
    }

    /**
     * Resolve approver IDs for the current step, with request-aware logic.
     *
     * @param WorkflowInstance $workflow
     * @param object $request
     * @param int|null $excludeUserId
     * @return array
     */
    public static function getCurrentApproverIds($workflow, $request, $excludeUserId = null)
    {
        $step = $workflow->getCurrentStep();
        if (!$step) {
            return [];
        }

        $config = $step->config ?? [];
        $role = is_array($config) ? ($config['role'] ?? null) : null;

        if ($role === 'team_lead') {
            $teamId = $request->team_id ?? null;
            if (!$teamId) {
                return [];
            }

            $leadIds = self::getTeamLeadIds($teamId);
            $requesterId = self::normalizeRequesterId($request);
            if ($requesterId && in_array((string) $requesterId, array_map('strval', $leadIds), true)) {
                return [];
            }

            return self::filterApproverIds($leadIds, $excludeUserId);
        }

        $approvers = $workflow->getCurrentApprovers();
        $approverIds = [];
        foreach ($approvers as $approver) {
            if (is_object($approver) && isset($approver->ID)) {
                $approverIds[] = $approver->ID;
            } elseif (is_object($approver) && isset($approver->id)) {
                $approverIds[] = $approver->id;
            } elseif (is_numeric($approver)) {
                $approverIds[] = $approver;
            }
        }

        return self::filterApproverIds($approverIds, $excludeUserId);
    }

    /**
     * Auto-advance workflow when current step has no approvers (e.g., no team lead).
     *
     * @param WorkflowInstance $workflow
     * @param object $request
     * @param int|null $actorId
     * @return WorkflowInstance
     */
    private static function autoAdvanceIfNoApprover($workflow, $request, $actorId = null)
    {
        $maxSteps = 10;
        $iterations = 0;

        while ($iterations < $maxSteps && !$workflow->isCompleted()) {
            $step = $workflow->getCurrentStep();
            if (!$step) {
                break;
            }

            $approverIds = self::getCurrentApproverIds($workflow, $request);
            if (!empty($approverIds)) {
                break;
            }

            $comment = 'Auto-skipped: no approvers available';
            $config = $step->config ?? [];
            $role = is_array($config) ? ($config['role'] ?? null) : null;
            if ($role === 'team_lead') {
                $teamId = $request->team_id ?? null;
                if (!$teamId) {
                    $comment = 'Auto-skipped: no team on request';
                } else {
                    $comment = 'Auto-skipped: no team lead or requester is team lead';
                }
            }

            $workflow->moveToNextStep($actorId ?: 0, $comment, ['auto_skip' => true]);
            $workflow = (new WorkflowInstance())->find($workflow->id);
            $iterations++;
        }

        return $workflow;
    }

    /**
     * Get team lead profile IDs for a team.
     *
     * @param int|string $teamId
     * @return array
     */
    private static function getTeamLeadIds($teamId)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_group_users';
        $roles = ['admin', 'moderator'];
        $placeholders = implode(',', array_fill(0, count($roles), '%s'));

        $sql = $wpdb->prepare(
            "SELECT user_id FROM {$table} WHERE group_id = %d AND role IN ($placeholders)",
            array_merge([(int) $teamId], $roles)
        );

        $rows = $wpdb->get_col($sql);
        return array_values(array_filter(array_map('intval', $rows)));
    }

    /**
     * Normalize requester ID from request payload.
     *
     * @param object $request
     * @return int|null
     */
    private static function normalizeRequesterId($request)
    {
        $requesterId = $request->created_by ?? null;
        if (is_array($requesterId) && isset($requesterId['id'])) {
            return (int) $requesterId['id'];
        }
        if (is_object($requesterId) && isset($requesterId->id)) {
            return (int) $requesterId->id;
        }
        if (is_numeric($requesterId)) {
            return (int) $requesterId;
        }
        return null;
    }

    /**
     * De-duplicate and optionally exclude the actor.
     *
     * @param array $ids
     * @param int|null $excludeUserId
     * @return array
     */
    private static function filterApproverIds($ids, $excludeUserId = null)
    {
        $ids = array_values(array_unique(array_filter($ids, function ($id) {
            return $id !== null && $id !== '';
        })));

        if ($excludeUserId) {
            $ids = array_values(array_filter($ids, function ($id) use ($excludeUserId) {
                return (string) $id !== (string) $excludeUserId;
            }));
        }

        return $ids;
    }
}
