<?php

namespace App\Modules\Finance\Controllers;

use App\Utils\BaseController;
use App\Modules\Finance\Services\PaymentVoucherService;
use WP_REST_Request;
use Exception;

class PaymentVoucherController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new PaymentVoucherService();
    }

    /**
     * Create a new Payment Voucher
     */
    public function create(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();

            // Basic permission check - only Accountants/Finance should create PVs
            // TODO: Add stricter permission check 'finance.create_voucher'
            // Permission check is handled by AuthMiddleware in routes
            // if (!$this->checkPermission('finance.create_voucher')) { ... }

            $voucher = $this->service->createVoucher($data);
            return self::success($voucher, 201);

        } catch (Exception $e) {
            error_log('Error creating Payment Voucher: ' . $e->getMessage());
            return self::error('create_error', $e->getMessage(), 400);
        }
    }

    /**
     * Mark Voucher as Paid
     */
    public function markPaid(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_json_params();

            // Permission check is handled by AuthMiddleware in routes

            $voucher = $this->service->markAsPaid($id, $data);
            return self::success($voucher);

        } catch (Exception $e) {
            error_log('Error marking PV as paid: ' . $e->getMessage());
            return self::error('update_error', $e->getMessage(), 400);
        }
    }

    /**
     * Get Vouchers for a Request
     */
    public function getByRequest(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');
            // Allow requester and finance to view

            $vouchers = $this->service->getVouchersByRequest($requestId);
            return self::success($vouchers);

        } catch (Exception $e) {
            return self::error('fetch_error', $e->getMessage(), 400);
        }
    }
}
