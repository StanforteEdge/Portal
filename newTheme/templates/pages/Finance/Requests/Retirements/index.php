<?php
/**
 * Template Name: Finance: Requests - Retirement 
 * Description: Dashboard for finance team to process retirements
 */

$pageTitle = 'Finance: Retirement Verification';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Retirements']
];
$activeMenu = 'finance-retirements';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <h1 class="text-3xl font-bold mb-2 text-gray-800">Retirement Verification</h1>
        <p class="text-gray-500 mb-8">Review and verify expense retirements submitted by staff</p>

        <!-- Filter Tabs -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-6 inline-flex">
            <button class="filter-btn active px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600"
                data-status="retirement_pending">Pending Verification</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="completed">History</button>
        </div>

        <!-- Retirements List -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px]">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <th class="px-6 py-4">Request #</th>
                            <th class="px-6 py-4">Requester</th>
                            <th class="px-6 py-4">Purpose</th>
                            <th class="px-6 py-4">Submitted</th>
                            <th class="px-6 py-4 text-right">Actual Spent</th>
                            <th class="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody id="retirements-table-body" class="divide-y divide-gray-100">
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
                <p class="text-gray-500">No retirements found in this category.</p>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const tableBody = document.getElementById('retirements-table-body');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const filterBtns = document.querySelectorAll('.filter-btn');

        let currentStatus = 'retirement_pending';

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

                const actual = req.data?.retirement?.actual_amount
                    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(req.data.retirement.actual_amount)
                    : '-';

                const submittedDate = req.data?.retirement?.submitted_at
                    ? new Date(req.data.retirement.submitted_at).toLocaleDateString()
                    : '-';

                // Action
                let actionHtml = '';
                if (currentStatus === 'retirement_pending') {
                    actionHtml = `
                    <a href="/finance/requests/view?id=${req.id}" class="btn btn-sm btn-primary-soft">
                        Verify
                    </a>
                `;
                } else {
                    actionHtml = `
                     <a href="/finance/requests/view?id=${req.id}" class="text-gray-500 hover:text-primary-600">
                        View
                    </a>
                `;
                }

                row.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${req.request_number}</td>
                <td class="px-6 py-4 text-gray-900">${req.created_by_name}</td>
                <td class="px-6 py-4 text-gray-600 truncate max-w-xs">${req.data?.purpose || 'General'}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${submittedDate}</td>
                <td class="px-6 py-4 text-right font-medium text-gray-900">${actual}</td>
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
