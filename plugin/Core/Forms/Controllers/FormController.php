<?php

namespace App\Core\Forms\Controllers;

use App\Core\Forms\Services\FormService;
use WP_REST_Request;
use WP_REST_Response;

/**
 * FormController
 * 
 * REST API controller for form CRUD operations
 */
class FormController
{
    private $formService;

    public function __construct()
    {
        $this->formService = new FormService();
    }

    /**
     * Get all forms or filter by module
     * 
     * GET /api/v1/forms
     * GET /api/v1/forms?module=finance
     */
    public function getForms(WP_REST_Request $request)
    {
        try {
            $module = $request->get_param('module');

            $form = new \App\Core\Forms\Models\Form();
            $query = $form->where('is_active', true);

            if ($module) {
                $query = $query->where('module', $module);
            }

            $forms = $query->get();

            return new WP_REST_Response([
                'success' => true,
                'data' => $forms
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single form with fields
     * 
     * GET /api/v1/forms/{id}
     */
    public function getForm(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');

            $form = new \App\Core\Forms\Models\Form();
            $formObj = $form->find($formId);

            if (!$formObj) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Form not found'
                ], 404);
            }

            // Include fields
            $fields = $formObj->getFields();

            return new WP_REST_Response([
                'success' => true,
                'data' => [
                    'form' => $formObj,
                    'fields' => $fields
                ]
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new form
     * 
     * POST /api/v1/forms
     */
    public function createForm(WP_REST_Request $request)
    {
        try {
            $formData = $request->get_json_params();
            $currentUser = wp_get_current_user();

            $fields = $formData['fields'] ?? [];
            unset($formData['fields']);

            $result = $this->formService->createForm(
                $formData,
                $fields,
                $currentUser->ID
            );

            $statusCode = $result['success'] ? 201 : 400;
            return new WP_REST_Response($result, $statusCode);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update form
     * 
     * PUT /api/v1/forms/{id}
     */
    public function updateForm(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');
            $formData = $request->get_json_params();

            $result = $this->formService->updateForm($formId, $formData);

            $statusCode = $result['success'] ? 200 : 400;
            return new WP_REST_Response($result, $statusCode);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get database tables for custom storage mapping
     * 
     * GET /api/v1/forms/schema/tables
     */
    public function getDatabaseTables(WP_REST_Request $request)
    {
        try {
            global $wpdb;
            $prefix = $wpdb->prefix . 'sta_';
            $query = "SHOW TABLES LIKE '{$prefix}%'";
            $tables = $wpdb->get_col($query);

            return new WP_REST_Response([
                'success' => true,
                'data' => $tables
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get table columns for custom storage mapping
     * 
     * GET /api/v1/forms/schema/tables/{table}/columns
     */
    public function getTableColumns(WP_REST_Request $request)
    {
        try {
            $table = $request->get_param('table');
            if (empty($table)) {
                throw new \Exception('Table name is required');
            }

            global $wpdb;
            // Validate table name starts with our prefix to prevent arbitrary table access
            if (strpos($table, $wpdb->prefix . 'sta_') !== 0) {
                throw new \Exception('Invalid table name. Only sta_ tables are allowed.');
            }

            $columns = $wpdb->get_results("SHOW COLUMNS FROM `{$table}`");

            return new WP_REST_Response([
                'success' => true,
                'data' => $columns
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete form
     * 
     * DELETE /api/v1/forms/{id}
     */
    public function deleteForm(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');

            $result = $this->formService->deleteForm($formId);

            $statusCode = $result['success'] ? 200 : 400;
            return new WP_REST_Response($result, $statusCode);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign form to users/roles
     * 
     * POST /api/v1/forms/{id}/assign
     */
    public function assignForm(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');
            $assignmentData = $request->get_json_params();

            $result = $this->formService->assignForm($formId, $assignmentData);

            $statusCode = $result['success'] ? 201 : 400;
            return new WP_REST_Response($result, $statusCode);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get forms assigned to current user
     * 
     * GET /api/v1/forms/assigned
     */
    public function getAssignedForms(WP_REST_Request $request)
    {
        try {
            $currentUser = wp_get_current_user();
            $profileId = $currentUser->ID;

            // Get user's primary role
            $roles = $currentUser->roles;
            $role = !empty($roles) ? $roles[0] : null;

            $result = $this->formService->getAssignedForms($profileId, $role);

            return new WP_REST_Response($result, 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
