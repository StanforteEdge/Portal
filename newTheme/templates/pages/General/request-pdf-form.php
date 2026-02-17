<?php /* Template Name:  Request PDF Form  */
$pageTitle = 'Dashboard';
$breadcrumb = [
    ['name' => 'Dashboard']
];
$activeMenu = 'dashboard';

get_header();


?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Request PDF Generator
    </h2>
</div>

<div class="intro-y mt-5">
    <!-- BEGIN: Form Layout -->
    <form id="pdf_form">
        <div class="intro-y box p-5">
            <div class="grid grid-cols-12 gap-6 border-b mt-4 pb-2">
                <div class="col-span-12 lg:col-span-7">
                    <h3 class="text-lg font-medium">Request Details</h3>

                    <div class="gap-3 sm:flex flex-row">
                        <div class="mt-5 w-full">
                            <label for="request_id" class="form-label">Request ID/Number</label>
                            <input type="text" id="request_id" name="request_id" class="form-control"
                                placeholder="e.g., REQ-001" required>
                        </div>
                        <div class="mt-5 w-full">
                            <label for="status" class="form-label">Status</label>
                            <select id="status" name="status" class="form-control">
                                <option value="Draft">Draft</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Disbursed">Disbursed</option>
                                <option value="Retired">Retired</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div class="gap-3 sm:flex flex-row">
                        <div class="mt-5 w-full">
                            <label for="staff_name" class="form-label">Staff Name</label>
                            <select id="staff_name" name="staff_name" class="form-control" required>
                                <option value="">Select Staff</option>
                                <option value="Precious Olajide">Precious Olajide</option>
                                <option value="Funsho Adun">Funsho Adun</option>
                                <option value="Ademibolanle Ajijala">Ademibolanle Ajijala</option>
                                <option value="Allen Abu">Allen Abu</option>
                                <option value="Oyinkansola Aje">Oyinkansola Aje</option>
                                </option>
                                <!-- Staff options will be populated from database/API -->
                            </select>
                        </div>
                        <div class="mt-5 w-full">
                            <label for="amount" class="form-label">Total Amount</label>
                            <input type="number" id="amount" name="amount" step="0.01" class="form-control"
                                placeholder="0.00" required>
                        </div>
                    </div>

                    <div class="gap-3 sm:flex flex-row">
                        <div class="mt-5 w-full">
                            <label for="date_created" class="form-label">Date Created</label>
                            <input type="date" id="date_created" name="date_created" class="form-control" required>
                        </div>
                        <div class="mt-5 w-full">
                            <label for="due_date" class="form-label">Due Date</label>
                            <input type="date" id="due_date" name="due_date" class="form-control" required>
                        </div>
                    </div>

                    <div class="gap-3 sm:flex flex-row">
                        <div class="mt-5 w-full">
                            <label for="team" class="form-label">Team</label>
                            <select id="team" name="team" class="form-control" required>
                                <option value="">Select Team</option>
                                <option value="Administration">Administration</option>
                                <option value="IT">IT</option>
                                <option value="Programs">Programs</option>
                                <option value="Communications">Communications</option>
                                <option value="Operations">Operations</option>
                                <!-- Team options will be populated from database/API -->
                            </select>
                        </div>
                        <div class="mt-5 w-full">
                            <label for="project" class="form-label">Project</label>
                            <select id="project" name="project" class="form-control" required>
                                <option value="">Select Project</option>
                                <option value="GESP">GESP</option>
                                <option value="None">None</option>
                                <!-- Project options will be populated from database/API -->
                            </select>
                        </div>
                    </div>

                    <div class="mt-5 w-full">
                        <label for="purpose" class="form-label">Purpose</label>
                        <textarea id="purpose" name="purpose" class="form-control"
                            placeholder="Request purpose/description" required></textarea>
                    </div>

                    <div class="mt-5">
                        <label class="form-check-label">
                            <input id="reimburse" name="reimburse" class="form-check-input" type="checkbox">
                            Is this a Reimbursement?
                        </label>
                    </div>
                </div>

                <div class="col-span-12 border-0 md:border-l p-2 lg:col-span-5">
                    <h3 class="text-lg font-medium p-2">Approval Flow</h3>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <input id="sent_check" name="sent_check" class="form-check-input" type="checkbox" checked>
                            <label for="sent_check" class="flex-1">Request Sent</label>
                            <input type="date" id="sent_date" name="sent_date" class="form-control w-40 text-sm">
                        </div>
                        <div class="flex items-center gap-3">
                            <input id="team_lead_check" name="team_lead_check" class="form-check-input" type="checkbox"
                                checked>
                            <label for="team_lead_check" class="flex-1">Team Lead</label>
                            <input type="date" id="team_lead_date" name="team_lead_date"
                                class="form-control w-40 text-sm">
                        </div>
                        <div class="flex items-center gap-3">
                            <input id="account_officer_check" name="account_officer_check" class="form-check-input"
                                type="checkbox" checked>
                            <label for="account_officer_check" class="flex-1">Account Officer</label>
                            <input type="date" id="account_officer_date" name="account_officer_date"
                                class="form-control w-40 text-sm">
                        </div>
                        <div class="flex items-center gap-3">
                            <input id="coo_check" name="coo_check" class="form-check-input" type="checkbox" checked>
                            <label for="coo_check" class="flex-1">COO</label>
                            <input type="date" id="coo_date" name="coo_date" class="form-control w-40 text-sm">
                        </div>
                        <div class="flex items-center gap-3">
                            <input id="ed_check" name="ed_check" class="form-check-input" type="checkbox">
                            <label for="ed_check" class="flex-1">ED</label>
                            <input type="date" id="ed_date" name="ed_date" class="form-control w-40 text-sm">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Items -->
            <div class="mt-4 pb-2 border-b">
                <div id="items-container" class="mt-4">
                    <h3 class="text-lg font-medium">Request Items</h3>
                </div>
                <div class="flex items-center text-primary justify-between text-2xl mt-5">
                    <button type="button" id="add-item-btn" class="btn btn-primary-soft btn-sm mt-2 item-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>Add item
                    </button>
                    <div>Total: <span class="ml-2 p-2 border rounded" id="total-amount">₦0.00</span></div>
                </div>
            </div>

            <!-- Disbursement Items -->
            <div class="mt-4 pb-2 border-b">
                <div id="disbursement-container" class="mt-4">
                    <h3 class="text-lg font-medium">Disbursement Items</h3>
                </div>
                <div class="flex items-center text-primary justify-between text-2xl mt-5">
                    <button type="button" id="add-disbursement-btn"
                        class="btn btn-secondary-soft btn-sm mt-2 item-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>Add disbursement
                    </button>
                    <div>Disbursement Total: <span class="ml-2 p-2 border rounded" id="disbursement-total">₦0.00</span>
                    </div>
                </div>
            </div>

            <!-- Retirement Items -->
            <div class="mt-4 pb-2 border-b">
                <div id="retirement-container" class="mt-4">
                    <h3 class="text-lg font-medium">Retirement Items</h3>
                </div>
                <div class="flex items-center text-primary justify-between text-2xl mt-5">
                    <button type="button" id="add-retirement-btn" class="btn btn-success-soft btn-sm mt-2 item-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>Add retirement
                    </button>
                    <div>Retirement Total: <span class="ml-2 p-2 border rounded" id="retirement-total">₦0.00</span>
                    </div>
                </div>
            </div>

            <!-- Reconciliation Section -->
            <div class="mt-4 pb-2 border-b">
                <div class="mt-4">
                    <h3 class="text-lg font-medium">Reconciliation Summary</h3>
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="p-4 border rounded-lg bg-gray-50">
                            <h4 class="font-medium text-gray-700">Items Total</h4>
                            <div class="text-2xl font-bold text-green-600" id="reconciliation-items-total">₦0.00</div>
                        </div>
                        <div class="p-4 border rounded-lg bg-gray-50">
                            <h4 class="font-medium text-gray-700">Disbursement Total</h4>
                            <div class="text-2xl font-bold text-blue-600" id="reconciliation-disbursement-total">₦0.00
                            </div>
                        </div>
                        <div class="p-4 border rounded-lg bg-gray-50">
                            <h4 class="font-medium text-gray-700">Retirement Total</h4>
                            <div class="text-2xl font-bold text-red-600" id="reconciliation-retirement-total">₦0.00
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <!-- Notes Section -->
            <div class="mt-4 pb-2 border-b">
                <div class="mt-4">
                    <h3 class="text-lg font-medium">Notes</h3>
                    <div class="mt-2">
                        <textarea id="notes" name="notes" class="form-control" rows="4"
                            placeholder="Add any additional notes or comments..."></textarea>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center p-3 mt-5">
                <div>
                    <button type="button" id="generate_pdf" class="btn btn-lg btn-primary">Generate PDF</button>
                </div>
            </div>
        </div>
    </form>
    <!-- END: Form Layout -->
