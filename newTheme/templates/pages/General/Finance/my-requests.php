<?php

/**
 * Template Name: Staff: Requests
 * Description: View my submitted finance requests
 */

$pageTitle = 'My Finance Requests';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance Requests']
];
$activeMenu = 'finance-requests';

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">My Finance Requests</h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <a href="/finance/new" class="btn btn-primary shadow-md mr-2">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i> New Finance Request
        </a>
    </div>
</div>

<!-- Filters -->
<div class="flex flex-row  justify-between items-center mt-4 gap-4">
    <select id="filter-status" class="form-select">
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="disbursed">Disbursed</option>
        <option value="completed">Completed</option>
    </select>
    <select id="filter-request-type" class="form-select">
        <option value="">All Request Types</option>
    </select>
    <select id="filter-department" class="form-select">
        <option value="">All Departments</option>
    </select>
    <select id="filter-project" class="form-select">
        <option value="">All Projects</option>
    </select>
    <input type="text" id="filter-search" class="form-control" placeholder="Search...">
</div>

<!-- Requests Table -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-report">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">REQUEST ID</th>
                    <th class="whitespace-nowrap">TYPE</th>
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
            No requests found. <a href="/finance/new" class="text-primary underline">Create your first finance
                request</a>
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between mt-4" id="pagination-container">
        <div class="text-slate-500">
            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span
                id="showing-total">0</span> requests
        </div>
        <div class="flex gap-2" id="pagination-buttons"></div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        const API = {
            requests: '/wp-json/api/v1/finance/requests'
        };

        let state = {
            requests: [],
            requestTypes: [],
            departments: [],
            projects: [],
            filters: {
                status: '',
                request_type_id: '',
                department_id: '',
                project_id: '',
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
                loadLookupData(),
                loadRequests()
            ]);
        }

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get('/wp-json/api/v1/finance/lookup-data');
                const data = res.data?.data || res.data || {};

                state.requestTypes = data.request_types || [];
                state.departments = data.global?.departments || [];
                state.projects = data.global?.projects || [];

                renderFilters();
            } catch (e) {
                console.error('Load lookup error:', e);
            }
        }

        function renderFilters() {
            // Render request types
            const $typeFilter = $('#filter-request-type');
            state.requestTypes.forEach(type => {
                $typeFilter.append(`<option value="${type.id}">${type.name}</option>`);
            });

            // Render departments
            const $deptFilter = $('#filter-department');
            state.departments.forEach(dept => {
                $deptFilter.append(`<option value="${dept.id}">${dept.name}</option>`);
            });

            // Render projects
            const $projectFilter = $('#filter-project');
            state.projects.forEach(project => {
                $projectFilter.append(`<option value="${project.id}">${project.name}</option>`);
            });
        }

        async function loadRequests() {
            $('#loading-state').removeClass('hidden');
            $('#requests-table-body').empty();
            $('#empty-state').addClass('hidden');

            let url = `${API.requests}?page=${state.pagination.page}&per_page=${state.pagination.perPage}&my=true`;

            if (state.filters.status) url += `&status=${state.filters.status}`;
            if (state.filters.request_type_id) url += `&request_type_id=${state.filters.request_type_id}`;
            if (state.filters.department_id) url += `&department_id=${state.filters.department_id}`;
            if (state.filters.project_id) url += `&project_id=${state.filters.project_id}`;
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

                const amount = parseFloat(request.total_amount || 0);
                const formattedAmount = amount > 0 ? '₦' + amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                }) : '-';

                const date = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A';

                const row = `
                <tr class="intro-x">
                    <td>
                        <a href="/finance/request/${request.formatted_number || request.request_number || request.id}" class="font-medium text-primary hover:underline">
                            ${request.formatted_number || request.request_number || request.id}
                        </a>
                    </td>
                    <td>
                        <div>${request.request_type?.name || 'Finance Request'}</div>
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
                            <a href="/finance/requests/view?id=${request.request_number || request.id}" class="flex items-center text-primary">
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

        function debounce(func, wait) {
            let timeout;
            return function () {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, arguments), wait);
            };
        }

        // Event Handlers
        $('#filter-status').on('change', function () {
            state.filters.status = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        });

        $('#filter-request-type').on('change', function () {
            state.filters.request_type_id = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        });

        $('#filter-department').on('change', function () {
            state.filters.department_id = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        });

        $('#filter-project').on('change', function () {
            state.filters.project_id = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        });

        $('#filter-search').on('keyup', debounce(function () {
            state.filters.search = $(this).val();
            state.pagination.page = 1;
            loadRequests();
        }, 500));

        $(document).on('click', '.pagination-btn', function () {
            state.pagination.page = parseInt($(this).data('page'));
            loadRequests();
        });

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>