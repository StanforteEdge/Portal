<?php

// Smoke test: Finance request -> approval -> PV -> disbursement -> retirement
// Run via WP-CLI from your WordPress root:
//   WP_LOAD_PATH=/path/to/wp-load.php TEST_PROFILE_ID=1 wp eval-file /path/to/plugin/tests/finance-flow.php

function findWpLoad($startDir, $maxDepth = 6)
{
    $dir = $startDir;
    for ($i = 0; $i < $maxDepth; $i++) {
        $candidate = $dir . DIRECTORY_SEPARATOR . 'wp-load.php';
        if (file_exists($candidate)) {
            return $candidate;
        }
        $dir = dirname($dir);
    }
    return null;
}

// Prefer explicit env var, then common plugin-relative path, then walk up
$customWpLoad = getenv('WP_LOAD_PATH');
$pluginRelative = realpath(__DIR__ . '/../../../../wp-load.php');

$wpLoad = $customWpLoad && file_exists($customWpLoad)
    ? $customWpLoad
    : ($pluginRelative && file_exists($pluginRelative) ? $pluginRelative : findWpLoad(__DIR__));

if (!$wpLoad) {
    fwrite(STDERR, "wp-load.php not found. Set WP_LOAD_PATH to your WordPress root.\n");
    exit(1);
}

require_once $wpLoad;

global $wpdb;

$profileId = getenv('TEST_PROFILE_ID');
if (!$profileId) {
    $profileId = $wpdb->get_var("SELECT id FROM {$wpdb->prefix}sta_profiles ORDER BY id ASC LIMIT 1");
}

if (!$profileId) {
    fwrite(STDERR, "No profile found. Set TEST_PROFILE_ID.\n");
    exit(1);
}

$wpUserId = $wpdb->get_var($wpdb->prepare(
    "SELECT wp_user_id FROM {$wpdb->prefix}sta_profiles WHERE id = %d",
    $profileId
));
if ($wpUserId) {
    wp_set_current_user((int) $wpUserId);
}

$requestTypeId = getenv('TEST_REQUEST_TYPE_ID');
if (!$requestTypeId) {
    fwrite(STDERR, "TEST_REQUEST_TYPE_ID is required. Set it to a Finance request type ID.\n");
    exit(1);
}

// Validate request type really belongs to Finance
$requestType = (new \App\Core\Requests\Models\RequestType())->find($requestTypeId);
if (!$requestType) {
    fwrite(STDERR, "Invalid request type ID. Set TEST_REQUEST_TYPE_ID.\n");
    exit(1);
}

$requestGroup = (new \App\Core\Requests\Models\RequestGroup())->find($requestType->group_id);
if (!$requestGroup || $requestGroup->code !== 'finance') {
    fwrite(STDERR, "Request type is not a Finance type. Set TEST_REQUEST_TYPE_ID to a Finance request type.\n");
    exit(1);
}

echo "Using profile_id={$profileId}, request_type_id={$requestTypeId}\n";

// Create request
$financeService = new \App\Modules\Finance\Services\FinanceRequestService();
$create = $financeService->createFinanceRequest((int) $profileId, [
    'request_type_id' => $requestTypeId,
    'purpose' => 'Finance flow smoke test',
    'items' => [
        ['item' => 'Test Item A', 'quantity' => 1, 'unit_price' => 5000, 'amount' => 5000],
        ['item' => 'Test Item B', 'quantity' => 2, 'unit_price' => 2500, 'amount' => 5000],
    ],
    'amount' => 10000,
    'currency' => 'NGN',
    'status' => 'draft'
]);

if (!$create['success']) {
    fwrite(STDERR, "Failed to create request\n");
    exit(1);
}

$requestId = $create['request_id'];
echo "Created request ID: {$requestId}\n";

// Submit for approval
$submit = \App\Core\Requests\Services\RequestService::submitRequest($requestId, (int) $profileId);
if (!$submit['success']) {
    fwrite(STDERR, "Submit failed: {$submit['message']}\n");
    exit(1);
}
echo "Submitted request. Workflow: {$submit['workflow_id']}\n";

// Approve all steps (loop)
$maxSteps = 10;
for ($i = 0; $i < $maxSteps; $i++) {
    $req = \App\Core\Requests\Services\RequestService::getRequest($requestId);
    $status = $req['data']['status'] ?? null;
    if ($status === 'approved') {
        echo "Request approved.\n";
        break;
    }

    $result = \App\Core\Requests\Services\RequestService::processAction($requestId, 'approve', (int) $profileId, 'test approval');
    if (!$result['success']) {
        fwrite(STDERR, "Approval step failed.\n");
        exit(1);
    }
}

// Create PV
$reqData = \App\Core\Requests\Services\RequestService::getRequest($requestId);
$items = $reqData['data']['items'] ?? [];

$voucherService = new \App\Modules\Finance\Services\PaymentVoucherService();
$voucher = $voucherService->createVoucher([
    'request_id' => $requestId,
    'amount' => $reqData['data']['total_amount'] ?? 10000,
    'payment_method' => 'Cash',
    'payee_name' => 'Test Payee',
    'items' => array_map(function ($item) {
        return [
            'request_item_id' => $item->id ?? null,
            'amount' => $item->total_price ?? $item->amount ?? 0
        ];
    }, $items)
]);

echo "Created voucher: {$voucher->id}\n";

// Mark PV as paid (disbursed)
$voucherService->markAsPaid($voucher->id, [
    'payment_date' => date('Y-m-d'),
    'payment_method' => 'Cash'
]);
echo "Voucher marked as paid.\n";

// Submit retirement
$retirementService = new \App\Modules\Finance\Services\RetirementService();
$retirement = $retirementService->submitRetirement([
    'request_id' => $requestId,
    'payment_voucher_id' => $voucher->id,
    'receipts' => [
        [
            'file_id' => 'test-file-id',
            'description' => 'Test receipt',
            'amount' => 10000,
            'vendor_name' => 'Test Vendor',
            'receipt_date' => date('Y-m-d')
        ]
    ],
    'balance_returned' => 0,
    'notes' => 'Smoke test retirement'
]);

echo "Retirement submitted: {$retirement->id}\n";

// Verify retirement
$retirementService->verifyRetirement($retirement->id, 'Smoke test verification');
echo "Retirement verified.\n";

echo "Finance flow smoke test completed.\n";
