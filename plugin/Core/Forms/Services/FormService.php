<?php

namespace App\Core\Forms\Services;

use App\Core\Forms\Models\Form;
use App\Core\Forms\Models\FormField;
use App\Core\Forms\Models\FormAssignment;
use App\Core\Forms\Models\FormSubmission;

/**
 * FormService
 * 
 * Handles form creation, management, and validation
 */
class FormService
{
    /**
     * Create a new form
     * 
     * @param array $formData Form data
     * @param array $fields Form fields
     * @param int $createdBy User ID
     * @return array Result
     */
    public function createForm($formData, $fields = [], $createdBy = null)
    {
        try {
            // Validate required fields
            if (empty($formData['name'])) {
                return ['success' => false, 'message' => 'Form name is required'];
            }

            // Create form
            $formId = wp_generate_uuid4();
            $form = new Form();

            $insertData = [
                'id' => $formId,
                'name' => $formData['name'],
                'description' => $formData['description'] ?? null,
                'module' => $formData['module'] ?? 'general',
                'storage_type' => $formData['storage_type'] ?? 'default',
                'target_table' => $formData['target_table'] ?? null,
                'column_mapping' => !empty($formData['column_mapping'])
                    ? (is_array($formData['column_mapping']) ? json_encode($formData['column_mapping']) : $formData['column_mapping'])
                    : null,
                'is_recurring' => $formData['is_recurring'] ?? false,
                'recurrence_pattern' => !empty($formData['recurrence_pattern'])
                    ? json_encode($formData['recurrence_pattern'])
                    : null,
                'workflow_enabled' => $formData['workflow_enabled'] ?? false,
                'workflow_statuses' => !empty($formData['workflow_statuses'])
                    ? json_encode($formData['workflow_statuses'])
                    : null,
                'created_by_profile_id' => $createdBy,
                'is_active' => true
            ];

            $result = $form->create($insertData);

            if (!$result) {
                return ['success' => false, 'message' => 'Failed to create form'];
            }

            // Create fields
            if (!empty($fields)) {
                $this->createFormFields($formId, $fields);
            }

            return [
                'success' => true,
                'message' => 'Form created successfully',
                'data' => ['form_id' => $formId]
            ];
        } catch (\Exception $e) {
            error_log('FormService::createForm error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error creating form: ' . $e->getMessage()];
        }
    }

