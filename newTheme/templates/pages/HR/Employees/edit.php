<?php
/**
 * Template Name: HR: Edit Employee
 * Description: Edit employee information
 */

// Get employee ID from URL
$employee_id = get_query_var('id');
if (!$employee_id) {
    wp_redirect(home_url('/hr/employees'));
    exit;
}

$pageTitle = 'Edit Employee';
$breadcrumb = [
    ['name' => 'Employees', 'url' => home_url('/hr/employees')],
    ['name' => 'Edit Employee']
];
$activeMenu = 'hr-employees-edit';

get_header();
?>

<input type="hidden" id="employee-id" value="<?php echo esc_attr($employee_id); ?>">

<!-- NETWORK ERROR DEBUG -->
<div id="network-err" class="hidden mb-4 alert alert-danger">
    <strong>API Error:</strong> <span id="network-err-msg"></span>
</div>

<!-- SUCCESS MESSAGE -->
<div id="success-msg" class="hidden mb-4 alert alert-success">
    <strong>Success!</strong> <span id="success-msg-text"></span>
</div>

<!-- LOADING STATE -->
<div id="loading-state" class="intro-y box p-8 mt-5 text-center">
    <i data-lucide="loader" class="w-8 h-8 mx-auto animate-spin text-primary"></i>
    <div class="mt-2 text-slate-500">Loading employee data...</div>
</div>

<!-- EDIT EMPLOYEE FORM -->
<div id="employee-content" class="hidden">
    <!-- Header with Employee Info -->
    <div class="intro-y flex items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">
            Edit Employee: <span id="employee-name" class="text-primary"></span>
        </h2>
        <div class="flex gap-2">
            <a href="<?php echo home_url('/hr/employees'); ?>" class="btn btn-outline-secondary">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back to List
            </a>
        </div>
    </div>

    <!-- Tabs -->
    <div class="intro-y box mt-5">
        <ul class="nav nav-tabs flex-col sm:flex-row justify-center lg:justify-start" role="tablist">
            <li class="nav-item flex-1" role="presentation">
                <button class="nav-link w-full py-4 active" data-tw-toggle="pill" data-tw-target="#tab-employment"
                    type="button" role="tab">
                    <i data-lucide="briefcase" class="w-4 h-4 mr-2"></i> Employment Details
                </button>
            </li>
            <li class="nav-item flex-1" role="presentation">
                <button class="nav-link w-full py-4" data-tw-toggle="pill" data-tw-target="#tab-profile" type="button"
                    role="tab">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile
                </button>
            </li>
            <li class="nav-item flex-1" role="presentation">
                <button class="nav-link w-full py-4" data-tw-toggle="pill" data-tw-target="#tab-contacts" type="button"
                    role="tab">
                    <i data-lucide="phone" class="w-4 h-4 mr-2"></i> Emergency Contacts
                </button>
            </li>
        </ul>
    </div>

    <div class="tab-content mt-5">
        <!-- Employment Details Tab -->
        <div id="tab-employment" class="tab-pane active" role="tabpanel">
            <div class="intro-y box p-5">
                <form id="employment-form" class="grid grid-cols-12 gap-4 gap-y-5">
                    <div class="col-span-12 border-b pb-3">
                        <h3 class="font-medium text-base">Employment Information</h3>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Employee ID *</label>
                        <input type="text" id="emp-employee-id" class="form-control" required>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Employment Type *</label>
                        <select id="emp-employment-type" class="form-select" required>
                            <option value="staff">Staff</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                            <option value="consultant">Consultant</option>
                            <option value="management">Management</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Position/Job Title</label>
                        <input type="text" id="emp-position" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Organization *</label>
                        <select id="emp-organization-id" class="form-select" required>
                            <option value="">-- Select Organization --</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Department *</label>
                        <select id="emp-department-id" class="form-select" required>
                            <option value="">-- Select Department --</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Team</label>
                        <select id="emp-team-id" class="form-select">
                            <option value="">-- Select Team --</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Manager</label>
                        <select id="emp-manager-id" class="form-select">
                            <option value="">-- Select Manager --</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Join Date</label>
                        <input type="date" id="emp-join-date" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Employment Status</label>
                        <select id="emp-employment-status" class="form-select">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on_leave">On Leave</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>

                    <div class="col-span-12 border-t pt-4">
                        <h4 class="font-medium mb-3">Additional Information</h4>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">National ID</label>
                        <input type="text" id="emp-national-id" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Tax ID</label>
                        <input type="text" id="emp-tax-id" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Pension ID</label>
                        <input type="text" id="emp-pension-id" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Work Email</label>
                        <input type="email" id="emp-work-email" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Work Phone</label>
                        <input type="tel" id="emp-work-phone" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Probation End Date</label>
                        <input type="date" id="emp-probation-end-date" class="form-control">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Contract End Date</label>
                        <input type="date" id="emp-contract-end-date" class="form-control">
                    </div>

                    <div class="col-span-12 flex justify-end gap-2 border-t pt-5">
                        <button type="submit" class="btn btn-primary w-32">
                            <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Profile Tab -->
        <div id="tab-profile" class="tab-pane" role="tabpanel">
            <div class="intro-y box p-5">
                <div class="border-b pb-3 mb-4">
                    <h3 class="font-medium text-base">User Profile Information</h3>
                    <div class="text-xs text-slate-500 mt-1">This information is managed in the user profile section
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4" id="profile-info">
                    <!-- Populated via JS -->
                </div>

                <div class="mt-5 pt-4 border-t">
                    <a href="#" id="link-edit-profile" class="btn btn-outline-primary" target="_blank">
                        <i data-lucide="external-link" class="w-4 h-4 mr-2"></i>
                        Edit User Profile
                    </a>
                </div>
            </div>
        </div>

        <!-- Emergency Contacts Tab -->
        <div id="tab-contacts" class="tab-pane" role="tabpanel">
            <div class="intro-y box p-5">
                <div class="flex items-center border-b pb-3 mb-4">
                    <h3 class="font-medium text-base mr-auto">Emergency Contacts</h3>
                    <button id="btn-add-contact" class="btn btn-primary btn-sm">
                        <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Contact
                    </button>
                </div>

                <div id="contacts-list">
                    <!-- Populated via JS -->
                </div>
                <div id="contacts-empty" class="hidden text-center py-8 text-slate-500">
                    No emergency contacts added yet.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Contact Modal -->
<div id="modal-contact" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="modal-contact-title">Add Emergency Contact</h2>
            </div>
            <div class="modal-body">
                <form id="contact-form" class="grid grid-cols-12 gap-4">
                    <input type="hidden" id="contact-id">

                    <div class="col-span-12">
                        <label class="form-label">Name *</label>
                        <input type="text" id="contact-name" class="form-control" required>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Relationship *</label>
                        <input type="text" id="contact-relationship" class="form-control"
                            placeholder="e.g. Spouse, Parent, Sibling" required>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Phone *</label>
                        <input type="tel" id="contact-phone" class="form-control" required>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Email</label>
                        <input type="email" id="contact-email" class="form-control">
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Address</label>
                        <textarea id="contact-address" class="form-control" rows="2"></textarea>
                    </div>

                    <div class="col-span-12">
                        <label class="cursor-pointer flex items-center">
                            <input type="checkbox" id="contact-primary" class="form-checkbox border">
                            <span class="ml-2">Set as primary contact</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal"
                    class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" id="btn-save-contact" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>

<script src="<?php echo get_template_directory_uri(); ?>/assets/js/hr/employee-edit.js"></script>

<?php get_footer(); ?>