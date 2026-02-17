<?php

/**
 * Template Name: Finance: Requests
 * Description: View all finance requests
 */

$pageTitle = 'Finance Requests';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Requests']
];
$activeMenu = 'finance-requests';

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">Finance Requests</h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <a href="/finance/new-request" class="btn btn-primary shadow-md mr-2">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i> New Request
        </a>
    </div>
</div>

<!-- Filters -->
<div class="intro-y box p-5 mt-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label class="form-label">Status</label>
            <select id="filter-status" class="form-select">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="disbursed">Disbursed</option>
                <option value="retired">Retired</option>
                <option value="completed">Completed</option>
            </select>
        </div>
        <div>
            <label class="form-label">Request Type</label>
            <select id="filter-type" class="form-select">
                <option value="">All Types</option>
                <!-- Populated via JS -->
            </select>
        </div>
        <div>
            <label class="form-label">Team</label>
            <select id="filter-team" class="form-select">
                <option value="">All Teams</option>
                <!-- Populated via JS -->
            </select>
        </div>
        <div>
            <label class="form-label">Search</label>
            <input type="text" id="filter-search" class="form-control" placeholder="Search requests...">
        </div>
    </div>
</div>

<!-- Requests Table -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-report">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">REQUEST ID</th>
                    <th class="whitespace-nowrap">TYPE</th>
                    <th class="whitespace-nowrap">REQUESTER</th>
                    <th class="text-center whitespace-nowrap">AMOUNT</th>
                    <th class="text-center whitespace-nowrap">STATUS</th>
                    <th class="text-center whitespace-nowrap">DATE</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="requests-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading requests...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No requests found.
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between mt-4" id="pagination-container">
        <div class="text-slate-500">
            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span id="showing-total">0</span> requests
        </div>
        <div class="flex gap-2" id="pagination-buttons">
            <!-- Populated via JS -->
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            requests: '/wp-json/api/v1/finance/requests',
            requestTypes: '/wp-json/api/v1/finance/requests/types',
            lookupData: '/wp-json/api/v1/finance/lookup-data'
        };

        let state = {
            requests: [],
            requestTypes: [],
            lookupData: {},
            filters: {
                status: '',
                type: '',
                team: '',
                search: ''
            },
            pagination: {
                page: 1,
                perPage: 20,
                total: 0
            }
        };

        async function init() {
            try {
                await Promise.all([
                    loadRequestTypes(),
                    loadLookupData()
                ]);
                await loadRequests();
            } catch (e) {
                console.error('Init error:', e);
                showToast('Failed to load data', 'error');
            }
        }

        async function loadRequestTypes() {
            try {
                const res = await window.ApiClient.get(API.requestTypes);
                state.requestTypes = res.data || [];
                populateTypeFilter();
            } catch (e) {
                console.error('Load types error:', e);
            }
        }

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get(API.lookupData);
                state.lookupData = res.data || {};
                populateTeamFilter();
            } catch (e) {
                console.error('Load lookup error:', e);
            }
        }

        function populateTypeFilter() {
            const $filter = $('#filter-type');
            state.requestTypes.forEach(type => {
                $filter.append(`<option value="${type.id}">${type.name}</option>`);
            });
        }

        function populateTeamFilter() {
            const $filter = $('#filter-team');
            if (state.lookupData.teams) {
                state.lookupData.teams.forEach(team => {
                    $filter.append(`<option value="${team.id}">${team.name}</option>`);
                });
            }
        }

        async function loadRequests() {
            $('#loading-state').removeClass('hidden');
            $('#requests-table-body').empty();
            $('#empty-state').addClass('hidden');

            let url = `${API.requests}?page=${state.pagination.page}&per_page=${state.pagination.perPage}&group=finance`;

            if (state.filters.status) url += `&status=${state.filters.status}`;
            if (state.filters.type) url += `&request_type_id=${state.filters.type}`;
            if (state.filters.team) url += `&team_id=${state.filters.team}`;
            if (state.filters.search) url += `&search=${encodeURIComponent(state.filters.search)}`;

            try {
                const res = await window.ApiClient.get(url);
                state.requests = res.data || [];
                state.pagination.total = res.meta?.total || 0;

                $('#loading-state').addClass('hidden');
                renderTable();
                renderPagination();
            } catch (e) {
                console.error('Load requests error:', e);
                $('#loading-state').html('<div class="text-danger">Failed to load requests</div>');
            }
        }

        function renderTable() {
            const $tbody = $('#requests-table-body');
            $tbody.empty();

            if (state.requests.length === 0) {
                $('#empty-state').removeClass('hidden');
                return;
            }

            state.requests.forEach(request => {
                const statusClass = getStatusClass(request.status);
                const statusBadge = `<span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${request.status?.toUpperCase()}</span>`;

                const amount = parseFloat(request.amount || 0);
                const formattedAmount = '₦' + amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });

                const requestType = state.requestTypes.find(t => t.id == request.request_type_id);
                const typeName = requestType ? requestType.name : 'Finance Request';

                const requester = request.requester_name || request.created_by || 'N/A';
                const date = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A';

                const row = `
                <tr class="intro-x">
                    <td>
                        <a href="/finance/request/${request.id}" class="font-medium text-primary hover:underline">
                            ${request.request_number || request.id}
                        </a>
                    </td>
                    <td>
                        <div class="text-slate-600">${typeName}</div>
                    </td>
                    <td>
                        <div>${requester}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium">${formattedAmount}</div>
                    </td>
                    <td class="text-center">
                        ${statusBadge}
                    </td>
                    <td class="text-center">
                        <div class="text-slate-500 text-xs">${date}</div>
                    </td>
                    <td class="table-report__action">
                        <div class="flex justify-center items-center gap-2">
                            <a href="/finance/request/${request.id}" class="flex items-center text-primary">
                                <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                            </a>
                        </div>
                    </td>
                </tr>
            `;
                $tbody.append(row);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function getStatusClass(status) {
            const classes = {
                draft: 'bg-slate-100 text-slate-600',
                pending: 'bg-warning/10 text-warning',
                approved: 'bg-success/10 text-success',
                rejected: 'bg-danger/10 text-danger',
                disbursed: 'bg-info/10 text-info',
                retired: 'bg-primary/10 text-primary',
                completed: 'bg-success/10 text-success'
            };
            return classes[status?.toLowerCase()] || 'bg-slate-100 text-slate-600';
        }

        function renderPagination() {
            const totalPages = Math.ceil(state.pagination.total / state.pagination.perPage);
            const currentPage = state.pagination.page;

            const from = state.pagination.total === 0 ? 0 : ((currentPage - 1) * state.pagination.perPage) + 1;
            const to = Math.min(currentPage * state.pagination.perPage, state.pagination.total);

            $('#showing-from').text(from);
            $('#showing-to').text(to);
            $('#showing-total').text(state.pagination.total);

            const $buttons = $('#pagination-buttons');
            $buttons.empty();

            if (totalPages <= 1) return;

            // Previous button
            if (currentPage > 1) {
                $buttons.append(`
                <button class="btn btn-sm btn-outline-secondary pagination-btn" data-page="${currentPage - 1}">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </button>
            `);
            }

            // Page numbers
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                const activeClass = i === currentPage ? 'btn-primary' : 'btn-outline-secondary';
                $buttons.append(`
                <button class="btn btn-sm ${activeClass} pagination-btn" data-page="${i}">${i}</button>
            `);
            }

            // Next button
            if (currentPage < totalPages) {
                $buttons.append(`
                <button class="btn btn-sm btn-outline-secondary pagination-btn" data-page="${currentPage + 1}">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            `);
            }

            if (window.lucide) window.lucide.createIcons();
        }

        function debounce(func, wait) {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, arguments), wait);
            };
        }

        // Event Handlers
        $('#filter-status, #filter-type, #filter-team').on('change', function() {
            state.filters[$(this).attr('id').replace('filter-', '')] = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        });

        $('#filter-search').on('keyup', debounce(function() {
            state.filters.search = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        }, 500));

        $(document).on('click', '.pagination-btn', function() {
            state.pagination.page = parseInt($(this).data('page'));
            loadRequests();
        });

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>
