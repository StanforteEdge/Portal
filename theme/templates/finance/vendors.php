<?php /* Template Name: Finance: Vendors */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Vendors';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles) && !in_array('ceo', (array) $user->roles) && !in_array('coo', (array) $user->roles)) {
    header("Location: " . home_url());
    exit();
}

global $wpdb;


?>

<div class="wrapper-box">
    <!-- BEGIN: Content -->
    <div class="content">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Vendor Management
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-vendor-modal">
                    Add New Vendor
                </button>
            </div>
        </div>

        <!-- Vendor Statistics -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">0</div>
                        <div class="text-base text-slate-500 mt-1">Total Vendors</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="credit-card" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">₦0.00</div>
                        <div class="text-base text-slate-500 mt-1">Total Payments</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="file-text" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">0</div>
                        <div class="text-base text-slate-500 mt-1">Active Contracts</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="alert-circle" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">0</div>
                        <div class="text-base text-slate-500 mt-1">Pending Payments</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vendors List -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">VENDOR</th>
                            <th class="text-center whitespace-nowrap">CONTACT</th>
                            <th class="text-center whitespace-nowrap">CATEGORY</th>
                            <th class="text-center whitespace-nowrap">TOTAL PAID</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($vendors as $vendor) : ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <div class="flex">
                                        <div class="w-10 h-10 image-fit zoom-in">
                                            <i data-lucide="building" class="w-10 h-10"></i>
                                        </div>
                                        <div class="ml-4">
                                            <div class="font-medium whitespace-nowrap"><?php echo $vendor->name; ?></div>
                                            <div class="text-slate-500 text-xs whitespace-nowrap"><?php echo $vendor->description; ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div><?php echo $vendor->contact_person; ?></div>
                                    <div class="text-slate-500 text-xs whitespace-nowrap"><?php echo $vendor->email; ?></div>
                                </td>
                                <td class="text-center"><?php echo $vendor->category; ?></td>
                                <td class="text-center">₦<?php echo number_format($vendor->total_paid, 2); ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $vendor->status == 'active' ? 'text-success' : 'text-danger'; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> <?php echo ucfirst($vendor->status); ?>
                                    </div>
                                </td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <button class="flex items-center mr-3" data-tw-toggle="modal" data-tw-target="#edit-vendor-modal-<?php echo $vendor->_ID; ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                                        </button>
                                        <button class="flex items-center text-danger" data-tw-toggle="modal" data-tw-target="#delete-modal-<?php echo $vendor->_ID; ?>">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Add Vendor Modal -->
<div id="add-vendor-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add New Vendor</h2>
            </div>
            <form method="POST">
                <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                    <div class="col-span-12">
                        <label for="vendor-name" class="form-label">Vendor Name</label>
                        <input id="vendor-name" name="name" type="text" class="form-control w-full" placeholder="Enter vendor name">
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="contact-person" class="form-label">Contact Person</label>
                        <input id="contact-person" name="contact_person" type="text" class="form-control w-full" placeholder="Contact person name">
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="contact-email" class="form-label">Email</label>
                        <input id="contact-email" name="email" type="email" class="form-control w-full" placeholder="contact@example.com">
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="phone" class="form-label">Phone</label>
                        <input id="phone" name="phone" type="text" class="form-control w-full" placeholder="Phone number">
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="category" class="form-label">Category</label>
                        <select id="category" name="category" class="form-select w-full">
                            <option value="supplier">Supplier</option>
                            <option value="service">Service Provider</option>
                            <option value="contractor">Contractor</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label for="address" class="form-label">Address</label>
                        <textarea id="address" name="address" class="form-control w-full" rows="3"></textarea>
                    </div>
                    <div class="col-span-12">
                        <label for="description" class="form-label">Description</label>
                        <textarea id="description" name="description" class="form-control w-full" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="submit" name="add_vendor" class="btn btn-primary w-24">Add</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php get_footer(); ?>
