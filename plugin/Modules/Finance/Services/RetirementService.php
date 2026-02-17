<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Models\Retirement;
use App\Modules\Finance\Models\RetirementReceipt;
use App\Modules\Finance\Models\PaymentVoucher;
use App\Core\Requests\Models\RequestInstance;
use App\Core\Auth\Utils\AuthUtils;
use Exception;

class RetirementService
{
    /**
     * Submit a Retirement for a Request/PV
     */
    public function submitRetirement(array $data)
    {
        global $wpdb;

        if (empty($data['request_id']) || empty($data['receipts'])) {
            throw new Exception("Request ID and Receipts are required.");
        }

        $request = RequestInstance::findById($data['request_id']);
        if (!$request)
            throw new Exception("Request not found.");

        // Extract organization from request
        $organization_id = $request->organization_id ?? null;

        $currentUser = AuthUtils::getCurrentUser();
        if (!$currentUser || empty($currentUser->id)) {
            throw new Exception("Authenticated user required to submit retirement.");
        }

        $wpdb->query('START TRANSACTION');

        try {
            // Calculate totals
            $receiptTotal = 0;
            foreach ($data['receipts'] as $receipt) {
                $receiptTotal += (float) $receipt['amount'];
            }

            $retirement = (new Retirement())->create([
                'id' => \wp_generate_uuid4(),
                'request_id' => $data['request_id'],
                'organization_id' => $organization_id, // Inherit from request
                'payment_voucher_id' => $data['payment_voucher_id'] ?? null, // Optional, can retire whole request
                'retired_by' => $currentUser->id,
                'retired_date' => date('Y-m-d'),
                'total_receipts_amount' => $receiptTotal,
                'balance_returned' => $data['balance_returned'] ?? 0,
                'status' => 'pending', // Pending verification
                'notes' => $data['notes'] ?? ''
            ]);

            // Save Receipts
            foreach ($data['receipts'] as $receipt) {
                (new RetirementReceipt())->create([
                    'id' => \wp_generate_uuid4(),
                    'retirement_id' => $retirement->id,
                    'file_id' => $receipt['file_id'],
                    'description' => $receipt['description'] ?? 'Receipt',
                    'amount' => $receipt['amount'],
                    'vendor_name' => $receipt['vendor_name'] ?? null,
                    'receipt_date' => $receipt['receipt_date'] ?? date('Y-m-d')
                ]);
            }

            // Update Request status to indicate retirement submitted
            (new RequestInstance())->update($request->id, ['status' => 'pending_retirement']);

            $wpdb->query('COMMIT');
            return $retirement;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            throw $e;
        }
    }

    /**
     * Verify and Complete Retirement
     */
    public function verifyRetirement($id, $notes = '')
    {
        $retirement = Retirement::findById($id);
        if (!$retirement)
            throw new Exception("Retirement record not found.");

        $currentUser = AuthUtils::getCurrentUser();
        if (!$currentUser || empty($currentUser->id)) {
            throw new Exception("Authenticated user required to verify retirement.");
        }

        (new Retirement())->update($retirement->id, [
            'status' => 'completed',
            'verified_by' => $currentUser->id,
            'verified_date' => date('Y-m-d'),
            'notes' => $notes ? $retirement->notes . "\nVerified: " . $notes : $retirement->notes
        ]);

        // Close Request
        $request = RequestInstance::findById($retirement->request_id);
        if ($request) {
            (new RequestInstance())->update($request->id, ['status' => 'retired']);
        }

        return $retirement;
    }

    /**
     * Get Retirement record for a request
     * 
     * @param string $requestId
     * @param string|null $organization_id Optional organization filter
     * @return object|null
     */
    public function getRetirementByRequest($requestId, $organization_id = null)
    {
        $model = new Retirement();
        $query = $model->where('request_id', $requestId);

        // If organization_id provided, filter by it
        if ($organization_id !== null) {
            $query->where('organization_id', $organization_id);
        }

        return $query->first();
    }
}
