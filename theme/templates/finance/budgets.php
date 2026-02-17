<?php /* Template Name: Finance: Budgets */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Budgets';

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
                Budget Management
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-budget-modal">Create Budget</button>
            </div>
        </div>

        <!-- Budget Overview Cards -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="dollar-sign" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦360,000</div>
                        <div class="text-base text-slate-500 mt-1">Total Budget</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="activity" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦180,000</div>
                        <div class="text-base text-slate-500 mt-1">Utilized</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="target" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦180,000</div>
                        <div class="text-base text-slate-500 mt-1">Available</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="pie-chart" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">60%</div>
                        <div class="text-base text-slate-500 mt-1">Utilization Rate</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Budget List -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">PROJECT</th>
                            <th class="text-center whitespace-nowrap">DEPARTMENT</th>
                            <th class="text-center whitespace-nowrap">ALLOCATED</th>
                            <th class="text-center whitespace-nowrap">UTILIZED</th>
                            <th class="text-center whitespace-nowrap">AVAILABLE</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        // Demo project budgets
                        $demo_budgets = [
                            [
                                'project' => 'Inclusive Education Initiative',
                                'department' => 'Education',
                                'amount' => 75000,
                                'utilized' => 33750,
                                'year' => 2025,
                                'month' => 1
                            ],
                            [
                                'project' => 'Staff Training Program',
                                'department' => 'Human Resources',
                                'amount' => 45000,
                                'utilized' => 15000,
                                'year' => 2025,
                                'month' => 2
                            ],
                            [
                                'project' => 'Technology Infrastructure Upgrade',
                                'department' => 'IT',
                                'amount' => 120000,
                                'utilized' => 85000,
                                'year' => 2025,
                                'month' => 1
                            ],
                            [
                                'project' => 'Community Outreach Program',
                                'department' => 'Public Relations',
                                'amount' => 25000,
                                'utilized' => 24500,
                                'year' => 2024,
                                'month' => 12
                            ],
                            [
                                'project' => 'Research Development Initiative',
                                'department' => 'Research',
                                'amount' => 95000,
                                'utilized' => 45000,
                                'year' => 2025,
                                'month' => 3
                            ]
                        ];

                        $total_budget = 0;
                        $total_utilized = 0;

                        foreach ($demo_budgets as $budget) :
                            $available = $budget['amount'] - $budget['utilized'];
                            $total_budget += $budget['amount'];
                            $total_utilized += $budget['utilized'];
                        ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <div class="font-medium whitespace-nowrap"><?php echo $budget['project']; ?></div>
                                    <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                                        <?php echo date('F Y', strtotime($budget['year'] . '-' . $budget['month'] . '-01')); ?>
                                    </div>
                                </td>
                                <td class="text-center"><?php echo $budget['department']; ?></td>
                                <td class="text-center">₦<?php echo number_format($budget['amount'], 2); ?></td>
                                <td class="text-center">₦<?php echo number_format($budget['utilized'], 2); ?></td>
                                <td class="text-center">₦<?php echo number_format($available, 2); ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $available > 0 ? 'text-success' : 'text-danger'; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> 
                                        <?php echo $available > 0 ? 'Active' : 'Depleted'; ?>
                                    </div>
                                </td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <button class="flex items-center mr-3" data-tw-toggle="modal" data-tw-target="#edit-budget-modal-<?php echo $budget['project']; ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                                        </button>
                                        <button class="flex items-center text-danger" data-tw-toggle="modal" data-tw-target="#delete-modal-<?php echo $budget['project']; ?>">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; 
                        
                        // Update overview cards with totals
                        $total_available = $total_budget - $total_utilized;
                        $utilization_rate = ($total_utilized / $total_budget) * 100;
                        ?>
                    </tbody>
                </table>
            </div>
        </div>


    </div>
</div>

<!-- Add Budget Modal -->
<div id="add-budget-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Create New Budget</h2>
            </div>
            <form method="POST">
                <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                    <div class="col-span-12">
                        <label for="department" class="form-label">Department</label>
                        <select id="department" name="department" class="form-select w-full">
                            <option value="">Select Department</option>
                            <!-- Add department options -->
                        </select>
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="month" class="form-label">Month</label>
                        <select id="month" name="month" class="form-select w-full">
                            <?php for ($i = 1; $i <= 12; $i++) : ?>
                                <option value="<?php echo $i; ?>"><?php echo date('F', mktime(0, 0, 0, $i, 1)); ?></option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="year" class="form-label">Year</label>
                        <select id="year" name="year" class="form-select w-full">
                            <?php for ($i = date('Y'); $i <= date('Y') + 2; $i++) : ?>
                                <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label for="amount" class="form-label">Amount</label>
                        <input id="amount" name="amount" type="number" class="form-control w-full" placeholder="Enter budget amount">
                    </div>
                    <div class="col-span-12">
                        <label for="description" class="form-label">Description</label>
                        <textarea id="description" name="description" class="form-control w-full" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="submit" name="create_budget" class="btn btn-primary w-24">Create</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php get_footer(); ?>
