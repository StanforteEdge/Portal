<?php

namespace App\Modules\Finance\Models;

use App\Utils\BaseModel;
use App\Core\Requests\Models\RequestItem;

class PaymentVoucherItem extends BaseModel
{
    protected $table = 'sta_finance_payment_voucher_items';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'payment_voucher_id',
        'request_item_id',
        'amount'
    ];

    protected $casts = [
        'amount' => 'decimal:2'
    ];

    public function getPaymentVoucher()
    {
        return $this->belongsTo(PaymentVoucher::class, 'payment_voucher_id');
    }

    public function getRequestItem()
    {
        return $this->belongsTo(RequestItem::class, 'request_item_id');
    }
}
