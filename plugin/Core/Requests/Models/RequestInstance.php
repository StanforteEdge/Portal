<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestType;
use App\Core\Requests\Models\RequestGroup;
use App\Core\Workflow\Models\WorkflowInstance;
use App\Core\FileStorage\Models\FileLink;
use App\Core\User\Models\User;

/**
 * RequestInstance Model
 *
 * Represents an actual request instance submitted by a user
 */
class RequestInstance extends BaseModel
{
    protected $table = 'sta_request_instances';
    protected $primaryKey = 'id';
    public $incrementing = true; // Auto-increment primary key
    protected $keyType = 'int'; // Primary key is integer

    protected $fillable = [
        'request_type_id',
        'group_id',
        'organization_id',  // Multi-tenant organization scoping
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
        'updated_at' => 'datetime',
        'due_date' => 'date'
    ];

    /**
     * Get the request type for this instance
     *
     * @return object|null RequestType object or null
     */
    public function getRequestType()
    {
        $relationship = $this->belongsTo(RequestType::class, 'request_type_id');
        return $relationship->first();
    }

    /**
     * Get the request group for this instance
     *
     * @return object|null RequestGroup object or null
     */
    public function getGroup()
    {
        $relationship = $this->belongsTo(RequestGroup::class, 'group_id');
        return $relationship->first();
    }

    /**
     * Get the creator of this request
     *
     * @return object|null User object or null
     */
    public function getCreator()
    {
        $relationship = $this->belongsTo(User::class, 'created_by');
        return $relationship->first();
    }

    /**
     * Get the organization this request belongs to
     *
     * @return object|null Organization object or null
     */
    public function getOrganization()
    {
        if (!$this->organization_id) {
            return null;
        }
        return $this->belongsTo(\App\Core\Organization\Models\Organization::class, 'organization_id');
    }

    /**
     * Get request items for this instance
     *
     * @return array Array of RequestItem objects
     */
    public function getItems()
    {
        $requestItemModel = new RequestItem();
        return $requestItemModel->where('request_id', $this->id)->get();
    }

    /**
     * Get workflow instance for this request
     *
     * @return object|null WorkflowInstance object or null
     */
    public function getWorkflowInstance()
    {
        if (!$this->workflow_instance_id) {
            return null;
        }
        return $this->belongsTo(WorkflowInstance::class, 'workflow_instance_id');
    }

    /**
     * Get attached files for this request
     *
     * @return array Array of File objects
     */
    public function getAttachedFiles()
    {
        return FileLink::getForEntity('request', $this->id);
    }

    /**
     * Find request by formatted number
     *
     * Supports multiple formats:
     * - CODE/request_id
     * - CODE/01/request_id  
     * - CODE/Year/request_id
     * - CODE/01/YEAR/request_id
     * - CODE-request_id (legacy)
     *
     * @param string $formattedNumber Formatted request number
     * @return RequestInstance|null
     */
    public static function findByFormattedNumber($formattedNumber)
    {
        // Handle both slash and dash separators
        $parts = preg_split('/[-\/]/', $formattedNumber);

        if (empty($parts)) {
            return null;
        }

        // First part is always the code prefix
        $prefix = strtoupper($parts[0]);

        // Last part is always the request ID
        $requestId = (int) end($parts);

        if ($requestId <= 0) {
            return null;
        }

        // Find request type with this prefix (optional validation)
        $requestTypeModel = new \App\Core\Requests\Models\RequestType();
        $requestType = $requestTypeModel->where('code_prefix', $prefix)->first();

        if (!$requestType) {
            return null;
        }

        // Find request by ID and validate type
        $model = new self();
        $request = $model->where('id', $requestId)->first();
        if (!$request) {
            return null;
        }

        if ($request->request_type_id !== $requestType->id) {
            return null;
        }

        return $request;
    }

