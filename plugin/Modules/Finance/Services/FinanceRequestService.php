<?php

namespace App\Modules\Finance\Services;

use App\Core\Requests\Models\RequestInstance;
use App\Core\Requests\Models\RequestType;
use App\Core\Requests\Models\RequestGroup;
use App\Core\Requests\Models\RequestItem;
use Exception;

class FinanceRequestService
{
    /**
     * Get or create the Finance request group
     * 
     * @return object
     */
    private function getFinanceGroup()
    {
        $group = RequestGroup::findByCode('finance');

        if (!$group) {
            $groupModel = new RequestGroup();
            $group = $groupModel->create([
                'id' => \wp_generate_uuid4(),
                'name' => 'Finance',
                'code' => 'finance',
                'description' => 'Finance module requests',
                'is_active' => true
            ]);
        }

        return $group;
    }


    /**
     * Get lookup data for Finance requests
     * 
     * @return object
     */
    public function getFinanceLookupData($user)
    {
        // 1. Get Full User Profile (includes their orgs/teams)
        $profile = \App\Core\User\Services\UserService::getProfileById($user->profile_id);

        // 2. Get Global Active Departments and Teams (all across organizations for filtering)
        $groupService = new \App\Core\User\Services\GroupService();
        $departmentsResult = $groupService->getAllGroups(['type' => 'department', 'is_active' => true], 1, 1000);
        $teamsResult = $groupService->getAllGroups(['type' => 'team', 'is_active' => true], 1, 1000);
        $globalDepartments = $departmentsResult['data'] ?? [];
        $globalTeams = $teamsResult['data'] ?? [];

        // 3. Get Active Projects (from Taxonomy)
        $taxService = new \App\Core\Taxonomy\Services\TaxonomyService();
        $projectTax = $taxService->getTaxonomyBySlug('projects');
        $projects = [];
        if ($projectTax) {
            $termsResult = $taxService->getTermsByTaxonomy($projectTax->id, ['is_active' => true, 'per_page' => 1000]);
            $projects = $termsResult['data'] ?? [];
        }

        // 4. Get Expense Categories (from Taxonomy)
        $expenseCategoryTax = $taxService->getTaxonomyBySlug('expense-categories');
        $expenseCategories = [];
        if ($expenseCategoryTax) {
            $categoriesResult = $taxService->getTermsByTaxonomy($expenseCategoryTax->id, ['is_active' => true, 'per_page' => 1000]);
            $expenseCategories = $categoriesResult['data'] ?? [];
        }

        // 5. Get Active Finance Request Types
        $requestTypes = $this->getFinanceRequestTypes();

        $financeGroup = $this->getFinanceGroup();

        return [
            'profile' => $profile,
            'global' => [
                'departments' => $globalDepartments,
                'teams' => $globalTeams,
                'projects' => $projects,
                'expense_categories' => $expenseCategories,
                'request_types' => $requestTypes,
                'finance_group' => $financeGroup
            ]
        ];
    }

    /**
     * Get all active Finance request types
     *
     * @return array
     * @throws Exception
     */
    public function getFinanceRequestTypes()
    {
        $group = $this->getFinanceGroup();

        if (!$group) {
            return [];
        }

        // Get types for this group
        $types = RequestType::getByGroup($group->id);

        // Filter for active ones
        $activeTypes = array_filter($types, function ($t) {
            return $t->is_active;
        });

        // Map to array format expected by API
        return array_map(function ($type) {
            $schema = $type->form_schema;
            if (empty($schema) && !empty($type->form_id)) {
                $form = (new \App\Core\Forms\Models\Form())->find($type->form_id);
                if ($form) {
                    $fields = $form->getFields();
                    $schema = array_map(function ($f) {
                        return [
                            'name' => $f->field_key,
                            'label' => $f->field_label,
                            'type' => $f->field_type,
                            'required' => (bool) $f->is_required
                        ];
                    }, $fields);
                }
            }

            return [
                'id' => $type->id,
                'name' => $type->name,
                'code_prefix' => $type->code_prefix,
                'description' => $type->description,
                'form_id' => $type->form_id,
                'form_schema' => $schema,
                'approval_flow_json' => $type->approval_flow_json,
                'approval_limit' => $type->approval_limit,
                'is_active' => $type->is_active
            ];
        }, $activeTypes);
    }

