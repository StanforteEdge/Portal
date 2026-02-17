<?php /* Template Name: Staff: Team Overview */
?>

<?php
get_header();
$b_link = '/team';
$b_title = 'Team';
$p_title = 'Team Overview';

include get_template_directory() . "/layout/menu.php";

// Get team information
$team_members = $wpdb->get_results("
    SELECT a.*, b.first_name, b.last_name, b.email, b.pic, c.position
    FROM staff_jet_cct_team_members a 
    LEFT JOIN staff_jet_cct_profiles b ON a.staff = b._ID
    LEFT JOIN staff_jet_cct_job_descriptions c ON b.role = c._ID
    WHERE a.team = {$staff->team}
");

// Get team performance metrics
$team_metrics = $wpdb->get_row("
    SELECT 
        COUNT(DISTINCT p._ID) as total_projects,
        COUNT(DISTINCT t._ID) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t._ID END) as completed_tasks
    FROM staff_jet_cct_team_members tm
    LEFT JOIN staff_jet_cct_projects p ON tm.team = p.team
    LEFT JOIN staff_jet_cct_tasks t ON tm.staff = t.assigned_to
    WHERE tm.team = {$staff->team}
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Team Menu -->
    <?php include get_template_directory() . "/layout/team-menu.php"; ?>
    <!-- END: Team Menu -->
    
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <!-- BEGIN: Team Overview -->
        <div class="intro-y box lg:mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Team Overview</h2>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-6">
                    <!-- Team Stats -->
                    <div class="col-span-12 sm:col-span-4">
                        <div class="box p-5 zoom-in">
                            <div class="flex">
                                <i data-lucide="users" class="w-10 h-10 text-primary"></i>
                                <div class="ml-auto">
                                    <div class="text-3xl font-medium leading-8 mt-6"><?php echo count($team_members); ?></div>
                                    <div class="text-base text-slate-500 mt-1">Team Members</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 sm:col-span-4">
                        <div class="box p-5 zoom-in">
                            <div class="flex">
                                <i data-lucide="briefcase" class="w-10 h-10 text-pending"></i>
                                <div class="ml-auto">
                                    <div class="text-3xl font-medium leading-8 mt-6"><?php echo $team_metrics->total_projects; ?></div>
                                    <div class="text-base text-slate-500 mt-1">Active Projects</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 sm:col-span-4">
                        <div class="box p-5 zoom-in">
                            <div class="flex">
                                <i data-lucide="check-square" class="w-10 h-10 text-success"></i>
                                <div class="ml-auto">
                                    <div class="text-3xl font-medium leading-8 mt-6">
                                        <?php 
                                        if ($team_metrics->total_tasks > 0) {
                                            echo round(($team_metrics->completed_tasks / $team_metrics->total_tasks) * 100);
                                        } else {
                                            echo "0";
                                        }
                                        ?>%
                                    </div>
                                    <div class="text-base text-slate-500 mt-1">Task Completion Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Team Members List -->
                    <div class="col-span-12">
                        <div class="box">
                            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                                <h2 class="font-medium text-base mr-auto">Team Members</h2>
                            </div>
                            <div class="p-5">
                                <div class="grid grid-cols-12 gap-6">
                                    <?php foreach ($team_members as $member): ?>
                                    <div class="col-span-12 sm:col-span-6 xl:col-span-4">
                                        <div class="box p-5">
                                            <div class="flex">
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
                                            <div class="mt-4">
                                                <div class="flex items-center">
                                                    <i data-lucide="mail" class="w-4 h-4 mr-2"></i>
                                                    <a href="mailto:<?php echo esc_attr($member->email); ?>" 
                                                       class="text-slate-500 truncate">
                                                        <?php echo esc_html($member->email); ?>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Team Overview -->
    </div>
</div>

<?php get_footer(); ?>
