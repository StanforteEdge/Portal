<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

class Employee extends BaseModel
{
    protected $table = 'staff_profiles';

    protected $fillable = [
        'wp_user_id',
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'department_id',
        'position_id',
        'status',
        'hire_date'
    ];

    /**
     * Generate a unique employee ID
     */
    public static function generateEmployeeId()
    {
        global $wpdb;
        $year = date('Y');
        $month = date('m');
        $prefix = "SE{$year}{$month}";

        $latest = $wpdb->get_var($wpdb->prepare(
            "SELECT employee_id FROM {$wpdb->prefix}staff_profiles 
             WHERE employee_id LIKE %s 
             ORDER BY employee_id DESC 
             LIMIT 1",
            $prefix . '%'
        ));

        if ($latest) {
            $sequence = intval(substr($latest, -3)) + 1;
        } else {
            $sequence = 1;
        }

        return $prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Create a new employee with WordPress user
     */
    public function createWithUser(array $data)
    {
        $userdata = [
            'user_login' => $data['email'],
            'user_email' => $data['email'],
            'user_pass' => wp_generate_password(),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'role' => 'employee'
        ];

        $user_id = wp_insert_user($userdata);
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $data['wp_user_id'] = $user_id;
        $data['employee_id'] = self::generateEmployeeId();
        return $this->create($data);
    }

    /**
     * Get employee with related data
     */
    public function findWithDetails($id)
    {
        return $this->wpdb->get_row($this->wpdb->prepare("
            SELECT 
                p.*,
                u.user_email,
                d.name as department_name,
                pos.title as position_title,
                t.name as team_name,
                CASE WHEN tm.is_lead = 1 THEN true ELSE false END as is_team_lead
            FROM {$this->table} p
            LEFT JOIN {$this->wpdb->users} u ON p.wp_user_id = u.ID
            LEFT JOIN {$this->wpdb->prefix}staff_departments d ON p.department_id = d.id
            LEFT JOIN {$this->wpdb->prefix}staff_positions pos ON p.position_id = pos.id
            LEFT JOIN {$this->wpdb->prefix}staff_team_members tm ON p.id = tm.employee_id
            LEFT JOIN {$this->wpdb->prefix}staff_teams t ON tm.team_id = t.id
            WHERE p.id = %d
        ", $id));
    }

    /**
     * Get all employees with their basic details
     */
    public function getAllWithDetails()
    {
        return $this->wpdb->get_results("
            SELECT 
                p.*,
                u.user_email,
                d.name as department_name,
                pos.title as position_title
            FROM {$this->table} p
            LEFT JOIN {$this->wpdb->users} u ON p.wp_user_id = u.ID
            LEFT JOIN {$this->wpdb->prefix}staff_departments d ON p.department_id = d.id
            LEFT JOIN {$this->wpdb->prefix}staff_positions pos ON p.position_id = pos.id
            ORDER BY p.first_name, p.last_name
        ");
    }

    /**
     * Delete employee and associated WordPress user
     */
    public function deleteWithUser($id)
    {
        $employee = $this->find($id);
        if (!$employee) {
            return false;
        }

        if ($employee->wp_user_id) {
            wp_delete_user($employee->wp_user_id);
        }

        return $this->delete($id);
    }
}
