<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestInstance;
use App\Core\Requests\Models\RequestGroup;

/**
 * RequestType Model
 *
 * Represents a specific type of request (e.g., Petty Cash, Leave Request)
 */
class RequestType extends BaseModel
{
    protected $table = 'sta_request_types';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'group_id',
        'organization_id',
        'name',
        'code_prefix',
        'description',
        'storage_type', // 'form', 'special', 'bypass'
        'form_id',
        'form_schema',
        'approval_flow_json',
        'approval_limit',
        'settings',
        'sequence_counter',
        'is_active',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'form_schema' => 'array',
        'approval_flow_json' => 'array',
        'approval_limit' => 'decimal:2',
        'settings' => 'array',
        'sequence_counter' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the request group this type belongs to
     *
     * @return object|null RequestGroup object or null
     */
    public function getGroup()
    {
        return $this->belongsTo(RequestGroup::class, 'group_id');
    }

    /**
     * Get request instances of this type
     *
     * @return array Array of RequestInstance objects
     */
    public function getRequestInstances()
    {
        $instance = new RequestInstance();
        return $instance->where('request_type_id', $this->id)->get();
    }

    /**
     * Generate next request number for this type
     *
     * @return int Next request number
     */
    public function getNextRequestNumber()
    {
        // For globally unique requests, we'll use the auto-increment ID from the insert
        // This method is kept for compatibility but the actual request number 
        // will be determined by the database auto-increment
        return 0; // Will be overridden by database
    }

    /**
     * Get formatted request number
     *
     * @param int $number Request number
     * @return string Formatted request number (e.g., EXP-00123)
     */
    public function formatRequestNumber($number)
    {
        $year = date('Y');
        $month = date('m');
        return $this->code_prefix . '/' . $month . '/' . $year . '/' . $number;
    }

    /**
     * Get active request types
     *
     * @return array Array of active RequestType objects
     */
    public static function getActive()
    {
        $instance = new static();
        return $instance->where('is_active', true)->get();
    }

    /**
     * Get request types by group
     *
     * @param string $groupId Group ID
     * @return array Array of RequestType objects
     */
    public static function getByGroup($groupId)
    {
        $instance = new static();
        return $instance->where('group_id', $groupId)->get();
    }

    /**
     * Find request type by code prefix
     *
     * @param string $codePrefix Code prefix
     * @return object|null RequestType object or null
     */
    public static function findByCodePrefix($codePrefix)
    {
        $instance = new static();
        return $instance->where('code_prefix', $codePrefix)->first();
    }


    /**
     * Get the group relationship
     * 
     * @return RequestGroup|null
     */
    public function group()
    {
        return $this->belongsTo(RequestGroup::class, 'group_id');
    }
}
