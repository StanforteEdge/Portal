<?php
/**
 * Template Name: Payment Voucher Form
 * Description: Form for generating Payment Vouchers
 */

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">Payment Voucher</h1>
            
            <form id="paymentVoucherForm" class="space-y-6">
                
                <!-- Voucher Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="voucher_number" class="form-label">Voucher Number</label>
                        <input type="text" id="voucher_number" name="voucher_number" class="form-control" 
                               placeholder="PV/2024/001" required>
                    </div>
                    <div>
                        <label for="voucher_date" class="form-label">Date</label>
                        <input type="date" id="voucher_date" name="voucher_date" class="form-control" required>
                    </div>
                </div>

                <!-- Payee Information -->
                <div class="border-t pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payee Information</h2>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="payee_name" class="form-label">Payee Name</label>
                            <input type="text" id="payee_name" name="payee_name" class="form-control" 
                                   placeholder="Enter payee name" required>
                        </div>
                        <div>
                            <label for="payee_contact" class="form-label">Address / Contact</label>
                            <textarea id="payee_contact" name="payee_contact" class="form-control" rows="2" 
                                      placeholder="Enter address or contact information" required></textarea>
                        </div>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="border-t pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Items</h2>
                    <div id="items-container" class="space-y-3">
                        <!-- Items will be added here dynamically -->
                    </div>
                    
                    <button type="button" id="add-item-btn" class="btn btn-primary-soft btn-sm mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1">
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
                <div class="border-t pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Details</h2>
                    <div class="space-y-4">
                        <div>
                            <label for="purpose" class="form-label">Description / Purpose of Payment</label>
                            <textarea id="purpose" name="purpose" class="form-control" rows="3" 
                                      placeholder="Enter payment purpose or description" required></textarea>
                        </div>
                        
                        <div>
                            <label for="amount_words" class="form-label">Amount in Words</label>
                            <input type="text" id="amount_words" name="amount_words" class="form-control" 
                                   placeholder="Auto-generated from total" readonly>
                        </div>
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="border-t pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Payment Method</h2>
                    <div class="space-y-4">
                        <div class="flex gap-6">
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Cash" class="form-radio" required>
                                <span class="ml-2">Cash</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Transfer" class="form-radio">
                                <span class="ml-2">Transfer</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" name="payment_method" value="Cheque" class="form-radio">
                                <span class="ml-2">Cheque</span>
                            </label>
                        </div>
                        
                        <div id="payment_details_container" style="display: none;">
                            <label for="payment_details" class="form-label">Transfer / Cheque Details</label>
                            <textarea id="payment_details" name="payment_details" class="form-control" rows="2" 
                                      placeholder="Enter bank details, cheque number, etc."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Approvals -->
                <div class="border-t pt-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Approvals</h2>
                    
                    <!-- Prepared By (Accountant) -->
                    <div class="mb-4">
                        <label for="prepared_date" class="form-label">Prepared By (Accountant) - Date</label>
                        <input type="date" id="prepared_date" name="prepared_date" class="form-control" required>
                        <p class="text-sm text-gray-500 mt-1">Accountant: Oyinkansola Aje</p>
                    </div>
                    
                    <!-- COO Approval -->
                    <div class="border-t pt-4 mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Approved By (COO)</label>
                                <div class="flex items-center h-10">
                                    <input type="checkbox" id="approved_coo" name="approved_coo" class="form-checkbox">
                                    <span class="ml-2 text-sm">Approved</span>
                                </div>
                            </div>
                            <div>
                                <label for="approved_coo_date" class="form-label">Approval Date</label>
                                <input type="date" id="approved_coo_date" name="approved_coo_date" class="form-control">
                            </div>
                        </div>
                    </div>
                    
                    <!-- ED Approval (Optional) -->
                    <div class="border-t pt-4">
                        <label class="inline-flex items-center mb-3">
                            <input type="checkbox" id="include_ed" name="include_ed" class="form-checkbox">
                            <span class="ml-2">Include ED Approval</span>
                        </label>
                        <div id="ed_approval_container" class="grid grid-cols-2 gap-4" style="display: none;">
                            <div>
                                <label class="form-label">Approved By (ED)</label>
                                <div class="flex items-center h-10">
                                    <input type="checkbox" id="approved_ed" name="approved_ed" class="form-checkbox">
                                    <span class="ml-2 text-sm">Approved</span>
                                </div>
                            </div>
                            <div>
                                <label for="approved_ed_date" class="form-label">Approval Date</label>
                                <input type="date" id="approved_ed_date" name="approved_ed_date" class="form-control">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Remarks -->
                <div class="border-t pt-6">
                    <label for="remarks" class="form-label">Remarks</label>
                    <textarea id="remarks" name="remarks" class="form-control" rows="3" 
                              placeholder="Additional notes or comments (optional)"></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-6 border-t">
                    <button type="submit" id="generatePV" class="btn btn-primary flex-1">
                        <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Generate Payment Voucher
                    </button>
                    <button type="button" id="resetForm" class="btn btn-secondary">
                        Reset Form
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
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
    let itemCount = 0;

    // Set today's date as default
    voucherDateInput.valueAsDate = new Date();
    preparedDateInput.valueAsDate = new Date();

    // Add item functionality
    addItemBtn.addEventListener('click', function(e) {
        e.preventDefault();
        itemCount++;
        const itemHtml = `
            <div class="itemm border-t border-b p-3 flex flex-col gap-5 mt-2" data-item-id="${itemCount}">
                <div class="flex gap-5">
                    <div class="w-20">
                        <label class="form-label">S/N:</label>
                        <input type="text" value="${itemCount}" disabled class="form-control text-center item-sn">
                    </div>
                    <div class="flex-1">
                        <label class="form-label">Description / Item:</label>
                        <input type="text" name="items[${itemCount}][description]" class="form-control" 
                               placeholder="Enter item description" required>
                    </div>
                    <div class="w-40">
                        <label class="form-label">Amount (₦):</label>
                        <input type="number" name="items[${itemCount}][amount]" class="form-control item-amount" 
                               placeholder="0.00" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="flex gap-5 items-end">
                    <div class="flex-1"></div>
                    <button type="button" class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
        calculateTotal();
    });

    // Delete item functionality
    itemsContainer.addEventListener('click', function(e) {
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
        totalAmountDisplay.textContent = '₦' + total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        amountWordsInput.value = numberToWords(Math.floor(total));
    }

    // Listen to amount changes
    itemsContainer.addEventListener('input', function(e) {
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

    // Amount to words is now handled by calculateTotal() function

    // Show/hide payment details based on method
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Transfer' || this.value === 'Cheque') {
                paymentDetailsContainer.style.display = 'block';
            } else {
                paymentDetailsContainer.style.display = 'none';
            }
        });
    });

    // Show/hide ED approval
    includeEDCheckbox.addEventListener('change', function() {
        edApprovalContainer.style.display = this.checked ? 'block' : 'none';
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect items
        const items = [];
        const itemRows = itemsContainer.querySelectorAll('.itemm');
        itemRows.forEach((row, index) => {
            const description = row.querySelector('input[name*="[description]"]').value;
            const amount = parseFloat(row.querySelector('input[name*="[amount]"]').value) || 0;
            items.push({ description, amount });
        });

        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        const formData = {
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
            } else {
                alert('Error generating Payment Voucher. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error generating Payment Voucher. Please check your connection and try again.');
        }
    });

    // Reset form
    document.getElementById('resetForm').addEventListener('click', function() {
        form.reset();
        voucherDateInput.valueAsDate = new Date();
        amountWordsInput.value = '';
        paymentDetailsContainer.style.display = 'none';
        edApprovalContainer.style.display = 'none';
    });
});
</script>

<?php get_footer(); ?>
