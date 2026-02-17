<?php
/**
 * Template Name: Finance: Requests
 * Description: Dashboard for Finance Requests management
 */

$pageTitle = 'Finance: Requests';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Requests']
];
$activeMenu = 'finance-requests';

get_header();

$user = wp_get_current_user();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
        <!-- Welcome Section -->
        <div class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Requests Dashboard</h1>
                <p class="text-gray-500 mt-1">Manage and review all financial requests</p>
            </div>
            <div class="flex gap-3">
                <a href="/finance/requests/approvals" class="btn btn-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Pending Approvals
                </a>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <!-- Pending Approvals -->
            <a href="/finance/requests/approvals"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">Pending Approvals</p>
                        <h3 class="text-3xl font-bold text-gray-800 group-hover:text-primary-600 transition-colors"
                            id="count-approvals">-</h3>
                    </div>
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-400 mt-4">Requests awaiting your review</p>
            </a>

            <!-- Approved (Ready for Voucher) -->
            <a href="/finance/requests/pv?status=pending"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">Ready for Voucher</p>
                        <h3 class="text-3xl font-bold text-gray-800 group-hover:text-green-600 transition-colors"
                            id="count-approved">-</h3>
                    </div>
                    <div class="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z">
                            </path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-400 mt-4">Approved, waiting for payment voucher</p>
            </a>

            <!-- Rejected/Returned -->
            <div class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">Returned / Rejected</p>
                        <h3 class="text-3xl font-bold text-gray-800" id="count-rejected">-</h3>
                    </div>
                    <div class="p-3 bg-red-50 text-red-600 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-400 mt-4">Requests returned to initiator</p>
            </div>
        </div>

        <!-- Recent Activity Table (Placeholder) -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Recent Requests</h3>
            <div class="text-gray-500 text-sm italic">Recent request list will load here...</div>
        </div>

    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', async function () {
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        // Fetch Counts
        const endpoints = [
            '/wp-json/api/v1/finance/requests/approvals?status=pending&per_page=1',
            '/wp-json/api/v1/finance/requests?status=approved&per_page=1',
            '/wp-json/api/v1/finance/requests?status=rejected&per_page=1' // Assuming this endpoint works
        ];

        const countIds = ['count-approvals', 'count-approved', 'count-rejected'];

        try {
            const responses = await Promise.all(endpoints.map(url => fetch(url, { headers: { 'X-WP-Nonce': nonce } })));

            responses.forEach((res, index) => {
                const count = res.headers.get('X-WP-Total') || 0;
                document.getElementById(countIds[index]).textContent = count;
            });

        } catch (e) {
            console.error('Failed to load request stats', e);
        }
    });
</script>

<?php get_footer(); ?>
