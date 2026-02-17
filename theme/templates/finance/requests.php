<?php /* Template Name: Finance: Requests List */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Requests';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

global $wpdb;

// Get all requests for the current user or all requests for finance team
$requests = $wpdb->get_results("SELECT a._ID, a.staff, a.description, a.amount, a.cct_created, a.status, 
    b.first_name, b.last_name, c.name as request_type, c.code
    FROM staff_jet_cct_requests_financial a 
    LEFT JOIN staff_jet_cct_profiles b ON b._ID = a.staff
    LEFT JOIN staff_jet_cct_request_types c ON c._ID = a.type 
    " . (!in_array('finance', (array) $user->roles) ? "WHERE a.staff = $staff->_ID" : "") . "
    ORDER BY a.cct_created DESC");

?>

<div class="wrapper-box">
    <!-- BEGIN: Content -->
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Financial Requests
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <a href="<?php echo home_url('/finance/request'); ?>" class="btn btn-primary shadow-md mr-2">Create New Request</a>
            </div>
        </div>
        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- BEGIN: Data List -->
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">REQUEST ID</th>
                            <th class="whitespace-nowrap">STAFF</th>
                            <th class="text-center whitespace-nowrap">TYPE</th>
                            <th class="text-center whitespace-nowrap">AMOUNT</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">DATE</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($requests as $request) : ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <a href="<?php echo home_url('/finance/request?id=' . $request->_ID); ?>" class="font-medium whitespace-nowrap"><?php echo $request->code . $request->_ID; ?></a>
                                </td>
                                <td>
                                    <a href="" class="font-medium whitespace-nowrap"><?php echo $request->first_name . ' ' . $request->last_name; ?></a>
                                </td>
                                <td class="text-center"><?php echo $request->request_type; ?></td>
                                <td class="text-center">₦<?php echo number_format($request->amount, 2); ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center">
                                        <?php
                                        $status_class = '';
                                        $status_text = '';
                                        switch ($request->status) {
                                            case 1:
                                                $status_class = 'text-primary';
                                                $status_text = 'Draft';
                                                break;
                                            case 2:
                                                $status_class = 'text-warning';
                                                $status_text = 'Pending';
                                                break;
                                            case 4:
                                                $status_class = 'text-success';
                                                $status_text = 'Approved';
                                                break;
                                            default:
                                                $status_class = 'text-danger';
                                                $status_text = 'Rejected';
                                        }
                                        ?>
                                        <div class="flex items-center justify-center <?php echo $status_class; ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> <?php echo $status_text; ?>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center"><?php echo date('d M Y', strtotime($request->cct_created)); ?></td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a class="flex items-center mr-3" href="<?php echo home_url('/finance/request?id=' . $request->_ID); ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> View
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <!-- END: Data List -->
        </div>
    </div>
    <!-- END: Content -->
</div>

<?php get_footer(); ?>
