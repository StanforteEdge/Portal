<?php

namespace App\Core\Forms\Controllers;

use App\Core\Forms\Services\FormSubmissionService;
use App\Core\Forms\Models\FormSubmission;
use WP_REST_Request;
use WP_REST_Response;

/**
 * FormSubmissionController
 * 
 * REST API controller for form submissions and workflow
 */
class FormSubmissionController
{
    private $service;

    public function __construct()
    {
        $this->service = new FormSubmissionService();
    }

    /**
     * Submit a form
     * 
     * POST /api/v1/forms/{id}/submit
     */
    public function submitForm(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');
            $formData = $request->get_json_params();
            $currentUser = wp_get_current_user();

            // Organization ID can be passed or determined from user context
            $organizationId = $formData['organization_id'] ?? null;
            unset($formData['organization_id']);

            $result = $this->service->submitForm(
                $formId,
                $formData,
                $currentUser->ID,
                $organizationId
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
     * Get submissions for a form
     * 
     * GET /api/v1/forms/{id}/submissions
     */
    public function getSubmissions(WP_REST_Request $request)
    {
        try {
            $formId = $request->get_param('id');

            $submissions = FormSubmission::getByForm($formId);

            return new WP_REST_Response([
                'success' => true,
                'data' => $submissions
            ], 200);

        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single submission with data
     * 
     * GET /api/v1/submissions/{id}
     */
    public function getSubmission(WP_REST_Request $request)
    {
        try {
            $submissionId = $request->get_param('id');

            $result = $this->service->getSubmissionWithData($submissionId);

            $statusCode = $result['success'] ? 200 : 404;
            return new WP_REST_Response($result, $statusCode);

        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update submission status (workflow)
     * 
     * PUT /api/v1/submissions/{id}/status
     */
    public function updateStatus(WP_REST_Request $request)
    {
        try {
            $submissionId = $request->get_param('id');
            $data = $request->get_json_params();
            $currentUser = wp_get_current_user();

            $result = $this->service->updateStatus(
                $submissionId,
                $data['status'],
                $currentUser->ID,
                $data['notes'] ?? null
            );

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
     * Assign submission to user (workflow)
     * 
     * PUT /api/v1/submissions/{id}/assign
     */
    public function assignSubmission(WP_REST_Request $request)
    {
        try {
            $submissionId = $request->get_param('id');
            $data = $request->get_json_params();
            $currentUser = wp_get_current_user();

            $result = $this->service->assignSubmission(
                $submissionId,
                $data['assigned_to'],
                $currentUser->ID
            );

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
     * Resolve submission (workflow)
     * 
     * PUT /api/v1/submissions/{id}/resolve
     */
    public function resolveSubmission(WP_REST_Request $request)
    {
        try {
            $submissionId = $request->get_param('id');
            $data = $request->get_json_params();
            $currentUser = wp_get_current_user();

            $result = $this->service->resolveSubmission(
                $submissionId,
                $currentUser->ID,
                $data['resolution_notes'] ?? ''
            );

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
     * Get my submissions
     * 
     * GET /api/v1/submissions/my
     */
    public function getMySubmissions(WP_REST_Request $request)
    {
        try {
            $currentUser = wp_get_current_user();

            $submissions = FormSubmission::getByUser($currentUser->ID);

            return new WP_REST_Response([
                'success' => true,
                'data' => $submissions
            ], 200);

        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
