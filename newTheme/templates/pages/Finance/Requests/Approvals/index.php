<?php
/**
 * Template Name: Finance: Requests - Approvals
 * Description: Dashboard for finance officers to review pending requests
 */

$pageTitle = 'Finance: Approvals';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Approvals']
];
$activeMenu = 'finance-approvals';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Finance Approvals</h1>
                <p class="text-gray-500 mt-1">Review and action requests awaiting finance approval</p>
            </div>

            <div class="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                <span id="pending-count" class="font-bold text-gray-900">0</span> requests pending
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Status</label>
                    <select id="filter-status" class="w-full border rounded px-3 py-2 text-sm">
                        <option value="pending" selected>Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Date From</label>
                    <input id="filter-date-from" type="date" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Date To</label>
                    <input id="filter-date-to" type="date" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Staff Profile ID</label>
                    <input id="filter-staff-id" type="number" class="w-full border rounded px-3 py-2 text-sm" placeholder="Profile ID" />
                </div>

                <div>
                    <label class="block text-xs text-gray-500 mb-1">Team</label>
                    <select id="filter-team-id" class="w-full border rounded px-3 py-2 text-sm">
                        <option value="">All Teams</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Organization</label>
                    <select id="filter-organization-id" class="w-full border rounded px-3 py-2 text-sm">
                        <option value="">All Organizations</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Amount Min</label>
                    <input id="filter-amount-min" type="number" step="0.01" class="w-full border rounded px-3 py-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Amount Max</label>
                    <input id="filter-amount-max" type="number" step="0.01" class="w-full border rounded px-3 py-2 text-sm" placeholder="0.00" />
                </div>

                <div>
                    <label class="block text-xs text-gray-500 mb-1">Order By</label>
                    <select id="filter-order-by" class="w-full border rounded px-3 py-2 text-sm">
                        <option value="created_at" selected>Date</option>
                        <option value="total_amount">Amount</option>
                        <option value="id">ID</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Order Dir</label>
                    <select id="filter-order-dir" class="w-full border rounded px-3 py-2 text-sm">
                        <option value="desc" selected>Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Page</label>
                    <input id="filter-page" type="number" min="1" value="1" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Per Page</label>
                    <input id="filter-per-page" type="number" min="1" value="20" class="w-full border rounded px-3 py-2 text-sm" />
                </div>
            </div>

            <div class="flex gap-2 mt-4">
                <button id="btn-apply-filters" class="btn btn-primary">Apply Filters</button>
                <button id="btn-clear-filters" class="btn btn-outline-secondary">Clear</button>
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

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div id="pagination-info">Page 1 of 1</div>
            <div class="flex gap-2">
                <button id="btn-prev" class="btn btn-outline-secondary btn-sm">Prev</button>
                <button id="btn-next" class="btn btn-outline-secondary btn-sm">Next</button>
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
        const applyBtn = document.getElementById('btn-apply-filters');
        const clearBtn = document.getElementById('btn-clear-filters');
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        const paginationInfo = document.getElementById('pagination-info');

        const state = {
            total: 0,
            perPage: 20,
            currentPage: 1,
            totalPages: 1
        };

        async function loadLookupData() {
            try {
                const res = await fetch('/wp-json/api/v1/finance/lookup-data', {
                    headers: { 'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>' }
                });
                if (!res.ok) return;
                const data = await res.json();
                const payload = Array.isArray(data.data) ? data.data[0] : data.data;
                const lookup = payload?.data || payload || {};

                const teams = lookup.global?.teams || [];
                const orgs = lookup.profile?.organizations || [];

                const teamSelect = document.getElementById('filter-team-id');
                teams.forEach(team => {
                    const opt = document.createElement('option');
                    opt.value = team.id;
                    opt.textContent = team.name;
                    teamSelect.appendChild(opt);
                });

                const orgSelect = document.getElementById('filter-organization-id');
                orgs.forEach(org => {
                    const opt = document.createElement('option');
                    opt.value = org.id;
                    opt.textContent = org.name;
                    orgSelect.appendChild(opt);
                });
            } catch (e) {
                console.error('Lookup load error', e);
            }
        }

        function getFilters() {
            return {
                status: document.getElementById('filter-status').value,
                date_from: document.getElementById('filter-date-from').value,
                date_to: document.getElementById('filter-date-to').value,
                staff_id: document.getElementById('filter-staff-id').value,
                team_id: document.getElementById('filter-team-id').value,
                organization_id: document.getElementById('filter-organization-id').value,
                amount_min: document.getElementById('filter-amount-min').value,
                amount_max: document.getElementById('filter-amount-max').value,
                order_by: document.getElementById('filter-order-by').value,
                order_dir: document.getElementById('filter-order-dir').value,
                page: document.getElementById('filter-page').value,
                per_page: document.getElementById('filter-per-page').value
            };
        }

        function buildQuery(filters) {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    params.set(key, value);
                }
            });
            return params.toString();
        }

        async function fetchApprovals() {
            try {
                tableBody.innerHTML = '';
                loadingState.classList.remove('hidden');
                emptyState.classList.add('hidden');

                const filters = getFilters();
                const query = buildQuery(filters);
                const response = await fetch(`/wp-json/api/v1/finance/requests/approvals?${query}`, {
                    headers: {
                        'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                    }
                });

                if (!response.ok) throw new Error('Failed to load');

                const data = await response.json();
                const requests = data.data?.requests || data.data || [];
                const total = data.data?.pagination?.total ?? requests.length;
                const perPage = data.data?.pagination?.per_page ?? parseInt(filters.per_page || '20', 10);
                const currentPage = data.data?.pagination?.current_page ?? parseInt(filters.page || '1', 10);
                const totalPages = Math.max(1, Math.ceil(total / perPage));

                state.total = total;
                state.perPage = perPage;
                state.currentPage = currentPage;
                state.totalPages = totalPages;

                renderApprovals(requests, total);
                renderPagination();

            } catch (error) {
                console.error(error);
                loadingState.innerHTML = '<p class="text-red-500">Failed to load data. Please refresh.</p>';
            }
        }

        function renderApprovals(requests, total) {
            loadingState.classList.add('hidden');
            countDisplay.textContent = total;

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
                    <a href="/finance/requests/view?id=${req.id}" class="hover:text-primary-600 transition-colors">
                        ${req.formatted_number || req.request_number || req.id}
                    </a>
                </td>
                <td class="px-6 py-4 text-gray-900">${req.created_by_name || 'Unknown'}</td>
                <td class="px-6 py-4 text-gray-600">
                    <span class="block text-sm font-medium text-gray-900">${req.request_type?.name || 'Request'}</span>
                    <span class="block text-xs text-gray-500 truncate max-w-xs">${req.data?.purpose || 'No purpose'}</span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right font-medium text-gray-900">${amount}</td>
                <td class="px-6 py-4 text-center">
                    <a href="/finance/requests/view?id=${req.id}" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Review
                    </a>
                </td>
            `;
                tableBody.appendChild(row);
            });
        }

        function renderPagination() {
            paginationInfo.textContent = `Page ${state.currentPage} of ${state.totalPages}`;
            prevBtn.disabled = state.currentPage <= 1;
            nextBtn.disabled = state.currentPage >= state.totalPages;
        }

        applyBtn.addEventListener('click', () => {
            fetchApprovals();
        });

        clearBtn.addEventListener('click', () => {
            document.getElementById('filter-status').value = 'pending';
            document.getElementById('filter-date-from').value = '';
            document.getElementById('filter-date-to').value = '';
            document.getElementById('filter-staff-id').value = '';
            document.getElementById('filter-team-id').value = '';
            document.getElementById('filter-organization-id').value = '';
            document.getElementById('filter-amount-min').value = '';
            document.getElementById('filter-amount-max').value = '';
            document.getElementById('filter-order-by').value = 'created_at';
            document.getElementById('filter-order-dir').value = 'desc';
            document.getElementById('filter-page').value = '1';
            document.getElementById('filter-per-page').value = '20';
            fetchApprovals();
        });

        prevBtn.addEventListener('click', () => {
            const pageInput = document.getElementById('filter-page');
            const current = parseInt(pageInput.value || '1', 10);
            if (current > 1) {
                pageInput.value = String(current - 1);
                fetchApprovals();
            }
        });

        nextBtn.addEventListener('click', () => {
            const pageInput = document.getElementById('filter-page');
            const current = parseInt(pageInput.value || '1', 10);
            if (current < state.totalPages) {
                pageInput.value = String(current + 1);
                fetchApprovals();
            }
        });

        loadLookupData();
        fetchApprovals();
    });
</script>

<?php get_footer(); ?>
