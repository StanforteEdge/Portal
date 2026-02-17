<?php /* Template Name: Staff: Admin - Donors List */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Donors Management';

include get_template_directory() . "/layout/menu.php";

// Get all donors with their details
$donors = $wpdb->get_results("
    SELECT 
        d.*,
        COUNT(DISTINCT p._ID) as total_projects,
        SUM(p.budget) as total_contribution
    FROM staff_jet_cct_donors d
    LEFT JOIN staff_jet_cct_projects p ON FIND_IN_SET(d._ID, p.donors)
    GROUP BY d._ID
    ORDER BY d.name
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: Donors List -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Donors List</h2>
                <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                    <a href="<?php echo home_url('/admin/donors/management'); ?>" class="btn btn-primary shadow-md mr-2">Add New Donor</a>
                    <div class="dropdown ml-auto sm:ml-0">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false">
                            <span class="w-5 h-5 flex items-center justify-center">
                                <i class="w-4 h-4" data-lucide="download"></i>
                            </span>
                        </button>
                        <div class="dropdown-menu w-40">
                            <ul class="dropdown-content">
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to Excel
                                    </a>
                                </li>
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to PDF
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <div class="overflow-x-auto">
                    <table class="table table-report -mt-2">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Donor</th>
                                <th class="text-center whitespace-nowrap">Projects</th>
                                <th class="text-center whitespace-nowrap">Total Contribution</th>
                                <th class="text-center whitespace-nowrap">Status</th>
                                <th class="text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($donors as $donor): ?>
                            <tr class="intro-x">
                                <td>
                                    <div class="flex items-center">
                                        <?php if ($donor->logo): ?>
                                        <div class="w-10 h-10 image-fit zoom-in">
                                            <img alt="<?php echo esc_attr($donor->name); ?>" 
                                                 class="tooltip rounded-full" 
                                                 src="<?php echo esc_url($donor->logo); ?>" 
                                                 title="<?php echo esc_attr($donor->name); ?>">
                                        </div>
                                        <?php endif; ?>
                                        <div class="ml-4">
                                            <div class="font-medium whitespace-nowrap"><?php echo esc_html($donor->name); ?></div>
                                            <?php if ($donor->website): ?>
                                            <div class="text-slate-500 text-xs whitespace-nowrap">
                                                <a href="<?php echo esc_url($donor->website); ?>" target="_blank" rel="noopener noreferrer">
                                                    <?php echo esc_html($donor->website); ?>
                                                </a>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center"><?php echo $donor->total_projects; ?></td>
                                <td class="text-center">$<?php echo number_format($donor->total_contribution, 2); ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $donor->status === 'active' ? 'text-success' : 'text-danger'; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> 
                                        <?php echo ucfirst(esc_html($donor->status)); ?>
                                    </div>
                                </td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a class="flex items-center mr-3" href="<?php echo home_url('/admin/donors/management?id=' . $donor->_ID); ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                                        </a>
                                        <a class="flex items-center text-danger" href="javascript:;" data-tw-toggle="modal" data-tw-target="#delete-confirmation-modal">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- END: Donors List -->
    </div>
</div>

<!-- BEGIN: Delete Confirmation Modal -->
<div id="delete-confirmation-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="x-circle" class="w-16 h-16 text-danger mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Are you sure?</div>
                    <div class="text-slate-500 mt-2">Do you really want to delete this donor? <br>This process cannot be undone.</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="button" class="btn btn-danger w-24">Delete</button>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Delete Confirmation Modal -->

<?php get_footer(); ?>
