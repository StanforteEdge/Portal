<?php
/**
 * Template Name: Finance: Requests - PV New
 * Description: Form for generating Payment Vouchers (Linked to Request or Standalone)
 */

$pageTitle = 'Finance: Voucher';
$breadcrumb = [
    ['name' => 'Vouchers', 'url' => home_url('/finance/requests/pv')],
    ['name' => 'Generate']
];
$activeMenu = 'finance-vouchers';

get_header();

$request_id = isset($_GET['request_id']) ? sanitize_text_field($_GET['request_id']) : '';
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">

        <!-- Navigation -->
        <div class="mb-6">
            <a href="/finance/requests/pv" class="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Vouchers List
            </a>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">Payment Voucher</h1>

            <form id="paymentVoucherForm" class="space-y-6">
                <!-- Linked Request ID (Hidden) -->
                <input type="hidden" name="request_id" id="request_id" value="<?php echo esc_attr($request_id); ?>">

                <!-- Voucher Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="voucher_number" class="form-label font-medium text-gray-700 block mb-1">Voucher
                            Number</label>
                        <input type="text" id="voucher_number" name="voucher_number"
                            class="form-input w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="PV/<?php echo date('Y'); ?>/..." required>
                    </div>
                    <div>
                        <label for="voucher_date" class="form-label font-medium text-gray-700 block mb-1">Date</label>
                        <input type="date" id="voucher_date" name="voucher_date"
                            class="form-input w-full rounded-md border-gray-300 shadow-sm" required>
                    </div>
                </div>

                <!-- Payee Information -->
                <div class="border-t border-gray-100 pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payee Information</h2>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="payee_name" class="form-label font-medium text-gray-700 block mb-1">Payee
                                Name</label>
                            <input type="text" id="payee_name" name="payee_name"
                                class="form-input w-full rounded-md border-gray-300 shadow-sm"
                                placeholder="Enter payee name" required>
                        </div>
                        <div>
                            <label for="payee_contact" class="form-label font-medium text-gray-700 block mb-1">Address /
                                Contact</label>
                            <textarea id="payee_contact" name="payee_contact"
                                class="form-input w-full rounded-md border-gray-300 shadow-sm" rows="2"
                                placeholder="Enter address or contact information" required></textarea>
                        </div>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="border-t border-gray-100 pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Items</h2>
                    <div id="items-container" class="space-y-3">
                        <!-- Items will be added here dynamically -->
                    </div>

                    <button type="button" id="add-item-btn"
                        class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="mr-1">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Item
                    </button>

                    <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-semibold text-gray-700">Total Amount:</span>
                            <span class="text-2xl font-bold text-green-600" id="total-amount">₦0.00</span>
                        </div>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="border-t border-gray-100 pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Details</h2>
                    <div class="space-y-4">
                        <div>
                            <label for="purpose" class="form-label font-medium text-gray-700 block mb-1">Description /
                                Purpose of Payment</label>
                            <textarea id="purpose" name="purpose"
                                class="form-input w-full rounded-md border-gray-300 shadow-sm" rows="3"
                                placeholder="Enter payment purpose or description" required></textarea>
                        </div>

                        <div>
                            <label for="amount_words" class="form-label font-medium text-gray-700 block mb-1">Amount in
                                Words</label>
                            <input type="text" id="amount_words" name="amount_words"
                                class="form-input w-full bg-gray-50 rounded-md border-gray-300 shadow-sm"
                                placeholder="Auto-generated from total" readonly>
                        </div>
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="border-t border-gray-100 pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Method</h2>
                    <div class="space-y-4">
                        <div class="flex gap-6">
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Cash"
                                    class="form-radio text-primary-600" required>
                                <span class="ml-2">Cash</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Transfer"
                                    class="form-radio text-primary-600">
                                <span class="ml-2">Transfer</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Cheque"
                                    class="form-radio text-primary-600">
                                <span class="ml-2">Cheque</span>
                            </label>
                        </div>

                        <div id="payment_details_container" style="display: none;">
                            <label for="payment_details"
                                class="form-label font-medium text-gray-700 block mb-1">Transfer / Cheque
                                Details</label>
                            <textarea id="payment_details" name="payment_details"
                                class="form-input w-full rounded-md border-gray-300 shadow-sm" rows="2"
                                placeholder="Enter bank details, cheque number, etc."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Approvals -->
                <div class="border-t border-gray-100 pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Approvals</h2>

                    <!-- Prepared By (Accountant) -->
                    <div class="mb-4">
                        <label for="prepared_date" class="form-label font-medium text-gray-700 block mb-1">Prepared By
                            (Accountant) - Date</label>
                        <input type="date" id="prepared_date" name="prepared_date"
                            class="form-input w-full rounded-md border-gray-300 shadow-sm" required>
                        <p class="text-sm text-gray-500 mt-1">Accountant:
                            <?php echo wp_get_current_user()->display_name; ?>
                        </p>
                    </div>

                    <!-- COO Approval -->
                    <div class="border-t border-gray-100 pt-4 mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="form-label font-medium text-gray-700 block mb-1">Approved By (COO)</label>
                                <div class="flex items-center h-10">
                                    <input type="checkbox" id="approved_coo" name="approved_coo"
                                        class="form-checkbox text-primary-600">
                                    <span class="ml-2 text-sm">Approved</span>
                                </div>
                            </div>
                            <div>
                                <label for="approved_coo_date"
                                    class="form-label font-medium text-gray-700 block mb-1">Approval Date</label>
                                <input type="date" id="approved_coo_date" name="approved_coo_date"
                                    class="form-input w-full rounded-md border-gray-300 shadow-sm">
                            </div>
                        </div>
                    </div>

                    <!-- ED Approval (Optional) -->
                    <div class="border-t border-gray-100 pt-4">
                        <label class="inline-flex items-center mb-3">
                            <input type="checkbox" id="include_ed" name="include_ed"
                                class="form-checkbox text-primary-600">
                            <span class="ml-2 font-medium text-gray-700">Include ED Approval</span>
                        </label>
                        <div id="ed_approval_container" class="grid grid-cols-2 gap-4" style="display: none;">
                            <div>
                                <label class="form-label font-medium text-gray-700 block mb-1">Approved By (ED)</label>
                                <div class="flex items-center h-10">
                                    <input type="checkbox" id="approved_ed" name="approved_ed"
                                        class="form-checkbox text-primary-600">
                                    <span class="ml-2 text-sm">Approved</span>
                                </div>
                            </div>
                            <div>
                                <label for="approved_ed_date"
                                    class="form-label font-medium text-gray-700 block mb-1">Approval Date</label>
                                <input type="date" id="approved_ed_date" name="approved_ed_date"
                                    class="form-input w-full rounded-md border-gray-300 shadow-sm">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Remarks -->
                <div class="border-t border-gray-100 pt-6">
                    <label for="remarks" class="form-label font-medium text-gray-700 block mb-1">Remarks</label>
                    <textarea id="remarks" name="remarks" class="form-input w-full rounded-md border-gray-300 shadow-sm"
                        rows="3" placeholder="Additional notes or comments (optional)"></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-6 border-t border-gray-100">
                    <button type="submit" id="generatePV"
                        class="btn btn-primary flex-1 bg-primary-600 text-white px-4 py-3 rounded-md shadow-sm hover:bg-primary-700 font-medium">
                        <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                            </path>
                        </svg>
                        Generate & Download Payment Voucher
                    </button>
                    <button type="button" id="resetForm"
                        class="btn btn-secondary border border-gray-300 text-gray-700 px-4 py-3 rounded-md shadow-sm hover:bg-gray-50 font-medium">
                        Reset Form
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', async function () {
        const form = document.getElementById('paymentVoucherForm');
        const amountWordsInput = document.getElementById('amount_words');
        const paymentMethodRadios = document.querySelectorAll('input[name="payment_method"]');
        const paymentDetailsContainer = document.getElementById('payment_details_container');
        const includeEDCheckbox = document.getElementById('include_ed');
        const edApprovalContainer = document.getElementById('ed_approval_container');
        const voucherDateInput = document.getElementById('voucher_date');
        const preparedDateInput = document.getElementById('prepared_date');
        const itemsContainer = document.getElementById('items-container');
        const addItemBtn = document.getElementById('add-item-btn');
        const totalAmountDisplay = document.getElementById('total-amount');
        const requestId = document.getElementById('request_id').value;
        let itemCount = 0;

        // Set today's date as default
        if (!voucherDateInput.value) voucherDateInput.valueAsDate = new Date();
        if (!preparedDateInput.value) preparedDateInput.valueAsDate = new Date();

        // =============== AUTO-POPULATE LOGIC ===============
        if (requestId) {
            try {
                const res = await fetch(`/wp-json/api/v1/requests/${requestId}`, {
                    headers: { 'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>' }
                });
                const data = await res.json();
                const req = data.data || data;

                if (req) {
                    // Populate Fields
                    document.getElementById('payee_name').value = req.created_by_name || '';
                    document.getElementById('purpose').value = req.data.purpose || '';

                    // If items exist
                    if (req.items && req.items.length) {
                        req.items.forEach(item => {
                            addItem(item.description, item.amount); // Simplification: we merge qty/amount for now
                            // Or support qty?
                            // The original form supports description + amount.
                            // Let's adapt addItem to support just that mapping
                        });
                    } else if (req.total_amount) {
                        // Single item
                        addItem(req.data.purpose, req.total_amount);
                    }

                    // Set Payee Contact if available?
                    // document.getElementById('payee_contact').value = ...
                }
            } catch (e) {
                console.error('Failed to pre-fill request data', e);
            }
        }
        // ===================================================

        // Add item functionality
        function addItem(description = '', amount = '') {
            itemCount++;
            const itemHtml = `
            <div class="itemm border border-gray-200 rounded p-3 flex flex-col md:flex-row gap-4 mt-2 bg-gray-50" data-item-id="${itemCount}">
                <div class="w-full md:w-16">
                    <label class="form-label text-xs">S/N</label>
                    <input type="text" value="${itemCount}" disabled class="form-input w-full text-center item-sn">
                </div>
                <div class="flex-1">
                    <label class="form-label text-xs">Description / Item</label>
                    <input type="text" name="items[${itemCount}][description]" class="form-input w-full rounded-md border-gray-300 shadow-sm" 
                           placeholder="Enter item description" required value="${description}">
                </div>
                <div class="w-full md:w-48">
                    <label class="form-label text-xs">Amount (₦)</label>
                    <input type="number" name="items[${itemCount}][amount]" class="form-input w-full rounded-md border-gray-300 shadow-sm item-amount" 
                           placeholder="0.00" step="0.01" min="0" required value="${amount}">
                </div>
                <button type="button" class="delete-item-btn text-red-500 hover:text-red-700 md:mt-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
            itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
            calculateTotal();
        }

        addItemBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addItem();
        });

        // Delete item functionality
        itemsContainer.addEventListener('click', function (e) {
            if (e.target.closest('.delete-item-btn')) {
                const itemRow = e.target.closest('.itemm');
                itemRow.remove();
                updateSerialNumbers();
                calculateTotal();
            }
        });

        // Update serial numbers after deletion
        function updateSerialNumbers() {
            const items = itemsContainer.querySelectorAll('.itemm');
            items.forEach((item, index) => {
                const serialNumberInput = item.querySelector('.item-sn');
                if (serialNumberInput) {
                    serialNumberInput.value = index + 1;
                }
            });
        }

        // Calculate total amount
        function calculateTotal() {
            let total = 0;
            const amountInputs = itemsContainer.querySelectorAll('.item-amount');
            amountInputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });
            totalAmountDisplay.textContent = '₦' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            amountWordsInput.value = numberToWords(Math.floor(total));
        }

        // Listen to amount changes
        itemsContainer.addEventListener('input', function (e) {
            if (e.target.classList.contains('item-amount')) {
                calculateTotal();
            }
        });

        // Convert amount to words
        function numberToWords(num) {
            if (num === 0) return 'Zero Naira Only';

            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

            function convertLessThanThousand(n) {
                if (n === 0) return '';
                if (n < 10) return ones[n];
                if (n < 20) return teens[n - 10];
                if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
                return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
            }

            let result = '';
            let billion = Math.floor(num / 1000000000);
            let million = Math.floor((num % 1000000000) / 1000000);
            let thousand = Math.floor((num % 1000000) / 1000);
            let remainder = num % 1000;

            if (billion > 0) result += convertLessThanThousand(billion) + ' Billion ';
            if (million > 0) result += convertLessThanThousand(million) + ' Million ';
            if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
            if (remainder > 0) result += convertLessThanThousand(remainder);

            return result.trim() + ' Naira Only';
        }

        // Show/hide payment details based on method
        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'Transfer' || this.value === 'Cheque') {
                    paymentDetailsContainer.style.display = 'block';
                } else {
                    paymentDetailsContainer.style.display = 'none';
                }
            });
        });

        // Show/hide ED approval
        includeEDCheckbox.addEventListener('change', function () {
            edApprovalContainer.style.display = this.checked ? 'block' : 'none';
        });

        // Form submission
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Collect items
            const items = [];
            const itemRows = itemsContainer.querySelectorAll('.itemm');
            itemRows.forEach((row, index) => {
                const description = row.querySelector('input[name*="[description]"]').value;
                const amount = parseFloat(row.querySelector('input[name*="[amount]"]').value) || 0;
                items.push({ description, amount }); // Qty is implicitly 1 here logic-wise
            });

            // Calculate total
            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

            const formData = {
                request_id: document.getElementById('request_id').value, // Send Request ID
                voucher_number: document.getElementById('voucher_number').value,
                voucher_date: document.getElementById('voucher_date').value,
                payee_name: document.getElementById('payee_name').value,
                payee_contact: document.getElementById('payee_contact').value,
                purpose: document.getElementById('purpose').value,
                items: items,
                amount: totalAmount,
                amount_words: document.getElementById('amount_words').value,
                payment_method: document.querySelector('input[name="payment_method"]:checked').value,
                payment_details: document.getElementById('payment_details').value,
                prepared_date: document.getElementById('prepared_date').value,
                approved_coo: document.getElementById('approved_coo').checked,
                approved_coo_date: document.getElementById('approved_coo_date').value,
                include_ed: document.getElementById('include_ed').checked,
                approved_ed: document.getElementById('approved_ed').checked,
                approved_ed_date: document.getElementById('approved_ed_date').value,
                remarks: document.getElementById('remarks').value
            };

            try {
                const response = await fetch('/wp-json/api/v1/requests/generate-pv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `PV_${formData.voucher_number.replace(/\//g, '_')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // Alert and redirect
                    setTimeout(() => {
                        alert('Payment Voucher Generated and Saved!');
                        window.location.href = '/finance/requests/pv';
                    }, 1000);

                } else {
                    alert('Error generating Payment Voucher. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating Payment Voucher. Please check your connection and try again.');
            }
        });

        // Reset form
        document.getElementById('resetForm').addEventListener('click', function () {
            form.reset();
            voucherDateInput.valueAsDate = new Date();
            amountWordsInput.value = '';
            paymentDetailsContainer.style.display = 'none';
            edApprovalContainer.style.display = 'none';
        });
    });
</script>

<?php get_footer(); ?>