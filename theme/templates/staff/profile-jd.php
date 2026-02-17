<?php /* Template Name: Profile: JD */
?>

<?php
get_header();
$b_link = '/profile';
$b_title = 'Profile';
$p_title = 'Job Description';

include get_template_directory() . "/templates/layout/menu.php";

$team = $wpdb->get_row("SELECT * FROM staff_jet_cct_team_members a WHERE a.staff = $staff->_ID");
$responsibilities = $staff->responsibility;
$responsibilities = str_replace('<ol>', '<ol class="list-lower-alpha ">', $responsibilities);

?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php";?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="grid grid-cols-12 gap-6">
            <!-- BEGIN: Bio -->
            <div id="jd" class="intro-y box col-span-12 2xl:col-span-6">
                <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-lg text-base mr-auto"><?= $staff->position; ?> - Job Description</h2>
                </div>
                
                <div class="p-5">
                    <?php if ($staff->role) : ?>
                        <div class="mb-4">
                            <div class="font-medium pb-2 border-b mb-2 ">Summary:</div>
                            <?= htmlspecialchars_decode($staff->summary); ?>
                        </div>
                        <div>
                        <div class="font-medium pb-2 border-b mb-2">Key Responsibilities:</div>
                            <?= htmlspecialchars_decode($responsibilities); ?>
                        </div>
                    <?php else : ?>
                        No Job Description is Specified.
                    <?php endif; ?>
                </div>

            </div>
            <!-- END: BIo -->

        </div>
    </div>
</div>

<?php get_footer(); ?>