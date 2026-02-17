<?php /* Template Name: Staff: Admin - Staff Management */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Staff Management';

include get_template_directory() . "/templates/layout/menu.php";

// Get staff member if editing
$staff_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$staff_member = null;
if ($staff_id > 0) {
    $staff_member = $wpdb->get_row($wpdb->prepare("
        SELECT 
            p.*,
            j.position,
            d.name as department,
            t.name as team_name
        FROM staff_jet_cct_profiles p
        LEFT JOIN staff_jet_cct_job_descriptions j ON p.role = j._ID
        LEFT JOIN staff_jet_cct_departments d ON p.department = d._ID
        LEFT JOIN staff_jet_cct_team_members tm ON p._ID = tm.staff
        LEFT JOIN staff_jet_cct_teams t ON tm.team = t._ID
        WHERE p._ID = %d
    ", $staff_id));
}

// Get departments for dropdown
$departments = $wpdb->get_results("
    SELECT _ID, name 
    FROM staff_jet_cct_departments 
    ORDER BY name
");

// Get roles for dropdown
$roles = $wpdb->get_results("
    SELECT _ID, position 
    FROM staff_jet_cct_job_descriptions 
    ORDER BY position
");

// Get teams for dropdown
$teams = $wpdb->get_results("
    SELECT _ID, name 
    FROM staff_jet_cct_teams 
    ORDER BY name
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: Staff Form -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">
                    <?php echo $staff_id ? 'Edit Staff Member' : 'Add New Staff Member'; ?>
                </h2>
            </div>
            <div class="p-5">
                <form action="<?php echo admin_url('admin-post.php'); ?>" method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field('staff_management_action', 'staff_management_nonce'); ?>
                    <input type="hidden" name="action" value="staff_management_action">
                    <?php if ($staff_id): ?>
                    <input type="hidden" name="staff_id" value="<?php echo $staff_id; ?>">
                    <?php endif; ?>
                    
                    <div class="grid grid-cols-12 gap-x-5 gap-y-5">
                        <!-- Personal Information -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="first_name" class="form-label">First Name</label>
                                    <input id="first_name" type="text" name="first_name" class="form-control" 
                                           value="<?php echo $staff_member ? esc_attr($staff_member->first_name) : ''; ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="last_name" class="form-label">Last Name</label>
                                    <input id="last_name" type="text" name="last_name" class="form-control" 
                                           value="<?php echo $staff_member ? esc_attr($staff_member->last_name) : ''; ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="email" class="form-label">Email</label>
                                    <input id="email" type="email" name="email" class="form-control" 
                                           value="<?php echo $staff_member ? esc_attr($staff_member->email) : ''; ?>" required>
                                </div>
                                <div class="mb-5">
                                    <label for="phone" class="form-label">Phone</label>
                                    <input id="phone" type="tel" name="phone" class="form-control" 
                                           value="<?php echo $staff_member ? esc_attr($staff_member->phone) : ''; ?>">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Work Information -->
                        <div class="col-span-12 xl:col-span-6">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="department" class="form-label">Department</label>
                                    <select id="department" name="department" class="form-select" required>
                                        <option value="">Select Department</option>
                                        <?php foreach ($departments as $dept): ?>
                                        <option value="<?php echo $dept->_ID; ?>" 
                                                <?php echo ($staff_member && $staff_member->department == $dept->name) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($dept->name); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="role" class="form-label">Role</label>
                                    <select id="role" name="role" class="form-select" required>
                                        <option value="">Select Role</option>
                                        <?php foreach ($roles as $role): ?>
                                        <option value="<?php echo $role->_ID; ?>" 
                                                <?php echo ($staff_member && $staff_member->position == $role->position) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($role->position); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="team" class="form-label">Team</label>
                                    <select id="team" name="team" class="form-select">
                                        <option value="">Select Team</option>
                                        <?php foreach ($teams as $team): ?>
                                        <option value="<?php echo $team->_ID; ?>" 
                                                <?php echo ($staff_member && $staff_member->team_name == $team->name) ? 'selected' : ''; ?>>
                                            <?php echo esc_html($team->name); ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="mb-5">
                                    <label for="status" class="form-label">Status</label>
                                    <select id="status" name="status" class="form-select" required>
                                        <option value="active" <?php echo ($staff_member && $staff_member->status == 'active') ? 'selected' : ''; ?>>Active</option>
                                        <option value="inactive" <?php echo ($staff_member && $staff_member->status == 'inactive') ? 'selected' : ''; ?>>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profile Picture -->
                        <div class="col-span-12">
                            <div class="intro-x">
                                <div class="mb-5">
                                    <label for="profile_pic" class="form-label">Profile Picture</label>
                                    <?php if ($staff_member && $staff_member->pic): ?>
                                    <div class="mb-3">
                                        <img src="<?php echo esc_url($staff_member->pic); ?>" 
                                             alt="Current Profile Picture" 
                                             class="w-24 h-24 object-cover rounded-full">
                                    </div>
                                    <?php endif; ?>
                                    <input id="profile_pic" type="file" name="profile_pic" class="form-control" accept="image/*">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12 mt-5">
                            <button type="submit" class="btn btn-primary w-24 mr-1">Save</button>
                            <a href="<?php echo home_url('/admin/staff'); ?>" class="btn btn-outline-secondary w-24">Cancel</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: Staff Form -->
    </div>
</div>

<?php get_footer(); ?>
