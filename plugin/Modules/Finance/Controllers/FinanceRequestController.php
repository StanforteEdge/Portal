<?php

namespace App\Modules\Finance\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Utils\BaseController;
use App\Modules\Finance\Services\FinanceRequestService;

/**
 * FinanceRequestController
 *
 * Handles Finance-specific request logic while using the Core request system.
 */
class FinanceRequestController extends BaseController
{
    protected $financeService;

    public function __construct()
    {
        $this->financeService = new FinanceRequestService();
    }

    /**
     * Get Finance request types
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getTypes(WP_REST_Request $request)
    {
        try {
            $activeTypes = $this->financeService->getFinanceRequestTypes();
            $result = array_map(function ($type) {
                // Ensure $type is an array if the service returns arrays, or object if it returns objects
                $t = (object) $type;
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'code_prefix' => $t->code_prefix,
                    'description' => $t->description,
                    'form_id' => $t->form_id ?? null,
                    'form_schema' => $t->form_schema,
                    'approval_flow_json' => $t->approval_flow_json ?? null,
                    'approval_limit' => $t->approval_limit,
                    'is_active' => (bool) $t->is_active
                ];
            }, $activeTypes);

            return self::success(array_values($result), 200);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error getting types: ' . $e->getMessage());
            return self::error('finance_types_error', 'Failed to retrieve finance request types', 500);
        }
    }

    /**
     * Create a Finance Request Type
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function createType(WP_REST_Request $request)
    {
        try {
            // Permission check usually handled by middleware, but good to be safe
            // $user = $request->get_param('__auth_user');

            $data = $request->get_params();
            $result = $this->financeService->createRequestType($data);

            return self::success($result, 201);
        } catch (\Exception $e) {
            return self::error('creation_error', $e->getMessage(), 400);
        }
    }

    /**
     * Update a Finance Request Type
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function updateType(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_params(); // Body params

            // Remove 'id' from data if present to avoid overwrite issues
            unset($data['id']);

            $result = $this->financeService->updateRequestType($id, $data);

            return self::success($result, 200);
        } catch (\Exception $e) {
            return self::error('update_error', $e->getMessage(), 400);
        }
    }

    /**
     * Delete a Finance Request Type
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function deleteType(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $this->financeService->deleteRequestType($id);

            return self::success(['message' => 'Request type deleted'], 200);
        } catch (\Exception $e) {
            return self::error('delete_error', $e->getMessage(), 400);
        }
    }

    /**
     * Get finance approvals for the current user (pending/approved/rejected)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getApprovals(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return self::error('unauthorized', 'User not authenticated', 401);
            }

            $status = strtolower((string) ($request->get_param('status') ?: 'pending'));
            $page = (int) ($request->get_param('page') ?: 1);
            $perPage = (int) ($request->get_param('per_page') ?: 20);
            $dateFrom = $request->get_param('date_from');
            $dateTo = $request->get_param('date_to');
            $amountMin = $request->get_param('amount_min');
            $amountMax = $request->get_param('amount_max');
            $staffId = $request->get_param('staff_id');
            $teamId = $request->get_param('team_id');
            $organizationId = $request->get_param('organization_id');
            $orderBy = $request->get_param('order_by') ?: 'created_at';
            $orderDir = strtolower((string) ($request->get_param('order_dir') ?: 'desc'));
            $requestId = $request->get_param('request_id');

            $financeTypes = $this->financeService->getFinanceRequestTypes();
            $financeTypeIds = array_values(array_filter(array_map(function ($t) {
                return is_array($t) ? ($t['id'] ?? null) : ($t->id ?? null);
            }, $financeTypes)));

            if (empty($financeTypeIds)) {
                return self::success([
                    'requests' => [],
                    'pagination' => ['total' => 0, 'per_page' => $perPage, 'current_page' => $page]
                ], 200);
            }

            if ($status === 'pending') {
                $filters = [
                    'status' => $status,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'amount_min' => $amountMin,
                    'amount_max' => $amountMax,
                    'staff_id' => $staffId,
                    'team_id' => $teamId,
                    'organization_id' => $organizationId,
                    'order_by' => $orderBy,
                    'order_dir' => $orderDir,
                    'request_type_ids' => $financeTypeIds,
                    'request_id' => $requestId
                ];
                $result = \App\Core\Requests\Services\RequestService::getPendingApprovals($user, $page, $perPage, $filters);
                $requests = array_values(array_filter($result['requests'] ?? [], function ($req) use ($financeTypeIds) {
                    $typeId = is_array($req['request_type'] ?? null) ? ($req['request_type']['id'] ?? null) : ($req['request_type']->id ?? null);
                    $typeId = $typeId ?: ($req['request_type_id'] ?? null);
                    return $typeId && in_array($typeId, $financeTypeIds, true);
                }));

                return self::success([
                    'requests' => $requests,
                    'pagination' => $result['pagination'] ?? [
                        'total' => count($requests),
                        'per_page' => $perPage,
                        'current_page' => $page
                    ],
                    'filters' => $filters
                ], 200);
            }

            global $wpdb;
            $requestsTable = $wpdb->prefix . 'sta_request_instances';
            $instancesTable = $wpdb->prefix . 'sta_workflow_instances';
            $historyTable = $wpdb->prefix . 'sta_workflow_history';

            $profileId = $user->profile_id ?? $user->user_id ?? null;
            if (!$profileId) {
                return self::error('invalid_user', 'User profile not found', 400);
            }

            $statusFilter = $status === 'all' ? [] : [$status];
            $statusPlaceholders = $statusFilter ? implode(',', array_fill(0, count($statusFilter), '%s')) : '';
            $typePlaceholders = implode(',', array_fill(0, count($financeTypeIds), '%s'));

            $whereParts = [
                'wh.performed_by = %d',
                "ri.request_type_id IN ($typePlaceholders)"
            ];
            $params = array_merge([$profileId], $financeTypeIds);

            if ($statusFilter) {
                $whereParts[] = "ri.status IN ($statusPlaceholders)";
                $params = array_merge($params, $statusFilter);
            }

            if (!empty($staffId)) {
                $whereParts[] = 'ri.created_by = %d';
                $params[] = (int) $staffId;
            }
            if (!empty($requestId)) {
                $whereParts[] = 'ri.id = %d';
                $params[] = (int) $requestId;
            }
            if (!empty($teamId)) {
                $whereParts[] = 'ri.team_id = %d';
                $params[] = (int) $teamId;
            }
            if (!empty($organizationId)) {
                $whereParts[] = 'ri.organization_id = %d';
                $params[] = (int) $organizationId;
            }
            if (!empty($amountMin)) {
                $whereParts[] = 'ri.total_amount >= %f';
                $params[] = (float) $amountMin;
            }
            if (!empty($amountMax)) {
                $whereParts[] = 'ri.total_amount <= %f';
                $params[] = (float) $amountMax;
            }
            if (!empty($dateFrom)) {
                $whereParts[] = 'ri.created_at >= %s';
                $params[] = $dateFrom;
            }
            if (!empty($dateTo)) {
                $whereParts[] = 'ri.created_at <= %s';
                $params[] = $dateTo . ' 23:59:59';
            }

            $allowedOrderBy = ['created_at', 'total_amount', 'id'];
            if (!in_array($orderBy, $allowedOrderBy, true)) {
                $orderBy = 'created_at';
            }
            $orderDir = $orderDir === 'asc' ? 'ASC' : 'DESC';

            $whereSql = implode(' AND ', $whereParts);

            $countSql = "
                SELECT COUNT(DISTINCT ri.id)
                FROM {$requestsTable} ri
                INNER JOIN {$instancesTable} wi ON wi.entity_id = ri.id
                INNER JOIN {$historyTable} wh ON wh.instance_id = wi.id
                WHERE {$whereSql}
            ";

            $total = (int) $wpdb->get_var($wpdb->prepare($countSql, $params));

            $sql = "
                SELECT DISTINCT ri.id
                FROM {$requestsTable} ri
                INNER JOIN {$instancesTable} wi ON wi.entity_id = ri.id
                INNER JOIN {$historyTable} wh ON wh.instance_id = wi.id
                WHERE {$whereSql}
                ORDER BY ri.{$orderBy} {$orderDir}
                LIMIT %d OFFSET %d
            ";

            $queryParams = array_merge($params, [$perPage, ($page - 1) * $perPage]);
            $requestIds = $wpdb->get_col($wpdb->prepare($sql, $queryParams)) ?: [];

            $requests = [];
            foreach ($requestIds as $requestId) {
                $result = \App\Core\Requests\Services\RequestService::getRequest($requestId, $user);
                if ($result['success']) {
                    $requests[] = $result['data'];
                }
            }

            return self::success([
                'requests' => $requests,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page
                ],
                'filters' => [
                    'status' => $status,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'amount_min' => $amountMin,
                    'amount_max' => $amountMax,
                    'staff_id' => $staffId,
                    'team_id' => $teamId,
                    'organization_id' => $organizationId,
                    'order_by' => $orderBy,
                    'order_dir' => strtolower($orderDir),
                    'request_id' => $requestId
                ]
            ], 200);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error getting approvals: ' . $e->getMessage());
            return self::error('approvals_error', 'Failed to retrieve approvals', 500);
        }
    }

    /**
     * Get Lookup Data for Finance Requests
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getLookupData(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return self::error('authentication_required', 'Authentication required', 401);
            }

            $result = $this->financeService->getFinanceLookupData($user);

            return self::success([$result], 200);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error getting lookup data: ' . $e->getMessage());
            return self::error('lookup_data_error', 'Failed to retrieve lookup data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new Finance request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function create(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('__auth_user');
            if (!$user) {
                return self::error('authentication_required', 'Authentication required', 401);
            }

            // Prepare data for service
            $data = $request->get_params(); // get all params (body + query)

            // Prefer organization_id from request if provided, otherwise fallback to user's primary org
            if (empty($data['organization_id'])) {
                $data['organization_id'] = $user->primary_organization_id ?? null;
            }

            $result = $this->financeService->createFinanceRequest($user->profile_id, $data);

            if (!$result['success']) {
                return self::error($result['error'], $result['message'], 400);
            }

            return self::success([
                'request' => [
                    'id' => $result['request']->id,
                    'request_number' => $result['request']->request_number ?: $result['request']->id,
                    'status' => $result['request']->status,
                    'created_at' => $result['request']->created_at
                ]
            ], 201);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error creating request: ' . $e->getMessage());
            // Handle validation errors specifically if needed, or generic 500
            if ($e->getMessage() === 'Invalid request type' || $e->getMessage() === 'The selected request type is not a Finance request') {
                return self::error('validation_error', $e->getMessage(), 400);
            }
            return self::error('creation_error', 'Failed to create finance request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update request status (submit draft to pending)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function updateStatus(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');
            $status = $request->get_param('status');
            $user = $request->get_param('__auth_user');

            if (!$user) {
                return self::error('authentication_required', 'Authentication required', 401);
            }

            if (!in_array($status, ['pending', 'draft'])) {
                return self::error('invalid_status', 'Invalid status. Only pending and draft are allowed.', 400);
            }

            // Get request
            $result = \App\Core\Requests\Services\RequestService::getRequest($requestId, $user);

            if (!$result['success']) {
                return self::error('not_found', 'Request not found', 404);
            }

            $requestData = $result['data'];

            // Only allow draft -> pending transition
            if ($requestData['status'] !== 'draft' && $status === 'pending') {
                return self::error('invalid_transition', 'Only draft requests can be submitted', 400);
            }

            // Submit to workflow when moving to pending
            if ($status === 'pending') {
                $submit = \App\Core\Requests\Services\RequestService::submitRequest($requestId, $user->profile_id);
                if (!$submit['success']) {
                    return self::error($submit['error'], $submit['message'], 400);
                }

                return self::success([
                    'message' => $submit['message'],
                    'workflow_id' => $submit['workflow_id']
                ], 200);
            }

            // Otherwise save as draft
            $model = new \App\Core\Requests\Models\RequestInstance();
            $requestModel = $model->find($requestId);

            if (!$requestModel) {
                return self::error('not_found', 'Request not found', 404);
            }

            $requestModel->status = $status;
            $requestModel->save();

            return self::success([
                'message' => 'Request saved as draft',
                'request' => $requestModel
            ], 200);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error updating status: ' . $e->getMessage());
            return self::error('update_error', 'Failed to update request status', 500);
        }
    }

    /**
     * Get Finance requests with filtering
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function index(WP_REST_Request $request)
    {
        try {
            $filters = $request->get_params();
            $page = $request->get_param('page') ?? 1;
            $perPage = $request->get_param('per_page') ?? 20;
            $user = $request->get_param('__auth_user');

            // Force finance group filter
            $filters['group'] = 'finance';

            // Add advanced filters
            if ($request->get_param('request_type_id')) {
                $filters['request_type_id'] = $request->get_param('request_type_id');
            }
            if ($request->get_param('department_id')) {
                $filters['team_id'] = $request->get_param('department_id');
            }
            if ($request->get_param('project_id')) {
                // Filter by project in data JSON field
                $filters['project_id'] = $request->get_param('project_id');
            }

            $result = $this->financeService->getFinanceRequests($filters, $user, $page, $perPage);

            return self::success($result['data'], 200, $result['pagination']);
        } catch (\Exception $e) {
            error_log('FinanceRequestController: Error getting requests: ' . $e->getMessage());
            return self::error('requests_error', 'Failed to retrieve finance requests', 500);
        }
    }

    /**
     * Get specific request details
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public  function getRequest(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');
            $user = $request->get_param('__auth_user');

            $result = $this->financeService->getFinanceRequest($requestId, $user);

            if (!$result['success']) {
                $status = ($result['error'] === 'request_not_found') ? 404 : 403;
                return static::error($result['error'], $result['message'], $status);
            }

            return static::success($result['data'], 200);
        } catch (\Exception $e) {
            error_log('RequestController: Error getting request: ' . $e->getMessage());
            return static::error('request_error', 'Failed to retrieve request', 500);
        }
    }
}
