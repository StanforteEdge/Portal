<?php /* Template Name:  Staff: Requests - Request */
?>

<?php
get_header();
$b_link = '/requests';
$b_title = 'Requests';
$p_title = 'Request';
$id = $_GET['id'];

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";
// print_r($staff);

global $wpdb;

if (isset($_POST['delete'])) {
    $tablename = 'staff_jet_cct_requests_financial';
    $tablename2 = 'staff_jet_cct_financial_items';

    $delete = $wpdb->delete($tablename, array(
        '_ID' => $id
    ));

    if ($delete) {
        $deleteItems = $wpdb->delete($tablename2, array(
            'request' => $id
        ));

        if ($deleteItems) {
            echo "<script>alert('Request has been deleted')</script>";
            // Redirect to /requests page
            header("Location: /requests");
            exit(); // Ensure that script execution stops after redirecting

        }
    }
}
$requestTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_types a WHERE a.type = 1");
$projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects");
$teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
if ($id) {
    $requested = $wpdb->get_row("SELECT a._ID, a.staff, a.reimburse, a.description, a.amount, a.cct_created, a.due_date, a.status, a.team, a.project, b.title, c.first_name, c.last_name, c.email, d.name, e.name as request_type, e.code, e.approval
    FROM staff_jet_cct_requests_financial a 
    LEFT JOIN staff_jet_cct_projects b ON b._ID = a.project 
    LEFT JOIN staff_jet_cct_profiles c ON c._ID = a.staff
    LEFT JOIN staff_jet_cct_teams d ON d._ID = a.team
    LEFT JOIN staff_jet_cct_request_types e ON e._ID = a.type 
    where a._ID = $id AND a.staff = $staff->_ID");

    if (empty($requested)) {
        // Redirect to /requests page
        header("Location: /requests");
        exit(); // Ensure that script execution stops after redirecting
    }
    $items = $wpdb->get_results(" SELECT * FROM staff_jet_cct_financial_items a
     WHERE a.request = $id ");
    $approvals = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_financial_approval a WHERE a.request = $id");
    $files = $wpdb->get_results("SELECT * FROM staff_jet_cct_files a  WHERE a.request = $id ");


    $teamlead = $wpdb->get_row("SELECT b.email, a.team_status FROM staff_jet_cct_team_members a LEFT JOIN staff_jet_cct_profiles b ON b._ID = a.staff WHERE a.team_status = 2 AND a.team = $staff->team ");
} else {
    // Redirect to /requests page
    header("Location: /requests");
    exit(); // Ensure that script execution stops after redirecting
}


if ($requested->status == 2) {
    $btnClass = 'btn-warning-soft';
    $btnText = 'Pending';
    $message = 'Request has been sent and is awating Approval from your Team Lead';
    $btnHide = "hidden";
    $subject = "Re:Request: $requested->request_type - $id";
    $content = "<p></p>The $requested->request_type - $requested->code$id from your team member is awaiting your approval.
        <p>Login to your dashboard to approve the request <a class='btn' href='https://staff.stanforteedge.com/requests/request/?id=$id'/>Approve</a></p>";
    $to = $teamlead->email;
} elseif (in_array($requested->status, [3, 5, 7, 9])) {

    $btnClass = 'btn-outline-danger';
    $btnText = 'Unapproved';
    $message = "Request has been rejected.";
    $btnHide = "hidden";
    $subject = "Re:Rejected: $requested->request_type - $id";
    $content = "<p></p>$requested->request_type - $requested->code$id request has been unapproved by" . ($requested->status == 3) ? 'Team Lead' : (($requested->status == 5) ? 'Accountant' : (($requested->status == 7) ? 'COO' : 'ED')) . "and is awaiting clearance from the accountant.
    <p>Login to your dashboard to get details</p><p><a class='btn' href='https://staff.stanforteedge.com/requests/request/?id=$id'/>Clear</a></p>";
    $to = $requested->email;
} elseif ($requested->status == 4) {
    $btnClass = 'btn-outline-warning';
    $btnText = 'Uncleared';
    $message = 'Request has been approved and is awating Approval from the Accountant.';
    $btnHide = "hidden";
    $pageHide = "";
} elseif ($requested->status == 6) {
    $btnClass = 'btn-outline-success';
    $btnText = 'Unapproved';
    $message = 'Request has been cleared and is awating Approval from the COO.';
    $btnHide = "hidden";
} elseif ($requested->status == 8 && $requested->approval == 2) {

    $btnClass = 'btn-outline-success';
    $btnText = 'Unapproved';
    $message = 'Request has been cleared and is awating Approval from the ED.';
    $btnHide = "hidden";
} elseif ($requested->status == 8 || $requested->status == 10) {
    $btnClass = 'btn-outline-success';
    $btnText = 'Unapproved';
    $message = 'Request has been approved and is awating disbursement.';
    $btnHide = "hidden";
} elseif ($requested->status == 11) {
    $btnClass = 'btn-success';
    $btnText = 'Disbursed';
    $btnApprove = 'Confirm';
    $app_message = 'Do you confirm you have received this funds?';
    $message = 'Please confirm you have received the funds. Go to the "Disbursement" Tab below.';
    $btnHide = "";
    $approveMsg = "Disbursement Confirmed";
    $to = '';
    $subject = '';
    $content = '';
} elseif ($requested->status == 12) {
    $btnClass = 'btn-success';
    $btnText = 'Received';
    $message = 'Please retire your funds.';
    $app_message = 'Are you sure your retirement is complete?';
    $btnApprove = 'hidden';
    $btnHide = "hidden";
    $subject = "Re:Approved: $requested->request_type - $id";
    $content = "<p>$requested->request_type - $requested->code has been retired by $requested->first_name. </p>
        <p>Please login to your dashboard to confirm <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
    $to = 'accounts@stanforteedge.com';
    $approveMsg = "Retirement sent";
} elseif ($requested->status == 13) {
    $btnClass = 'btn-success';
    $btnText = 'Received';
    $message = 'Funds have been retired. Awaiting confirmation from Accountant';
    $btnHide = "hidden";
    $btnApprove = 'hidden';
    $approveMsg = "Retirement sent";
    $app_message = 'Are you sure your retirement is complete?';
} elseif ($requested->status == 14) {
    $btnClass = 'btn-primary';
    $btnText = 'Completed';
    $message = 'Request is completed';
    $btnHide = "hidden";
} elseif ($requested->status == 1) {
    $btnClass = 'btn-secondary';
    $btnText = 'Draft';
    $btnApprove = 'Send';
    $app_message = 'Are you sure you want to send this request?';
    $message = 'Request is in Drafts.';
    $btnHide = "";
    $subject = "Re:New $requested->request_type - $requested->code";
    $content = "Your request has been send, and is awaiting approval from your team lead.";
    $approveMsg = "Request Sent";
} else {
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



<div class="box  <?= $pageHide; ?> p-5 mt-8">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
        <div class=" text-xl  ml-1"><?= $requested->code . $requested->_ID; ?>: ₦<?= number_format($requested->amount, 2); ?> <?= $requested->reimburse ? "(Reimbursement)" : " "; ?> </div>
        <div class="flex gap-3 items-center">
            <div class="btn <?= $btnClass; ?> rounded-full px-4 py-2"><?= $btnText; ?></div>
        </div>
    </div>
    <div class="grid grid-cols-12  py-3 gap-4 py-5">
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
                        </svg><a href="" class="underline decoration-dotted ml-1"><?= $requested->code; ?><?= $requested->_ID; ?> <?= $requested->reimburse ? "(Reimbursement)" : " "; ?></a>
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
                        </svg>Project: <?= $requested->title ? $requested->title : "None"; ?>
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
                        </svg>Purpose: <?= $requested->description ? $requested->description : ""; ?>
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
                <?php if ($requested->status == 12 || $requested->status == 13) : ?>
                    <a id="retire-main" data-tw-toggle="modal" data-tw-target="#retire-modal" href="javascript:;" class="btn btn-primary ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg> Retire
                    </a>
                <?php elseif ($requested->status == 1) : ?>
                    <a data-tw-toggle="modal" data-tw-target="#delete-modal" href="javascript:;" class="btn btn-outline-danger ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg> Delete
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
            <div class="overflow-x-auto  border-t  py-5">
                <h4 class="font-medium text-lg">Items</h4>

                <table class="table table-striped" id="items-table">
                    <tr>
                        <th class="whitespace-nowrap w-2/5">Item</th>
                        <th class="whitespace-nowrap">Files</th>
                        <th class="whitespace-nowrap">Quantity</th>
                        <th class="whitespace-nowrap">Price</th>
                        <th class="whitespace-nowrap">Amount</th>
                    </tr>
                    <?php $r_amount = 0;
                    foreach ($items as $item) :
                        if ($item->type === 'request') :
                            $amount =  $item->price * $item->quantity;
                            $r_amount += $amount;
                    ?>
                            <td>
                                <div class="font-medium"><?= $item->item; ?></div>
                                <div><?= $item->account; ?></div>
                            </td>
                            <td>
                                <div class="flex gap-2 flex-wrap">
                                    <?php foreach ($files as $file) :
                                        if ($file->_ID === $item->_ID && $file->type === 'request') : ?>
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
                            <td class="whitespace-nowrap">₦<?= number_format(($amount), 2); ?></td>
                            </tr>
                    <?php endif;
                    endforeach; ?>
                    <tr>
                        <td colspan="3"></td>
                        <td class="font-medium text-lg">Total:</td>
                        <td><span class=" font-medium  text-lg ">&#x20A6;<?= $r_amount; ?></span></td>
                    </tr>
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
                            <th class="whitespace-nowrap">Amount</th>
                            <th class="whitespace-nowrap">File</th>
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
                                        <div><?= $item->item; ?></div><?= $item->note; ?>
                                    </td>
                                    <td><?= $item->quantity; ?></td>
                                    <td><?= $item->price; ?></td>
                                    <td>
                                        <?php foreach ($files as $file) : ?>
                                            <?php if ($file->row_id === $item->_ID) : ?>
                                                <a href="<?= $file->url; ?>" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down w-4">
                                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                                        <path d="M12 18v-6" />
                                                        <path d="m9 15 3 3 3-3" />
                                                    </svg></a>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </td>
                                    <td><?= $d_amount; ?></td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="text-right">Total: <span class="ml-2 p-2 border text-lg rounded ">&#x20A6;<?= $d_amount; ?></span>
            </div>
            </td>
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
                        <th class="whitespace-nowrap">File</th>
                        <th class="whitespace-nowrap">Amount</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <?php $r_amount2 = 0;
                    foreach ($items as $item) :
                        if ($item->type === 'retire') :
                            $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                            $r_amount2 += $amount; ?>
                            <tr>
                                <td>
                                    <div><?= $item->item; ?></div> <?= $item->note; ?>
                                </td>
                                <td><?= $item->quantity; ?></td>
                                <td><?= $item->price; ?></td>
                                <td><?php foreach ($files as $file) : ?>
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
                                <td><?= $r_amount2; ?></td>
                                <td>
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
                        <td colspan="1">
                        </td>
                        <td colspan="1">
                            Disbursed: &#x20A6;<span class="ml-2 p-2"><?= $d_amount; ?></span>
                        </td>

                        <td colspan="1">
                            Diff: Diff: &#x20A6;<?= number_format(($d_amount - $r_amount), 2, '.', '0'); ?>
                        </td>
                        <td colspan="2">
                            Retired<span class="ml-2 p-2 border rounded total-amount">&#x20A6;<?= $r_amount2; ?></span>
                        </td>
                    </tr>
                    <tr>

                    </tr>
                </tfoot>
            </table>

        </div>
    </div>
    <div id="tab-file" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="file-tab">
        <div class="overflow-x-auto ">
            <table id="file-table" class="table table-striped">
                <tr>
                    <th class="whitespace-nowrap">ID</th>
                    <th class="whitespace-nowrap">Name</th>
                    <th class="whitespace-nowrap">File</th>
                    <th class="whitespace-nowrap">Attached</th>
                    <th class="whitespace-nowrap">Date</th>
                </tr>
                <tbody id="file-tbody">

                </tbody>
            </table>
            <div class="flex items-center justify-between text-primary text-lg mt-5">
                <a id="upload-main" data-tw-toggle="modal" data-tw-target="#upload-modal" href="javascript:;" class="btn btn-primary ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg> Upload Files
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Start: Items List -->



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
                            <?php if ($requested->status == 12) : ?>
                                <!-- Checkbox for evidence of payment -->
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="hasPaymentEvidence">
                                    <label class="form-check-label" for="hasPaymentEvidence">Add Evidence of Payment</label>
                                </div>

                                <!-- File upload field for evidence of payment (initially hidden) -->
                                <div id="uploadField" class="form-group mt-2 mb-2 p-2" style="display: none;">
                                    <input type="file" class="form-control border p-5 " name="paymentFile" id="paymentFile">
                                </div>

                            <?php endif; ?>

                            <div class="form-check justify-center">
                                <input class="form-check-input" type="checkbox" id="hasMessage" onchange="toggleMessageField()">
                                <label class="form-check-label" for="hasMessage">Add a Message</label>
                            </div>

                            <div id="messageDiv" class="w-full p-3 mt-2" style="display: none;">
                                <textarea name="message" class="form-control" id="message"></textarea>
                            </div>
                        </div>

                        <input type="hidden" id="status" name="status" value="<?= $staff->team_status == 2 ? 4 : 1; ?>" />
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="submit" id="approve" name="approve" class="btn btn-primary w-24"><?= $btnApprove; ?></button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
</div>
<!-- END: Shortlis App -->
<!-- Send Mail Modal -->

<!-- Retire Modal -->
<div id="retire-modal" class="modal modal-slide-over" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Retire</div>
                    <div id="modal-desc" class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Please retire</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="retire-form" method="POST" enctype="multipart/form-data">
                        <div class=" pb-2 mb-2  border-b">
                            <div id="items-container" class="">
                                <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                                    <table class="table table-stripped" id="retire-table">
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
                                            <?php $r_amount = 0;
                                            $disbursed = 0;
                                            foreach ($items as $index => $item) :
                                                if ($item->type === 'disburse') :
                                                    $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                                                    $r_amount += $amount; ?>
                                                    <tr class="item">
                                                        <td style="padding:0.25rem;"><input type="text" name="items[<?= $index; ?>][item]" class="form-control" value="<?= $item->item; ?>" /></td>
                                                        <td style="padding:0.25rem;"><input type="number" name="items[<?= $index; ?>][qty]" class="form-control" value="<?= $item->quantity; ?>" /></td>
                                                        <td style="padding:0.25rem;"><input type="number" name="items[<?= $index; ?>][price]" class="form-control" step="0.01" value="<?= $item->price; ?>" /></td>

                                                        <td style="padding:0.25rem;"><select name="items[<?= $index; ?>][file]" class="form-select items-file">
                                                                <option>Select file</option>
                                                            </select>
                                                        </td>
                                                        <td style="padding:0.25rem;"><input type="text" name="items[<?= $index; ?>][account]" class="form-control" value="" placeholder="Add Note" /></td>
                                                        <td style="padding:0.25rem;">&#x20A6;<span class="items-amt"><?= $amount; ?></span></td>
                                                        <td class="p-1" style="padding:0px;">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash w-5 h-5 delete-item-btn text-danger self-end">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                                            </svg>
                                                        </td>
                                                    </tr>
                                                <?php elseif ($item->type === 'disbursed') :
                                                    $amount = number_format(($item->price * $item->quantity), 2, '.', '');
                                                    $d_amount += $amount; ?>
                                                <?php endif; ?>
                                            <?php endforeach; ?>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colspan="2">
                                                    <button type="button" id="add-item-btn" data-target="#retire-table" class="add-item-btn btn btn-primary-soft btn-sm mt-2 item-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        </svg>Add item
                                                    </button>
                                                </td>
                                                <td colspan="2">
                                                    Disbursed: <input type="hidden" class="ml-2 p-2 requested" value="<?= $d_amount; ?>" />&#x20A6;<?= $d_amount; ?>
                                                </td>
                                                <td colspan="1">&#x20A6;<span id="difference" name="difference">0</span>
                                                </td>
                                                <td colspan="2">
                                                    Retired<span class="ml-2 p-2 border rounded total-amount">&#x20A6;<?= $r_amount; ?></span>
                                                    <input type="hidden" id="amount" name="amount" value="" required></input>
                                                    <input type="hidden" id="request" name="request" value="<?= $id; ?>"></input>
                                                </td>
                                            </tr>
                                            <tr>

                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="button" name="saveBtn" class="btn  btn-secondary">Save</button>
                        <button type="submit" id="retireBtn" name="retireBtn" class="btn btn-primary w-24">Retire</button>
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
                    <div class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Send a message or reminder</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="email-form" method="POST">
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
                        <input type="submit" class="btn btn-primary w-24" value="Upload" />
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Send Mail Modal -->


<!-- Delete Modal -->
<div id="delete-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-danger mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Take Action</div>
                    <div id="modal-desc" class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Are you sure you want to delete this?</div>
                </div>
                <div class="p-5 text-center">
                    <form id="delete-form" method="POST">
                        <button type="button" data-tw-dismiss="modal" class="btn btn-outline w-24 mr-1">Cancel</button>
                        <button type="submit" name="delete" class="btn btn-danger w-24">Delete</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>


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

                    $('#file-table').html('');
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

        $('#retire-form').submit(function(e) {
            e.preventDefault();

            var formDataArray = [];

            $('.item').each(function(index) {
                var rowData = {};
                var $inputs = $(this).find('input, select');
                rowData.index = $(this).index();
                rowData.item = $inputs.eq(0).val();
                rowData.qty = $inputs.eq(1).val();
                rowData.price = $inputs.eq(2).val();
                rowData.file = $inputs.eq(3).val();
                rowData.note = $inputs.eq(4).val();

                formDataArray.push(rowData);
            });

            var formData = new FormData();
            formData.append('items', JSON.stringify(formDataArray));
            formData.append('request', <?= $id; ?>);
            formData.append('staff', <?= $staff->_ID; ?>);
            formData.append('status', 13);
            // Log formData for debugging
            //  formData.forEach(function(value, key) {
            //      console.log(key, value);
            //  });

            // Send form data via AJAX
            $.ajax({
                url: '/wp-content/themes/stanforte/forms/requests-retire.php',
                method: 'POST',
                data: formData,
                processData: false, // Prevent jQuery from processing the FormData
                contentType: false, // Prevent jQuery from setting content type
                success: function(response) {
                    if (response.success == true) {
                        alert(response.message);
                        window.location.href = `https://staff.stanforteedge.com/requests/request/?id=<?= $id;?>`;
                    } else {
                        console.log(response.message);
                    }
                },
                error: function(error) {
                    console.error(error);
                }
            });
        });

        $('button[name="approve"]').click(function() {
            // Prevent the default form submission
            event.preventDefault();

            // Disable the submit button
            $('button[name="approve"]').prop('disabled', true).text('Loading...');

            var statusValue;
            var currentStatus = parseInt('<?= $requested->status; ?>');
            if (currentStatus === 1) {
                if (<?= $teamlead->team_status; ?> === 2) {
                    statusValue = 4;
                } else {
                    statusValue = 2;
                }
            } else if (currentStatus === 11) {
                if(parseInt('<?= $requested->reimburse; ?>') === 1){
                    statusValue = 14;
                }else{
                    statusValue = currentStatus + 1;
                }
            } else if (currentStatus === 12) {
                statusValue = currentStatus + 1;
            }

            // If a valid status is determined, submit the form via AJAX
            if (statusValue) {
                var formData = new FormData();
                formData.append('form', 'approval');
                formData.append('approvedby', <?= $staff->_ID; ?>);
                formData.append('amount', <?= $requested->amount; ?>);
                formData.append('level', 'staff');
                formData.append('project', <?= $requested->project; ?>);
                formData.append('status', statusValue);
                formData.append('requestName', '<?= $requested->request_type; ?>');
                formData.append('id', parseInt('<?= $id; ?>'));
                formData.append('requestCode', '<?= $requested->code . $requested->_ID; ?>');
                formData.append('staff', <?= $requested->staff; ?>);
                formData.append('team', <?= $requested->team; ?>);
                formData.append('due_date', '<?= $requested->due_date; ?>');
                formData.append('purpose', '<?= $requested->description; ?>');

                // Log formData for debugging
                formData.forEach(function(value, key) {
                    console.log(key, value);
                });

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
                            window.location.href = "https://staff.stanforteedge.com/requests/request/?id=" + response.id;
                        } else {
                            console.log(response.data);
                            alert(response.message);
                        }
                    },
                    error: function(error) {
                        alert('Failed');
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

        $('#email-form').submit(function(e) {
            e.preventDefault();

            var formData = new FormData();
            formData.append('content', $("#email-content").val());
            formData.append('request', <?= $id; ?>);
            formData.append('staff', <?= $staff->_ID; ?>);

            // Send form data via AJAX
            $.ajax({
                url: '/wp-content/themes/stanforte/forms/request-email.php',
                method: 'POST',
                data: formData,
                processData: false, // Prevent jQuery from processing the FormData
                contentType: false, // Prevent jQuery from setting content type
                success: function(response) {
                    if (response.success == true) {
                        alert(response.message);
                        window.location.href = `https://staff.stanforteedge.com/requests/request/?id=<?= $id; ?>`;
                    } else {
                        alert(response.message);
                    }
                },
                error: function(error) {
                    console.error(error);
                }
            });
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

        $('#upload-form').on('submit', function(e) {
            e.preventDefault();
            // $('#uploadField').html(`<?php // component_loader_1(); ?>`)
            var files = $('#file')[0].files;
            var formData = new FormData();
            for (var i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }
            formData.append('request', parseInt('<?= $id; ?>'));
            formData.append('staff', <?= $staff->_ID; ?>);
            formData.append('type', 'retire');

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



    });
</script>


<?php get_footer(); ?>