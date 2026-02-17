<?php

namespace App\Core\Organization\Controllers;

use App\Utils\BaseController;
use App\Core\Organization\Services\OrganizationService;
use WP_REST_Request;
use WP_REST_Response;

class OrganizationController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new OrganizationService();
    }

    /**
     * Get list of organizations
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function index(WP_REST_Request $request)
    {
        try {
            $params = $request->get_params();
            $organizations = $this->service->listOrganizations($params);

            return $this->success($organizations);
        } catch (\Exception $e) {
            return $this->error('org_list_error', $e->getMessage(), 500);
        }
    }

    /**
     * Get user's organizations
     */
    public function getMyOrganizations(WP_REST_Request $request)
    {
        try {
            $user = $request->get_param('user');
            $organizations = $this->service->getMyOrganizations($user);
            return $this->success($organizations);
        } catch (\Exception $e) {
            return $this->error('org_my_list_error', $e->getMessage(), 500);
        }
    }

    /**
     * Create a new organization
     */
    public function create(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            $org = $this->service->createOrganization($data);
            return $this->success($org, 201);
        } catch (\Exception $e) {
            return $this->error('org_create_error', $e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Update an organization
     */
    public function update(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_json_params();

            $updated = $this->service->updateOrganization($id, $data);
            return $this->success($updated);
        } catch (\Exception $e) {
            return $this->error('org_update_error', $e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Delete an organization
     */
    public function delete(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $this->service->deleteOrganization($id);
            return $this->success(['message' => 'Organization deleted']);
        } catch (\Exception $e) {
            return $this->error('org_delete_error', $e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
