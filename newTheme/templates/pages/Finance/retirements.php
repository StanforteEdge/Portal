<?php

/**
 * Template Name: Finance: Retirements
 * Description: Manage request retirements
 */

$pageTitle = 'Request Retirements';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Retirements']
];
$activeMenu = 'finance-retirements';
$requiredPermissions = ['finance.view'];

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">Request Retirements</h2>
</div>

<!-- Filters -->
<div class="intro-y box p-5 mt-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label class="form-label">Status</label>
            <select id="filter-status" class="form-select">
                <option value="">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
        <div>
            <label class="form-label">Organization</label>
            <select id="filter-organization" class="form-select">
                <option value="">All Organizations</option>
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
            <input type="text" id="filter-search" class="form-control" placeholder="Request number...">
        </div>
    </div>
</div>

<!-- Retirements Table -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-report">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">REQUEST</th>
                    <th class="whitespace-nowrap">REQUESTER</th>
                    <th class="text-center whitespace-nowrap">DISBURSED</th>
                    <th class="text-center whitespace-nowrap">RETIRED</th>
                    <th class="text-center whitespace-nowrap">VARIANCE</th>
                    <th class="text-center whitespace-nowrap">STATUS</th>
                    <th class="text-center whitespace-nowrap">DATE</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="retirements-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading retirements...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No retirements found.
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between mt-4">
        <div class="text-slate-500">
            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span id="showing-total">0</span> retirements
        </div>
        <div class="flex gap-2" id="pagination-buttons"></div>
    </div>
</div>