    /**
     * Get formatted request number
     *
     * @return string Formatted request number (e.g., EXP-00123)
     */
    public function getFormattedRequestNumber()
    {
        $requestType = $this->getRequestType();
        if (!$requestType) {
            return $this->request_number ?: $this->id;
        }

        // Handle both model instances and stdClass objects
        if (is_object($requestType) && method_exists($requestType, 'formatRequestNumber')) {
            $number = $this->request_number ?: $this->id;
            return $requestType->formatRequestNumber($number);
        } elseif (is_object($requestType) && isset($requestType->code_prefix)) {
            // Manual formatting for stdClass objects
            $year = date('Y');
            $month = date('m');
            $number = $this->request_number ?: $this->id;
            return $requestType->code_prefix . '/' . $month . '/' . $year . '/' . $number;
        }

        return $this->request_number ?: $this->id;
    }

    /**
     * Check if request is in draft status
     *
     * @return bool
     */
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if request is submitted
     *
     * @return bool
     */
    public function isSubmitted()
    {
        return $this->status === 'submitted';
    }

    /**
     * Check if request is approved
     *
     * @return bool
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if request is rejected
     *
     * @return bool
     */
    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    /**
     * Get all requests with filtering and pagination
     * 
     * @param array $filters
     * @param array $order
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public static function getAll($filters = [], $order = ['created_at' => 'DESC'], $page = 1, $perPage = 15)
    {
        $instance = new static();

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '')
                continue;

            if ($key === 'status') {
                $instance->where('status', $value);
            } elseif ($key === 'request_type_id') {
                $instance->where('request_type_id', $value);
            } elseif ($key === 'group_id') {
                $instance->where('group_id', $value);
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

    /**
     * Get requests by status
     *
     * @param string $status Request status
     * @return array Array of RequestInstance objects
     */
    public static function getByStatus($status)
    {
        $instance = new static();
        return $instance->where('status', $status)->get();
    }

    /**
     * Get requests by user
     *
     * @param int $userId User ID
     * @return array Array of RequestInstance objects
     */
    public static function getByUser($userId)
    {
        $instance = new static();
        return $instance->where('created_by', $userId)->get();
    }

    /**
     * Get requests by type
     *
     * @param string $requestTypeId Request type ID
     * @return array Array of RequestInstance objects
     */
    public static function getByType($requestTypeId)
    {
        $instance = new static();
        return $instance->where('request_type_id', $requestTypeId)->get();
    }
    /**
     * Get dashboard stats for a user
     * 
     * @param int $profileId Profile ID (created_by)
     * @return array Stats data
     */
    public static function getDashboardStats($profileId)
    {
        global $wpdb;

        $requests_table = $wpdb->prefix . 'sta_request_instances';
        $requests_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$requests_table} WHERE created_by = %d",
            $profileId
        ));
        $requests = $requests_count ? $requests_count : 0;
        $requests_stats = [
            'draft' => 0,
            'pending' => 0,
            'approved' => 0,
            'total' => (int) $requests_count
        ];

        $status_counts = $wpdb->get_results($wpdb->prepare(
            "SELECT status, COUNT(*) as count FROM {$requests_table} WHERE created_by = %d GROUP BY status",
            $profileId
        ), 'ARRAY_A');

        foreach ($status_counts as $row) {
            $status = $row['status'];
            $count = (int) $row['count'];

            if ($status === 'draft') {
                $requests_stats['draft'] = $count;
            } elseif (in_array($status, ['pending', 'submitted', 'pending_approval'])) {
                $requests_stats['pending'] += $count;
            } elseif (in_array($status, ['approved', 'completed'])) {
                $requests_stats['approved'] += $count;
            }
        }

        return [
            'requests_count' => (int) $requests_count,
            'requests' => $requests_stats
        ];
    }
    /**
     * Count requests by status
     * 
     * @param string $status Request status
     * @return int Count
     */
    public static function countByStatus($status)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_request_instances';
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE status = %s",
            $status
        ));
    }
}
