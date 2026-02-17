<?php

namespace App\Modules\Finance\Services;

use App\Core\Requests\Models\RequestInstance;
use App\Modules\Finance\Models\PaymentVoucher;
use App\Modules\Finance\Models\Retirement;

class FinanceService
{
    /**
     * Get dashboard stats for Finance Dashboard
     * 
     * @return array
     */
    public static function getDashboardStats()
    {
        return [
            'pending_approvals' => RequestInstance::countByStatus('pending_approval'),
            'vouchers_to_generate' => PaymentVoucher::countRequestsReadyForVoucher(),
            'pending_retirements' => Retirement::countPending()
        ];
    }
}
