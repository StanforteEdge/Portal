<?php

namespace App\Modules\HR\Attendance;

use App\Modules\HR\Controllers\Attendance\AttendanceController;
use App\Modules\HR\Controllers\Attendance\TimeOffController;
use App\Modules\HR\Controllers\Attendance\SettingsController;
use App\Modules\HR\Attendance\Events\EventHandlers;

class Init
{
    private static $instance = null;
    private $menu_config;
    private $controllers = [];
    private $eventHandlers;

    private function __construct()
    {
        $this->menu_config = require_once SE_DIR . 'Modules/HR/Attendance/config/menu.php';
        $this->eventHandlers = new EventHandlers();

        // Initialize controllers
        $this->controllers = [
            'attendance' => new AttendanceController(),
            'timeoff' => new TimeOffController(),
            'settings' => new SettingsController()
        ];
    }

    public static function get_instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function initialize()
    {
        // Register AJAX endpoints
        $this->registerEndpoints();

        // Register event handlers
        $this->eventHandlers->register();

        // Register menu items
        add_action('admin_menu', [$this, 'registerMenuItems']);

        // Register assets
        add_action('wp_enqueue_scripts', [$this, 'registerAssets']);
    }

    private function registerEndpoints()
    {
        // Attendance endpoints
        add_action('wp_ajax_attendance_check_in', [$this->controllers['attendance'], 'checkIn']);
        add_action('wp_ajax_attendance_check_out', [$this->controllers['attendance'], 'checkOut']);
        add_action('wp_ajax_attendance_get_status', [$this->controllers['attendance'], 'getStatus']);
        add_action('wp_ajax_attendance_get_records', [$this->controllers['attendance'], 'getRecords']);
        add_action('wp_ajax_attendance_get_department', [$this->controllers['attendance'], 'getDepartmentAttendance']);

        // Time off endpoints
        add_action('wp_ajax_timeoff_request', [$this->controllers['timeoff'], 'request']);
        add_action('wp_ajax_timeoff_process', [$this->controllers['timeoff'], 'process']);
        add_action('wp_ajax_timeoff_get_balance', [$this->controllers['timeoff'], 'getBalance']);
        add_action('wp_ajax_timeoff_get_department_requests', [$this->controllers['timeoff'], 'getDepartmentRequests']);

        // Settings endpoints
        add_action('wp_ajax_attendance_settings_get', [$this->controllers['settings'], 'index']);
        add_action('wp_ajax_attendance_settings_update', [$this->controllers['settings'], 'update']);
        add_action('wp_ajax_attendance_settings_schema', [$this->controllers['settings'], 'schema']);
    }

    public function registerAssets()
    {
        wp_enqueue_script(
            'attendance-js',
            plugins_url('assets/js/attendance.js', __FILE__),
            ['jquery'],
            '1.0.0',
            true
        );

        wp_localize_script('attendance-js', 'attendanceAjax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('attendance_nonce')
        ]);
    }

    public function registerMenuItems()
    {
        // Add menu items based on menu config
        foreach ($this->menu_config as $role => $menus) {
            foreach ($menus as $menu) {
                add_menu_page(
                    $menu['title'],
                    $menu['title'],
                    'read',
                    'attendance_' . strtolower($menu['title']),
                    [$this, 'renderPage']
                );

                foreach ($menu['items'] as $item) {
                    add_submenu_page(
                        'attendance_' . strtolower($menu['title']),
                        $item['title'],
                        $item['title'],
                        'read',
                        'attendance_' . strtolower($item['title']),
                        [$this, 'renderPage']
                    );
                }
            }
        }
    }

    public function renderPage()
    {
        $template = isset($_GET['page']) ? str_replace('attendance_', '', $_GET['page']) : 'dashboard';
        $template = strtolower($template);

        include get_template_directory() . "/templates/attendance/{$template}.php";
    }
}
