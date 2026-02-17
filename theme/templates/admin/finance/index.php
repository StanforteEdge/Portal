<?php /* Template Name: Staff: Admin - Finance Overview */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Finance Overview';

include get_template_directory() . "/layout/menu.php";

// Get financial overview data
$current_year = date('Y');
$current_month = date('m');

// Get total budget and expenses by project
$project_finances = $wpdb->get_results("
    SELECT 
        p.name as project_name,
        p.budget as total_budget,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        p.budget - COALESCE(SUM(e.amount), 0) as remaining_budget,
        (COALESCE(SUM(e.amount), 0) / p.budget) * 100 as budget_utilization
    FROM staff_jet_cct_projects p
    LEFT JOIN staff_jet_cct_expenses e ON p._ID = e.project_id
    WHERE p.status = 'active'
    GROUP BY p._ID
    ORDER BY p.name
");

// Get monthly expenses for the current year
$monthly_expenses = $wpdb->get_results($wpdb->prepare("
    SELECT 
        MONTH(expense_date) as month,
        SUM(amount) as total_amount
    FROM staff_jet_cct_expenses
    WHERE YEAR(expense_date) = %d
    GROUP BY MONTH(expense_date)
    ORDER BY month
", $current_year));

// Get expense categories breakdown
$expense_categories = $wpdb->get_results("
    SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
    FROM staff_jet_cct_expenses
    WHERE YEAR(expense_date) = YEAR(CURRENT_DATE)
    GROUP BY category
    ORDER BY total_amount DESC
");

// Get recent transactions
$recent_transactions = $wpdb->get_results("
    SELECT 
        e.*,
        p.name as project_name,
        s.first_name,
        s.last_name
    FROM staff_jet_cct_expenses e
    LEFT JOIN staff_jet_cct_projects p ON e.project_id = p._ID
    LEFT JOIN staff_jet_cct_profiles s ON e.submitted_by = s._ID
    ORDER BY e.expense_date DESC
    LIMIT 10
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: Financial Overview -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Financial Overview</h2>
                <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                    <button class="btn btn-primary shadow-md mr-2">Generate Report</button>
                    <div class="dropdown ml-auto sm:ml-0">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false">
                            <span class="w-5 h-5 flex items-center justify-center">
                                <i class="w-4 h-4" data-lucide="download"></i>
                            </span>
                        </button>
                        <div class="dropdown-menu w-40">
                            <ul class="dropdown-content">
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to Excel
                                    </a>
                                </li>
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to PDF
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-5">
                    <!-- Project Budget Overview -->
                    <div class="col-span-12 xl:col-span-8">
                        <div class="box p-5">
                            <div class="font-medium mb-3">Project Budget Utilization</div>
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th class="whitespace-nowrap">Project</th>
                                            <th class="text-right whitespace-nowrap">Total Budget</th>
                                            <th class="text-right whitespace-nowrap">Expenses</th>
                                            <th class="text-right whitespace-nowrap">Remaining</th>
                                            <th class="text-center whitespace-nowrap">Utilization</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($project_finances as $project): ?>
                                        <tr>
                                            <td><?php echo esc_html($project->project_name); ?></td>
                                            <td class="text-right">$<?php echo number_format($project->total_budget, 2); ?></td>
                                            <td class="text-right">$<?php echo number_format($project->total_expenses, 2); ?></td>
                                            <td class="text-right">$<?php echo number_format($project->remaining_budget, 2); ?></td>
                                            <td>
                                                <div class="flex items-center">
                                                    <div class="w-full bg-slate-200 rounded-full h-2 mr-2">
                                                        <div class="bg-primary rounded-full h-2" style="width: <?php echo min(100, $project->budget_utilization); ?>%"></div>
                                                    </div>
                                                    <div class="text-xs"><?php echo number_format($project->budget_utilization, 1); ?>%</div>
                                                </div>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Expense Categories -->
                    <div class="col-span-12 xl:col-span-4">
                        <div class="box p-5">
                            <div class="font-medium mb-3">Expense Categories (<?php echo $current_year; ?>)</div>
                            <?php foreach ($expense_categories as $category): ?>
                            <div class="mb-4">
                                <div class="flex items-center">
                                    <div class="flex-grow">
                                        <div class="font-medium"><?php echo esc_html($category->category); ?></div>
                                        <div class="text-slate-500 text-xs">
                                            <?php echo $category->transaction_count; ?> transactions
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-medium">$<?php echo number_format($category->total_amount, 2); ?></div>
                                        <div class="text-slate-500 text-xs">
                                            Avg: $<?php echo number_format($category->average_amount, 2); ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <!-- Recent Transactions -->
                    <div class="col-span-12">
                        <div class="box p-5">
                            <div class="font-medium mb-3">Recent Transactions</div>
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th class="whitespace-nowrap">Date</th>
                                            <th class="whitespace-nowrap">Description</th>
                                            <th class="whitespace-nowrap">Project</th>
                                            <th class="whitespace-nowrap">Category</th>
                                            <th class="whitespace-nowrap">Submitted By</th>
                                            <th class="text-right whitespace-nowrap">Amount</th>
                                            <th class="text-center whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recent_transactions as $transaction): ?>
                                        <tr>
                                            <td><?php echo date('M d, Y', strtotime($transaction->expense_date)); ?></td>
                                            <td><?php echo esc_html($transaction->description); ?></td>
                                            <td><?php echo esc_html($transaction->project_name); ?></td>
                                            <td><?php echo esc_html($transaction->category); ?></td>
                                            <td><?php echo esc_html($transaction->first_name . ' ' . $transaction->last_name); ?></td>
                                            <td class="text-right">$<?php echo number_format($transaction->amount, 2); ?></td>
                                            <td class="text-center">
                                                <div class="flex items-center justify-center <?php echo $transaction->status === 'approved' ? 'text-success' : ($transaction->status === 'pending' ? 'text-warning' : 'text-danger'); ?>">
                                                    <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> 
                                                    <?php echo ucfirst(esc_html($transaction->status)); ?>
                                                </div>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Financial Overview -->
    </div>
</div>

<?php get_footer(); ?>