    /**
     * Create a new Finance Request Type
     *
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function createRequestType(array $data)
    {
        $group = $this->getFinanceGroup();
        if (!$group) {
            throw new Exception("Finance request group not found.");
        }

        $data['group_id'] = $group->id;

        // Handle settings (convert array to JSON if needed)
        if (isset($data['settings']) && is_array($data['settings'])) {
            $data['settings'] = json_encode($data['settings']);
        }

        $requestType = new RequestType();
        return $requestType->create($data);
    }

    /**
     * Update a Finance Request Type
     *
     * @param int $id
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function updateRequestType(int $id, array $data)
    {
        $typeModel = new RequestType();
        $type = $typeModel->find($id);

        if (!$type) {
            throw new Exception("Request type not found.");
        }

        // Ensure we are only updating finance types
        $group = $this->getFinanceGroup();
        if (!$group || $type->group_id != $group->id) {
            throw new Exception("Cannot update non-finance request types.");
        }

        // Handle settings (convert array to JSON if needed)
        if (isset($data['settings']) && is_array($data['settings'])) {
            $data['settings'] = json_encode($data['settings']);
        }

        $typeModel->update($id, $data);

        return $typeModel->find($id);
    }

    /**
     * Delete a Finance Request Type
     *
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function deleteRequestType(int $id)
    {
        $typeModel = new RequestType();
        $type = $typeModel->find($id);

        if (!$type) {
            throw new Exception("Request type not found.");
        }

        // Ensure we are only deleting finance types
        $group = $this->getFinanceGroup();
        if (!$group || $type->group_id != $group->id) {
            throw new Exception("Cannot delete non-finance request types.");
        }

        return $typeModel->delete($id);
    }

    /**
     * Create a new Finance Request
     *
     * @param int $userId
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function createFinanceRequest(int $userId, array $data)
    {
        try {
            $requestTypeId = $data['request_type_id'];
            $financeGroup = $this->getFinanceGroup();

            // For dynamic finance forms, wrap all form data into 'data' field
            $formData = [
                'purpose' => $data['purpose'] ?? '',
                'items' => $data['items'] ?? [],
                'department_id' => $data['department_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'is_reimbursement' => $data['is_reimbursement'] ?? false,
                'amount' => $data['amount'] ?? 0,
                'due_date' => $data['due_date'] ?? null
            ];

            // // Generate request number
            // $requestNumber = $type->getNextRequestNumber();

            // Calculate total amount from items if not provided
            $totalAmount = $data['amount'] ?? 0;
            $items = $data['items'] ?? [];
            if (empty($totalAmount) && !empty($items)) {
                foreach ($items as $item) {
                    $totalAmount += floatval($item['amount'] ?? 0);
                }
            }

            // Create finance request using sta_request_instances table
            $requestInstanceModel = new RequestInstance();
            $financeRequest = $requestInstanceModel->create([
                'request_type_id' => $requestTypeId,
                'group_id' => $financeGroup ? $financeGroup->id : null,
                'organization_id' => $data['organization_id'] ?? null,
                'created_by' => $userId,
                'team_id' => $data['department_id'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'data' => json_encode($formData),
                'total_amount' => $totalAmount,
                'currency' => $data['currency'] ?? 'NGN'
            ]);

            if (!$financeRequest) {
                throw new Exception('Failed to create finance request - database insert failed');
            }

            // Create request items
            if (!empty($items)) {
                $this->createRequestItems($financeRequest->id, $items);
            }

            return [
                'success' => true,
                'request' => $financeRequest,
                'request_id' => $financeRequest->id,
            ];
        } catch (Exception $e) {
            error_log('FinanceRequestService::createFinanceRequest error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create request items
     */
    private function createRequestItems($requestId, $items)
    {
        $requestItemModel = new RequestItem();

        foreach ($items as $index => $itemData) {
            $requestItemModel->create([
                'id' => \wp_generate_uuid4(),
                'request_id' => $requestId,
                'item_description' => $itemData['item'] ?? '',
                'quantity' => $itemData['quantity'] ?? 1,
                'unit_price' => $itemData['unit_price'] ?? 0,
                'total_price' => $itemData['amount'] ?? 0,
                'notes' => $itemData['note'] ?? '',
                'sort_order' => $index
            ]);
        }
    }


