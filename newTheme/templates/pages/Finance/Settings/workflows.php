<?php
/**
 * Template Name: Finance: Settings - Approval Workflows
 * Description: Manage approval workflows and routing rules
 */

$pageTitle = 'Approval Workflows';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Settings', 'url' => home_url('/finance/settings')],
    ['name' => 'Workflows']
];
$activeMenu = 'finance-settings-workflows';

get_header();
\App\Helpers\PageHelper::checkPageAccess('finance.manage_group');
?>

<div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Approval Workflows</h1>
        <p class="text-gray-500 mt-1">Define approval chains, thresholds, and routing rules</p>
    </div>

    <!-- Coming Soon Notice -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <i data-lucide="construction" class="w-8 h-8 text-yellow-600"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p class="text-gray-600 mb-6 max-w-2xl mx-auto">
            Approval Workflows management will be available in the next phase. You'll be able to create custom approval
            chains,
            set amount thresholds, and define routing rules for different request types.
        </p>
        <a href="<?php echo home_url('/finance/settings'); ?>" class="btn btn-primary">
            <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
            Back to Settings
        </a>
    </div>

    <!-- Feature Preview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <i data-lucide="users" class="w-6 h-6 text-blue-600"></i>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Multi-Level Approvals</h4>
            <p class="text-sm text-gray-600">Create approval chains with multiple levels based on roles and amount
                thresholds</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <i data-lucide="zap" class="w-6 h-6 text-green-600"></i>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Auto-Routing</h4>
            <p class="text-sm text-gray-600">Automatically route requests to the right approvers based on configurable
                rules</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <i data-lucide="repeat" class="w-6 h-6 text-purple-600"></i>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Delegation</h4>
            <p class="text-sm text-gray-600">Allow approvers to delegate their approval authority to others temporarily
            </p>
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