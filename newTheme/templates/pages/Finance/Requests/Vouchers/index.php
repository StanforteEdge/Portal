<?php
/**
 * Template Name: Finance: Requests - PV
 * Description: Dashboard for finance team to manage payment vouchers
 */

$pageTitle = 'Payment Vouchers';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Payment Vouchers']
];
$activeMenu = 'finance';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Payment Vouchers</h1>
                <p class="text-gray-500 mt-1">Generate and manage payment vouchers for approved requests</p>
            </div>
            <a href="/finance/requests/pv/new" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="inline mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Direct Voucher
            </a>
        </div>

        <!-- Filter Tabs -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-6 inline-flex">
            <button class="filter-btn active px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600"
                data-status="approved">Pending Generation</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="voucher_created">Generated Vouchers</button>
        </div>

        <!-- Vouchers List -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px]">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <th class="px-6 py-4">Request #</th>
                            <th class="px-6 py-4">Requester / Payee</th>
                            <th class="px-6 py-4">Purpose</th>
                            <th class="px-6 py-4">Date</th>
                            <th class="px-6 py-4 text-right">Amount</th>
                            <th class="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody id="vouchers-table-body" class="divide-y divide-gray-100">
                        <!-- rows populated via JS -->
                    </tbody>
                </table>
            </div>

            <!-- Loading -->
            <div id="loading-state" class="p-10 text-center text-gray-400">
                <svg class="animate-spin h-8 w-8 mx-auto mb-4 text-primary-500" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                </svg>
                <p>Loading...</p>
            </div>

            <!-- Empty -->
            <div id="empty-state" class="hidden p-10 text-center">
                <p class="text-gray-500">No vouchers found in this category.</p>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const tableBody = document.getElementById('vouchers-table-body');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const filterBtns = document.querySelectorAll('.filter-btn');

        let currentStatus = 'approved';

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary-600', 'text-white');
                    b.classList.add('text-gray-600', 'hover:bg-gray-50');
                });
                btn.classList.remove('text-gray-600', 'hover:bg-gray-50');
                btn.classList.add('bg-primary-600', 'text-white');

                currentStatus = btn.dataset.status;
                fetchRequests();
            });
        });

        async function fetchRequests() {
            tableBody.innerHTML = '';
            loadingState.classList.remove('hidden');
            emptyState.classList.add('hidden');

            try {
                // Fetch requests with specific status
                // Note: We are using the generic requests endpoint. 
                // Ideally, we would have a dedicated 'finance/requests' endpoint to see ALL requests, 
                // but 'requests.view' permission (handled in RequestController) allows Finance Role to see all.
                const response = await fetch(`/wp-json/api/v1/requests?status=${currentStatus}`, {
                    headers: { 'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>' }
                });

                const data = await response.json();
                const requests = data.data || [];

                renderRequests(requests);

            } catch (error) {
                console.error(error);
                loadingState.innerHTML = '<p class="text-red-500">Failed to load data.</p>';
            }
        }

        function renderRequests(requests) {
            loadingState.classList.add('hidden');

            if (requests.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            requests.forEach(req => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition-colors';
                const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(req.total_amount);

                // Determine Action
                let actionHtml = '';
                if (currentStatus === 'approved') {
                    actionHtml = `
                    <a href="/finance/requests/pv/new?request_id=${req.id}" class="btn btn-sm btn-primary-soft">
                        Generate PV
                    </a>
                `;
                } else {
                    // Already Generated -> Download
                    // Assuming we can re-generate or download safely
                    // Or view details
                    actionHtml = `
                     <a href="/finance/requests/pv/new?request_id=${req.id}&view=true" class="btn btn-sm btn-secondary-soft mr-2">
                        View
                    </a>
                    <button onclick="downloadPV('${req.data?.payment_voucher?.number || ''}')" class="text-gray-500 hover:text-primary-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                `;
                }

                row.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${req.request_number}</td>
                <td class="px-6 py-4 text-gray-900">
                    <div class="font-medium">${req.data?.payment_voucher?.payee || req.created_by_name}</div>
                    <div class="text-xs text-gray-500">Ref: ${req.data?.payment_voucher?.number || '-'}</div>
                </td>
                <td class="px-6 py-4 text-gray-600 truncate max-w-xs">${req.data?.purpose || 'General'}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right font-medium text-gray-900">${amount}</td>
                <td class="px-6 py-4 text-center">
                    ${actionHtml}
                </td>
            `;
                tableBody.appendChild(row);
            });
        }

        fetchRequests();
    });
</script>

<?php get_footer(); ?>