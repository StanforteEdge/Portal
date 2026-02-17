<?php
/* Template Name: Donors: Edit */

get_header();
$b_link = '/donors';
$b_title = 'Donors';
$p_title = 'Edit Donor';

include get_template_directory() . "/layout/menu.php";

// Check if user has permission to view this page
$user = wp_get_current_user();
$allowed_roles = array('administrator', 'finance', 'crm');
if (!array_intersect($allowed_roles, (array) $user->roles)) {
    wp_redirect(home_url('/donors'));
    exit;
}

// Check if donor ID is provided
if (!isset($_GET['id'])) {
    wp_redirect(home_url('/donors'));
    exit;
}
?>
<div class="wrapper">
    <div class="wrapper-box">
        <div class="content">
            <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
                <h2 class="text-lg font-medium mr-auto">Edit Donor</h2>
                <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                    <a href="<?php echo home_url('/donors/communications'); ?>?id=<?php echo $_GET['id']; ?>" class="btn btn-primary shadow-md mr-2">View Communications</a>
                </div>
            </div>

            <!-- BEGIN: Edit Donor Form -->
            <div class="intro-y box p-5 mt-5">
                <div class="grid grid-cols-12 gap-4">
                    <!-- Donor Type Selection -->
                    <div class="col-span-12 xl:col-span-6">
                        <label for="donor-type" class="form-label">Donor Type</label>
                        <select id="donor-type" class="form-select">
                            <option value="individual">Individual</option>
                            <option value="corporate" selected>Corporate</option>
                            <option value="foundation">Foundation</option>
                        </select>
                    </div>

                    <!-- Basic Information -->
                    <div class="col-span-12 xl:col-span-6">
                        <label for="status" class="form-label">Status</label>
                        <select id="status" class="form-select">
                            <option value="active" selected>Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="name" class="form-label">Name/Organization Name</label>
                        <input id="name" type="text" class="form-control" value="John Doe Foundation">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="email" class="form-label">Email</label>
                        <input id="email" type="email" class="form-control" value="contact@jdf.org">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="phone" class="form-label">Phone</label>
                        <input id="phone" type="tel" class="form-control" value="+1234567890">
                    </div>

                    <!-- Address Information -->
                    <div class="col-span-12">
                        <h3 class="text-lg font-medium truncate mt-4 mb-4">Address Information</h3>
                    </div>

                    <div class="col-span-12 xl:col-span-12">
                        <label for="address" class="form-label">Street Address</label>
                        <input id="address" type="text" class="form-control" value="123 Main St">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="city" class="form-label">City</label>
                        <input id="city" type="text" class="form-control" value="New York">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="state" class="form-label">State/Province</label>
                        <input id="state" type="text" class="form-control" value="NY">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="postal-code" class="form-label">Postal Code</label>
                        <input id="postal-code" type="text" class="form-control" value="10001">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="country" class="form-label">Country</label>
                        <select id="country" class="form-select">
                            <option value="US" selected>United States</option>
                            <option value="UK">United Kingdom</option>
                            <!-- Add more countries as needed -->
                        </select>
                    </div>

                    <!-- Donation History -->
                    <div class="col-span-12">
                        <h3 class="text-lg font-medium truncate mt-4 mb-4">Donation History</h3>
                        <div class="overflow-x-auto">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>2024-01-15</td>
                                        <td>$10,000</td>
                                        <td>Annual Fund</td>
                                        <td><span class="text-success">Completed</span></td>
                                    </tr>
                                    <!-- Add more donation history rows as needed -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div class="col-span-12">
                        <h3 class="text-lg font-medium truncate mt-4 mb-4">Additional Information</h3>
                    </div>

                    <div class="col-span-12">
                        <label for="notes" class="form-label">Notes</label>
                        <textarea id="notes" class="form-control" rows="4">Major donor with focus on education initiatives.</textarea>
                    </div>

                    <!-- Form Actions -->
                    <div class="col-span-12 mt-4">
                        <button type="submit" class="btn btn-primary mr-2">Save Changes</button>
                        <a href="<?php echo home_url('/donors/overview'); ?>" class="btn btn-outline-secondary">Cancel</a>
                    </div>
                </div>
            </div>
            <!-- END: Edit Donor Form -->
        </div>
        <!-- END: Content -->
    </div>
</div>

<?php get_footer(); ?>
