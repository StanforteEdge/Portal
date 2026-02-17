<?php
/**
 * Template Name: Staff: Dashboard
 * Description: Unified dashboard showing role-specific sections for all staff
 */

use App\Core\User\Services\UserService;

$pageTitle = 'Dashboard';
$breadcrumb = [
    ['name' => 'Dashboard']
];
$activeMenu = 'dashboard';

get_header();

$user = wp_get_current_user();
$user_roles = $user->roles;

// Fetch custom profile for proper name display
$profile = UserService::getProfileByWpUserId($user->ID);
$displayName = $profile ? ($profile->first_name ?: $user->display_name) : $user->display_name;
?>

<div class="grid grid-cols-12 gap-6">
    <!-- BEGIN: Welcome Section -->
    <div class="col-span-12 mt-8">
        <div class="intro-y flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-medium mr-5">
                    Welcome back,
                    <span class="font-bold"><?php echo esc_html($displayName); ?></span>!
                </h2>
                <p class="text-slate-500 mt-1"><?php echo date('l, F j, Y'); ?></p>
            </div>
        </div>
    </div>
    <!-- END: Welcome Section -->

    <!-- BEGIN: Personal Stats Grid -->
    <div class="col-span-12 lg:col-span-12 mt-4">
        <div class="intro-y grid grid-cols-12 gap-5 mt-5">

            <!-- PENDING REQUESTS -->

            <div class="intro-y col-span-12 sm:col-span-6">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex items-center">
                            <div class="text-3xl font-medium leading-8 mt-6" id="stat-pending-requests">
                                <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                            </div>
                            <div class="flex-none ml-auto relative">
                                <i data-lucide="file-text" class="report-box__icon text-primary"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-base text-slate-500">
                            <div class="text-lg font-medium truncate">Pending Requests</div>
                            <div class="text-slate-500 mt-1">Updates required</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NOTIFICATIONS -->

            <div class="intro-y col-span-12 sm:col-span-6">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex items-center">
                            <div class="text-3xl font-medium leading-8 mt-6" id="stat-notifications-count">
                                <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                            </div>
                            <div class="flex-none ml-auto relative">
                                <i data-lucide="bell" class="report-box__icon text-primary"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-base text-slate-500">
                            <div class="text-lg font-medium truncate">Notifications</div>
                            <div class="text-slate-500 mt-1">Unread messages</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LEAVE BALANCE (Placeholder) -->
            <div class="col-span-12 sm:col-span-6">
                <div class="intro-y report-box zoom-in cursor-not-allowed opacity-75" title="Coming Soon">
                    <div class="box p-5">
                        <div class="flex items-center">
                            <div class="text-3xl font-medium leading-8 mt-6">
                                --
                            </div>
                            <div class="flex-none ml-auto relative">
                                <i data-lucide="calendar" class="report-box__icon text-success"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-base text-slate-500">
                            <div class="text-lg font-medium truncate">Leave Balance</div>
                            <div class="text-slate-500 mt-1">Days remaining</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PENDING DELIVERABLES (Placeholder) -->
            <div class="col-span-12 sm:col-span-6">
                <div class="intro-y report-box zoom-in cursor-not-allowed opacity-75" title="Coming Soon">
                    <div class="box p-5">
                        <div class="flex items-center">
                            <div class="text-3xl font-medium leading-8 mt-6">
                                --
                            </div>
                            <div class="flex-none ml-auto relative">
                                <i data-lucide="check-square" class="report-box__icon text-pending"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-base text-slate-500">
                            <div class="text-lg font-medium truncate">Pending Deliverables</div>
                            <div class="text-slate-500 mt-1">Action items</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Personal Stats Grid -->

    <!-- BEGIN: Quick Actions & Activity -->
    <div class="col-span-12 lg:col-span-8 mt-4">
        <!-- Quick Actions -->
        <div class="intro-y box p-5">
            <h2 class="text-lg font-medium truncate mr-5 mb-4">Quick Actions</h2>
            <div class="flex flex-wrap gap-4 border-b border-slate-200 pb-4">
                <a href="<?php echo home_url('/requests/new'); ?>" class="btn btn-primary shadow-md">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i> New Request
                </a>
                <a href="<?php echo home_url('/forms'); ?>" class="btn btn-outline-secondary">
                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Fill Form
                </a>
                <a href="<?php echo home_url('/profile'); ?>" class="btn btn-outline-secondary">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i> Update Profile
                </a>
            </div>
            <!-- Activity Feed -->
            <div class="intro-y mt-5">
                <h2 class="text-lg font-medium truncate mr-5 mb-4">Recent Activity</h2>
                <div class="relative overflow-x-auto" id="activity-feed-container">
                    <div class="text-center text-slate-500 py-4">Loading activity...</div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-span-12 lg:col-span-4 mt-4">
        <!-- System Status or Calendar could go here -->
        <div class="intro-y box p-5 h-full">
            <h2 class="text-lg font-medium truncate mr-5 mb-4">System Notices</h2>
            <div class="text-slate-500">No system wide notices</div>
        </div>
    </div>
    <!-- END: Quick Actions & Activity -->

    <!-- BEGIN: Role-Specific Sections (Collapsed/Secondary) -->
    <div class="col-span-12 mt-6 grid grid-cols-12 gap-6">
        <?php
        $isAdmin = current_user_can('manage_options');
        $isFinance = current_user_can('finance.view');

        // If user has both roles, they show side-by-side. If only one, it takes full width (or we can force half width if preferred, but flex/grid usually handles this).
        // User request: "keep each role base section to be half a row". 
        // We will make them col-span-12 lg:col-span-6 so they are half width on large screens.
        ?>

        <?php if ($isAdmin): ?>
            <div class="<?php echo $isFinance ? 'col-span-12 lg:col-span-6' : 'col-span-12'; ?>">
                <div class="intro-y box p-5 mb-5 border-l-4 border-primary h-full">
                    <?php get_template_part('templates/pages/Admin/partials/dashboard-section'); ?>
                </div>
            </div>
        <?php endif; ?>

        <?php if ($isFinance): ?>
            <div class="<?php echo $isAdmin ? 'col-span-12 lg:col-span-6' : 'col-span-12'; ?>">
                <div class="intro-y box p-5 mb-5 border-l-4 border-success h-full">
                    <?php get_template_part('templates/pages/Finance/partials/dashboard-section'); ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
    <!-- END: Role-Specific Sections -->
</div>

<script src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/dashboard.js"></script>

<?php get_footer(); ?>