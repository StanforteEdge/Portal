<?php /* Template Name: Finance: Reports */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Reports';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles) && !in_array('ceo', (array) $user->roles) && !in_array('coo', (array) $user->roles)) {
    header("Location: " . home_url());
    exit();
}

global $wpdb;

?>

<div class="wrapper-box">
    <!-- BEGIN: Content -->
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Financial Reports
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <div class="dropdown">
                    <button class="dropdown-toggle btn btn-primary shadow-md mr-2" aria-expanded="false" data-tw-toggle="dropdown">
                        Export <i data-lucide="chevron-down" class="w-4 h-4 ml-2"></i>
                    </button>
                    <div class="dropdown-menu w-40">
                        <ul class="dropdown-content">
                            <li>
                                <a href="" class="dropdown-item">
                                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export PDF
                                </a>
                            </li>
                            <li>
                                <a href="" class="dropdown-item">
                                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export Excel
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Filters -->
        <div class="box p-5 mt-5">
            <div class="flex flex-col md:flex-row md:items-center">
                <div class="flex items-center">
                    <div class="mr-4">
                        <label for="report-type" class="form-label">Report Type</label>
                        <select id="report-type" class="form-select w-full">
                            <option value="income" <?php echo $report_type == 'income' ? 'selected' : ''; ?>>Income Report</option>
                            <option value="expenses" <?php echo $report_type == 'expenses' ? 'selected' : ''; ?>>Expense Report</option>
                            <option value="budget" <?php echo $report_type == 'budget' ? 'selected' : ''; ?>>Budget Analysis</option>
                            <option value="audit" <?php echo $report_type == 'audit' ? 'selected' : ''; ?>>Audit Trail</option>
                        </select>
                    </div>
                    <div class="mr-4">
                        <label for="date-range" class="form-label">Date Range</label>
                        <input type="text" id="date-range" class="datepicker form-control w-full" data-daterange="true">
                    </div>
                    <div class="mt-5">
                        <button type="button" class="btn btn-primary w-24">Filter</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Content -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- Summary Cards -->
            <div class="col-span-12 xl:col-span-8">
                <div class="box p-5">
                    <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5 mb-5">
                        <div class="font-medium text-base truncate">Financial Overview</div>
                    </div>
                    <div class="grid grid-cols-4 gap-4">
                        <div class="col-span-2 sm:col-span-1">
                            <div class="text-slate-500 mt-1">Total Income</div>
                            <div class="mt-1.5 flex items-center">
                                <div class="text-base">₦0.00</div>
                            </div>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <div class="text-slate-500 mt-1">Total Expenses</div>
                            <div class="mt-1.5 flex items-center">
                                <div class="text-base">₦0.00</div>
                            </div>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <div class="text-slate-500 mt-1">Net Balance</div>
                            <div class="mt-1.5 flex items-center">
                                <div class="text-base">₦0.00</div>
                            </div>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <div class="text-slate-500 mt-1">Budget Utilization</div>
                            <div class="mt-1.5 flex items-center">
                                <div class="text-base">0%</div>
                            </div>
                        </div>
                    </div>
                    <!-- Add charts here -->
                </div>
            </div>
            <!-- Trends -->
            <div class="col-span-12 xl:col-span-4">
                <div class="box p-5">
                    <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5 mb-5">
                        <div class="font-medium text-base truncate">Trends</div>
                    </div>
                    <!-- Add trend analysis here -->
                </div>
            </div>
        </div>

        <!-- Detailed Report Table -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">DATE</th>
                            <th class="text-center whitespace-nowrap">REFERENCE</th>
                            <th class="text-center whitespace-nowrap">TYPE</th>
                            <th class="text-center whitespace-nowrap">DESCRIPTION</th>
                            <th class="text-center whitespace-nowrap">AMOUNT</th>
                            <th class="text-center whitespace-nowrap">BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Add report data rows here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
