<?php /* Template Name:  Admin: Requests - Request */
?>

<?php
get_header();
$b_link = '/requests';
$b_title = 'Requests';
$p_title = 'Request';
$id = intval(get_query_var('id'));

include get_template_directory() . "/layout/menu.php";
include get_template_directory() . "/layout/components.php";
// print_r($staff);

global $wpdb;

if (isset($_POST['email-send'])) {
    $message = $_POST['message'];
    $tablename = 'staff_jet_cct_request_financial_comment';
}
$requestTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_types a WHERE a.type = 1");
$projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects");
$teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
if ($id) {
    $requested = $wpdb->get_row("SELECT a._ID, staff, a.description, a.amount, a.cct_created, a.due_date, a.status, b.title, c.first_name, c.last_name, c.email, d.name, e.name as request_type ,e.code, e.approval
    FROM staff_jet_cct_requests_financial a 
    LEFT JOIN staff_jet_cct_projects b ON b._ID = a.project 
    LEFT JOIN staff_jet_cct_profiles c ON c._ID = a.staff
    LEFT JOIN staff_jet_cct_teams d ON d._ID = a.team
    LEFT JOIN staff_jet_cct_request_types e ON e._ID = a.type 
    where a._ID = $id");

    if (empty($requested)) {
        // Redirect to /requests page
        // header("Location: /requests");
        // exit(); // Ensure that script execution stops after redirecting
    }
    $items = $wpdb->get_results("SELECT * FROM staff_jet_cct_financial_items a WHERE a.request = $id AND a.type = 'request");
    $retired = $wpdb->get_results("SELECT * FROM staff_jet_cct_financial_items a WHERE a.request = $id AND a.type = 2");
    $approvals = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_financial_approval a WHERE a.request = $id");
} else {
    // Redirect to /requests page
    // header("Location: /requests");
    // exit(); // Ensure that script execution stops after redirecting
}


if ($requested->status == 2) {
    if ($staff->team_status == 2) {
        $btnClass = 'btn-warning-soft';
        $btnText = 'Pending';
        $message = 'Awaiting your approval';
        $btnApprove = 'Approve';
        $app_message = 'Are you sure you want to approve this request?';
        $btnHide = "";
        $pageHide = "";
        $subject = "Re:Request: $requested->request_type - $id";
        $content = "<p></p>The $requested->request_type - $requested->code$id has been approved by the Team Lead, and is awaiting clearance.
        <p>Login to your dashboard to clear the request <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
        $to = 'accounts@stanforteedge.com';
    } elseif ($requested->staff == $staff->_ID) {
        $btnClass = 'btn-warning-soft';
        $btnText = 'Pending';
        $message = 'Request has been sent and is awating Approval from your Team Lead';
        $btnHide = "hidden";
    } else {
        $pageHide = "hidden";
    }
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
    if (in_array('accountant', (array) $user->roles)) {
        $btnClass = 'btn-danger';
        $btnText = 'Uncleared';
        $message = 'Awaiting your clearance';
        $btnApprove = 'Clear';
        $app_message = 'Are you sure you want to clear this request?';
        $pageHide = "";
        $subject = "Re:Cleared: $requested->request_type - $id";
        $content = "<p></p>$requested->request_type - $requested->code has been cleared by the accountant. 
        <p>Please login to your dashboard to approve:</p><p><a class='btn' href='https://staff.stanforteedge.com/requests/request/?id=$id'/>Dashboard</a></p>";
        $to = 'olalekan@stanforteedge.com';
    } else {
        $btnClass = 'btn-outline-warning';
        $btnText = 'Uncleared';
        $message = 'Request has been approved and is awating Approval from the Accountant.';
        $btnHide = "hidden";
        $pageHide = "";
    }
} elseif ($requested->status == 6) {
    if (in_array('coo', (array) $user->roles)) {
        $btnClass = 'btn-outline-success';
        $btnText = 'Unapproved';
        $btnApprove = 'Approve';
        $app_message = 'Are you sure you want to approve this request?';
        $message = 'Request has been cleared and is awaiting your approval';
        if ($requested->approval == 2) {
            $subject = "Re:Approved: $requested->request_type - $id";
            $content = "<p>$requested->request_type - $requested->code has been cleared by the COO. </p>
        <p>Please login to your dashboard to approve <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
            $to = 'olusola@stanforteedge.com';
        } else {
            $subject = "Re:Approved: $requested->request_type - $id";
            $content = "<p>$requested->request_type - $requested->code has been cleared by the COO. </p>
        <p>Please login to your dashboard to disburse <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
            $to = 'accounts@stanforteedge.com';
        }
    } else {
        $btnClass = 'btn-outline-success';
        $btnText = 'Unapproved';
        $message = 'Request has been cleared and is awating Approval from the COO.';
        $btnHide = "hidden";
    }
} elseif ($requested->status == 8 && $requested->approval == 2) {
    if (in_array('ed', (array) $user->roles)) {
        $btnClass = 'btn-outline-success';
        $btnText = 'Unapproved';
        $btnApprove = 'Approve';
        $app_message = 'Are you sure you want to approve this request?';
        $message = 'Request has been cleared and is awaiting your approval';
        $subject = "Re:Approved: $requested->request_type - $id";
        $content = "<p>$requested->request_type - $requested->code has been cleared by the COO. </p>
        <p>Please login to your dashboard to disburse <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
        $to = 'accounts@stanforteedge.com';
    } else {
        $btnClass = 'btn-outline-success';
        $btnText = 'Unapproved';
        $message = 'Request has been cleared and is awating Approval from the ED.';
        $btnHide = "hidden";
    }
} elseif ($requested->status == 8 || $requested->status == 10) {
    if (in_array('accountant', (array) $user->roles)) {
        $btnClass = 'btn-outline-success';
        $btnText = 'Pending';
        $btnApprove = 'Confirm';
        $app_message = 'Do you confirm the funds have been disbursed?';
        $message = 'Request has been approved and is awaiting your disbursement';
        $subject = "Re:Approved: $requested->request_type - $id";
        $content = "<p>$requested->request_type - $requested->code has been approved. </p>
        <p>Please login to your dashboard to disburse <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
        $to = 'accounts@stanforteedge.com';
    } else {
        $btnClass = 'btn-outline-success';
        $btnText = 'Unapproved';
        $message = 'Request has been approved and is awating disbursement.';
        $btnHide = "hidden";
    }
} elseif ($requested->status == 11) {
    if (in_array('accountant', (array) $user->roles) || in_array('ed', (array) $user->roles) || in_array('coo', (array) $user->roles)) {
        $btnClass = 'btn-outline-success';
        $btnText = 'Disbursed';
        $message = 'Request has been disbursed and is awaiting confirmation.';
        $btnHide = "hidden";
        $subject = "Re:Approved: $requested->request_type - $id";
        $content = "<p>$requested->request_type - $requested->code has been disbursed by the accountant. </p>
        <p>Please login to your dashboard to confirm <a href='https://staff.stanforteedge.com/requests/request/?id=$id'/><button>Clear</button></a></p>";
        $to = $requested->email;
    } else {
        $btnClass = 'btn-success';
        $btnText = 'Disbursed';
        $btnApprove = 'Confirm';
        $app_message = 'Do you confirm you have received this funds?';
        $message = 'Please confirm you have received the funds.';
        $btnHide = "";
    }
} elseif ($requested->status == 12) {
    if (in_array('accountant', (array) $user->roles) || in_array('ed', (array) $user->roles) || in_array('coo', (array) $user->roles) || $staff->team_status == 2) {
        $btnClass = 'btn-success';
        $btnText = 'Received';
        $message = 'Funds has been received and is awaiting retirement.';
        $btnHide = "hidden";
    } elseif ($requested->staff == $staff->_ID) {
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
    }
} elseif ($requested->status == 13) {
    if (in_array('accountant', (array) $user->roles)) {
        $btnClass = 'btn-success';
        $btnText = 'Retired';
        $message = 'Funds has been retired. Please confirm';
        $app_message = 'Do you confirm this request in now completed?';
        $btnApprove = 'Confirm';
    } else {
        $btnClass = 'btn-success';
        $btnText = 'Received';
        $message = 'Funds have been retired. Awaiting confirmation from Accountant';
        $btnHide = "hidden";
    }
} elseif ($requested->status == 14) {
    $btnClass = 'btn-primary';
    $btnText = 'Completed';
    $message = 'Request is completed';
    $btnHide = "hidden";
} elseif ($requested->status == 1) {
    if ($requested->staff == $staff->_ID) {
        $btnClass = 'btn-secondary';
        $btnText = 'Draft';
        $btnApprove = 'Send';
        $app_message = 'Are you sure you want to send this request?';
        $message = 'Request is in Drafts.';
        $btnHide = "";
        $subject = "Re:New $requested->request_type - $requested->code";
        $content = "Your request has been send, and is awaiting approval from your team lead.";
    } else {
        $pageHide = 'hidden';
    }
} else {
    $btnHide = "hidden";
}

if (isset($_POST['approve'])) {
    $status = $_POST['status'];
    $tablename = "staff_jet_cct_requests_financial";
    $update = $wpdb->update($tablename, array('status' => $status), array('_ID' => $id), array('%d'), array('%d'));




    $file = $_FILES['paymentFile'];
    if (!empty($file['name'])) {
        // Get the uploaded file information
        $file_name = $file['name'];
        $file_size = $file['size'];
        $file_tmp = $file['tmp_name'];
        $file_type = $file['type'];
        $file_ext = strtolower(end(explode('.', $file['name'])));

        // Check if the file type is valid
        $valid_extensions = array("jpg", "jpeg", "png", "pdf");
        if (in_array($file_ext, $valid_extensions) === false) {
            echo 'Error: Invalid file extension. Allowed extensions: jpg, jpeg, png.';
            exit();
        }

        // Check if the file size is valid (less than 2MB)
        if ($file_size > 2097152) {
            echo 'Error: File size must be less than 2MB.';
            exit();
        }

        // Generate a unique name for the uploaded file
        $new_file_name = uniqid() . '.' . $file_ext;

        // Upload the file to the WordPress media library
        $upload_dir = wp_upload_dir();
        $upload_path = $upload_dir['path'] . '/' . $new_file_name;
        move_uploaded_file($file_tmp, $upload_path);

        // Save the URL of the uploaded file to a custom table
        global $wpdb;
        $table_name = $wpdb->prefix . "jet_cct_files";
        $wpdb->insert(
            $table_name,
            array(
                'url' => $upload_dir['url'] . '/' . $new_file_name,
                'type' => 1,
                'row_id' => $id,
                'staff' => $staff->_ID  // Assuming user_id is a field in your table
            )
        );
    }

    if ($update) {
        $tablename2 = "staff_jet_cct_request_financial_approval";
        $data2 = array(
            'request' => $id,
            'staff' => $staff->_ID,
            'status' => $status,
        );
        $approved = $wpdb->insert($tablename2, $data2);
        if ($approved && $to) {
            $sendmail = stanmail('accounts@stanforteedge.com', $to, $subject, $content);
            // Redirect to /requests page
            header("Location: /requests/request/?id=$id");
            exit();
        }
    }
}

?>
<style>
    li {
        list-style: none;
    }
</style>



<div class="box  <?= $pageHide; ?> p-5 mt-8">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
        <div class=" text-xl  ml-1"><?= $requested->code . $requested->_ID; ?>: ₦<?= number_format($requested->amount, 2); ?> <?= $requested->reimburse ? "(Reimbursement)" : " "; ?> </div>
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
                <?php if ($requested->status == 12) : ?>
                    <a id="retire-main" data-tw-toggle="modal" data-tw-target="#retire-modal" href="javascript:;" class="btn btn-primary ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg> Retire
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
    <div class="grid grid-cols-12 border-b py-3 gap-4 py-5">
        <!-- Start: Items List -->
        <div class="overflow-x-auto  col-span-12 lg:col-span-6 mt-5">
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
        <!-- Start: Reconciliation List -->
        <div class="overflow-x-auto col-span-12 lg:col-span-6 mt-5">
            <h4 class="font-medium text-lg">Retirement</h4>
            <?php if ($retired) : ?>
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
                        <?php $t_amount = 0;
                        foreach ($retired as $retire) :
                            $amount = $retire->price * $retire->quantity;
                            $t_amount .= $amount; ?>
                            <tr>
                                <td><?= $retire->item; ?></td>
                                <td><?= $retire->quantity; ?></td>
                                <td><?= $retire->price; ?></td>
                                <td>₦<?= number_format($amount, 2); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <div class="flex items-center text-primary text-lg mt-5">
                    Total: <span class="ml-2 p-2 border rounded ">&#x20A6;<?= $t_amount; ?></span>
                </div>
            <?php else : ?>
                <!-- Items -->
                Not yet retired.
            <?php endif; ?>
        </div>
    </div>

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
                                <?php if (in_array('accountant', (array) $user->roles)) : ?>
                                    <!-- Checkbox for evidence of payment -->
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="hasPaymentEvidence" onchange="toggleUploadField()">
                                        <label class="form-check-label" for="hasPaymentEvidence">Add Evidence of Payment</label>
                                    </div>

                                    <!-- File upload field for evidence of payment (initially hidden) -->
                                    <div id="uploadField" class="form-group mt-2 mb-2 p-2" style="display: none;">
                                        <input type="file" class="form-control border p-5 " name="paymentFile" id="paymentFile">
                                    </div>

                                <?php endif; ?>

                                <div class="form-check">
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
<div id="retire-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="edit" id="modal-icon" class="w-10 h-10 text-success mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Retire</div>
                    <div id="modal-desc" class="text-slate-500 mt-2 mb-3 mr-5 ml-5">Please retire</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <form id="retire-form" method="POST">
                        <div class=" pb-2 mb-2  border-b">
                            <div id="items-container" class="">
                                <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                                    <table class="table table-stripped ">
                                        <thead>
                                            <tr>
                                                <th class="text-start whitespace-nowrap w-1/2">Item</th>
                                                <th class="text-start whitespace-nowrap">Quantity</th>
                                                <th class="whitespace-nowrap">Price</th>
                                                <th class="whitespace-nowrap">Amount</th>
                                                <th class="text-center whitespace-nowrap" style="padding:0.25rem;"></th>
                                            </tr>
                                        </thead>
                                        <tbody id="table-list">

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="flex flex-row justify-between">
                                <button type="button" id="add-item-btn" class="btn btn-primary-soft mt-2">Add item</button>
                                <div class="flex items-center text-primary text-lg mt-5">
                                    Total: <span class="ml-2 p-2 border rounded " id="total-amount">&#x20A6;0.00</span>
                                    <input type="hidden" id="amount" name="amount" value="" required></input>
                                    <input type="hidden" id="status" name="status" value="13"></input>
                                    <input type="hidden" id="request" name="request" value="<?= $id; ?>"></input>
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

        $('#add-item-btn').click(function(e) {
            e.preventDefault();

            var itemIndex = itemCount++;
            var newRow = `
                <tr class="item">
                    <td class="p-2" style="padding:0.25rem;"><input type="text" name="items[${itemIndex}][item]" class="form-control "  required></td>
                    <td class="p-2" style="padding:0.25rem;"><input type="number" name="items[${itemIndex}][qty]" class="form-control" required></td>
                    <td class="p-2" style="padding:0.25rem;"><input type="number" name="items[${itemIndex}][price]" class="form-control" required ></td>
                    <td class="p-2" style="padding:0.25rem;"><span id="items-${itemIndex}-amt"></span></td>
                    <td class="p-1" style="padding:0px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash w-5 h-5 delete-item-btn text-danger self-end"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        
                    </td>
                </tr>`;

            $('#table-list').append(newRow);
        });

        // Delete item button click handler
        $(document).on('click', '.delete-item-btn', function() {
            $(this).closest('tr').remove();
        });

        // Function to calculate amount and update amt input field
        function calculateAmount(itemIndex) {
            var price = parseFloat($('input[name="items[' + itemIndex + '][price]"]').val());
            var qty = parseFloat($('input[name="items[' + itemIndex + '][qty]"]').val());
            var amount = price * qty;

            if (!isNaN(amount)) {
                $('#items-' + itemIndex + '-amt').html(amount.toFixed(2));
            }
        }

        // Event listener for changes in price and qty input fields
        $(document).on('input', 'input[name^="items["][name$="][price]"], input[name^="items["][name$="][qty]"]', function() {
            var itemName = $(this).attr('name');
            var itemIndex = getItemIndexFromName(itemName);
            if (itemIndex >= 0) {
                calculateAmount(itemIndex);
            }
        });

        // Event listener for changes in item amounts
        $(document).on('change', 'input[name^="items["][name$="][qty]"], input[name^="items["][name$="][price]"]', function() {
            var totalAmount = 0;
            $('span[id^="items-"]').each(function() {
                var itemAmt = parseFloat($(this).text());
                if (!isNaN(itemAmt)) {
                    totalAmount += itemAmt;
                }
            });
            $('#amount').val(totalAmount.toFixed(2));
            $('#total-amount').html('&#x20A6;' + totalAmount.toLocaleString('en-US', {
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


        $('#retire-form').submit(function(e) {
            e.preventDefault(); // Prevent the default form submission
            // Gather form data
            var formData = {};
            $.each($(this).serializeArray(), function(_, kv) {
                formData[kv.name] = kv.value;
            });
            formData['form'] = 'retire';

            var itemsData = [];
            $('input[name^="items["][name$="][item]"]').each(function() {
                var itemName = $(this).attr('name');
                var itemIndex = getItemIndexFromName(itemName);
                var item = $(this).val();
                var qty = $('input[name="items[' + itemIndex + '][qty]"]').val();
                var price = $('input[name="items[' + itemIndex + '][price]"]').val();
                itemsData.push({
                    item: item,
                    qty: qty,
                    price: price,
                    index: itemIndex
                });
            });
            formData['itemslist'] = itemsData;

            console.log(formData);

            $.ajax({
                url: '/wp-content/themes/stanforte/forms/requests-retire.php',
                method: 'POST',
                data: JSON.stringify(formData),
                dataType: 'json', // Expect JSON response
                success: function(response) {
                    if (response.success = true) {
                        alert(response.message);
                        window.location.href = "https://staff.stanforteedge.com/requests/request/?id=" + <?= $id; ?>;
                    } else {
                        alert(response.message)
                    }

                },
                error: function(err) {
                    alert('Failed to save note');
                    // console.error('AJAX Error:', status, error);

                }
            });
        });


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

    });
</script>


<?php get_footer(); ?>