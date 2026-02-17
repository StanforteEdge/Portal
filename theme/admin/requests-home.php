<?php /* Template Name:  Admin: Requests - Home */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'All Request';

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";

$query = "
    SELECT
        SUM(CASE WHEN status > 1 THEN 1 ELSE 0 END) AS allcount,
        SUM(CASE WHEN status = 6 THEN 1 ELSE 0 END) AS cleared,
        SUM(CASE WHEN status IN (3,5,7,9) THEN 1 ELSE 0 END) AS unapproved,
        SUM(CASE WHEN status IN (8,10) THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status IN (11) THEN 1 ELSE 0 END) AS disbursed,
        SUM(CASE WHEN status IN (13) THEN 1 ELSE 0 END) AS retired
    FROM
        staff_jet_cct_requests_financial
    WHERE
        status > 1
";

$requests = $wpdb->get_row($query);

?>


<h2 class="intro-y text-lg font-medium mt-10">
    Requests
</h2>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-primary "></i>
                </div>
                <div id="appListCount" class="text-3xl font-medium leading-8 mt-6"><?=$requests->allcount;?></div>
                <div class="text-base text-slate-500 mt-1">All Requests</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-success "></i>
                </div>
                <div id="submittedCount" class="text-3xl font-medium leading-8 mt-6"><?=$requests->cleared;?></div>
                <div class="text-base text-slate-500 mt-1">Cleared</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"> <?=$requests->approved;?></div>
                <div class="text-base text-slate-500 mt-1">Pending</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"> <?=$requests->disbursed;?></div>
                <div class="text-base text-slate-500 mt-1">Disbursed</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"> <?=$requests->retired;?></div>
                <div class="text-base text-slate-500 mt-1">Retired</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/admin/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"> <?=$requests->unapproved;?></div>
                <div class="text-base text-slate-500 mt-1">Unpproved</div>
            </div>
        </a>
    </div>
</div>

<!-- END: Content -->
</div>
</div>
<script>
    jQuery(document).ready(function($) {


    });
</script>

<?php get_footer(); ?>