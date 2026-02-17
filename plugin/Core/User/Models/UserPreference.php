<?php

namespace App\Core\User\Models;

use App\Utils\BaseModel;

/**
 * User Preference model
 * 
 * Handles all user preferences including notification settings
 */
class UserPreference extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'user_preferences';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';
    
    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'user_id',
        'preference_type',
        'preference_key',
        'preference_value'
    ];
    
    /**
     * @var array Attribute type casting
     */
    protected $casts = [
        'preference_value' => 'array',
    ];

    /**
     * Default notification preferences
     */
    const DEFAULT_NOTIFICATION_PREFS = [
        'email' => true,
        'in_app' => true,
        'sms' => false
    ];

    /**
     * Get a user's preference
     *
     * @param int $userId
     * @param string $type
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getPreference($userId, $type, $key, $default = null)
    {
        $pref = static::where('user_id', $userId)
                     ->where('preference_type', $type)
                     ->where('preference_key', $key)
                     ->first();

        return $pref ? $pref->preference_value : $default;
    }

    /**
     * Get all notification preferences for a user
     *
     * @param int $userId
     * @return array
     */
    public static function getNotificationPreferences($userId)
    {
        $prefs = static::where('user_id', $userId)
                      ->where('preference_type', 'notification')
                      ->pluck('preference_value', 'preference_key')
                      ->toArray();

        return array_merge(self::DEFAULT_NOTIFICATION_PREFS, $prefs);
    }

    /**
     * Update a user's notification preferences
     *
     * @param int $userId
     * @param array $preferences
     * @return void
     */
    public static function updateNotificationPreferences($userId, array $preferences)
    {
        foreach ($preferences as $key => $value) {
            static::save(
                [
                    'user_id' => $userId,
                    'preference_type' => 'notification',
                    'preference_key' => $key
                ],
                ['preference_value' => $value]
            );
        }
    }

    /**
     * Get all preferences for a user by type
     *
     * @param int $userId
     * @param string $type
     * @return array
     */
    public static function getPreferencesByType($userId, $type)
    {
        return static::where('user_id', $userId)
                   ->where('preference_type', $type)
                   ->pluck('preference_value', 'preference_key')
                   ->toArray();
    }
}
