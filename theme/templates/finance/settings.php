<?php /* Template Name: Finance: Settings */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Settings';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles)) {
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
                Finance Settings
            </h2>
        </div>

        <div class="grid grid-cols-12 gap-6 mt-5">
            <!-- General Settings -->
            <div class="col-span-12 lg:col-span-6">
                <div class="box">
                    <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                        <h2 class="font-medium text-base mr-auto">
                            General Settings
                        </h2>
                    </div>
                    <div class="p-5">
                        <form method="POST">
                            <div class="mt-3">
                                <label for="currency" class="form-label">Default Currency</label>
                                <select id="currency" name="currency" class="form-select w-full">
                                    <option value="NGN">Nigerian Naira (₦)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>
                            <div class="mt-3">
                                <label for="fiscal-year-start" class="form-label">Fiscal Year Start</label>
                                <input id="fiscal-year-start" type="date" name="fiscal_year_start" class="form-control w-full">
                            </div>
                            <div class="mt-3">
                                <label for="tax-rate" class="form-label">Default Tax Rate (%)</label>
                                <input id="tax-rate" type="number" name="tax_rate" class="form-control w-full" step="0.01">
                            </div>
                            <div class="mt-5">
                                <button type="submit" name="save_general" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Approval Settings -->
            <div class="col-span-12 lg:col-span-6">
                <div class="box">
                    <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                        <h2 class="font-medium text-base mr-auto">
                            Approval Settings
                        </h2>
                    </div>
                    <div class="p-5">
                        <form method="POST">
                            <div class="mt-3">
                                <label class="form-label">Approval Thresholds</label>
                                <div class="mt-2">
                                    <div class="form-inline">
                                        <label class="form-label sm:w-40">Team Lead Up to</label>
                                        <input type="number" name="team_lead_threshold" class="form-control" placeholder="Amount">
                                    </div>
                                    <div class="form-inline mt-2">
                                        <label class="form-label sm:w-40">Finance Up to</label>
                                        <input type="number" name="finance_threshold" class="form-control" placeholder="Amount">
                                    </div>
                                    <div class="form-inline mt-2">
                                        <label class="form-label sm:w-40">COO Up to</label>
                                        <input type="number" name="coo_threshold" class="form-control" placeholder="Amount">
                                    </div>
                                    <div class="form-inline mt-2">
                                        <label class="form-label sm:w-40">CEO Required Above</label>
                                        <input type="number" name="ceo_threshold" class="form-control" placeholder="Amount">
                                    </div>
                                </div>
                            </div>
                            <div class="mt-5">
                                <button type="submit" name="save_approval" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Notification Settings -->
            <div class="col-span-12 lg:col-span-6">
                <div class="box">
                    <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                        <h2 class="font-medium text-base mr-auto">
                            Notification Settings
                        </h2>
                    </div>
                    <div class="p-5">
                        <form method="POST">
                            <div class="mt-3">
                                <label class="form-label">Email Notifications</label>
                                <div class="mt-2">
                                    <div class="form-check">
                                        <input id="new-request" class="form-check-input" type="checkbox" name="notify_new_request">
                                        <label class="form-check-label" for="new-request">New Request Submissions</label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input id="approval-required" class="form-check-input" type="checkbox" name="notify_approval">
                                        <label class="form-check-label" for="approval-required">Approval Required</label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input id="request-approved" class="form-check-input" type="checkbox" name="notify_approved">
                                        <label class="form-check-label" for="request-approved">Request Approved</label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input id="request-rejected" class="form-check-input" type="checkbox" name="notify_rejected">
                                        <label class="form-check-label" for="request-rejected">Request Rejected</label>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-5">
                                <button type="submit" name="save_notifications" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Category Settings -->
            <div class="col-span-12 lg:col-span-6">
                <div class="box">
                    <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                        <h2 class="font-medium text-base mr-auto">
                            Category Settings
                        </h2>
                    </div>
                    <div class="p-5">
                        <form method="POST">
                            <div class="mt-3">
                                <label class="form-label">Expense Categories</label>
                                <div class="mt-2">
                                    <table class="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Category Name</th>
                                                <th>Description</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><input type="text" class="form-control" placeholder="Category name"></td>
                                                <td><input type="text" class="form-control" placeholder="Description"></td>
                                                <td>
                                                    <button type="button" class="btn btn-danger btn-sm">Remove</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button type="button" class="btn btn-outline-primary mt-3">Add Category</button>
                                </div>
                            </div>
                            <div class="mt-5">
                                <button type="submit" name="save_categories" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
