<?php

namespace App\Modules\HR\Controllers\Employee;

use App\Utils\BaseController;
use App\Modules\HR\Services\Employee\EmployeeService;
use WP_REST_Request;

/**
 * Employee Controller
 * 
 * Handles HTTP requests for employee management
 */
class EmployeeController extends BaseController
{
    private $employeeService;
    private $skillService;

    public function __construct()
    {
        $this->employeeService = new EmployeeService();
        $this->skillService = new SkillService();
    }

    /**
     * Get employees list with filters
     * 
     * GET /api/v1/hr/employees?search=&department=&status=&employment_type=&page=1&per_page=20
     */
    public static function index(WP_REST_Request $request)
    {
        try {
            $controller = new self();

            $filters = [
                'search' => $request->get_param('search'),
                'department_id' => $request->get_param('department'),
                'employment_status' => $request->get_param('status'),
                'employment_type' => $request->get_param('employment_type'),
                'manager_id' => $request->get_param('manager'),
            ];

            // Remove null filters
            $filters = array_filter($filters, function ($value) {
                return $value !== null && $value !== '';
            });

            $page = $request->get_param('page') ?? 1;
            $perPage = $request->get_param('per_page') ?? 20;

            $result = $controller->employeeService->getEmployees($filters, $page, $perPage);

            return self::success($result);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Get a single employee
     * 
     * GET /api/v1/hr/employees/{id}
     */
    public static function show(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $id = $request->get_param('id');

            $employee = $controller->employeeService->getEmployeeById($id);
            if (!$employee) {
                return self::error('not_found', 'Employee not found', 404);
            }

            return self::success($employee);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Create a new employee
     * 
     * POST /api/v1/hr/employees
     * Body: { profile_id, employee_id, employment_type, position, department_id, ... }
     */
    public static function store(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $data = $request->get_json_params();

            $employee = $controller->employeeService->createEmployee($data);

            return self::success([
                'employee' => $employee,
                'message' => 'Employee created successfully'
            ], 201);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Update an employee
     * 
     * PUT /api/v1/hr/employees/{id}
     * Body: { position, department_id, manager_id, ... }
     */
    public static function update(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $id = $request->get_param('id');
            $data = $request->get_json_params();

            $employee = $controller->employeeService->updateEmployee($id, $data);

            return self::success([
                'employee' => $employee,
                'message' => 'Employee updated successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Delete an employee
     * 
     * DELETE /api/v1/hr/employees/{id}
     */
    public static function destroy(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $id = $request->get_param('id');

            $controller->employeeService->deleteEmployee($id);

            return self::success([
                'message' => 'Employee deleted successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Update employment status
     * 
     * PUT /api/v1/hr/employees/{id}/status
     * Body: { status, reason, effective_date }
     */
    public static function updateStatus(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $id = $request->get_param('id');
            $data = $request->get_json_params();

            $status = $data['status'] ?? null;
            $reason = $data['reason'] ?? null;
            $effectiveDate = $data['effective_date'] ?? null;

            if (!$status) {
                return self::error('validation_error', 'Status is required', 400);
            }

            $employee = $controller->employeeService->updateEmploymentStatus($id, $status, $reason, $effectiveDate);

            return self::success([
                'employee' => $employee,
                'message' => 'Employment status updated successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Get employee contacts
     * 
     * GET /api/v1/hr/employees/{id}/contacts?type=emergency
     */
    public static function getContacts(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $id = $request->get_param('id');
            $contactType = $request->get_param('type');

            $employee = $controller->employeeService->getEmployeeById($id);
            if (!$employee) {
                return self::error('not_found', 'Employee not found', 404);
            }

            // Filter contacts by type if specified
            $contacts = $employee['contacts'];
            if ($contactType) {
                $contacts = array_filter($contacts, function ($contact) use ($contactType) {
                    return $contact->contact_type === $contactType;
                });
                $contacts = array_values($contacts); // Re-index array
            }

            return self::success([
                'contacts' => $contacts,
                'total' => count($contacts)
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Get all profiles for employee assignment
     * 
     * GET /api/v1/hr/profiles
     */
    public static function getProfiles(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $profiles = $controller->employeeService->getProfiles();

            return self::success([
                'data' => $profiles,
                'total' => count($profiles)
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }
}
