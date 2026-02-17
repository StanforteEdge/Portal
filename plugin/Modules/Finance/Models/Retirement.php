<?php

namespace App\Modules\Finance\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestInstance;

class Retirement extends BaseModel
{
    protected $table = 'sta_finance_retirements';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'request_id',
        'payment_voucher_id',
        'retired_by',
        'retired_date',
        'total_receipts_amount',
        'balance_returned',
        'status',
        'verified_by',
        'verified_date',
        'notes'
    ];

    protected $casts = [
        'total_receipts_amount' => 'decimal:2',
        'balance_returned' => 'decimal:2',
        'retired_date' => 'date',
        'verified_date' => 'date',
    ];

    public function getRequest()
    {
        return $this->belongsTo(RequestInstance::class, 'request_id');
    }

    public function getPaymentVoucher()
    {
        return $this->belongsTo(PaymentVoucher::class, 'payment_voucher_id');
    }

    public function getReceipts()
    {
        $receiptModel = new RetirementReceipt();
        return $receiptModel->where('retirement_id', $this->id)->get();
    }
    /**
     * Count pending retirements
     * 
     * @return int
     */
    public static function countPending()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_finance_retirements';
        // Check if table exists to avoid errors during migration
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return 0;
        }
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status = 'pending'");
    }
}
