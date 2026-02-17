<?php

/**
 * Template Name: Finance: Pending Approvals
 * Description: Finance requests awaiting approval
 */

$pageTitle = 'Pending Approvals';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Pending Approvals']
];
$activeMenu = 'finance-approvals';
$requiredPermissions = ['requests.approve'];

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">Pending Approvals</h2>
</div>

<!-- Filters -->
<div class="intro-y box p-5 mt-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label class="form-label">Organization</label>
            <select id="filter-organization" class="form-select">
                <option value="">All Organizations</option>
                <!-- Populated via JS -->
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
            <input type="text" id="filter-search" class="form-control" placeholder="Search...">
        </div>
    </div>
</div>

<!-- Approvals Table -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-report">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">REQUEST ID</th>
                    <th class="whitespace-nowrap">REQUESTER</th>
                    <th class="whitespace-nowrap">TYPE</th>
                    <th class="text-center whitespace-nowrap">AMOUNT</th>
                    <th class="text-center whitespace-nowrap">TEAM</th>
                    <th class="text-center whitespace-nowrap">DATE</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="requests-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading pending approvals...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No pending approvals at this time.
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between mt-4">
        <div class="text-slate-500">
            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span id="showing-total">0</span> requests
        </div>
        <div class="flex gap-2" id="pagination-buttons"></div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            requests: '/wp-json/api/v1/finance/requests',
            requestTypes: '/wp-json/api/v1/finance/requests/types',
            organizations: '/wp-json/api/v1/organizations',
            lookupData: '/wp-json/api/v1/finance/lookup-data'
        };

        let state = {
            requests: [],
            requestTypes: [],
            organizations: [],
            teams: [],
            filters: {
                organization: '',
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
            await Promise.all([
                loadRequestTypes(),
                loadOrganizations(),
                loadLookupData()
            ]);
            await loadRequests();
        }

        async function loadRequestTypes() {
            try {
                const res = await window.ApiClient.get(API.requestTypes);
                state.requestTypes = res.data || [];
                renderTypeFilter();
            } catch (e) {
                console.error('Load types error:', e);
            }
        }

        async function loadOrganizations() {
            try {
                const res = await window.ApiClient.get(API.organizations);
                state.organizations = res.data || [];
                renderOrganizationFilter();
            } catch (e) {
                console.error('Load organizations error:', e);
            }
        }

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get(API.lookupData);
                state.teams = res.data?.teams || [];
                renderTeamFilter();
            } catch (e) {
                console.error('Load lookup data error:', e);
            }
        }

        function renderTypeFilter() {
            const $filter = $('#filter-type');
            state.requestTypes.forEach(type => {
                $filter.append(`<option value="${type.id}">${type.name}</option>`);
            });
        }

        function renderOrganizationFilter() {
            const $filter = $('#filter-organization');
            state.organizations.forEach(org => {
                $filter.append(`<option value="${org.id}">${org.name}</option>`);
            });
        }

        function renderTeamFilter() {
            const $filter = $('#filter-team');
            state.teams.forEach(team => {
                $filter.append(`<option value="${team.id}">${team.name}</option>`);
            });
        }

        async function loadRequests() {
            $('#loading-state').removeClass('hidden');
            $('#requests-table-body').empty();
            $('#empty-state').addClass('hidden');

            let url = `${API.requests}?page=${state.pagination.page}&per_page=${state.pagination.perPage}&status=pending&for_approval=true`;

            if (state.filters.organization) url += `&organization_id=${state.filters.organization}`;
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
                $('#loading-state').html('<div class="text-danger">Failed to load approvals</div>');
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
                const amount = parseFloat(request.amount || 0);
                const formattedAmount = '₦' + amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });
                const date = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A';

                const type = state.requestTypes.find(t => t.id == request.request_type_id);
                const typeName = type ? type.name : 'Finance Request';

                const row = `
                <tr class="intro-x">
                    <td>
                        <a href="/finance/request/${request.id}" class="font-medium text-primary hover:underline">
                            ${request.request_number || request.id}
                        </a>
                    </td>
                    <td>
                        <div class="font-medium">${request.requester_name || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${typeName}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium">${formattedAmount}</div>
                    </td>
                    <td class="text-center">
                        <div class="text-slate-600">${request.team_name || 'N/A'}</div>
                    </td>
                    <td class="text-center">
                        <div class="text-slate-500 text-xs">${date}</div>
                    </td>
                    <td class="table-report__action">
                        <div class="flex justify-center items-center gap-2">
                            <button class="flex items-center text-success btn-approve" data-id="${request.id}">
                                <i data-lucide="check" class="w-4 h-4 mr-1"></i> Approve
                            </button>
                            <button class="flex items-center text-danger btn-reject" data-id="${request.id}">
                                <i data-lucide="x" class="w-4 h-4 mr-1"></i> Reject
                            </button>
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

            if (currentPage > 1) {
                $buttons.append(`<button class="btn btn-sm btn-outline-secondary pagination-btn" data-page="${currentPage - 1}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>`);
            }

            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                const activeClass = i === currentPage ? 'btn-primary' : 'btn-outline-secondary';
                $buttons.append(`<button class="btn btn-sm ${activeClass} pagination-btn" data-page="${i}">${i}</button>`);
            }

            if (currentPage < totalPages) {
                $buttons.append(`<button class="btn btn-sm btn-outline-secondary pagination-btn" data-page="${currentPage + 1}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>`);
            }

            if (window.lucide) window.lucide.createIcons();
        }

        async function approveRequest(requestId) {
            if (!confirm('Are you sure you want to approve this request?')) return;

            try {
                await window.ApiClient.post(`/wp-json/api/v1/finance/requests/${requestId}/status`, {
                    action: 'approve'
                });
                showToast('Request approved successfully', 'success');
                loadRequests();
            } catch (e) {
                console.error('Approve error:', e);
                showToast(e.responseJSON?.message || 'Failed to approve request', 'error');
            }
        }

        async function rejectRequest(requestId) {
            const reason = prompt('Please provide a reason for rejection:');
            if (!reason) return;

            try {
                await window.ApiClient.post(`/wp-json/api/v1/finance/requests/${requestId}/status`, {
                    action: 'reject',
                    reason: reason
                });
                showToast('Request rejected', 'success');
                loadRequests();
            } catch (e) {
                console.error('Reject error:', e);
                showToast(e.responseJSON?.message || 'Failed to reject request', 'error');
            }
        }

        function debounce(func, wait) {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, arguments), wait);
            };
        }

        // Event Handlers
        $('#filter-organization, #filter-type, #filter-team').on('change', function() {
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

        $(document).on('click', '.btn-approve', function() {
            const requestId = $(this).data('id');
            approveRequest(requestId);
        });

        $(document).on('click', '.btn-reject', function() {
            const requestId = $(this).data('id');
            rejectRequest(requestId);
        });

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>
