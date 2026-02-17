<?php

/**
 * Template Name: Staff: View Finance Request
 * Description: View a finance request details
 */

$pageTitle = 'View Finance Request';

// Redirect to unified finance request view
$requestId = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';
if (!empty($requestId)) {
    wp_redirect(home_url('/finance/requests/view?id=' . $requestId));
    exit;
}
$breadcrumb = [
    ['name' => 'Finance Requests', 'url' => home_url('/finance/requests')],
    ['name' => 'View Request']
];
$activeMenu = 'finance-requests';

get_header();
?>

<div id="loading-state" class="p-8 text-center">
    <i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto mb-4"></i>
    <p>Loading request details...</p>
</div>

<div id="error-state" class="hidden p-8 text-center text-danger">
    <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-4"></i>
    <p id="error-message">Failed to load request</p>
    <a href="/finance/requests" class="btn btn-primary mt-4">Back to Requests</a>
</div>

<div id="request-content" class="hidden">
    <!-- Header -->
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto" id="request-title">Finance Request</h2>
        <div class="flex gap-2 mt-4 sm:mt-0">
            <button id="btn-print" class="btn btn-outline-secondary">
                <i data-lucide="printer" class="w-4 h-4 mr-2"></i> Print
            </button>
            <a href="/finance/requests" class="btn btn-outline-primary">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back
            </a>
        </div>
    </div>

    <!-- Request Details Card -->
    <div class="intro-y box p-5 mt-5">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b">
            <div>
                <h3 class="text-xl font-bold" id="request-number">PC-00001</h3>
                <div class="flex items-center gap-2 mt-2">
                    <span id="status-badge"
                        class="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">DRAFT</span>
                    <span class="text-slate-500">|</span>
                    <span class="text-slate-500" id="request-date">Created on Jan 1, 2024</span>
                </div>
            </div>
            <div class="mt-4 md:mt-0 text-right">
                <div class="text-2xl font-bold text-primary" id="total-amount">₦0.00</div>
                <div class="text-slate-500 text-sm">Total Amount</div>
            </div>
        </div>

        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label class="block text-sm font-medium text-slate-500 mb-1">Request Type</label>
                <div class="font-medium" id="request-type">Petty Cash</div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 mb-1">Department</label>
                <div id="department">-</div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 mb-1">Project</label>
                <div id="project">-</div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 mb-1">Due Date</label>
                <div id="due-date">-</div>
            </div>
        </div>

        <!-- Purpose -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-slate-500 mb-2">Purpose/Description</label>
            <div class="bg-slate-50 p-4 rounded" id="purpose">-</div>
        </div>

        <!-- Items Table -->
        <div class="mb-6">
            <h4 class="font-medium mb-3">Request Items</h4>
            <div class="overflow-x-auto">
                <table class="table table-report">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">ITEM</th>
                            <th class="whitespace-nowrap">CATEGORY</th>
                            <th class="text-center whitespace-nowrap">QTY</th>
                            <th class="text-center whitespace-nowrap">UNIT PRICE</th>
                            <th class="text-right whitespace-nowrap">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody id="items-table-body">
                        <!-- Populated via JS -->
                    </tbody>
                    <tfoot>
                        <tr class="bg-slate-50 font-bold">
                            <td colspan="4" class="text-right">TOTAL</td>
                            <td class="text-right" id="items-total-footer">₦0.00</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- Approval Timeline -->
        <div class="mb-6">
            <h4 class="font-medium mb-3">Approval Timeline</h4>
            <div id="approval-timeline" class="bg-slate-50 p-4 rounded">
                <div class="text-slate-500 text-sm">Loading approvals...</div>
            </div>
        </div>

        <!-- Creator Info -->
        <div class="border-t pt-4">
            <div class="flex items-center justify-between">
                <div>
                    <label class="block text-sm font-medium text-slate-500 mb-1">Submitted By</label>
                    <div class="font-medium" id="creator-name">-</div>
                    <div class="text-slate-500 text-sm" id="creator-email">-</div>
                </div>
                <div class="text-right">
                    <label class="block text-sm font-medium text-slate-500 mb-1">Submission Date</label>
                    <div id="submission-date">-</div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        // Extract request ID from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('id');

        if (!requestId) {
            showError('No request ID provided');
            return;
        }

        // Validate that it's a numeric ID
        if (!/^\d+$/.test(requestId)) {
            showError('Invalid request ID format');
            return;
        }

        const API = {
            getRequest: `/wp-json/api/v1/finance/requests/${requestId}`,
            lookupData: '/wp-json/api/v1/finance/lookup-data',
            approvalHistory: `/wp-json/api/v1/requests/${requestId}/history`,
            requestTypes: '/wp-json/api/v1/finance/requests/types'
        };

        let state = {
            lookupData: {},
            requestTypes: [],
            currentRequestTypeId: null
        };

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get(API.lookupData);
                // Handle both array and object responses
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                state.lookupData = data?.data || data || {};
            } catch (e) {
                console.error('Load lookup error:', e);
            }
        }

        async function loadRequestTypes() {
            try {
                const res = await window.ApiClient.get(API.requestTypes);
                state.requestTypes = res.data || [];
            } catch (e) {
                console.error('Load request types error:', e);
            }
        }

        async function loadRequest() {
            try {
                // Load lookup data and request types first
                await Promise.all([loadLookupData(), loadRequestTypes()]);

                $('#loading-state').removeClass('hidden');
                $('#request-content').addClass('hidden');
                $('#error-state').addClass('hidden');

                const res = await window.ApiClient.get(API.getRequest);
                const request = res.data;

                if (!request) {
                    showError('Request not found');
                    return;
                }

                renderRequest(request);
                await loadApprovalHistory();
                $('#loading-state').addClass('hidden');
                $('#request-content').removeClass('hidden');
            } catch (e) {
                console.error('Load request error:', e);
                showError(e.responseJSON?.message || 'Failed to load request details');
            }
        }

        function renderRequest(request) {
            // Parse data field if it's a JSON string
            let requestData = request.data;
            if (typeof request.data === 'string') {
                try {
                    requestData = JSON.parse(request.data);
                } catch (e) {
                    console.error('Error parsing request data:', e);
                    requestData = {};
                }
            }

            // Header
            $('#request-title').text(`${request.request_type?.name || 'Finance Request'} Details`);

            // Request number
            const formattedNumber = request.formatted_number
                || request.request_number
                || request.id;
            $('#request-number').text(formattedNumber);

            // Status badge
            const statusClass = getStatusClass(request.status);
            $('#status-badge').removeClass().addClass(`px-3 py-1 rounded-full text-sm font-medium ${statusClass}`).text(request.status?.toUpperCase() || 'UNKNOWN');

            // Dates
            const createdDate = window.formatDate(request.created_at?.date || request.created_at);
            $('#request-date').text(`Created on ${createdDate}`);

            // Amount
            const amount = parseFloat(request.total_amount || 0);
            $('#total-amount').text(amount > 0 ? '₦' + amount.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }) : '₦0.00');

            // Basic info
            $('#request-type').text(request.request_type?.name || 'Unknown');

            $('#department').text(requestData.department_id ?
                (state.lookupData.global?.departments?.find(d => d.id == requestData.department_id)?.name ||
                    'Department #' + requestData.department_id) : 'N/A');
            $('#project').text(requestData.project_id ? 'Project #' + requestData.project_id : '-');
            $('#due-date').text(requestData.due_date ? new Date(requestData.due_date).toLocaleDateString() : '-');
            $('#purpose').text(requestData.purpose || '-');

            // Submitted by - get creator info from lookup data
            let creatorName = 'Unknown User';
            let creatorEmail = '';

            if (request.created_by?.id) {
                // Try to find user in profile data
                const userProfile = state.lookupData.profile;
                if (userProfile && userProfile.id == request.created_by.id) {
                    creatorName = userProfile.first_name + ' ' + userProfile.last_name;
                    creatorEmail = userProfile.email || '';
                } else {
                    // Fallback to the name provided in the response
                    creatorName = request.created_by?.name || 'Unknown User';
                    creatorEmail = request.created_by?.email || '';
                }
            }

            $('#creator-name').text(creatorName);
            $('#creator-email').text(creatorEmail);

            // Items
            renderItems(requestData.items || []);

            // Submission date (updated_at)
            const submissionDate = window.formatDate(request.updated_at?.date || request.updated_at);
            $('#submission-date').text(submissionDate);

            // Store request type id for timeline
            state.currentRequestTypeId = request.request_type_id || request.request_type?.id || null;
        }

        async function loadApprovalHistory() {
            try {
                const res = await window.ApiClient.get(API.approvalHistory);
                const history = res.data?.history || [];
                renderApprovalHistory(history);
            } catch (e) {
                console.error('Load approval history error:', e);
                $('#approval-timeline').html('<div class="text-slate-500 text-sm">Unable to load approval history.</div>');
            }
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

        function renderApprovalHistory(history) {
            const $container = $('#approval-timeline');
            $container.empty();

            const steps = getApprovalFlowSteps(state.currentRequestTypeId);
            const timeline = buildApprovalTimeline(steps, history);

            if (!timeline || timeline.length === 0) {
                $container.html('<div class="text-slate-500 text-sm">No approvals yet.</div>');
                return;
            }

            timeline.forEach((record, index) => {
                const action = (record.action || 'pending').toLowerCase();
                const isApproved = action === 'approve' || action === 'approved';
                const isRejected = action === 'reject' || action === 'rejected';
                const iconClass = isApproved ? 'text-success' : isRejected ? 'text-danger' : 'text-slate-500';
                const icon = isApproved ? 'check-circle' : isRejected ? 'x-circle' : 'circle';
                const dateText = record.created_at ? new Date(record.created_at).toLocaleString() : '';

                const row = `
                    <div class="flex items-start gap-3 ${index > 0 ? 'mt-4' : ''}">
                        <div class="${iconClass}">
                            <i data-lucide="${icon}" class="w-5 h-5"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-medium">${record.label || 'Approval Step'}</div>
                            <div class="text-slate-500 text-sm">${record.performed_by?.name || (action === 'pending' ? 'Pending' : 'Unknown')} • ${action}</div>
                            ${dateText ? `<div class="text-xs text-slate-400 mt-1">${dateText}</div>` : ''}
                            ${record.comment ? `<div class="text-sm mt-2 p-2 bg-white rounded border">${record.comment}</div>` : ''}
                        </div>
                    </div>
                `;
                $container.append(row);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function renderItems(items) {
            const $tbody = $('#items-table-body');
            $tbody.empty();

            if (!items || items.length === 0) {
                $tbody.append('<tr><td colspan="5" class="text-center text-slate-500 py-4">No items</td></tr>');
                $('#items-total-footer').text('₦0.00');
                return;
            }

            let total = 0;
            items.forEach(item => {
                const amount = parseFloat(item.amount || 0);
                total += amount;

                const row = `
                    <tr>
                        <td>${item.item || '-'}</td>
                        <td>${item.category_id ?
                        (state.lookupData.global?.expense_categories?.find(c => c.id == item.category_id)?.name ||
                            'Category ' + item.category_id) : '-'}</td>
                        <td class="text-center">${item.quantity || 1}</td>
                        <td class="text-center">₦${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                        <td class="text-right">₦${amount.toFixed(2)}</td>
                    </tr>
                `;
                $tbody.append(row);
            });

            $('#items-total-footer').text('₦' + total.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));
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



        function showError(message) {
            $('#error-message').text(message);
            $('#loading-state').addClass('hidden');
            $('#error-state').removeClass('hidden');
        }

        $('#btn-print').on('click', function () {
            window.print();
        });

        // Initialize
        $(loadRequest);

    })(jQuery);
</script>

<?php get_footer(); ?>
