<?php

namespace App\Core\Organization\Services;

use App\Core\Organization\Models\Organization;
use Exception;

class OrganizationService
{

    private $organization;

    public function __construct()
    {
        $this->organization = new Organization();
    }
    /**
     * List organizations with filters
     * 
     * @param array $params
     * @return array
     */
    public function listOrganizations(array $params = [])
    {
        // Optional Filter by Type
        if (!empty($params['type'])) {
            $this->organization->where('organization_type', $params['type']);
        }

        // Active Only (default unless filtered)
        if (!isset($params['show_inactive']) || !$params['show_inactive']) {
            $this->organization->where('is_active', 1);
        }

        return $this->organization->get();
    }

    /**
     * Create a new organization
     * 
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function createOrganization(array $data)
    {

        // Basic validation
        if (empty($data['name']) || empty($data['code'])) {
            throw new Exception('Name and Code are required', 400);
        }

        // Check if code exists
        if ($this->organization->where('code', $data['code'])->first()) {
            throw new Exception('Organization code already exists', 400);
        }

        if (empty($data['organization_type'])) {
            $data['organization_type'] = 'venture';
        }

        // Ensure parent_id is handled if passed (though controller logic didn't explicitly check it, model has it)

        return $this->organization->create($data);
    }

    /**
     * Update an organization
     * 
     * @param string $id
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function updateOrganization($id, array $data)
    {
        $org = $this->organization->find($id);

        if (!$org) {
            throw new Exception('Organization not found', 404);
        }

        // Prevent duplicate code if updating code
        if (!empty($data['code']) && $data['code'] !== $org->code) {
            if ($this->organization->where('code', $data['code'])->where('id', '!=', $id)->first()) {
                throw new Exception('Organization code already taken', 400);
            }
        }

        $this->organization->update($id, $data);
        return $this->organization->find($id);
    }

    /**
     * Get organizations for the current user
     * 
     * @return array
     */
    public function getMyOrganizations($user)
    {
        return \App\Core\Organization\Models\ProfileOrganization::getOrganizationsForProfile($user->id);
    }

    /**
     * Delete an organization
     * 
     * @param string $id
     * @return bool
     * @throws Exception
     */
    public function deleteOrganization($id)
    {

        if (!$this->organization->find($id)) {
            throw new Exception('Organization not found', 404);
        }

        // Check for dependencies?
        // For now, allow delete
        return $this->organization->delete($id);
    }
}
