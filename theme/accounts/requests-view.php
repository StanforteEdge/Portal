<?php /* Template Name:  Accounts: Requests - Request */
?>

<?php
get_header();
$b_link = '/requests';
$b_title = 'Requests';
$p_title = 'Request';
$id = intval(get_query_var('id'));

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";

global $wpdb;



if (in_array('accountant', (array) $user->roles)) {
    if ($id) {
        $requestTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_types a WHERE a.type = 1");
        $projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects");
        $teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
        $requested = $wpdb->get_row("SELECT a._ID, a.staff, a.description, a.reimburse, a.amount, a.cct_created, a.due_date, a.status, a.team, a.project, b.title, c.first_name, c.last_name, c.email, d.name, e.name as request_type, e.code, e.approval
        FROM staff_jet_cct_requests_financial a 
        LEFT JOIN staff_jet_cct_projects b ON b._ID = a.project 
        LEFT JOIN staff_jet_cct_profiles c ON c._ID = a.staff
        LEFT JOIN staff_jet_cct_teams d ON d._ID = a.team
        LEFT JOIN staff_jet_cct_request_types e ON e._ID = a.type 
        where a._ID = $id");

        if (empty($requested) || $requested->status <= 3) {
            // Redirect to /requests page
            header("Location: /accounts/requests");
            echo "<script>alert('No request found. Go back to Requests page.')</script>";
            exit(); // Ensure that script execution stops after redirecting
        }
        $items = $wpdb->get_results(" SELECT * FROM staff_jet_cct_financial_items a WHERE a.request = $id ");
        $approvals = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_financial_approval a WHERE a.request = $id");
        $files = $wpdb->get_results("SELECT * FROM staff_jet_cct_files a WHERE a.request = $id");
    } else {
        // Redirect to /requests page
        echo "<script>alert('No request with found for this id. Go back to Requests page.')</script>";
        header("Location: /accounts/requests");
        exit(); // Ensure that script execution stops after redirecting
    }
} else {
    // Redirect to /requests page
    echo "<script>alert('Page only visible to Staff with Accountant Permission.')</script>";
    header("Location: /home");
    exit(); // Ensure that script execution stops after redirecting
}

if (isset($_POST['email-send'])) {
    $message = $_POST['message'];
    $tablename = 'staff_jet_cct_request_financial_comment';
}

if (in_array($requested->status, [7, 9])) {
    $btnClass = 'btn-outline-danger';
    $btnText = 'Unapproved';
    $message = "Request has been rejected.";
    $btnHide = "hidden";
} elseif ($requested->status == 4) {
    $btnClass = 'btn-pending';
    $btnText = 'Pending';
    $message = 'Awaiting your clearance.';
    $btnApprove = 'Clear';
    $app_message = 'Are you sure you want to clear this request?';
    $pageHide = "";
} elseif ($requested->status == 5) {
    $btnClass = 'btn-danger';
    $btnText = 'Rejected';
    $message = 'You rejected this request.';
    $btnApprove = 'Clear';
    $app_message = 'Are you sure you want to clear this request?';
    $pageHide = "";
} elseif ($requested->status == 6) {
    $btnClass = 'btn-outline-pending';
    $btnText = 'Unapproved';
    $message = 'Request has been cleared and is awating Approval from the COO.';
    $btnHide = "hidden";
} elseif ($requested->status == 8) {
    $btnClass = 'btn-outline-pending';
    $btnText = 'Unapproved';
    $message = 'Request has been approved by the COO and is awating Approval from the ED.';
    $btnHide = "hidden";
} elseif ($requested->status == 10) {
    $btnClass = 'btn-outline-success';
    $btnText = 'Approved';
    $btnApprove = 'Disburse';
    $app_message = 'Do you confirm the funds have been disbursed?';
    $btnHide = "hidden";
} elseif ($requested->status == 11) {
    $btnClass = 'btn-outline-success';
    $btnText = 'Disbursed';
    $message = 'Request has been disbursed and is awaiting confirmation.';
    $btnHide = "hidden";
} elseif ($requested->status == 12) {
    $btnClass = 'btn-success';
    $btnText = 'Received';
    $message = 'Funds has been received and is awaiting retirement.';
    $app_message = 'Do you confirm this request is now completed?';
    $btnApprove = 'Close';
} elseif ($requested->status == 13) {
    $btnClass = 'btn-success';
    $btnText = 'Retired';
    $message = 'Funds has been retired. Please confirm and close the request';
    $app_message = 'Do you confirm this request is now completed?';
    $btnApprove = 'Close';
} elseif ($requested->status == 14) {
    $btnClass = 'btn-primary';
    $btnText = 'Completed';
    $message = 'Request is completed';
    $btnHide = "hidden";
} else {
    $btnClass = 'btn-primary';
    $btnText = 'Completed';
    $message = 'Request is completed';
    $btnHide = "hidden";
}

?>
<style>
    li {
        list-style: none;
    }

    .tab-pane {
        max-width: -webkit-fill-available !important;
    }
</style>


<!-- Add this CSS somewhere in your template -->
<style>
    .pdf-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .pdf-loading-content {
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        width: 200px;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        margin: 1rem 0;
        overflow: hidden;
    }

    .progress-bar-fill {
        height: 100%;
        background: #3b82f6;
        width: 0%;
        transition: width 0.3s ease;
    }
</style>

<div class="box p-5 mt-8">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
        <div class=" text-xl  ml-1"><?= $requested->code . $requested->_ID; ?>: ₦<?= number_format($requested->amount, 2); ?> <?= $requested->reimburse ? "(Reimbursement)" : " "; ?> </div>
        <div class="flex gap-3 items-center">
            <div class="btn <?= $btnClass; ?> rounded-full px-4 py-2"><?= $btnText; ?></div>
            <!-- Add this after the request header section -->
            <!-- Add Download PDF button here -->
            <button id="downloadPdf" class="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4 h-4 mr-2">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M12 18v-6" />
                    <path d="m9 15 3 3 3-3" />
                </svg>
                Download PDF
            </button>
        </div>
    </div>
    <div class="grid grid-cols-12 border-b py-3 gap-4 py-5">
        <div class=" intro-y col-span-12 lg:col-span-7  p-3">
            <!-- BEGIN: Form Layout -->
            <div class="intro-y">
                <h4 class="font-medium text-lg">Details</h4>
                <div class="flex flex-wrap">
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="hash" data-lucide="hash" class="lucide lucide-hash w-6 h-6 text-slate-500 mr-2">
                            <line x1="4" y1="9" x2="20" y2="9"></line>
                            <line x1="4" y1="15" x2="20" y2="15"></line>
                            <line x1="10" y1="3" x2="8" y2="21"></line>
                            <line x1="16" y1="3" x2="14" y2="21"></line>
                        </svg><a href="" class="underline decoration-dotted ml-1"><?= $requested->code; ?><?= $requested->_ID; ?> <?= $requested->reimburse ? "(Reimbursement)" : " "; ?> </a>
                    </div>
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="calendar" data-lucide="calendar" class="lucide lucide-calendar w-6 h-6 text-slate-500 mr-2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>Request Date: <?= date("d, M Y", strtotime($requested->cct_created)); ?>
                    </div>
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-clock w-6 h-6 text-slate-500 mr-2">
                            <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
                            <path d="M16 2v4" />
                            <path d="M8 2v4" />
                            <path d="M3 10h5" />
                            <path d="M17.5 17.5 16 16.3V14" />
                            <circle cx="16" cy="16" r="6" />
                        </svg>Due Date: <?= date("d, M Y", strtotime($requested->due_date)); ?>
                    </div>
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="box" data-lucide="box" class="lucide lucide-box w-6 h-6 text-slate-500 mr-2">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>Team: <?= $requested->name; ?>
                    </div>
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="briefcase" data-lucide="briefcase" class="lucide lucide-briefcase w-6 h-6 text-slate-500 mr-2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                        </svg>Project: <?= $requested->title; ?>
                    </div>
                    <div class="flex w-full lg:w-1/2 items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="user" data-lucide="user" class="lucide lucide-user w-6 h-6 text-slate-500 mr-2">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>Request By: <?= $requested->first_name . ' ' . $requested->last_name; ?>
                    </div>

                    <div class="flex  w-full items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="paperclip" data-lucide="paperclip" class="lucide lucide-paperclip w-6 h-6 text-slate-500 mr-2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                        </svg>Purpose: <?= $requested->description; ?>
                    </div>
                </div>
            </div>
            <!-- END: Form Layout -->
        </div>
        <div class="intro-y lg:border-l col-span-12 lg:col-span-5 p-5 ">
            <!-- Start: Approvals -->
            <h4 class="font-medium text-lg">Approval and History</h4>
            <div class="mb-3 mt-3 flex flex-wrap items-center">
                <div class="<?php echo $requested->status >= 2 ? 'text-success' : 'text-slate-500'; ?> flex items-center">Request Sent
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
                <?php if ($requested->approval !== 2) : ?>
                    <div class="<?php echo $requested->status >= 4 ? 'text-success' : ($requested->status == 3 ? 'text-danger' : 'text-slate-500'); ?> flex items-center"> Team Lead
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                <?php endif; ?>
                <div class="<?php echo $requested->status >= 6 ? 'text-success' : ($requested->status == 5 ? 'text-danger' : 'text-slate-500'); ?> flex items-center">Account Officer
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>

                <div class="<?php echo $requested->status >= 8 ? 'text-success' : ($requested->status == 7 ? 'text-danger' : 'text-slate-500'); ?> flex items-center">COO
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
                <?php if ($requested->approval == 3) : ?>
                    <div class="<?php echo $requested->status >= 10 ? 'text-success' : ($requested->status == 9 ? 'text-danger' : 'text-slate-500'); ?> flex items-center">ED
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                <?php endif; ?>
                <div class="<?php echo $requested->status >= 11 ? 'text-success' :  'text-slate-500'; ?> flex items-center">Disbursed
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>

                <div class="<?php echo $requested->status >= 12 ? 'text-success' : 'text-slate-500'; ?> flex items-center"> Received
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>

                <div class="<?php echo $requested->status >= 13 ? 'text-success' : 'text-slate-500'; ?> flex items-center"> Reconciled
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>

                <div class="<?php echo $requested->status == 14 ? 'text-success' : 'text-slate-500'; ?> flex items-center"> Completed
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="chevron-right" data-lucide="chevron-right" class="lucide lucide-chevron-right w-4 h-4">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>
            <div class="flex pt-3 border-t  gap-3 items-center">
                <div><?= $message; ?></div>
            </div>
            <div class="flex justify-start mt-3 items-center gap-3">
                <a id="approve-main" data-tw-toggle="modal" data-tw-target="#approve-modal" href="javascript:;" class="btn btn-primary <?= $btnHide; ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg> <?= $btnApprove; ?>
                </a>
                <?php if ($requested->status == 10 || $requested->status == 11) : ?>
                    <a id="disburse-main" data-tw-toggle="modal" data-tw-target="#disburse-modal" href="javascript:;" class="btn btn-primary ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg> Disburse
                    </a>
                <?php endif; ?>
                <a id="sendmail-main" data-tw-toggle="modal" data-tw-target="#sendmail-modal" href="javascript:;" class="btn hidden btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="mail" data-lucide="mail" class="lucide lucide-mail w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </a>

            </div>
        </div>
    </div>
    <ul class="nav nav-boxed-tabs " role="tablist">
        <li id="items-tab" class="nav-item flex-1" role="presentation">
            <button class="nav-link w-full py-2 active" data-tw-toggle="pill" data-tw-target="#tab-items" type="button" role="tab" aria-controls="tab-item" aria-selected="true"> Items </button>
        </li>
        <li id="disburse-tab" class="nav-item flex-1" role="presentation">
            <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#tab-disburse" type="button" role="tab" aria-controls="tab-disburse" aria-selected="false"> Disbursement </button>
        </li>
        <li id="retire-tab" class="nav-item flex-1" role="presentation">
            <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#tab-retire" type="button" role="tab" aria-controls="tab-retire" aria-selected="false"> Retirment </button>
        </li>
        <li id="file-tab" class="nav-item flex-1" role="presentation">
            <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#tab-file" type="button" role="tab" aria-controls="tab-file" aria-selected="false"> Files </button>
        </li>
    </ul>
    <div class="tab-content p-5 border-l border-r border-b">
        <div id="tab-items" class="tab-pane leading-relaxed active" role="tabpanel" aria-labelledby="items-tab">
            <div class="overflow-x-auto ">
                <table class="table table-striped">
                    <tr>
                        <th class="whitespace-nowrap w-1/2">Item</th>
                        <th class="whitespace-nowrap">Files</th>
                        <th class="whitespace-nowrap">Quantity</th>
                        <th class="whitespace-nowrap">Price</th>
                        <th class="whitespace-nowrap">Amount</th>
                    </tr>
                    <?php
                    foreach ($items as $item) :
                        // If the item is different from the current one, start a new table row
                        // $files = $wpdb->get_results("SELECT * FROM staff_jet_cct_files a WHERE a.row_id = $item->_ID");
                        if ($item->type === 'request') :
                    ?>
                            <td>
                                <div class="font-medium"><?= $item->item; ?></div>
                                <div><?= $item->account; ?></div>
                            </td>
                            <td>
                                <div class="flex gap-2 flex-wrap">
                                    <?php foreach ($files as $file) : if ($file->row_id === $item->_ID) : ?>

                                            <a href="<?= $file->url; ?>" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4">
                                                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                                    <path d="M12 18v-6" />
                                                    <path d="m9 15 3 3 3-3" />
                                                </svg></a>

                                    <?php endif;
                                    endforeach; ?>
                                </div>
                            </td>
                            <td class="whitespace-nowrap"><?= $item->quantity; ?></td>
                            <td class="whitespace-nowrap"><?= $item->price; ?></td>
                            <td class="whitespace-nowrap">₦<?= number_format(($item->price * $item->quantity), 2); ?></td>
                            </tr>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </table>
            </div>
        </div>
        <div id="tab-disburse" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="disburse-tab">
            <div class="overflow-x-auto mt-5">
                <h4 class="font-medium text-lg">Disbursement</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap w-1/2">Item</th>
                            <th class="whitespace-nowrap">QTY</th>
                            <th class="whitespace-nowrap">Price</th>
                            <th class="whitespace-nowrap">File</th>
                            <th class="whitespace-nowrap">Amount</th>
                            <th></th>

                        </tr>
                    </thead>
                    <tbody>
                        <?php $d_amount = 0;
                        foreach ($items as $item) :
                            if ($item->type === 'disburse') :
                                $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                                $d_amount += $amount; ?>
                                <tr>
                                    <td>
                                        <div><?= $item->item; ?></div><?= $item->note ? $item->note : ''; ?>
                                    </td>
                                    <td><?= $item->quantity; ?></td>
                                    <td><?= $item->price; ?></td>
                                    <td>
                                        <?php foreach ($files as $file) : ?>
                                            <?php if ($item->_ID === $file->row_id) : ?>
                                                <a href="<?= $file->url; ?>" target="_blank">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4">
                                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                                        <path d="M12 18v-6" />
                                                        <path d="m9 15 3 3 3-3" />
                                                    </svg>
                                                </a>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </td>
                                    <td><?= $amount; ?></td>
                                    <td><?= ($item->status === 1) ? 'Confimed' : ' - '; ?></td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="text-right">Requested: &#x20A6;<?= $requested->amount; ?></td>
                            <td colspan="1">Diff: &#x20A6;<?= number_format(($requested->amount - $d_amount), 2, '.', '0'); ?></td>
                            <td colspan="3">Disbursed: <span class="ml-2 p-2 border text-primary text-lg rounded total-amount">&#x20A6;<?= $d_amount; ?> </span></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        <div id="tab-retire" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="retire-tab">
            <div class="overflow-x-auto mt-5">
                <h4 class="font-medium text-lg">Retirement</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap w-1/2">Item</th>
                            <th class="whitespace-nowrap">QTY</th>
                            <th class="whitespace-nowrap">Price</th>
                            <th class="whitespace-nowrap">Amount</th>
                            <th class="whitespace-nowrap">File</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php $r_amount = 0;
                        foreach ($items as $item) :
                            if ($item->type === 'retire') :
                                $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                                $r_amount += $amount; ?>
                                <tr>
                                    <td><?= $item->item; ?></td>
                                    <td><?= $item->quantity; ?></td>
                                    <td><?= $item->price; ?></td>
                                    <td><?= $r_amount; ?></td>
                                    <td>
                                        <?php foreach ($files as $file) : ?>
                                            <?php if ($file->_ID === $item->file) : ?>
                                                <a href="<?= $file->url; ?>" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4">
                                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                                        <path d="M12 18v-6" />
                                                        <path d="m9 15 3 3 3-3" />
                                                    </svg></a>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <div class="flex items-center text-primary text-lg mt-5">
                    Total: <span class="ml-2 p-2 border rounded ">&#x20A6;<?= $r_amount; ?></span>
                </div>
            </div>
        </div>
        <div id="tab-file" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="file-tab">
            <div class="p-5">
                <a id="upload-main" data-tw-toggle="modal" data-tw-target="#upload-modal" href="javascript:;" class="btn btn-primary ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg> Upload Files
                </a>
            </div>
            <div class="overflow-x-auto ">
                <table id="file-table" class="table table-striped">
                    <tr>
                        <th class="whitespace-nowrap">ID</th>
                        <th class="whitespace-nowrap">Name</th>
                        <th class="whitespace-nowrap">File</th>
                        <th class="whitespace-nowrap">Attached</th>
                        <th class="whitespace-nowrap">Date</th>
                    </tr>
                    <tbody>

                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <!-- Start: Items List -->

    <!-- Start: Reconciliation List -->

</div>
<!-- END: Shortlis App -->

<!-- Shortlis App Modal -->
<div id="approve-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Take Action</div>
                    <div id="modal-desc" class="text-slate-500 mt-2 mb-3 mr-5 ml-5"><?= $app_message; ?></div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="approve-form" method="POST" enctype="multipart/form-data">
                        <div class="mb-4">
                            <?php if ($requested->status == 10) : ?>
                                <!-- Checkbox for evidence of payment -->
                                <div class="form-check justify-center">
                                    <input class="form-check-input" type="checkbox" id="hasPaymentEvidence">
                                    <label class="form-check-label" for="hasPaymentEvidence">Add transaction Evidence</label>
                                </div>

                                <!-- File upload field for evidence of payment (initially hidden) -->
                                <div id="uploadField" class="form-group mt-2 mb-2 p-2" style="display: none;">
                                    <input type="file" class="form-control border p-5 " name="paymentFile" id="paymentFile">
                                </div>

                            <?php endif; ?>

                            <div class="form-check justify-center">
                                <input class="form-check-input" type="checkbox" id="hasMessage">
                                <label class="form-check-label" for="hasMessage">Add a Message</label>
                            </div>

                            <div id="messageDiv" class="w-full p-3 mt-2" style="display: none;">
                                <textarea name="message" class="form-control" id="message"></textarea>
                            </div>
                        </div>
                        <button type="button" id="disapprove" name="disapprove" class="btn btn-outline-danger w-24">Unapprove</button>
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="button" id="approve" name="approve" class="btn btn-primary w-24"><?= $btnApprove; ?></button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Send Mail Modal -->

<!-- Upload File Modal -->
<div id="upload-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Select Files</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="upload-form" method="POST" enctype="multipart/form-data">
                        <div id="uploadField" class="form-group mt-2 mb-2 p-2">
                            <input type="file" class="form-control border p-5 " name="files[]" id="file" multiple>
                        </div>
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="submit" class="btn btn-primary w-24">Upload</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Send Mail Modal -->

<!-- Disburse Modal -->
<div id="disburse-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Disburse</div>
                    <div id="modal-desc" class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Please disburse</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="retire-form" method="POST" enctype="multipart/form-data">
                        <div class=" pb-2 mb-2  border-b">
                            <div id="items-container" class="">
                                <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                                    <table class="table table-stripped" id="disburse-table">
                                        <thead>
                                            <tr>
                                                <th class="text-start whitespace-nowrap w-1/3" style="padding:0.25rem;">Item</th>
                                                <th class="text-start whitespace-wrap w-32" style="padding:0.25rem;">Quantity</th>
                                                <th class="text-start whitespace-nowrap w-32" style="padding:0.25rem;">Price</th>
                                                <th class="whitespace-nowrap w-32" style="padding:0.25rem;">Receipt</th>
                                                <th class="whitespace-nowrap w-32" style="padding:0.25rem;">Note</th>
                                                <th class="whitespace-nowrap w-32" style="padding:0.25rem;">Amount</th>
                                                <th class=""></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php $damount = 0;
                                            $disbursed = 0;
                                            foreach ($items as $index => $item) :
                                                if ($item->type === 'request') :
                                                    $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                                                    $damount += $amount; ?>
                                                    <tr class="item">
                                                        <td style="padding:0.25rem;"><input type="text" name="items[<?= $index; ?>][item]" class="form-control" value="<?= $item->item; ?>" /></td>
                                                        <td style="padding:0.25rem;"><input type="number" name="items[<?= $index; ?>][qty]" class="form-control" value="<?= $item->quantity; ?>" /></td>
                                                        <td style="padding:0.25rem;"><input type="number" name="items[<?= $index; ?>][price]" class="form-control" step="0.01" value="<?= $item->price; ?>" /></td>

                                                        <td style="padding:0.25rem;"><select name="items[<?= $index; ?>][file]" class="form-select items-file">
                                                                <option>Select file</option>
                                                            </select>
                                                        </td>
                                                        <td style="padding:0.25rem;"><input type="text" name="items[<?= $index; ?>][account]" class="form-control" value="" placeholder="Add Note" /></td>
                                                        <td style="padding:0.25rem;">&#x20A6;<span class="items-amt"><?= $damount; ?></span></td>
                                                        <td class="p-1" style="padding:0px;">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash w-5 h-5 delete-item-btn text-danger self-end">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                                            </svg>
                                                        </td>
                                                    </tr>
                                                <?php endif; ?>
                                            <?php endforeach; ?>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colspan="2">
                                                    <button type="button" id="add-item-btn" data-target="#disburse-table" class="add-item-btn btn btn-primary-soft btn-sm mt-2 item-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        </svg>Add item
                                                    </button>
                                                </td>

                                                <td colspan="2">
                                                    <div>Total Disbursed<span class="ml-2 p-2 border rounded total-amount"><?= $damount; ?></span></div>
                                                    <input type="hidden" id="amount" name="amount" value="" required></input>
                                                    <input type="hidden" id="request" name="request" value="<?= $id; ?>"></input>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="button" name="saveBtn" class="btn  btn-secondary">Save</button>
                        <button type="submit" id="disburseBtn" name="disburseBtn" class="btn btn-primary w-24">Disburse</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="sendmail-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="mail" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Send Message</div>
                    <div class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Send a message or Reminder</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="email-form" action="/admin/email/send" method="POST">
                        <div class="w-full px-2 pb-3">
                            <div class="form-inline mt-2">
                                <label for="email-content" class=" form-label sm:w-20">Message:</label>
                                <textarea id="email-content" name="email-content" class="form-control" placeholder=" Email Body"></textarea>
                            </div>
                        </div>
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="submit" id="email-send" name="email-send" class="btn  btn-primary w-24">Send</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Shortlis App -->


<script>
    $(document).ready(function($) {

        let itemCount = 1;

        $('.add-item-btn').click(function(e) {
            var targetTable = $(this).data('target');
            e.preventDefault();
            var itemIndex = itemCount++;
            // Construct the new row with the text field for the item
            var newRow = $(`
                <tr class="item">
                    <td class="p-2" style="padding:0.25rem;"><input type="text" name="items[${itemIndex}][item]" class="form-control" required />
                    </td>
                    <td class="p-2" style="padding:0.25rem;"><input type="number" name="items[${itemIndex}][qty]" class="form-control" required /></td>
                    <td class="p-2" style="padding:0.25rem;"><input type="number" name="items[${itemIndex}][price]" class="form-control" step="0.01" required /></td>
                    <td class="p-2" style="padding:0.25rem;"><select  name="items[${itemIndex}][file]" class="form-select  p-2 items-file"><option>Select file</option></select></td>
                    <td class="p-2" style="padding:0.25rem;"><input type="text" name="items[${itemIndex}][note]" class="form-control" /></td>
                    <td class="p-2" style="padding:0.25rem;">&#x20A6;<span class="form-control items-amt"></span></td>
                    <td class="p-1" style="padding:0px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash w-5 h-5 delete-item-btn text-danger self-end"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </td>
                </tr>`);
            appendFileOptions(newRow.find('select.items-file'));
            $(targetTable).append(newRow);


        });

        // Delete item button click handler
        $(document).on('click', '.delete-item-btn', function() {
            $(this).closest('tr').remove();
        });

        $(document).on('input', 'table input[name^="items["][name$="][qty]"], table input[name^="items["][name$="][price]"]', function() {
            var $table = $(this).closest('table');
            var totalAmount = 0;

            // Update individual item amounts
            $table.find('tr').each(function() {
                var price = parseFloat($(this).find('input[name$="[price]"]').val()) || 0;
                var qty = parseInt($(this).find('input[name$="[qty]"]').val()) || 0;
                var amount = price * qty;
                $(this).find('.items-amt').text(amount.toFixed(2));
            });

            // Calculate total amount
            $table.find('.items-amt').each(function() {
                var itemAmt = parseFloat($(this).text());
                if (!isNaN(itemAmt)) {
                    totalAmount += itemAmt;
                }
            });



            var requested = parseFloat($table.find('input[name="requested"]').val()) || 0;
            var difference = totalAmount - requested;
            if (!isNaN(difference)) {
                $('input[name="difference"]').val(difference.toFixed(2));
            }


            $table.find('.amount').val(totalAmount.toFixed(2));
            $table.find('.total-amount').html('&#x20A6;' + totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));
        });

        // Function to extract item index from input name
        function getItemIndexFromName(name) {
            // Extract item index from input name
            var regex = /\[([0-9]+)\]/;
            var match = name.match(regex);
            if (match && match.length > 1) {
                return parseInt(match[1]);
            }
            return -1; // Invalid index
        }


        $('#approve-main').click(function() {
            var currentStatus = <?= $requested->status; ?>;
            var approvalType = <?= $requested->approval; ?>;

            // Determine the new status based on the current status
            if ([2, 4, 6].includes(currentStatus) && approvalType !== 3) {
                $('#status').val(currentStatus + 2);
            } else if (currentStatus === 8 && approvalType !== 3) {
                $('#status').val(11);
            } else if ([2, 4, 6, 8].includes(currentStatus) && approvalType === 3) {
                $('#status').val(currentStatus + 2);
            } else if ([10, 11, 12, 13].includes(currentStatus)) {
                $('#status').val(currentStatus + 1);
            } else if (currentStatus === 1) {
                $('#status').val(2);
            }
        });

        $('#disapprove-main').click(function() {
            var currentStatus = <?= $requested->status; ?>; // You need 

            // Determine the new status based on the current status
            if ([2, 4, 6, 8].includes(currentStatus)) {
                $('#status').val(currentStatus + 1);
            }
        });

        $('#hasPaymentEvidence').change(function() {
            var uploadField = $('#uploadField');
            var hasPaymentEvidence = $(this).is(':checked');

            // Toggle visibility of upload field based on checkbox
            if (hasPaymentEvidence) {
                uploadField.show();
            } else {
                uploadField.hide();
            }
        });

        $('#hasMessage').change(function() {
            var messageField = $('#messageDiv');
            var hasMessage = $(this).is(':checked');

            // Toggle visibility of message field based on checkbox
            if (hasMessage) {
                messageField.show();
            } else {
                messageField.hide();
            }
        });

        // Global variable to store files data
        var filesData = [];
        fetchAndAppendFiles();

        function getFiles() {
            return $.get('https://staff.stanforteedge.com/wp-json/jet-cct/files', {
                request: <?= $id; ?>,
                staff: <?= $staff->_ID; ?>,
                _orderby: 'cct_created',
                _order: 'desc',
                type: 'type'
            });
        }

        function fetchAndAppendFiles() {
            $.get('https://staff.stanforteedge.com/wp-json/jet-cct/files', {
                    request: <?= $id; ?>,
                    staff: <?= $staff->_ID; ?>,
                    type: 'disburse',
                    _orderby: 'cct_created',
                    _order: 'desc',
                })
                .then(function(files) {
                    var filesData = {
                        files: files
                    };
                    sessionStorage.removeItem('filesData', JSON.stringify(filesData));
                    // Store filesData in sessionStorage
                    sessionStorage.setItem('filesData', JSON.stringify(filesData));

                    // Append file options to all select inputs in all tables initially
                    $('table').each(function() {
                        appendFileOptionsToTable($(this));
                    });

                    // Append file details to #file-table
                    $.each(filesData.files, function(index, file) {

                        $('#file-table').append(`
                            <tr>
                                <td>${file._ID}</td>
                                <td>${file.name ? file.name : " "}</td>
                                <td class="text-start whitespace-nowrap">
                                    <a href="${file.url}" target="_blank">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4">
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                            <path d="M12 18v-6" />
                                            <path d="m9 15 3 3 3-3" />
                                        </svg>
                                    </a>
                                </td>
                                <td></td>
                                <td class="text-start whitespace-nowrap">${file.cct_created ? file.cct_created : " "}</td>
                            </tr>
                        `);
                    });
                })
                .catch(function() {
                    console.error("Failed to fetch files data.");
                });
        }

        // Function to append file options to a select input
        function appendFileOptions(select) {
            select.empty(); // Clear existing options
            select.append('<option value="">Select a file</option>');
            var filesData = JSON.parse(sessionStorage.getItem('filesData'));
            $.each(filesData.files, function(index, file) {
                select.append('<option value="' + file._ID + '">' + file.name + '</option>');
            });
        }
        // Function to append file options to all select inputs in a table
        function appendFileOptionsToTable(table) {
            table.find('select.items-file').each(function() {
                appendFileOptions($(this));
            });
        }

        $('button[name="disapprove"], button[name="approve"], button[name="disburseBtn"]').click(function() {
            // Prevent the default form submission
            event.preventDefault();

            // Determine the status value based on the button clicked
            var buttonName = $(this).attr('name');
            var statusValue;

            var currentStatus = parseInt('<?= $requested->status; ?>');
            var id = parseInt('<?= $id; ?>');
            var staff = parseInt('<?= $staff->_ID; ?>');

            if (buttonName === 'disapprove') {
                // Determine the new status for disapproval
                if ([4, 6, 8].includes(currentStatus)) {
                    statusValue = currentStatus + 1;
                } else if (currentStatus === 13) {
                    statusValue = 13;
                }
            } else if (buttonName === 'approve') {
                if (currentStatus === 4) {
                    statusValue = currentStatus + 2;
                } else if (currentStatus === 10 || currentStatus === 13) {
                    statusValue = currentStatus + 1;
                }
            } else if (buttonName === 'disburseBtn') {
                statusValue = 11;
                var disburseDataArray = [];
                $('#disburse-table .item').each(function(index) {
                    var rowData = {};
                    var $inputs = $(this).find('input, select'); // Include textarea in selecto
                    rowData.item = $inputs.eq(0).val();
                    rowData.qty = $inputs.eq(1).val();
                    rowData.price = $inputs.eq(2).val();
                    rowData.file = $inputs.eq(3).val();
                    rowData.note = $inputs.eq(4).val();
                    disburseDataArray.push(rowData);
                });
            } else if (buttonName === 'retire') {
                statusValue = 12;
            }

            // If a valid status is determined, submit the form via AJAX
            if (statusValue) {
                var formData = new FormData();
                formData.append('form', 'approval');
                formData.append('approvedby', <?= $staff->_ID; ?>);
                formData.append('level', 'accounts');
                formData.append('status', statusValue);
                formData.append('id', parseInt('<?= $id; ?>'));
                formData.append('items', JSON.stringify(disburseDataArray));


                for (var pair of formData.entries()) {
                    console.log(pair[0] + ':', pair[1]);
                }

                // AJAX request
                $.ajax({
                    url: '/wp-content/themes/stanforte/forms/test.php',
                    method: 'POST',
                    data: formData,
                    processData: false, // Prevent jQuery from automatically processing FormData
                    contentType: false,
                    success: function(response) {

                        if (response.success === true) {
                            alert(response.message);
                            window.location.href = "https://staff.stanforteedge.com/accounts/requests/request/?id=" + response.id;
                        } else {
                            console.log(response.data);
                            alert(response.message);
                            window.location.href = "https://staff.stanforteedge.com/accounts/requests/request/?id=" + response.id;
                        }
                    },
                    error: function(error) {
                        alert('Failed');
                        window.location.href = "https://staff.stanforteedge.com/accounts/requests/request/?id=" + '<?= $id; ?>';
                    },
                    complete: function() {
                        // Re-enable the submit button
                        $('#submitBtn').prop('disabled', false);
                        // Reset the text of the submit button
                        $('#submitBtn').text('Submit');
                    }
                });
            } else {
                // Handle invalid status
                alert('Invalid status.');
            }
        });


        $('#upload-form').on('submit', function(e) {
            e.preventDefault();
            var files = $('#file')[0].files;
            var formData = new FormData();
            for (var i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }
            formData.append('request', parseInt('<?= $id; ?>'));
            formData.append('staff', <?= $staff->_ID; ?>);
            formData.append('type', 'disburse');

            const myModal = tailwind.Modal.getInstance(document.querySelector("#upload-modal"));

            $.ajax({
                url: '/wp-content/themes/stanforte/forms/upload-files.php', // Change to your theme or plugin path
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: function(response) {
                    var data = JSON.parse(response);
                    if (data.success) {
                        $('#file-table').html('');
                        fetchAndAppendFiles();
                        myModal.hide();
                    } else {
                        alert(data.error);
                        console.log('File upload failed: ' + data.error);
                    }
                },
                error: function(response) {
                    alert(data.error);
                    console.log('File upload failed');
                }
            });
        });

        // Add html2pdf.js library
        const html2pdfScript = document.createElement('script');
        html2pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.head.appendChild(html2pdfScript);

        document.getElementById('downloadPdf').addEventListener('click', async () => {
            try {
                const template = `
            <div class="pdf-container" style="padding: 20px; font-family: Arial, sans-serif;">
                <!-- Header Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #000;">
                        <img src="/wp-content/uploads/2024/01/Stanforte-Edge-Logo.png" alt="Stanforte Edge" style="height: 50px;">
                        <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: bold;">Request <?= $requested->code . $requested->_ID ?></div>
                            <div>Status: <?= $btnText ?></div>
                        </div>
                    </div>
                    <div style="padding: 15px; border-bottom: 1px solid #000;">
                        <div style="font-size: 16px; font-weight: bold;">Amount: ₦<?= number_format($requested->amount, 2) ?></div>
                        <?php if ($requested->reimburse): ?>
                            <div>(Reimbursement)</div>
                        <?php endif; ?>
                    </div>
                    <!-- Two Column Layout -->
                    <div style="display: flex; border-top: 1px solid #000;">
                        <div style="flex: 1; padding: 15px; border-right: 1px solid #000;">
                            <h3 style="margin-top: 0;">Details</h3>
                            <ul>
                           <li> Date: <?= date("d, M Y", strtotime($requested->cct_created)) ?></li>
                           <li> Due: <?= date("d, M Y", strtotime($requested->due_date)) ?></li>
                           <li> Team: <?= $requested->name ?></li>
                           <li> Project: <?= $requested->title ?></li>
                           <li> By: <?= $requested->first_name . ' ' . $requested->last_name ?></li>
                           <li> Purpose: <?= $requested->description ?></li>
                            </ul>
                        </div>
                        <div style="flex: 1; padding: 15px;">
                            <h3 style="margin-top: 0;">Approval Flow</h3>
                            <p>[<?= $requested->status >= 2 ? '✓' : ' ' ?>] Request Sent</p>
                            <p>[<?= $requested->status >= 4 ? '✓' : ' ' ?>] Team Lead</p>
                            <p>[<?= $requested->status >= 6 ? '✓' : ' ' ?>] Account Officer</p>
                            <p>[<?= $requested->status >= 8 ? '✓' : ' ' ?>] COO</p>
                            <?php if ($requested->approval == 3): ?>
                                <p>[<?= $requested->status >= 10 ? '✓' : ' ' ?>] ED</p>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Items Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Items</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                        </tr>
                        <?php
                        $total = 0;
                        foreach ($items as $item):
                            if ($item->type === 'request'):
                                $amount = $item->price * $item->quantity;
                                $total += $amount;
                        ?>
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->item ?></td>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->quantity ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($item->price, 2) ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($amount, 2) ?></td>
                            </tr>
                        <?php endif;
                        endforeach; ?>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>Total</strong></td>
                            <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($total, 2) ?></td>
                        </tr>
                    </table>
                </div>

                <!-- Disbursement Box -->
                <div style="border: 1px solid #000; border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Disbursement</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                        </tr>
                        <?php
                        $d_total = 0;
                        $disburse = 0;
                        foreach ($items as $item):
                            if ($item->type === 'disburse'):
                                $amount = $item->price * $item->quantity;
                                $d_total += $amount;
                        ?>
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->item ?></td>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->quantity ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($item->price, 2) ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($amount, 2) ?></td>
                            </tr>
                        <?php endif;
                        endforeach; ?>
                         <?= ($disburse == 0) ? '<tr><td colspan="4">No disbursement done yet.</td></tr>' : ''; ?>
                    </table>
                </div>

                <!-- Retirement Box -->
                <div style="border: 1px solid #000;  border-radius:5px; margin-bottom: 20px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Retirement</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Qty</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Amount</th>
                        </tr>
                        <?php
                        $r_total = 0;
                        $retire = 0;
                        foreach ($items as $item):
                            if ($item->type === 'retire'):
                                $retire += 1;
                                $amount = $item->price * $item->quantity;
                                $r_total += $amount;
                        ?>
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->item ?></td>
                                <td style="border: 1px solid #000; padding: 8px;"><?= $item->quantity ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($item->price, 2) ?></td>
                                <td style="border: 1px solid #000; padding: 8px;">₦<?= number_format($amount, 2) ?></td>
                            </tr>
                            
                        <?php endif;
                        endforeach; ?>
                        <?= ($retire == 0) ? '<tr><td colspan="4" style="padding: 8px"; >No retirement done yet.</td></tr>' : ''; ?>
                    </table>
                </div>

                <!-- Files Box -->
                <?php if (!empty($files)): ?>
                <div style="border: 1px solid #000; border-radius:5px;">
                    <div style="padding: 10px; border-bottom: 1px solid #000;">
                        <h3 style="margin: 0;">Attached Files</h3>
                    </div>
                    <div style="padding: 10px;">
                        <?php foreach ($files as $file): ?>
                            <p style="margin: 5px 0;">◆ <?= $file->name ?></p>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php else: ?>
                    No Files attached.
                <?php endif; ?>
            </div>
        `;

                const opt = {
                    margin: [10, 10],
                    filename: 'request-<?= $requested->code . $requested->_ID ?>.pdf',
                    image: {
                        type: 'jpeg',
                        quality: 0.98
                    },
                    html2canvas: {
                        scale: 2
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait'
                    }
                };

                const container = document.createElement('div');
                container.innerHTML = template;
                await html2pdf().set(opt).from(container).save();

            } catch (error) {
                console.error('PDF generation failed:', error);
                alert('Failed to generate PDF. Please try again.');
            }
        });

    });
</script>



<?php get_footer(); ?>