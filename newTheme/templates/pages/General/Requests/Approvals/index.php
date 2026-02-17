<?php
/**
 * Template Name: Requests: Approvals
 * Description: Dashboard for managers to review pending requests
 */

$pageTitle = 'Approvals';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/requests')],
    ['name' => 'Approvals']
];
$activeMenu = 'requests-approvals';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Pending Approvals</h1>
                <p class="text-gray-500 mt-1">Review and action requests awaiting your approval</p>
            </div>

            <div class="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                <span id="pending-count" class="font-bold text-gray-900">0</span> requests pending
            </div>
        </div>

        <!-- Requests List -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px]">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <th class="px-6 py-4">Request #</th>
                            <th class="px-6 py-4">Requester</th>
                            <th class="px-6 py-4">Context</th>
                            <th class="px-6 py-4">Date</th>
                            <th class="px-6 py-4 text-right">Amount</th>
                            <th class="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody id="approvals-table-body" class="divide-y divide-gray-100">
                        <!-- rows will be populated via JS -->
                    </tbody>
                </table>
            </div>

            <!-- Loading State -->
            <div id="loading-state" class="p-10 text-center text-gray-400">
                <svg class="animate-spin h-8 w-8 mx-auto mb-4 text-primary-500" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                <p>Checking for pending approvals...</p>
            </div>

            <!-- Empty State -->
            <div id="empty-state" class="hidden p-10 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="text-green-500">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900">All Caught Up!</h3>
                <p class="text-gray-500 mt-1">You have no pending approvals at this time.</p>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const tableBody = document.getElementById('approvals-table-body');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const countDisplay = document.getElementById('pending-count');

        async function fetchApprovals() {
            try {
                const response = await fetch('/wp-json/api/v1/requests/pending-approvals', {
                    headers: {
                        'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                    }
                });

                if (!response.ok) throw new Error('Failed to load');

                const data = await response.json();
                const requests = data.data || [];

                renderApprovals(requests);

            } catch (error) {
                console.error(error);
                loadingState.innerHTML = '<p class="text-red-500">Failed to load data. Please refresh.</p>';
            }
        }

        function renderApprovals(requests) {
            loadingState.classList.add('hidden');
            countDisplay.textContent = requests.length;

            if (requests.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            requests.forEach(req => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition-colors';

                const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(req.total_amount);

                row.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">
                    <a href="/requests/view?id=${req.id}&action=review" class="hover:text-primary-600 transition-colors">
                        ${req.request_number}
                    </a>
                </td>
                <td class="px-6 py-4 text-gray-900">${req.created_by_name || 'Unknown'}</td>
                <td class="px-6 py-4 text-gray-600">
                    <span class="block text-sm font-medium text-gray-900">${req.request_type_name || 'Request'}</span>
                    <span class="block text-xs text-gray-500 truncate max-w-xs">${req.data?.purpose || 'No purpose'}</span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right font-medium text-gray-900">${amount}</td>
                <td class="px-6 py-4 text-center">
                    <a href="/requests/view?id=${req.id}&action=review" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Review
                    </a>
                </td>
            `;
                tableBody.appendChild(row);
            });
        }

        fetchApprovals();
    });
</script>

<?php get_footer(); ?>