<?php

namespace App\Core\Notification\Models;

use App\Utils\BaseModel;
use WP_Error;

/**
 * Template model for notification templates
 * 
 * Handles all database operations for notification templates
 */
class Template extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_templates';

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
        'template_type',
        'notification_type',
        'subject',
        'body',
        'description',
        'language',
        'is_active',
        'created_at',
        'updated_at'
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
     * @param string $notificationType
     * @param string $language
     * @return \App\Core\Notification\Models\Template|null
     */
    public static function getByName($name, $notificationType = 'email', $language = 'en')
    {
        $instance = new static();
        return $instance->where('name', $name)
                        ->where('notification_type', $notificationType)
                        ->where('language', $language)
                        ->where('is_active', 1)
                        ->firstOrModel();
    }

  

    /**
     * Render template with given data
     *
     * @param array $data
     * @return array ['subject' => string, 'body' => string]
     */
    public function render($data = [])
    {
        $subject = $this->renderString($this->subject, $data);
        $body = $this->renderString($this->body, $data);
        
        return [
            'subject' => $subject,
            'body' => $body
        ];
    }
    
    /**
     * Render a string with placeholders
     *
     * @param string $string
     * @param array $data
     * @return string
     */
    private function renderString($string, $data)
    {
        foreach ($data as $key => $value) {
            $string = str_replace("{{$key}}", $value, $string);
        }
        return $string;
    }
}
