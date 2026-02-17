<?php

namespace App\Modules\Finance\Models;

use App\Utils\BaseModel;
use App\Core\FileStorage\Models\File;

class RetirementReceipt extends BaseModel
{
    protected $table = 'sta_finance_retirement_receipts';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'retirement_id',
        'file_id',
        'description',
        'amount',
        'receipt_date',
        'vendor_name'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'receipt_date' => 'date'
    ];

    public function getRetirement()
    {
        return $this->belongsTo(Retirement::class, 'retirement_id');
    }

    public function getFile()
    {
        return $this->belongsTo(File::class, 'file_id');
    }
}
