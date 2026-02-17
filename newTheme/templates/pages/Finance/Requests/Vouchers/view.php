<?php
/**
 * Template Name: Finance: Requests - PV View
 * Description: Detailed view of a Payment Voucher
 */

$pageTitle = 'Finance: Voucher Details';
$breadcrumb = [
    ['name' => 'Payment Vouchers', 'url' => home_url('/finance/requests/pv')],
    ['name' => 'Details']
];
$activeMenu = 'finance-vouchers';

get_header();

// 1. Get Voucher ID
$voucher_id = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';

if (empty($voucher_id)) {
    echo '<div class="alert alert-danger">Voucher ID is missing.</div>';
    get_footer();
    exit;
}

// 2. Fetch Voucher Data (Simulated for frontend dev, replace with actual Service call)
// In real implementation: $voucher = VoucherService::getVoucher($voucher_id);
// For now, we'll fetch the associated request to get some data, or show placeholders
// A voucher is typically linked to a request.
use App\Core\Requests\Models\RequestInstance;
use App\Core\Requests\Services\RequestService;

// Attempt to find request with this voucher ID (assuming voucher_id is stored or passed)
// For this template, we might receive request_id if voucher_id isn't a standalone entity yet.
// Let's assume we pass ?request_id=XXX or ?id=VOUCHER_ID.
// If we have a dedicated vouchers table, we'd query that.
// Based on previous steps, we stored voucher data in the request meta.

$request_id = $voucher_id; // Using request ID as proxy for now since PV is generated from Request
$request = RequestInstance::findById($request_id);

if (!$request) {
    echo '<div class="alert alert-danger">Voucher/Request not found.</div>';
    get_footer();
    exit;
}

$data = $request->data;
$voucher_data = $data['voucher_details'] ?? [];

if (empty($voucher_data)) {
    echo '<div class="alert alert-warning">No voucher generated for this request yet.</div>';
    get_footer();
    exit;
}

$pv_number = $voucher_data['pv_number'] ?? 'PV-PENDING';
$date = $voucher_data['date'] ?? date('Y-m-d');
$payee = $voucher_data['payee_name'] ?? 'Unknown';
$amount = number_format($voucher_data['amount'] ?? 0, 2);
$currency = $voucher_data['currency'] ?? 'NGN';
$description = $voucher_data['description'] ?? 'Payment for services';
$bank_details = $voucher_data['payee_bank'] ?? 'N/A';

?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Payment Voucher: <?= esc_html($pv_number); ?>
    </h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <button onclick="window.print()" class="btn btn-primary shadow-md mr-2">
            <i data-lucide="printer" class="w-4 h-4 mr-2"></i> Print / Download PDF
        </button>
        <a href="<?= home_url('/finance/requests/pv'); ?>" class="btn btn-secondary shadow-md">
            Back to List
        </a>
    </div>
</div>

<!-- Voucher Template Preview -->
<div class="intro-y box overflow-hidden mt-5 p-10">
    <div class="border-b border-slate-200/60 dark:border-darkmode-400 pb-5 mb-5 text-center">
        <h1 class="text-3xl font-bold uppercase text-primary">Payment Voucher</h1>
        <div class="text-slate-500 mt-1"><?= esc_html(get_bloginfo('name')); ?></div>
    </div>

    <div class="flex flex-col lg:flex-row justify-between mb-10">
        <div>
            <div class="text-base text-slate-500">Payee Details</div>
            <div class="text-lg font-medium text-primary mt-2"><?= esc_html($payee); ?></div>
            <div class="mt-1"><?= esc_html($bank_details); ?></div>
        </div>
        <div class="lg:text-right mt-10 lg:mt-0">
            <div class="text-base text-slate-500">Voucher Details</div>
            <div class="mt-2">
                <span class="font-medium">Number:</span> <?= esc_html($pv_number); ?>
            </div>
            <div class="mt-1">
                <span class="font-medium">Date:</span> <?= esc_html($date); ?>
            </div>
            <div class="mt-1">
                <span class="font-medium">Status:</span> <span class="text-success font-medium">Generated</span>
            </div>
        </div>
    </div>

    <!-- Details Table -->
    <div class="overflow-x-auto">
        <table class="table border-b border-slate-200/60 font-medium">
            <thead>
                <tr class="bg-slate-50 dark:bg-darkmode-800">
                    <th class="!px-2 text-slate-500 whitespace-nowrap">Description</th>
                    <th class="!px-2 text-right text-slate-500 whitespace-nowrap">Amount (<?= esc_html($currency); ?>)
                    </th>
                </tr>
            </thead>
            <tbody>
                <!-- Main Description -->
                <tr>
                    <td class="!px-2 border-b dark:border-darkmode-400">
                        <div class="font-medium whitespace-nowrap"><?= esc_html($description); ?></div>
                        <?php if (isset($data['items']) && is_array($data['items'])): ?>
                            <div class="text-slate-500 text-xs mt-1">
                                <ul class="list-disc ml-5">
                                    <?php foreach ($data['items'] as $item): ?>
                                        <li><?= esc_html($item['description']); ?> (x<?= $item['quantity']; ?>)</li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>
                    </td>
                    <td class="!px-2 border-b dark:border-darkmode-400 text-right w-32 font-medium">
                        <?= number_format($voucher_data['amount'] ?? 0, 2); ?>
                    </td>
                </tr>
                <!-- Totals -->
                <tr>
                    <td class="!px-2 text-right font-medium text-lg pt-4">Total Amount:</td>
                    <td class="!px-2 text-right font-bold text-lg pt-4 text-primary">
                        <?= esc_html($currency); ?> <?= $amount; ?>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Signatures Section -->
    <div class="mt-20 grid grid-cols-2 gap-10">
        <div class="border-t border-slate-300 dark:border-darkmode-400 pt-4">
            <div class="font-medium">Prepared By</div>
            <div class="text-slate-500 text-xs mt-1">Name & Signature</div>
        </div>
        <div class="border-t border-slate-300 dark:border-darkmode-400 pt-4">
            <div class="font-medium">Authorized By</div>
            <div class="text-slate-500 text-xs mt-1">Name & Signature</div>
        </div>
    </div>
</div>

<?php get_footer(); ?>