<?php

namespace App\Modules\Finance\Controllers;

use App\Utils\BaseController;
use App\Modules\Finance\Services\RetirementService;
use WP_REST_Request;
use Exception;

class RetirementController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new RetirementService();
    }

    /**
     * Submit Retirement
     */
    public function submit(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();

            // Any authenticated user should be able to retire their own request
            // Logic inside service validates ownership via Request ID if strict check needed

            $retirement = $this->service->submitRetirement($data);
            return self::success($retirement, 201);

        } catch (Exception $e) {
            error_log('Error submitting retirement: ' . $e->getMessage());
            return self::error('submit_error', $e->getMessage(), 400);
        }
    }

    /**
     * Verify Retirement
     */
    public function verify(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $data = $request->get_json_params();

            // Permission check is handled by AuthMiddleware in routes

            $retirement = $this->service->verifyRetirement($id, $data['notes'] ?? '');
            return self::success($retirement);

        } catch (Exception $e) {
            return self::error('update_error', $e->getMessage(), 400);
        }
    }

    /**
     * Get Retirement for a Request
     */
    public function getByRequest(WP_REST_Request $request)
    {
        try {
            $requestId = $request->get_param('id');

            $retirement = $this->service->getRetirementByRequest($requestId);
            if (!$retirement) {
                return self::success(null); // No retirement yet
            }
            // Load receipts
            $retirement->receipts = $retirement->getReceipts();

            return self::success($retirement);

        } catch (Exception $e) {
            return self::error('fetch_error', $e->getMessage(), 400);
        }
    }
}
