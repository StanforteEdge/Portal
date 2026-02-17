<?php

namespace App\Modules\Finance\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestInstance;

class PaymentVoucher extends BaseModel
{
    protected $table = 'sta_finance_payment_vouchers';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'request_id',
        'voucher_number',
        'amount',
        'payment_method',
        'payment_date',
        'payee_name',
        'is_partial_payment',
        'payment_sequence',
        'funding_source',
        'account_code',
        'items_covered',
        'status',
        'prepared_by',
        'approved_by',
        'approved_date',
        'created_by'
    ];

    protected $casts = [
        'items_covered' => 'array',
        'amount' => 'decimal:2',
        'is_partial_payment' => 'boolean',
        'payment_date' => 'date',
        'approved_date' => 'date',
    ];

    public function getRequest()
    {
        return $this->belongsTo(RequestInstance::class, 'request_id');
    }

    public function getItems()
    {
        $pvItemModel = new PaymentVoucherItem();
        return $pvItemModel->where('payment_voucher_id', $this->id)->get();
    }

    public static function generateVoucherNumber()
    {
        global $wpdb;
        $year = date('Y');
        $prefix = "PV-{$year}-";

        $lastNumber = $wpdb->get_var($wpdb->prepare(
            "SELECT voucher_number FROM {$wpdb->prefix}sta_finance_payment_vouchers 
             WHERE voucher_number LIKE %s 
             ORDER BY voucher_number DESC LIMIT 1",
            $prefix . '%'
        ));

        if ($lastNumber) {
            $number = (int) substr($lastNumber, -4) + 1;
        } else {
            $number = 1;
        }

        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
    /**
     * Count approved requests that need a voucher
     * 
     * @return int
     */
    public static function countRequestsReadyForVoucher()
    {
        global $wpdb;
        $requests_table = $wpdb->prefix . 'sta_request_instances';
        $vouchers_table = $wpdb->prefix . 'sta_finance_payment_vouchers'; // Correct table name

        // Check if vouchers table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$vouchers_table'") !== $vouchers_table) {
            return 0;
        }

        $sql = "
            SELECT COUNT(*) 
            FROM {$requests_table} r 
            LEFT JOIN {$vouchers_table} v ON r.id = v.request_id 
            WHERE r.status = 'approved' 
            AND v.id IS NULL
        ";

        return (int) $wpdb->get_var($sql);
    }
}
