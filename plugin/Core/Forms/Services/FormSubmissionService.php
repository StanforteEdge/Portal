<?php

namespace App\Core\Forms\Services;

use App\Core\Forms\Models\Form;
use App\Core\Forms\Models\FormField;
use App\Core\Forms\Models\FormSubmission;
use App\Core\Forms\Models\FormSubmissionData;
use App\Core\Forms\Models\FormSubmissionHistory;

/**
 * FormSubmissionService
 * 
 * Handles form submission creation, updates, and workflow management
 */
class FormSubmissionService
{
    /**
     * Submit a form
     * 
     * @param string $formId
     * @param array $formData Key-value pairs of field data
     * @param int $submittedBy Profile ID
     * @param string $organizationId
     * @return array Result
     */
    public function submitForm($formId, $formData, $submittedBy, $organizationId = null)
    {
        try {
            // Get form
            $form = new Form();
            $formObj = $form->find($formId);

            if (!$formObj || !$formObj->is_active) {
                return ['success' => false, 'message' => 'Form not found or inactive'];
            }

            // Get form fields
            $fields = FormField::getByForm($formId);

            // Validate data
            $validation = $this->validateSubmissionData($formData, $fields);
            if (!$validation['success']) {
                return $validation;
            }

            // Generate submission number
            $submissionNumber = $this->generateSubmissionNumber($formObj);

            // Create submission
            $submissionId = wp_generate_uuid4();
            $submission = new FormSubmission();

            $defaultStatus = 'submitted';
            if ($formObj->workflow_enabled && !empty($formObj->workflow_statuses)) {
                $statuses = is_string($formObj->workflow_statuses)
                    ? json_decode($formObj->workflow_statuses, true)
                    : $formObj->workflow_statuses;
                $defaultStatus = $statuses[0] ?? 'open';
            }

            $submissionData = [
                'id' => $submissionId,
                'form_id' => $formId,
                'submission_number' => $submissionNumber,
                'submitted_by_profile_id' => $submittedBy,
                'organization_id' => $organizationId,
                'status' => $defaultStatus,
                'submitted_at' => current_time('mysql')
            ];

            $result = $submission->insert($submissionData);

            if (!$result) {
                return ['success' => false, 'message' => 'Failed to create submission'];
            }

            // Store field data (EAV)
            $this->storeSubmissionData($submissionId, $formData, $fields);

            // Log history
            FormSubmissionHistory::logAction(
                $submissionId,
                'created',
                $submittedBy,
                ['notes' => 'Form submitted']
            );

            return [
                'success' => true,
                'message' => 'Form submitted successfully',
                'data' => [
                    'submission_id' => $submissionId,
                    'submission_number' => $submissionNumber
                ]
            ];

        } catch (\Exception $e) {
            error_log('FormSubmissionService::submitForm error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error submitting form: ' . $e->getMessage()];
        }
    }

    /**
     * Store submission data in EAV structure
     * 
     * @param string $submissionId
     * @param array $formData
     * @param array $fields
     * @return void
     */
    private function storeSubmissionData($submissionId, $formData, $fields)
    {
        $submissionDataModel = new FormSubmissionData();

        foreach ($fields as $field) {
            $fieldKey = $field->field_key;

            if (!isset($formData[$fieldKey])) {
                continue; // Skip if not provided
            }

            $value = $formData[$fieldKey];

            // Determine which column to use based on field type
            $dataRow = [
                'id' => null, // Auto-increment
                'submission_id' => $submissionId,
                'field_id' => $field->id,
                'field_key' => $fieldKey,
                'value_text' => null,
                'value_number' => null,
                'value_date' => null,
                'value_datetime' => null,
                'value_file_url' => null
            ];

            switch ($field->field_type) {
                case 'number':
                    $dataRow['value_number'] = floatval($value);
                    break;
                case 'date':
                    $dataRow['value_date'] = $value;
                    break;
                case 'datetime':
                    $dataRow['value_datetime'] = $value;
                    break;
                case 'file':
                    $dataRow['value_file_url'] = $value;
                    break;
                default:
                    // text, textarea, select, checkbox, radio
                    $dataRow['value_text'] = is_array($value) ? json_encode($value) : $value;
            }

            $submissionDataModel->insert($dataRow);
        }
    }

    /**
     * Validate submission data against form fields
     * 
     * @param array $formData
     * @param array $fields
     * @return array
     */
    private function validateSubmissionData($formData, $fields)
    {
        $errors = [];

        foreach ($fields as $field) {
            // Check required fields
            if ($field->is_required && empty($formData[$field->field_key])) {
                $errors[] = "{$field->field_label} is required";
            }

            // Additional validation rules can be added here
            // Based on field->validation_rules JSON
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors
            ];
        }

