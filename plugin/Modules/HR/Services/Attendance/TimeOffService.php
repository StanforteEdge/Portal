<?php

namespace App\Modules\HR\Services\Attendance;

use App\Core\Services\BaseService;
use App\Modules\HR\Models\Attendance\TimeOff;

class TimeOffService extends BaseService
{
    public function __construct()
    {
        $this->model = new TimeOff();
    }

    /**
     * Request time off
     */
    public function request($userId, array $data)
    {
        // Validate request
        $this->validateRequest($userId, $data);

        // Create request
        $request = $this->model->create([
            'user_id' => $userId,
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'reason' => $data['reason'],
            'status' => 'pending'
        ]);

        // Trigger event
        do_action('time_off_requested', [
            'user_id' => $userId,
            'request' => $request
        ]);

        return $request;
    }

    /**
     * Process (approve/reject) a time off request
     */
    public function process($requestId, $status, $processedBy, $notes = '')
    {
        $request = $this->model->find($requestId);

        if (!$request) {
            throw new \Exception('Request not found');
        }

        if ($request->status !== 'pending') {
            throw new \Exception('Request already processed');
        }

        // Update request
        $updated = $this->model->update($requestId, [
            'status' => $status,
            'processed_by' => $processedBy,
            'processed_at' => current_time('mysql'),
            'notes' => $notes
        ]);

        // Trigger event
        do_action('time_off_processed', [
            'request' => $updated,
            'processed_by' => $processedBy,
            'status' => $status
        ]);

        return $updated;
    }

    /**
     * Get user's time off balance
     */
    public function getBalance($userId, $type = 'vacation')
    {
        return $this->model->getUserBalance($userId, $type);
    }

    /**
     * Get department's pending requests
     */
    public function getDepartmentRequests($departmentId)
    {
        return $this->model->getPendingByDepartment($departmentId);
    }

    /**
     * Validate time off request
     */
    private function validateRequest($userId, $data)
    {
        // Check required fields
        $required = ['type', 'start_date', 'end_date', 'reason'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \Exception("Field {$field} is required");
            }
        }

        // Check dates
        $startDate = strtotime($data['start_date']);
        $endDate = strtotime($data['end_date']);

        if ($startDate > $endDate) {
            throw new \Exception('End date must be after start date');
        }

        if ($startDate < strtotime('today')) {
            throw new \Exception('Cannot request time off in the past');
        }

        // Check for overlapping requests
        if ($this->model->hasOverlapping($userId, $data['start_date'], $data['end_date'])) {
            throw new \Exception('You have overlapping time off requests');
        }

        // Check balance
        $balance = $this->getBalance($userId, $data['type']);
        $requestDays = floor(($endDate - $startDate) / (60 * 60 * 24)) + 1;

        if ($requestDays > $balance['remaining']) {
            throw new \Exception("Insufficient {$data['type']} days remaining");
        }

        return true;
    }
}
