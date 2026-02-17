<?php
/* Template Name: Donors: Add */

get_header();
$b_link = '/donors';
$b_title = 'Donors';
$p_title = 'Add New Donor';

include get_template_directory() . "/layout/menu.php";

// Check if user has permission to view this page
$user = wp_get_current_user();
$allowed_roles = array('administrator', 'finance', 'crm');
if (!array_intersect($allowed_roles, (array) $user->roles)) {
    wp_redirect(home_url('/donors'));
    exit;
}
?>

<div class="wrapper">
    <div class="wrapper-box">
        <div class="content">
            <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
                <h2 class="text-lg font-medium mr-auto">Add New Donor</h2>
            </div>

            <!-- BEGIN: Add Donor Form -->
            <div class="intro-y box p-5 mt-5">
                <div class="grid grid-cols-12 gap-4">
                    <!-- Donor Type Selection -->
                    <div class="col-span-12 xl:col-span-6">
                        <label for="donor-type" class="form-label">Donor Type</label>
                        <select id="donor-type" class="form-select">
                            <option value="">Select Type</option>
                            <option value="individual">Individual</option>
                            <option value="corporate">Corporate</option>
                            <option value="foundation">Foundation</option>
                        </select>
                    </div>

                    <!-- Basic Information -->
                    <div class="col-span-12 xl:col-span-6">
                        <label for="status" class="form-label">Status</label>
                        <select id="status" class="form-select">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="name" class="form-label">Name/Organization Name</label>
                        <input id="name" type="text" class="form-control" placeholder="Enter name">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="email" class="form-label">Email</label>
                        <input id="email" type="email" class="form-control" placeholder="example@domain.com">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="phone" class="form-label">Phone</label>
                        <input id="phone" type="tel" class="form-control" placeholder="+1234567890">
                    </div>

                    <!-- Address Information -->
                    <div class="col-span-12">
                        <h3 class="text-lg font-medium truncate mt-4 mb-4">Address Information</h3>
                    </div>

                    <div class="col-span-12 xl:col-span-12">
                        <label for="address" class="form-label">Street Address</label>
                        <input id="address" type="text" class="form-control" placeholder="Enter street address">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="city" class="form-label">City</label>
                        <input id="city" type="text" class="form-control" placeholder="Enter city">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="state" class="form-label">State/Province</label>
                        <input id="state" type="text" class="form-control" placeholder="Enter state">
                    </div>

                    <div class="col-span-12 xl:col-span-4">
                        <label for="postal-code" class="form-label">Postal Code</label>
                        <input id="postal-code" type="text" class="form-control" placeholder="Enter postal code">
                    </div>

                    <div class="col-span-12 xl:col-span-6">
                        <label for="country" class="form-label">Country</label>
                        <select id="country" class="form-select">
                            <option value="">Select Country</option>
                            <option value="US">United States</option>
                            <option value="UK">United Kingdom</option>
                            <!-- Add more countries as needed -->
                        </select>
                    </div>

                    <!-- Additional Information -->
                    <div class="col-span-12">
                        <h3 class="text-lg font-medium truncate mt-4 mb-4">Additional Information</h3>
                    </div>

                    <div class="col-span-12">
                        <label for="notes" class="form-label">Notes</label>
                        <textarea id="notes" class="form-control" rows="4" placeholder="Enter any additional notes"></textarea>
                    </div>

                    <!-- Form Actions -->
                    <div class="col-span-12 mt-4">
                        <button type="submit" class="btn btn-primary mr-2">Save Donor</button>
                        <a href="<?php echo home_url('/donors/overview'); ?>" class="btn btn-outline-secondary">Cancel</a>
                    </div>
                </div>
            </div>
            <!-- END: Add Donor Form -->
        </div>
        <!-- END: Content -->
    </div>
</div>

<?php get_footer(); ?>
