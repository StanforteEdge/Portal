<?php

/**
 * Template Name: Requests: New
 * Description: Form to initiate a new request
 */

$pageTitle = 'New Request';
$breadcrumb = [
    ['name' => 'Requests', 'url' => home_url('/requests')],
    ['name' => 'New Request']
];
$activeMenu = 'requests-new';
$requiredRoles = ['staff'];

get_header();

?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">

        <!-- Header -->
        <div class="mb-8 flex flex-row justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">New Request</h1>
                <p class="text-gray-500 mt-1">Submit a new request for approval</p>
            </div>
            <a href="/requests" class=" btn btn-outline-primary">← Back to
                Dashboard</a>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8 relative">

            <!-- Global Feedback -->
            <div id="form-alert" class="hidden p-4 rounded-md mb-6"></div>

            <form id="createRequestForm" class="space-y-6">

                <!-- Request Type Selection -->
                <div>
                    <label for="request_type" class="form-label block text-sm font-medium text-gray-700 mb-1">Request
                        Type</label>
                    <select id="request_type" name="request_type_id"
                        class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required>
                        <option value="">Select a request type...</option>
                        <!-- Populated via JS -->
                    </select>
                </div>

                <!-- Custom Fields Container -->
                <div id="custom-fields-container" class="grid grid-cols-1 md:grid-cols-2 gap-6 hidden">
                    <!-- Populated via JS -->
                </div>

                <!-- Basic Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="title" class="form-label block text-sm font-medium text-gray-700 mb-1">Purpose /
                            Title</label>
                        <input type="text" id="title" name="purpose"
                            class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="e.g. Office Supplies for Q1" required>
                    </div>
                    <div>
                        <label for="due_date" class="form-label block text-sm font-medium text-gray-700 mb-1">Required
                            By</label>
                        <input type="date" id="due_date" name="due_date"
                            class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="border-t border-gray-200 pt-6 mt-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-medium text-gray-900">Items</h2>
                        <button type="button" id="add-item-btn"
                            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4"></path>
                            </svg>
                            Add Item
                        </button>
                    </div>

                    <div id="items-container" class="space-y-4">
                        <!-- Default Item Row -->
                        <div class="item-row grid grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-md"
                            data-index="0">
                            <div class="col-span-12 md:col-span-6">
                                <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                <input type="text" name="items[0][description]"
                                    class="form-input w-full rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Item description" required>
                            </div>
                            <div class="col-span-5 md:col-span-2">
                                <label class="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                <input type="number" name="items[0][quantity]"
                                    class="form-input w-full rounded-md border-gray-300 shadow-sm text-sm item-qty"
                                    value="1" min="1" required>
                            </div>
                            <div class="col-span-7 md:col-span-3">
                                <label class="block text-xs font-medium text-gray-500 mb-1">Unit Price (₦)</label>
                                <input type="number" name="items[0][amount]"
                                    class="form-input w-full rounded-md border-gray-300 shadow-sm text-sm item-price"
                                    placeholder="0.00" min="0" step="0.01" required>
                            </div>
                            <div class="col-span-12 md:col-span-1 flex justify-end mt-6 md:mt-0">
                                <button type="button" class="delete-item-btn text-red-500 hover:text-red-700 p-1"
                                    style="display: none;">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                        </path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Total -->
                    <div class="flex justify-end mt-4">
                        <div class="text-right">
                            <span class="text-sm text-gray-500 mr-2">Total Estimate:</span>
                            <span id="total-amount" class="text-2xl font-bold text-gray-900">₦0.00</span>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="border-t border-gray-200 pt-6 mt-6 flex justify-end gap-3">
                    <button type="button" onclick="history.back()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" id="submitBtn" class="btn btn-primary">
                        <span id="btnText">Create Request</span>
                        <svg id="btnSpinner" class="animate-spin ml-2 h-4 w-4 text-white hidden"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('createRequestForm');
        const itemsContainer = document.getElementById('items-container');
        const addItemBtn = document.getElementById('add-item-btn');
        const totalDisplay = document.getElementById('total-amount');
        const typeSelect = document.getElementById('request_type');
        const customFieldsContainer = document.getElementById('custom-fields-container');
        const submitBtn = document.getElementById('submitBtn');
        const formAlert = document.getElementById('form-alert');

        let itemCount = 1;
        let requestTypes = [];

        // 1. Fetch Request Types
        async function loadRequestTypes() {
            try {
                const token = localStorage.getItem('jwt_token');
                const urlParams = new URLSearchParams(window.location.search);
                const groupCode = urlParams.get('group'); // e.g. 'finance'

                const headers = {
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/wp-json/api/v1/request-types', {
                    headers: headers
                });
                const response = await res.json();

                if (response.success && response.data) {
                    let types = response.data;

                    // Filter by group if requested via URL
                    if (groupCode) {
                        types = types.filter(t => t.group && t.group.code.toLowerCase() === groupCode.toLowerCase());
                    }

                    requestTypes = types;

                    types.forEach(type => {
                        const opt = document.createElement('option');
                        opt.value = type.id;
                        opt.textContent = type.name;
                        typeSelect.appendChild(opt);
                    });
                }
            } catch (e) {
                console.error('Failed to load request types', e);
            }
        }
        loadRequestTypes();

        // Handle Type Change for Dynamic Fields
        typeSelect.addEventListener('change', function() {
            const typeId = this.value;
            const type = requestTypes.find(t => t.id == typeId);

            customFieldsContainer.innerHTML = '';
            customFieldsContainer.classList.add('hidden');

            if (type && type.form_schema) {
                let schema = type.form_schema;
                if (typeof schema === 'string') {
                    try {
                        schema = JSON.parse(schema);
                    } catch (e) {}
                }

                if (Array.isArray(schema) && schema.length > 0) {
                    customFieldsContainer.classList.remove('hidden');

                    schema.forEach(field => {
                        const div = document.createElement('div');
                        const label = document.createElement('label');
                        label.className = 'form-label block text-sm font-medium text-gray-700 mb-1';
                        label.textContent = field.label;

                        let input;
                        if (field.type === 'textarea') {
                            input = document.createElement('textarea');
                            input.rows = 3;
                        } else {
                            input = document.createElement('input');
                            input.type = field.type || 'text';
                        }

                        input.name = `custom_data[${field.name}]`;
                        input.className = 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 custom-field-input';
                        input.dataset.name = field.name;
                        if (field.required) input.required = true;

                        div.appendChild(label);
                        div.appendChild(input);
                        customFieldsContainer.appendChild(div);
                    });
                }
            }
        });

        // 2. Add Item Logic
        addItemBtn.addEventListener('click', () => {
            const row = itemsContainer.querySelector('.item-row').cloneNode(true);
            row.dataset.index = itemCount;

            // Reset values
            row.querySelectorAll('input').forEach(input => {
                input.value = input.classList.contains('item-qty') ? 1 : '';
                input.name = input.name.replace(/\[\d+\]/, `[${itemCount}]`);
            });

            // Show delete button
            row.querySelector('.delete-item-btn').style.display = 'block';

            itemsContainer.appendChild(row);
            itemCount++;
            calculateTotal();
        });

        // 3. Delete Item Logic
        itemsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.delete-item-btn')) {
                if (itemsContainer.querySelectorAll('.item-row').length > 1) {
                    e.target.closest('.item-row').remove();
                    calculateTotal();
                }
            }
        });

        // 4. Calculate Total
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-price') || e.target.classList.contains('item-qty')) {
                calculateTotal();
            }
        });

        function calculateTotal() {
            let total = 0;
            itemsContainer.querySelectorAll('.item-row').forEach(row => {
                const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                total += (qty * price);
            });
            totalDisplay.textContent = new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN'
            }).format(total);
        }

        // 5. Submit Form
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(true);

            const formData = new FormData(form);
            const data = {
                request_type_id: formData.get('request_type_id'),
                team_id: null,
                data: {
                    purpose: formData.get('purpose'),
                    due_date: formData.get('due_date')
                },
                items: []
            };

            // Capture Custom Fields
            document.querySelectorAll('.custom-field-input').forEach(input => {
                data.data[input.dataset.name] = input.value;
            });

            // Extract items and calculate total
            let totalAmount = 0;
            itemsContainer.querySelectorAll('.item-row').forEach(row => {
                const desc = row.querySelector('input[name*="[description]"]').value;
                const qty = row.querySelector('input[name*="[quantity]"]').value;
                const amt = row.querySelector('input[name*="[amount]"]').value;

                if (desc && amt) {
                    const itemTotal = parseInt(qty) * parseFloat(amt);
                    totalAmount += itemTotal;

                    data.items.push({
                        description: desc,
                        quantity: parseInt(qty),
                        amount: parseFloat(amt)
                    });
                }
            });

            // Add total_amount to request data
            data.total_amount = totalAmount;


            try {
                const token = localStorage.getItem('jwt_token');
                const headers = {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/wp-json/api/v1/requests', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(data)
                });

                const response = await res.json();

                if (res.ok && response.success) {
                    window.location.href = `/requests/view?id=${response.request.id}&created=true`;
                } else {
                    throw new Error(response.message || 'Failed to create request');
                }

            } catch (err) {
                showAlert('error', err.message);
            } finally {
                setLoading(false);
            }
        });

        // Example of the JS filtering logic in the new template
        $('#organization_id').on('change', function() {
            const orgId = $(this).val();
            const $teamSelect = $('#team_id');

            // Filter global teams by selected organization locally
            const filteredTeams = lookupData.global.teams.filter(t => t.organization_id == orgId);

            $teamSelect.empty().append('<option value="">Select Team</option>');
            filteredTeams.forEach(t => {
                $teamSelect.append(`<option value="${t.id}">${t.name}</option>`);
            });

            // Auto-select if user has a primary team in this org
            const userTeams = lookupData.profile.teams.filter(t => t.organization_id == orgId);
            if (userTeams.length === 1) {
                $teamSelect.val(userTeams[0].id);
            }
        });

        function setLoading(isLoading) {
            submitBtn.disabled = isLoading;
            document.getElementById('btnSpinner').classList.toggle('hidden', !isLoading);
            document.getElementById('btnText').textContent = isLoading ? 'Creating...' : 'Create Request';
        }

        function showAlert(type, message) {
            formAlert.className = `p-4 rounded-md mb-6 ${type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`;
            formAlert.textContent = message;
            formAlert.classList.remove('hidden');
            window.scrollTo(0, 0);
        }
    });
</script>

<?php get_footer(); ?>