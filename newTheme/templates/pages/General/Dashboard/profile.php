<?php /* Template Name: Dashboard: Profile */
?>

<?php
get_header();
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php"; ?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 box lg:col-span-8 2xl:col-span-9">
        <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 class="font-medium text-base mr-auto">Overview</h2>
        </div>
        <div class="h-[290px]" style="background-image: url(<?= !empty($staff->cover) ? $staff->cover : 'https://staff.stanforteedge.com/wp-content/uploads/2024/02/user.png'; ?>); background-size: cover;">
        </div>
        <div class="shadow p-8" style="margin-top: -100px;">
            <div class="flex rounded bg-white p-5 flex-col lg:flex-row border-b border-slate-200/60 dark:border-darkmode-400 pb-5 -mx-5">
                <div class="flex px-5  items-center justify-center lg:justify-start">
                    <div class="w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative">
                        <img alt="Profile Picture" class="rounded-full" src="<?= !empty($staff->pic) ? $staff->pic : 'https://staff.stanforteedge.com/wp-content/uploads/2024/02/user.png'; ?>">
                    </div>
                    <div class="ml-5">
                        <div class="w-24 sm:w-40 sm:whitespace-normal font-medium text-lg"><?= $staff->first_name . ' ' . $staff->last_name; ?></div>
                        <div class="text-slate-500"><em><?= $staff->position; ?></em></div>
                        <div class=" mt-1"><?= ($staff->team_status == 1) ? "$staff->team_name Team - Lead" : "$staff->team_name Team"; ?></div>
                    </div>
                </div>
                <div class="mt-6 lg:mt-0 flex-1 px-5 border-l border-r border-slate-200/60 dark:border-darkmode-400 border-t lg:border-t-0 pt-5 lg:pt-0">
                    <div class="font-medium sm:text-center lg:text-left lg:mt-3">Contact Details</div>
                    <div class="flex flex-col sm:justify-center sm:items-center lg:items-start mt-4">
                        <?php if ($staff->email) : ?>
                            <div class="truncate sm:whitespace-normal flex sm:items-center"> <i data-lucide="mail" class="w-4 h-4 mr-2"></i> <?= $staff->email; ?></div>
                        <?php endif; ?>
                        <?php if ($staff->phone) : ?>
                            <div class="truncate sm:whitespace-normal flex sm:items-center mt-3"> <i data-lucide="instagram" class="w-4 h-4 mr-2"></i> <?= $staff->phone; ?></div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>



        <div class="mt-6 lg:mt-0 flex-1 flex items-center hidden justify-center px-5 border-t lg:border-0 border-slate-200/60 dark:border-darkmode-400 pt-5 lg:pt-0">
            <div class="text-center rounded-md w-20 py-3">
                <div class="font-medium text-primary text-xl">201</div>
                <div class="text-slate-500">Orders</div>
            </div>
            <div class="text-center rounded-md w-20 py-3">
                <div class="font-medium text-primary text-xl">1k</div>
                <div class="text-slate-500">Purchases</div>
            </div>
            <div class="text-center rounded-md w-20 py-3">
                <div class="font-medium text-primary text-xl">492</div>
                <div class="text-slate-500">Reviews</div>
            </div>
        </div>

    </div>
</div>

<?php get_footer(); ?>