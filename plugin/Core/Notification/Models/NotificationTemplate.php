<?php

namespace App\Core\Notification\Models;

use App\Utils\BaseModel;

/**
 * Notification Template model
 * 
 * Handles database operations for notification templates
 */
class NotificationTemplate extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'notification_templates';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';
    
    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'id',
        'name',
        'type',
        'subject',
        'body',
        'language',
        'is_active'
    ];
    
    /**
     * @var array Attribute type casting
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get template by name and language
     *
     * @param string $name
     * @param string $language
     * @return \App\Core\Notification\Models\NotificationTemplate|null
     */
    public static function getByName($name, $language = 'en')
    {
        return static::where('name', $name)
                    ->where('language', $language)
                    ->where('is_active', true)
                    ->first();
    }
}
