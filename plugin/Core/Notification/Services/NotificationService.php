<?php

namespace App\Core\Notification\Services;

use App\Core\Notification\Models\Notification;
use App\Core\Notification\Models\Template;
use App\Core\Notification\Services\EmailService;
use App\Core\Notification\Services\SMSService;
use WP_Error;

class NotificationService
{
    /**
     * @var Notification
     */
    private static $notificationModel;

    /**
     * Send a notification using a template
     *
     * @param string $templateName
     * @param array $templateData
     * @param int|array $userIds
     * @param string $notificationType
     * @param array $notificationData
     * @return array|WP_Error
     */
    public static function sendTemplateNotification($templateName, $templateData, $userIds, $notificationType = 'info', $notificationData = [])
    {
        try {

            error_log('Sending template notification: ' . $templateName);
            // Get the template
            $template = Template::getByName($templateName, 'password_reset');

            error_log('Template found: ' . ($template ? 'yes' : 'no'));

            if (!$template) {
                return new WP_Error(
                    'template_not_found',
                    'Notification template not found',
                    ['status' => 404]
                );
            }

            // Render the template
            $rendered = $template->render($templateData);

            // Prepare notification data (reuse sendNotification decision logic)
            $payload = array_merge([
                'user_id' => is_array($userIds) ? $userIds : [$userIds],
                'title' => $rendered['subject'],
                'message' => $rendered['body'],
                'type' => $notificationType,
                'data' => $templateData
            ], $notificationData);

            return self::sendNotification($payload);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to send template notification: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Get notification model instance
     * 
     * @return Notification
     */
    private static function getModel()
    {
        if (!self::$notificationModel) {
            self::$notificationModel = new Notification();
        }
        return self::$notificationModel;
    }

    /**
     * Send a notification to a user (single entry point)
     *
     * @param array $data {
     *     @type int|array $user_id            Single user ID or array of user IDs
     *     @type string    $type               Notification type (info, warning, success, error, action, reminder, system) [default: info]
     *     @type string    $title              Notification title (required if no template)
     *     @type string    $message            Notification message (plain text; required if no template)
     *     @type string    $status             Notification status [default: unread]
     *     @type string    $template           Optional template name (email; also used to populate in-app if title/message absent)
     *     @type array     $template_data      Optional template data for rendering
     *     @type array     $send_via           Channels: e.g. ['in-app'], ['email'], or both [default: ['in-app']]
     *     @type string    $notifiable_type    Type of notifiable entity
     *     @type int       $notifiable_id      ID of the notifiable entity
     *     @type string    $link               Optional link
     *     @type array     $data               Additional JSON data to store
     * }
     * @return array|WP_Error Array of notification IDs or WP_Error on failure
     */
    public static function sendNotification($data)
    {
        try {

            error_log('Sending notification: ' . json_encode($data));

            // Validate required fields
            if (empty($data['user_id'])) {
                return new WP_Error('missing_field', 'Missing required field: user_id', ['status' => 400]);
            }
            if (empty($data['template']) && (empty($data['title']) || empty($data['message']))) {
                return new WP_Error('missing_field', 'Provide either a template or both title/message', ['status' => 400]);
            }

            // Defaults & normalization
            $data['type'] = $data['type'] ?? 'info';
            $data['status'] = $data['status'] ?? 'unread';
            $channels = $data['channels'] ?? ['in-app'];
            $channels = is_array($channels) ? array_values(array_unique(array_map('strtolower', $channels))) : [$channels];

            $notificationData = [
                'type' => $data['type'],
                'title' => $data['title'] ?? null,
                'message' => $data['message'] ?? null,
                'status' => $data['status'],
                'channels' => $channels,
            ];

            // Optional fields
            if (!empty($data['link'])) {
                $notificationData['link'] = $data['link'];
            }

            // Template settings (email primary; also used as fallback to populate in-app if title/message missing)
            if (!empty($data['template'])) {
                $notificationData['template'] = $data['template'];
            }
            if (!empty($data['template_data'])) {
                $notificationData['template_data'] = $data['template_data'];
            }

            $notificationIds = [];
            $userIds = is_array($data['user_id']) ? $data['user_id'] : [$data['user_id']];
            $model = self::getModel();
            $channels = $notificationData['channels'];

            // Process channels once, then delegate to channel-specific methods
            if (in_array('in-app', $channels, true)) {
                error_log('Sending in-app notification to: ' . implode(', ', $userIds));
                self::inAppNotifications($userIds, $notificationData);
            }

            if (in_array('email', $channels, true)) {
                error_log('Sending email notification to: ' . implode(', ', $userIds));
                EmailService::emailNotification($userIds, $notificationData);
            }

            if (in_array('sms', $channels, true)) {
                error_log('Sending SMS notification to: ' . implode(', ', $userIds));
                SMSService::smsNotification($userIds, $notificationData);
            }

            return [
                'notification_ids' => $notificationIds,
                'status' => 'sent',
                'count' => count($notificationIds)
            ];
        } catch (\Exception $e) {
            error_log('Error sending notification: ' . $e->getMessage());
            return new WP_Error(
                'notification_error',
                'Failed to send notification: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Send inApp Notifications
     */
    public static function inAppNotifications(array $userIds, array $basePayload) {
        $model = self::getModel();
        $records = [];
        
        foreach ($userIds as $userId) {
            $record = $basePayload;
            $record['user_id'] = $userId;
            
            // Add timestamps if missing
            $record['created_at'] = $record['created_at'] ?? current_time('mysql');
            $record['updated_at'] = $record['updated_at'] ?? current_time('mysql');
            
            $records[] = $record;
        }
        
        return $model->createMany($records);
    }

    /**
     * Get notifications for a user
     *
     * @param int $userId
     * @param array $args
     * @return array|WP_Error
     */
    public static function getUserNotifications($userId, $args = [])
    {
        try {
            return self::getModel()->getForUser($userId, $args);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to retrieve notifications: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Get unread notifications count for a user
     *
     * @param int $userId
     * @return int|WP_Error
     */
    public static function getUnreadCount($userId)
    {
        try {
            return self::getModel()->getUnreadCount($userId);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to get unread count: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Mark a notification as read
     *
     * @param int $notificationId
     * @param int $userId
     * @return bool|WP_Error
     */
    public static function markAsRead($notificationId, $userId)
    {
        try {
            $notification = self::getModel()->findForUser($notificationId, $userId);

            if (!$notification) {
                return new WP_Error(
                    'not_found',
                    'Notification not found or access denied',
                    ['status' => 404]
                );
            }

            return self::getModel()->markAsRead($notificationId);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to mark notification as read',
                ['status' => 500]
            );
        }
    }

    /**
     * Mark all notifications as read for a user
     *
     * @param int $userId
     * @return int|WP_Error
     */
    public static function markAllAsRead($userId)
    {
        try {
            return self::getModel()->markAllAsRead($userId);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to mark notifications as read',
                ['status' => 500]
            );
        }
    }

    /**
     * Create a new notification
     *
     * @param array $data
     * @return int|WP_Error
     */
    public static function createNotification($data)
    {
        try {
            $required = ['user_id', 'type', 'title', 'message'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return new WP_Error(
                        'missing_field',
                        sprintf('Missing required field: %s', $field),
                        ['status' => 400]
                    );
                }
            }

            // Set default values
            $notificationData = wp_parse_args($data, [
                'status' => 'unread',
                'data' => [],
                'read_at' => null,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ]);

            $result = self::getModel()->create($notificationData);

            if (!$result) {
                throw new \Exception('Failed to create notification');
            }

            return $result;
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to create notification',
                ['status' => 500]
            );
        }
    }

    /**
     * Get notifications for a notifiable entity
     *
     * @param string $type
     * @param int $id
     * @param array $args
     * @return array|WP_Error
     */
    public static function getForNotifiable($type, $id, $args = [])
    {
        try {
            return self::getModel()->getForNotifiable($type, $id, $args);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to retrieve notifications',
                ['status' => 500]
            );
        }
    }

    /**
     * Delete a notification
     *
     * @param int $notificationId
     * @param int $userId
     * @return bool|WP_Error
     */
    public static function deleteNotification($notificationId, $userId)
    {
        try {
            $notification = self::getModel()->findForUser($notificationId, $userId);

            if (!$notification) {
                return new WP_Error(
                    'not_found',
                    'Notification not found or access denied',
                    ['status' => 404]
                );
            }

            return self::getModel()->delete($notificationId);
        } catch (\Exception $e) {
            return new WP_Error(
                'notification_error',
                'Failed to delete notification',
                ['status' => 500]
            );
        }
    }
}
