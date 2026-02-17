<?php

namespace App\Modules\HR\Attendance\Contracts;

interface AttendanceInterface
{
    /**
     * Record check-in for a user
     */
    public function checkIn($userId);

    /**
     * Record check-out for a user
     */
    public function checkOut($userId);

    /**
     * Get current attendance status for a user
     */
    public function getStatus($userId);

    /**
     * Get attendance records for a user within a date range
     */
    public function getRecords($userId, $startDate = null, $endDate = null);

    /**
     * Request time off
     */
    public function requestTimeOff($userId, array $data);

    /**
     * Get time off requests for a user or department
     */
    public function getTimeOffRequests($userId = null, $departmentId = null);

    /**
     * Process time off request (approve/reject)
     */
    public function processTimeOffRequest($requestId, $status, $processedBy);
}
