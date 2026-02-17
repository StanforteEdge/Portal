<?php

namespace App\Modules\HR\Services\Attendance;

class EventHandlers
{
    public function register()
    {
        // Attendance events
        add_action('attendance_checked_in', [$this, 'handleCheckIn']);
        add_action('attendance_checked_out', [$this, 'handleCheckOut']);

        // Time off events
        add_action('time_off_requested', [$this, 'handleTimeOffRequest']);
        add_action('time_off_processed', [$this, 'handleTimeOffProcessed']);
    }

    /**
     * Handle check-in event
     */
    public function handleCheckIn($data)
    {
        $userId = $data['user_id'];
        $record = $data['record'];

        // Notify supervisor
        if ($record->status === 'late') {
            $this->notifySupervisor($userId, 'late_check_in', [
                'time' => $record->check_in,
                'employee' => get_userdata($userId)->display_name
            ]);
        }

        // Update department stats
        $this->updateDepartmentStats($userId);
    }

    /**
     * Handle check-out event
     */
    public function handleCheckOut($data)
    {
        $userId = $data['user_id'];
        $record = $data['record'];

        // Update work hours
        $this->updateWorkHours($userId, $record);

        // Update department stats
        $this->updateDepartmentStats($userId);
    }

    /**
     * Handle time off request event
     */
    public function handleTimeOffRequest($data)
    {
        $userId = $data['user_id'];
        $request = $data['request'];

        // Get supervisor
        $supervisorId = $this->getSupervisor($userId);
        if (!$supervisorId)
            return;

        // Send email notification
        $this->notifySupervisor($supervisorId, 'time_off_request', [
            'employee' => get_userdata($userId)->display_name,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason
        ]);
    }

    /**
     * Handle time off processing event
     */
    public function handleTimeOffProcessed($data)
    {
        $request = $data['request'];
        $status = $data['status'];

        // Notify employee
        $this->notifyEmployee($request->user_id, 'time_off_' . $status, [
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'notes' => $request->notes
        ]);

        // Update calendar if approved
        if ($status === 'approved') {
            $this->updateCalendar($request);
        }
    }

    /**
     * Helper: Notify supervisor
     */
    private function notifySupervisor($supervisorId, $type, $data)
    {
        // This will be implemented when we create the notification system
        do_action('send_notification', [
            'user_id' => $supervisorId,
            'type' => $type,
            'data' => $data
        ]);
    }

    /**
     * Helper: Notify employee
     */
    private function notifyEmployee($userId, $type, $data)
    {
        // This will be implemented when we create the notification system
        do_action('send_notification', [
            'user_id' => $userId,
            'type' => $type,
            'data' => $data
        ]);
    }

    /**
     * Helper: Get user's supervisor
     */
    private function getSupervisor($userId)
    {
        // This will be implemented when we create the HR module
        return get_user_meta($userId, 'supervisor_id', true);
    }

    /**
     * Helper: Update department stats
     */
    private function updateDepartmentStats($userId)
    {
        // This will be implemented when we create the reporting system
        do_action('update_department_stats', [
            'user_id' => $userId,
            'type' => 'attendance'
        ]);
    }

    /**
     * Helper: Update work hours
     */
    private function updateWorkHours($userId, $record)
    {
        // This will be implemented when we create the payroll module
        $hours = (strtotime($record->check_out) - strtotime($record->check_in)) / 3600;
        do_action('update_work_hours', [
            'user_id' => $userId,
            'hours' => $hours,
            'date' => date('Y-m-d', strtotime($record->check_in))
        ]);
    }

    /**
     * Helper: Update calendar
     */
    private function updateCalendar($request)
    {
        // This will be implemented when we create the calendar module
        do_action('update_calendar', [
            'user_id' => $request->user_id,
            'type' => 'time_off',
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'title' => ucfirst($request->type) . ' Leave'
        ]);
    }
}
