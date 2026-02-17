<div id="retirement-container">

    <!-- Status Banner -->
    <div id="retirement-status-banner" class="hidden mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h3 class="text-lg font-medium text-blue-800" id="retirement-status-text">Pending Verification</h3>
    </div>

    <!-- Retirement Form -->
    <div id="retirement-form">
        <h3 class="text-xl font-semibold mb-4">Submit Retirement</h3>

        <form id="submitRetirementForm" class="space-y-6">

            <div class="bg-gray-50 p-4 rounded border">
                <h4 class="font-medium mb-3">Receipts</h4>
                <div id="receipts-list" class="space-y-3">
                    <!-- Dynamic receipt rows -->
                </div>
                <button type="button" onclick="addReceiptRow()"
                    class="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800">
                    + Add Another Receipt
                </button>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div>
                    <label class="form-label">Total Receipts</label>
                    <input type="number" id="ret_total" class="form-control" readonly value="0">
                </div>
                <div>
                    <label class="form-label">Balance Returned (if any)</label>
                    <input type="number" id="ret_balance" class="form-control" value="0">
                </div>
            </div>

            <div>
                <label class="form-label">Notes</label>
                <textarea id="ret_notes" class="form-control" rows="3"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Submit Retirement</button>
        </form>
    </div>
</div>

<script>
    let receiptCount = 0;

    window.addEventListener('requestLoaded', function (e) {
        const req = e.detail;
        loadRetirement(req.id);

        // Add one empty row initially
        addReceiptRow();
    });

    async function loadRetirement(requestId) {
        try {
            const response = await fetch(`/wp-json/api/v1/finance/requests/${requestId}/retirement`);
            const data = await response.json();

            if (data.success && data.data) {
                // Already submitted
                const ret = data.data;
                document.getElementById('retirement-form').classList.add('hidden');
                document.getElementById('retirement-status-banner').classList.remove('hidden');
                document.getElementById('retirement-status-text').textContent = 'Retirement Status: ' + ret.status;

                // Show details (could expand this view later)
            }
        } catch (e) {
            console.error(e);
        }
    }

    function addReceiptRow() {
        receiptCount++;
        const html = `
            <div class="receipt-row grid grid-cols-12 gap-3 items-end bg-white p-3 rounded shadow-sm">
                <div class="col-span-5">
                    <label class="text-xs text-gray-500">Description</label>
                    <input type="text" class="form-control receipt-desc" placeholder="Item name" required>
                </div>
                <div class="col-span-3">
                    <label class="text-xs text-gray-500">Amount</label>
                    <input type="number" class="form-control receipt-amount" oninput="calcRetirementTotal()" placeholder="0.00" required>
                </div>
                <div class="col-span-3">
                    <label class="text-xs text-gray-500">File ID (Temp)</label>
                    <input type="text" class="form-control receipt-file" placeholder="File ID">
                </div>
                <div class="col-span-1 text-right">
                    <button type="button" onclick="this.closest('.receipt-row').remove(); calcRetirementTotal()" class="text-red-500 hover:text-red-700">
                        &times;
                    </button>
                </div>
            </div>
        `;
        document.getElementById('receipts-list').insertAdjacentHTML('beforeend', html);
    }

    function calcRetirementTotal() {
        let total = 0;
        document.querySelectorAll('.receipt-amount').forEach(inp => {
            total += parseFloat(inp.value) || 0;
        });
        document.getElementById('ret_total').value = total;
    }

    document.getElementById('submitRetirementForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const receipts = [];
        document.querySelectorAll('.receipt-row').forEach(row => {
            receipts.push({
                description: row.querySelector('.receipt-desc').value,
                amount: row.querySelector('.receipt-amount').value,
                file_id: row.querySelector('.receipt-file').value || 'temp-file-id' // Mock file ID for now
            });
        });

        const payload = {
            request_id: REQUEST_ID,
            balance_returned: document.getElementById('ret_balance').value,
            notes: document.getElementById('ret_notes').value,
            receipts: receipts
        };

        try {
            const response = await fetch('/wp-json/api/v1/finance/retirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await response.json();
            if (res.success) {
                alert('Retirement Submitted!');
                location.reload();
            } else {
                alert('Error: ' + res.message);
            }
        } catch (e) {
            alert('Error submitting retirement');
        }
    });
</script>