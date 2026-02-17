<!-- BEGIN: Profile Section -->
<div class="col-span-12 mt-8">
    <div class="intro-y flex items-center h-10">
        <h2 class="text-lg font-medium truncate mr-5">
            <i data-lucide="user" class="w-5 h-5 inline mr-2"></i>
            My Profile
        </h2>
        <a href="<?php echo home_url('/profile'); ?>" class="ml-auto text-primary hover:text-primary-dark">
            View Full Profile →
        </a>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Profile Info Card -->
        <div class="col-span-12 lg:col-span-6 intro-y">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200 pb-5 mb-5">
                    <div class="w-16 h-16 image-fit">
                        <?php echo get_avatar(get_current_user_id(), 64, '', '', array('class' => 'rounded-full')); ?>
                    </div>
                    <div class="ml-4">
                        <div class="font-medium text-base">
                            <?php echo esc_html(wp_get_current_user()->display_name); ?>
                        </div>
                        <div class="text-slate-500 text-sm">
                            <?php echo esc_html(wp_get_current_user()->user_email); ?>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center">
                        <i data-lucide="mail" class="w-4 h-4 text-slate-500 mr-3"></i>
                        <span class="text-sm">
                            <?php echo esc_html(wp_get_current_user()->user_email); ?>
                        </span>
                    </div>
                    <div class="flex items-center">
                        <i data-lucide="shield" class="w-4 h-4 text-slate-500 mr-3"></i>
                        <span class="text-sm capitalize">
                            <?php echo esc_html(implode(', ', wp_get_current_user()->roles)); ?>
                        </span>
                    </div>
                </div>

                <div class="mt-5 pt-5 border-t border-slate-200">
                    <a href="<?php echo home_url('/profile/edit'); ?>" class="btn btn-primary w-full">
                        <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                        Edit Profile
                    </a>
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="col-span-12 lg:col-span-6 intro-y">
            <div class="box p-5">
                <div class="font-medium text-base mb-4">Quick Stats</div>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div
                                class="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <i data-lucide="file-text" class="w-5 h-5"></i>
                            </div>
                            <span class="ml-3 text-sm">Available Forms</span>
                        </div>
                        <div class="font-medium" id="profile-stat-forms">-</div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div
                                class="w-10 h-10 flex items-center justify-center rounded-full bg-success/10 text-success">
                                <i data-lucide="check-square" class="w-5 h-5"></i>
                            </div>
                            <span class="ml-3 text-sm">My Submissions</span>
                        </div>
                        <div class="font-medium" id="profile-stat-submissions">-</div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div
                                class="w-10 h-10 flex items-center justify-center rounded-full bg-warning/10 text-warning">
                                <i data-lucide="inbox" class="w-5 h-5"></i>
                            </div>
                            <span class="ml-3 text-sm">My Requests</span>
                        </div>
                        <div class="font-medium" id="profile-stat-requests">-</div>
                    </div>
                </div>

                <div class="mt-5 pt-5 border-t border-slate-200">
                    <a href="<?php echo home_url('/forms'); ?>" class="btn btn-outline-primary w-full">
                        <i data-lucide="file-plus" class="w-4 h-4 mr-2"></i>
                        Browse Forms
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Profile Section -->

<script>
    // Load profile stats from unified dashboard endpoint
    document.addEventListener('DOMContentLoaded', async function () {
        try {
            const token = localStorage.getItem('jwt_token') || '';

            // Single unified endpoint call
            const response = await fetch('/wp-json/api/v1/dashboard/summary', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const data = await response.json();
                const staffData = data.data?.staff || {};

                // Update profile stats from unified response
                if (staffData.forms_count !== undefined) {
                    document.getElementById('profile-stat-forms').textContent = staffData.forms_count;
                }
                if (staffData.submissions_count !== undefined) {
                    document.getElementById('profile-stat-submissions').textContent = staffData.submissions_count;
                }
                if (staffData.requests_count !== undefined) {
                    document.getElementById('profile-stat-requests').textContent = staffData.requests_count;
                }
            }
        } catch (e) {
            console.error('Failed to load profile stats', e);
        }
    });
</script>