<?php
/**
 * Template Name: Request Detail
 * Description: Detailed view of a request with Finance integration
 */

get_header();

// Get Request ID from URL parameter
$request_id = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <!-- Header / Summary -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Request <span id="request-ref">#Loading...</span>
                    </h1>
                    <div class="flex gap-3 text-sm text-gray-600">
                        <span id="request-type" class="bg-gray-100 px-2 py-1 rounded">Type</span>
                        <span id="request-date">Date</span>
                    </div>
                </div>
                <div class="text-right">
                    <div id="request-status"
                        class="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700">
                        Loading...
                    </div>
                    <div class="mt-2 text-2xl font-bold text-gray-900" id="request-amount">₦0.00</div>
                </div>
            </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="mb-6 border-b border-gray-200">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button onclick="switchTab('details')" id="tab-details"
                    class="tab-btn border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Request Details
                </button>
                <button onclick="switchTab('payment-voucher')" id="tab-payment-voucher"
                    class="tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Payment Voucher
                </button>
                <button onclick="switchTab('retirement')" id="tab-retirement"
                    class="tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Retirement
                </button>
            </nav>
        </div>

        <!-- Tab Contents -->
        <div class="bg-white rounded-lg shadow-lg p-6 min-h-[400px]">

            <!-- Details Tab -->
            <div id="content-details" class="tab-content">
                <h2 class="text-xl font-semibold mb-4">Description</h2>
                <p id="request-purpose" class="text-gray-700 mb-6">Loading...</p>

                <h2 class="text-xl font-semibold mb-4">Line Items</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description</th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount</th>
                            </tr>
                        </thead>
                        <tbody id="request-items-body" class="bg-white divide-y divide-gray-200">
                            <!-- Items populated via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Payment Voucher Tab -->
            <div id="content-payment-voucher" class="tab-content hidden">
                <?php include get_template_directory() . '/templates/partials/payment-voucher-tab.php'; ?>
            </div>

            <!-- Retirement Tab -->
            <div id="content-retirement" class="tab-content hidden">
                <?php include get_template_directory() . '/templates/partials/retirement-tab.php'; ?>
            </div>

        </div>
    </div>
</div>

<script>
    const REQUEST_ID = '<?php echo $request_id; ?>';

    function switchTab(tabName) {
        // Update Buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.id === 'tab-' + tabName) {
                btn.classList.add('border-indigo-500', 'text-indigo-600');
                btn.classList.remove('border-transparent', 'text-gray-500');
            } else {
                btn.classList.remove('border-indigo-500', 'text-indigo-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            }
        });

        // Update Content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === 'content-' + tabName) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    }

    async function loadRequestDetails() {
        if (!REQUEST_ID) return;

        try {
            // Mock API call - replace with actual endpoint
            const response = await fetch(`/wp-json/api/v1/requests/${REQUEST_ID}`);
            if (!response.ok) throw new Error('Failed to load request');
            const data = await response.json();

            if (data.success) {
                const req = data.data;
                document.getElementById('request-ref').textContent = '#' + req.request_number;
                document.getElementById('request-type').textContent = req.type;
                document.getElementById('request-date').textContent = new Date(req.created_at).toLocaleDateString();
                document.getElementById('request-status').textContent = req.status;
                document.getElementById('request-amount').textContent = '₦' + parseFloat(req.total_amount).toLocaleString();
                document.getElementById('request-purpose').textContent = req.purpose;

                // Populate Items
                const tbody = document.getElementById('request-items-body');
                tbody.innerHTML = req.items.map(item => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.description}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦${parseFloat(item.amount).toLocaleString()}</td>
                    </tr>
                `).join('');

                // Trigger events for child tabs to load their data if needed
                window.dispatchEvent(new CustomEvent('requestLoaded', { detail: req }));
            }
        } catch (e) {
            console.error(e);
            alert('Error loading request details');
        }
    }

    document.addEventListener('DOMContentLoaded', loadRequestDetails);
</script>

<?php get_footer(); ?>