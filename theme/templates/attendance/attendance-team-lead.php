<?php /* Template Name: Attendance: Team Lead */ ?>

<?php
get_header();
$p_title = 'Team Attendance';
$b_link = '/attendance';
$b_title = 'Attendance';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">


    <!-- BEGIN: Team Overview -->
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Present Today -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="users" class="report-box__icon text-success"></i>
                        <div class="ml-auto">
                            <div class="report-box__indicator bg-success">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="present-count">--</div>
                    <div class="text-base text-slate-500 mt-1">Team Present</div>
                </div>
            </div>
        </div>
        <!-- Hybrid Today -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="home" class="report-box__icon text-primary"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="hybrid-count">--</div>
                    <div class="text-base text-slate-500 mt-1">Working Hybrid</div>
                </div>
            </div>
        </div>
        <!-- Pending Requests -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="clock" class="report-box__icon text-warning"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="pending-count">--</div>
                    <div class="text-base text-slate-500 mt-1">Pending Requests</div>
                </div>
            </div>
        </div>
        <!-- On Leave -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="calendar" class="report-box__icon text-primary"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="leave-count">--</div>
                    <div class="text-base text-slate-500 mt-1">On Leave</div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Team Overview -->

    <!-- BEGIN: Team Calendar -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Team Schedule</h2>
            <div class="w-full sm:w-auto flex items-center">
                <select id="department-select" class="form-select mr-2">
                    <option value="">All Departments</option>
                    <!-- Departments will be populated dynamically -->
                </select>
                <select id="date-range" class="form-select">
                    <option value="week">This Week</option>
                    <option value="month" selected>This Month</option>
                    <option value="quarter">This Quarter</option>
                </select>
            </div>
        </div>
        <div class="p-5">
            <div id="team-calendar"></div>
        </div>
    </div>
    <!-- END: Team Calendar -->

    <!-- BEGIN: Pending Requests -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Pending Requests</h2>
        </div>
        <div class="p-5">
            <table class="table table-report" id="team-requests-table">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Employee</th>
                        <th class="whitespace-nowrap">Type</th>
                        <th class="whitespace-nowrap">Dates</th>
                        <th class="whitespace-nowrap">Details</th>
                        <th class="whitespace-nowrap">Submitted</th>
                        <th class="whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Requests will be populated dynamically -->
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Pending Requests -->

    <!-- BEGIN: Request Details Modal -->
    <div id="request-details-modal" class="modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="font-medium text-base mr-auto">Request Details</h2>
                </div>
                <div class="modal-body">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <div class="text-slate-500">Employee</div>
                            <div class="font-medium" id="modal-employee-name"></div>
                        </div>
                        <div class="col-span-6">
                            <div class="text-slate-500">Request Type</div>
                            <div id="modal-request-type"></div>
                        </div>
                        <div class="col-span-6">
                            <div class="text-slate-500">Dates</div>
                            <div id="modal-request-dates"></div>
                        </div>
                        <div class="col-span-12">
                            <div id="modal-request-details"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Close</button>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Request Details Modal -->
</div>

<?php
// Using bundled FullCalendar from app.js
wp_enqueue_script('team-lead-dashboard', get_template_directory_uri() . '/assets/js/attendance/team-lead-dashboard.js', array('jquery'), '1.0', true);
?>

<?php get_footer(); ?>
