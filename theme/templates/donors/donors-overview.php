<?php
/* Template Name: Donors: Overview */

get_header();
$b_link = '/donors';
$b_title = 'Donors';
$p_title = 'Donors Overview';

// include get_template_directory() . "/templates/layout/menu.php";

// Check if user has permission to view this page
$user = wp_get_current_user();
// $allowed_roles = array('administrator', 'accountant', 'hr', 'ed', 'coo');
// if (!array_intersect($allowed_roles, (array) $user->roles)) {
//     wp_redirect(home_url('/'));
//     exit;
// }
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">Donors Overview</h2>
    <?php if (in_array('finance', (array) $user->roles) || in_array('crm', (array) $user->roles)) : ?>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <a href="<?php echo home_url('/donors/add'); ?>" class="btn btn-primary shadow-md mr-2">Add New Donor</a>
        </div>
    <?php endif; ?>
</div>

<!-- BEGIN: Donors Filter -->
<div class="intro-y box p-5 mt-5">
    <div class="flex flex-col sm:flex-row sm:items-end xl:items-start">
        <form id="donors-filter-form" class="xl:flex sm:mr-auto">
            <div class="sm:flex items-center sm:mr-4 mt-2 xl:mt-0">
                <label class="w-12 flex-none xl:w-auto xl:flex-initial mr-2">Type</label>
                <select class="form-select w-full sm:w-32 2xl:w-full mt-2 sm:mt-0 sm:w-auto">
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                    <option value="foundation">Foundation</option>
                </select>
            </div>
            <div class="sm:flex items-center sm:mr-4 mt-2 xl:mt-0">
                <label class="w-12 flex-none xl:w-auto xl:flex-initial mr-2">Status</label>
                <select class="form-select w-full sm:w-32 2xl:w-full mt-2 sm:mt-0 sm:w-auto">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="mt-2 xl:mt-0">
                <button type="button" class="btn btn-primary w-full sm:w-16">Search</button>
                <button type="button" class="btn btn-secondary w-full sm:w-16 mt-2 sm:mt-0 sm:ml-1">Reset</button>
            </div>
        </form>
    </div>
</div>
<!-- END: Donors Filter -->

<!-- BEGIN: Donors List -->
<div class="intro-y box p-5 mt-5">
    <div class="overflow-x-auto">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">#</th>
                    <th class="whitespace-nowrap">Name</th>
                    <th class="whitespace-nowrap">Type</th>
                    <th class="whitespace-nowrap">Email</th>
                    <th class="whitespace-nowrap">Phone</th>
                    <th class="whitespace-nowrap">Status</th>
                    <th class="whitespace-nowrap">Last Donation</th>
                    <th class="whitespace-nowrap">Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Sample donor data - Replace with dynamic data -->
                <tr>
                    <td>1</td>
                    <td>John Doe Foundation</td>
                    <td>Foundation</td>
                    <td>contact@jdf.org</td>
                    <td>+1234567890</td>
                    <td><span class="text-success">Active</span></td>
                    <td>2024-01-15</td>
                    <td>
                        <div class="flex">
                            <a href="<?php echo home_url('/donors/edit?id=1'); ?>" class="btn btn-sm btn-primary mr-2">Edit</a>
                            <a href="<?php echo home_url('/donors/communications?id=1'); ?>" class="btn btn-sm btn-secondary">Communications</a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- BEGIN: Pagination -->
    <div class="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-3">
        <nav class="w-full sm:w-auto sm:mr-auto">
            <ul class="pagination">
                <li class="page-item">
                    <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevrons-left"></i> </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevron-left"></i> </a>
                </li>
                <li class="page-item active"> <a class="page-link" href="#">1</a> </li>
                <li class="page-item"> <a class="page-link" href="#">2</a> </li>
                <li class="page-item"> <a class="page-link" href="#">3</a> </li>
                <li class="page-item">
                    <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevron-right"></i> </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevrons-right"></i> </a>
                </li>
            </ul>
        </nav>
    </div>
    <!-- END: Pagination -->
</div>
<!-- END: Donors List -->
<?php get_footer(); ?>