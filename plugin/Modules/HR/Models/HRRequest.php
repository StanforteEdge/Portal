<?php

namespace App\Modules\HR\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestType;
use App\Core\User\Models\User;

/**
 * HRRequest Model
 */
class HRRequest extends BaseModel
{
    protected $table = 'sta_hr_requests';
    protected $primaryKey = 'id';
    public $incrementing = true;

    protected $fillable = [
        'uuid',
        'request_type_id',
        'organization_id',
        'request_number',
        'created_by',
        'team_id',
        'workflow_instance_id',
        'status',
        'data',
        'current_approval_step',
        'audit_log_id',
        'total_amount',
        'currency',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'data' => 'array',
        'current_approval_step' => 'integer',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function getRequestType()
    {
        return $this->belongsTo(RequestType::class, 'request_type_id');
    }

    public function getCreator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedRequestNumber()
    {
        $requestType = $this->getRequestType();
        if (!$requestType) {
            return $this->request_number ?: $this->id;
        }
        $number = $this->request_number ?: $this->id;
        return $requestType->formatRequestNumber($number);
    }

    /**
     * Get request items for this instance
     */
    public function getItems()
    {
        $requestItemModel = new \App\Core\Requests\Models\RequestItem();
        return $requestItemModel->where('request_id', $this->id)->get();
    }

    /**
     * Get all HR requests with filtering and pagination
     */
    public static function getAll($filters = [], $order = ['created_at' => 'DESC'], $page = 1, $perPage = 15)
    {
        $instance = new static();

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '') continue;

            if ($key === 'status') {
                $instance->where('status', $value);
            } elseif ($key === 'request_type_id') {
                $instance->where('request_type_id', $value);
            } elseif ($key === 'created_by') {
                $instance->where('created_by', $value);
            } elseif ($key === 'organization_id') {
                $instance->where('organization_id', $value);
            } elseif ($key === 'team_id') {
                $instance->where('team_id', $value);
            }
        }

        foreach ($order as $column => $direction) {
            $instance->orderBy($column, $direction);
        }

        return $instance->paginate($perPage, $page);
    }
}
