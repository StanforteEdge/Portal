<?php

namespace App\Core\User\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Utils\BaseController;
use App\Core\User\Services\UserService;
use App\Core\Auth\Middleware\AuthMiddleware;
use App\Modules\Admin\Controllers\AdminDashboardController;
use App\Core\Requests\Services\RequestService;
use App\Core\Notification\Services\NotificationService;
use App\Core\Forms\Services\FormService;
use App\Modules\Finance\Services\FinanceService;
use App\Core\Auth\Services\RBACService;


class DashboardController extends BaseController
{
    /**
     * Get unified dashboard summary for current user
     * Returns role-based data in a single response
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getSummary(WP_REST_Request $request)
    {
        try {
            // Get current user from JWT or WordPress session (aligned with UserController::me)
            $user = AuthMiddleware::getCurrentUser();
            if (!$user) {
                return static::error('unauthenticated', 'Not authenticated', 401);
            }

            // Access profile_id from object
            if (!isset($user->profile_id) || empty($user->profile_id)) {
                return static::error('bad_request', 'Profile ID not found in token', 400);
            }

            // Get user profile data using UserService
            $userProfile = UserService::getProfileById($user->profile_id);

            if (!$userProfile) {
                return static::error('not_found', 'Profile not found', 404);
            }

            $userProfileData = [
                'id' => $userProfile->id,
                'first_name' => $userProfile->first_name,
                'last_name' => $userProfile->last_name,
                'email' => $userProfile->email,
                'roles' => $userProfile->roles,
                'status' => $userProfile->status
            ];

            $summary = [
                'user' => $userProfileData
            ];

            // Get general staff data using Services (Using Profile ID as requested)
            $formService = new FormService();
            $formStats = $formService->getDashboardStats($user->profile_id);
            $requestStats = RequestService::getDashboardStats($user->profile_id);
            // Get notifications
            $summary['user']['notifications'] = [
                'unread_count' => NotificationService::getUnreadCount($userProfile->id),
                'recent' => NotificationService::getUserNotifications($userProfile->id, ['limit' => 5])
            ];

            $summary['staff'] = array_merge($formStats, $requestStats);

            // Add Admin stats if user has admin capabilities
            if (RBACService::userHasPermission($user->profile_id, 'settings.manage')) {
                $adminStatsResponse = AdminDashboardController::getStats($request);
                if ($adminStatsResponse->data['success']) {
                    $summary['admin'] = $adminStatsResponse->data['data'];
                }
            }
            // Add Finance stats if user has finance capabilities
            if (RBACService::userHasPermission($user->profile_id, 'finance.view')) {
                $summary['finance'] = FinanceService::getDashboardStats();
            }

            return static::success($summary);
        } catch (\Exception $e) {
            error_log('Dashboard summary error: ' . $e->getMessage());
            return static::error('server_error', 'Failed to fetch dashboard summary', 500);
        }
    }
}
