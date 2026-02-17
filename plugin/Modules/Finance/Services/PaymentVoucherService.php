<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Models\PaymentVoucher;
use App\Modules\Finance\Models\PaymentVoucherItem;
use App\Core\Requests\Models\RequestInstance;
use App\Core\Auth\Utils\AuthUtils;
use Exception;

class PaymentVoucherService
{
    /**
     * Create a new Payment Voucher from an approved Request
     * 
     * @param array $data Voucher data
     * @return PaymentVoucher
     * @throws Exception
     */
    public function createVoucher(array $data)
    {
        global $wpdb;

        // Validate required fields
        if (empty($data['request_id']) || empty($data['items'])) {
            throw new Exception("Request ID and Items are required.");
        }

        $request = RequestInstance::findById($data['request_id']);
        if (!$request) {
            throw new Exception("Request not found.");
        }

        // Ensure request is approved (or partially paid)
        if ($request->status !== 'approved' && $request->status !== 'partially_paid') {
            throw new Exception("Payment Vouchers can only be created for approved requests.");
        }

        // Extract organization from request (will be available after Migration_1_3_1)
        $organization_id = $request->organization_id ?? null;

        $currentUser = AuthUtils::getCurrentUser();
        if (!$currentUser || empty($currentUser->id)) {
            throw new Exception("Authenticated user required to create a voucher.");
        }

        $wpdb->query('START TRANSACTION');

        try {
            // Generate Voucher Number
            $voucherNumber = $data['voucher_number'] ?? PaymentVoucher::generateVoucherNumber();

            // Create Voucher
            $voucher = (new PaymentVoucher())->create([
                'id' => \wp_generate_uuid4(),
                'request_id' => $data['request_id'],
                'organization_id' => $organization_id, // Inherit from request
                'voucher_number' => $voucherNumber,
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'] ?? 'Cash',
                'payee_name' => $data['payee_name'],
                'is_partial_payment' => $data['is_partial_payment'] ?? false,
                'status' => 'pending', // Pending Accountant's final confirmation/payment
                'prepared_by' => $currentUser->id,
                'prepared_date' => date('Y-m-d'),
                'created_by' => $currentUser->id,
                'items_covered' => $data['items'] // JSON storage of covered items summary
            ]);

            // Create Voucher Items
            foreach ($data['items'] as $item) {
                (new PaymentVoucherItem())->create([
                    'id' => \wp_generate_uuid4(),
                    'payment_voucher_id' => $voucher->id,
                    'request_item_id' => $item['request_item_id'] ?? null,
                    'amount' => $item['amount']
                ]);
            }

            // Update Request Status to indicate processing
            if ($request->status === 'approved') {
                (new RequestInstance())->update($request->id, ['status' => 'payment_processing']);
            }

            $wpdb->query('COMMIT');

            return $voucher;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            throw $e;
        }
    }

    /**
     * Mark a Voucher as Paid
     * 
     * @param string $id Voucher ID
     * @param array $paymentDetails (date, method, etc)
     * @return PaymentVoucher
     */
    public function markAsPaid($id, $paymentDetails = [])
    {
        $voucher = PaymentVoucher::findById($id);
        if (!$voucher) {
            throw new Exception("Payment Voucher not found.");
        }

        if ($voucher->status === 'paid') {
            throw new Exception("Voucher is already paid.");
        }

        (new PaymentVoucher())->update($voucher->id, [
            'status' => 'paid',
            'payment_date' => $paymentDetails['payment_date'] ?? date('Y-m-d'),
            'payment_method' => $paymentDetails['payment_method'] ?? $voucher->payment_method
        ]);

        // Update Request Status
        $request = RequestInstance::findById($voucher->request_id);
        if ($request) {
            // Logic for status update
            // If not partial payment, mark request as paid
            if (!$voucher->is_partial_payment) {
                (new RequestInstance())->update($request->id, ['status' => 'disbursed']);
            } else {
                (new RequestInstance())->update($request->id, ['status' => 'partially_disbursed']);
            }
        }

        return $voucher;
    }

    /**
     * Get Vouchers for a specific Request
     * 
     * @param string $requestId
     * @param string|null $organization_id Optional organization filter (for scoped accountants)
     * @return array
     */
    public function getVouchersByRequest($requestId, $organization_id = null)
    {
        $model = new PaymentVoucher();
        $query = $model->where('request_id', $requestId);

        // If organization_id provided, filter by it (for org-scoped accountants)
        if ($organization_id !== null) {
            $query->where('organization_id', $organization_id);
        }

        return $query->get();
    }
}
