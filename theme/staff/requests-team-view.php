<?php /* Template Name:  Staff: Requests - Team View */
?>

<?php
get_header();
$b_link = '/requests/team/';
$b_title = 'Team Requests';
$p_title = 'Request';
$id = intval(get_query_var('id'));

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";

global $wpdb;

if ($staff->team_status == 2) {
    if ($id) {
        $requestTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_types a WHERE a.type = 1");
        $projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects");
        $teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
        $requested = $wpdb->get_row("SELECT a._ID, a.staff, a.description, a.amount, a.cct_created, a.due_date, a.status, a.team, a.project, b.title, c.first_name, c.last_name, c.email, d.name, e.name as request_type, e.code, e.approval
        FROM staff_jet_cct_requests_financial a 
        LEFT JOIN staff_jet_cct_projects b ON b._ID = a.project 
        LEFT JOIN staff_jet_cct_profiles c ON c._ID = a.staff
        LEFT JOIN staff_jet_cct_teams d ON d._ID = a.team
        LEFT JOIN staff_jet_cct_request_types e ON e._ID = a.type 
        where a._ID = $id ");

        if (empty($requested) || $requested->status == 1) {
            // Redirect to /requests page
            header("Location: /team/requests");
            echo "<script>alert('No request found for this id. Go back to Requests page.')</script>";
            exit(); // Ensure that script execution stops after redirecting
        }
        $items = $wpdb->get_results("SELECT * FROM staff_jet_cct_financial_items a WHERE a.request = $id AND a.type = 'request' ");
        $retired = $wpdb->get_results("SELECT * FROM staff_jet_cct_financial_items a WHERE a.request = $id AND a.type = 'retire' ");
        $approvals = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_financial_approval a WHERE a.request = $id");
    } else {
        // Redirect to /requests page
        echo "<script>alert('No request with found for this id. Go back to Requests page.')</script>";
        header("Location: /requests/team");
        exit(); // Ensure that script execution stops after redirecting
    }
} else {
    // Redirect to /requests page
    echo "<script>alert('Page only visible to Team Leads.')</script>";
    header("Location: /home");
    exit(); // Ensure that script execution stops after redirecting
}

if (isset($_POST['email-send'])) {
    $message = $_POST['message'];
    $tablename = 'staff_jet_cct_request_financial_comment';
}

if ($requested->status == 2) {
    $btnClass = 'btn-pending';
    $btnText = 'Pending';
    $message = 'Awaiting your approval.';
    $btnApprove = 'Approve';
    $app_message = 'Are you sure you want to approve this request?';
}elseif ($requested->status == 3) {
    $btnClass = 'btn-danger';
    $btnText = 'Unapproved';
    $message = 'You un-approved this request.';
    $btnApprove = 'Approve';
    $app_message = 'Are you sure you want to approve this request?';
    $pageHide = "";
}elseif ($requested->status == 4) {
    $btnClass = 'btn-pending';
    $btnText = 'Awaiting - Accounts';
    $message = 'Pending clearance from the Accountant.';
    $btnHide = "hidden";
} elseif ($requested->status == 5) {
    $btnClass = 'btn-danger';
    $btnText = 'Rejected';
    $message = 'Request rejected by the accountant.';
    $btnHide = "hidden";
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
    $message = 'Request has been approved and is awaiting disbursement';
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
    $btnHide = "hidden";
} elseif ($requested->status == 13) {
    $btnClass = 'btn-success';
    $btnText = 'Retired';
    $message = 'Funds has been retired.';
    $btnHide = "hidden";
} elseif ($requested->status == 14) {
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
</style>

<div class="box p-5 mt-8">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
        <div class=" text-xl  ml-1"><?= $requested->code . $requested->_ID; ?>: ₦<?= number_format($requested->amount, 2); ?></div>
        <div class="flex gap-3 items-center">
            <div class="btn <?= $btnClass; ?> rounded-full px-4 py-2"><?= $btnText; ?></div>
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
                        </svg><a href="" class="underline decoration-dotted ml-1"><?= $requested->code; ?><?= $requested->_ID; ?></a>
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

                    <div class="flex  w-full items-center mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="paperclip" data-lucide="paperclip" class="lucide lucide-paperclip w-6 h-6 text-slate-500 mr-2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                        </svg>Note: <?= $requested->note; ?>
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
                <a id="sendmail-main" data-tw-toggle="modal" data-tw-target="#sendmail-modal" href="javascript:;" class="btn hidden btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="mail" data-lucide="mail" class="lucide lucide-mail w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </a>

            </div>
        </div>
    </div>
    <div class=" border-b py-3 gap-4 py-5">
        <!-- Start: Items List -->
        <div class="overflow-x-auto mt-5">
            <h4 class="font-medium text-lg">Items</h4>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap w-1/2">Item</th>
                        <th class="whitespace-nowrap">Quantity</th>
                        <th class="whitespace-nowrap">Price</th>
                        <th class="whitespace-nowrap">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($items as $item) :
                        $amount = $item->price * $item->quantity; ?>
                        <tr>
                            <td><?= $item->item; ?></td>
                            <td><?= $item->quantity; ?></td>
                            <td><?= $item->price; ?></td>
                            <td>₦<?= number_format($amount, 2); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <div class="flex items-center text-primary text-lg mt-5">
                Total: <span class="ml-2 p-2 border rounded ">&#x20A6;<?= $requested->amount; ?></span>
            </div>
        </div>
    </div>


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

        $('button[name="disapprove"], button[name="approve"]').click(function() {
            // Prevent the default form submission
            event.preventDefault();

            // Disable the submit button
            $('#approve, #disapprove').prop('disabled', true);

            // Change the text to 'Loading...'
            $('#approve, #disapprove').text('Loading...');

            // Determine the status value based on the button clicked
            var buttonName = $(this).attr('name');
            var statusValue;

            var currentStatus = parseInt('<?= $requested->status; ?>');
            var id = parseInt('<?= $id; ?>');
            var staff = parseInt('<?= $staff->_ID; ?>');

            if (buttonName === 'disapprove') {
                // Determine the new status for disapproval
                if (currentStatus === 2) {
                    statusValue = currentStatus + 1;
                }
            } else if (buttonName === 'approve') {
                statusValue = 4;
            }

            // If a valid status is determined, submit the form via AJAX
            if (statusValue) {
                var formData = new FormData();
                formData.append('form', 'approval');
                formData.append('approvedby', <?= $staff->_ID; ?>);
                formData.append('level', 'team');
                formData.append('amount', <?= $requested->amount; ?>);
                formData.append('project', <?= $requested->project; ?>);
                formData.append('status', statusValue);
                formData.append('requestName', '<?= $requested->request_type; ?>');
                formData.append('id', parseInt('<?= $id; ?>'));
                formData.append('request', '<?= $requested->code . $requested->_ID; ?>');
                formData.append('staff', <?= $requested->staff; ?>);
                formData.append('team', <?= $requested->team; ?>);
                formData.append('due_date', '<?= $requested->due_date; ?>');
                formData.append('purpose', '<?= $requested->description; ?>');

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
                            window.location.href = "https://staff.stanforteedge.com/requests/team/request/?id=" + id;
                        } else {
                            alert(response.message);
                            window.location.href = "https://staff.stanforteedge.com/requests/team/request/?id=" + id;
                        }
                    },
                    error: function(error) {
                        alert('Failed');
                    },
                    complete: function() {
                        // Re-enable the submit button
                        $('#approve, #disapprove').prop('disabled', false);
                    }
                });
            } else {
                // Handle invalid status
                alert('Invalid status.');
            }
        });


    });
</script>



<?php get_footer(); ?>