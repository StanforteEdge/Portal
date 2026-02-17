<?php /* Template Name: Staff: HR Reports */ ?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'HR Reports';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12">
        <!-- BEGIN: Staff Overview -->
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">150</div>
                        <div class="text-base text-slate-500 mt-1">Total Employees</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-plus" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">12</div>
                        <div class="text-base text-slate-500 mt-1">New This Month</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-minus" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">3</div>
                        <div class="text-base text-slate-500 mt-1">Resignations</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="briefcase" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">8</div>
                        <div class="text-base text-slate-500 mt-1">Open Positions</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Staff Overview -->

        <!-- BEGIN: Department Distribution -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Department Distribution</h2>
                <div class="w-full sm:w-auto flex">
                    <button class="btn btn-outline-secondary">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i> Export
                    </button>
                </div>
            </div>
            <div class="p-5">
                <div class="chart-container">
                    <canvas id="departmentChart" height="100"></canvas>
                </div>
            </div>
        </div>
        <!-- END: Department Distribution -->

        <!-- BEGIN: Employee Demographics -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Employee Demographics</h2>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-6">
                    <!-- Age Distribution -->
                    <div class="col-span-12 lg:col-span-6">
                        <div class="box p-5">
                            <h3 class="text-lg font-medium mb-3">Age Distribution</h3>
                            <canvas id="ageChart" height="200"></canvas>
                        </div>
                    </div>
                    <!-- Gender Distribution -->
                    <div class="col-span-12 lg:col-span-6">
                        <div class="box p-5">
                            <h3 class="text-lg font-medium mb-3">Gender Distribution</h3>
                            <canvas id="genderChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Employee Demographics -->

        <!-- BEGIN: Employment Trends -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Employment Trends</h2>
                <div class="w-full sm:w-auto flex">
                    <select class="form-select" id="trendPeriod">
                        <option value="12">Last 12 Months</option>
                        <option value="6">Last 6 Months</option>
                        <option value="3">Last 3 Months</option>
                    </select>
                </div>
            </div>
            <div class="p-5">
                <canvas id="trendsChart" height="100"></canvas>
            </div>
        </div>
        <!-- END: Employment Trends -->
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
jQuery(document).ready(function($) {
    // Department Distribution Chart
    const departmentData = {
        labels: ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales'],
        datasets: [{
            data: [30, 12, 15, 25, 18, 20],
            backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#6366f1',
                '#8b5cf6'
            ]
        }]
    };
    
    new Chart(document.getElementById('departmentChart'), {
        type: 'pie',
        data: departmentData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // Age Distribution Chart
    const ageData = {
        labels: ['20-25', '26-30', '31-35', '36-40', '41-45', '46+'],
        datasets: [{
            label: 'Employees',
            data: [15, 30, 40, 35, 20, 10],
            backgroundColor: '#3b82f6'
        }]
    };
    
    new Chart(document.getElementById('ageChart'), {
        type: 'bar',
        data: ageData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gender Distribution Chart
    const genderData = {
        labels: ['Male', 'Female', 'Other'],
        datasets: [{
            data: [60, 35, 5],
            backgroundColor: ['#3b82f6', '#ec4899', '#8b5cf6']
        }]
    };
    
    new Chart(document.getElementById('genderChart'), {
        type: 'doughnut',
        data: genderData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Employment Trends Chart
    const trendsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'New Hires',
            data: [5, 3, 4, 2, 3, 4, 5, 2, 3, 4, 2, 3],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.5)'
        }, {
            label: 'Resignations',
            data: [1, 2, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.5)'
        }]
    };
    
    new Chart(document.getElementById('trendsChart'), {
        type: 'line',
        data: trendsData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Handle trend period change
    $('#trendPeriod').on('change', function() {
        // Update trends chart based on selected period
        // This would typically involve an AJAX call to get new data
    });
});
</script>

<?php get_footer(); ?>
