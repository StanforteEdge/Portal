<?php
/**
 * Template Name: Forms: My Submissions
 * Description: View my form submissions
 */

$pageTitle = 'My Submissions';
$breadcrumb = [
    ['name' => 'Forms', 'url' => home_url('/forms/available')],
    ['name' => 'My Submissions']
];
$activeMenu = 'forms-submissions';

get_header();
\App\Helpers\PageHelper::checkPageAccess('auth.authenticated');
?>

<div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-12 gap-6">
        <!-- Page Header -->
        <div class="intro-y col-span-12 flex items-center justify-between h-10">
            <h2 class="text-lg font-medium truncate mr-5">My Submissions</h2>
            <a href="<?php echo home_url('/forms/available'); ?>" class="btn btn-primary">
                <i data-lucide="file-plus" class="w-4 h-4 mr-2"></i>
                Submit New Form
        </div>

        <!-- Submissions List -->
        <div class="col-span-12 intro-y mt-5">
            <div class="intro-y overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">SUBMISSION #</th>
                            <th class="whitespace-nowrap">FORM</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">SUBMITTED</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="submissions-table-body">
                        <!-- Populated via JS -->
                    </tbody>
                </table>
                <div id="loading-state" class="p-8 text-center text-slate-500">
                    <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                    <p>Loading submissions...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        const API = {
            mySubmissions: '/wp-json/api/v1/submissions/my',
            getSubmission: (id) => `/wp-json/api/v1/submissions/${id}`
        };
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        function loadSubmissions() {
            $('#loading-state').show();
            $('#submissions-table-body').empty();

            $.ajax({
                url: API.mySubmissions,
                method: 'GET',
                headers: { 'X-WP-Nonce': nonce },
                success: function (response) {
                    $('#loading-state').hide();
                    if (response.success && response.data) {
                        renderSubmissions(response.data);
                    }
                },
                error: function (xhr) {
                    $('#loading-state').html('<p class="text-red-500">Error loading submissions</p>');
                }
            });
        }

        function renderSubmissions(submissions) {
            if (submissions.length === 0) {
                $('#submissions-table-body').html('<tr class="intro-x"><td colspan="5" class="px-6 py-8 text-center text-slate-500">No submissions yet. <a href="<?php echo home_url('/forms/available'); ?>" class="text-primary">Submit a form</a></td></tr>');
                return;
            }

            let html = '';
            submissions.forEach(submission => {
                const statusBadge = getStatusBadge(submission.status);
                const submittedDate = new Date(submission.submitted_at).toLocaleString();

                html += `
                <tr class="intro-x">
                    <td>
                        <a href="javascript:;" class="font-medium whitespace-nowrap">${submission.submission_number}</a>
                    </td>
                    <td>
                        <div class="font-medium">${submission.form_name || 'Form'}</div>
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-center">
                        <div class="text-slate-500 text-xs">${submittedDate}</div>
                    </td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a href="javascript:;" class="flex items-center text-primary" data-action="view-submission" data-id="${submission.id}">
                                <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                            </a>
                        </div>
                    </td>
                </tr>
            `;
            });

            $('#submissions-table-body').html(html);

            // Bind view buttons
            $('[data-action="view-submission"]').on('click', function () {
                const submissionId = $(this).data('id');
                viewSubmission(submissionId);
            });

            lucide.createIcons();
        }

        function getStatusBadge(status) {
            const badges = {
                'submitted': '<span class="badge badge-info">Submitted</span>',
                'open': '<span class="badge badge-warning">Open</span>',
                'in_progress': '<span class="badge badge-primary">In Progress</span>',
                'resolved': '<span class="badge badge-success">Resolved</span>',
                'closed': '<span class="badge badge-secondary">Closed</span>'
            };
            return badges[status] || `<span class="badge badge-secondary">${status}</span>`;
        }

        function viewSubmission(submissionId) {
            // TODO: Open modal or redirect to detail page
            window.location.href = `<?php echo home_url('/forms/submission-detail?id='); ?>${submissionId}`;
        }

        // Initialize
        $(document).ready(function () {
            loadSubmissions();
        });

    })(jQuery);
</script>

<?php get_footer(); ?>