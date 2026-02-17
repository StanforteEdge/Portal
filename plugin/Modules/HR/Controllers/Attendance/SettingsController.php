<?php

namespace App\Modules\HR\Controllers\Attendance;

use App\Utils\BaseController;
use App\Modules\HR\Attendance\SettingsService;

class SettingsController extends BaseController
{
    public function __construct()
    {
        $this->service = new SettingsService();
    }

    /**
     * Get all settings
     */
    public function index()
    {
        try {
            $this->checkPermission('manage_attendance_settings');
            return $this->success($this->service->all());
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Update settings
     */
    public function update()
    {
        try {
            $this->checkPermission('manage_attendance_settings');

            $data = $this->all();
            $settings = $this->service->update($data);

            return $this->success($settings, 'Settings updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    /**
     * Get settings schema
     */
    public function schema()
    {
        try {
            $this->checkPermission('manage_attendance_settings');
            return $this->success($this->service->getSchema());
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }
}
