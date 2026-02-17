<?php

namespace App\Modules\HR\Services\Employee;

use App\Modules\HR\Models\Employee\EmployeeData;
use App\Core\User\Models\User;
use App\Core\Contact\Services\ContactService;
use Exception;

/**
 * Employee Service
 * 
 * Business logic for employee management
 */
class EmployeeService
{
    private $employeeModel;
    private $userModel;
    private $contactService;

    public function __construct()
    {
        $this->employeeModel = new EmployeeData();
        $this->userModel = new User();
        $this->contactService = new ContactService();
    }

    /**
     * Get employees with filters and pagination
     * 
     * @param array $filters Filters (department_id, manager_id, status, employment_type, search)
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated employee list
     */
    public function getEmployees($filters = [], $page = 1, $perPage = 20)
    {
        return $this->employeeModel->searchEmployees($filters, $page, $perPage);
    }

    /**
     * Get all profiles for employee assignment
     * 
     * @return array Array of user profiles
     */
    public function getProfiles()
    {
        // Use Admin UserManagementService to get all users
        $result = \App\Modules\Admin\Services\UserManagementService::getUsers(
            [], // No filters - get all users
            ['created_at' => 'desc'], // Order by creation date
            1, // Page 1
            1000 // Large limit to get all users
        );

        return $result['data'] ?? [];
    }

