<?php

namespace App\Modules\Finance\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestType;
use App\Core\User\Models\User;

/**
 * FinanceRequest Model
 *
 * Module-specific request table with auto-increment ID per finance group
 */
class FinanceRequest extends BaseModel
{
    protected $table = 'sta_request_instances';
    protected $primaryKey = 'id';
    public $incrementing = true; // Auto-increment ID

    protected $fillable = [
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

    /**
     * Get the request type for this instance
     */
    public function getRequestType()
    {
        return $this->belongsTo(RequestType::class, 'request_type_id');
    }

    /**
     * Get the creator of this request
     */
    public function getCreator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the finance request
     */
    public function getFinanceRequest($requestId)
    {
        return $this->find($requestId);
    }

    private function getFinanceGroup()
    {
        $groupModel = new \App\Core\Requests\Models\RequestGroup();
        return $groupModel->where('code', 'finance')->first();
    }

    /**
     * Get formatted request number
     */
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
     * Check if request is in draft status
     */
    public function isDraft()
    {
        return $this->status === 'draft';
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
     * Get all finance requests with filtering and pagination
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
