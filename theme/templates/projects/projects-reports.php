<?php /* Template Name: Projects Reports */
get_header();
$b_link = '/projects';
$b_title = 'Projects';
$p_title = 'Project Reports';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Project Reports</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <button class="btn btn-primary shadow-md mr-2">
                <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to Excel
            </button>
            <button class="btn btn-outline-secondary">
                <i data-lucide="printer" class="w-4 h-4 mr-2"></i> Print
            </button>
        </div>
    </div>
    <div class="intro-y grid grid-cols-12 gap-6 mt-5">
        <!-- BEGIN: General Report -->
        <div class="col-span-12 lg:col-span-8">
            <div class="intro-y box p-5">
                <div class="flex items-center">
                    <div class="font-medium text-base truncate">Impact Overview</div>
                    <div class="ml-auto">
                        <select class="form-select w-32">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>
                <div class="mt-5">
                    <canvas id="project-overview-chart" height="200"></canvas>
                </div>
            </div>
            <div class="intro-y box p-5 mt-5">
                <div class="flex items-center">
                    <div class="font-medium text-base truncate">Project Category Distribution</div>
                </div>
                <div class="mt-5">
                    <canvas id="project-status-chart" height="200"></canvas>
                </div>
            </div>
        </div>
        <!-- END: General Report -->
        <!-- BEGIN: Project Stats -->
        <div class="col-span-12 lg:col-span-4">
            <div class="intro-y box p-5">
                <div class="font-medium text-base truncate mb-5">Project Statistics</div>
                <div class="flex items-center mb-5">
                    <div class="flex-1">Total Projects</div>
                    <div class="font-medium">18</div>
                </div>
                <div class="flex items-center mb-5">
                    <div class="flex-1">Active Projects</div>
                    <div class="font-medium text-success">12</div>
                </div>
                <div class="flex items-center mb-5">
                    <div class="flex-1">Completed Projects</div>
                    <div class="font-medium text-primary">5</div>
                </div>
                <div class="flex items-center mb-5">
                    <div class="flex-1">Delayed Projects</div>
                    <div class="font-medium text-danger">1</div>
                </div>
                <div class="flex items-center">
                    <div class="flex-1">Average Project Duration</div>
                    <div class="font-medium">6 months</div>
                </div>
            </div>
            <div class="intro-y box p-5 mt-5">
                <div class="font-medium text-base truncate mb-5">Impact Metrics</div>
                <div class="flex items-center mb-5">
                    <div class="w-2/4">Beneficiaries Reached</div>
                    <div class="w-2/4">
                        <div class="progress h-4">
                            <div class="progress-bar w-3/4 bg-primary" role="progressbar" aria-valuenow="2500" aria-valuemin="0" aria-valuemax="3000">2,500</div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center mb-5">
                    <div class="w-2/4">Communities Engaged</div>
                    <div class="w-2/4">
                        <div class="progress h-4">
                            <div class="progress-bar w-4/5 bg-success" role="progressbar" aria-valuenow="35" aria-valuemin="0" aria-valuemax="40">35</div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center">
                    <div class="w-2/4">Partner Organizations</div>
                    <div class="w-2/4">
                        <div class="progress h-4">
                            <div class="progress-bar w-2/3 bg-warning" role="progressbar" aria-valuenow="15" aria-valuemin="0" aria-valuemax="20">15</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Stats -->
        <!-- BEGIN: Recent Projects Table -->
        <div class="col-span-12">
            <div class="intro-y box">
                <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-base mr-auto">Recent Projects</h2>
                </div>
                <div class="p-5">
                    <div class="overflow-x-auto">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th class="whitespace-nowrap">Project Name</th>
                                    <th class="whitespace-nowrap">Category</th>
                                    <th class="whitespace-nowrap">Progress</th>
                                    <th class="whitespace-nowrap">Status</th>
                                    <th class="whitespace-nowrap">Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Inclusive Education Initiative</td>
                                    <td>Education & Empowerment</td>
                                    <td>
                                        <div class="progress h-4">
                                            <div class="progress-bar w-2/5 bg-primary" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">45%</div>
                                        </div>
                                    </td>
                                    <td><span class="text-success">Active</span></td>
                                    <td>20 Mar 2025</td>
                                </tr>
                                <tr>
                                    <td>Vocational Training Program</td>
                                    <td>Skills Development</td>
                                    <td>
                                        <div class="progress h-4">
                                            <div class="progress-bar w-3/5 bg-primary" role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">65%</div>
                                        </div>
                                    </td>
                                    <td><span class="text-warning">In Progress</span></td>
                                    <td>15 Apr 2025</td>
                                </tr>
                                <tr>
                                    <td>Community Awareness Campaign</td>
                                    <td>Advocacy & Awareness</td>
                                    <td>
                                        <div class="progress h-4">
                                            <div class="progress-bar w-1/4 bg-primary" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
                                        </div>
                                    </td>
                                    <td><span class="text-warning">In Progress</span></td>
                                    <td>30 May 2025</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Recent Projects Table -->
    </div>
</div>
<!-- END: Content -->

<!-- BEGIN: JS Assets-->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    // Sample data for charts
    const projectOverviewCtx = document.getElementById('project-overview-chart').getContext('2d');
    new Chart(projectOverviewCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Beneficiaries Reached',
                data: [500, 800, 1200, 1600, 2000, 2500],
                borderColor: 'rgb(45, 125, 245)',
                tension: 0.1
            }]
        }
    });

    const projectStatusCtx = document.getElementById('project-status-chart').getContext('2d');
    new Chart(projectStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Education & Empowerment', 'Skills Development', 'Advocacy & Awareness', 'Healthcare & Wellbeing', 'Economic Empowerment'],
            datasets: [{
                data: [5, 4, 3, 3, 3],
                backgroundColor: [
                    'rgb(45, 125, 245)',
                    'rgb(50, 205, 50)',
                    'rgb(255, 159, 64)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)'
                ]
            }]
        }
    });
</script>
<!-- END: JS Assets-->

<?php get_footer(); ?>
