<?php
/**
 * Template Name: Forms - Available Forms
 * Description: List of available forms for users to submit
 */

$pageTitle = 'Available Forms';
$breadcrumb = [
    ['name' => 'Forms']
];
$activeMenu = 'forms';

get_header();
\App\Helpers\PageHelper::checkPageAccess('auth.authenticated');
?>

<div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-12 gap-6">
        <div class="intro-y col-span-12 flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">Available Forms</h2>
        </div>

        <!-- Forms Grid -->
        <div id="forms-grid" class="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="intro-y col-span-full flex items-center justify-center py-12">
                <i data-lucide="loader" class="w-8 h-8 animate-spin text-slate-400"></i>
            </div>
        </div>
    </div>
</div>

<script>
    jQuery(document).ready(function ($) {
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        function loadAvailableForms() {
            $.ajax({
                url: '/wp-json/api/v1/forms/available',
                headers: { 'X-WP-Nonce': nonce },
                success: function (response) {
                    if (response.success && response.data) {
                        renderFormsGrid(response.data);
                    }
                },
                error: function () {
                    $('#forms-grid').html('<div class="intro-y col-span-full text-center py-12 text-danger">Failed to load forms</div>');
                }
            });
        }

        function renderFormsGrid(forms) {
            if (!forms.length) {
                $('#forms-grid').html('<div class="intro-y col-span-full text-center py-12 text-slate-500">No forms available at the moment</div>');
                return;
            }

            let html = '';
            forms.forEach(form => {
                const icon = getFormIcon(form.module || 'general');
                const badge = form.module ? `<span class="badge badge-primary">${form.module}</span>` : '';

                html += `
                <div class="intro-y">
                    <div class="box p-5 zoom-in">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center">
                                <div class="w-12 h-12 flex-none rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                    <i data-lucide="${icon}" class="w-6 h-6 text-primary"></i>
                                </div>
                                <div class="ml-3">
                                    ${badge}
                                </div>
                            </div>
                        </div>
                        <div class="font-medium text-base mt-3">${form.name}</div>
                        ${form.description ? `<div class="text-slate-500 text-sm mt-2">${form.description}</div>` : ''}
                        <div class="flex items-center justify-between mt-5 pt-5 border-t border-slate-200">
                            <div class="text-xs text-slate-500">
                                <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                                ${form.field_count || 0} fields
                            </div>
                            <a href="/forms/submit/${form.id}" class="btn btn-primary btn-sm">
                                Fill Form
                                <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            });

            $('#forms-grid').html(html);
            lucide.createIcons();
        }

        function getFormIcon(module) {
            const icons = {
                'hr': 'users',
                'finance': 'dollar-sign',
                'general': 'file-text',
                'academy': 'book-open'
            };
            return icons[module] || 'file-text';
        }

        loadAvailableForms();
        lucide.createIcons();
    });
</script>

<?php get_footer(); ?>