    /**
     * Get Finance Requests
     *
     * @return object|null
     */
    public function getFinanceRequests($filters = [], $user = null, $page = 1, $perPage = 25)
    {
        // First verify this is a finance request by checking the group
        $financeGroup = $this->getFinanceGroup();
        if (!$financeGroup) {
            return [
                'success' => false,
                'error' => 'finance_group_not_found',
                'message' => 'Finance group not found'
            ];
        }

        // Add group filter to ensure we only get finance requests
        $filters['group_id'] = $financeGroup->id;

        // If user provided and doesn't have global view permission, filter by user
        if ($user) {
            $canViewAll = \App\Core\Auth\Models\Permission::userHasPermission($user->profile_id, 'requests.view');
            if (!$canViewAll) {
                $filters['created_by'] = $user->profile_id;
            }
        }

        // Use the RequestInstance model's getAll method
        $result = \App\Core\Requests\Models\RequestInstance::getAll($filters, ['created_at' => 'DESC'], $page, $perPage);

        // Process the results to add request type information and format data
        $processedResults = [];
        foreach ($result['data'] as $request) {
            // Parse data if it's JSON
            $data = $request->data;
            if (is_string($data)) {
                $data = json_decode($data, true);
            }

            // Get request type info
            $typeModel = new \App\Core\Requests\Models\RequestType();
            $requestType = $typeModel->find($request->request_type_id);

            // Get creator info
            $creatorModel = new \App\Core\User\Models\User();
            $creator = $creatorModel->find($request->created_by);

            $processedResults[] = [
                'id' => $request->id,
                'status' => $request->status,
                'data' => $data,
                'total_amount' => $request->total_amount,
                'currency' => $request->currency,
                'created_at' => $request->created_at,
                'updated_at' => $request->updated_at,
                'created_by' => [
                    'id' => $request->created_by,
                    'name' => $creator ? ($creator->first_name . ' ' . $creator->last_name) : 'Unknown User',
                    'email' => $creator ? $creator->email : ''
                ],
                'request_type' => $requestType ? [
                    'id' => $requestType->id,
                    'name' => $requestType->name,
                    'code_prefix' => $requestType->code_prefix
                ] : null
            ];
        }

        return [
            'success' => true,
            'data' => $processedResults,
            'pagination' => $result['pagination'] ?? null
        ];
    }

    /**

     * Get Finance Request
     *
     * @param int $id
     * @return object|null
     */

    public function getFinanceRequest($requestId, $user = null)
    {
        try {
            return \App\Core\Requests\Services\RequestService::getRequest($requestId, $user);
        } catch (\Exception $e) {
            error_log('FinanceRequestService::getFinanceRequest error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'retrieval_error',
                'message' => 'Failed to retrieve request: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Save request data to Finance EAV table
     *
     * @param string $requestId
     * @param array $formData
     * @param array|null $schema
     * @return void
     */
    private function saveToEAV($requestId, $formData, $schema = null)
    {
        if (empty($formData)) {
            return;
        }

        foreach ($formData as $fieldKey => $value) {
            // Skip empty values
            if ($value === null || $value === '') {
                continue;
            }

            // Determine field type from schema
            $fieldType = $this->getFieldType($fieldKey, $schema);

            $eavData = [
                'request_id' => $requestId,
                'field_id' => null, // Can link to sta_form_fields later
                'field_key' => $fieldKey,
                'value_text' => null,
                'value_number' => null,
                'value_date' => null,
                'value_datetime' => null,
                'value_file_url' => null
            ];

            // Type-aware column selection for optimal queries
            switch ($fieldType) {
                case 'number':
                case 'currency':
                    $eavData['value_number'] = floatval($value);
                    break;

                case 'date':
                    $eavData['value_date'] = $value;
                    break;

                case 'datetime':
                    $eavData['value_datetime'] = $value;
                    break;

                case 'file':
                case 'url':
                    $eavData['value_file_url'] = $value;
                    break;

                default:
                    // text, textarea, select, etc.
                    $eavData['value_text'] = is_array($value) ? json_encode($value) : $value;
            }

            // Insert into Finance EAV table
            (new \App\Modules\Finance\Models\FinanceRequestData())->create($eavData);
        }
    }

    /**
     * Get field type from schema
     *
     * @param string $fieldKey
     * @param array|null $schema
     * @return string
     */
    private function getFieldType($fieldKey, $schema)
    {
        if (!$schema || !is_array($schema)) {
            return 'text';
        }

        foreach ($schema as $field) {
            if (isset($field['name']) && $field['name'] === $fieldKey) {
                return $field['type'] ?? 'text';
            }
        }

        return 'text';
    }
}
