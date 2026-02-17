<?php
/**
 * Template Name: Finance
 * Description: Main dashboard for Finance module overview
 */

$pageTitle = 'Finance';
$breadcrumb = [
    ['name' => 'Home', 'url' => home_url('/')],
    ['name' => 'Finance']
];
$activeMenu = 'finance';
$requiredRoles = ['finance.view'];

get_header();


$user = wp_get_current_user();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
        <!-- Welcome Section -->
        <div class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Finance Overview</h1>
                <p class="text-gray-500 mt-1">Welcome back,
                    <?php echo esc_html($user->display_name); ?>
                </p>
            </div>
            <div class="flex gap-3">
                <a href="/requests/create" class="btn btn-secondary-soft flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    New Request
                </a>
            </div>
        </div>

        <!-- Modules Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <!-- Requests Module -->
            <a href="/finance/requests"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg class="w-20 h-20 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                        </path>
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-lg w-fit mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                            </path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Requests</h3>
                    <p class="text-sm text-gray-500 mb-4">Approvals & Status</p>
                    <div class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        <span id="count-approvals">-</span> Pending Actions
                    </div>
                </div>
            </a>

            <!-- Vouchers Module -->
            <a href="/finance/requests/pv"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg class="w-20 h-20 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z">
                        </path>
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="p-3 bg-amber-50 text-amber-600 rounded-lg w-fit mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                            </path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Vouchers</h3>
                    <p class="text-sm text-gray-500 mb-4">Payments & Logs</p>
                    <div class="text-xs font-semibold uppercase tracking-wider text-amber-600">
                        <span id="count-vouchers">-</span> To Generate
                    </div>
                </div>
            </a>

            <!-- Retirements Module -->
            <a href="/finance/requests/retirement"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg class="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4">
                        </path>
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="p-3 bg-green-50 text-green-600 rounded-lg w-fit mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Retirements</h3>
                    <p class="text-sm text-gray-500 mb-4">Expense Proofs</p>
                    <div class="text-xs font-semibold uppercase tracking-wider text-green-600">
                        <span id="count-retirements">-</span> Pending Review
                    </div>
                </div>
            </a>

            <!-- Reports Module -->
            <a href="/finance/reports"
                class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg class="w-20 h-20 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                        </path>
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="p-3 bg-purple-50 text-purple-600 rounded-lg w-fit mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z">
                            </path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Reports</h3>
                    <p class="text-sm text-gray-500 mb-4">Financial Analysis</p>
                    <div class="text-xs font-semibold uppercase tracking-wider text-purple-600">
                        View Reports
                    </div>
                </div>
            </a>
        </div>

    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', async function () {
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        // Fetch Counts (Only key counts needed for overview)
        const endpoints = [
            '/wp-json/api/v1/finance/requests/approvals?status=pending&per_page=1',
            '/wp-json/api/v1/finance/requests?status=approved&per_page=1',
            '/wp-json/api/v1/finance/requests?status=retirement_pending&per_page=1'
        ];

        const countIds = ['count-approvals', 'count-vouchers', 'count-retirements'];

        try {
            const responses = await Promise.all(endpoints.map(url => fetch(url, { headers: { 'X-WP-Nonce': nonce } })));

            responses.forEach((res, index) => {
                const count = res.headers.get('X-WP-Total') || 0;
                document.getElementById(countIds[index]).textContent = count;
            });

        } catch (e) {
            console.error('Failed to load dashboard stats', e);
        }
    });
</script>

<?php get_footer(); ?>
