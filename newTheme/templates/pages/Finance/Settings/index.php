<?php
/**
 * Template Name: Finance: Settings
 * Description: Central finance settings management dashboard
 */

$pageTitle = 'Finance Settings';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Settings']
];
$activeMenu = 'finance-settings';

get_header();
\App\Helpers\PageHelper::checkPageAccess('finance.manage_group');
?>

<div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Finance Settings</h1>
        <p class="text-gray-500 mt-1">Configure finance module settings and workflows</p>
    </div>

    <!-- Settings Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <!-- Request Types -->
        <a href="<?php echo home_url('/finance/settings/request-types'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-blue-100 rounded-lg">
                        <i data-lucide="file-text" class="w-6 h-6 text-blue-600"></i>
                    </div>
                    <span class="text-xs text-gray-500">Active</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Request Types</h3>
                <p class="text-sm text-gray-600 mb-4">Manage request categories, custom forms, and templates</p>
                <div class="flex items-center text-sm text-blue-600">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

        <!-- Approval Workflows -->
        <a href="<?php echo home_url('/finance/settings/workflows'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-green-100 rounded-lg">
                        <i data-lucide="git-branch" class="w-6 h-6 text-green-600"></i>
                    </div>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Approval Workflows</h3>
                <p class="text-sm text-gray-600 mb-4">Define approval chains, thresholds, and routing rules</p>
                <div class="flex items-center text-sm text-gray-400">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

        <!-- Budget Categories -->
        <a href="<?php echo home_url('/finance/settings/categories'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-purple-100 rounded-lg">
                        <i data-lucide="folder-tree" class="w-6 h-6 text-purple-600"></i>
                    </div>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Budget Categories</h3>
                <p class="text-sm text-gray-600 mb-4">Manage expense categories, GL codes, and hierarchy</p>
                <div class="flex items-center text-sm text-gray-400">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

        <!-- Payment Methods -->
        <a href="<?php echo home_url('/finance/settings/payment-methods'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-orange-100 rounded-lg">
                        <i data-lucide="credit-card" class="w-6 h-6 text-orange-600"></i>
                    </div>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Payment Methods</h3>
                <p class="text-sm text-gray-600 mb-4">Configure payment channels, bank accounts, and limits</p>
                <div class="flex items-center text-sm text-gray-400">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

        <!-- Compliance & Policies -->
        <a href="<?php echo home_url('/finance/settings/compliance'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-red-100 rounded-lg">
                        <i data-lucide="shield-check" class="w-6 h-4 text-red-600"></i>
                    </div>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Compliance & Policies</h3>
                <p class="text-sm text-gray-600 mb-4">Set receipt requirements, retention policies, and audit rules</p>
                <div class="flex items-center text-sm text-gray-400">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

        <!-- Integrations -->
        <a href="<?php echo home_url('/finance/settings/integrations'); ?>" class="block">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="p-3 bg-indigo-100 rounded-lg">
                        <i data-lucide="plug" class="w-6 h-6 text-indigo-600"></i>
                    </div>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Integrations</h3>
                <p class="text-sm text-gray-600 mb-4">Connect accounting software, banking APIs, and payment gateways
                </p>
                <div class="flex items-center text-sm text-gray-400">
                    <span>Configure</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                </div>
            </div>
        </a>

    </div>

    <!-- Info Box -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="flex items-start">
            <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5 mr-3"></i>
            <div>
                <h4 class="font-semibold text-blue-900 mb-1">Group-Level Settings</h4>
                <p class="text-sm text-blue-800">
                    These settings apply across all divisions. Division-specific settings will be available in Phase 2
                    of the implementation.
                </p>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });
</script>

<?php get_footer(); ?>