<?php

/**
 * Template Name: Admin: Forms - Dashboard
 * Description: Forms overview, statistics, and management
 */

$pageTitle = 'Forms Management';
$breadcrumb = [
    ['name' => 'Admin', 'url' => home_url('/admin')],
    ['name' => 'Forms']
];
$activeMenu = 'admin-forms';

get_header();
?>

<div class="container mx-auto px-4 py-6">
    <div class="intro-y">
        <div class="intro-y flex items-center justify-between h-10">
            <h2 class="text-lg font-medium truncate mr-5">Forms Management</h2>
            <a href="<?php echo home_url('/admin/forms/builder'); ?>" class="btn btn-primary">
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                Create New Form
            </a>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="file-text" class="report-box__icon text-primary"></i>
                            <div class="ml-auto">
                                <div class="report-box__indicator bg-success tooltip cursor-pointer"
                                    title="Total forms">
                                    <i data-lucide="check-square" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-forms">-</div>
                        <div class="text-base text-slate-500 mt-1">Total Forms</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="check-circle" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-active-forms">-</div>
                        <div class="text-base text-slate-500 mt-1">Active Forms</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="send" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-submissions">-</div>
                        <div class="text-base text-slate-500 mt-1">Total Submissions</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="calendar" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-month-submissions">-</div>
                        <div class="text-base text-slate-500 mt-1">This Month</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Forms Table -->
        <div class="col-span-12 mt-6">
            <div class="intro-y block sm:flex items-center h-10">
                <h2 class="text-lg font-medium truncate mr-5">All Forms</h2>
                <div class="flex items-center sm:ml-auto mt-3 sm:mt-0">
                    <input type="text" id="search-forms" class="form-control w-56 box mr-2"
                        placeholder="Search forms...">
                    <select id="filter-status" class="form-control w-40 box">
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>
            <div class="intro-y overflow-auto lg:overflow-visible mt-8 sm:mt-0">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">FORM NAME</th>
                            <th class="whitespace-nowrap">MODULE</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">SUBMISSIONS</th>
                            <th class="text-center whitespace-nowrap">CREATED</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="forms-table-body">
                        <tr class="intro-x">
                            <td colspan="6" class="text-center py-8 text-slate-500">
                                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                                <p>Loading forms...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
    jQuery(document).ready(function($) {
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        // Load stats
        function loadStats() {
            $.ajax({
                url: '/wp-json/api/v1/forms/stats',
                headers: {
                    'X-WP-Nonce': nonce
                },
                success: function(response) {
                    if (response.success) {
                        $('#stat-total-forms').text(response.data.total_forms || 0);
                        $('#stat-active-forms').text(response.data.active_forms || 0);
                        $('#stat-total-submissions').text(response.data.total_submissions || 0);
                        $('#stat-month-submissions').text(response.data.month_submissions || 0);
                    }
                }
            });
        }

        // Load forms list
        function loadForms() {
            const search = $('#search-forms').val();
            const status = $('#filter-status').val();

            $.ajax({
                url: '/wp-json/api/v1/forms',
                headers: {
                    'X-WP-Nonce': nonce
                },
                data: {
                    search,
                    is_active: status
                },
                success: function(response) {
                    if (response.success && response.data) {
                        renderFormsTable(response.data);
                    }
                },
                error: function() {
                    $('#forms-table-body').html('<tr><td colspan="6" class="text-center py-4 text-red-600">Failed to load forms</td></tr>');
                }
            });
        }

        function renderFormsTable(forms) {
            if (!forms.length) {
                $('#forms-table-body').html('<tr><td colspan="6" class="text-center py-8 text-gray-500">No forms found</td></tr>');
                return;
            }

            let html = '';
            forms.forEach(form => {
                const statusBadge = form.is_active ?
                    '<div class="flex items-center justify-center text-success"> <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Active </div>' :
                    '<div class="flex items-center justify-center text-danger"> <i data-lucide="x-square" class="w-4 h-4 mr-2"></i> Inactive </div>';

                html += `
                <tr class="intro-x">
                    <td>
                        <a href="/admin/forms/builder?id=${form.id}" class="font-medium whitespace-nowrap">${form.name}</a>
                        ${form.description ? `<div class="text-slate-500 text-xs whitespace-nowrap mt-0.5">${form.description}</div>` : ''}
                    </td>
                    <td><span class="badge badge-primary">${form.module || 'general'}</span></td>
                    <td class="w-40">${statusBadge}</td>
                    <td class="text-center">${form.submission_count || 0}</td>
                    <td class="text-center">${new Date(form.created_at).toLocaleDateString()}</td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a href="/admin/forms/builder?id=${form.id}" class="flex items-center mr-3" title="Edit">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a href="/forms/submit/${form.id}" class="flex items-center mr-3 text-primary" title="Preview" target="_blank">
                                <i data-lucide="eye" class="w-4 h-4 mr-1"></i> Preview
                            </a>
                            <a href="javascript:;" class="flex items-center text-danger btn-delete-form" data-id="${form.id}" title="Delete">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `;
            });

            $('#forms-table-body').html(html);
            lucide.createIcons();
        }

        // Event listeners
        $('#search-forms, #filter-status').on('change keyup', _.debounce(loadForms, 300));

        $('#forms-table-body').on('click', '.btn-delete-form', function() {
            const formId = $(this).data('id');
            if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
                $.ajax({
                    url: `/wp-json/api/v1/forms/${formId}`,
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': nonce
                    },
                    success: function() {
                        loadForms();
                        loadStats();
                    }
                });
            }
        });

        // Initial load
        loadStats();
        loadForms();
        lucide.createIcons();
    });
</script>

<?php get_footer(); ?>