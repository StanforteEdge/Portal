<?php

/**
 * Template Name: Finance: Payment Vouchers
 * Description: Manage payment vouchers for approved requests
 */

$pageTitle = 'Payment Vouchers';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Payment Vouchers']
];
$activeMenu = 'finance-vouchers';
$requiredPermissions = ['finance.vouchers'];

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">Payment Vouchers</h2>
</div>

<!-- Filters -->
<div class="intro-y box p-5 mt-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label class="form-label">Status</label>
            <select id="filter-status" class="form-select">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
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
            <label class="form-label">Payment Method</label>
            <select id="filter-payment-method" class="form-select">
                <option value="">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
            </select>
        </div>
        <div>
            <label class="form-label">Search</label>
            <input type="text" id="filter-search" class="form-control" placeholder="PV Number, Requester...">
        </div>
    </div>
</div>

<!-- Vouchers Table -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-report">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">PV NUMBER</th>
                    <th class="whitespace-nowrap">REQUEST</th>
                    <th class="whitespace-nowrap">BENEFICIARY</th>
                    <th class="text-center whitespace-nowrap">AMOUNT</th>
                    <th class="text-center whitespace-nowrap">METHOD</th>
                    <th class="text-center whitespace-nowrap">STATUS</th>
                    <th class="text-center whitespace-nowrap">DATE</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="vouchers-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading payment vouchers...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No payment vouchers found.
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between mt-4">
        <div class="text-slate-500">
            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span id="showing-total">0</span> vouchers
        </div>
        <div class="flex gap-2" id="pagination-buttons"></div>
    </div>
</div>

