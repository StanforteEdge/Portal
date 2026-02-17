<!-- BEGIN: Finance Section -->
<div class="col-span-12">
    <div class="intro-y flex items-center">
        <h2 class="text-lg font-medium truncate mr-5">
            <i data-lucide="dollar-sign" class="w-5 h-5 inline mr-2"></i>
            Finance Overview
        </h2>
        <a href="<?php echo home_url('/finance'); ?>" class="ml-auto text-primary hover:text-primary-dark">
            View Full Dashboard →
        </a>
    </div>

    <!-- Finance Modules Grid -->
    <div class="grid grid-cols-2 gap-4 mt-5">
        <!-- Requests Module -->
        <a href="<?php echo home_url('/finance/requests'); ?>" class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="finance-count-approvals">
                            -
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="file-text" class="report-box__icon text-blue-600"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Pending Requests</div>
                        <div class="text-slate-500 mt-1">Awaiting approval</div>
                    </div>
                </div>
            </div>
        </a>

        <!-- Vouchers Module -->
        <a href="<?php echo home_url('/finance/requests/pv'); ?>" class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="finance-count-vouchers">
                            -
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="receipt" class="report-box__icon text-amber-600"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">To Generate</div>
                        <div class="text-slate-500 mt-1">Approved requests</div>
                    </div>
                </div>
            </div>
        </a>

        <!-- Retirements Module -->
        <a href="<?php echo home_url('/finance/requests/retirement'); ?>" class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="finance-count-retirements">
                            -
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="check-circle" class="report-box__icon text-green-600"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Pending Review</div>
                        <div class="text-slate-500 mt-1">Awaiting audit</div>
                    </div>
                </div>
            </div>
        </a>

        <!-- Reports Module -->
        <a href="<?php echo home_url('/finance/reports'); ?>" class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6">
                            →
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="bar-chart-2" class="report-box__icon text-purple-600"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Financial Analysis</div>
                        <div class="text-slate-500 mt-1">View reports</div>
                    </div>
                </div>
            </div>
        </a>
    </div>
</div>
<!-- END: Finance Section -->

<script>
    // Listen for unified dashboard data event
    (function ($) {
        $(document).ready(function () {
            $(document).on('dashboard:data:loaded', function (e, data) {
                const financeData = data.finance || {};

                // Update finance stats from shared data
                if (financeData.pending_approvals !== undefined) {
                    $('#finance-count-approvals').text(financeData.pending_approvals);
                }
                if (financeData.vouchers_to_generate !== undefined) {
                    $('#finance-count-vouchers').text(financeData.vouchers_to_generate);
                }
                if (financeData.pending_retirements !== undefined) {
                    $('#finance-count-retirements').text(financeData.pending_retirements);
                }
            });
        });
    })(jQuery);
</script>