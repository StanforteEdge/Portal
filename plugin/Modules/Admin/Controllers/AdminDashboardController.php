<?php

namespace App\Modules\Admin\Controllers;

use \WP_REST_Request;
use \WP_REST_Response;
use App\Utils\BaseController;
use App\Core\Auth\Models\Role;
use App\Modules\Admin\Services\UserManagementService;

class AdminDashboardController extends BaseController
{
    /**
     * Get dashboard statistics
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getStats(WP_REST_Request $request)
    {
        try {
            // Get user counts via UserManagementService
            $userCounts = UserManagementService::getUserCounts();
            $total_users_count = $userCounts['total'];
            $active_users = $userCounts['active'];

            // Pending actions (Placeholder)
            $pending_actions = 0; // To be implemented with actual action logic

            return static::success([
                'total_users' => $total_users_count,
                'active_users' => $active_users,
                'pending_actions' => $pending_actions
            ]);
        } catch (\Exception $e) {
            error_log('Stats error: ' . $e->getMessage());
            return static::error('server_error', 'Failed to fetch stats', 500);
        }
    }

    /**
     * Get recent system activity
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRecentActivity(WP_REST_Request $request)
    {
        try {
            // Placeholder: Return mock activity or fetch from an audit log table if it exists
            // Since we don't have a definitive AuditLog model yet, we'll return empty or mock
            $activities = [];

            // Example structure if we had data:
            // $activities[] = [
            //     'user_name' => 'System Admin',
            //     'user_avatar' => '',
            //     'description' => 'Updated system settings',
            //     'created_at' => date('c')
            // ];

            return static::success($activities);
        } catch (\Exception $e) {
            return static::error('server_error', 'Failed to fetch activity', 500);
        }
    }

    /**
     * Get user distribution by role
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRoleDistribution(WP_REST_Request $request)
    {
        try {
            $roles = Role::getAllWithUserCounts();

            $distribution = array_map(function ($role) {
                return [
                    'role_name' => $role->name,
                    'user_count' => (int) $role->user_count
                ];
            }, $roles);

            return static::success($distribution);
        } catch (\Exception $e) {
            return static::error('server_error', 'Failed to fetch role distribution', 500);
        }
    }

    /**
     * Check system health status
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getSystemHealth(WP_REST_Request $request)
    {
        global $wpdb;

        try {
            // Check Database
            $db_status = 'error';
            if ($wpdb->check_connection()) {
                $db_status = 'healthy';
            }

            // Check API (Self-check essentially passed if we are here)
            $api_status = 'healthy';

            // Check Storage (Uploads dir writable)
            $upload_dir = wp_upload_dir();
            $storage_status = wp_is_writable($upload_dir['basedir']) ? 'healthy' : 'error';

            return static::success([
                'database' => $db_status,
                'api' => $api_status,
                'storage' => $storage_status
            ]);
        } catch (\Exception $e) {
            return static::error('server_error', 'Health check failed', 500);
        }
    }
}
