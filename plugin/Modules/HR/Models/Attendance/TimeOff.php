<?php

namespace App\Modules\HR\Models\Attendance;

use App\Utils\BaseModel;

class TimeOff extends BaseModel
{
    protected $table = 'attendance_time_off';

    protected $fillable = [
        'user_id',
        'type',          // vacation, sick, personal, etc
        'start_date',
        'end_date',
        'status',        // pending, approved, rejected
        'reason',
        'processed_by',
        'processed_at',
        'notes'
    ];

    /**
     * Get pending requests for a department
     */
    public function getPendingByDepartment($departmentId)
    {
        $query = "
            SELECT r.*, u.display_name as employee_name 
            FROM {$this->table} r
            JOIN {$this->db->users} u ON r.user_id = u.ID
            JOIN {$this->db->prefix}user_department ud ON u.ID = ud.user_id
            WHERE ud.department_id = %d 
            AND r.status = 'pending'
            ORDER BY r.created_at DESC
        ";

        return $this->db->get_results(
            $this->db->prepare($query, $departmentId)
        );
    }

    /**
     * Get user's time off balance
     */
    public function getUserBalance($userId, $type = 'vacation')
    {
        $query = "
            SELECT 
                COALESCE(SUM(DATEDIFF(end_date, start_date)), 0) as days_taken
            FROM {$this->table}
            WHERE user_id = %d 
            AND type = %s
            AND status = 'approved'
            AND YEAR(start_date) = YEAR(CURRENT_DATE())
        ";

        $result = $this->db->get_row(
            $this->db->prepare($query, $userId, $type)
        );

        // Get total allowed days from settings (will implement later)
        $allowed_days = 20; // placeholder

        return [
            'total' => $allowed_days,
            'used' => $result->days_taken,
            'remaining' => $allowed_days - $result->days_taken
        ];
    }

    /**
     * Check for overlapping time off requests
     */
    public function hasOverlapping($userId, $startDate, $endDate, $excludeId = null)
    {
        $query = "
            SELECT COUNT(*) as count 
            FROM {$this->table}
            WHERE user_id = %d
            AND status != 'rejected'
            AND (
                (start_date BETWEEN %s AND %s)
                OR (end_date BETWEEN %s AND %s)
                OR (%s BETWEEN start_date AND end_date)
            )
        ";

        if ($excludeId) {
            $query .= " AND id != %d";
            $params = [$userId, $startDate, $endDate, $startDate, $endDate, $startDate, $excludeId];
        } else {
            $params = [$userId, $startDate, $endDate, $startDate, $endDate, $startDate];
        }

        $result = $this->db->get_row(
            $this->db->prepare($query, ...$params)
        );

        return $result->count > 0;
    }
}
