<?php

namespace App\Modules\HR\Controllers\Attendance;

use App\Utils\BaseController;
use App\Modules\HR\Attendance\AttendanceService;

class AttendanceController extends BaseController
{
    public function __construct()
    {
        $this->service = new AttendanceService();
    }

    /**
     * Handle check-in request
     */
    public function checkIn()
    {
        try {
            $userId = get_current_user_id();
            $record = $this->service->checkIn($userId);
            return $this->success($record, 'Successfully checked in');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Handle check-out request
     */
    public function checkOut()
    {
        try {
            $userId = get_current_user_id();
            $record = $this->service->checkOut($userId);
            return $this->success($record, 'Successfully checked out');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Get current attendance status
     */
    public function getStatus()
    {
        try {
            $userId = get_current_user_id();
            $status = $this->service->getStatus($userId);
            return $this->success($status);
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Get attendance records
     */
    public function getRecords()
    {
        try {
            $userId = $this->input('user_id', get_current_user_id());
            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');

            // Check permission if requesting other user's records
            if ($userId !== get_current_user_id()) {
                $this->checkPermission('view_others_attendance');
            }

            $records = $this->service->getRecords($userId, $startDate, $endDate);
            return $this->success($records);
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Admin: Get department attendance
     */
    public function getDepartmentAttendance()
    {
        try {
            $this->checkPermission('view_department_attendance');

            $departmentId = $this->input('department_id');
            $date = $this->input('date', current_time('Y-m-d'));

            // Implementation will come later
            return $this->success([]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }
}
