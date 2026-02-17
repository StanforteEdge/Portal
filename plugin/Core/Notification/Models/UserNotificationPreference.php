<?php

namespace App\Core\Notification\Models;

use App\Utils\BaseModel;

/**
 * User Notification Preference model
 * 
 * Handles user notification channel preferences
 */
class UserNotificationPreference extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'user_notification_preferences';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';
    
    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'user_id',
        'channel',
        'enabled'
    ];
    
    /**
     * @var array Attribute type casting
     */
    protected $casts = [
        'enabled' => 'boolean',
    ];

    /**
     * Get user's notification preferences
     *
     * @param int $userId
     * @return array
     */
    public static function getUserPreferences($userId)
    {
        $preferences = static::where('user_id', $userId)
                           ->where('enabled', true)
                           ->pluck('enabled', 'channel')
                           ->toArray();

        // Set default channels if not set
        $defaultChannels = ['in-app' => true, 'email' => true, 'sms' => false];
        
        return array_merge($defaultChannels, $preferences);
    }

    /**
     * Update user notification preferences
     *
     * @param int $userId
     * @param array $channels
     * @return void
     */
    public static function updatePreferences($userId, array $channels)
    {
        foreach ($channels as $channel => $enabled) {
            static::updateOrCreate(
                ['user_id' => $userId, 'channel' => $channel],
                ['enabled' => (bool)$enabled]
            );
        }
    }
}
