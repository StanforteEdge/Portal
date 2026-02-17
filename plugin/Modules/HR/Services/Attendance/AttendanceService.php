<?php
namespace App\Modules\HR\Services\Attendance;

use App\Modules\HR\Models\Attendance\Attendance;
use App\Modules\HR\Models\Attendance\TimeOff;

class AttendanceService
{
    private $attendanceModel;
    private $timeOffModel;

    public function __construct()
    {
        $this->attendanceModel = new Attendance();
        $this->timeOffModel = new TimeOff();
    }

    public function initialize()
    {
        // Tables are managed via migrations, but we can keep this for safety or remove it
        // The models automatically use the correct table names.

        // Register REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Register AJAX handlers
        add_action('wp_ajax_record_attendance', array($this, 'handle_record_attendance'));
        add_action('wp_ajax_update_checkout', array($this, 'handle_update_checkout'));
        add_action('wp_ajax_submit_time_off', array($this, 'handle_submit_time_off'));
    }

    public function register_rest_routes()
    {
        register_rest_route('attendance/v1', '/record', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_record_attendance'),
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            }
        ));

        register_rest_route('attendance/v1', '/time-off', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_submit_time_off'),
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            }
        ));
    }

    // AJAX Handlers
    public function handle_record_attendance()
    {
        check_ajax_referer('attendance_nonce', 'nonce');

        $user_id = get_current_user_id();
        $status = sanitize_text_field($_POST['status']);
        $work_mode = sanitize_text_field($_POST['work_mode']);

        $result = $this->attendanceModel->create([
            'user_id' => $user_id,
            'status' => $status,
            'work_mode' => $work_mode,
            'check_in' => current_time('mysql')
        ]);

        wp_send_json_success($result);
    }

    public function handle_update_checkout()
    {
        check_ajax_referer('attendance_nonce', 'nonce');

        $user_id = get_current_user_id();
        $activeSession = $this->attendanceModel->getActiveSession($user_id);

        if (!$activeSession) {
            wp_send_json_error('No active session found');
            return;
        }

        $result = $this->attendanceModel->update($activeSession->id, [
            'check_out' => current_time('mysql')
        ]);

        wp_send_json_success($result);
    }

    public function handle_submit_time_off()
    {
        check_ajax_referer('time_off_nonce', 'nonce');

        $data = array(
            'user_id' => get_current_user_id(),
            'start_date' => sanitize_text_field($_POST['start_date']),
            'end_date' => sanitize_text_field($_POST['end_date']),
            'type' => sanitize_text_field($_POST['type']),
            'reason' => sanitize_textarea_field($_POST['reason']),
            'status' => 'pending'
        );

        $result = $this->timeOffModel->create($data);

        wp_send_json_success($result);
    }

    // REST API Handlers
    public function api_record_attendance($request)
    {
        $user_id = get_current_user_id();
        $status = sanitize_text_field($request['status']);
        $work_mode = sanitize_text_field($request['work_mode']);

        $result = $this->attendanceModel->create([
            'user_id' => $user_id,
            'status' => $status,
            'work_mode' => $work_mode,
            'check_in' => current_time('mysql')
        ]);

        return rest_ensure_response($result);
    }

    public function api_submit_time_off($request)
    {
        $data = array(
            'user_id' => get_current_user_id(),
            'start_date' => sanitize_text_field($request['start_date']),
            'end_date' => sanitize_text_field($request['end_date']),
            'type' => sanitize_text_field($request['type']),
            'reason' => sanitize_textarea_field($request['reason']),
            'status' => 'pending'
        );

        $result = $this->timeOffModel->create($data);

        return rest_ensure_response($result);
    }

    // Helper methods
    public function get_user_attendance_summary($user_id, $start_date, $end_date)
    {
        return $this->attendanceModel->getRecords($user_id, $start_date, $end_date);
    }

    public function get_user_time_off_requests($user_id, $status = null)
    {
        $query = $this->timeOffModel->where('user_id', $userId);
        if ($status) {
            $query->where('status', $status);
        }
        return $query->get();
    }

    public function get_pending_time_off_requests()
    {
        // This might need a more complex join, handled in model
        return $this->timeOffModel->where('status', 'pending')->get();
    }
}
