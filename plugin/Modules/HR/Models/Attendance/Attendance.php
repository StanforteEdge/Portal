<?php

namespace App\Modules\HR\Models\Attendance;

use App\Utils\BaseModel;

class Attendance extends BaseModel
{
    protected $table = 'attendance_records';

    protected $fillable = [
        'user_id',
        'check_in',
        'check_out',
        'work_mode', // office, remote, hybrid
        'status',    // present, absent, late
        'notes'
    ];

    /**
     * Get active session for a user
     */
    public function getActiveSession($userId)
    {
        return $this->where('user_id', $userId)
            ->where('check_out', 'IS', null)
            ->first();
    }

    /**
     * Get records within date range
     */
    public function getRecords($userId, $startDate = null, $endDate = null)
    {
        $query = "SELECT * FROM {$this->table} WHERE user_id = %d";
        $params = [$userId];

        if ($startDate) {
            $query .= " AND check_in >= %s";
            $params[] = $startDate;
        }

        if ($endDate) {
            $query .= " AND check_in <= %s";
            $params[] = $endDate;
        }

        return $this->db->get_results(
            $this->db->prepare($query, ...$params)
        );
    }

    /**
     * Get attendance stats for a user
     */
    public function getStats($userId, $startDate = null, $endDate = null)
    {
        $records = $this->getRecords($userId, $startDate, $endDate);

        return [
            'total_days' => count($records),
            'present' => count(array_filter($records, fn($r) => $r->status === 'present')),
            'late' => count(array_filter($records, fn($r) => $r->status === 'late')),
            'absent' => count(array_filter($records, fn($r) => $r->status === 'absent'))
        ];
    }
}
