<?php

namespace App\Modules\HR\Services\Attendance;

class SettingsService
{
    private $settings;
    private $option_name = 'attendance_settings';

    public function __construct()
    {
        $this->settings = require_once SE_DIR . 'Modules/HR/Config/Attendance/settings.php';
    }

    /**
     * Get all settings
     */
    public function all()
    {
        $saved = get_option($this->option_name, []);
        $settings = [];

        foreach ($this->settings as $section => $fields) {
            $settings[$section] = [];
            foreach ($fields as $key => $config) {
                $settings[$section][$key] = [
                    'value' => isset($saved[$section][$key])
                        ? $saved[$section][$key]
                        : $config['default'],
                    'config' => $config
                ];
            }
        }

        return $settings;
    }

    /**
     * Get a specific setting
     */
    public function get($section, $key)
    {
        $saved = get_option($this->option_name, []);

        if (isset($saved[$section][$key])) {
            return $saved[$section][$key];
        }

        return $this->settings[$section][$key]['default'] ?? null;
    }

    /**
     * Update settings
     */
    public function update($data)
    {
        $saved = get_option($this->option_name, []);
        $updated = [];

        foreach ($data as $section => $fields) {
            if (!isset($this->settings[$section]))
                continue;

            $updated[$section] = [];
            foreach ($fields as $key => $value) {
                if (!isset($this->settings[$section][$key]))
                    continue;

                // Validate value based on type
                if ($this->validateValue($value, $this->settings[$section][$key]['type'])) {
                    $updated[$section][$key] = $value;
                } else {
                    throw new \Exception("Invalid value for {$section}.{$key}");
                }
            }
        }

        // Merge with existing settings
        $merged = array_merge($saved, $updated);

        // Save to database
        update_option($this->option_name, $merged);

        return $this->all();
    }

    /**
     * Get settings schema
     */
    public function getSchema()
    {
        return $this->settings;
    }

    /**
     * Validate setting value based on type
     */
    private function validateValue($value, $type)
    {
        switch ($type) {
            case 'time':
                return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $value);

            case 'number':
                return is_numeric($value) && $value >= 0;

            case 'boolean':
                return is_bool($value) || in_array($value, [0, 1, '0', '1', true, false]);

            default:
                return true;
        }
    }

    /**
     * Check if time is within work hours
     */
    public function isWithinWorkHours($time = null)
    {
        $time = $time ?: current_time('H:i');
        $startTime = $this->get('work_hours', 'start_time');
        $endTime = $this->get('work_hours', 'end_time');

        return $time >= $startTime && $time <= $endTime;
    }

    /**
     * Check if check-in is late
     */
    public function isLateCheckIn($checkInTime)
    {
        $startTime = $this->get('work_hours', 'start_time');
        $gracePeriod = $this->get('work_hours', 'grace_period');

        $maxTime = strtotime($startTime) + ($gracePeriod * 60);
        return strtotime($checkInTime) > $maxTime;
    }

    /**
     * Get time off allowance
     */
    public function getTimeOffAllowance($type)
    {
        $key = $type . '_days';
        return $this->get('time_off', $key);
    }
}
