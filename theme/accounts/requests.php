<?php /* Template Name: Accounts - Requests */
?>

<?php
get_header();
$b_link = '/accounts';
$b_title = 'Accounts';
$p_title = 'Requests';

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";


    $query = "
    SELECT
        SUM(CASE WHEN status > 2 THEN 1 ELSE 0 END) AS allcount,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) AS cleared,
        SUM(CASE WHEN status IN (3,5,7,9) THEN 1 ELSE 0 END) AS unapproved,
        SUM(CASE WHEN status IN (8,10) THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status IN (11) THEN 1 ELSE 0 END) AS disbursed,
        SUM(CASE WHEN status IN (14) THEN 1 ELSE 0 END) AS retired
    FROM
        staff_jet_cct_requests_financial
    WHERE
        status > 3
    ";



$requests = $wpdb->get_row($query);

?>


<div class="flex  flex-row justify-between">
    <h2 class="h-full py-5 font-medium flex align-center justify-start text-2xl">Request</h2>
</div>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-primary "></i>
                </div>
                <div class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->allcount) ? $requests->allcount : 0 ?>
                </div>
                <div class="text-base text-slate-500 mt-1">All Requests</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-success "></i>
                </div>
                <div id="submittedCount" class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->cleared) ? $requests->cleared : 0 ?>
                </div>
                <div class="text-base text-slate-500 mt-1">Cleared</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="submittedCount" class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->approved) ? $requests->approved : 0 ?>
                </div>
                <div class="text-base text-slate-500 mt-1">Approved</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-pending "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->disbursed) ? $requests->disbursed : 0 ?></div>
                <div class="text-base text-slate-500 mt-1">Disbursed</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-success "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->completed) ? $requests->completed : 0 ?></div>
                <div class="text-base text-slate-500 mt-1">Completed</div>
            </div>
        </a>
    </div>
    <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
        <a href="/accounts/requests/requests">
            <div class="box p-5  zoom-in">
                <div class="flex">
                    <i data-lucide="file-text" class="w-8 h-8 text-danger "></i>
                </div>
                <div id="assignedCount" class="text-3xl font-medium leading-8 mt-6"><?= isset($requests->unapproved) ? $requests->unapproved : 0 ?></div>
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