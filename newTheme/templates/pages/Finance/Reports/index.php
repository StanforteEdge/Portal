<?php
/**
 * Template Name: Finance: Reports
 * Description: Financial Reports Dashboard
 */

$pageTitle = 'Finance Reports';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Reports']
];
$activeMenu = 'finance-reports';

get_header();
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">

        <h1 class="text-3xl font-bold mb-2 text-gray-800">Financial Reports</h1>
        <p class="text-gray-500 mb-8">Generate and view financial statements and spending summaries</p>

        <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-12 text-center">
            <div class="mb-4 text-indigo-200">
                <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                    </path>
                </svg>
            </div>
            <h2 class="text-2xl font-bold text-indigo-900 mb-2">Reports Module Coming Soon</h2>
            <p class="text-indigo-700 max-w-md mx-auto">Advanced reporting features including Expenditure analysis,
                Departmental spending, and Vendor histories are relevant for Phase 2.</p>
        </div>

        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 grayscale cursor-not-allowed">
            <div class="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h3 class="font-bold text-gray-800 mb-2">Expenditure Report</h3>
                <p class="text-sm text-gray-500">Monthly breakdown of approved expenses.</p>
            </div>
            <div class="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h3 class="font-bold text-gray-800 mb-2">Departmental Spending</h3>
                <p class="text-sm text-gray-500">Analysis of spending by request group/team.</p>
            </div>
            <div class="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h3 class="font-bold text-gray-800 mb-2">Vendor/Payee History</h3>
                <p class="text-sm text-gray-500">Track payments made to specific beneficiaries.</p>
            </div>
        </div>

    </div>
</div>

<?php get_footer(); ?>