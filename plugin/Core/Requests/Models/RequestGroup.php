<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;

/**
 * RequestGroup Model
 *
 * Represents a group of related request types (e.g., Financial, HR, Projects)
 */
class RequestGroup extends BaseModel
{
    protected $table = 'sta_request_groups';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'name',
        'code',
        'description',
        'is_active',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get request types for this group
     *
     * @return array Array of RequestType objects
     */
    public function getRequestTypes()
    {
        $requestTypeModel = new RequestType();
        return $requestTypeModel->where('group_id', $this->id)->get();
    }

    /**
     * Get active request types for this group
     *
     * @return array Array of active RequestType objects
     */
    public function getActiveRequestTypes()
    {
        $requestTypeModel = new RequestType();
        return $requestTypeModel->where('group_id', $this->id)
                               ->where('is_active', true)
                               ->get();
    }

    /**
     * Get request instances for this group
     *
     * @return array Array of RequestInstance objects
     */
    public function getRequestInstances()
    {
        $requestInstanceModel = new RequestInstance();
        return $requestInstanceModel->where('group_id', $this->id)->get();
    }

    /**
     * Get active groups
     *
     * @return array Array of active RequestGroup objects
     */
    public static function getActive()
    {
        $instance = new static();
        return $instance->where('is_active', true)->get();
    }

    /**
     * Find group by code
     *
     * @param string $code Group code
     * @return object|null RequestGroup object or null
     */
    public static function findByCode($code)
    {
        $instance = new static();
        return $instance->where('code', $code)->first();
    }
}
