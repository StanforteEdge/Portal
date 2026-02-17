<?php /* Template Name: Staff: Admin - Finance Management */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Finance Management';

include get_template_directory() . "/layout/menu.php";

// Get expense if editing
$expense_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$expense = null;
if ($expense_id > 0) {
    $expense = $wpdb->get_row($wpdb->prepare("
        SELECT 
            e.*,
            p.name as project_name,
            s.first_name,
            s.last_name
        FROM staff_jet_cct_expenses e
        LEFT JOIN staff_jet_cct_projects p ON e.project_id = p._ID
        LEFT JOIN staff_jet_cct_profiles s ON e.submitted_by = s._ID
        WHERE e._ID = %d
    ", $expense_id));
}

// Get all active projects for dropdown
$projects = $wpdb->get_results("
    SELECT _ID, name, budget
    FROM staff_jet_cct_projects
    WHERE status = 'active'
    ORDER BY name
");

// Get expense categories
$categories = $wpdb->get_col("
    SELECT DISTINCT category 
    FROM staff_jet_cct_expenses 
    WHERE category IS NOT NULL 
    ORDER BY category
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: Expense Form -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">
                    <?php echo $expense_id ? 'Edit Expense' : 'Add New Expense'; ?>
                </h2>
            </div>
            <div class="p-5">
                <form action="<?php echo admin_url('admin-post.php'); ?>" method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field('expense_management_action', 'expense_management_nonce'); ?>
                    <input type="hidden" name="action" value="expense_management_action">
                    <?php if ($expense_id): ?>
                    <input type="hidden" name="expense_id" value="<?php echo $expense_id; ?>">
                    <?php endif; ?>
                    
                    <div class="grid grid-cols-12 gap-x-5 gap-y-5">
                        <!-- Expense Details -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="project_id" class="form-label">Project</label>
                                    <select id="project_id" name="project_id" class="form-select" required>
                                        <option value="">Select Project</option>
                                        <?php foreach ($projects as $project): ?>
                                        <option value="<?php echo $project->_ID; ?>" 
                                                <?php echo ($expense && $expense->project_id == $project->_ID) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($project->name); ?> 
                                            (Budget: $<?php echo number_format($project->budget, 2); ?>)
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="description" class="form-label">Description</label>
                                    <textarea id="description" name="description" class="form-control" rows="4" required><?php echo $expense ? esc_textarea($expense->description) : ''; ?></textarea>
                                </div>
                                <div class="mb-5">
                                    <label for="amount" class="form-label">Amount</label>
                                    <div class="input-group">
                                        <div class="input-group-text">$</div>
                                        <input id="amount" type="number" name="amount" class="form-control" step="0.01" min="0" 
                                               value="<?php echo $expense ? esc_attr($expense->amount) : ''; ?>" required>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Additional Information -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="expense_date" class="form-label">Expense Date</label>
                                    <input id="expense_date" type="date" name="expense_date" class="form-control" 
                                           value="<?php echo $expense ? date('Y-m-d', strtotime($expense->expense_date)) : date('Y-m-d'); ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="category" class="form-label">Category</label>
                                    <select id="category" name="category" class="form-select" required>
                                        <option value="">Select Category</option>
                                        <?php foreach ($categories as $category): ?>
                                        <option value="<?php echo esc_attr($category); ?>" 
                                                <?php echo ($expense && $expense->category == $category) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($category); ?>
                                        </option>
                                        <?php endforeach; ?>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div id="new_category_div" class="mb-5" style="display: none;">
                                    <label for="new_category" class="form-label">New Category</label>
                                    <input id="new_category" type="text" name="new_category" class="form-control">
                                </div>
                                <div class="mb-5">
                                    <label for="payment_method" class="form-label">Payment Method</label>
                                    <select id="payment_method" name="payment_method" class="form-select" required>
                                        <option value="cash" <?php echo ($expense && $expense->payment_method == 'cash') ? 'selected' : ''; ?>>Cash</option>
                                        <option value="bank_transfer" <?php echo ($expense && $expense->payment_method == 'bank_transfer') ? 'selected' : ''; ?>>Bank Transfer</option>
                                        <option value="credit_card" <?php echo ($expense && $expense->payment_method == 'credit_card') ? 'selected' : ''; ?>>Credit Card</option>
                                        <option value="check" <?php echo ($expense && $expense->payment_method == 'check') ? 'selected' : ''; ?>>Check</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Receipt Upload -->
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="receipt" class="form-label">Receipt</label>
                                    <?php if ($expense && $expense->receipt_url): ?>
                                    <div class="mb-3">
                                        <a href="<?php echo esc_url($expense->receipt_url); ?>" target="_blank" class="btn btn-outline-secondary">
                                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> View Current Receipt
                                        </a>
                                    </div>
                                    <?php endif; ?>
                                    <input id="receipt" type="file" name="receipt" class="form-control" accept="image/*,.pdf">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes -->
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="notes" class="form-label">Additional Notes</label>
                                    <textarea id="notes" name="notes" class="form-control" rows="4"><?php echo $expense ? esc_textarea($expense->notes) : ''; ?></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status -->
                        <?php if ($expense): ?>
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="status" class="form-label">Status</label>
                                    <select id="status" name="status" class="form-select" required>
                                        <option value="pending" <?php echo ($expense->status == 'pending') ? 'selected' : ''; ?>>Pending</option>
                                        <option value="approved" <?php echo ($expense->status == 'approved') ? 'selected' : ''; ?>>Approved</option>
                                        <option value="rejected" <?php echo ($expense->status == 'rejected') ? 'selected' : ''; ?>>Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12 mt-5">
                            <button type="submit" class="btn btn-primary w-24 mr-1">Save</button>
                            <a href="<?php echo home_url('/admin/finance'); ?>" class="btn btn-outline-secondary w-24">Cancel</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: Expense Form -->
    </div>
</div>

<script>
document.getElementById('category').addEventListener('change', function() {
    const newCategoryDiv = document.getElementById('new_category_div');
    if (this.value === 'other') {
        newCategoryDiv.style.display = 'block';
        document.getElementById('new_category').setAttribute('required', 'required');
    } else {
        newCategoryDiv.style.display = 'none';
        document.getElementById('new_category').removeAttribute('required');
    }
});
</script>

<?php get_footer(); ?>
