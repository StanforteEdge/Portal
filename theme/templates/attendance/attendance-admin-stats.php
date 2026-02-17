<?php /* Template Name: Admin Attendance Statistics */ ?>

<?php
get_header();
$b_link = '/attendance/admin/stats';
$b_title = 'Attendance Statistics';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <!-- BEGIN: Top Bar -->
    <div class="top-bar">
        <nav aria-label="breadcrumb" class="-intro-x mr-auto hidden sm:flex">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">Attendance</a></li>
                <li class="breadcrumb-item"><a href="attendance-admin.php">Admin</a></li>
                <li class="breadcrumb-item active" aria-current="page">Statistics</li>
            </ol>
        </nav>
    </div>
    <!-- END: Top Bar -->

    <!-- BEGIN: Filters -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5">
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
                <label class="form-label">Time Period</label>
                <select class="form-select">
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="custom">Custom Range</option>
                </select>
            </div>
            <div class="mr-4 custom-date-range hidden">
                <label class="form-label">Custom Range</label>
                <input type="text" class="datepicker form-control" data-single-mode="false">
            </div>
            <div class="mt-2 sm:mt-0">
                <button class="btn btn-primary">Generate Report</button>
            </div>
        </div>
    </div>
    <!-- END: Filters -->

    <!-- BEGIN: Overall Statistics -->
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Attendance Rate -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="users" class="report-box__icon text-primary"></i>
                        <div class="ml-auto">
                            <div class="report-box__indicator bg-success">
                                +2% <i data-lucide="chevron-up" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">95%</div>
                    <div class="text-base text-slate-500 mt-1">Attendance Rate</div>
                </div>
            </div>
        </div>
        <!-- Average Check-in Time -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="clock" class="report-box__icon text-pending"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">8:45 AM</div>
                    <div class="text-base text-slate-500 mt-1">Avg. Check-in Time</div>
                </div>
            </div>
        </div>
        <!-- Work From Home Rate -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="home" class="report-box__icon text-warning"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">25%</div>
                    <div class="text-base text-slate-500 mt-1">Remote Work Rate</div>
                </div>
            </div>
        </div>
        <!-- Leave Utilization -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="calendar" class="report-box__icon text-success"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6">42%</div>
                    <div class="text-base text-slate-500 mt-1">Leave Utilization</div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Overall Statistics -->

    <!-- BEGIN: Attendance Trends -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Attendance Trends</h2>
            <div class="w-full sm:w-auto flex">
                <button class="btn btn-outline-secondary">
                    <i data-lucide="download" class="w-4 h-4 mr-2"></i> Export
                </button>
            </div>
        </div>
        <div class="p-5">
            <div class="chart-container">
                <!-- Chart will be rendered here by JavaScript -->
                <canvas id="attendance-trend-chart" height="300"></canvas>
            </div>
        </div>
    </div>
    <!-- END: Attendance Trends -->

    <!-- BEGIN: Department Comparison -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Department Comparison</h2>
        </div>
        <div class="p-5">
            <table class="table table-report">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Department</th>
                        <th class="text-center whitespace-nowrap">Total Staff</th>
                        <th class="text-center whitespace-nowrap">Avg. Attendance</th>
                        <th class="text-center whitespace-nowrap">Late Rate</th>
                        <th class="text-center whitespace-nowrap">Remote Work %</th>
                        <th class="text-center whitespace-nowrap">Leave Usage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="intro-x">
                        <td>Technology</td>
                        <td class="text-center">48</td>
                        <td class="text-center">96%</td>
                        <td class="text-center">4.2%</td>
                        <td class="text-center">35%</td>
                        <td class="text-center">45%</td>
                    </tr>
                    <tr class="intro-x">
                        <td>HR</td>
                        <td class="text-center">12</td>
                        <td class="text-center">98%</td>
                        <td class="text-center">2.1%</td>
                        <td class="text-center">15%</td>
                        <td class="text-center">38%</td>
                    </tr>
                    <!-- More department rows -->
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Department Comparison -->

    <!-- BEGIN: Individual Performance -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Individual Performance</h2>
            <div class="w-full sm:w-auto flex items-center">
                <input type="text" class="form-control w-48 box pr-10" placeholder="Search employee...">
            </div>
        </div>
        <div class="p-5">
            <table class="table table-report">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Employee</th>
                        <th class="text-center whitespace-nowrap">Attendance Rate</th>
                        <th class="text-center whitespace-nowrap">Avg. Check-in</th>
                        <th class="text-center whitespace-nowrap">Work Mode</th>
                        <th class="text-center whitespace-nowrap">Leave Balance</th>
                        <th class="text-center whitespace-nowrap">Actions</th>
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
                        <td class="text-center">98%</td>
                        <td class="text-center">8:55 AM</td>
                        <td class="text-center">Hybrid</td>
                        <td class="text-center">12 days</td>
                        <td class="table-report__action">
                            <div class="flex justify-center">
                                <a href="javascript:;" class="flex items-center text-primary">
                                    <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View Details
                                </a>
                            </div>
                        </td>
                    </tr>
                    <!-- More employee rows -->
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Individual Performance -->
</div>

<!-- BEGIN: JS Assets-->
<script src="path/to/chart.js"></script>
<script>
    // Demo chart data - Replace with real data in implementation
    const ctx = document.getElementById('attendance-trend-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Attendance Rate',
                data: [95, 93, 96, 95],
                borderColor: 'rgb(45, 125, 245)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
</script>
<!-- END: JS Assets-->

<?php get_footer(); ?>