        return ['success' => true];
    }

    /**
     * Generate unique submission number
     * 
     * @param object $form
     * @return string
     */
    private function generateSubmissionNumber($form)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_form_submissions';

        // Get latest submission number for this form
        $latest = $wpdb->get_var($wpdb->prepare(
            "SELECT submission_number FROM {$table} 
             WHERE form_id = %s 
             ORDER BY created_at DESC LIMIT 1",
            $form->id
        ));

        $prefix = strtoupper(substr($form->name, 0, 3));
        $year = date('Y');

        if ($latest && preg_match('/-(\d+)$/', $latest, $matches)) {
            $number = intval($matches[1]) + 1;
        } else {
            $number = 1;
        }

        return sprintf('%s-%s-%05d', $prefix, $year, $number);
    }

    /**
     * Update submission status (for workflow forms)
     * 
     * @param string $submissionId
     * @param string $newStatus
     * @param int $performedBy
     * @param string $notes
     * @return array
     */
    public function updateStatus($submissionId, $newStatus, $performedBy, $notes = null)
    {
        try {
            $submission = new FormSubmission();
            $existing = $submission->find($submissionId);

            if (!$existing) {
                return ['success' => false, 'message' => 'Submission not found'];
            }

            $oldStatus = $existing->status;

            // Update status
            $submission->update($submissionId, ['status' => $newStatus]);

            // Log history
            FormSubmissionHistory::logAction(
                $submissionId,
                'status_changed',
                $performedBy,
                [
                    'old_value' => $oldStatus,
                    'new_value' => $newStatus,
                    'notes' => $notes
                ]
            );

            return [
                'success' => true,
                'message' => 'Status updated successfully'
            ];

        } catch (\Exception $e) {
            error_log('FormSubmissionService::updateStatus error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Assign submission to user (for workflow forms)
     * 
     * @param string $submissionId
     * @param int $assignedTo
     * @param int $performedBy
     * @return array
     */
    public function assignSubmission($submissionId, $assignedTo, $performedBy)
    {
        try {
            $submission = new FormSubmission();
            $existing = $submission->find($submissionId);

            if (!$existing) {
                return ['success' => false, 'message' => 'Submission not found'];
            }

            // Update assignment
            $submission->update($submissionId, [
                'assigned_to_profile_id' => $assignedTo,
                'status' => 'in_progress' // Auto-change status
            ]);

            // Log history
            FormSubmissionHistory::logAction(
                $submissionId,
                'assigned',
                $performedBy,
                [
                    'new_value' => $assignedTo,
                    'notes' => 'Submission assigned'
                ]
            );

            return [
                'success' => true,
                'message' => 'Submission assigned successfully'
            ];

        } catch (\Exception $e) {
            error_log('FormSubmissionService::assignSubmission error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Resolve submission (for workflow forms)
     * 
     * @param string $submissionId
     * @param int $performedBy
     * @param string $resolutionNotes
     * @return array
     */
    public function resolveSubmission($submissionId, $performedBy, $resolutionNotes)
    {
        try {
            $submission = new FormSubmission();
            $existing = $submission->find($submissionId);

            if (!$existing) {
                return ['success' => false, 'message' => 'Submission not found'];
            }

            // Mark as resolved
            $submission->update($submissionId, [
                'status' => 'resolved',
                'resolved_at' => current_time('mysql'),
                'resolution_notes' => $resolutionNotes
            ]);

            // Log history
            FormSubmissionHistory::logAction(
                $submissionId,
                'resolved',
                $performedBy,
                ['notes' => $resolutionNotes]
            );

            return [
                'success' => true,
                'message' => 'Submission resolved successfully'
            ];

        } catch (\Exception $e) {
            error_log('FormSubmissionService::resolveSubmission error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get submission with data
     * 
     * @param string $submissionId
     * @return array
     */
    public function getSubmissionWithData($submissionId)
    {
        try {
            $submission = new FormSubmission();
            $submissionObj = $submission->find($submissionId);

            if (!$submissionObj) {
                return ['success' => false, 'message' => 'Submission not found'];
            }

            // Get form data as key-value array
            $data = $submissionObj->getDataArray();

            // Get history
            $history = $submissionObj->getHistory();

            return [
                'success' => true,
                'data' => [
                    'submission' => $submissionObj,
                    'form_data' => $data,
                    'history' => $history
                ]
            ];

        } catch (\Exception $e) {
            error_log('FormSubmissionService::getSubmissionWithData error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
