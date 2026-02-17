<?php /* Template Name: Admin Time Off Requests */ ?>

<?php
get_header();
$b_link = '/attendance/admin/requests';
$b_title = 'Time Off Requests';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <!-- BEGIN: Top Bar -->
    <div class="top-bar">
        <nav aria-label="breadcrumb" class="-intro-x mr-auto hidden sm:flex">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">Attendance</a></li>
                <li class="breadcrumb-item"><a href="attendance-admin.php">Admin</a></li>
                <li class="breadcrumb-item active" aria-current="page">Time Off Requests</li>
            </ol>
        </nav>
    </div>
    <!-- END: Top Bar -->

    <!-- BEGIN: Filters -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5">
            <div class="mr-4">
                <label class="form-label">Status</label>
                <select class="form-select">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
            <div class="mr-4">
                <label class="form-label">Department</label>
                <select class="form-select">
                    <option value="all">All Departments</option>
                    <option value="tech">Technology</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                </select>
            </div>
            <div class="mr-4">
                <label class="form-label">Date Range</label>
                <input type="text" class="datepicker form-control" data-single-mode="false">
            </div>
            <div class="mt-2 sm:mt-0">
                <button class="btn btn-primary">Filter</button>
                <button class="btn btn-outline-secondary ml-2">Reset</button>
            </div>
        </div>
    </div>
    <!-- END: Filters -->

    <!-- BEGIN: Request List -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Time Off Requests</h2>
            <div class="w-full sm:w-auto flex">
                <button class="btn btn-outline-secondary">
                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export
                </button>
            </div>
        </div>
        <div class="p-5">
            <table class="table table-report">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Employee</th>
                        <th class="whitespace-nowrap">Department</th>
                        <th class="whitespace-nowrap">Request Type</th>
                        <th class="whitespace-nowrap">Date Range</th>
                        <th class="whitespace-nowrap">Days</th>
                        <th class="whitespace-nowrap">Status</th>
                        <th class="whitespace-nowrap">Submitted</th>
                        <th class="whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="intro-x">
                        <td class="w-40">
                            <div class="flex">
                                <div class="w-10 h-10 image-fit zoom-in">
                                    <img class="rounded-full" src="dist/images/profile-15.jpg">
                                </div>
                                <div class="ml-4">
                                    <div class="font-medium">John Doe</div>
                                    <div class="text-slate-500 text-xs">Software Engineer</div>
                                </div>
                            </div>
                        </td>
                        <td>Technology</td>
                        <td>Annual Leave</td>
                        <td>Feb 15 - Feb 17, 2025</td>
                        <td>3</td>
                        <td><span class="text-warning">Pending</span></td>
                        <td>Feb 5, 2025</td>
                        <td class="table-report__action">
                            <div class="flex justify-center items-center">
                                <a href="javascript:;" class="flex items-center mr-3 text-success" data-tw-toggle="modal" data-tw-target="#approve-modal">
                                    <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Approve
                                </a>
                                <a href="javascript:;" class="flex items-center text-danger" data-tw-toggle="modal" data-tw-target="#reject-modal">
                                    <i data-lucide="x-square" class="w-4 h-4 mr-1"></i> Reject
                                </a>
                            </div>
                        </td>
                    </tr>
                    <!-- More request entries -->
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Request List -->
</div>

<!-- BEGIN: Approve Modal -->
<div id="approve-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Approve Time Off Request</h2>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Comments (Optional)</label>
                    <textarea class="form-control" rows="3"></textarea>
                </div>
                <div class="alert alert-info show">
                    This will automatically update the employee's leave balance.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-success w-20">Approve</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Approve Modal -->

<!-- BEGIN: Reject Modal -->
<div id="reject-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Reject Time Off Request</h2>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Reason for Rejection <span class="text-danger">*</span></label>
                    <textarea class="form-control" rows="3" required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-danger w-20">Reject</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Reject Modal -->

<?php get_footer(); ?>
