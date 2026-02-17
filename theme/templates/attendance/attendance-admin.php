<?php /* Template Name: Admin Attendance Dashboard */ ?>

<?php
get_header();
$b_link = '/attendance/admin';
$b_title = 'Attendance Management';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <!-- BEGIN: Top Bar -->
    <div class="top-bar">
        <nav aria-label="breadcrumb" class="-intro-x mr-auto hidden sm:flex">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">Attendance</a></li>
                <li class="breadcrumb-item active" aria-current="page">Admin Dashboard</li>
            </ol>
        </nav>
    </div>
    <!-- END: Top Bar -->

    <!-- BEGIN: Today's Overview -->
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Present Today -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="user-check" class="report-box__icon text-success"></i>
                        <div class="ml-auto">
                            <div class="report-box__indicator bg-success">
                                95% <i data-lucide="chevron-up" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">142</div>
                    <div class="text-base text-slate-500 mt-1">Present Today</div>
                </div>
            </div>
        </div>
        <!-- Late Check-ins -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="clock" class="report-box__icon text-warning"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">8</div>
                    <div class="text-base text-slate-500 mt-1">Late Check-ins</div>
                </div>
            </div>
        </div>
        <!-- Absent -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="user-x" class="report-box__icon text-danger"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">3</div>
                    <div class="text-base text-slate-500 mt-1">Absent</div>
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
                    <div class="text-3xl font-medium leading-8 mt-6">7</div>
                    <div class="text-base text-slate-500 mt-1">On Leave</div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Today's Overview -->

    <!-- BEGIN: Pending Time Off Requests -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Pending Time Off Requests</h2>
            <div class="w-full sm:w-auto flex">
                <a href="attendance-admin-requests.php" class="btn btn-primary shadow-md">View All Requests</a>
            </div>
        </div>
        <div class="p-5">
            <table class="table table-report">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Employee</th>
                        <th class="whitespace-nowrap">Department</th>
                        <th class="whitespace-nowrap">Type</th>
                        <th class="whitespace-nowrap">From</th>
                        <th class="whitespace-nowrap">To</th>
                        <th class="whitespace-nowrap">Days</th>
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
                        <td>Feb 15, 2025</td>
                        <td>Feb 17, 2025</td>
                        <td>3</td>
                        <td class="table-report__action w-56">
                            <div class="flex justify-center items-center">
                                <button class="btn btn-success btn-sm mr-2">Approve</button>
                                <button class="btn btn-danger btn-sm">Reject</button>
                            </div>
                        </td>
                    </tr>
                    <!-- More demo entries -->
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Pending Time Off Requests -->

    <!-- BEGIN: Department Overview -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Department Overview</h2>
            <div class="w-full sm:w-auto flex">
                <a href="attendance-admin-stats.php" class="btn btn-outline-secondary">View Detailed Stats</a>
            </div>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-12 gap-6">
                <!-- Department Cards -->
                <div class="col-span-12 sm:col-span-6 2xl:col-span-3">
                    <div class="box p-5">
                        <div class="font-medium">Technology</div>
                        <div class="flex items-center mt-1">
                            <div class="text-base">Present: 45/48</div>
                            <div class="text-success flex text-xs font-medium ml-auto">
                                94% <i data-lucide="chevron-up" class="w-4 h-4 ml-0.5"></i>
                            </div>
                        </div>
                        <div class="flex mt-4">
                            <div class="mr-auto">Late: 2</div>
                            <div>Leave: 1</div>
                        </div>
                    </div>
                </div>
                <!-- More department cards -->
            </div>
        </div>
    </div>
    <!-- END: Department Overview -->

    <!-- BEGIN: Recent Activity -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Recent Activity</h2>
            <div class="w-full sm:w-auto flex">
                <a href="attendance-admin-stats.php" class="btn btn-outline-secondary">View Full History</a>
            </div>
        </div>
        <div class="p-5">
            <div class="flex flex-col">
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Time</th>
                                <th class="whitespace-nowrap">Employee</th>
                                <th class="whitespace-nowrap">Action</th>
                                <th class="whitespace-nowrap">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>10:15 AM</td>
                                <td>Jane Smith</td>
                                <td>Check In</td>
                                <td>Remote Work</td>
                            </tr>
                            <tr>
                                <td>10:00 AM</td>
                                <td>Mike Johnson</td>
                                <td>Leave Request</td>
                                <td>Annual Leave (Feb 20-22)</td>
                            </tr>
                            <!-- More activity entries -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Recent Activity -->
</div>

<?php get_footer(); ?>
