<div id="pv-container">
    <!-- Existing Voucher View -->
    <div id="pv-view" class="hidden">
        <div class="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
            <h3 class="text-lg font-medium text-green-800">Payment Voucher Generated</h3>
            <p class="text-green-700 mt-1">Voucher Number: <span id="pv-display-number" class="font-bold"></span></p>
            <p class="text-green-700">Status: <span id="pv-display-status" class="font-bold uppercase"></span></p>
        </div>

        <button onclick="downloadPV()" class="btn btn-outline-primary">
            Download PDF
        </button>

        <button id="btn-mark-paid" onclick="markAsPaid()" class="btn btn-success ml-2 hidden">
            Mark as Paid
        </button>
    </div>

    <!-- Generate Voucher Form -->
    <div id="pv-form">
        <h3 class="text-lg font-medium mb-4">Generate Payment Voucher</h3>
        <p class="text-sm text-gray-500 mb-6">Generating a voucher will authorize payment for this request.</p>

        <form id="createPVForm" class="space-y-4 max-w-lg">
            <div>
                <label class="form-label">Payee Name</label>
                <input type="text" id="pv_payee_name" class="form-control" required>
            </div>
            <div>
                <label class="form-label">Payment Method</label>
                <select id="pv_method" class="form-control">
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Cheque">Cheque</option>
                </select>
            </div>
            <div>
                <label class="form-label">Amount</label>
                <input type="number" id="pv_amount" class="form-control bg-gray-100" readonly>
            </div>

            <button type="submit" class="btn btn-primary mt-4">Generate Voucher</button>
        </form>
    </div>
</div>

<script>
    let currentVoucherId = null;

    window.addEventListener('requestLoaded', function (e) {
        const req = e.detail;

        // Pre-fill form
        document.getElementById('pv_payee_name').value = req.created_by?.name || '';
        document.getElementById('pv_amount').value = req.total_amount;

        // Load existing PVs
        loadVouchers(req.id);
    });

    async function loadVouchers(requestId) {
        // Fetch existing vouchers
        try {
            const response = await fetch(`/wp-json/api/v1/finance/requests/${requestId}/pv`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const voucher = data.data[0]; // Assuming single PV for now
                currentVoucherId = voucher.id;

                document.getElementById('pv-form').classList.add('hidden');
                document.getElementById('pv-view').classList.remove('hidden');

                document.getElementById('pv-display-number').textContent = voucher.voucher_number;
                document.getElementById('pv-display-status').textContent = voucher.status;

                if (voucher.status !== 'paid') {
                    document.getElementById('btn-mark-paid').classList.remove('hidden');
                }
            }
        } catch (e) {
            console.error("Error loading PVs", e);
        }
    }

    document.getElementById('createPVForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!confirm('Generate Payment Voucher?')) return;

        const payload = {
            request_id: REQUEST_ID,
            payee_name: document.getElementById('pv_payee_name').value,
            payment_method: document.getElementById('pv_method').value,
            amount: document.getElementById('pv_amount').value,
            items: [] // In real implementation, pass items. For now backend might require structure, we will handle in controller or refine here.
            // Actually PaymentVoucherService requires 'items'. We need to get them from the request cache or DOM.
            // For simplicity, we'll re-fetch or assume backend handles "all items" if empty? 
            // No, Service throws exception. We need items.
        };

        // Quick fix to get items from DOM or Request loaded object (better)
        // Let's grab them from the window event detail if stored, or just mock for this step since we are in a "partial"
        // Ideally we store 'requestData' globally in parent.
        // Let's assume 'requestData' is available or we pass dummy for now to verify connectivity.

        // Correct approach:
        // We need the items.
        try {
            // Re-fetch request items to be safe or use global
            const reqResponse = await fetch(`/wp-json/api/v1/requests/${REQUEST_ID}`);
            const reqData = await reqResponse.json();
            payload.items = reqData.data.items.map(i => ({
                request_item_id: i.id,
                amount: i.amount
            }));

            const response = await fetch('/wp-json/api/v1/finance/payment-vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await response.json();
            if (res.success) {
                alert('Voucher Created!');
                location.reload();
            } else {
                alert('Error: ' + res.message);
            }
        } catch (e) {
            alert('Error creating voucher');
        }
    });

    async function markAsPaid() {
        if (!currentVoucherId) return;
        if (!confirm('Confirm payment made?')) return;

        try {
            const response = await fetch(`/wp-json/api/v1/finance/payment-vouchers/${currentVoucherId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_date: new Date().toISOString().split('T')[0] })
            });
            if (response.ok) location.reload();
        } catch (e) { alert('Error'); }
    }

    function downloadPV() {
        alert('PDF Download feature pending integration');
    }
</script>