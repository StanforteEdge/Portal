<?php

/**
 * Template Name: Requests: All
 * Description: Dashboard for users to view and manage their requests
 */

$pageTitle = 'My Requests';
$breadcrumb = [
    ['name' => 'Home', 'url' => home_url('/')],
    ['name' => 'My Requests']
];
$activeMenu = 'requests';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">My Requests</h1>
                <p class="text-gray-500 mt-1">Track and manage your financial and administrative requests</p>
            </div>
            <a href="/requests/new" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="inline mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Request
            </a>
        </div>

        <!-- Filters -->
        <div
            class="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-6 inline-flex overflow-x-auto max-w-full">
            <button class="filter-btn active px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600"
                data-status="">All</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="draft">Drafts</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="submitted">Submitted</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="approved">Approved</button>
            <button class="filter-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-status="rejected">Rejected</button>
        </div>

        <!-- Requests List -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px]">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <th class="px-6 py-4">Request #</th>
                            <th class="px-6 py-4">Type</th>
                            <th class="px-6 py-4">Date</th>
                            <th class="px-6 py-4 text-right">Amount</th>
                            <th class="px-6 py-4 text-center">Status</th>
                            <th class="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="requests-table-body" class="divide-y divide-gray-100">
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
                <p>Loading requests...</p>
            </div>

            <!-- Empty State -->
            <div id="empty-state" class="hidden p-10 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="text-gray-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900">No requests found</h3>
                <p class="text-gray-500 mt-1 mb-6">You haven't made any requests yet.</p>
                <a href="/requests/new" class="btn btn-primary-soft">Create your first request</a>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const tableBody = document.getElementById('requests-table-body');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const filterBtns = document.querySelectorAll('.filter-btn');

        let currentStatus = '';

        // Filter Click Handlers
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI Toggle
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary-600', 'text-white');
                    b.classList.add('text-gray-600', 'hover:bg-gray-50');
                });
                btn.classList.remove('text-gray-600', 'hover:bg-gray-50');
                btn.classList.add('bg-primary-600', 'text-white');

                // Logic
                currentStatus = btn.dataset.status;
                fetchRequests();
            });
        });

        async function fetchRequests() {
            // Reset UI
            tableBody.innerHTML = '';
            loadingState.classList.remove('hidden');
            emptyState.classList.add('hidden');

            try {
                // Build URL
                let url = '/wp-json/api/v1/requests?my_requests=true';
                if (currentStatus) {
                    url += `&status=${currentStatus}`;
                }

                const response = await fetch(url, {
                    headers: {
                        'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>' // Ensure Nonce if needed, or rely on cookie auth
                    }
                });

                if (!response.ok) throw new Error('Failed to load');

                const result = await response.json();
                const requests = result.data.requests || [];

                renderRequests(requests);

            } catch (error) {
                console.error(error);
                loadingState.innerHTML = '<p class="text-red-500">Failed to load data. Please refresh.</p>';
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
                row.className = 'hover:bg-gray-50 transition-colors cursor-pointer';
                row.onclick = () => window.location.href = `/requests/view?id=${req.id}`;

                const statusColor = getStatusColor(req.status);
                const typeName = req.request_type ? req.request_type.name : 'General Request';

                // Format Amount
                const amount = new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN'
                }).format(req.total_amount);

                row.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${req.formatted_number || req.request_number}</td>
                <td class="px-6 py-4 text-gray-600">${typeName}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right font-medium text-gray-900">${amount}</td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                        ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline text-gray-400">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </td>
            `;
                tableBody.appendChild(row);
            });
        }

        function getStatusColor(status) {
            switch (status) {
                case 'approved':
                    return 'bg-green-100 text-green-800';
                case 'submitted':
                    return 'bg-blue-100 text-blue-800';
                case 'rejected':
                    return 'bg-red-100 text-red-800';
                case 'draft':
                    return 'bg-gray-100 text-gray-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        }

        // Initial Load
        fetchRequests();
    });
</script>

<?php get_footer(); ?>