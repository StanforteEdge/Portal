<?php

namespace App\Core\Requests\Services;

use App\Core\Requests\Models\RequestGroup;
use App\Core\Requests\Models\RequestType;
use App\Core\Requests\Models\RequestInstance;
use App\Core\Requests\Models\RequestItem;
use App\Core\Forms\Models\Form;
use App\Core\Auth\Models\Permission;

/**
 * RequestService
 *
 * Main service for handling request operations, validation, and lifecycle management
 */
class RequestService
{
    /**
     * Create a new request (Dispatcher)
     *
     * @param array $requestData Request data
     * @param int $userId User creating the request
     * @param string $organizationId Organization ID
     * @param array $items Request items (optional)
     * @return array Result with success/error and request data
     */
    public static function createRequest($requestData, $userId, $organizationId, $items = [])
    {
        try {
            // 1. Validate request type
            $requestType = new RequestType();
            $typeData = $requestType->find($requestData['request_type_id'] ?? null);

            if (!$typeData || !$typeData->is_active) {
                return [
                    'success' => false,
                    'error' => 'invalid_request_type',
                    'message' => 'Invalid or inactive request type'
                ];
            }

            // 2. Dispatch to Persistence Strategy
            $request = null;
            $storageType = $typeData->storage_type ?? 'form';

            switch ($storageType) {
                case 'special':
                    // Handle special systems (e.g., Finance)
                    $request = self::handleSpecialPersistence($typeData, $requestData, $userId, $organizationId, $items);
                    break;

                case 'form':
                    // Handle Form-based persistence (EAV or Custom Table)
                    $request = self::handleFormPersistence($typeData, $requestData, $userId, $organizationId, $items);
                    break;

                case 'bypass':
                    // Handle pure module logic bypass
                    $request = self::handleBypassPersistence($typeData, $requestData, $userId, $organizationId, $items);
                    break;

                default:
                    return [
                        'success' => false,
                        'error' => 'unsupported_storage',
                        'message' => "Storage type '{$storageType}' is not supported"
                    ];
            }

            if (!$request || (isset($request['success']) && !$request['success'])) {
                return $request ?: [
                    'success' => false,
                    'error' => 'persistence_failed',
                    'message' => 'Failed to persist request data'
                ];
            }

            // The handler might return the request object directly or a result array
            $requestInstance = is_array($request) && isset($request['request']) ? $request['request'] : $request;

            // 3. COMMON POST-PROCESSING (Shared across all types)
            // Initialize workflow, send notifications, etc.
            // self::initializeWorkflow($requestInstance);
            // self::notifySubscribers($requestInstance);

            return [
                'success' => true,
                'request' => $requestInstance,
                'formatted_number' => method_exists($requestInstance, 'getFormattedRequestNumber')
                    ? $requestInstance->getFormattedRequestNumber()
                    : ($requestInstance->id ?? null)
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error creating request: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'creation_error',
                'message' => 'Failed to create request: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle persistence for special systems (Finance, etc.)
     */
    private static function handleSpecialPersistence($typeData, $requestData, $userId, $organizationId, $items)
    {
        // Resolve module handler (e.g. FinanceRequestService)
        // For now, we hardcode Finance if the group is finance
        $group = (new RequestGroup())->find($typeData->group_id);

        if ($group && $group->code === 'finance') {
            $financeService = new \App\Modules\Finance\Services\FinanceRequestService();
            $data = array_merge($requestData, ['organization_id' => $organizationId, 'items' => $items]);
            return $financeService->createFinanceRequest($userId, $data);
        }

        // Add other special modules here
        return [
            'success' => false,
            'message' => "Special handler for group '{$group->code}' not implemented"
        ];
    }

    /**
     * Handle Form-based persistence (EAV or Custom Table)
     */
    private static function handleFormPersistence($typeData, $requestData, $userId, $organizationId, $items)
    {
        // 1. Create the "Master" record in the module-specific table to get the incremental ID
        $group = (new RequestGroup())->find($typeData->group_id);
        $model = self::getModuleRequestModel($group->code);

        $requestInstance = $model->create([
            'request_type_id' => $typeData->id,
            'group_id' => $typeData->group_id,
            'organization_id' => $organizationId,
            'created_by' => $userId,
            'team_id' => $requestData['team_id'] ?? null,
            'status' => 'draft',
            'data' => json_encode($requestData['data'] ?? []),
            'total_amount' => $requestData['total_amount'] ?? 0,
            'currency' => $requestData['currency'] ?? 'NGN'
        ]);

        if (!$requestInstance) {
            throw new \Exception("Failed to create master request record");
        }

        // 2. Handle specific storage (Custom Table or EAV)
        if (!empty($typeData->form_id)) {
            $form = (new Form())->find($typeData->form_id);
            if ($form) {
                if ($form->storage_type === 'custom') {
                    self::saveToCustomTable($form, $requestData, $userId, $organizationId, $requestInstance->id);
                } else {
                    self::saveToFormTables($form, $requestData, $userId, $organizationId, $requestInstance->id);
                }
            }
        }

        // 3. Create items if any
        if (!empty($items)) {
            self::createRequestItems($requestInstance->id, $items);
        }

        return $requestInstance;
    }

    /**
     * Get the correct model for a module group
     */
    public static function getModuleRequestModel($groupCode)
    {
        switch ($groupCode) {
            case 'finance':
                return new \App\Modules\Finance\Models\FinanceRequest();
            case 'hr':
                return new \App\Modules\HR\Models\HRRequest();
            case 'admin':
                return new \App\Modules\Admin\Models\AdminRequest();
            default:
                return new RequestInstance();
        }
    }

    /**
     * Standard Request creation (Backwards compatibility / Generic)
     */
    private static function createStandardRequest($typeData, $requestData, $userId, $organizationId, $items)
    {
        // (Move the old creation logic here)
        $totalAmount = $requestData['total_amount'] ?? 0;
        if (empty($totalAmount) && !empty($items)) {
            $totalAmount = self::calculateTotalAmount($items);
        }

        $requestInstanceModel = new RequestInstance();
        $requestInstance = $requestInstanceModel->create([
            'uuid' => \wp_generate_uuid4(),
            'request_type_id' => $typeData->id,
            'group_id' => $typeData->group_id,
            'organization_id' => $organizationId,
            'created_by' => $userId,
            'team_id' => $requestData['team_id'] ?? null,
            'status' => 'draft',
            'data' => json_encode($requestData['data'] ?? []),
            'total_amount' => $totalAmount,
            'currency' => $requestData['currency'] ?? 'NGN'
        ]);

        if ($requestInstance && !empty($items)) {
            self::createRequestItems($requestInstance->id, $items);
        }

        return $requestInstance;
    }

    /**
     * Save to module-specific or form-defined custom table
     */
    private static function saveToCustomTable($form, $requestData, $userId, $organizationId, $requestId)
    {
        global $wpdb;
        $table = $wpdb->prefix . $form->target_table;
        $mapping = $form->column_mapping; // e.g. ["form_field" => "db_column"]

        $insertData = [
            'uuid' => \wp_generate_uuid4(),
            'request_id' => $requestId,
            'organization_id' => $organizationId,
            'created_by' => $userId,
            'created_at' => current_time('mysql')
        ];

        $formData = $requestData['data'] ?? [];
        if (is_array($mapping)) {
            foreach ($mapping as $formKey => $dbColumn) {
                if (isset($formData[$formKey])) {
                    $insertData[$dbColumn] = $formData[$formKey];
                }
            }
        }

        $wpdb->insert($table, $insertData);
        $insertId = $wpdb->insert_id;

        // Return a representation or the actual record
        return ['success' => true, 'id' => $insertId, 'target_table' => $table];
    }

    /**
     * Save to standard form EAV tables
     */
    private static function saveToFormTables($form, $requestData, $userId, $organizationId, $requestId)
    {
        $formService = new \App\Core\Forms\Services\FormService();
        $data = $requestData['data'] ?? [];
        // Link to master request
        $data['request_id'] = $requestId;

        $submissionId = $formService->submitForm($form->id, $data, $userId);

        return ['success' => true, 'id' => $submissionId, 'type' => 'form_submission'];
    }

    /**
     * Handle bypass strategy
     */
    private static function handleBypassPersistence($typeData, $requestData, $userId, $organizationId, $items)
    {
        // Implementation for pure module bypass
        return ['success' => true, 'message' => 'Bypassed core processing'];
    }

    /**
     * Submit a request for approval
     *
     * @param string $requestId Request ID
     * @param int $userId User submitting the request
     * @return array Result with success/error
     */
    public static function submitRequest($requestId, $userId)
    {
        try {
            // Get request instance
            $requestInstance = new RequestInstance();
            $request = $requestInstance->find($requestId);

            if (!$request) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            // Check ownership
            if ($request->created_by != $userId) {
                return [
                    'success' => false,
                    'error' => 'access_denied',
                    'message' => 'Only request creator can submit'
                ];
            }

            // Check if request is in draft status
            if (!$request->isDraft()) {
                return [
                    'success' => false,
                    'error' => 'invalid_status',
                    'message' => 'Only draft requests can be submitted'
                ];
            }

            // Create approval workflow
            $workflowResult = RequestWorkflowAdapter::createApprovalWorkflow($requestId, $request->request_type_id);

            if (!$workflowResult) {
                return [
                    'success' => false,
                    'error' => 'workflow_creation_failed',
                    'message' => 'Failed to create approval workflow'
                ];
            }

            return [
                'success' => true,
                'message' => 'Request submitted for approval',
                'workflow_id' => $workflowResult
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error submitting request: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'submission_error',
                'message' => 'Failed to submit request'
            ];
        }
    }

    /**
     * Validate request data against JSON schema
     *
     * @param array $data Request data
     * @param string $schemaJson JSON schema
     * @return array Validation result
     */
    private static function validateRequestData($data, $schemaJson)
    {
        try {
            $schema = json_decode($schemaJson, true);

            if (!$schema) {
                return [
                    'valid' => false,
                    'errors' => ['Invalid JSON schema']
                ];
            }

            // Basic validation - check required fields
            $errors = [];

            if (isset($schema['required'])) {
                foreach ($schema['required'] as $requiredField) {
                    if (!isset($data[$requiredField]) || empty($data[$requiredField])) {
                        $errors[] = "Required field '{$requiredField}' is missing or empty";
                    }
                }
            }

            // Type validation
            if (isset($schema['properties'])) {
                foreach ($schema['properties'] as $field => $fieldSchema) {
                    if (isset($data[$field])) {
                        $fieldErrors = self::validateField($data[$field], $fieldSchema);
                        $errors = array_merge($errors, $fieldErrors);
                    }
                }
            }

            return [
                'valid' => empty($errors),
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'errors' => ['Schema validation error: ' . $e->getMessage()]
            ];
        }
    }

    /**
     * Validate individual field against schema
     *
     * @param mixed $value Field value
     * @param array $schema Field schema
     * @return array Validation errors
     */
    private static function validateField($value, $schema)
    {
        $errors = [];

        // Type validation
        if (isset($schema['type'])) {
            $expectedType = $schema['type'];
            $actualType = gettype($value);

            if ($expectedType === 'number' && !is_numeric($value)) {
                $errors[] = "Expected number, got {$actualType}";
            } elseif ($expectedType === 'string' && !is_string($value)) {
                $errors[] = "Expected string, got {$actualType}";
            } elseif ($expectedType === 'boolean' && !is_bool($value)) {
                $errors[] = "Expected boolean, got {$actualType}";
            }
        }

        // String length validation
        if (isset($schema['minLength']) && is_string($value) && strlen($value) < $schema['minLength']) {
            $errors[] = "String too short, minimum {$schema['minLength']} characters";
        }

        if (isset($schema['maxLength']) && is_string($value) && strlen($value) > $schema['maxLength']) {
            $errors[] = "String too long, maximum {$schema['maxLength']} characters";
        }

        // Number range validation
        if (isset($schema['minimum']) && is_numeric($value) && $value < $schema['minimum']) {
            $errors[] = "Number too small, minimum {$schema['minimum']}";
        }

        if (isset($schema['maximum']) && is_numeric($value) && $value > $schema['maximum']) {
            $errors[] = "Number too large, maximum {$schema['maximum']}";
        }

        return $errors;
    }

    /**
     * Create request items
     *
     * @param string $requestUuid Request UUID
     * @param array $items Items data
     * @return array Result with success/error
     */
    private static function createRequestItems($requestId, $items)
    {
        try {
            $createdItems = [];
            $requestItemModel = new RequestItem();

            foreach ($items as $index => $itemData) {
                $itemId = $requestItemModel->create([
                    'id' => \wp_generate_uuid4(),
                    'request_id' => $requestId,
                    'category_id' => $itemData['category_id'] ?? null,
                    'subcategory_id' => $itemData['subcategory_id'] ?? null,
                    'item_description' => $itemData['item'] ?? $itemData['description'] ?? '',
                    'unit_price' => $itemData['unit_price'] ?? 0,
                    'total_price' => $itemData['amount'] ?? 0,
                    'quantity' => $itemData['quantity'] ?? 1,
                    'due_date' => $itemData['due_date'] ?? null,
                    'notes' => $itemData['note'] ?? $itemData['notes'] ?? null,
                    'sort_order' => $index
                ]);

                if (!$itemId) {
                    return [
                        'success' => false,
                        'error' => 'item_creation_failed',
                        'message' => 'Failed to create request item'
                    ];
                }
                $createdItems[] = $requestItemModel->find($itemId);
            }

            return ['success' => true, 'items' => $createdItems];
        } catch (\Exception $e) {
            error_log('RequestService: Error creating request items: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'items_creation_error',
                'message' => 'Failed to create request items'
            ];
        }
    }

    /**
     * Calculate total amount from items
     *
     * @param array $items Items data
     * @return float Total amount
     */
    private static function calculateTotalAmount($items)
    {
        $total = 0;
        foreach ($items as $item) {
            $amount = $item['amount'] ?? 0;
            $quantity = $item['quantity'] ?? 1;
            $total += $amount * $quantity;
        }
        return $total;
    }

    /**
     * Update a request
     *
     * @param string $requestId Request ID
     * @param array $updateData Data to update
     * @param array|null $items Request items (optional)
     * @param int $userId User updating the request
     * @return array Result with success/error
     */
    public static function updateRequest($requestId, $updateData, $items = null, $userId)
    {
        try {
            $requestInstance = new RequestInstance();
            $request = $requestInstance->find($requestId);

            if (!$request) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            // Check ownership
            if ($request->created_by != $userId) {
                return [
                    'success' => false,
                    'error' => 'access_denied',
                    'message' => 'Only request creator can update'
                ];
            }

            // Can only update draft requests
            if ($request->status !== 'draft') {
                return [
                    'success' => false,
                    'error' => 'invalid_status',
                    'message' => 'Only draft requests can be updated'
                ];
            }

            // Update request data
            $updated = $requestInstance->update($requestId, $updateData);

            if (!$updated) {
                return [
                    'success' => false,
                    'error' => 'update_failed',
                    'message' => 'Failed to update request'
                ];
            }

            // Update items if provided
            if ($items !== null) {
                // Delete existing items
                $requestItemModel = new RequestItem();
                $requestItemModel->deleteBy('request_id', $requestId);

                // Create new items
                if (!empty($items)) {
                    $itemsResult = self::createRequestItems($requestId, $items);
                    if (!$itemsResult['success']) {
                        return $itemsResult;
                    }
                }
            }

            // Refresh request data
            $updatedRequest = $requestInstance->find($requestId);

            return [
                'success' => true,
                'request' => $updatedRequest,
                'message' => 'Request updated successfully'
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error updating request: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'update_error',
                'message' => 'Failed to update request'
            ];
        }
    }

    /**
     * Delete a request
     *
     * @param string $requestId Request ID
     * @param int $userId User deleting the request
     * @return array Result with success/error
     */
    public static function deleteRequest($requestId, $userId)
    {
        try {
            $requestInstance = new RequestInstance();
            $request = $requestInstance->find($requestId);

            if (!$request) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            // Check ownership
            if ($request->created_by != $userId) {
                return [
                    'success' => false,
                    'error' => 'access_denied',
                    'message' => 'Only request creator can delete'
                ];
            }

            // Can only delete draft requests
            if ($request->status !== 'draft') {
                return [
                    'success' => false,
                    'error' => 'invalid_status',
                    'message' => 'Only draft requests can be deleted'
                ];
            }

            // Delete request items first (cascade)
            $requestItemModel = new RequestItem();
            $requestItemModel->deleteBy('request_id', $requestId);

            // Delete request
            $deleted = $requestInstance->delete($requestId);

            if (!$deleted) {
                return [
                    'success' => false,
                    'error' => 'delete_failed',
                    'message' => 'Failed to delete request'
                ];
            }

            return [
                'success' => true,
                'message' => 'Request deleted successfully'
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error deleting request: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'delete_error',
                'message' => 'Failed to delete request'
            ];
        }
    }

    /**
     * Get requests with filtering and RBAC
     *
     * @param array $filters
     * @param object|null $user
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public static function getRequests($filters = [], $user = null, $page = 1, $perPage = 20)
    {
        $order = ['created_at' => 'DESC'];

        // RBAC Logic: Check if user can view all requests
        if ($user) {
            $canViewAll = Permission::userHasPermission($user->user_id, 'requests.view');
            if (!$canViewAll || ($filters['my_requests'] ?? false)) {
                // If they don't have global view, or specifically asked for theirs, force filter to their own profile_id
                $filters['created_by'] = $user->profile_id;
            }
        }
        unset($filters['my_requests']);

        // 2. Select the correct table/model based on group filter
        if (!empty($filters['group_id'])) {
            $group = (new RequestGroup())->find($filters['group_id']);
            if ($group) {
                $model = self::getModuleRequestModel($group->code);
                $requests = $model->getAll($filters, $order, $page, $perPage);
            } else {
                return [
                    'success' => false,
                    'error' => 'group_not_found',
                    'message' => 'The specified group was not found'
                ];
            }
        } else {
            // No group filter: Use the registry (RequestInstance) or Union across all module tables
            // For now, let's use the registry pattern if available, or try to merge.
            // But since we want "independent incremental ID", the registry might not have all records.
            // Let's implement a Union query to get a truly global list.
            $requests = self::getGlobalRequests($filters, $order, $page, $perPage);
        }

        $result = array_map(function ($req) {
            $reqModel = new RequestInstance();
            $reqModel->fill((array) $req);
            $reqModel->id = $req->id;

            return [
                'id' => $req->id, // Using ID as request number
                'formatted_number' => $reqModel->getFormattedRequestNumber(),
                'status' => $req->status,
                'total_amount' => $req->total_amount,
                'currency' => $req->currency,
                'due_date' => $req->due_date ?? null,
                'created_by' => $reqModel->getCreator(),
                'created_at' => $req->created_at,
                'request_type' => [
                    'id' => $reqModel->getRequestType()?->id,
                    'name' => $reqModel->getRequestType()?->name ?? 'Unknown',
                    'code_prefix' => $reqModel->getRequestType()?->code_prefix,
                    'description' => $reqModel->getRequestType()?->description
                ]
            ];
        }, $requests['data']);

        return [
            'requests' => $result,
            'pagination' => [
                'total' => $requests['total'],
                'per_page' => $requests['per_page'],
                'current_page' => $requests['current_page'],
                'last_page' => $requests['last_page']
            ]
        ];
    }

    /**
     * Get a global list of requests across all module tables
     *
     * @param array $filters
     * @param array $order
     * @param int $page
     * @param int $perPage
     * @return array
     */
    private static function getGlobalRequests($filters = [], $order = [], $page = 1, $perPage = 20)
    {
        global $wpdb;
        $offset = ($page - 1) * $perPage;

        // Use only sta_request_instances - single source of truth
        $table = $wpdb->prefix . 'sta_request_instances';

        // Apply filters
        $where = [];
        if (!empty($filters['created_by'])) {
            $where[] = $wpdb->prepare("created_by = %d", $filters['created_by']);
        }
        if (!empty($filters['status'])) {
            $where[] = $wpdb->prepare("status = %s", $filters['status']);
        }
        if (!empty($filters['organization_id'])) {
            $where[] = $wpdb->prepare("organization_id = %s", $filters['organization_id']);
        }

        $whereSql = !empty($where) ? " WHERE " . implode(' AND ', $where) : "";

        // Sorting
        $orderBy = " ORDER BY created_at DESC";
        if (!empty($order)) {
            $col = key($order);
            $dir = strtoupper(current($order));
            $allowedCols = ['created_at', 'total_amount', 'status', 'id'];
            if (in_array($col, $allowedCols)) {
                $orderBy = " ORDER BY {$col} {$dir}";
            }
        }

        $finalQuery = "SELECT * FROM {$table}" . $whereSql . $orderBy . $wpdb->prepare(" LIMIT %d OFFSET %d", $perPage, $offset);
        $totalQuery = "SELECT COUNT(*) FROM {$table}" . $whereSql;

        $results = $wpdb->get_results($finalQuery);
        $total = $wpdb->get_var($totalQuery);

        return [
            'data' => $results,
            'total' => (int) $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ];
    }

    /**
     * Get a specific request with RBAC check
     *
     * @param string $id
     * @param object|null $user
     * @return array
     */
    public static function getRequest($id, $user = null)
    {
        try {
            // Attempt to find in all module-specific tables + generic table
            // This allows ?id=284 to work across modules, although it might be ambiguous if IDs overlap
            $models = [
                new RequestInstance(), // Generic/EAV
                new \App\Modules\Finance\Models\FinanceRequest(),
                new \App\Modules\HR\Models\HRRequest(),
                new \App\Modules\Admin\Models\AdminRequest()
            ];

            $req = null;
            $foundModelType = null;

            foreach ($models as $model) {
                // If it's a UUID string
                if (is_string($id) && strlen($id) > 10 && strpos($id, '-') !== false) {
                    $result = $model->where('uuid', $id)->first();
                }
                // If it's a formatted number (contains letters and numbers)
                elseif (is_string($id) && preg_match('/^[A-Z]+[\/\-]\d+/', $id)) {
                    // Use the new findByFormattedNumber method
                    if (method_exists($model, 'findByFormattedNumber')) {
                        $result = $model->findByFormattedNumber($id);
                    } else {
                        // Fallback for models that don't have this method
                        $result = \App\Core\Requests\Models\RequestInstance::findByFormattedNumber($id);
                    }
                }
                // If it's a numeric ID (using auto-increment ID now)
                elseif (is_numeric($id)) {
                    $result = $model->where('id', (int) $id)->first();
                } else {
                    $result = $model->find($id);
                }

                if ($result) {
                    $req = $result;
                    $foundModelType = get_class($model);
                    break;
                }
            }

            if (!$req) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            // Ensure we have a proper RequestInstance object
            if (!($req instanceof \App\Core\Requests\Models\RequestInstance)) {
                // Convert stdClass to RequestInstance
                $requestInstance = new RequestInstance();
                $requestInstance->fill((array) $req);
                $requestInstance->id = $req->id ?? null;
                $req = $requestInstance;
            }

            // RBAC Check: Ensure user has permission to view this specific request
            if ($user) {
                $profileId = $user->profile_id ?? $user->user_id ?? null;
                $canViewAll = $profileId ? Permission::userHasPermission($profileId, 'requests.view') : false;
                if (!$canViewAll && $req->created_by != $user->profile_id) {
                    return [
                        'success' => false,
                        'error' => 'forbidden',
                        'message' => 'You do not have permission to view this request'
                    ];
                }
            }

            $requestType = $req->getRequestType();
            return [
                'success' => true,
                'data' => [
                    'id' => $req->id,
                    'request_number' => $req->request_number ?: $req->id,
                    'request_type_id' => $req->request_type_id,
                    'formatted_number' => $req->getFormattedRequestNumber(),
                    'status' => $req->status,
                    'data' => $req->data,
                    'total_amount' => $req->total_amount,
                    'currency' => $req->currency,
                    'current_approval_step' => $req->current_approval_step,
                    'created_by' => $req->getCreator() ? [
                        'id' => $req->getCreator()->id,
                        'name' => $req->getCreator()->first_name . ' ' . $req->getCreator()->last_name,
                        'email' => $req->getCreator()->email
                    ] : null,
                    'team_id' => $req->team_id,
                    'created_at' => $req->created_at,
                    'updated_at' => $req->updated_at,
                    'request_type' => $requestType ? [
                        'id' => $requestType->id,
                        'name' => $requestType->name,
                        'code_prefix' => $requestType->code_prefix
                    ] : null,
                    'items' => $req->getItems(),
                    'attachments' => $req->getAttachedFiles(),
                    'workflow_status' => RequestWorkflowAdapter::getWorkflowStatus($req->id)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'retrieval_error',
                'message' => 'Failed to retrieve request: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process workflow action
     *
     * @param string $requestId
     * @param string $action
     * @param int $userId
     * @param string $comment
     * @return array
     */
    public static function processAction($requestId, $action, $userId, $comment = '')
    {
        return RequestWorkflowAdapter::processWorkflowAction(
            $requestId,
            $action,
            $userId,
            $comment
        );
    }

    /**
     * Get pending approvals for current user
     *
     * @param object $user
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public static function getPendingApprovals($user, $page = 1, $perPage = 20, $filters = [])
    {
        try {
            // Get requests that are in workflow and pending approval
            $requestInstance = new RequestInstance();

            // Query for requests with workflow instances
            $query = $requestInstance->where('status', 'submitted')
                ->where('workflow_instance_id', 'IS NOT NULL');

            $usePagination = empty($filters);

            if ($usePagination) {
                $offset = ($page - 1) * $perPage;
                $requests = $query->limit($perPage)
                    ->offset($offset)
                    ->orderBy('created_at', 'DESC')
                    ->get();
            } else {
                $requests = $query->orderBy('created_at', 'DESC')->get();
            }

            // Filter requests where current user is the next approver
            $pendingApprovals = [];
            $currentUserId = $user->wp_user_id ?? $user->user_id ?? $user->ID ?? null;
            $currentProfileId = $user->profile_id ?? null;

            foreach ($requests as $req) {
                // Hydrate
                $reqModel = new RequestInstance();
                $reqModel->fill((array) $req);
                $reqModel->id = $req->id;

                $workflowInstance = $reqModel->getWorkflowInstance();
                if ($workflowInstance) {
                    $currentStep = $workflowInstance->getCurrentStep();
                    if ($currentStep) {
                        $approverIds = RequestWorkflowAdapter::getCurrentApproverIds($workflowInstance, $reqModel);
                        $isApprover = false;

                        foreach ($approverIds as $approverId) {
                            if ((string) $approverId === (string) $currentUserId || (string) $approverId === (string) $currentProfileId) {
                                $isApprover = true;
                                break;
                            }
                        }

                        if ($isApprover) {
                            if (!self::matchesApprovalFilters($req, $reqModel, $filters)) {
                                continue;
                            }
                            $pendingApprovals[] = [
                                'id' => $req->id,
                                'request_number' => $req->id, // Using ID as request number
                                'formatted_number' => $reqModel->getFormattedRequestNumber(),
                                'status' => $req->status,
                                'data' => $reqModel->data,
                                'total_amount' => $req->total_amount,
                                'currency' => $req->currency,
                                'created_by' => $reqModel->getCreator(),
                                'organization_id' => $req->organization_id ?? null,
                                'team_id' => $req->team_id ?? null,
                                'created_at' => $req->created_at,
                                'request_type' => $reqModel->getRequestType(),
                                'current_step' => $currentStep
                            ];
                        }
                    }
                }
            }

            if (!empty($filters['order_by'])) {
                $orderBy = $filters['order_by'];
                $orderDir = strtolower($filters['order_dir'] ?? 'desc');
                usort($pendingApprovals, function ($a, $b) use ($orderBy, $orderDir) {
                    $va = $a[$orderBy] ?? null;
                    $vb = $b[$orderBy] ?? null;
                    if ($orderBy === 'created_at') {
                        $va = strtotime($va);
                        $vb = strtotime($vb);
                    }
                    if ($va == $vb) return 0;
                    $result = ($va < $vb) ? -1 : 1;
                    return $orderDir === 'asc' ? $result : -$result;
                });
            }

            $total = count($pendingApprovals);
            if (!$usePagination) {
                $offset = max(0, ($page - 1) * $perPage);
                $pendingApprovals = array_slice($pendingApprovals, $offset, $perPage);
            }

            return [
                'requests' => $pendingApprovals,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page
                ]
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error getting pending approvals: ' . $e->getMessage());
            return [
                'requests' => [],
                'pagination' => ['total' => 0]
            ];
        }
    }

    /**
     * Apply approval filters to a request instance.
     *
     * @param object $req Raw request row
     * @param RequestInstance $reqModel Hydrated model
     * @param array $filters
     * @return bool
     */
    private static function matchesApprovalFilters($req, $reqModel, $filters)
    {
        if (empty($filters)) {
            return true;
        }

        if (!empty($filters['request_type_ids'])) {
            if (!in_array($req->request_type_id ?? null, $filters['request_type_ids'], true)) {
                return false;
            }
        }

        if (!empty($filters['request_id'])) {
            if ((string) ($req->id ?? '') !== (string) $filters['request_id']) {
                return false;
            }
        }

        if (!empty($filters['status']) && $filters['status'] !== 'pending') {
            if (($req->status ?? '') !== $filters['status']) {
                return false;
            }
        }

        if (!empty($filters['staff_id'])) {
            if ((string) ($req->created_by ?? '') !== (string) $filters['staff_id']) {
                return false;
            }
        }

        if (!empty($filters['team_id'])) {
            if ((string) ($req->team_id ?? '') !== (string) $filters['team_id']) {
                return false;
            }
        }

        if (!empty($filters['organization_id'])) {
            if ((string) ($req->organization_id ?? '') !== (string) $filters['organization_id']) {
                return false;
            }
        }

        if (!empty($filters['amount_min'])) {
            if ((float) ($req->total_amount ?? 0) < (float) $filters['amount_min']) {
                return false;
            }
        }

        if (!empty($filters['amount_max'])) {
            if ((float) ($req->total_amount ?? 0) > (float) $filters['amount_max']) {
                return false;
            }
        }

        if (!empty($filters['date_from'])) {
            $created = strtotime($req->created_at ?? '');
            if ($created && $created < strtotime($filters['date_from'])) {
                return false;
            }
        }

        if (!empty($filters['date_to'])) {
            $created = strtotime($req->created_at ?? '');
            if ($created && $created > strtotime($filters['date_to'] . ' 23:59:59')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get approval history for a request
     *
     * @param string $requestId
     * @return array
     */
    public static function getApprovalHistory($requestId)
    {
        try {
            $requestInstance = new RequestInstance();
            $requestData = $requestInstance->find($requestId);

            if (!$requestData) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            $workflowInstance = $requestData->getWorkflowInstance();

            if (!$workflowInstance) {
                return [
                    'success' => true,
                    'history' => [],
                    'message' => 'No workflow history available'
                ];
            }

            $history = $workflowInstance->getHistory();

            $formattedHistory = array_map(function ($record) {
                $performer = \get_userdata($record->performed_by);
                return [
                    'id' => $record->id,
                    'action' => $record->action,
                    'performed_by' => [
                        'id' => $record->performed_by,
                        'name' => $performer ? $performer->display_name : 'Unknown User',
                        'email' => $performer ? $performer->user_email : ''
                    ],
                    'comment' => $record->comment,
                    'step_name' => $record->step_name,
                    'created_at' => $record->created_at
                ];
            }, $history);

            return [
                'success' => true,
                'history' => $formattedHistory
            ];
        } catch (\Exception $e) {
            error_log('RequestService: Error getting approval history: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'history_error',
                'message' => 'Failed to retrieve approval history'
            ];
        }
    }

    /**
     * Submit Retirement for a request
     *
     * @param string $requestId
     * @param array $params
     * @param array $files
     * @param int $userId
     * @return array
     */
    public static function retire($requestId, $params, $files = [], $userId = null)
    {
        try {
            $requestInstance = new RequestInstance();
            $req = $requestInstance->find($requestId);

            if (!$req) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            $receipts = [];
            if (!empty($files['receipts'])) {
                // This requires WP file handling context
                // In a real production app, this would be handled by a FileStorageService
                require_once(ABSPATH . 'wp-admin/includes/file.php');
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                require_once(ABSPATH . 'wp-admin/includes/media.php');

                $uploaded = \media_handle_upload('receipts', 0);
                if (!\is_wp_error($uploaded)) {
                    $receipts[] = \wp_get_attachment_url($uploaded);
                }
            }

            $currentData = is_string($req->data) ? json_decode($req->data, true) : $req->data;
            if (!is_array($currentData))
                $currentData = [];

            $currentData['retirement'] = [
                'actual_amount' => $params['actual_amount'] ?? 0,
                'balance_amount' => $params['balance_amount'] ?? 0,
                'receipts' => $receipts,
                'submitted_at' => current_time('mysql'),
                'submitted_by' => $userId
            ];

            $requestInstance->update($requestId, [
                'data' => $currentData,
                'status' => 'retirement_pending'
            ]);

            return [
                'success' => true,
                'message' => 'Retirement submitted successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'retirement_error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify retirement
     *
     * @param string $requestId
     * @param array $params
     * @return array
     */
    public static function verifyRetirement($requestId, $params)
    {
        try {
            $action = $params['action'] ?? 'approve'; // approve or reject

            $requestInstance = new RequestInstance();
            $req = $requestInstance->find($requestId);

            if (!$req) {
                return [
                    'success' => false,
                    'error' => 'request_not_found',
                    'message' => 'Request not found'
                ];
            }

            if ($action === 'approve') {
                $requestInstance->update($requestId, ['status' => 'completed']);
            } else {
                $requestInstance->update($requestId, ['status' => 'retirement_rejected']);
            }

            return [
                'success' => true,
                'message' => 'Retirement verification processed'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'verification_error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Record payment voucher generation
     *
     * @param string $requestId
     * @param array $formData
     * @param int $userId
     * @return bool
     */
    public static function recordPaymentVoucher($requestId, $formData, $userId)
    {
        $requestInstance = new RequestInstance();
        $req = $requestInstance->find($requestId);

        if (!$req)
            return false;

        $currentData = is_string($req->data) ? json_decode($req->data, true) : $req->data;
        if (!is_array($currentData))
            $currentData = [];

        $currentData['payment_voucher'] = [
            'number' => $formData['voucher_number'],
            'date' => $formData['voucher_date'],
            'payee' => $formData['payee_name'],
            'amount' => $formData['amount'],
            'generated_by' => $userId,
            'generated_at' => current_time('mysql')
        ];

        return $requestInstance->update($requestId, [
            'data' => $currentData,
            'status' => 'voucher_created'
        ]);
    }

    /**
     * Get dashboard stats for a user
     *
     * @param int $userId WP User ID (created_by)
     * @return array Stats data
     */
    public static function getDashboardStats($userId)
    {
        return RequestInstance::getDashboardStats($userId);
    }

    // --- Request Groups (Domains) Management ---

    /**
     * Get request groups
     *
     * @param bool $includeInactive
     * @return array
     */
    public static function getGroups($includeInactive = false)
    {
        $model = new RequestGroup();
        if ($includeInactive) {
            $groups = $model->all();
        } else {
            $groups = RequestGroup::getActive();
        }

        return array_map(function ($group) {
            $g = (object) $group;
            $groupModel = new RequestGroup();
            $groupModel->fill((array) $g);
            $groupModel->id = $g->id;

            return [
                'id' => $g->id,
                'name' => $g->name,
                'code' => $g->code,
                'description' => $g->description,
                'is_active' => (bool) $g->is_active,
                'request_types_count' => count($groupModel->getActiveRequestTypes())
            ];
        }, $groups);
    }

    /**
     * Create a request group
     *
     * @param array $data
     * @return object
     */
    public static function createGroup($data)
    {
        if (empty($data['id'])) {
            $data['id'] = \wp_generate_uuid4();
        }
        $model = new RequestGroup();
        return $model->create($data);
    }

    /**
     * Update a request group
     *
     * @param string $id
     * @param array $data
     * @return object
     */
    public static function updateGroup($id, $data)
    {
        unset($data['id']);
        $model = new RequestGroup();
        return $model->update($id, $data);
    }

    /**
     * Delete a request group
     *
     * @param string $id
     * @return bool
     */
    public static function deleteGroup($id)
    {
        $model = new RequestGroup();
        return $model->delete($id);
    }

    // --- Request Types Management ---

    /**
     * Get request types
     *
     * @param array $filters
     * @param bool $includeInactive
     * @return array
     */
    public static function getTypes($filters = [], $includeInactive = false)
    {
        $model = new RequestType();
        $groupId = $filters['group_id'] ?? null;

        if ($groupId) {
            $types = $model->where('group_id', $groupId)->get();
        } elseif ($includeInactive) {
            $types = $model->all();
        } else {
            $types = RequestType::getActive();
        }

        return array_map([self::class, 'formatTypeResponse'], $types);
    }

    /**
     * Get specific request type
     *
     * @param string $id
     * @return array|null
     */
    public static function getType($id)
    {
        $model = new RequestType();
        $type = $model->find($id);
        if (!$type)
            return null;

        return self::formatTypeResponse($type);
    }

    /**
     * Create a request type
     *
     * @param array $data
     * @return object
     */
    public static function createType($data)
    {
        if (empty($data['id'])) {
            $data['id'] = \wp_generate_uuid4();
        }
        error_log('Creating request type with data: ' . json_encode($data));
        $model = new RequestType();
        return $model->create($data);
    }

    /**
     * Update a request type
     *
     * @param string $id
     * @param array $data
     * @return object
     */
    public static function updateType($id, $data)
    {
        unset($data['id']);
        $model = new RequestType();
        return $model->update($id, $data);
    }

    /**
     * Delete a request type
     *
     * @param string $id
     * @return bool
     */
    public static function deleteType($id)
    {
        $model = new RequestType();
        return $model->delete($id);
    }

    /**
     * Format request type for response
     *
     * @param object $type
     * @return array
     */
    private static function formatTypeResponse($type)
    {
        // Ensure $type is a Model instance if it was raw stdClass
        if (!($type instanceof RequestType)) {
            $raw = (array) $type;
            $type = new RequestType();
            $type->fill($raw);
            if (isset($raw['id']))
                $type->id = $raw['id'];
        }

        // Bridge form_id to form_schema if needed
        $schema = $type->form_schema;
        if (empty($schema) && !empty($type->form_id)) {
            $formModel = new Form();
            $form = $formModel->find($type->form_id);
            if ($form) {
                $fields = $form->getFields();
                $schema = array_map(function ($f) {
                    $field = (object) $f;
                    return [
                        'name' => $field->field_key,
                        'label' => $field->field_label,
                        'type' => $field->field_type,
                        'required' => (bool) $field->is_required
                    ];
                }, $fields);
            }
        }

        $group = $type->group();

        return [
            'id' => $type->id,
            'group_id' => $type->group_id,
            'name' => $type->name,
            'code_prefix' => $type->code_prefix,
            'description' => $type->description,
            'form_id' => $type->form_id ?? null,
            'form_schema' => $schema,
            'storage_type' => $type->storage_type,
            'approval_flow_json' => $type->approval_flow_json,
            'approval_limit' => $type->approval_limit,
            'is_active' => (bool) $type->is_active,
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'code' => $group->code
            ] : null
        ];
    }
}
