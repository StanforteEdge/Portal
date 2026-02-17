<?php

/* Template Name: Admin: Users 
 */

$pageTitle = 'User Management';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Users']
];
$activeMenu = 'admin-users';
$requiredPermissions = ['users.manage'];


wp_enqueue_script(
    'stanforte-admin-users',
    get_template_directory_uri() . '/assets/js/pages/admin/users.js',
    ['jquery', 'stanforte-data-client'],
    filemtime(get_template_directory() . '/assets/js/pages/admin/users.js'),
    true
);

get_header();
?>

<div class="grid grid-cols-12 gap-6">
    <!-- BEGIN: Stats Cards -->
    <div class="col-span-12 mt-5">
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-users">--</div>
                        <div class="text-base text-slate-500 mt-1">Total Users</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-check" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-active-users">--</div>
                        <div class="text-base text-slate-500 mt-1">Active Users</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-plus" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-pending-users">--</div>
                        <div class="text-base text-slate-500 mt-1">Pending Activations</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="user-x" class="report-box__icon text-danger"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-inactive-users">--</div>
                        <div class="text-base text-slate-500 mt-1">Inactive Users</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Stats Cards -->

    <!-- BEGIN: Users Table -->
    <div class="col-span-12 mt-5">
        <div class="intro-y box">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Users</h2>
                <div class="w-full sm:w-auto flex gap-2 mt-4 sm:mt-0">
                    <button type="button" class="btn btn-primary shadow-md" id="add-user-btn">
                        <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i>
                        Add User
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="p-5 border-b border-slate-200/60">
                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1">
                        <input type="text" class="form-control" placeholder="Search by name or email..."
                            id="user-search-input">
                    </div>
                    <select class="form-select w-full sm:w-auto" id="user-filter-status">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="user-filter-role">
                        <option value="">All Roles</option>
                    </select>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="table table-report">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">Name & Email</th>
                            <th class="whitespace-nowrap">Role(s)</th>
                            <th class="text-center whitespace-nowrap">Status</th>
                            <th class="text-center whitespace-nowrap">Last Login</th>
                            <th class="text-center whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <tr>
                            <td colspan="5" class="text-center py-10">
                                <div class="flex justify-center items-center">
                                    <i data-lucide="loader" class="w-8 h-8 animate-spin text-primary"></i>
                                    <span class="ml-3">Loading users...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div id="users-empty-state" class="hidden p-10 text-center">
                <i data-lucide="users" class="w-16 h-16 mx-auto text-slate-300 mb-3"></i>
                <p class="text-slate-500 mb-4">No users found</p>
                <button type="button" class="btn btn-primary" id="empty-add-user-btn">
                    <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i>
                    Add User
                </button>
            </div>
        </div>
    </div>
    <!-- END: Users Table -->
</div>

<!-- BEGIN: View User Modal (partial) -->
<!-- TEMPLATES (Inlined for reliability) -->
<script>
    window.UserTemplates = {
        'tpl-user-form': `
                <form id="user-form">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">Username *</label>
                            <input type="text" class="form-control" id="create-username" placeholder="e.g., johndoe" required>
                        </div>
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="create-email" placeholder="name@example.com" required>
                        </div>
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">Password *</label>
                            <input type="password" class="form-control" id="create-password" placeholder="Minimum 8 characters" required>
                        </div>
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">Role</label>
                            <select id="create-user-role" class="form-select">
                                <option value="">Select role</option>
                            </select>
                        </div>
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">First Name</label>
                            <input type="text" class="form-control" id="create-first-name" placeholder="John">
                        </div>
                        <div class="col-span-12 sm:col-span-6">
                            <label class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="create-last-name" placeholder="Doe">
                        </div>
                    </div>
                </form>
            `,
        'tpl-user-footer': `
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary mr-2">Cancel</button>
                <button type="button" class="btn btn-primary" id="btn-save-user">
                    <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                    Save User
                </button>
            `
    };
</script>

<?php get_footer(); ?>