<?php /* Template Name: Attendance: Statistics */ ?>

<?php
get_header();
$b_link = '/attendance/stats';
$b_title = 'Attendance Statistics';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Attendance Analytics</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <div class="dropdown mr-2">
                <button class="dropdown-toggle btn box flex items-center" aria-expanded="false" data-tw-toggle="dropdown">
                    <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Time Period
                </button>
                <div class="dropdown-menu w-40">
                    <ul class="dropdown-content">
                        <li><a href="" class="dropdown-item">Last 7 Days</a></li>
                        <li><a href="" class="dropdown-item">Last 30 Days</a></li>
                        <li><a href="" class="dropdown-item">Last 90 Days</a></li>
                        <li><a href="" class="dropdown-item">Custom Range</a></li>
                    </ul>
                </div>
            </div>
            <button class="btn btn-primary shadow-md mr-2">Generate Report</button>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Overall Statistics -->
        <div class="col-span-12 xl:col-span-8">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                    <div class="font-medium text-base truncate">Attendance Trends</div>
                </div>
                <div class="h-[400px]">
                    <canvas id="attendance-trend-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Key Metrics -->
        <div class="col-span-12 xl:col-span-4">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                    <div class="font-medium text-base truncate">Key Metrics</div>
                </div>
                <div class="mt-4">
                    <div class="flex items-center mb-5">
                        <div class="flex-1">
                            <div class="text-slate-500">Average Attendance Rate</div>
                            <div class="text-2xl font-medium mt-2">94.5%</div>
                        </div>
                        <div class="w-20 h-20 flex items-center justify-center rounded-full bg-success/20 text-success">
                            <i data-lucide="users" class="w-8 h-8"></i>
                        </div>
                    </div>
                    <div class="flex items-center mb-5">
                        <div class="flex-1">
                            <div class="text-slate-500">Average Late Arrivals</div>
                            <div class="text-2xl font-medium mt-2">5.2%</div>
                        </div>
                        <div class="w-20 h-20 flex items-center justify-center rounded-full bg-warning/20 text-warning">
                            <i data-lucide="clock" class="w-8 h-8"></i>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="flex-1">
                            <div class="text-slate-500">Average Work Hours</div>
                            <div class="text-2xl font-medium mt-2">7.8h</div>
                        </div>
                        <div class="w-20 h-20 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                            <i data-lucide="clock" class="w-8 h-8"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Department Breakdown -->
        <div class="col-span-12 xl:col-span-6">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                    <div class="font-medium text-base truncate">Department Breakdown</div>
                </div>
                <div class="h-[400px]">
                    <canvas id="department-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Time Distribution -->
        <div class="col-span-12 xl:col-span-6">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                    <div class="font-medium text-base truncate">Time Distribution</div>
                </div>
                <div class="h-[400px]">
                    <canvas id="time-distribution-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Top Performers -->
        <div class="col-span-12">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                    <div class="font-medium text-base truncate">Top Performers</div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                <img src="dist/images/profile-1.jpg" alt="Employee Photo">
                            </div>
                            <div class="ml-4">
                                <div class="font-medium">Olalekan Owonikoko</div>
                                <div class="text-slate-500">Operations</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <div class="w-2 h-2 bg-success rounded-full mr-3"></div>
                            <span class="text-success">100% Attendance</span>
                        </div>
                    </div>
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                <img src="dist/images/profile-2.jpg" alt="Employee Photo">
                            </div>
                            <div class="ml-4">
                                <div class="font-medium">Micheal Ojediran</div>
                                <div class="text-slate-500">Programs</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <div class="w-2 h-2 bg-success rounded-full mr-3"></div>
                            <span class="text-success">98% Attendance</span>
                        </div>
                    </div>
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                <img src="dist/images/profile-3.jpg" alt="Employee Photo">
                            </div>
                            <div class="ml-4">
                                <div class="font-medium">Allen Zito</div>
                                <div class="text-slate-500">Communications</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <div class="w-2 h-2 bg-success rounded-full mr-3"></div>
                            <span class="text-success">97% Attendance</span>
                        </div>
                    </div>
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                <img src="dist/images/profile-4.jpg" alt="Employee Photo">
                            </div>
                            <div class="ml-4">
                                <div class="font-medium">Ademibolanle Adesida</div>
                                <div class="text-slate-500">Advocacy</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <div class="w-2 h-2 bg-success rounded-full mr-3"></div>
                            <span class="text-success">97% Attendance</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    jQuery(document).ready(function($) {
        // Attendance Trend Chart
        var ctx = document.getElementById('attendance-trend-chart').getContext('2d');
        var attendanceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'On Time',
                    data: [95, 93, 94, 96, 95, 97],
                    borderColor: 'rgb(45, 212, 191)',
                    backgroundColor: 'rgba(45, 212, 191, 0.5)',
                    fill: true
                }, {
                    label: 'Late',
                    data: [5, 7, 6, 4, 5, 3],
                    borderColor: 'rgb(234, 179, 8)',
                    backgroundColor: 'rgba(234, 179, 8, 0.5)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        // Department Breakdown Chart
        var deptCtx = document.getElementById('department-chart').getContext('2d');
        var departmentChart = new Chart(deptCtx, {
            type: 'doughnut',
            data: {
                labels: ['Operations', 'Programs', 'Communications', 'Advocacy'],
                datasets: [{
                    data: [95, 92, 98, 90],
                    backgroundColor: [
                        'rgb(45, 212, 191)',
                        'rgb(234, 179, 8)',
                        'rgb(99, 102, 241)',
                        'rgb(255, 99, 132)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Time Distribution Chart
        var timeCtx = document.getElementById('time-distribution-chart').getContext('2d');
        var timeDistributionChart = new Chart(timeCtx, {
            type: 'bar',
            data: {
                labels: ['8-9 AM', '9-10 AM', '10-11 AM', '4-5 PM', '5-6 PM', '6-7 PM'],
                datasets: [{
                    label: 'Check In',
                    data: [10, 45, 5, 0, 0, 0],
                    backgroundColor: 'rgb(45, 212, 191)'
                }, {
                    label: 'Check Out',
                    data: [0, 0, 0, 15, 40, 5],
                    backgroundColor: 'rgb(234, 179, 8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' staff';
                            }
                        }
                    }
                }
            }
        });
    });
</script>

<?php get_footer(); ?>
