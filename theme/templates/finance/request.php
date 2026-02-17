<?php /* Template Name: Finance: Request */
?>

<?php
get_header();
$b_link = '/finance/requests';
$b_title = 'Requests';
$p_title = 'Request';
$id = $_GET['id'];

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

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
            header("Location: /finance/requests");
            exit();
        }
    }
}

if ($id) {
    $requested = $wpdb->get_row("SELECT a._ID, a.staff, a.description, a.amount, a.cct_created, a.status, 
        b.first_name, b.last_name, b.email, c.name as request_type, c.code
        FROM staff_jet_cct_requests_financial a 
        LEFT JOIN staff_jet_cct_profiles b ON b._ID = a.staff
        LEFT JOIN staff_jet_cct_request_types c ON c._ID = a.type 
        WHERE a._ID = $id");

    if (empty($requested)) {
        header("Location: /finance/requests");
        exit();
    }

    $items = $wpdb->get_results("SELECT * FROM staff_jet_cct_financial_items WHERE request = $id");
    $approvals = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_financial_approval WHERE request = $id");
    $files = $wpdb->get_results("SELECT * FROM staff_jet_cct_files WHERE request = $id");
} else {
    header("Location: /finance/requests");
    exit();
}

// Status handling
if ($requested->status == 2) {
    $btnClass = 'btn-warning-soft';
    $btnText = 'Pending';
    $message = 'Request awaiting approval';
} elseif (in_array($requested->status, [3, 5, 7, 9])) {
    $btnClass = 'btn-outline-danger';
    $btnText = 'Rejected';
    $message = "Request has been rejected";
} elseif ($requested->status == 4) {
    $btnClass = 'btn-outline-warning';
    $btnText = 'Approved';
    $message = 'Request has been approved';
} elseif ($requested->status == 11) {
    $btnClass = 'btn-success';
    $btnText = 'Disbursed';
    $message = 'Funds have been disbursed';
}
?>

<div class="wrapper-box">
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Request Details
            </h2>
        </div>

        <div class="box p-5 mt-5">
            <div class="flex items-center justify-between border-b pb-5">
                <div class="text-xl ml-1">
                    <?php echo $requested->code . $requested->_ID; ?>: 
                    ₦<?php echo number_format($requested->amount, 2); ?>
                </div>
                <div class="flex gap-3 items-center">
                    <div class="btn <?php echo $btnClass; ?> rounded-full px-4 py-2">
                        <?php echo $btnText; ?>
                    </div>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <ul class="nav nav-boxed-tabs mt-5" role="tablist">
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2 active" data-tw-toggle="pill" data-tw-target="#details" type="button" role="tab">Details</button>
                </li>
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#items" type="button" role="tab">Items</button>
                </li>
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#disbursement" type="button" role="tab">Disbursement</button>
                </li>
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#retirement" type="button" role="tab">Retirement</button>
                </li>
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#files" type="button" role="tab">Files</button>
                </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content border-l border-r border-b p-5">
                <!-- Details Tab -->
                <div id="details" class="tab-pane active" role="tabpanel">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 lg:col-span-8">
                            <h4 class="font-medium text-lg mb-3">Request Information</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">Requested By</label>
                                    <div><?php echo $requested->first_name . ' ' . $requested->last_name; ?></div>
                                </div>
                                <div>
                                    <label class="form-label">Request Type</label>
                                    <div><?php echo $requested->request_type; ?></div>
                                </div>
                                <div>
                                    <label class="form-label">Amount</label>
                                    <div>₦<?php echo number_format($requested->amount, 2); ?></div>
                                </div>
                                <div>
                                    <label class="form-label">Date Requested</label>
                                    <div><?php echo date('d M Y', strtotime($requested->cct_created)); ?></div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="form-label">Description</label>
                                <div><?php echo $requested->description; ?></div>
                            </div>
                        </div>
                        <div class="col-span-12 lg:col-span-4">
                            <h4 class="font-medium text-lg mb-3">Approval Status</h4>
                            <!-- Add approval status timeline here -->
                        </div>
                    </div>
                </div>

                <!-- Items Tab -->
                <div id="items" class="tab-pane" role="tabpanel">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($items as $item) : ?>
                                <tr>
                                    <td><?php echo $item->item; ?></td>
                                    <td><?php echo $item->description; ?></td>
                                    <td><?php echo $item->quantity; ?></td>
                                    <td>₦<?php echo number_format($item->unit_price, 2); ?></td>
                                    <td>₦<?php echo number_format($item->quantity * $item->unit_price, 2); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Disbursement Tab -->
                <div id="disbursement" class="tab-pane" role="tabpanel">
                    <!-- Add disbursement form and history here -->
                </div>

                <!-- Retirement Tab -->
                <div id="retirement" class="tab-pane" role="tabpanel">
                    <!-- Add retirement form and status here -->
                </div>

                <!-- Files Tab -->
                <div id="files" class="tab-pane" role="tabpanel">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Type</th>
                                <th>Uploaded By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($files as $file) : ?>
                                <tr>
                                    <td><?php echo $file->name; ?></td>
                                    <td><?php echo $file->type; ?></td>
                                    <td><?php echo $file->staff; ?></td>
                                    <td><?php echo date('d M Y', strtotime($file->cct_created)); ?></td>
                                    <td>
                                        <a href="<?php echo $file->url; ?>" target="_blank" class="btn btn-primary btn-sm">View</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
