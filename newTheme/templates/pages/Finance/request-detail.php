<?php

/**
 * Template Name: Finance: Request Detail
 * Description: View and manage a finance request
 */

$request_id = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';

if (empty($request_id)) {
    wp_redirect(home_url('/finance/requests'));
    exit;
}

$pageTitle = 'Request Details';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Requests', 'url' => home_url('/finance/requests')],
    ['name' => 'Details']
];
$activeMenu = 'finance-request-detail';

get_header();
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Request Details
    </h2>
    <div class="flex gap-2">
        <a href="/finance/requests" class="btn btn-outline-secondary">
            <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back to List
        </a>
    </div>
</div>

<div id="loading-container" class="intro-y box p-8 mt-5 text-center">
    <div class="text-slate-500">Loading request...</div>
</div>

<div id="request-container" class="hidden">
    <!-- Request Header -->
    <div class="intro-y box p-5 mt-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <div class="text-slate-500 text-xs uppercase">Request Number</div>
                <div class="font-medium text-lg" id="request-number">-</div>
            </div>
            <div class="text-right">
                <div class="text-slate-500 text-xs uppercase">Status</div>
                <div id="request-status-badge" class="inline-block mt-1"></div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
                <div class="text-slate-500 text-xs">Request Type</div>
                <div class="font-medium" id="request-type">-</div>
            </div>
            <div>
                <div class="text-slate-500 text-xs">Requester</div>
                <div class="font-medium" id="request-requester">-</div>
            </div>
            <div>
                <div class="text-slate-500 text-xs">Date Created</div>
                <div class="font-medium" id="request-date">-</div>
            </div>
        </div>
    </div>

    <!-- Request Details -->
    <div class="intro-y box p-5 mt-5">
        <h3 class="font-medium text-lg mb-4">Request Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <div class="text-slate-500 text-xs">Total Amount</div>
                <div class="text-2xl font-bold text-primary" id="request-amount">₦0.00</div>
            </div>
            <div>
                <div class="text-slate-500 text-xs">Team</div>
                <div class="font-medium" id="request-team">-</div>
            </div>
        </div>

        <div class="mt-4">
            <div class="text-slate-500 text-xs">Purpose/Description</div>
            <div class="mt-2 p-3 bg-slate-50 rounded" id="request-purpose">-</div>
        </div>

        <div class="mt-4" id="reimbursement-badge-container" style="display: none;">
            <span class="inline-block px-3 py-1 bg-info/10 text-info rounded text-sm">
                <i data-lucide="rotate-ccw" class="w-4 h-4 inline mr-1"></i> Reimbursement Request
            </span>
        </div>
    </div>

    <!-- Request Items -->
    <div class="intro-y box p-5 mt-5">
        <h3 class="font-medium text-lg mb-4">Request Items</h3>
        <div class="overflow-x-auto">
            <table class="table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody id="items-table-body">
                    <!-- Populated via JS -->
                </tbody>
                <tfoot>
                    <tr class="font-bold">
                        <td colspan="3" class="text-right">Total:</td>
                        <td class="text-right" id="items-total">₦0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

    <!-- Approval Workflow -->
    <div class="intro-y box p-5 mt-5">
        <h3 class="font-medium text-lg mb-4">Approval Workflow</h3>
        <div id="workflow-container">
            <div class="text-slate-500 text-center py-8">No approval workflow data available</div>
        </div>
    </div>

    <!-- Payment Vouchers -->
    <div class="intro-y box p-5 mt-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-lg">Payment Vouchers</h3>
            <button id="btn-add-voucher" class="btn btn-primary btn-sm" style="display: none;">
                <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Voucher
            </button>
        </div>
        <div id="vouchers-container">
            <div class="text-slate-500 text-center py-4">No payment vouchers yet</div>
        </div>
    </div>

    <!-- Retirement -->
    <div class="intro-y box p-5 mt-5" id="retirement-section" style="display: none;">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-lg">Retirement</h3>
            <button id="btn-submit-retirement" class="btn btn-success btn-sm">
                <i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Submit Retirement
            </button>
        </div>
        <div id="retirement-container">
            <div class="text-slate-500 text-center py-4">No retirement submitted yet</div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="intro-y box p-5 mt-5" id="action-buttons-container">
        <div class="flex gap-2 justify-end">
            <button id="btn-approve" class="btn btn-success" style="display: none;">
                <i data-lucide="check" class="w-4 h-4 mr-2"></i> Approve
            </button>
            <button id="btn-reject" class="btn btn-danger" style="display: none;">
                <i data-lucide="x" class="w-4 h-4 mr-2"></i> Reject
            </button>
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const REQUEST_ID = '<?php echo esc_js($request_id); ?>';

        const API = {
            request: `/wp-json/api/v1/finance/requests/${REQUEST_ID}`,
            updateStatus: `/wp-json/api/v1/finance/requests/${REQUEST_ID}/status`,
            vouchers: `/wp-json/api/v1/finance/requests/${REQUEST_ID}/pv`,
            retirement: `/wp-json/api/v1/finance/requests/${REQUEST_ID}/retirement`,
            requestTypes: '/wp-json/api/v1/finance/requests/types',
            lookupData: '/wp-json/api/v1/finance/lookup-data',
            approve: `/wp-json/api/v1/requests/${REQUEST_ID}/approve`,
            reject: `/wp-json/api/v1/requests/${REQUEST_ID}/reject`,
            approvalHistory: `/wp-json/api/v1/requests/${REQUEST_ID}/history`,
            approvalCheck: `/wp-json/api/v1/finance/requests/approvals?status=pending&request_id=${REQUEST_ID}&per_page=1`
        };

        let state = {
            request: null,
            requestTypes: [],
            canApprove: false,
            approvalHistory: [],
            profile: null
        };

        async function init() {
            try {
                await Promise.all([loadLookupData(), loadRequestTypes()]);
                await loadRequest();
                await loadApprovalHistory();
                await loadApprovalEligibility();
                updateActionVisibility();
            } catch (e) {
                console.error('Init error:', e);
                $('#loading-container').html('<div class="text-danger">Failed to load request</div>');
            }
        }

        async function loadRequestTypes() {
            try {
                const res = await window.ApiClient.get(API.requestTypes);
                state.requestTypes = res.data || [];
            } catch (e) {
                console.error('Load types error:', e);
            }
        }

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get(API.lookupData);
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                state.profile = data?.data?.profile || data?.profile || null;
            } catch (e) {
                console.error('Load lookup data error:', e);
            }
        }

        async function loadRequest() {
            try {
                const res = await window.ApiClient.get(API.request);
                state.request = res.data;

                $('#loading-container').addClass('hidden');
                $('#request-container').removeClass('hidden');

                renderRequest();
                await loadVouchers();
                await loadRetirement();
            } catch (e) {
                console.error('Load request error:', e);
                $('#loading-container').html('<div class="text-danger">Request not found</div>');
            }
        }

        async function loadApprovalHistory() {
            try {
                const res = await window.ApiClient.get(API.approvalHistory);
                state.approvalHistory = res.data?.history || [];
                renderWorkflow();
            } catch (e) {
                console.error('Load approval history error:', e);
            }
        }

        async function loadApprovalEligibility() {
            try {
                const res = await window.ApiClient.get(API.approvalCheck);
                const requests = res.data?.requests || res.data || [];
                state.canApprove = Array.isArray(requests) && requests.some(r => String(r.id) === String(REQUEST_ID));
            } catch (e) {
                console.error('Approval eligibility error:', e);
                state.canApprove = false;
            }
        }

        function renderRequest() {
            const req = state.request;

            // Header
            $('#request-number').text(req.formatted_number || req.request_number || req.id);

            const statusClass = getStatusClass(req.status);
            $('#request-status-badge').html(`
            <span class="px-3 py-1 rounded text-xs font-medium ${statusClass}">
                ${req.status?.toUpperCase()}
            </span>
        `);

            // Type
            const typeName = req.request_type?.name
                || state.requestTypes.find(t => t.id == req.request_type_id)?.name
                || 'Finance Request';
            $('#request-type').text(typeName);

            // Basic Info
            const requesterName = req.created_by?.name || req.requester_name || 'N/A';
            $('#request-requester').text(requesterName);
            $('#request-date').text(req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A');

            const amount = parseFloat(req.total_amount || req.amount || 0);
            $('#request-amount').text('₦' + amount.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));

            $('#request-team').text(req.team_name || req.team_id || 'N/A');
            $('#request-purpose').text(req.data?.purpose || req.purpose || 'N/A');

            if (req.data?.is_reimbursement || req.is_reimbursement) {
                $('#reimbursement-badge-container').show();
            }

            // Items
            renderItems(req.items || []);

            // Workflow
            renderWorkflow();

            // Action buttons based on status and permissions
            updateActionVisibility();

            if (window.lucide) window.lucide.createIcons();
        }

        function renderItems(items) {
            const $tbody = $('#items-table-body');
            $tbody.empty();

            if (!items || items.length === 0) {
                $tbody.html('<tr><td colspan="4" class="text-center text-slate-500">No items</td></tr>');
                return;
            }

            let total = 0;
            items.forEach(item => {
                const qty = parseFloat(item.quantity || 0);
                const price = parseFloat(item.unit_price || 0);
                const amount = parseFloat(item.total_price || (qty * price) || 0);
                total += amount;

                const row = `
                <tr>
                    <td>
                        <div>${item.item_description || item.item || item.description}</div>
                        ${item.note ? `<div class="text-xs text-slate-500 mt-1">${item.note}</div>` : ''}
                    </td>
                    <td class="text-center">${qty}</td>
                    <td class="text-right">₦${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
                $tbody.append(row);
            });

            $('#items-total').text('₦' + total.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));
        }

        function getApprovalFlowSteps(requestTypeId) {
            const type = state.requestTypes.find(t => t.id == requestTypeId);
            let flow = type?.approval_flow_json;
            if (typeof flow === 'string') {
                try {
                    flow = JSON.parse(flow);
                } catch (e) {
                    flow = null;
                }
            }
            return Array.isArray(flow?.steps) ? flow.steps : [];
        }

        function formatRoleLabel(role) {
            if (!role) return 'Approval';
            return role
                .toString()
                .replace(/[_-]+/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        }

        function buildApprovalTimeline(steps, history) {
            const approvalActions = new Set(['approve', 'approved', 'reject', 'rejected', 'complete', 'completed']);
            const records = (history || [])
                .slice()
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .filter(r => approvalActions.has((r.action || '').toLowerCase()));

            const timeline = [];
            let recordIndex = 0;

            steps.forEach((step, index) => {
                const label = step.name || step.label || formatRoleLabel(step.role) || `Step ${index + 1}`;
                const record = records[recordIndex];

                if (record) {
                    timeline.push({
                        label: record.step_name || label,
                        action: record.action,
                        performed_by: record.performed_by,
                        comment: record.comment,
                        created_at: record.created_at
                    });
                    recordIndex += 1;
                } else {
                    timeline.push({
                        label,
                        action: 'pending'
                    });
                }
            });

            for (; recordIndex < records.length; recordIndex++) {
                const record = records[recordIndex];
                timeline.push({
                    label: record.step_name || 'Approval Step',
                    action: record.action,
                    performed_by: record.performed_by,
                    comment: record.comment,
                    created_at: record.created_at
                });
            }

            return timeline;
        }

        function renderWorkflow() {
            const $container = $('#workflow-container');
            $container.empty();

            const requestTypeId = state.request?.request_type_id || state.request?.request_type?.id;
            const steps = getApprovalFlowSteps(requestTypeId);
            const timeline = buildApprovalTimeline(steps, state.approvalHistory);

            if (!timeline || timeline.length === 0) {
                $container.html('<div class="text-slate-500 text-center py-4">No approval workflow</div>');
                return;
            }

            timeline.forEach((step, index) => {
                const action = step.action || 'pending';
                const isCompleted = action === 'approve' || action === 'approved' || action === 'complete';
                const isRejected = action === 'reject' || action === 'rejected' || action === 'cancel';

                const iconClass = isCompleted ? 'text-success' : isRejected ? 'text-danger' : 'text-slate-400';
                const icon = isCompleted ? 'check-circle' : isRejected ? 'x-circle' : 'circle';

                const stepHtml = `
                <div class="flex items-start gap-4 ${index > 0 ? 'mt-4' : ''}">
                    <div class="${iconClass}">
                        <i data-lucide="${icon}" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <div class="font-medium">${step.label || 'Approver'}</div>
                        <div class="text-slate-500 text-sm">${action}</div>
                        ${step.created_at ? `<div class="text-xs text-slate-400 mt-1">${new Date(step.created_at).toLocaleString()}</div>` : ''}
                        ${step.comment ? `<div class="text-sm mt-2 p-2 bg-slate-50 rounded">${step.comment}</div>` : ''}
                    </div>
                </div>
            `;
                $container.append(stepHtml);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function updateActionVisibility() {
            const req = state.request;
            if (!req) return;

            const status = (req.status || '').toLowerCase();
            const profileId = state.profile?.id ? String(state.profile.id) : null;
            const requesterId = req.created_by?.id ? String(req.created_by.id) : null;
            const isRequester = profileId && requesterId && profileId === requesterId;

            const roleSlugs = state.profile?.rbac_roles || [];
            const financeRoles = ['finance_manager', 'finance_officer', 'administrator', 'admin'];
            const hasFinanceRole = roleSlugs.some(r => financeRoles.includes(r));

            // Approvals
            if (state.canApprove && ['submitted', 'pending', 'pending_approval'].includes(status)) {
                $('#btn-approve, #btn-reject').show();
            } else {
                $('#btn-approve, #btn-reject').hide();
            }

            // Vouchers
            if (hasFinanceRole && status === 'approved') {
                $('#btn-add-voucher').show();
            } else {
                $('#btn-add-voucher').hide();
            }

            // Retirement (requester only)
            if (isRequester && ['disbursed', 'partially_disbursed', 'paid', 'partially_paid'].includes(status)) {
                $('#retirement-section').show();
                $('#btn-submit-retirement').show();
            } else {
                $('#retirement-section').hide();
            }
        }

        async function loadVouchers() {
            try {
                const res = await window.ApiClient.get(API.vouchers);
                const vouchers = res.data || [];
                renderVouchers(vouchers);
            } catch (e) {
                console.error('Load vouchers error:', e);
            }
        }

        function renderVouchers(vouchers) {
            const $container = $('#vouchers-container');
            $container.empty();

            if (!vouchers || vouchers.length === 0) {
                $container.html('<div class="text-slate-500 text-center py-4">No payment vouchers yet</div>');
                return;
            }

            vouchers.forEach(voucher => {
                const isPaid = (voucher.status || '').toLowerCase() === 'paid';
                const voucherHtml = `
                <div class="border rounded p-4 mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">${voucher.voucher_number || voucher.id}</div>
                            <div class="text-slate-500 text-sm">₦${parseFloat(voucher.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <span class="px-2 py-1 text-xs rounded ${isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}">
                            ${isPaid ? 'Paid' : 'Pending'}
                        </span>
                    </div>
                </div>
            `;
                $container.append(voucherHtml);
            });
        }

        async function loadRetirement() {
            try {
                const res = await window.ApiClient.get(API.retirement);
                const retirement = res.data;
                if (retirement) {
                    renderRetirement(retirement);
                }
            } catch (e) {
                console.error('Load retirement error:', e);
            }
        }

        function renderRetirement(retirement) {
            const $container = $('#retirement-container');
            $container.empty();

            const isVerified = (retirement.status || '').toLowerCase() === 'completed';
            const amount = parseFloat(retirement.total_receipts_amount || retirement.amount || 0);
            const retirementHtml = `
            <div class="border rounded p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">Retirement Submitted</div>
                        <div class="text-slate-500 text-sm">Amount: ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <span class="px-2 py-1 text-xs rounded ${isVerified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}">
                        ${isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                </div>
            </div>
        `;
            $container.html(retirementHtml);
            $('#btn-submit-retirement').hide();
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

        async function approveRequest() {
            if (!confirm('Are you sure you want to approve this request?')) return;

            try {
                $('#btn-approve').prop('disabled', true).html('<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Approving...');

                await window.ApiClient.post(API.approve, {
                    comment: ''
                });
                showToast('Request approved successfully', 'success');

                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                console.error('Approve error:', e);
                showToast(e.responseJSON?.message || 'Failed to approve request', 'error');
                $('#btn-approve').prop('disabled', false).html('<i data-lucide="check" class="w-4 h-4 mr-2"></i> Approve');
            }
        }

        async function rejectRequest() {
            const reason = prompt('Please provide a reason for rejection:');
            if (!reason) return;

            try {
                $('#btn-reject').prop('disabled', true).html('<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Rejecting...');

                await window.ApiClient.post(API.reject, {
                    comment: reason
                });
                showToast('Request rejected', 'success');

                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                console.error('Reject error:', e);
                showToast(e.responseJSON?.message || 'Failed to reject request', 'error');
                $('#btn-reject').prop('disabled', false).html('<i data-lucide="x" class="w-4 h-4 mr-2"></i> Reject');
            }
        }

        // Event Handlers
        $('#btn-approve').on('click', approveRequest);
        $('#btn-reject').on('click', rejectRequest);

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>
