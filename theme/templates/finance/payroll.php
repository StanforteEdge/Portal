<?php /* Template Name: Finance: Payroll */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Payroll';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles)) {
    header("Location: " . home_url());
    exit();
}

global $wpdb;

// Demo payroll data
$payroll_summary = [
    'total_employees' => 85,
    'total_salary' => 45000000.00,
    'average_salary' => 529411.76,
    'next_payday' => '2024-12-25',
    'pending_approvals' => 3,
    'processed_payroll' => 42500000.00,
    'pending_payroll' => 2500000.00,
    'deductions' => 4500000.00
];

// Demo employee payroll records
$payroll_records = [
    [
        'id' => 'EMP-2024-001',
        'name' => 'John Smith',
        'department' => 'Academic',
        'position' => 'Senior Lecturer',
        'basic_salary' => 850000.00,
        'allowances' => 150000.00,
        'deductions' => 95000.00,
        'net_salary' => 905000.00,
        'status' => 'processed',
        'payment_date' => '2024-12-15'
    ],
    [
        'id' => 'EMP-2024-002',
        'name' => 'Mary Johnson',
        'department' => 'Administration',
        'position' => 'HR Manager',
        'basic_salary' => 750000.00,
        'allowances' => 100000.00,
        'deductions' => 85000.00,
        'net_salary' => 765000.00,
        'status' => 'processed',
        'payment_date' => '2024-12-15'
    ],
    [
        'id' => 'EMP-2024-003',
        'name' => 'Robert Chen',
        'department' => 'IT',
        'position' => 'Systems Administrator',
        'basic_salary' => 650000.00,
        'allowances' => 80000.00,
        'deductions' => 73000.00,
        'net_salary' => 657000.00,
        'status' => 'pending',
        'payment_date' => '2024-12-25'
    ],
    [
        'id' => 'EMP-2024-004',
        'name' => 'Sarah Wilson',
        'department' => 'Finance',
        'position' => 'Senior Accountant',
        'basic_salary' => 700000.00,
        'allowances' => 90000.00,
        'deductions' => 79000.00,
        'net_salary' => 711000.00,
        'status' => 'processed',
        'payment_date' => '2024-12-15'
    ],
    [
        'id' => 'EMP-2024-005',
        'name' => 'Michael Brown',
        'department' => 'Academic',
        'position' => 'Professor',
        'basic_salary' => 950000.00,
        'allowances' => 200000.00,
        'deductions' => 115000.00,
        'net_salary' => 1035000.00,
        'status' => 'pending',
        'payment_date' => '2024-12-25'
    ]
];

?>

<div class="wrapper-box">
    <!-- BEGIN: Content -->
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Payroll Management
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <button class="btn btn-primary shadow-md mr-2">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Process Payroll
                </button>
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

        <!-- BEGIN: Payroll Statistics -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $payroll_summary['total_employees']; ?></div>
                        <div class="text-base text-slate-500 mt-1">Total Employees</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="credit-card" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦<?php echo number_format($payroll_summary['total_salary']); ?></div>
                        <div class="text-base text-slate-500 mt-1">Total Salary</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="alert-circle" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $payroll_summary['pending_approvals']; ?></div>
                        <div class="text-base text-slate-500 mt-1">Pending Approvals</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="calendar" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo date('M d', strtotime($payroll_summary['next_payday'])); ?></div>
                        <div class="text-base text-slate-500 mt-1">Next Payday</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Payroll Statistics -->

        <!-- BEGIN: Payroll List -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">EMPLOYEE ID</th>
                            <th class="whitespace-nowrap">NAME</th>
                            <th class="text-center whitespace-nowrap">DEPARTMENT</th>
                            <th class="text-center whitespace-nowrap">BASIC SALARY</th>
                            <th class="text-center whitespace-nowrap">ALLOWANCES</th>
                            <th class="text-center whitespace-nowrap">DEDUCTIONS</th>
                            <th class="text-center whitespace-nowrap">NET SALARY</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($payroll_records as $record) : 
                            $status_class = $record['status'] === 'processed' ? 'text-success' : 'text-warning';
                            $status_text = ucfirst($record['status']);
                        ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <a href="" class="font-medium whitespace-nowrap"><?php echo $record['id']; ?></a>
                                </td>
                                <td>
                                    <a href="" class="font-medium whitespace-nowrap"><?php echo $record['name']; ?></a>
                                    <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5"><?php echo $record['position']; ?></div>
                                </td>
                                <td class="text-center"><?php echo $record['department']; ?></td>
                                <td class="text-center">₦<?php echo number_format($record['basic_salary']); ?></td>
                                <td class="text-center">₦<?php echo number_format($record['allowances']); ?></td>
                                <td class="text-center">₦<?php echo number_format($record['deductions']); ?></td>
                                <td class="text-center">₦<?php echo number_format($record['net_salary']); ?></td>
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
                                        <a href="javascript:;" class="flex items-center mr-3">
                                            <i data-lucide="printer" class="w-4 h-4 mr-1"></i> Print
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <!-- END: Payroll List -->
    </div>
    <!-- END: Content -->
</div>

<?php get_footer(); ?>