<!-- Retirement Detail Modal -->
<div id="retirement-detail-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Retirement Details</h2>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <div class="text-slate-500 text-xs">Request Number</div>
                        <div class="font-medium" id="detail-request-number"></div>
                    </div>
                    <div>
                        <div class="text-slate-500 text-xs">Requester</div>
                        <div class="font-medium" id="detail-requester"></div>
                    </div>
                    <div>
                        <div class="text-slate-500 text-xs">Disbursed Amount</div>
                        <div class="font-medium text-primary" id="detail-disbursed"></div>
                    </div>
                    <div>
                        <div class="text-slate-500 text-xs">Retired Amount</div>
                        <div class="font-medium text-success" id="detail-retired"></div>
                    </div>
                </div>

                <div class="mb-4">
                    <div class="text-slate-500 text-xs mb-2">Description</div>
                    <div class="p-3 bg-slate-50 rounded" id="detail-description"></div>
                </div>

                <div class="mb-4">
                    <div class="text-slate-500 text-xs mb-2">Retirement Items</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="text-right">Amount</th>
                                <th class="text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody id="detail-items">
                        </tbody>
                    </table>
                </div>

                <div class="mb-4">
                    <div class="text-slate-500 text-xs mb-2">Supporting Documents</div>
                    <div id="detail-documents" class="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
                </div>

                <div id="verification-section" class="mt-6 pt-4 border-t">
                    <label class="form-label">Verification Notes</label>
                    <textarea id="verification-notes" class="form-control" rows="3" placeholder="Add notes for verification..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary mr-2" data-tw-dismiss="modal">Close</button>
                <button type="button" class="btn btn-danger mr-2" id="btn-reject-retirement">Reject</button>
                <button type="button" class="btn btn-success" id="btn-verify-retirement">Verify & Approve</button>
            </div>
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            retirements: '/wp-json/api/v1/finance/retirements',
            verifyRetirement: '/wp-json/api/v1/finance/retirements/:id/verify',
            rejectRetirement: '/wp-json/api/v1/finance/retirements/:id/reject',
            organizations: '/wp-json/api/v1/organizations',
            lookupData: '/wp-json/api/v1/finance/lookup-data'
        };

        let state = {
            retirements: [],
            organizations: [],
            teams: [],
            currentRetirement: null,
            filters: {
                status: '',
                organization: '',
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
                loadOrganizations(),
                loadLookupData()
            ]);
            await loadRetirements();
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

        async function loadRetirements() {
            $('#loading-state').removeClass('hidden');
            $('#retirements-table-body').empty();
            $('#empty-state').addClass('hidden');

            let url = `${API.retirements}?page=${state.pagination.page}&per_page=${state.pagination.perPage}`;

            if (state.filters.status) url += `&status=${state.filters.status}`;
            if (state.filters.organization) url += `&organization_id=${state.filters.organization}`;
            if (state.filters.team) url += `&team_id=${state.filters.team}`;
            if (state.filters.search) url += `&search=${encodeURIComponent(state.filters.search)}`;

            try {
                const res = await window.ApiClient.get(url);
                state.retirements = res.data || [];
                state.pagination.total = res.meta?.total || 0;

                $('#loading-state').addClass('hidden');
                renderTable();
                renderPagination();
            } catch (e) {
                console.error('Load retirements error:', e);
                $('#loading-state').html('<div class="text-danger">Failed to load retirements</div>');
            }
        }

        function renderTable() {
            const $tbody = $('#retirements-table-body');
            $tbody.empty();

            if (state.retirements.length === 0) {
                $('#empty-state').removeClass('hidden');
                return;
            }

            state.retirements.forEach(retirement => {
                const disbursed = parseFloat(retirement.disbursed_amount || 0);
                const retired = parseFloat(retirement.retired_amount || 0);
                const variance = disbursed - retired;

                const formattedDisbursed = '₦' + disbursed.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });
                const formattedRetired = '₦' + retired.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });
                const formattedVariance = '₦' + Math.abs(variance).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });

                const varianceClass = variance > 0 ? 'text-warning' : variance < 0 ? 'text-danger' : 'text-success';
                const varianceText = variance > 0 ? `+${formattedVariance}` : variance < 0 ? `-${formattedVariance}` : formattedVariance;

                const date = retirement.submitted_at ? new Date(retirement.submitted_at).toLocaleDateString() : 'N/A';

                const statusClass = getStatusClass(retirement.status);
                const statusBadge = `<span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${retirement.status?.toUpperCase()}</span>`;

                const isPending = retirement.status === 'pending';

                const row = `
                <tr class="intro-x">
                    <td>
                        <a href="/finance/request/${retirement.request_id}" class="text-primary hover:underline">
                            ${retirement.request_number || retirement.request_id}
                        </a>
                    </td>
                    <td>
                        <div class="font-medium">${retirement.requester_name || 'N/A'}</div>
                        <div class="text-xs text-slate-500">${retirement.team_name || ''}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium">${formattedDisbursed}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium">${formattedRetired}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium ${varianceClass}">${varianceText}</div>
                    </td>
                    <td class="text-center">
                        ${statusBadge}
                    </td>
                    <td class="text-center">
                        <div class="text-slate-500 text-xs">${date}</div>
                    </td>
                    <td class="table-report__action">
                        <div class="flex justify-center items-center gap-2">
                            <button class="flex items-center text-primary btn-view-retirement" data-id="${retirement.id}">
                                <i data-lucide="eye" class="w-4 h-4 mr-1"></i> ${isPending ? 'Review' : 'View'}
                            </button>
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
                pending: 'bg-warning/10 text-warning',
                verified: 'bg-success/10 text-success',
                rejected: 'bg-danger/10 text-danger'
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

        async function viewRetirement(retirementId) {
            try {
                const retirement = state.retirements.find(r => r.id == retirementId);
                if (!retirement) return;

                state.currentRetirement = retirement;

                $('#detail-request-number').text(retirement.request_number || retirement.request_id);
                $('#detail-requester').text(retirement.requester_name || 'N/A');
                $('#detail-disbursed').text('₦' + parseFloat(retirement.disbursed_amount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                }));
                $('#detail-retired').text('₦' + parseFloat(retirement.retired_amount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                }));
                $('#detail-description').text(retirement.description || 'No description provided');

                // Render items
                const $items = $('#detail-items');
                $items.empty();
                if (retirement.items && retirement.items.length > 0) {
                    retirement.items.forEach(item => {
                        $items.append(`
                        <tr>
                            <td>${item.description}</td>
                            <td class="text-right">₦${parseFloat(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td class="text-center">${item.has_receipt ? '✓' : '-'}</td>
                        </tr>
                    `);
                    });
                } else {
                    $items.html('<tr><td colspan="3" class="text-center text-slate-500">No items</td></tr>');
                }

                // Render documents
                const $docs = $('#detail-documents');
                $docs.empty();
                if (retirement.documents && retirement.documents.length > 0) {
                    retirement.documents.forEach(doc => {
                        $docs.append(`
                        <a href="${doc.url}" target="_blank" class="p-3 border rounded hover:bg-slate-50">
                            <i data-lucide="file-text" class="w-8 h-8 mx-auto mb-2"></i>
                            <div class="text-xs text-center truncate">${doc.name}</div>
                        </a>
                    `);
                    });
                } else {
                    $docs.html('<div class="col-span-4 text-center text-slate-500 p-4">No documents uploaded</div>');
                }

                // Show/hide verification section
                if (retirement.status === 'pending') {
                    $('#verification-section').show();
                    $('#btn-verify-retirement, #btn-reject-retirement').show();
                } else {
                    $('#verification-section').hide();
                    $('#btn-verify-retirement, #btn-reject-retirement').hide();
                }

                tailwind.Modal.getInstance(document.querySelector('#retirement-detail-modal')).show();
                if (window.lucide) window.lucide.createIcons();
            } catch (e) {
                console.error('View retirement error:', e);
            }
        }

        async function verifyRetirement() {
            if (!state.currentRetirement) return;
            if (!confirm('Confirm verification and approval of this retirement?')) return;

            try {
                const url = API.verifyRetirement.replace(':id', state.currentRetirement.id);
                const notes = $('#verification-notes').val();

                await window.ApiClient.post(url, {
                    notes
                });
                showToast('Retirement verified successfully', 'success');

                tailwind.Modal.getInstance(document.querySelector('#retirement-detail-modal')).hide();
                loadRetirements();
            } catch (e) {
                console.error('Verify retirement error:', e);
                showToast(e.responseJSON?.message || 'Failed to verify retirement', 'error');
            }
        }

        async function rejectRetirement() {
            if (!state.currentRetirement) return;

            const reason = $('#verification-notes').val();
            if (!reason) {
                showToast('Please provide rejection reason in notes', 'error');
                return;
            }

            if (!confirm('Are you sure you want to reject this retirement?')) return;

            try {
                const url = API.rejectRetirement.replace(':id', state.currentRetirement.id);

                await window.ApiClient.post(url, {
                    reason
                });
                showToast('Retirement rejected', 'success');

                tailwind.Modal.getInstance(document.querySelector('#retirement-detail-modal')).hide();
                loadRetirements();
            } catch (e) {
                console.error('Reject retirement error:', e);
                showToast(e.responseJSON?.message || 'Failed to reject retirement', 'error');
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
        $('#filter-status, #filter-organization, #filter-team').on('change', function() {
            state.filters[$(this).attr('id').replace('filter-', '')] = $(this).val();
            state.pagination.page = 1;
            loadRetirements();
        });

        $('#filter-search').on('keyup', debounce(function() {
            state.filters.search = $(this).val();
            state.pagination.page = 1;
            loadRetirements();
        }, 500));

        $(document).on('click', '.pagination-btn', function() {
            state.pagination.page = parseInt($(this).data('page'));
            loadRetirements();
        });

        $(document).on('click', '.btn-view-retirement', function() {
            const retirementId = $(this).data('id');
            viewRetirement(retirementId);
        });

        $('#btn-verify-retirement').on('click', verifyRetirement);
        $('#btn-reject-retirement').on('click', rejectRetirement);

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>