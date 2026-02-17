<?php /* Template Name: Finance: Income Records */
?>

<?php
get_header();
$b_link = '/finance/income';
$b_title = 'Income';
$p_title = 'Records';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles)) {
    header("Location: " . home_url());
    exit();
}

global $wpdb;

// Demo income records
$demo_records = [
    [
        'id' => 'INC-2024-001',
        'date' => '2024-12-15',
        'amount' => 25000.00,
        'source' => 'Course Registration',
        'category' => 'Tuition',
        'payment_method' => 'Bank Transfer',
        'status' => 'completed',
        'notes' => 'Q1 2025 Advanced Course Registration'
    ],
    [
        'id' => 'INC-2024-002',
        'date' => '2024-12-14',
        'amount' => 15000.00,
        'source' => 'Workshop Fees',
        'category' => 'Training',
        'payment_method' => 'Credit Card',
        'status' => 'pending',
        'notes' => 'Professional Development Workshop'
    ],
    [
        'id' => 'INC-2024-003',
        'date' => '2024-12-10',
        'amount' => 50000.00,
        'source' => 'Corporate Training',
        'category' => 'Enterprise',
        'payment_method' => 'Bank Transfer',
        'status' => 'completed',
        'notes' => 'Tech Corp Annual Training Program'
    ],
    [
        'id' => 'INC-2024-004',
        'date' => '2024-12-05',
        'amount' => 7500.00,
        'source' => 'Certification Fees',
        'category' => 'Certification',
        'payment_method' => 'Online Payment',
        'status' => 'completed',
        'notes' => 'Professional Certification Program'
    ],
    [
        'id' => 'INC-2024-005',
        'date' => '2024-12-01',
        'amount' => 35000.00,
        'source' => 'Consulting Services',
        'category' => 'Services',
        'payment_method' => 'Bank Transfer',
        'status' => 'pending',
        'notes' => 'Educational Consulting Project'
    ]
];

// Calculate statistics
$total_income = array_sum(array_column($demo_records, 'amount'));
$completed_income = array_sum(array_column(
    array_filter($demo_records, fn($record) => $record['status'] === 'completed'),
    'amount'
));
$pending_income = array_sum(array_column(
    array_filter($demo_records, fn($record) => $record['status'] === 'pending'),
    'amount'
));
$completion_rate = ($completed_income / $total_income) * 100;

?>

<div class="wrapper-box">
    <!-- BEGIN: Content -->
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Income Records
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-income-modal">Add New Record</button>
                <div class="dropdown ml-auto sm:ml-0">
                    <button class="dropdown-toggle btn px-2 box" aria-expanded="false" data-tw-toggle="dropdown">
                        <span class="w-5 h-5 flex items-center justify-center">
                            <i class="w-4 h-4" data-lucide="plus"></i>
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

        <!-- BEGIN: Income Statistics -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="dollar-sign" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦<?php echo number_format($total_income, 2); ?></div>
                        <div class="text-base text-slate-500 mt-1">Total Income</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="check-circle" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦<?php echo number_format($completed_income, 2); ?></div>
                        <div class="text-base text-slate-500 mt-1">Completed Payments</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="clock" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦<?php echo number_format($pending_income, 2); ?></div>
                        <div class="text-base text-slate-500 mt-1">Pending Payments</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="activity" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo round($completion_rate); ?>%</div>
                        <div class="text-base text-slate-500 mt-1">Completion Rate</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Income Statistics -->

        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- BEGIN: Data List -->
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">ID</th>
                            <th class="whitespace-nowrap">DATE</th>
                            <th class="text-center whitespace-nowrap">AMOUNT</th>
                            <th class="text-center whitespace-nowrap">SOURCE</th>
                            <th class="text-center whitespace-nowrap">PAYMENT METHOD</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($demo_records as $record) : 
                            $status_class = $record['status'] === 'completed' ? 'text-success' : 'text-warning';
                            $status_text = ucfirst($record['status']);
                        ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <a href="" class="font-medium whitespace-nowrap"><?php echo $record['id']; ?></a>
                                    <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5"><?php echo $record['category']; ?></div>
                                </td>
                                <td class="whitespace-nowrap">
                                    <?php echo date('M d, Y', strtotime($record['date'])); ?>
                                </td>
                                <td class="text-center">₦<?php echo number_format($record['amount'], 2); ?></td>
                                <td class="text-center"><?php echo $record['source']; ?></td>
                                <td class="text-center"><?php echo $record['payment_method']; ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $status_class; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> <?php echo $status_text; ?>
                                    </div>
                                </td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a href="javascript:;" class="flex items-center mr-3">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                                        </a>
                                        <a class="flex items-center text-danger" href="javascript:;">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <!-- END: Data List -->
        </div>
    </div>
    <!-- END: Content -->
</div>

<?php get_footer(); ?>
