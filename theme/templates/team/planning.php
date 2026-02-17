<?php /* Template Name: Staff: Team Resource Planning */
?>

<?php
get_header();
$b_link = '/team';
$b_title = 'Team';
$p_title = 'Resource Planning';

include get_template_directory() . "/layout/menu.php";

// Get team members with their current assignments
$team_resources = $wpdb->get_results("
    SELECT 
        p.*,
        tm.staff as staff_id,
        p.first_name,
        p.last_name,
        p.pic,
        j.position,
        GROUP_CONCAT(DISTINCT pr.name) as current_projects,
        COUNT(DISTINCT t._ID) as active_tasks,
        COALESCE(SUM(pa.allocation_percentage), 0) as total_allocation
    FROM staff_jet_cct_team_members tm
    JOIN staff_jet_cct_profiles p ON tm.staff = p._ID
    JOIN staff_jet_cct_job_descriptions j ON p.role = j._ID
    LEFT JOIN staff_jet_cct_project_assignments pa ON tm.staff = pa.staff_id
    LEFT JOIN staff_jet_cct_projects pr ON pa.project_id = pr._ID AND pr.status = 'active'
    LEFT JOIN staff_jet_cct_tasks t ON tm.staff = t.assigned_to AND t.status = 'in_progress'
    WHERE tm.team = {$staff->team}
    GROUP BY tm.staff
    ORDER BY p.first_name, p.last_name
");

// Get upcoming leaves
$upcoming_leaves = $wpdb->get_results("
    SELECT 
        p.first_name,
        p.last_name,
        l.start_date,
        l.end_date,
        l.leave_type
    FROM staff_jet_cct_leave_requests l
    JOIN staff_jet_cct_profiles p ON l.staff_id = p._ID
    JOIN staff_jet_cct_team_members tm ON p._ID = tm.staff
    WHERE tm.team = {$staff->team}
    AND l.status = 'approved'
    AND l.start_date >= CURDATE()
    ORDER BY l.start_date ASC
");

// Get upcoming projects
$upcoming_projects = $wpdb->get_results("
    SELECT 
        p.*,
        COUNT(DISTINCT pa.staff_id) as assigned_members
    FROM staff_jet_cct_projects p
    LEFT JOIN staff_jet_cct_project_assignments pa ON p._ID = pa.project_id
    WHERE p.team = {$staff->team}
    AND p.status = 'planned'
    GROUP BY p._ID
    ORDER BY p.start_date ASC
    LIMIT 5
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Team Menu -->
    <?php include get_template_directory() . "/layout/team-menu.php"; ?>
    <!-- END: Team Menu -->
    
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- BEGIN: Resource Allocation -->
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Resource Allocation</h2>
                <a href="<?php echo home_url('/team/planning/allocate'); ?>" class="btn btn-primary">Allocate Resources</a>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($team_resources as $resource): ?>
                    <div class="col-span-12">
                        <div class="box p-5">
                            <div class="flex flex-col md:flex-row">
                                <!-- Employee Info -->
                                <div class="flex items-center">
                                    <div class="w-12 h-12 image-fit">
                                        <img alt="<?php echo esc_attr($resource->first_name . ' ' . $resource->last_name); ?>" 
                                             class="rounded-full" 
                                             src="<?php echo esc_url($resource->pic); ?>">
                                    </div>
                                    <div class="ml-4">
                                        <div class="font-medium"><?php echo esc_html($resource->first_name . ' ' . $resource->last_name); ?></div>
                                        <div class="text-slate-500"><?php echo esc_html($resource->position); ?></div>
                                    </div>
                                </div>

                                <!-- Allocation Metrics -->
                                <div class="md:ml-auto mt-4 md:mt-0">
                                    <div class="grid grid-cols-3 gap-4">
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl"><?php echo $resource->total_allocation; ?>%</div>
                                            <div class="text-slate-500">Allocated</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl"><?php echo $resource->active_tasks; ?></div>
                                            <div class="text-slate-500">Active Tasks</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="font-medium text-primary text-xl"><?php echo 100 - $resource->total_allocation; ?>%</div>
                                            <div class="text-slate-500">Available</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Current Projects -->
                            <?php if ($resource->current_projects): ?>
                            <div class="mt-4 pt-4 border-t">
                                <div class="font-medium mb-2">Current Projects:</div>
                                <div class="flex flex-wrap gap-2">
                                    <?php foreach (explode(',', $resource->current_projects) as $project): ?>
                                    <span class="px-2 py-1 bg-primary/10 rounded-full text-primary">
                                        <?php echo esc_html($project); ?>
                                    </span>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <!-- END: Resource Allocation -->

        <!-- BEGIN: Upcoming Leaves -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Upcoming Leaves</h2>
            </div>
            <div class="p-5">
                <?php if (empty($upcoming_leaves)): ?>
                <div class="text-center text-slate-500 p-5">
                    <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-2"></i>
                    <p>No upcoming leaves</p>
                </div>
                <?php else: ?>
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($upcoming_leaves as $leave): ?>
                    <div class="col-span-12 sm:col-span-6 2xl:col-span-4">
                        <div class="box p-5">
                            <div class="font-medium"><?php echo esc_html($leave->first_name . ' ' . $leave->last_name); ?></div>
                            <div class="flex items-center mt-2">
                                <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                                <span>
                                    <?php 
                                    echo date('M d', strtotime($leave->start_date));
                                    echo ' - ';
                                    echo date('M d, Y', strtotime($leave->end_date));
                                    ?>
                                </span>
                            </div>
                            <div class="flex items-center mt-2">
                                <i data-lucide="tag" class="w-4 h-4 mr-2"></i>
                                <span><?php echo esc_html($leave->leave_type); ?></span>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <!-- END: Upcoming Leaves -->

        <!-- BEGIN: Upcoming Projects -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Upcoming Projects</h2>
            </div>
            <div class="p-5">
                <?php if (empty($upcoming_projects)): ?>
                <div class="text-center text-slate-500 p-5">
                    <i data-lucide="briefcase" class="w-16 h-16 mx-auto mb-2"></i>
                    <p>No upcoming projects</p>
                </div>
                <?php else: ?>
                <div class="grid grid-cols-12 gap-6">
                    <?php foreach ($upcoming_projects as $project): ?>
                    <div class="col-span-12">
                        <div class="box p-5">
                            <div class="flex items-center">
                                <div class="mr-auto">
                                    <div class="font-medium"><?php echo esc_html($project->name); ?></div>
                                    <div class="text-slate-500 mt-1">
                                        <?php echo date('M d, Y', strtotime($project->start_date)); ?> - 
                                        <?php echo date('M d, Y', strtotime($project->end_date)); ?>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <i data-lucide="users" class="w-4 h-4 mr-2"></i>
                                    <span><?php echo $project->assigned_members; ?> members</span>
                                </div>
                            </div>
                            <?php if ($project->description): ?>
                            <div class="mt-4 pt-4 border-t">
                                <p class="text-slate-500"><?php echo esc_html($project->description); ?></p>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <!-- END: Upcoming Projects -->
    </div>
</div>

<?php get_footer(); ?>
