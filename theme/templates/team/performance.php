<?php /* Template Name: Staff: Team Performance Reviews */
?>

<?php
get_header();
$b_link = '/team';
$b_title = 'Team';
$p_title = 'Performance Reviews';

include get_template_directory() . "/layout/menu.php";

// Get team members with their performance metrics
$team_performance = $wpdb->get_results("
    SELECT 
        p.*,
        tm.staff as staff_id,
        p.first_name,
        p.last_name,
        p.pic,
        j.position,
        COUNT(DISTINCT t._ID) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t._ID END) as completed_tasks,
        COUNT(DISTINCT pr._ID) as total_projects,
        MAX(pa.review_date) as last_review_date,
        pa.overall_rating as last_rating
    FROM staff_jet_cct_team_members tm
    JOIN staff_jet_cct_profiles p ON tm.staff = p._ID
    JOIN staff_jet_cct_job_descriptions j ON p.role = j._ID
    LEFT JOIN staff_jet_cct_tasks t ON tm.staff = t.assigned_to
    LEFT JOIN staff_jet_cct_project_assignments pa ON tm.staff = pa.staff_id
    LEFT JOIN staff_jet_cct_projects pr ON pa.project_id = pr._ID
    LEFT JOIN staff_jet_cct_performance_appraisals pa ON tm.staff = pa.staff_id
    WHERE tm.team = {$staff->team}
    GROUP BY tm.staff
    ORDER BY p.first_name, p.last_name
");

// Get upcoming reviews
$upcoming_reviews = $wpdb->get_results("
    SELECT 
        p.first_name,
        p.last_name,
        p.pic,
        j.position,
        pr.scheduled_date,
        pr.review_type
    FROM staff_jet_cct_performance_reviews pr
    JOIN staff_jet_cct_profiles p ON pr.staff_id = p._ID
    JOIN staff_jet_cct_job_descriptions j ON p.role = j._ID
    JOIN staff_jet_cct_team_members tm ON p._ID = tm.staff
    WHERE tm.team = {$staff->team}
    AND pr.status = 'scheduled'
    AND pr.scheduled_date >= CURDATE()
    ORDER BY pr.scheduled_date ASC
    LIMIT 5
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Team Menu -->
    <?php include get_template_directory() . "/layout/team-menu.php"; ?>
    <!-- END: Team Menu -->
    
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- BEGIN: Upcoming Reviews -->
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Upcoming Reviews</h2>
                <a href="<?php echo home_url('/team/performance/schedule'); ?>" class="btn btn-primary">Schedule Review</a>
            </div>
            <div class="p-5">
                <?php if (empty($upcoming_reviews)): ?>
                <div class="text-center text-slate-500 p-5">
                    <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-2"></i>
                    <p>No upcoming reviews scheduled</p>
                </div>
                <?php else: ?>
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($upcoming_reviews as $review): ?>
                    <div class="col-span-12 sm:col-span-6 2xl:col-span-4">
                        <div class="box p-5">
                            <div class="flex items-center">
                                <div class="w-12 h-12 image-fit">
                                    <img alt="<?php echo esc_attr($review->first_name . ' ' . $review->last_name); ?>" 
                                         class="rounded-full" 
                                         src="<?php echo esc_url($review->pic); ?>">
                                </div>
                                <div class="ml-4">
                                    <div class="font-medium"><?php echo esc_html($review->first_name . ' ' . $review->last_name); ?></div>
                                    <div class="text-slate-500"><?php echo esc_html($review->position); ?></div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <div class="flex items-center">
                                    <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                                    <span><?php echo date('M d, Y', strtotime($review->scheduled_date)); ?></span>
                                </div>
                                <div class="flex items-center mt-2">
                                    <i data-lucide="tag" class="w-4 h-4 mr-2"></i>
                                    <span><?php echo esc_html($review->review_type); ?></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <!-- END: Upcoming Reviews -->

        <!-- BEGIN: Team Performance -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Team Performance Overview</h2>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($team_performance as $member): ?>
                    <div class="col-span-12">
                        <div class="box p-5">
                            <div class="flex flex-col md:flex-row">
                                <!-- Employee Info -->
                                <div class="flex items-center">
                                    <div class="w-12 h-12 image-fit">
                                        <img alt="<?php echo esc_attr($member->first_name . ' ' . $member->last_name); ?>" 
                                             class="rounded-full" 
                                             src="<?php echo esc_url($member->pic); ?>">
                                    </div>
                                    <div class="ml-4">
                                        <div class="font-medium"><?php echo esc_html($member->first_name . ' ' . $member->last_name); ?></div>
                                        <div class="text-slate-500"><?php echo esc_html($member->position); ?></div>
                                    </div>
                                </div>

                                <!-- Performance Metrics -->
                                <div class="md:ml-auto mt-4 md:mt-0">
                                    <div class="grid grid-cols-3 gap-4">
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl">
                                                <?php 
                                                if ($member->total_tasks > 0) {
                                                    echo round(($member->completed_tasks / $member->total_tasks) * 100);
                                                } else {
                                                    echo "0";
                                                }
                                                ?>%
                                            </div>
                                            <div class="text-slate-500">Task Completion</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl"><?php echo $member->total_projects; ?></div>
                                            <div class="text-slate-500">Projects</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl">
                                                <?php echo $member->last_rating ? $member->last_rating : 'N/A'; ?>
                                            </div>
                                            <div class="text-slate-500">Last Rating</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="mt-4 pt-4 border-t flex justify-end">
                                <a href="<?php echo home_url('/team/performance/history/' . $member->staff_id); ?>" 
                                   class="btn btn-outline-secondary mr-2">
                                    View History
                                </a>
                                <a href="<?php echo home_url('/team/performance/review/' . $member->staff_id); ?>" 
                                   class="btn btn-primary">
                                    Start Review
                                </a>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <!-- END: Team Performance -->
    </div>
</div>

<?php get_footer(); ?>
