<?php

/**
 * Template Name: Staff: New Finance Request
 * Description: Submit a new finance request
 */

$pageTitle = 'New Finance Request';
$breadcrumb = [
    ['name' => 'Finance Requests', 'url' => home_url('/finance/requests')],
    ['name' => 'New Request']
];
$activeMenu = 'finance-new-request';

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">New Finance Request</h2>
</div>

<!-- Request Type Selection -->
<div id="step-select-type" class="intro-y box p-5 mt-5">
    <h3 class="text-lg font-medium mb-4">Select Request Type</h3>
    <div class="max-w-md">
        <label class="form-label">Request Type *</label>
        <select id="request-type-selector" class="form-control" required>
            <option value="">Select Request Type</option>
        </select>
        <p class="text-slate-500 text-sm mt-2">Choose the type of request you want to submit</p>
    </div>
</div>

<!-- Request Form -->
<div id="step-fill-form" class="hidden">
    <form id="finance-request-form">
        <div class="intro-y box p-5 mt-5">
            <div class="flex items-center justify-between mb-4 border-b pb-4">
                <h3 class="text-lg font-medium" id="form-title">Request Details</h3>
                <button type="button" id="btn-back" class="btn btn-outline-secondary">
                    <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back
                </button>
            </div>

            <!-- Basic Request Info -->
            <div class="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label class="form-label">Request Type</label>
                    <select id="selected-type-dropdown" class="form-control" required>
                        <option value="">Select Request Type</option>
                    </select>
                    <input type="hidden" id="request-type-id">
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="col-span-3 md:col-span-1">
                    <label class=" form-label">Department *</label>
                    <select id="department" class="form-control" required>
                        <option value="">Select Department</option>
                    </select>
                </div>
                <div class="col-span-3 md:col-span-1">
                    <label class="form-label">Project</label>
                    <select id="project" class="form-control">
                        <option value="">Select Project (Optional)</option>
                    </select>
                </div>
                <div class="col-span-3 md:col-span-1">
                    <label class="form-label">Due Date</label>
                    <input type="date" id="due-date" class="form-control">
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label">Purpose/Description *</label>
                <textarea id="purpose" class="form-control" rows="3" placeholder="Explain the purpose of this request..." required></textarea>
            </div>

            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="is-reimbursement" class="form-checkbox">
                    <span class="ml-2">This is a reimbursement request</span>
                </label>
            </div>

            <!-- Request Items Section -->
            <div class="border-t pt-4 mt-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium">Request Items</h4>
                    <button type="button" id="add-item-btn" class="btn btn-primary btn-sm">
                        <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Item
                    </button>
                </div>
                <div id="items-container" class="space-y-3"></div>
                <div class="text-right mt-3 p-3 bg-slate-50 rounded">
                    <span class="font-medium">Total: </span>
                    <span class="text-xl font-bold text-primary" id="items-total">₦0.00</span>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="border-t pt-4 mt-5 flex justify-end gap-2">
                <button type="button" id="btn-save-draft" class="btn btn-outline-secondary">
                    <i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Draft
                </button>
                <button type="submit" id="btn-submit" class="btn btn-primary">
                    <i data-lucide="send" class="w-4 h-4 mr-2"></i> Submit Request
                </button>
            </div>
        </div>
    </form>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            createRequest: '/wp-json/api/v1/finance/requests',
            lookupData: '/wp-json/api/v1/finance/lookup-data'
        };

        let state = {
            requestTypes: [],
            selectedType: null,
            lookupData: {},
            items: []
        };

        async function init() {
            try {
                await loadLookupData();
                renderRequestTypes();
            } catch (e) {
                console.error('Init error:', e);
                showToast('Failed to load form data', 'error');
            }
        }

        async function loadLookupData() {
            try {
                const res = await window.ApiClient.get(API.lookupData);
                // Handle both array and object responses
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                state.lookupData = data?.data || data || {};
                state.requestTypes = state.lookupData.global?.request_types || [];

            } catch (e) {
                console.error('Load lookup error:', e);
            }
        }

        function renderRequestTypes() {
            const $selector = $('#request-type-selector');
            const $formDropdown = $('#selected-type-dropdown');
            $selector.empty().append('<option value="">Select Request Type</option>');
            $formDropdown.empty().append('<option value="">Select Request Type</option>');

            if (state.requestTypes.length === 0) {
                $selector.append('<option disabled>No request types available</option>');
                return;
            }

            state.requestTypes.forEach(type => {
                // Handle both object and array formats
                const typeObj = typeof type === 'object' ? type : {
                    id: type.id,
                    name: type.name
                };
                const option = `<option value="${typeObj.id}">${typeObj.name}</option>`;
                $selector.append(option);
                $formDropdown.append(option);
            });

            // Populate dropdowns after request types are loaded
            populateDropdowns();
        }

        function populateDropdowns() {
            // Populate Departments
            if (state.lookupData.global?.departments) {
                const $dept = $('#department');
                state.lookupData.global.departments.forEach(dept => {
                    $dept.append(`<option value="${dept.id}">${dept.name}</option>`);
                });
            }

            // Populate Projects
            if (state.lookupData.global?.projects) {
                const $project = $('#project');
                state.lookupData.global.projects.forEach(project => {
                    $project.append(`<option value="${project.id}">${project.name}</option>`);
                });
            }
        }

        function selectRequestType(typeId) {
            state.selectedType = state.requestTypes.find(t => t.id == typeId);
            if (!state.selectedType) return;

            $('#selected-type-dropdown').val(typeId);
            $('#request-type-id').val(state.selectedType.id);
            $('#form-title').text(state.selectedType.name + ' - Request Details');

            $('#step-select-type').addClass('hidden');
            $('#step-fill-form').removeClass('hidden');

            // Add initial item
            if (state.items.length === 0) {
                addItem();
            }
        }

        function addItem() {
            const itemId = Date.now();
            const itemHtml = `
            <div class="border rounded p-3 item-row" data-item-id="${itemId}">
                <div class="grid grid-cols-12 gap-3">
                    <div class="col-span-12 sm:col-span-4">
                        <label class="form-label text-xs">Item/Description</label>
                        <input type="text" class="form-control item-description" placeholder="Item name" required>
                    </div>
                    <div class="col-span-12 sm:col-span-3">
                        <label class="form-label text-xs">Expense Category *</label>
                        <select class="form-control item-category" required>
                            <option value="">Select Category</option>
                            ${state.lookupData.global?.expense_categories?.map(cat => 
                                `<option value="${cat.id}">${cat.name}</option>`
                            ).join('') || ''}
                        </select>
                    </div>
                    <div class="col-span-3 sm:col-span-1">
                        <label class="form-label text-xs">Qty</label>
                        <input type="number" class="form-control item-qty" value="1" min="1" required>
                    </div>
                    <div class="col-span-4 sm:col-span-2">
                        <label class="form-label text-xs">Unit Price</label>
                        <input type="number" class="form-control item-price" step="0.01" placeholder="0.00" required>
                    </div>
                    <div class="col-span-4 sm:col-span-1">
                        <label class="form-label text-xs">Amount</label>
                        <input type="number" class="form-control item-amount" disabled>
                    </div>
                    <div class="col-span-1 flex items-end">
                        <button type="button" class="btn btn-outline-danger w-full btn-remove-item">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="col-span-12">
                        <label class="form-label text-xs">Note/Account Details (Optional)</label>
                        <textarea class="form-control item-note" rows="1" placeholder="Account Number | Bank | Additional notes"></textarea>
                    </div>
                </div>
            </div>
        `;
            $('#items-container').append(itemHtml);

            if (window.lucide) window.lucide.createIcons();

            state.items.push({
                id: itemId
            });
            calculateTotal();
        }

        function removeItem(itemId) {
            $(`.item-row[data-item-id="${itemId}"]`).remove();
            state.items = state.items.filter(i => i.id != itemId);
            calculateTotal();
        }

        function calculateTotal() {
            let total = 0;
            $('.item-row').each(function() {
                const qty = parseFloat($(this).find('.item-qty').val()) || 0;
                const price = parseFloat($(this).find('.item-price').val()) || 0;
                const amount = qty * price;
                $(this).find('.item-amount').val(amount.toFixed(2));
                total += amount;
            });
            $('#items-total').text('₦' + total.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));
        }

        async function submitRequest(e, isDraft = false) {
            e.preventDefault();

            const items = [];
            $('.item-row').each(function() {
                const qty = parseFloat($(this).find('.item-qty').val()) || 0;
                const price = parseFloat($(this).find('.item-price').val()) || 0;
                items.push({
                    item: $(this).find('.item-description').val(),
                    category_id: $(this).find('.item-category').val(),
                    quantity: qty,
                    unit_price: price,
                    amount: qty * price,
                    note: $(this).find('.item-note').val()
                });
            });

            if (items.length === 0) {
                showToast('Please add at least one item', 'error');
                return;
            }

            // Calculate total from items
            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

            const payload = {
                request_type_id: $('#request-type-id').val(),
                amount: totalAmount,
                department_id: $('#department').val() || null,
                project_id: $('#project').val() || null,
                purpose: $('#purpose').val(),
                due_date: $('#due-date').val() || null,
                is_reimbursement: $('#is-reimbursement').is(':checked'),
                items: items,
                status: isDraft ? 'draft' : 'pending'
            };

            try {
                const buttonText = isDraft ? 'Saving...' : 'Submitting...';
                const buttonIcon = isDraft ? 'save' : 'send';
                const $btn = isDraft ? $('#btn-save-draft') : $('#btn-submit');

                $btn.prop('disabled', true).html(`<i data-lucide="${buttonIcon}" class="w-4 h-4 mr-2 animate-spin"></i> ${buttonText}`);

                // First create the request with the correct status
                const res = await window.ApiClient.post(API.createRequest, payload);

                const message = isDraft ? 'Draft saved successfully!' : 'Request submitted successfully!';
                showToast(message, 'success');

                setTimeout(() => {
                    window.location.href = '/finance/requests';
                }, 1500);
            } catch (e) {
                console.error('Submit error:', e);
                showToast(e.responseJSON?.message || 'Failed to submit request', 'error');
                $('#btn-submit').prop('disabled', false).html('<i data-lucide="send" class="w-4 h-4 mr-2"></i> Submit Request');
                $('#btn-save-draft').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Draft');
                if (window.lucide) window.lucide.createIcons();
            }
        }

        // Event Bindings
        $('#request-type-selector').on('change', function() {
            const typeId = $(this).val();
            if (typeId) {
                selectRequestType(typeId);
            }
        });

        $('#selected-type-dropdown').on('change', function() {
            const typeId = $(this).val();
            if (typeId) {
                state.selectedType = state.requestTypes.find(t => t.id == typeId);
                if (state.selectedType) {
                    $('#request-type-id').val(typeId);
                    $('#form-title').text(state.selectedType.name + ' - Request Details');
                }
            }
        });

        $('#btn-back').on('click', function() {
            $('#step-fill-form').addClass('hidden');
            $('#step-select-type').removeClass('hidden');
            $('#finance-request-form')[0].reset();
            $('#request-type-selector').val('');
            state.items = [];
            $('#items-container').empty();
        });

        $('#btn-save-draft').on('click', function(e) {
            submitRequest(e, true);
        });

        $('#add-item-btn').on('click', addItem);

        $(document).on('click', '.btn-remove-item', function() {
            const itemId = $(this).closest('.item-row').data('item-id');
            removeItem(itemId);
        });

        $(document).on('input', '.item-qty, .item-price', function() {
            calculateTotal();
        });

        $('#finance-request-form').on('submit', function(e) {
            submitRequest(e, false);
        });

        // Initialize
        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>