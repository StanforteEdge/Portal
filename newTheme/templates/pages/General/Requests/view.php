<?php

/**
 * Template Name: Request: View 
 * Description: Detailed view of a specific request
 */

$pageTitle = 'Request Details';
$breadcrumb = [
    ['name' => 'Requests', 'url' => home_url('/requests')],
    ['name' => 'Request Details']
];
$activeMenu = 'requests-view';

get_header();

// Get ID from URL
$request_id = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">

        <!-- Navigation -->
        <div class="mb-6 flex justify-between items-center">
            <a href="/requests" class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Requests
            </a>

            <div id="action-buttons" class="space-x-3 hidden">
                <!-- Buttons injected via JS -->
            </div>
        </div>

        <!-- Main Content (Loading) -->
        <div id="loading-state" class="text-center py-20">
            <svg class="animate-spin h-10 w-10 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
            </svg>
            <p class="text-gray-500 mt-3">Loading request details...</p>
        </div>

        <!-- Request Content -->
        <div id="request-content" class="hidden space-y-6">

            <!-- Alert Banner -->
            <div id="status-banner" class="hidden p-4 rounded-md flex items-start">
                <div class="flex-shrink-0">
                    <svg id="status-icon" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"></svg>
                </div>
                <div class="ml-3">
                    <h3 id="status-title" class="text-sm font-medium"></h3>
                    <div id="status-desc" class="mt-2 text-sm"></div>
                </div>
            </div>

            <!-- Header Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h1 id="req-number" class="text-2xl font-bold text-gray-900">...</h1>
                            <span id="req-status"
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Loading...
                            </span>
                        </div>
                        <p id="req-type" class="text-sm text-gray-500">General Request</p>
                    </div>
                    <div class="mt-4 md:mt-0 text-right">
                        <p class="text-sm text-gray-500">Total Amount</p>
                        <p id="req-amount" class="text-3xl font-bold text-gray-900">₦0.00</p>
                    </div>
                </div>

                <hr class="my-6 border-gray-100">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Purpose</h3>
                        <p id="req-purpose" class="text-gray-700">...</p>
                    </div>
                    <div>
                        <h3 class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Details</h3>
                        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <dt class="text-gray-500">Created:</dt>
                            <dd id="req-date" class="text-gray-900 text-right font-medium">...</dd>
                            <dt class="text-gray-500">Due Date:</dt>
                            <dd id="req-due" class="text-gray-900 text-right font-medium">...</dd>
                            <dt class="text-gray-500">Requester:</dt>
                            <dd id="req-user" class="text-gray-900 text-right font-medium">...</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <!-- Custom Fields Section -->
            <div id="custom-fields-container" class="hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-4">Additional Information</h3>
                <div id="custom-fields-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <!-- Dynamic fields injected here -->
                </div>
            </div>

            <!-- Retirement Details (Conditional) -->
            <div id="retirement-details" class="hidden bg-blue-50 rounded-lg border border-blue-100 p-6">
                <h3 class="text-lg font-medium text-blue-900 mb-4">Retirement Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p class="text-sm text-blue-700">Actual Amount Spent</p>
                        <p id="ret-actual" class="text-xl font-bold text-blue-900">₦0.00</p>
                    </div>
                    <div>
                        <p class="text-sm text-blue-700">Balance Returned</p>
                        <p id="ret-balance" class="text-xl font-bold text-blue-900">₦0.00</p>
                    </div>
                    <div>
                        <p class="text-sm text-blue-700">Receipts</p>
                        <div id="ret-receipts" class="max-h-20 overflow-y-auto mt-1 space-y-1">
                            <!-- Links injected here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        class="tab-btn active border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        data-target="info">
                        Items & Details
                    </button>
                </nav>
            </div>

            <!-- Items Table -->
            <div id="tab-info" class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 class="text-lg font-medium text-gray-900">Request Items</h3>
                </div>
                <!-- ... existing table ... -->

                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#
                            </th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description</th>
                            <th scope="col"
                                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qty</th>
                            <th scope="col"
                                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Price</th>
                            <th scope="col"
                                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total</th>
                        </tr>
                    </thead>
                    <tbody id="items-body" class="bg-white divide-y divide-gray-200">
                        <!-- Items populated via JS -->
                    </tbody>
                </table>
            </div>

        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', async function() {
        const requestId = '<?php echo $request_id; ?>';

        if (!requestId) {
            alert('No request ID provided');
            window.location.href = '/requests';
            return;
        }

        try {
            const res = await fetch(`/wp-json/api/v1/requests/${requestId}`, {
                headers: {
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                }
            });

            if (!res.ok) throw new Error('Failed to load request');

            const response = await res.json();
            const request = response.data || response; // Adapt to API structure

            renderRequest(request);

        } catch (e) {
            console.error(e);
            document.getElementById('loading-state').innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
        }

        function renderRequest(req) {
            // Toggle Views
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('request-content').classList.remove('hidden');

            // Populate Header
            document.getElementById('req-number').textContent = req.formatted_number || req.request_number;
            document.getElementById('req-type').textContent = req.request_type ? req.request_type.name : 'Request';
            document.getElementById('req-amount').textContent = formatCurrency(req.total_amount);

            // Handle Purpose/Description
            const purpose = req.data?.purpose || (req.items?.[0]?.description) || 'No purpose specified';
            document.getElementById('req-purpose').textContent = purpose;

            document.getElementById('req-date').textContent = new Date(req.created_at).toLocaleDateString();
            document.getElementById('req-due').textContent = req.data?.due_date ? new Date(req.data.due_date).toLocaleDateString() : 'N/A';
            document.getElementById('req-user').textContent = req.created_by?.display_name || 'Me';

            // Custom Fields Display
            renderCustomFields(req);

            // Retirement Details
            if (req.data && req.data.retirement) {
                document.getElementById('retirement-details').classList.remove('hidden');
                document.getElementById('ret-actual').textContent = formatCurrency(req.data.retirement.actual_amount);
                document.getElementById('ret-balance').textContent = formatCurrency(req.data.retirement.balance_amount);

                const linksContainer = document.getElementById('ret-receipts');
                linksContainer.innerHTML = '';
                if (req.data.retirement.receipts && req.data.retirement.receipts.length) {
                    req.data.retirement.receipts.forEach((url, i) => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.className = 'block text-sm text-blue-600 hover:underline truncate';
                        a.textContent = `Receipt ${i + 1}`;
                        linksContainer.appendChild(a);
                    });
                } else {
                    linksContainer.innerHTML = '<span class="text-gray-500 text-sm">No receipts uploaded</span>';
                }
            }

            // Action Buttons
            renderActions(req);
        }

        function renderCustomFields(req) {
            const container = document.getElementById('custom-fields-container');
            const grid = document.getElementById('custom-fields-grid');
            grid.innerHTML = '';

            if (!req.form || !req.form.fields || !req.data) {
                container.classList.add('hidden');
                return;
            }

            let hasVisibleFields = false;
            req.form.fields.forEach(field => {
                const value = req.data[field.field_key];
                if (value === undefined || value === null || value === '') return;

                // Skip internal fields if any
                if (['purpose', 'total_amount', 'due_date'].includes(field.field_key)) return;

                hasVisibleFields = true;
                const div = document.createElement('div');

                let displayValue = value;
                if (Array.isArray(value)) displayValue = value.join(', ');
                if (field.field_type === 'date') displayValue = new Date(value).toLocaleDateString();

                div.innerHTML = `
                    <dt class="text-gray-500 font-medium mb-1">${field.field_label}</dt>
                    <dd class="text-gray-900">${displayValue}</dd>
                `;
                grid.appendChild(div);
            });

            if (hasVisibleFields) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }

        function renderActions(req) {
            const container = document.getElementById('action-buttons');
            container.innerHTML = '';
            container.classList.remove('hidden');

            const urlParams = new URLSearchParams(window.location.search);
            const actionParam = urlParams.get('action');

            // 1. Review Mode (Approver)
            if (actionParam === 'review' && req.status === 'submitted') {
                createActionButton(container, 'Reject', 'btn-outline-danger mr-2', () => processApproval(req.id, 'reject'));
                createActionButton(container, 'Approve', 'btn-success', () => processApproval(req.id, 'approve'));
            }
            // 2. Draft Mode (Requester)
            else if (req.status === 'draft') {
                createActionButton(container, 'Submit for Approval', 'btn-primary', () => submitRequest(req.id));
            }
            // 3. Retirement Verification (Finance)
            else if (actionParam === 'verify' && req.status === 'retirement_pending') {
                createActionButton(container, 'Reject Retirement', 'btn-outline-danger mr-2', () => processRetirement(req.id, 'reject'));
                createActionButton(container, 'Verify & Complete', 'btn-success', () => processRetirement(req.id, 'approve'));
            }
            // 4. Ready for Retirement (Requester)
            else if ((req.status === 'voucher_created' || req.status === 'paid') && !req.data?.retirement) {
                // Optional: Show button to retire
                const retireBtn = document.createElement('a');
                retireBtn.href = `/requests/retire?request_id=${req.id}`;
                retireBtn.className = 'btn btn-primary-soft';
                retireBtn.textContent = 'Submit Retirement';
                container.appendChild(retireBtn);
            }
        }

        function createActionButton(container, text, classes, onClick) {
            const btn = document.createElement('button');
            btn.className = `btn ${classes} px-4 py-2 rounded`; // simplistic class handling
            // Map standard bootstrap/custom classes to tailwind if needed, or rely on btn class
            if (classes.includes('btn-outline-danger')) btn.classList.add('border', 'border-red-500', 'text-red-600', 'hover:bg-red-50');
            if (classes.includes('btn-success')) btn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
            if (classes.includes('btn-primary')) btn.classList.add('bg-primary-600', 'text-white', 'hover:bg-primary-700');

            btn.textContent = text;
            btn.onclick = onClick;
            container.appendChild(btn);
        }

        async function processApproval(id, action) {
            // ... existing processApproval logic ...
            // Re-implementing strictly to ensure context availability if not global
            const comment = prompt(`Please enter a comment to ${action} this request:`);
            if (comment === null) return;

            try {
                // Disable buttons
                document.querySelectorAll('#action-buttons button').forEach(b => b.disabled = true);
                const endpoint = action === 'approve' ? 'approve' : 'reject';
                await callApi(`/wp-json/api/v1/requests/${id}/${endpoint}`, {
                    comment
                });
                alert(`Request ${action}ed successfully!`);
                window.location.href = '/requests/approvals';
            } catch (e) {
                alert(e.message);
                document.querySelectorAll('#action-buttons button').forEach(b => b.disabled = false);
            }
        }

        async function processRetirement(id, action) {
            if (!confirm(`Are you sure you want to ${action} this retirement?`)) return;

            try {
                document.querySelectorAll('#action-buttons button').forEach(b => b.disabled = true);
                await callApi(`/wp-json/api/v1/requests/${id}/verify-retirement`, {
                    action
                }); // action: approve/reject
                alert('Retirement processed successfully!');
                window.location.href = '/finance/retirements';
            } catch (e) {
                alert(e.message);
                document.querySelectorAll('#action-buttons button').forEach(b => b.disabled = false);
            }
        }

        async function submitRequest(id) {
            if (!confirm('Are you sure?')) return;
            try {
                await callApi(`/wp-json/api/v1/requests/${id}/submit`, {});
                alert('Submitted successfully!');
                window.location.reload();
            } catch (e) {
                alert(e.message);
            }
        }

        async function callApi(url, body) {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error');
            return data;
        }

        function updateStatusBadge(status) {
            const el = document.getElementById('req-status');
            el.textContent = status.toUpperCase().replace('_', ' ');

            let classes = 'bg-gray-100 text-gray-800';
            if (status === 'approved' || status === 'completed') classes = 'bg-green-100 text-green-800';
            if (status === 'submitted' || status === 'retirement_pending') classes = 'bg-blue-100 text-blue-800';
            if (status === 'rejected' || status === 'retirement_rejected') classes = 'bg-red-100 text-red-800';
            if (status === 'voucher_created') classes = 'bg-purple-100 text-purple-800';

            el.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`;
        }

        function formatCurrency(val) {
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN'
            }).format(val);
        }
    });
</script>

<?php get_footer(); ?>