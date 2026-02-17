<!-- BEGIN: Admin Section -->
<div class="col-span-12">
    <div class="intro-y flex items-center">
        <h2 class="text-lg font-medium truncate mr-5">
            <i data-lucide="shield" class="w-5 h-5 inline mr-2"></i>
            Admin Overview
        </h2>
        <a href="<?php echo home_url('/admin'); ?>" class="ml-auto text-primary hover:text-primary-dark">
            View Full Dashboard →
        </a>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mt-5">
        <!-- Total Users -->
        <div class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="admin-stat-total-users">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Total Users</div>
                        <div class="text-slate-500 mt-1">System wide</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Users -->
        <div class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="admin-stat-active-users">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="user-check" class="report-box__icon text-success"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Active Users</div>
                        <div class="text-slate-500 mt-1">Last 30 days</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Actions -->
        <div class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex items-center">
                        <div class="text-3xl font-medium leading-8 mt-6" id="admin-stat-pending-actions">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="flex-none ml-auto relative">
                            <i data-lucide="alert-circle" class="report-box__icon text-danger"></i>
                        </div>
                    </div>
                    <div class="mt-2 text-base text-slate-500">
                        <div class="text-lg font-medium truncate">Pending Actions</div>
                        <div class="text-slate-500 mt-1">Requires attention</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="font-medium text-base mb-4">Quick Actions</div>
                    <a href="<?php echo home_url('/admin/users'); ?>"
                        class="flex items-center p-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                        <i data-lucide="users" class="w-4 h-4 text-primary mr-3"></i>
                        <div>
                            <div class="font-medium">Manage Users</div>
                            <div class="text-xs text-slate-500 mt-0.5">View all users</div>
                        </div>
                    </a>
                    <a href="<?php echo home_url('/admin/roles'); ?>"
                        class="flex items-center p-2 rounded-md bg-success/10 hover:bg-success/20 transition-colors">
                        <i data-lucide="shield" class="w-4 h-4 text-success mr-3"></i>
                        <div>
                            <div class="font-medium">Roles & Permissions</div>
                            <div class="text-xs text-slate-500 mt-0.5">Configure access</div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Admin Section -->

<script>
    // Listen for unified dashboard data event
    (function ($) {
        $(document).ready(function () {
            $(document).on('dashboard:data:loaded', function (e, data) {
                const adminData = data.admin || {};

                // Update admin stats from shared data
                if (adminData.total_users !== undefined) {
                    $('#admin-stat-total-users').text(adminData.total_users);
                }
                if (adminData.active_users !== undefined) {
                    $('#admin-stat-active-users').text(adminData.active_users);
                }
                if (adminData.pending_actions !== undefined) {
                    $('#admin-stat-pending-actions').text(adminData.pending_actions);
                }
            });
        });
    })(jQuery);
</script>