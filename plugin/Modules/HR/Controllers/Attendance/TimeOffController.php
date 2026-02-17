<?php

namespace App\Modules\HR\Controllers\Attendance;

use App\Utils\BaseController;
use App\Modules\HR\Attendance\TimeOffService;

class TimeOffController extends BaseController
{
    public function __construct()
    {
        $this->service = new TimeOffService();
    }

    /**
     * Request time off
     */
    public function request()
    {
        try {
            $userId = get_current_user_id();
            $data = $this->all();

            $request = $this->service->request($userId, $data);
            return $this->success($request, 'Time off request submitted successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Process a time off request
     */
    public function process()
    {
        try {
            $this->checkPermission('process_time_off');

            $requestId = $this->input('request_id');
            $status = $this->input('status');
            $notes = $this->input('notes', '');
            $processedBy = get_current_user_id();

            $request = $this->service->process($requestId, $status, $processedBy, $notes);
            return $this->success($request, 'Request processed successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Get time off balance
     */
    public function getBalance()
    {
        try {
            $userId = $this->input('user_id', get_current_user_id());
            $type = $this->input('type', 'vacation');

            // Check permission if requesting other user's balance
            if ($userId !== get_current_user_id()) {
                $this->checkPermission('view_others_balance');
            }

            $balance = $this->service->getBalance($userId, $type);
            return $this->success($balance);
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Get department requests
     */
    public function getDepartmentRequests()
    {
        try {
            $this->checkPermission('view_department_requests');

            $departmentId = $this->input('department_id');
            if (!$departmentId) {
                throw new \Exception('Department ID is required');
            }

            $requests = $this->service->getDepartmentRequests($departmentId);
            return $this->success($requests);
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }
}
