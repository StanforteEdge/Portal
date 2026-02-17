<?php /* Template Name: Attendance: Dashboard */ ?>

<?php
get_header();
$b_link = '/attendance/dashboard';
$b_title = 'Attendance';
$p_title = '';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
   
    <!-- BEGIN: Check In/Out Section -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Today's Attendance</h2>
            <div class="w-full sm:w-auto flex">
                <div class="text-slate-500 mt-1">Current Time: <span id="current-time">--:--:--</span></div>
            </div>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-12 gap-6">
                <!-- Time Card -->
                <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                    <div class="report-box zoom-in">
                        <div class="box p-5">
                            <div id="attendance-status" class="text-3xl font-medium leading-8 mt-6 text-center">
                                Not Checked In
                            </div>
                            <div class="text-base text-slate-500 mt-1 text-center">Current Status</div>
                        </div>
                    </div>
                </div>
                <!-- Check In/Out Actions -->
                <div class="col-span-12 sm:col-span-6 xl:col-span-6">
                    <div class="report-box zoom-in">
                        <div class="box p-5">
                            <div class="flex justify-center space-x-4">
                                <button id="btn-check-in" class="btn btn-primary">
                                    <i data-lucide="log-in" class="w-4 h-4 mr-2"></i> Check In
                                </button>
                                <button id="btn-check-out" class="btn btn-danger" disabled>
                                    <i data-lucide="log-out" class="w-4 h-4 mr-2"></i> Check Out
                                </button>
                            </div>
                            <div class="mt-4">
                                <select id="work-mode" class="form-select">
                                    <option value="office">Office</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Quick Stats -->
                <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                    <div class="report-box zoom-in">
                        <div class="box p-5">
                            <div class="flex">
                                <i data-lucide="clock" class="report-box__icon text-primary"></i>
                                <div class="ml-auto">
                                    <div class="report-box__indicator bg-success tooltip cursor-pointer" title="On Time Rate">
                                        98% <i data-lucide="chevron-up" class="w-4 h-4 ml-0.5"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="text-3xl font-medium leading-8 mt-6">157/160</div>
                            <div class="text-base text-slate-500 mt-1">Hours This Month</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Check In/Out Section -->

    <!-- BEGIN: Recent Activity -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Recent Activity</h2>
            <div class="w-full sm:w-auto flex">
                <a href="attendance-history.php" class="btn btn-outline-secondary">View Full History</a>
            </div>
        </div>
        <div class="p-5">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">Date</th>
                        <th class="whitespace-nowrap">Check In</th>
                        <th class="whitespace-nowrap">Check Out</th>
                        <th class="whitespace-nowrap">Work Mode</th>
                        <th class="whitespace-nowrap">Status</th>
                        <th class="whitespace-nowrap">Total Hours</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Demo Data -->
                    <tr>
                        <td>2025-02-05</td>
                        <td>09:00 AM</td>
                        <td>05:30 PM</td>
                        <td>Office</td>
                        <td><span class="text-success">Present</span></td>
                        <td>8.5</td>
                    </tr>
                    <tr>
                        <td>2025-02-04</td>
                        <td>08:55 AM</td>
                        <td>05:00 PM</td>
                        <td>Remote</td>
                        <td><span class="text-success">Present</span></td>
                        <td>8.0</td>
                    </tr>
                    <tr>
                        <td>2025-02-03</td>
                        <td>09:15 AM</td>
                        <td>05:45 PM</td>
                        <td>Hybrid</td>
                        <td><span class="text-warning">Late</span></td>
                        <td>8.5</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <!-- END: Recent Activity -->

    <!-- BEGIN: Time Off Section -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Time Off Overview</h2>
            <div class="w-full sm:w-auto flex">
                <a href="/attendance/request.php" class="btn btn-primary shadow-md">Request Time Off</a>
            </div>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-12 gap-6">
                <!-- Leave Balance -->
                <div class="col-span-12 sm:col-span-6 2xl:col-span-3">
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <i data-lucide="calendar" class="report-box__icon text-primary"></i>
                            <div class="ml-auto">
                                <div class="report-box__indicator text-success">
                                    Available
                                </div>
                            </div>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">15</div>
                        <div class="text-base text-slate-500 mt-1">Annual Leave Days</div>
                    </div>
                </div>
                <!-- Sick Leave Balance -->
                <div class="col-span-12 sm:col-span-6 2xl:col-span-3">
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <i data-lucide="thermometer" class="report-box__icon text-pending"></i>
                            <div class="ml-auto">
                                <div class="report-box__indicator text-success">
                                    Available
                                </div>
                            </div>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">5</div>
                        <div class="text-base text-slate-500 mt-1">Sick Leave Days</div>
                    </div>
                </div>
                <!-- Pending Requests -->
                <div class="col-span-12 sm:col-span-6 2xl:col-span-6">
                    <div class="box p-5 zoom-in">
                        <h3 class="text-base font-medium mb-3">Recent Time Off Requests</h3>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Annual Leave</td>
                                    <td>Feb 15-17, 2025</td>
                                    <td><span class="text-warning">Pending</span></td>
                                </tr>
                                <tr>
                                    <td>Sick Leave</td>
                                    <td>Jan 25, 2025</td>
                                    <td><span class="text-success">Approved</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Time Off Section -->
</div>

<!-- BEGIN: JS Assets-->
<script>
    // Update current time
    function updateTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Demo functionality for check in/out
    document.getElementById('btn-check-in').addEventListener('click', function() {
        this.disabled = true;
        document.getElementById('btn-check-out').disabled = false;
        document.getElementById('attendance-status').textContent = 'Checked In';
        // In real implementation, this would make an AJAX call to the server
    });

    document.getElementById('btn-check-out').addEventListener('click', function() {
        this.disabled = true;
        document.getElementById('btn-check-in').disabled = true;
        document.getElementById('attendance-status').textContent = 'Checked Out';
        // In real implementation, this would make an AJAX call to the server
    });
</script>
<!-- END: JS Assets-->

<?php get_footer(); ?>
