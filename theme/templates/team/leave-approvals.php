<?php /* Template Name: Staff: Team Leave Approvals */
?>

<?php
get_header();
$b_link = '/team';
$b_title = 'Team';
$p_title = 'Leave Approvals';

include get_template_directory() . "/layout/menu.php";

// Get pending leave requests for team members
$leave_requests = $wpdb->get_results("
    SELECT 
        l.*,
        p.first_name,
        p.last_name,
        p.pic,
        p.email,
        j.position
    FROM staff_jet_cct_leave_requests l
    JOIN staff_jet_cct_profiles p ON l.staff_id = p._ID
    JOIN staff_jet_cct_job_descriptions j ON p.role = j._ID
    JOIN staff_jet_cct_team_members tm ON p._ID = tm.staff
    WHERE tm.team = {$staff->team}
    AND l.status = 'pending'
    ORDER BY l.created_at DESC
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Team Menu -->
    <?php include get_template_directory() . "/layout/team-menu.php"; ?>
    <!-- END: Team Menu -->
    
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- BEGIN: Leave Approvals -->
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Pending Leave Requests</h2>
            </div>
            <div class="p-5">
                <?php if (empty($leave_requests)): ?>
                <div class="text-center text-slate-500 p-5">
                    <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-2"></i>
                    <p>No pending leave requests</p>
                </div>
                <?php else: ?>
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($leave_requests as $request): ?>
                    <div class="col-span-12">
                        <div class="box p-5">
                            <div class="flex flex-col md:flex-row">
                                <!-- Employee Info -->
                                <div class="flex items-center">
                                    <div class="w-12 h-12 image-fit">
                                        <img alt="<?php echo esc_attr($request->first_name . ' ' . $request->last_name); ?>" 
                                             class="rounded-full" 
                                             src="<?php echo esc_url($request->pic); ?>">
                                    </div>
                                    <div class="ml-4">
                                        <div class="font-medium"><?php echo esc_html($request->first_name . ' ' . $request->last_name); ?></div>
                                        <div class="text-slate-500"><?php echo esc_html($request->position); ?></div>
                                    </div>
                                </div>
                                
                                <!-- Leave Details -->
                                <div class="md:ml-auto mt-4 md:mt-0">
                                    <div class="flex flex-col md:flex-row items-center">
                                        <div class="flex items-center md:mr-6">
                                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                                            <span>
                                                <?php 
                                                echo date('M d, Y', strtotime($request->start_date));
                                                echo ' - ';
                                                echo date('M d, Y', strtotime($request->end_date));
                                                ?>
                                            </span>
                                        </div>
                                        <div class="flex items-center md:mr-6 mt-2 md:mt-0">
                                            <i data-lucide="clock" class="w-4 h-4 mr-2"></i>
                                            <span><?php echo esc_html($request->duration); ?> days</span>
                                        </div>
                                        <div class="flex items-center mt-2 md:mt-0">
                                            <i data-lucide="tag" class="w-4 h-4 mr-2"></i>
                                            <span><?php echo esc_html($request->leave_type); ?></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Leave Reason -->
                            <div class="mt-4 pt-4 border-t">
                                <div class="font-medium mb-2">Reason:</div>
                                <p class="text-slate-500"><?php echo esc_html($request->reason); ?></p>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="mt-4 pt-4 border-t flex justify-end">
                                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" class="inline-flex">
                                    <?php wp_nonce_field('leave_action_nonce', 'leave_nonce'); ?>
                                    <input type="hidden" name="action" value="process_leave_request">
                                    <input type="hidden" name="request_id" value="<?php echo esc_attr($request->_ID); ?>">
                                    
                                    <button type="submit" name="leave_action" value="reject" 
                                            class="btn btn-outline-danger mr-2">
                                        Reject
                                    </button>
                                    <button type="submit" name="leave_action" value="approve" 
                                            class="btn btn-primary">
                                        Approve
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <!-- END: Leave Approvals -->
    </div>
</div>

<?php get_footer(); ?>
