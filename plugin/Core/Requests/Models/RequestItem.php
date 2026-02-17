<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;

/**
 * RequestItem Model
 *
 * Represents individual line items within a request instance
 */
class RequestItem extends BaseModel
{
    protected $table = 'sta_request_items';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'request_id',
        'category_id',
        'subcategory_id',
        'item_description',
        'unit_price',
        'total_price',
        'quantity',
        'due_date',
        'notes',
        'sort_order',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'quantity' => 'decimal:2',
        'due_date' => 'date',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the request instance this item belongs to
     *
     * @return object|null RequestInstance object or null
     */
    public function getRequest()
    {
        return $this->belongsTo(RequestInstance::class, 'request_id');
    }

    /**
     * Get the total amount for this item (total_price is already calculated)
     * 
     * @return float Total amount
     */
    public function getTotalAmount()
    {
        return $this->total_price;
    }

    /**
     * Check if item is overdue
     * 
     * @return bool True if due date has passed
     */
    public function isOverdue()
    {
        if (!$this->due_date) {
            return false;
        }

        $today = date('Y-m-d');
        return $this->due_date < $today;
    }

    /**
     * Get items by request
     * 
     * @param string $requestUuid Request UUID
     * @return array Array of RequestItem objects
     */
    public static function getByRequest($requestUuid)
    {
        $instance = new static();
        return $instance->where('request_id', $requestUuid)->get();
    }

    /**
     * Get items by category
     * 
     * @param string $categoryId Category ID
     * @return array Array of RequestItem objects
     */
    public static function getByCategory($categoryId)
    {
        $instance = new static();
        return $instance->where('category_id', $categoryId)->get();
    }

    /**
     * Get overdue items
     * 
     * @return array Array of overdue RequestItem objects
     */
    public static function getOverdue()
    {
        $instance = new static();
        $today = date('Y-m-d');
        return $instance->where('due_date', '<', $today)
            ->where('due_date', 'IS NOT NULL')
            ->get();
    }

    /**
     * Calculate total amount for a request
     * 
     * @param string $requestUuid Request UUID
     * @return float Total amount
     */
    public static function getTotalAmountForRequest($requestUuid)
    {
        $instance = new static();
        $items = $instance->where('request_id', $requestUuid)->get();

        $total = 0;
        foreach ($items as $item) {
            $total += $item->total_price;
        }

        return $total;
    }
}