    /**
     * Create form fields
     * 
     * @param string $formId
     * @param array $fields
     * @return array
     */
    public function createFormFields($formId, $fields)
    {
        try {
            $formField = new FormField();
            $displayOrder = 0;

            foreach ($fields as $field) {
                if (empty($field['field_key']) || empty($field['field_label'])) {
                    continue; // Skip invalid fields
                }

                $fieldData = [
                    'id' => wp_generate_uuid4(),
                    'form_id' => $formId,
                    'field_key' => $field['field_key'],
                    'field_label' => $field['field_label'],
                    'field_type' => $field['field_type'] ?? 'text',
                    'field_options' => !empty($field['field_options'])
                        ? json_encode($field['field_options'])
                        : null,
                    'is_required' => $field['is_required'] ?? false,

                    // Advanced properties
                    'field_width' => $field['field_width'] ?? 'full',
                    'field_placeholder' => $field['field_placeholder'] ?? null,
                    'help_text' => $field['help_text'] ?? null,
                    'field_score' => $field['field_score'] ?? null,
                    'min_value' => $field['min_value'] ?? null,
                    'max_value' => $field['max_value'] ?? null,
                    'max_characters' => $field['max_characters'] ?? null,
                    'allow_multiple' => $field['allow_multiple'] ?? false,
                    'section_id' => $field['section_id'] ?? null,

                    'validation_rules' => !empty($field['validation_rules'])
                        ? json_encode($field['validation_rules'])
                        : null,
                    'conditional_rules' => !empty($field['conditional_rules'])
                        ? json_encode($field['conditional_rules'])
                        : null,

                    'display_order' => $field['display_order'] ?? $displayOrder++
                ];

                $formField->create($fieldData);
            }

            return ['success' => true, 'message' => 'Fields created'];
        } catch (\Exception $e) {
            error_log('FormService::createFormFields error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Update form
     * 
     * @param string $formId
     * @param array $formData
     * @return array
     */
    public function updateForm($formId, $formData)
    {
        try {
            $form = new Form();
            $existing = $form->find($formId);

            if (!$existing) {
                return ['success' => false, 'message' => 'Form not found'];
            }

            $updateData = [];
            $allowedFields = [
                'name',
                'description',
                'storage_type',
                'target_table',
                'column_mapping',
                'is_recurring',
                'recurrence_pattern',
                'workflow_enabled',
                'workflow_statuses',
                'is_active'
            ];

            foreach ($allowedFields as $field) {
                if (isset($formData[$field])) {
                    if (in_array($field, ['recurrence_pattern', 'workflow_statuses'])) {
                        $updateData[$field] = is_array($formData[$field])
                            ? json_encode($formData[$field])
                            : $formData[$field];
                    } else {
                        $updateData[$field] = $formData[$field];
                    }
                }
            }

            $result = $form->update($formId, $updateData);

            return [
                'success' => true,
                'message' => 'Form updated successfully'
            ];
        } catch (\Exception $e) {
            error_log('FormService::updateForm error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Delete form
     * 
     * @param string $formId
     * @return array
     */
    public function deleteForm($formId)
    {
        try {
            $form = new Form();
            $existing = $form->find($formId);

            if (!$existing) {
                return ['success' => false, 'message' => 'Form not found'];
            }

            // Delete form (cascade will delete fields and submissions)
            $result = $form->delete($formId);

            return [
                'success' => true,
                'message' => 'Form deleted successfully'
            ];
        } catch (\Exception $e) {
            error_log('FormService::deleteForm error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Assign form to users/roles
     * 
     * @param string $formId
     * @param array $assignmentData
     * @return array
     */
    public function assignForm($formId, $assignmentData)
    {
        try {
            $form = new Form();
            if (!$form->find($formId)) {
                return ['success' => false, 'message' => 'Form not found'];
            }

            $assignment = new FormAssignment();
            $assignmentId = wp_generate_uuid4();

            $data = [
                'id' => $assignmentId,
                'form_id' => $formId,
                'assigned_to_role' => $assignmentData['assigned_to_role'] ?? null,
                'assigned_to_profile_id' => $assignmentData['assigned_to_profile_id'] ?? null,
                'assigned_to_department_id' => $assignmentData['assigned_to_department_id'] ?? null,
                'visibility_roles' => !empty($assignmentData['visibility_roles'])
                    ? json_encode($assignmentData['visibility_roles'])
                    : null,
                'due_date' => $assignmentData['due_date'] ?? null
            ];

            $result = $assignment->create($data);

            return [
                'success' => true,
                'message' => 'Form assigned successfully',
                'data' => ['assignment_id' => $assignmentId]
            ];
        } catch (\Exception $e) {
            error_log('FormService::assignForm error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get forms assigned to a user
     * 
     * @param int $profileId
     * @param string $role
     * @return array
     */
    public function getAssignedForms($profileId, $role = null)
    {
        try {
            $assignments = FormAssignment::getByProfile($profileId);

            if ($role) {
                $roleAssignments = FormAssignment::getByRole($role);
                $assignments = array_merge($assignments, $roleAssignments);
            }

            $formIds = array_unique(array_column($assignments, 'form_id'));
            $forms = [];

            foreach ($formIds as $formId) {
                $form = new Form();
                $formData = $form->find($formId);
                if ($formData && $formData->is_active) {
                    $forms[] = $formData;
                }
            }

            return [
                'success' => true,
                'data' => $forms
            ];
        } catch (\Exception $e) {
            error_log('FormService::getAssignedForms error: ' . $e->getMessage());
            throw new \Exception($e->getMessage());
        }
    }

    /**
     * Submit a form with conditional logic evaluation
     * 
     * @param string $formId
     * @param array $data Field values
     * @param int|null $userId
     * @return string Submission ID
     */
    public function submitForm($formId, $data, $userId = null)
    {
        global $wpdb;

        $form = Form::find($formId);
        if (!$form) {
            throw new \Exception('Form not found');
        }

        $fields = FormField::where('form_id', $formId)->orderBy('display_order')->get();

        // Filter visible fields based on conditions
        $visibleFields = [];
        foreach ($fields as $field) {
            if ($this->isFieldVisible($field, $data)) {
                $visibleFields[] = $field;
            }
        }

        // Create submission
        $submissionId = wp_generate_uuid4();
        $wpdb->insert($wpdb->prefix . 'sta_form_submissions', [
            'id' => $submissionId,
            'form_id' => $formId,
            'submitted_by_profile_id' => $userId ?: get_current_user_id(),
            'status' => 'submitted',
            'submitted_at' => current_time('mysql')
        ]);

        // Save answers for visible fields only
        foreach ($visibleFields as $field) {
            $value = $data[$field->field_key] ?? null;

            if ($field->is_required && empty($value)) {
                throw new \Exception("Required field '{$field->field_label}' is empty");
            }

            if (!empty($value)) {
                $wpdb->insert($wpdb->prefix . 'sta_form_answers', [
                    'id' => wp_generate_uuid4(),
                    'submission_id' => $submissionId,
                    'field_id' => $field->id,
                    'answer_value' => is_array($value) ? json_encode($value) : $value
                ]);
            }
        }

        return $submissionId;
    }

    /**
     * Check if field is visible based on conditional rules
     * 
     * @param object $field
     * @param array $submittedData
     * @return bool
     */
    private function isFieldVisible($field, $submittedData)
    {
        if (empty($field->conditional_rules)) {
            return true; // No conditions = always visible
        }

        $rules = json_decode($field->conditional_rules, true);
        if (!$rules || empty($rules['conditions'])) {
            return true;
        }

        $logic = $rules['logic'] ?? 'AND';
        $results = [];

        foreach ($rules['conditions'] as $condition) {
            $fieldValue = $submittedData[$condition['field']] ?? '';
            $conditionMet = false;

            switch ($condition['operator']) {
                case 'equals':
                    $conditionMet = ($fieldValue == $condition['value']);
                    break;
                case 'not_equals':
                    $conditionMet = ($fieldValue != $condition['value']);
                    break;
                case 'contains':
                    $conditionMet = (strpos($fieldValue, $condition['value']) !== false);
                    break;
                case 'not_empty':
                    $conditionMet = !empty($fieldValue);
                    break;
            }

            $results[] = $conditionMet;
        }

        return ($logic === 'AND') ? !in_array(false, $results) : in_array(true, $results);
    }
    /**
     * Get dashboard stats for a user
     * 
     * @param int $profileId Profile ID
     * @return array Stats data
     */
    public function getDashboardStats($profileId)
    {
        $forms_count = Form::getPublishedCount();
        $submissions_count = FormSubmission::getCountByUser($profileId);

        return [
            'forms_count' => (int) $forms_count,
            'submissions_count' => (int) $submissions_count
        ];
    }
}
