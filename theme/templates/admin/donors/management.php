<?php /* Template Name: Staff: Admin - Donor Management */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Donor Management';

include get_template_directory() . "/layout/menu.php";

// Get donor if editing
$donor_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$donor = null;
if ($donor_id > 0) {
    $donor = $wpdb->get_row($wpdb->prepare("
        SELECT * FROM staff_jet_cct_donors WHERE _ID = %d
    ", $donor_id));
}

// Get all active projects for project association
$projects = $wpdb->get_results("
    SELECT _ID, name, start_date, end_date, budget
    FROM staff_jet_cct_projects
    WHERE status = 'active'
    ORDER BY start_date DESC
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: Donor Form -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">
                    <?php echo $donor_id ? 'Edit Donor' : 'Add New Donor'; ?>
                </h2>
            </div>
            <div class="p-5">
                <form action="<?php echo admin_url('admin-post.php'); ?>" method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field('donor_management_action', 'donor_management_nonce'); ?>
                    <input type="hidden" name="action" value="donor_management_action">
                    <?php if ($donor_id): ?>
                    <input type="hidden" name="donor_id" value="<?php echo $donor_id; ?>">
                    <?php endif; ?>
                    
                    <div class="grid grid-cols-12 gap-x-5 gap-y-5">
                        <!-- Donor Information -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="name" class="form-label">Donor Name</label>
                                    <input id="name" type="text" name="name" class="form-control" 
                                           value="<?php echo $donor ? esc_attr($donor->name) : ''; ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="website" class="form-label">Website</label>
                                    <input id="website" type="url" name="website" class="form-control" 
                                           value="<?php echo $donor ? esc_attr($donor->website) : ''; ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="contact_person" class="form-label">Contact Person</label>
                                    <input id="contact_person" type="text" name="contact_person" class="form-control" 
                                           value="<?php echo $donor ? esc_attr($donor->contact_person) : ''; ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="email" class="form-label">Email</label>
                                    <input id="email" type="email" name="email" class="form-control" 
                                           value="<?php echo $donor ? esc_attr($donor->email) : ''; ?>">
                                </div>
                                <div class="mb-5">
                                    <label for="phone" class="form-label">Phone</label>
                                    <input id="phone" type="tel" name="phone" class="form-control" 
                                           value="<?php echo $donor ? esc_attr($donor->phone) : ''; ?>">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Additional Information -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="address" class="form-label">Address</label>
                                    <textarea id="address" name="address" class="form-control" rows="4"><?php echo $donor ? esc_textarea($donor->address) : ''; ?></textarea>
                                </div>
                                <div class="mb-5">
                                    <label for="notes" class="form-label">Notes</label>
                                    <textarea id="notes" name="notes" class="form-control" rows="4"><?php echo $donor ? esc_textarea($donor->notes) : ''; ?></textarea>
                                </div>
                                <div class="mb-5">
                                    <label for="status" class="form-label">Status</label>
                                    <select id="status" name="status" class="form-select" required>
                                        <option value="active" <?php echo ($donor && $donor->status == 'active') ? 'selected' : ''; ?>>Active</option>
                                        <option value="inactive" <?php echo ($donor && $donor->status == 'inactive') ? 'selected' : ''; ?>>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Logo Upload -->
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="logo" class="form-label">Donor Logo</label>
                                    <?php if ($donor && $donor->logo): ?>
                                    <div class="mb-3">
                                        <img src="<?php echo esc_url($donor->logo); ?>" 
                                             alt="Current Logo" 
                                             class="w-32 h-32 object-contain">
                                    </div>
                                    <?php endif; ?>
                                    <input id="logo" type="file" name="logo" class="form-control" accept="image/*">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Associated Projects -->
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label class="form-label">Associated Projects</label>
                                    <div class="grid grid-cols-12 gap-2">
                                        <?php foreach ($projects as $project): ?>
                                        <div class="col-span-12 sm:col-span-6 xl:col-span-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" 
                                                       name="projects[]" 
                                                       value="<?php echo $project->_ID; ?>"
                                                       <?php echo ($donor && in_array($project->_ID, explode(',', $donor->projects))) ? 'checked' : ''; ?>>
                                                <label class="form-check-label">
                                                    <?php echo esc_html($project->name); ?>
                                                    <div class="text-slate-500 text-xs">
                                                        Budget: $<?php echo number_format($project->budget, 2); ?>
                                                    </div>
                                                    <div class="text-slate-500 text-xs">
                                                        <?php echo date('M d, Y', strtotime($project->start_date)); ?> - 
                                                        <?php echo date('M d, Y', strtotime($project->end_date)); ?>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12 mt-5">
                            <button type="submit" class="btn btn-primary w-24 mr-1">Save</button>
                            <a href="<?php echo home_url('/admin/donors'); ?>" class="btn btn-outline-secondary w-24">Cancel</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: Donor Form -->
    </div>
</div>

<?php get_footer(); ?>