</div>

<!-- PDF generation is now handled server-side -->

<script>
    jQuery(document).ready(function ($) {
        let itemCount = 0;

        // Add request item functionality
        $('#add-item-btn').click(function (e) {
            e.preventDefault();
            var itemIndex = $('.itemm').length;
            var itemHtml = `
        <div class="itemm border-t border-b p-3 flex flex-col gap-5 mt-2" data-item-index="${itemIndex}" data-type="request">
            <div class="flex gap-5">
                <div class="w-full">
                    <label class="form-label">Item:</label>
                    <input type="text" name="item[${itemIndex}][item]" required class="form-control">
                </div>
                <div class="">
                    <label class="form-label">Quantity:</label>
                    <input type="number" name="item[${itemIndex}][qty]" required class="form-control" value="1">
                </div>
                <div class="">
                    <label class="form-label">Price:</label>
                    <input type="number" name="item[${itemIndex}][price]" required class="form-control" step="0.01" value="0.00">
                </div>
                <div class="">
                    <label class="form-label">Amount:</label>
                    <input type="number" name="item[${itemIndex}][amt]" disabled class="form-control">
                </div>
            </div>
            <div class="flex gap-5 items-end">
                <div class="flex items-start gap-5 flex-1">
                    <div class="">
                        <label class="form-label">Note:</label>
                        <textarea name="item[${itemIndex}][account]" rows="1" required class="form-control" placeholder="Account Number | Account Name | Bank"></textarea>
                    </div>
                </div>
                <button class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
            </div>
        </div>
        `;
            $('#items-container').append(itemHtml);
        });

        // Add disbursement item functionality
        $('#add-disbursement-btn').click(function (e) {
            e.preventDefault();
            var itemIndex = $('.itemm').length;
            var itemHtml = `
        <div class="itemm border-t border-b p-3 flex flex-col gap-5 mt-2" data-item-index="${itemIndex}" data-type="disburse">
            <div class="flex gap-5">
                <div class="w-full">
                    <label class="form-label">Item:</label>
                    <input type="text" name="item[${itemIndex}][item]" required class="form-control">
                </div>
                <div class="">
                    <label class="form-label">Quantity:</label>
                    <input type="number" name="item[${itemIndex}][qty]" required class="form-control" value="1">
                </div>
                <div class="">
                    <label class="form-label">Price:</label>
                    <input type="number" name="item[${itemIndex}][price]" required class="form-control" step="0.01" value="0.00">
                </div>
                <div class="">
                    <label class="form-label">Amount:</label>
                    <input type="number" name="item[${itemIndex}][amt]" disabled class="form-control">
                </div>
            </div>
            <div class="flex gap-5 items-end">
                <div class="flex items-start gap-5 flex-1">
                    <div class="flex-1">
                        <label class="form-label">Note:</label>
                        <textarea name="item[${itemIndex}][account]" rows="1" required class="form-control" placeholder="Account Number | Account Name | Bank"></textarea>
                    </div>
                    <div class="">
                        <label class="form-label">Date:</label>
                        <input type="date" name="item[${itemIndex}][date]" class="form-control">
                    </div>
                </div>
                <button class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
            </div>
        </div>
        `;
            $('#disbursement-container').append(itemHtml);
        });

        // Add retirement item functionality
        $('#add-retirement-btn').click(function (e) {
            e.preventDefault();
            var itemIndex = $('.itemm').length;
            var itemHtml = `
        <div class="itemm border-t border-b p-3 flex flex-col gap-5 mt-2" data-item-index="${itemIndex}" data-type="retire">
            <div class="flex gap-5">
                <div class="w-full">
                    <label class="form-label">Item:</label>
                    <input type="text" name="item[${itemIndex}][item]" required class="form-control">
                </div>
                <div class="">
                    <label class="form-label">Quantity:</label>
                    <input type="number" name="item[${itemIndex}][qty]" required class="form-control" value="1">
                </div>
                <div class="">
                    <label class="form-label">Price:</label>
                    <input type="number" name="item[${itemIndex}][price]" required class="form-control" step="0.01" value="0.00">
                </div>
                <div class="">
                    <label class="form-label">Amount:</label>
                    <input type="number" name="item[${itemIndex}][amt]" disabled class="form-control">
                </div>
            </div>
            <div class="flex gap-5 items-end">
                <div class="flex items-start gap-5 flex-1">
                    <div class="">
                        <label class="form-label">Note:</label>
                        <textarea name="item[${itemIndex}][account]" rows="1" required class="form-control" placeholder="Account Number | Account Name | Bank"></textarea>
                    </div>
                </div>
                <button class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
            </div>
        </div>
        `;
            $('#retirement-container').append(itemHtml);
        });

        // Delete item functionality
        $(document).on('click', '.delete-item-btn', function () {
            $(this).closest('.itemm').remove();
            calculateAllTotals();
        });

        // Calculate amount when quantity or price changes
        $('#items-container, #disbursement-container, #retirement-container').on('change', '.itemm input[type="number"]', function () {
            calculateAmount(this);
            calculateAllTotals();
        });

        function calculateAmount(input) {
            var itemContainer = $(input).closest('.itemm');
            var itemIndex = itemContainer.data('itemIndex');
            var priceInput = itemContainer.find('[name="item[' + itemIndex + '][price]"]');
            var quantityInput = itemContainer.find('[name="item[' + itemIndex + '][qty]"]');
            var amountInput = itemContainer.find('[name="item[' + itemIndex + '][amt]"]');

            var price = parseFloat(priceInput.val()) || 0;
            var quantity = parseFloat(quantityInput.val()) || 0;
            var amount = price * quantity;

            amountInput.val(amount.toFixed(2));
        }

        function calculateAllTotals() {
            var requestTotal = 0;
            var disbursementTotal = 0;
            var retirementTotal = 0;

            // Calculate request items total
            $('#items-container .itemm').each(function () {
                var itemIndex = $(this).data('itemIndex');
                var amountInput = $(this).find('[name="item[' + itemIndex + '][amt]"]');
                var amount = parseFloat(amountInput.val()) || 0;
                requestTotal += amount;
            });

            // Calculate disbursement items total
            $('#disbursement-container .itemm').each(function () {
                var itemIndex = $(this).data('itemIndex');
                var amountInput = $(this).find('[name="item[' + itemIndex + '][amt]"]');
                var amount = parseFloat(amountInput.val()) || 0;
                disbursementTotal += amount;
            });

            // Calculate retirement items total
            $('#retirement-container .itemm').each(function () {
                var itemIndex = $(this).data('itemIndex');
                var amountInput = $(this).find('[name="item[' + itemIndex + '][amt]"]');
                var amount = parseFloat(amountInput.val()) || 0;
                retirementTotal += amount;
            });

            // Update display totals
            $('#total-amount').html('₦' + requestTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#disbursement-total').html('₦' + disbursementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#retirement-total').html('₦' + retirementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));

            // Update reconciliation summary
            $('#reconciliation-items-total').html('₦' + requestTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#reconciliation-disbursement-total').html('₦' + disbursementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#reconciliation-retirement-total').html('₦' + retirementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));

            // Update main amount field with request total
            $('#amount').val(requestTotal.toFixed(2));
        }

        // Generate PDF functionality - server-side
        $('#generate_pdf').click(function (e) {
            e.preventDefault();

            // Validate form
            if (!$('#request_id').val() || !$('#staff_name').val() || !$('#amount').val() || !$('#team').val() || !$('#purpose').val()) {
                alert("Please fill in all required fields.");
                return;
            }

            console.log('Starting PDF generation...');

            // Collect form data
            var formData = {};
            $('#pdf_form').serializeArray().forEach(function (field) {
                formData[field.name] = field.value;
            });

            console.log('Form data collected:', formData);

            // Collect items by type
            var requestItems = [];
            var disbursementItems = [];
            var retirementItems = [];

            $('.itemm').each(function () {
                var itemType = $(this).data('type');
                var itemData = {};
                $(this).find('input, textarea').each(function () {
                    var name = $(this).attr('name');
                    if (name) {
                        var matches = name.match(/item\[(\d+)\]\[(\w+)\]/);
                        if (matches) {
                            if (!itemData[matches[1]]) itemData[matches[1]] = {};
                            itemData[matches[1]][matches[2]] = $(this).val();
                        }
                    }
                });

                if (itemType === 'request') {
                    requestItems.push(itemData);
                } else if (itemType === 'disburse') {
                    disbursementItems.push(itemData);
                } else if (itemType === 'retire') {
                    retirementItems.push(itemData);
                }
            });

            console.log('Items collected:', { requestItems, disbursementItems, retirementItems });

            // Collect approval checkboxes with dates
            var approvals = {
                sent: $('#sent_check').is(':checked'),
                sent_date: $('#sent_date').val(),
                team_lead: $('#team_lead_check').is(':checked'),
                team_lead_date: $('#team_lead_date').val(),
                account_officer: $('#account_officer_check').is(':checked'),
                account_officer_date: $('#account_officer_date').val(),
                coo: $('#coo_check').is(':checked'),
                coo_date: $('#coo_date').val(),
                ed: $('#ed_check').is(':checked'),
                ed_date: $('#ed_date').val()
            };

            console.log('Approvals collected:', approvals);

            // Prepare data for API
            var apiData = {
                request_id: formData.request_id,
                status: formData.status,
                staff_name: formData.staff_name,
                amount: parseFloat(formData.amount),
                team: formData.team,
                project: formData.project,
                purpose: formData.purpose,
                date_created: formData.date_created,
                due_date: formData.due_date,
                reimburse: formData.reimburse === 'on',
                notes: formData.notes,
                request_items: requestItems,
                disbursement_items: disbursementItems,
                retirement_items: retirementItems,
                approvals: approvals
            };

            console.log('Sending to API:', apiData);

            // Show loading
            $('#generate_pdf').prop('disabled', true).text('Generating PDF...');

            // Send to server-side endpoint
            fetch('/wp-json/api/v1/requests/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                },
                body: JSON.stringify(apiData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Server error: ' + response.status);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // Create download link
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `request-${formData.request_id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    console.log('PDF downloaded successfully');
                })
                .catch(error => {
                    console.error('PDF generation failed:', error);
                    alert('Failed to generate PDF. Please try again. Error: ' + error.message);
                })
                .finally(() => {
                    // Reset button
                    $('#generate_pdf').prop('disabled', false).text('Generate PDF');
                });
        });
    });
</script>

<?php get_footer(); ?>