<!-- Generate PV Modal -->
<div id="generate-pv-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Generate Payment Voucher</h2>
            </div>
            <form id="generate-pv-form">
                <div class="modal-body grid grid-cols-12 gap-4">
                    <input type="hidden" id="pv-request-id">

                    <div class="col-span-12">
                        <label class="form-label">Request</label>
                        <div id="pv-request-info" class="p-3 bg-slate-50 rounded text-sm"></div>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Voucher Number</label>
                        <input type="text" id="pv-number" class="form-control" placeholder="Auto-generated" readonly>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Amount <span class="text-danger">*</span></label>
                        <input type="number" id="pv-amount" class="form-control" step="0.01" required>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Payment Method <span class="text-danger">*</span></label>
                        <select id="pv-payment-method" class="form-select" required>
                            <option value="">Select method</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Beneficiary Name <span class="text-danger">*</span></label>
                        <input type="text" id="pv-beneficiary" class="form-control" required>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Bank Details</label>
                        <textarea id="pv-bank-details" class="form-control" rows="3" placeholder="Bank name, Account number, etc."></textarea>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Notes</label>
                        <textarea id="pv-notes" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" class="btn btn-outline-secondary mr-2" data-tw-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Generate Voucher</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            vouchers: '/wp-json/api/v1/finance/vouchers',
            generatePV: '/wp-json/api/v1/finance/vouchers/generate',
            markPaid: '/wp-json/api/v1/finance/vouchers/:id/mark-paid',
            organizations: '/wp-json/api/v1/organizations',
            approvedRequests: '/wp-json/api/v1/requests?status=approved&group=finance'
        };

        let state = {
            vouchers: [],
            organizations: [],
            approvedRequests: [],
            filters: {
                status: '',
                organization: '',
                paymentMethod: '',
                search: ''
            },
            pagination: {
                page: 1,
                perPage: 20,
                total: 0
            }
        };

        async function init() {
            await loadOrganizations();
            await loadVouchers();
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

        function renderOrganizationFilter() {
            const $filter = $('#filter-organization');
            state.organizations.forEach(org => {
                $filter.append(`<option value="${org.id}">${org.name}</option>`);
            });
        }

        async function loadVouchers() {
            $('#loading-state').removeClass('hidden');
            $('#vouchers-table-body').empty();
            $('#empty-state').addClass('hidden');

            let url = `${API.vouchers}?page=${state.pagination.page}&per_page=${state.pagination.perPage}`;

            if (state.filters.status) url += `&status=${state.filters.status}`;
            if (state.filters.organization) url += `&organization_id=${state.filters.organization}`;
            if (state.filters.paymentMethod) url += `&payment_method=${state.filters.paymentMethod}`;
            if (state.filters.search) url += `&search=${encodeURIComponent(state.filters.search)}`;

            try {
                const res = await window.ApiClient.get(url);
                state.vouchers = res.data || [];
                state.pagination.total = res.meta?.total || 0;

                $('#loading-state').addClass('hidden');
                renderTable();
                renderPagination();
            } catch (e) {
                console.error('Load vouchers error:', e);
                $('#loading-state').html('<div class="text-danger">Failed to load vouchers</div>');
            }
        }

        function renderTable() {
            const $tbody = $('#vouchers-table-body');
            $tbody.empty();

            if (state.vouchers.length === 0) {
                $('#empty-state').removeClass('hidden');
                return;
            }

            state.vouchers.forEach(voucher => {
                const amount = parseFloat(voucher.amount || 0);
                const formattedAmount = '₦' + amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                });
                const date = voucher.created_at ? new Date(voucher.created_at).toLocaleDateString() : 'N/A';

                const statusClass = getStatusClass(voucher.status);
                const statusBadge = `<span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${voucher.status?.toUpperCase()}</span>`;

                const isPending = voucher.status === 'pending';

                const row = `
                <tr class="intro-x">
                    <td>
                        <div class="font-medium">${voucher.voucher_number || voucher.id}</div>
                    </td>
                    <td>
                        <a href="/finance/request/${voucher.request_id}" class="text-primary hover:underline">
                            ${voucher.request_number || voucher.request_id}
                        </a>
                    </td>
                    <td>
                        <div class="font-medium">${voucher.beneficiary_name || 'N/A'}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-medium">${formattedAmount}</div>
                    </td>
                    <td class="text-center">
                        <div class="text-slate-600">${voucher.payment_method || 'N/A'}</div>
                    </td>
                    <td class="text-center">
                        ${statusBadge}
                    </td>
                    <td class="text-center">
                        <div class="text-slate-500 text-xs">${date}</div>
                    </td>
                    <td class="table-report__action">
                        <div class="flex justify-center items-center gap-2">
                            ${isPending ? `
                                <button class="flex items-center text-success btn-mark-paid" data-id="${voucher.id}">
                                    <i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Mark Paid
                                </button>
                            ` : ''}
                            <button class="flex items-center text-primary btn-print" data-id="${voucher.id}">
                                <i data-lucide="printer" class="w-4 h-4 mr-1"></i> Print
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
                paid: 'bg-success/10 text-success',
                cancelled: 'bg-danger/10 text-danger'
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

        async function markAsPaid(voucherId) {
            if (!confirm('Confirm that this payment voucher has been paid?')) return;

            try {
                const url = API.markPaid.replace(':id', voucherId);
                await window.ApiClient.post(url, {});
                showToast('Voucher marked as paid', 'success');
                loadVouchers();
            } catch (e) {
                console.error('Mark paid error:', e);
                showToast(e.responseJSON?.message || 'Failed to mark voucher as paid', 'error');
            }
        }

        async function printVoucher(voucherId) {
            try {
                // Open print URL in new window
                window.open(`/finance/voucher/${voucherId}/print`, '_blank');
            } catch (e) {
                console.error('Print error:', e);
                showToast('Failed to print voucher', 'error');
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
        $('#filter-status, #filter-organization, #filter-payment-method').on('change', function() {
            const filterKey = $(this).attr('id').replace('filter-', '').replace('-', '');
            state.filters[filterKey] = $(this).val();
            state.pagination.page = 1;
            loadVouchers();
        });

        $('#filter-search').on('keyup', debounce(function() {
            state.filters.search = $(this).val();
            state.pagination.page = 1;
            loadVouchers();
        }, 500));

        $(document).on('click', '.pagination-btn', function() {
            state.pagination.page = parseInt($(this).data('page'));
            loadVouchers();
        });

        $(document).on('click', '.btn-mark-paid', function() {
            const voucherId = $(this).data('id');
            markAsPaid(voucherId);
        });

        $(document).on('click', '.btn-print', function() {
            const voucherId = $(this).data('id');
            printVoucher(voucherId);
        });

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>