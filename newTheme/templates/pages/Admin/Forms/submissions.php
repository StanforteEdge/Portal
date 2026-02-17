<?php

/**
 * Template Name: Admin: Forms - All Submissions
 * Description: View and manage all form submissions
 */

$pageTitle = 'Form Submissions';
$breadcrumb = [
    ['name' => 'Admin', 'url' => home_url('/admin')],
    ['name' => 'Forms', 'url' => home_url('/admin/forms')],
    ['name' => 'Submissions']
];
$activeMenu = 'admin-forms';

get_header();
?>

<div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-12 gap-6">
        <div class="intro-y col-span-12 flex items-center justify-between h-10">
            <h2 class="text-lg font-medium truncate mr-5">Form Submissions</h2>
            <a href="<?php echo home_url('/admin/forms'); ?>" class="btn btn-secondary">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
                Back to Forms
            </a>
        </div>

        <!-- Filters -->
        <div class="col-span-12 intro-y">
            <div class="box p-5">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="form-label">Form</label>
                        <select id="filter-form" class="form-control">
                            <option value="">All Forms</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Status</label>
                        <select id="filter-status" class="form-control">
                            <option value="">All Status</option>
                            <option value="submitted">Submitted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Date From</label>
                        <input type="date" id="filter-date-from" class="form-control">
                    </div>
                    <div>
                        <label class="form-label">Date To</label>
                        <input type="date" id="filter-date-to" class="form-control">
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <button id="btn-apply-filters" class="btn btn-primary">
                        <i data-lucide="filter" class="w-4 h-4 mr-2"></i>
                        Apply Filters
                    </button>
                    <button id="btn-reset-filters" class="btn btn-secondary">
                        <i data-lucide="x" class="w-4 h-4 mr-2"></i>
                        Reset
                    </button>
                    <button id="btn-export" class="btn btn-success ml-auto">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                        Export CSV
                    </button>
                </div>
            </div>

            <!-- Submissions Table -->
            <div class="col-span-12 intro-y mt-5">
                <div class="intro-y flex items-center h-10">
                    <h2 class="text-lg font-medium truncate mr-5">All Submissions</h2>
                </div>
                <div class="intro-y overflow-auto lg:overflow-visible mt-8 sm:mt-0">
                    <table class="table table-report -mt-2">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">SUBMISSION #</th>
                                <th class="whitespace-nowrap">FORM</th>
                                <th class="whitespace-nowrap">SUBMITTED BY</th>
                                <th class="text-center whitespace-nowrap">STATUS</th>
                                <th class="text-center whitespace-nowrap">SUBMITTED AT</th>
                                <th class="text-center whitespace-nowrap">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="submissions-table-body">
                            <tr class="intro-x">
                                <td colspan="6" class="text-center py-8 text-slate-500">
                                    <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                                    <p>Loading submissions...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-3">
                    <nav class="w-full sm:w-auto sm:mr-auto">
                        <div class="text-sm text-slate-500">
                            Showing <span id="showing-from">0</span> to <span id="showing-to">0</span> of <span
                                id="total-submissions">0</span> submissions
                        </div>
                    </nav>
                    <ul id="pagination" class="pagination"></ul>
                </div>
            </div>
        </div>
    </div>

    <!-- View Submission Modal -->
    <div id="submission-modal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-xl font-bold">Submission Details</h3>
                <button id="btn-close-modal" class="text-gray-600 hover:text-gray-900">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div id="submission-content" class="p-6"></div>
        </div>
    </div>

    <script>
        jQuery(document).ready(function($) {
            const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';
            let currentPage = 1;

            // Load forms for filter
            function loadFormsList() {
                $.ajax({
                    url: '/wp-json/api/v1/forms',
                    headers: {
                        'X-WP-Nonce': nonce
                    },
                    success: function(response) {
                        if (response.success && response.data) {
                            let options = '<option value="">All Forms</option>';
                            response.data.forEach(form => {
                                options += `<option value="${form.id}">${form.name}</option>`;
                            });
                            $('#filter-form').html(options);
                        }
                    }
                });
            }

            // Load submissions
            function loadSubmissions(page = 1) {
                const filters = {
                    form_id: $('#filter-form').val(),
                    status: $('#filter-status').val(),
                    date_from: $('#filter-date-from').val(),
                    date_to: $('#filter-date-to').val(),
                    page: page,
                    per_page: 20
                };

                $.ajax({
                    url: '/wp-json/api/v1/forms/submissions',
                    headers: {
                        'X-WP-Nonce': nonce
                    },
                    data: filters,
                    success: function(response) {
                        if (response.success) {
                            renderSubmissionsTable(response.data.submissions);
                            updatePagination(response.data.pagination);
                        }
                    },
                    error: function() {
                        $('#submissions-table-body').html('<tr><td colspan="6" class="text-center py-4 text-red-600">Failed to load submissions</td></tr>');
                    }
                });
            }

            function renderSubmissionsTable(submissions) {
                if (!submissions.length) {
                    $('#submissions-table-body').html('<tr><td colspan="6" class="text-center py-8 text-gray-500">No submissions found</td></tr>');
                    return;
                }

                let html = '';
                submissions.forEach(sub => {
                    const statusColors = {
                        'submitted': 'text-primary',
                        'in_progress': 'text-warning',
                        'resolved': 'text-success'
                    };

                    html += `
                <tr class="intro-x">
                    <td><a href="javascript:;" class="font-medium whitespace-nowrap">#${sub.submission_number || sub.id.substr(0, 8)}</a></td>
                    <td>${sub.form_name}</td>
                    <td>${sub.submitted_by_name || 'Unknown'}</td>
                    <td class="text-center"><span class="${statusColors[sub.status] || 'text-slate-500'}">${sub.status}</span></td>
                    <td class="text-center">${new Date(sub.submitted_at).toLocaleString()}</td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a href="javascript:;" class="flex items-center mr-3 btn-view-submission" data-id="${sub.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> View
                            </a>
                            <a href="javascript:;" class="flex items-center text-danger btn-delete-submission" data-id="${sub.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `;
                });

                $('#submissions-table-body').html(html);
                lucide.createIcons();
            }

            function updatePagination(pagination) {
                $('#total-submissions').text(pagination.total);
                $('#showing-from').text(pagination.from);
                $('#showing-to').text(pagination.to);

                let paginationHtml = '';
                for (let i = 1; i <= pagination.last_page; i++) {
                    const active = i === pagination.current_page ? 'btn-primary' : 'btn-secondary';
                    paginationHtml += `<button class="btn btn-sm ${active} btn-page" data-page="${i}">${i}</button>`;
                }
                $('#pagination').html(paginationHtml);
            }

            // Event listeners
            $('#btn-apply-filters').on('click', () => loadSubmissions(1));
            $('#btn-reset-filters').on('click', function() {
                $('#filter-form, #filter-status, #filter-date-from, #filter-date-to').val('');
                loadSubmissions(1);
            });

            $(document).on('click', '.btn-page', function() {
                loadSubmissions($(this).data('page'));
            });

            $(document).on('click', '.btn-view-submission', function() {
                const submissionId = $(this).data('id');
                // Load and show submission details
                $('#submission-modal').removeClass('hidden');
                $('#submission-content').html('<p class="text-center"><i data-lucide="loader" class="w-8 h-8 mx-auto animate-spin"></i></p>');
                lucide.createIcons();

                $.ajax({
                    url: `/wp-json/api/v1/forms/submissions/${submissionId}`,
                    headers: {
                        'X-WP-Nonce': nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            let html = '<div class="space-y-4">';
                            response.data.answers.forEach(answer => {
                                html += `
                            <div class="border-b pb-3">
                                <label class="font-medium text-gray-700">${answer.field_label}</label>
                                <div class="text-gray-900 mt-1">${answer.answer_value || '-'}</div>
                            </div>
                        `;
                            });
                            html += '</div>';
                            $('#submission-content').html(html);
                        }
                    }
                });
            });

            $('#btn-close-modal').on('click', () => $('#submission-modal').addClass('hidden'));

            $(document).on('click', '.btn-delete-submission', function() {
                const submissionId = $(this).data('id');
                if (confirm('Are you sure you want to delete this submission?')) {
                    $.ajax({
                        url: `/wp-json/api/v1/forms/submissions/${submissionId}`,
                        method: 'DELETE',
                        headers: {
                            'X-WP-Nonce': nonce
                        },
                        success: () => loadSubmissions(currentPage)
                    });
                }
            });

            $('#btn-export').on('click', function() {
                window.location.href = '/wp-json/api/v1/forms/submissions/export?' + $.param({
                    form_id: $('#filter-form').val(),
                    status: $('#filter-status').val(),
                    date_from: $('#filter-date-from').val(),
                    date_to: $('#filter-date-to').val()
                });
            });

            // Initial load
            loadFormsList();
            loadSubmissions(1);
            lucide.createIcons();
        });
    </script>

    <?php get_footer(); ?>