    /**
     * Get employee by ID (with profile data and contacts)
     * 
     * @param int $id Employee data ID
     * @return array|null Employee with full details
     */
    public function getEmployeeById($id)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            return null;
        }

        // Get profile data
        $profile = $this->userModel->find($employee->profile_id);

        // Get contacts
        $contacts = $this->contactService->getContactsForEntity('employee', $employee->profile_id);

        // Get manager info if exists
        $manager = null;
        if ($employee->manager_id) {
            $manager = $this->userModel->find($employee->manager_id);
        }

        // Get structural assignments
        $orgResult = \App\Core\Organization\Models\ProfileOrganization::getOrganizationsForProfile($employee->profile_id);
        $primaryOrg = !empty($orgResult) ? array_filter($orgResult, fn($o) => !empty($o->is_primary)) : [];
        $organization = !empty($primaryOrg) ? reset($primaryOrg) : (!empty($orgResult) ? $orgResult[0] : null);

        $deptResult = \App\Core\User\Services\GroupService::getUserGroups($employee->profile_id, 'department');
        $department = $deptResult['success'] && !empty($deptResult['groups']) ? $deptResult['groups'][0] : null;

        $teamResult = \App\Core\User\Services\GroupService::getUserGroups($employee->profile_id, 'team');
        $team = $teamResult['success'] && !empty($teamResult['groups']) ? $teamResult['groups'][0] : null;

        return [
            'employee_data' => array_merge((array) $employee, [
                'organization_id' => $organization->id ?? null,
                'department_id' => $department->id ?? null,
                'team_id' => $team->id ?? null
            ]),
            'profile' => $profile,
            'contacts' => $contacts,
            'manager' => $manager,
            'organization' => $organization,
            'department' => $department,
            'team' => $team
        ];
    }

    /**
     * Get employee by profile ID
     * 
     * @param int $profileId Profile ID
     * @return array|null Employee with full details
     */
    public function getEmployeeByProfileId($profileId)
    {
        $employee = $this->employeeModel->findByProfileId($profileId);
        if (!$employee) {
            return null;
        }

        return $this->getEmployeeById($employee->id);
    }

    /**
     * Create a new employee
     * 
     * @param array $data Employee data
     * @return array Created employee
     * @throws Exception
     */
    public function createEmployee($data)
    {
        // Validate required fields
        if (empty($data['profile_id']) || empty($data['employee_id']) || empty($data['employment_type'])) {
            throw new Exception('Profile ID, Employee ID, and Employment Type are required');
        }

        // Check if profile exists
        $profile = $this->userModel->find($data['profile_id']);
        if (!$profile) {
            throw new Exception('Profile not found');
        }

        // Check if employee_id is unique
        $existing = $this->employeeModel->findByEmployeeId($data['employee_id']);
        if ($existing) {
            throw new Exception('Employee ID already exists');
        }

        // Check if profile already has employee data
        $existingEmployee = $this->employeeModel->findByProfileId($data['profile_id']);
        if ($existingEmployee) {
            throw new Exception('Profile already has employee data');
        }

        // Prepare employee data
        $employeeData = [
            'profile_id' => $data['profile_id'],
            'employee_id' => $data['employee_id'],
            'employment_type' => $data['employment_type'],
            'position' => $data['position'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'manager_id' => $data['manager_id'] ?? null,
            'join_date' => $data['join_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'employment_status' => $data['employment_status'] ?? 'active',
            'national_id' => $data['national_id'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'pension_id' => $data['pension_id'] ?? null,
            'work_email' => $data['work_email'] ?? null,
            'work_phone' => $data['work_phone'] ?? null,
            'probation_end_date' => $data['probation_end_date'] ?? null,
            'contract_end_date' => $data['contract_end_date'] ?? null,
            'metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null,
        ];

        // Create employee
        $employeeId = $this->employeeModel->create($employeeData);
        if (!$employeeId) {
            throw new Exception('Failed to create employee');
        }

        // Handle structural assignments
        $this->handleStructuralAssignments($data['profile_id'], $data);

        return $this->getEmployeeById($employeeId);
    }

    /**
     * Handle structural assignments (Organization, Department, Team)
     * 
     * @param int $profileId Profile ID
     * @param array $data Assignment data
     * @return void
     */
    private function handleStructuralAssignments($profileId, $data)
    {
        // 1. Assign to Organization
        if (!empty($data['organization_id'])) {
            \App\Core\Organization\Models\ProfileOrganization::assign(
                $profileId,
                $data['organization_id'],
                true // Set as primary
            );
        }

        // 2. Assign to Department (Group type: department)
        if (!empty($data['department_id'])) {
            \App\Core\User\Services\GroupService::addUserToGroup(
                (int) $data['department_id'],
                $profileId,
                'member',
                get_current_user_id()
            );
        }

        // 3. Assign to Team (Group type: team)
        if (!empty($data['team_id'])) {
            \App\Core\User\Services\GroupService::addUserToGroup(
                (int) $data['team_id'],
                $profileId,
                'member',
                get_current_user_id()
            );
        }
    }

    /**
     * Update employee data
     * 
     * @param int $id Employee data ID
     * @param array $data Updated employee data
     * @return array Updated employee
     * @throws Exception
     */
    public function updateEmployee($id, $data)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            throw new Exception('Employee not found');
        }

        // Check if employee_id is being changed and is unique
        if (isset($data['employee_id']) && $data['employee_id'] !== $employee->employee_id) {
            $existing = $this->employeeModel->findByEmployeeId($data['employee_id']);
            if ($existing) {
                throw new Exception('Employee ID already exists');
            }
        }

        // Prepare update data
        $updateData = [];
        $allowedFields = [
            'employee_id',
            'employment_type',
            'position',
            'department_id',
            'manager_id',
            'join_date',
            'end_date',
            'employment_status',
            'national_id',
            'tax_id',
            'pension_id',
            'work_email',
            'work_phone',
            'probation_end_date',
            'contract_end_date',
            'metadata'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'metadata') {
                    $updateData[$field] = json_encode($data[$field]);
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        // Update employee
        $success = $this->employeeModel->update($id, $updateData);
        if (!$success) {
            throw new Exception('Failed to update employee');
        }

        // Handle structural assignments (if provided)
        if (isset($data['organization_id']) || isset($data['department_id']) || isset($data['team_id'])) {
            $this->handleStructuralAssignments($employee->profile_id, $data);
        }

        return $this->getEmployeeById($id);
    }

    /**
     * Update employment status
     * 
     * @param int $id Employee data ID
     * @param string $status New status
     * @param string|null $reason Reason for status change
     * @param string|null $effectiveDate Effective date
     * @return array Updated employee
     * @throws Exception
     */
    public function updateEmploymentStatus($id, $status, $reason = null, $effectiveDate = null)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            throw new Exception('Employee not found');
        }

        $validStatuses = ['active', 'inactive', 'on_leave', 'terminated'];
        if (!in_array($status, $validStatuses)) {
            throw new Exception('Invalid employment status');
        }

        $updateData = ['employment_status' => $status];

        // If terminating, set end_date
        if ($status === 'terminated' && $effectiveDate) {
            $updateData['end_date'] = $effectiveDate;
        }

        // Store reason in metadata
        if ($reason) {
            $metadata = json_decode($employee->metadata ?? '{}', true);
            $metadata['status_changes'] = $metadata['status_changes'] ?? [];
            $metadata['status_changes'][] = [
                'status' => $status,
                'reason' => $reason,
                'date' => $effectiveDate ?? current_time('mysql'),
                'changed_by' => get_current_user_id()
            ];
            $updateData['metadata'] = json_encode($metadata);
        }

        $success = $this->employeeModel->update($id, $updateData);
        if (!$success) {
            throw new Exception('Failed to update employment status');
        }

        return $this->getEmployeeById($id);
    }

    /**
     * Delete employee (soft delete)
     * 
     * @param int $id Employee data ID
     * @return bool Success status
     * @throws Exception
     */
    public function deleteEmployee($id)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            throw new Exception('Employee not found');
        }

        return $this->employeeModel->delete($id);
    }

    /**
     * Get employees by department
     * 
     * @param string $departmentId Department ID
     * @return array Array of employees
     */
    public function getEmployeesByDepartment($departmentId)
    {
        return $this->employeeModel->getByDepartment($departmentId);
    }

    /**
     * Get employees by manager
     * 
     * @param int $managerId Manager profile ID
     * @return array Array of employees
     */
    public function getEmployeesByManager($managerId)
    {
        return $this->employeeModel->getByManager($managerId);
    }

    /**
     * Search employees
     * 
     * @param string $query Search query
     * @return array Array of employees
     */
    public function searchEmployees($query)
    {
        return $this->getEmployees(['search' => $query]);
    }
}
