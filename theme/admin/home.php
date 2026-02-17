<?php /* Template Name:  Admin */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = '';

include get_template_directory() . "/layout/menu.php";

?>
<div class="grid grid-cols-12 items-end gap-6 mt-5">
    <div class="col-span-12 lg:col-span-8">
        <div class="grid grid-cols-12 items-end gap-6 mt-5">
            <div class="col-span-12 intro-y">
                <a href="/profile">
                    <div class="box p-5 zoom-in">
                        <div class="flex">
                            <i data-lucide="user" class="w-8 h-8 text-pending "></i>
                        </div>
                        <div class="text-2xl font-medium leading-8 mt-6">Hello <?= $staff->first_name; ?></div>
                        <div class="text-base text-slate-500 mt-1">You have 3 new tasks. It's a lot of work today! So let's start!</div>
                        <div class="text-base font-medium mt-1"></div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="/requests">
                    <div class="box p-5  zoom-in">
                        <div class="flex flex-row justify-between align-start">
                            <i data-lucide="file-text" class="w-8 h-8 text-success "></i>
                            <div id="journalCount" class="text-xl font-medium leading-8"></div>
                        </div>
                        <div class="text-2xl font-medium leading-8 mt-6">Requests</div>
                        <div class="text-base text-slate-500 mt-1">Add and Edit notes</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="user" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="submittedCount" class="text-2xl font-medium leading-8 mt-6">Reports</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="search" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Resources</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon </div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="calendar" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Email</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="search" class="w-8 h-8 text-warning "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Notifications</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
        </div>
    </div>
    <div class="col-span-4">

    </div>
</div>

<!-- END: Content -->
</div>
</div>
<script>
    jQuery(document).ready(function($) {
        $.ajax({
            url: 'https://app.unclutter.com.ng/wp-json/app/v1/notes?author=<?= $user->_ID; ?>',
            dataType: 'json',
            success: function(data) {
                var count = 0;

                $('#journalCount').html(data.total_results)
            }
        });

        // $.ajax({
        //     url: 'https://application.carringtonfellows.org/wp-json/dash/v1/applications',
        //     dataType: 'json',
        //     success: function(data) {
        //         var count = 0;

        //         $('#appListCount').html(data.total_results)

        //         // loop through data and count non-empty values in given field
        //         $.each(data.results, function(index, record) {
        //             if (record.status) {
        //                 count++;
        //             }
        //         });
        //     }
        // });

        // $.ajax({
        //     url: 'https://application.carringtonfellows.org/wp-json/dash/v1/applicants',
        //     dataType: 'json',
        //     success: function(data) {
        //         $('#applicantsCount').html(data.total_results)
        //     }
        // });

        // $.ajax({
        //     url: 'https://dashboard.carringtonfellows.org/wp-json/jet-cct/markers',
        //     dataType: 'json',
        //     success: function(data) {
        //         var numResults = data.length;
        //         $('#markersCount').html(numResults)
        //     }
        // });
    });
</script>

<?php get_footer(); ?>