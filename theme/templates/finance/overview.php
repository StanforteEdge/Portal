<?php /* Template Name: Finance: Overview */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Overview';

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
                Financial Overview
            </h2>
        </div>
        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- BEGIN: Data List -->
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <!-- Add your overview content here -->
                <div class="grid grid-cols-12 gap-6 mt-5">
                    <!-- Income Summary -->
                    <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                        <div class="report-box zoom-in">
                            <div class="box p-5">
                                <div class="flex">
                                    <i data-lucide="dollar-sign" class="report-box__icon text-primary"></i>
                                </div>
                                <div class="text-3xl font-medium leading-8 mt-6">₦0.00</div>
                                <div class="text-base text-slate-500 mt-1">Total Income</div>
                            </div>
                        </div>
                    </div>
                    <!-- Expenses Summary -->
                    <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                        <div class="report-box zoom-in">
                            <div class="box p-5">
                                <div class="flex">
                                    <i data-lucide="credit-card" class="report-box__icon text-pending"></i>
                                </div>
                                <div class="text-3xl font-medium leading-8 mt-6">₦0.00</div>
                                <div class="text-base text-slate-500 mt-1">Total Expenses</div>
                            </div>
                        </div>
                    </div>
                    <!-- Budget Summary -->
                    <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                        <div class="report-box zoom-in">
                            <div class="box p-5">
                                <div class="flex">
                                    <i data-lucide="monitor" class="report-box__icon text-warning"></i>
                                </div>
                                <div class="text-3xl font-medium leading-8 mt-6">₦0.00</div>
                                <div class="text-base text-slate-500 mt-1">Budget Balance</div>
                            </div>
                        </div>
                    </div>
                    <!-- Pending Requests -->
                    <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                        <div class="report-box zoom-in">
                            <div class="box p-5">
                                <div class="flex">
                                    <i data-lucide="user" class="report-box__icon text-success"></i>
                                </div>
                                <div class="text-3xl font-medium leading-8 mt-6">0</div>
                                <div class="text-base text-slate-500 mt-1">Pending Requests</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- END: Data List -->
        </div>
    </div>
    <!-- END: Content -->
</div>

<?php get_footer(); ?>
