<?php
namespace App\Core\Notification\Controllers;

use \WP_REST_Request;
use \WP_REST_Response;
use \WP_Error;
use App\Core\Notification\Services\NotificationService;
use App\Core\Auth\Middleware\AuthMiddleware;
use App\Utils\BaseController;

class NotificationController extends BaseController
{
    // No need for service instance with static methods

    /**
     * Get user notifications
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getUserNotifications(WP_REST_Request $request)
    {
        try {
            $user = AuthMiddleware::getCurrentUserFromRequest($request);
            if (!$user) {
                return static::error('unauthenticated', 'Authentication required', 401);
            }
            
            // Validate and sanitize status parameter
            $status = $request->get_param('status');
            $validStatuses = ['read', 'unread'];
            
            $args = [
                'limit' => $request->get_param('per_page') ? (int)$request->get_param('per_page') : 20,
                'page' => $request->get_param('page') ? (int)$request->get_param('page') : 1,
                'orderby' => in_array(strtolower($request->get_param('orderby')), ['created_at', 'read_at']) ? 
                    strtolower($request->get_param('orderby')) : 'created_at',
                'order' => in_array(strtoupper($request->get_param('order')), ['ASC', 'DESC']) ? 
                    strtoupper($request->get_param('order')) : 'DESC'
            ];
            
            if ($status && in_array(strtolower($status), $validStatuses)) {
                $args['status'] = strtolower($status);
            }

            $result = NotificationService::getUserNotifications($user->wp_user_id ?? $user->user_id, $args);

            if (is_wp_error($result)) {
                return static::error($result);
            }

            // Handle both paginated objects and plain arrays
            if (is_object($result) && method_exists($result, 'items')) {
                return static::success([
                    'data' => $result->items()
                ], 200, [
                    'total' => (int) ($result->total() ?? 0),
                    'per_page' => (int) ($result->perPage() ?? ($args['limit'] ?? 20)),
                    'current_page' => (int) ($result->currentPage() ?? ($args['page'] ?? 1)),
                    'last_page' => (int) ($result->lastPage() ?? 1)
                ]);
            }

            // Non-paginated array result
            return static::success([
                'data' => is_array($result) ? $result : []
            ], 200, [
                'count' => is_array($result) ? count($result) : 0
            ]);
        } catch (\Exception $e) {
            error_log('Error getting notifications: ' . $e->getMessage());
            return static::error('notifications_error', 'Failed to retrieve notifications', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
 * Get a single notification by ID
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
public static function getNotification(WP_REST_Request $request)
{
    try {
        $notificationId = $request->get_param('id');
        $user = AuthMiddleware::getCurrentUserFromRequest($request);

        if (!$user) {
            return static::error('unauthenticated', 'Authentication required', 401);
        }

        $notification = NotificationService::getNotification($notificationId, $user->wp_user_id ?? $user->user_id);

        if (is_wp_error($notification)) {
            return static::error($notification);
        }

        return static::success(['data' => $notification], 200);

    } catch (\Exception $e) {
        error_log('Error in NotificationController::getNotification: ' . $e->getMessage());
        return static::error('notifications_error', 'Failed to fetch notification', 500, [
            'details' => $e->getMessage()
        ]);
    }
}

    /**
     * Get unread notifications count
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getUnreadCount(WP_REST_Request $request)
    {
        try {
            $user = AuthMiddleware::getCurrentUserFromRequest($request);
            if (!$user) {
                return static::error('unauthenticated', 'Authentication required', 401);
            }
            
            $count = NotificationService::getUnreadCount($user->wp_user_id ?? $user->user_id);

            if (is_wp_error($count)) {
                return static::error($count);
            }

            return static::success(['data' => ['count' => $count]], 200);
        } catch (\Exception $e) {
            error_log('Error getting unread count: ' . $e->getMessage());
            return static::error('notifications_error', 'Failed to get unread count', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Mark notification as read
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function markAsRead(WP_REST_Request $request)
    {
        try {
            $user = AuthMiddleware::getCurrentUserFromRequest($request);
            if (!$user) {
                return static::error('unauthenticated', 'Authentication required', 401);
            }
            
            $notification_id = $request->get_param('id');
            $result = NotificationService::markAsRead($notification_id, $user->wp_user_id ?? $user->user_id);

            if (is_wp_error($result)) {
                return static::error($result);
            }

            return static::success(['data' => ['success' => true]], 200, [
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            error_log('Error marking notification as read: ' . $e->getMessage());
            return static::error('notifications_error', 'Failed to mark notification as read', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Mark all notifications as read
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function markAllAsRead(WP_REST_Request $request)
    {
        try {
            $user = AuthMiddleware::getCurrentUserFromRequest($request);
            if (!$user) {
                return static::error('unauthenticated', 'Authentication required', 401);
            }
            
            $result = NotificationService::markAllAsRead($user->wp_user_id ?? $user->user_id);

            if (is_wp_error($result)) {
                return static::error($result);
            }

            return static::success(['data' => ['count' => $result]], 200, [
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            error_log('Error marking all notifications as read: ' . $e->getMessage());
            return static::error('notifications_error', 'Failed to mark all notifications as read', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete notification
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteNotification(WP_REST_Request $request)
    {
        try {
            $user = AuthMiddleware::getCurrentUserFromRequest($request);
            if (!$user) {
                return static::error('unauthenticated', 'Authentication required', 401);
            }
            
            $notification_id = $request->get_param('id');
            $result = NotificationService::deleteNotification($notification_id, $user->wp_user_id ?? $user->user_id);

            if (is_wp_error($result)) {
                return static::error($result);
            }

            return static::success(null, 204);
        } catch (\Exception $e) {
            error_log('Error deleting notification: ' . $e->getMessage());
            return static::error('notifications_error', 'Failed to delete notification', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send a notification to one or more users
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function sendNotification(WP_REST_Request $request)
    {
        try {
            $params = $request->get_params();
            
            // Basic validation
            if (empty($params['user_id']) || empty($params['title']) || empty($params['message'])) {
                return static::error('bad_request', 'Missing required fields: user_id, title, and message are required', 400);
            }

            // Prepare notification data
            $notificationData = [
                'user_id' => $params['user_id'],
                'type' => $params['type'] ?? 'info',
                'title' => $params['title'],
                'message' => $params['message'],
                'send_via' => $params['send_via'] ?? ['in-app']
            ];

            // Optional fields
            if (!empty($params['link'])) {
                $notificationData['link'] = $params['link'];
            }

            if (!empty($params['data'])) {
                $notificationData['data'] = $params['data'];
            }

            if (!empty($params['notifiable_type'])) {
                $notificationData['notifiable_type'] = $params['notifiable_type'];
            }

            if (!empty($params['notifiable_id'])) {
                $notificationData['notifiable_id'] = $params['notifiable_id'];
            }

            // Send the notification
            $result = NotificationService::sendNotification($notificationData);

            if (is_wp_error($result)) {
                return static::error($result);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error in NotificationController::sendNotification: ' . $e->getMessage());
            return static::error('notification_send_error', 'Failed to send notification: ' . $e->getMessage(), 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
}
