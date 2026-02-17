<?php
/* Template Name: Admin: Dashboard */

$pageTitle = 'Admin Dashboard';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Overview']
];
$activeMenu = 'admin';

wp_enqueue_script(
    'stanforte-admin-dashboard',
    get_template_directory_uri() . '/assets/js/pages/admin/dashboard.js',
    ['jquery', 'stanforte-data-client'],
    filemtime(get_template_directory() . '/assets/js/pages/admin/dashboard.js'),
    true
);

get_header();
?>

<div class="grid grid-cols-12 gap-6">
    <!-- BEGIN: Stats Overview -->
    <div class="col-span-12 mt-8">
        <div class="intro-y flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">
                System Overview
            </h2>
        </div>
        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- Total Users -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                            <div class="ml-auto">
                                <div class="report-box__indicator bg-success tooltip cursor-pointer" title="Active users">
                                    <i data-lucide="chevron-up" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-users">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="text-base text-slate-500 mt-1">Total Users</div>
                    </div>
                </div>
            </div>
            
            <!-- Active Users -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-check" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-active-users">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="text-base text-slate-500 mt-1">Active Users</div>
                    </div>
                </div>
            </div>
            
            <!-- Total Roles -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="shield" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-roles">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="text-base text-slate-500 mt-1">System Roles</div>
                    </div>
                </div>
            </div>
            
            <!-- Pending Actions -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="alert-circle" class="report-box__icon text-danger"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-pending-actions">
                            <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                        </div>
                        <div class="text-base text-slate-500 mt-1">Pending Actions</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Stats Overview -->

    <!-- BEGIN: Quick Actions -->
    <div class="col-span-12 lg:col-span-6 mt-8">
        <div class="intro-y block sm:flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">
                Quick Actions
            </h2>
        </div>
        <div class="intro-y box p-5 mt-5">
            <div class="grid grid-cols-2 gap-4">
                <a href="<?php echo home_url('/admin/users'); ?>" class="flex items-center p-4 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                    <i data-lucide="users" class="w-8 h-8 text-primary mr-3"></i>
                    <div>
                        <div class="font-medium">Manage Users</div>
                        <div class="text-xs text-slate-500 mt-0.5">View all users</div>
                    </div>
                </a>
                
                <a href="<?php echo home_url('/admin/roles'); ?>" class="flex items-center p-4 rounded-md bg-success/10 hover:bg-success/20 transition-colors">
                    <i data-lucide="shield" class="w-8 h-8 text-success mr-3"></i>
                    <div>
                        <div class="font-medium">Roles & Permissions</div>
                        <div class="text-xs text-slate-500 mt-0.5">Configure access</div>
                    </div>
                </a>
                
                <a href="<?php echo home_url('/admin/notifications'); ?>" class="flex items-center p-4 rounded-md bg-warning/10 hover:bg-warning/20 transition-colors">
                    <i data-lucide="bell" class="w-8 h-8 text-warning mr-3"></i>
                    <div>
                        <div class="font-medium">Notifications</div>
                        <div class="text-xs text-slate-500 mt-0.5">Send announcements</div>
                    </div>
                </a>
                
                <a href="<?php echo home_url('/admin/settings'); ?>" class="flex items-center p-4 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors">
                    <i data-lucide="settings" class="w-8 h-8 text-slate-600 mr-3"></i>
                    <div>
                        <div class="font-medium">Settings</div>
                        <div class="text-xs text-slate-500 mt-0.5">System configuration</div>
                    </div>
                </a>
            </div>
        </div>
    </div>
    <!-- END: Quick Actions -->

    <!-- BEGIN: Recent Activity -->
    <div class="col-span-12 lg:col-span-6 mt-8">
        <div class="intro-y block sm:flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">
                Recent Activity
            </h2>
            <a href="<?php echo home_url('/admin/audit-logs'); ?>" class="sm:ml-auto mt-3 sm:mt-0 text-primary">
                View All
            </a>
        </div>
        <div class="intro-y box p-5 mt-5">
            <div id="recent-activity-list">
                <!-- Loading skeleton -->
                <div class="space-y-4">
                    <?php for ($i = 0; $i < 5; $i++): ?>
                    <div class="flex items-start animate-pulse">
                        <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
                        <div class="ml-3 flex-1">
                            <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <?php endfor; ?>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Recent Activity -->

    <!-- BEGIN: User Distribution by Role -->
    <div class="col-span-12 lg:col-span-6 mt-8">
        <div class="intro-y block sm:flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">
                User Distribution by Role
            </h2>
        </div>
        <div class="intro-y box p-5 mt-5">
            <canvas id="role-distribution-chart" class="mt-3"></canvas>
        </div>
    </div>
    <!-- END: User Distribution by Role -->

    <!-- BEGIN: System Health -->
    <div class="col-span-12 lg:col-span-6 mt-8">
        <div class="intro-y block sm:flex items-center h-10">
            <h2 class="text-lg font-medium truncate mr-5">
                System Health
            </h2>
        </div>
        <div class="intro-y box p-5 mt-5">
            <div class="space-y-4" id="system-health">
                <!-- Database -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i data-lucide="database" class="w-5 h-5 text-slate-500 mr-3"></i>
                        <span>Database</span>
                    </div>
                    <div class="flex items-center">
                        <div class="animate-pulse bg-slate-200 h-6 w-20 rounded"></div>
                    </div>
                </div>
                
                <!-- API -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i data-lucide="server" class="w-5 h-5 text-slate-500 mr-3"></i>
                        <span>API Services</span>
                    </div>
                    <div class="flex items-center">
                        <div class="animate-pulse bg-slate-200 h-6 w-20 rounded"></div>
                    </div>
                </div>
                
                <!-- Storage -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i data-lucide="hard-drive" class="w-5 h-5 text-slate-500 mr-3"></i>
                        <span>Storage</span>
                    </div>
                    <div class="flex items-center">
                        <div class="animate-pulse bg-slate-200 h-6 w-20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: System Health -->
</div>

<?php get_footer(); ?>
