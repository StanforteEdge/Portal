<?php
namespace App\Core\Notification\Models;

use App\Utils\BaseModel;
use WP_Error;

/**
 * Notification model for user notifications
 * 
 * Handles all database operations for notifications including
 * creating, retrieving, and updating notification statuses.
 */
class Notification extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_notifications';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';
    
    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'data',
        'status',
        'sent_via',
        'read_at',
        'archived_at',
        'notifiable_type',
        'notifiable_id',
        'created_at',
        'updated_at'
    ];
    
    /**
     * @var array Attribute type casting
     */
    protected $casts = [
        'data' => 'array',
        'sent_via' => 'array',
        'read_at' => 'datetime',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    /**
     * @var array Default notification statuses
     */
    protected static $statuses = [
        'unread',
        'read',
        'archived'
    ];
    
    /**
     * @var array Notification types
     */
    protected static $types = [
        'info',
        'warning',
        'success',
        'error',
        'action',
        'reminder',
        'system'
    ];
    
    /**
     * Get notifications for a specific user
     *
     * @param int $user_id The user ID
     * @param array $args {
     *     Optional. Array of query parameters.
     *     @type string $status    Filter by notification status
     *     @type string $type      Filter by notification type
     *     @type int    $limit     Number of notifications to return
     *     @type int    $page      Page number (alternative to offset)
     *     @type string $orderby   Field to order by
     *     @type string $order     Sort order (ASC/DESC)
     *     @type string $since     Only return notifications after this date (Y-m-d H:i:s)
     * }
     * @return array|WP_Error Array of notifications or WP_Error on failure
     */
    public function getForUser($user_id, $args = []) {
        $query = $this->where('user_id', $user_id);
        
        if (!empty($args['status'])) {
            $query->where('status', $args['status']);
        }
        
        if (!empty($args['type'])) {
            $query->where('type', $args['type']);
        }
        
        if (!empty($args['since'])) {
            $query->where('created_at', '>=', $args['since']);
        }
        
        $order = isset($args['order']) ? strtoupper($args['order']) : 'DESC';
        $orderby = $args['orderby'] ?? 'created_at';
        
        if (isset($args['page'])) {
            $perPage = $args['limit'] ?? 20;
            $page = (int)$args['page'];
            
            // Reset the query to avoid duplicate where clauses
            $query = $this->where('user_id', $user_id);
            
            if (!empty($args['status'])) {
                $query->where('status', $args['status']);
            }
            
            if (!empty($args['type'])) {
                $query->where('type', $args['type']);
            }
            
            if (!empty($args['since'])) {
                $query->where('created_at', '>=', $args['since']);
            }
            
            return $query->orderBy($orderby, $order)
                        ->paginate($perPage, $page);
        }
        
        $query->orderBy($orderby, $order);
        
        if (isset($args['limit'])) {
            $query->limit($args['limit']);
        }
        
        if (isset($args['offset'])) {
            $query->offset($args['offset']);
        }
        
        return $query->get();
    }
    
    /**
     * Get count of unread notifications for a user
     *
     * @param int $user_id The user ID
     * @return int Number of unread notifications
     */
    public function getUnreadCount($user_id) {
        $notifications = $this->where('user_id', $user_id)
                             ->where('status', 'unread')
                             ->get();
        return count($notifications);
    }
    
    /**
     * Mark a notification as read
     *
     * @param int $notification_id Notification ID
     * @param int $user_id User ID for verification
     * @return bool|WP_Error Whether the update was successful
     */
    public function markAsRead($notification_id, $user_id = null) {
        $data = [
            'status' => 'read',
            'read_at' => current_time('mysql')
        ];
        
        if ($user_id) {
            $data['user_id'] = $user_id;
            return $this->where('id', $notification_id)
                       ->where('user_id', $user_id)
                       ->update($data);
        }
        
        return $this->update($notification_id, $data);
    }
    
    /**
     * Mark a notification as archived
     *
     * @param int $notification_id Notification ID
     * @param int $user_id User ID for verification
     * @return bool|WP_Error Whether the update was successful
     */
    public function markAsArchived($notification_id, $user_id = null) {
        $data = [
            'status' => 'archived',
            'archived_at' => current_time('mysql')
        ];
        
        if ($user_id) {
            $data['user_id'] = $user_id;
            return $this->where('id', $notification_id)
                       ->where('user_id', $user_id)
                       ->update($data);
        }
        
        return $this->update($notification_id, $data);
    }
    
    /**
     * Mark all notifications as read for a user
     *
     * @param int $user_id User ID
     * @return int|WP_Error Number of updated records or WP_Error on failure
     */
    public function markAllAsRead($user_id) {
        return $this->where('user_id', $user_id)
                   ->where('status', 'unread')
                   ->update([
                       'status' => 'read',
                       'read_at' => current_time('mysql')
                   ]);
    }
    
    /**
     * Get available notification statuses
     *
     * @return array
     */
    public static function getStatuses()
    {
        return self::$statuses;
    }
    
    /**
     * Get available notification types
     *
     * @return array
     */
    public static function getTypes()
    {
        return self::$types;
    }
    
    /**
     * Get notifications for a notifiable entity
     *
     * @param string $type Notifiable type (e.g., 'user', 'document')
     * @param int    $id   Notifiable ID
     * @param array  $args {
     *     Optional. Array of query parameters.
     *     @type int    $limit   Number of notifications to return
     *     @type int    $page    Page number (alternative to offset)
     *     @type string $orderby Field to order by
     *     @type string $order   Sort order (ASC/DESC)
     * }
     * @return array|WP_Error Array of notifications or WP_Error on failure
     */
    public function getForNotifiable($type, $id, $args = []) {
        $query = $this->where('notifiable_type', $type)
                     ->where('notifiable_id', $id);
        
        $order = isset($args['order']) ? strtoupper($args['order']) : 'DESC';
        $orderby = $args['orderby'] ?? 'created_at';
        
        if (isset($args['page'])) {
            $perPage = $args['limit'] ?? 20;
            return $query->orderBy($orderby, $order)
                        ->paginate($perPage, ['*'], 'page', $args['page']);
        }
        
        return $query->orderBy($orderby, $order)
                    ->limit($args['limit'] ?? 20)
                    ->offset($args['offset'] ?? 0)
                    ->get();
    }
    
    /**
     * Find a specific notification for a user
     *
     * @param int $id       Notification ID
     * @param int $user_id  User ID
     * @return object|null  Notification object or null if not found
     */
    public function findForUser($id, $user_id) {
        return $this->where('id', $id)
                   ->where('user_id', $user_id)
                   ->first();
    }
}
