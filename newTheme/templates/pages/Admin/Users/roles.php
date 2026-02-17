<?php
/* Template Name: Admin: Users - Roles */

// TEMPLATES (Inlined for reliability - defined BEFORE script enqueue)
?>


<?php
$pageTitle = 'Roles & Permissions';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Roles']
];
$activeMenu = 'admin-roles';

wp_enqueue_script(
    'stanforte-admin-roles',
    get_template_directory_uri() . '/assets/js/pages/admin/roles.js',
    ['jquery', 'stanforte-data-client'],
    time(), // Force reload
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
                            <i data-lucide="shield" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-roles">--</div>
                        <div class="text-base text-slate-500 mt-1">Total Roles</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="users" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-assigned-users">--</div>
                        <div class="text-base text-slate-500 mt-1">Role Assignments</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="key" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-total-permissions">--</div>
                        <div class="text-base text-slate-500 mt-1">Total Permissions</div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="shield-check" class="report-box__icon text-info"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6" id="stat-active-roles">--</div>
                        <div class="text-base text-slate-500 mt-1">Active Roles</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Stats Cards -->

    <!-- BEGIN: Roles Table -->
    <div class="col-span-12 mt-5">
        <div class="intro-y box">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Roles Management</h2>
                <div class="w-full sm:w-auto flex gap-2 mt-4 sm:mt-0">
                    <button type="button" class="btn btn-primary shadow-md" id="btn-create-role">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Create Role
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="p-5 border-b border-slate-200/60">
                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1">
                        <input type="text" class="form-control" placeholder="Search roles..." id="search-input">
                    </div>
                    <select class="form-select w-full sm:w-auto" id="filter-status">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <!--   Table -->
            <div class="overflow-x-auto">
                <table class="table table-report">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">Role Name</th>
                            <th class="whitespace-nowrap">Description</th>
                            <th class="text-center whitespace-nowrap">Users</th>
                            <th class="text-center whitespace-nowrap">Permissions</th>
                            <th class="text-center whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="roles-table-body">
                        <!-- Loading skeleton -->
                        <tr>
                            <td colspan="5" class="text-center py-10">
                                <div class="flex justify-center items-center">
                                    <i data-lucide="loader" class="w-8 h-8 animate-spin text-primary"></i>
                                    <span class="ml-3">Loading roles...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                </di v>

                <!-- Empty S            tate -->
                <div id="empty-s            tate" class="hidden p-10 text-center">
                    <i data- lucide="shield-off" class="w-16 h-16 mx-auto text-slate-300 mb-3"></i>
                    <p class="text-slate-500 mb-4">No roles found</p>

                    <button type="button" class="btn btn-primary" id="btn-create-first-role">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Create Your First Role
                    </button>
                </div>
                </di v>
            </div>
            <!-- END: Roles            Table -->

            <!-- BEGIN: Permission M   atrix -->
            <div class="col-span     -12 mt-5">
                <div class="intr       o-y box p-5">
                    <div class="         flex items-center justify-between mb-5">
                        <h3 class="text-lg font-medium">Permission Matrix</h3>
                        <div class="w-full sm:w-auto flex gap-2 mt-4 sm:mt-0">
                            <button type="button" class="btn btn-secondary shadow-md" id="btn-manage-permissions">
                                <i data-lucide="key" class="w-4 h-4 mr-2"></i>
                                Manage Permissions
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-matrix">
                                <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
                                Refresh
                            </button>
                        </div>


                    </div>
                    <div class="overflow-x-auto" id="permission-matrix">
                        <p class="text-slate-500 text-center py-8">Loading permission matrix...</p>
                    </div>
                </div>
            </div>
            <!-- END: Permission Matrix -->


        </div>
    </div>
    <!-- TEMPLATES (Inlined for reliability) -->
    <!-- Role Form Template -->
    <script type="text/html" id="tpl-role-form">
        <form id="role-form">
            <input type="hidden" id="role-id">

            <div class="mb-4">
                <label class="form-label">Role Name *</label>
                <input type="text" class="form-control" id="role-name" placeholder="e.g., Manager" required>
            </div>

            <div class="mb-4">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="role-description" rows="3"
                    placeholder="Describe this role..."></textarea>
            </div>

            <div class="mb-4">
                <label class="form-label">Permissions</label>
                <div id="permissions-list" class="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded p-3">
                    <p class="text-slate-500 text-sm">Loading permissions...</p>
                </div>
            </div>
        </form>
    </script>

    <!-- Permissions Management Template -->
    <script type="text/html" id="tpl-permissions-management">
        <div class="flex justify-between items-center mb-4">
            <input type="text" class="form-control w-64" placeholder="Search permissions..." id="search-permissions">
            <button type="button" class="btn btn-primary" id="btn-create-permission">
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                Create Permission
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="table table-report">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Module</th>
                        <th>Description</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody id="permissions-table-body">
                    <tr>
                        <td colspan="5" class="text-center py-4">Loading permissions...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </script>

    <!-- Permission Form Template -->
    <script type="text/html" id="tpl-permission-form">
        <form id="permission-form">
            <input type="hidden" id="permission-id">

            <div class="mb-4">
                <label class="form-label">Permission Name *</label>
                <input type="text" class="form-control" id="permission-name" placeholder="e.g., Manage Users" required>
                <div class="text-xs text-slate-500 mt-1">Human-readable name for the permission</div>
            </div>

            <div class="mb-4">
                <label class="form-label">Slug *</label>
                <input type="text" class="form-control" id="permission-slug" placeholder="e.g., users.manage" required>
                <div class="text-xs text-slate-500 mt-1">Unique identifier using dot notation (resource.action)</div>
            </div>

            <div class="mb-4">
                <label class="form-label">Module</label>
                <input type="text" class="form-control" id="permission-module" placeholder="e.g., admin, finance, hr">
                <div class="text-xs text-slate-500 mt-1">Module this permission belongs to (optional)</div>
            </div>

            <div class="mb-4">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="permission-description" rows="3"
                    placeholder="Describe this permission..."></textarea>
            </div>
        </form>
    </script>

    <?php get_footer(); ?>