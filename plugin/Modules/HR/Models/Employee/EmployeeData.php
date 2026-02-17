<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

/**
 * Employee Data Model
 * 
 * Manages employment-specific information for employees
 * Links to sta_profiles for basic user data
 */
class EmployeeData extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_employee_data';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'profile_id',
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
        'metadata',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * @var bool Whether to use soft deletes
     */
    protected $softDeletes = true;

    /**
     * Find employee by profile ID
     * 
     * @param int $profileId Profile ID
     * @return object|null Employee data or null
     */
    public function findByProfileId($profileId)
    {
        return $this->where('profile_id', $profileId)->first();
    }

    /**
     * Find employee by employee ID
     * 
     * @param string $employeeId Employee ID
     * @return object|null Employee data or null
     */
    public function findByEmployeeId($employeeId)
    {
        return $this->where('employee_id', $employeeId)->first();
    }

    /**
     * Get employees by department
     * 
     * @param string $departmentId Department ID (taxonomy term ID)
     * @return array Array of employee data
     */
    public function getByDepartment($departmentId)
    {
        return $this->where('department_id', $departmentId)
            ->where('employment_status', 'active')
            ->get();
    }

    /**
     * Get employees by manager
     * 
     * @param int $managerId Manager profile ID
     * @return array Array of employee data
     */
    public function getByManager($managerId)
    {
        return $this->where('manager_id', $managerId)
            ->where('employment_status', 'active')
            ->get();
    }

    /**
     * Get employees by status
     * 
     * @param string $status Employment status
     * @return array Array of employee data
     */
    public function getByStatus($status)
    {
        return $this->where('employment_status', $status)->get();
    }

    /**
     * Get employees by employment type
     * 
     * @param string $type Employment type
     * @return array Array of employee data
     */
    public function getByEmploymentType($type)
    {
        return $this->where('employment_type', $type)
            ->where('employment_status', 'active')
            ->get();
    }

    /**
     * Search employees with filters
     * 
     * @param array $filters Filters (department_id, manager_id, status, employment_type, search)
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public function searchEmployees($filters = [], $page = 1, $perPage = 20)
    {
        global $wpdb;

        // Build query with joins to get profile data
        $query = "SELECT 
            ed.*,
            p.first_name,
            p.last_name,
            p.email,
            p.phone,
            p.avatar
        FROM {$wpdb->prefix}sta_employee_data ed
        LEFT JOIN {$wpdb->prefix}sta_profiles p ON ed.profile_id = p.id
        WHERE ed.deleted_at IS NULL";

        $params = [];

        // Apply filters
        if (!empty($filters['department_id'])) {
            $query .= " AND ed.department_id = %s";
            $params[] = $filters['department_id'];
        }

        if (!empty($filters['manager_id'])) {
            $query .= " AND ed.manager_id = %d";
            $params[] = $filters['manager_id'];
        }

        if (!empty($filters['employment_status'])) {
            $query .= " AND ed.employment_status = %s";
            $params[] = $filters['employment_status'];
        }

        if (!empty($filters['employment_type'])) {
            $query .= " AND ed.employment_type = %s";
            $params[] = $filters['employment_type'];
        }

        if (!empty($filters['search'])) {
            $query .= " AND (
                ed.employee_id LIKE %s OR
                p.first_name LIKE %s OR
                p.last_name LIKE %s OR
                p.email LIKE %s OR
                ed.position LIKE %s
            )";
            $searchTerm = '%' . $wpdb->esc_like($filters['search']) . '%';
            $params = array_merge($params, array_fill(0, 5, $searchTerm));
        }

        // Count total
        $countQuery = "SELECT COUNT(*) FROM ({$query}) as count_table";
        $total = $wpdb->get_var($params ? $wpdb->prepare($countQuery, $params) : $countQuery);

        // Add pagination
        $offset = ($page - 1) * $perPage;
        $query .= " ORDER BY p.first_name, p.last_name LIMIT %d OFFSET %d";
        $params[] = $perPage;
        $params[] = $offset;

        // Get results
        $results = $wpdb->get_results($wpdb->prepare($query, $params));

        return [
            'data' => $results,
            'total' => (int) $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
}
