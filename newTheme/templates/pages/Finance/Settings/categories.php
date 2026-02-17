<?php
/**
 * Template Name: Finance: Settings - Budget Categories
 * Description: Manage expense categories and GL codes
 */

$pageTitle = 'Budget Categories';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Settings', 'url' => home_url('/finance/settings')],
    ['name' => 'Categories']
];
$activeMenu = 'finance-settings-categories';

get_header();
\App\Helpers\PageHelper::checkPageAccess('finance.manage_group');
?>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Budget Categories</h1>
        <p class="text-gray-500 mt-1">Manage expense categories, GL codes, and hierarchy</p>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <i data-lucide="construction" class="w-8 h-8 text-yellow-600"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p class="text-gray-600 mb-6 max-w-2xl mx-auto">
            Budget Categories management will be available soon. Create hierarchical expense categories,
            assign GL codes, and configure category-specific rules.
        </p>
        <a href="<?php echo home_url('/finance/settings'); ?>" class="btn btn-primary">
            <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
            Back to Settings
        </a>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        if (window.lucide) window.lucide.createIcons();
    });
</script>

<?php get_footer(); ?>