<?php
/**
 * Template Name: HR: Add Employee
 * Description: Add new employee to the system
 */

$pageTitle = 'Add Employee';
$breadcrumb = [
    ['name' => 'Employees', 'url' => home_url('/hr/employees')],
    ['name' => 'Add Employee']
];
$activeMenu = 'hr-employees-add';
$requiredRoles = ['hr.employees.create'];

get_header();
?>

<!-- NETWORK ERROR DEBUG -->
<div id="network-err" class="hidden mb-4 alert alert-danger">
    <strong>API Error:</strong> <span id="network-err-msg"></span>
</div>

<!-- SUCCESS MESSAGE -->
<div id="success-msg" class="hidden mb-4 alert alert-success">
    <strong>Success!</strong> <span id="success-msg-text"></span>
</div>

<!-- ADD EMPLOYEE FORM -->
<div class="intro-y box p-5 mt-5">
    <div class="border-b border-slate-200/60 dark:border-darkmode-400 pb-5 mb-5">
        <div class="font-medium text-base">Add New Employee</div>
        <div class="text-slate-500 mt-1">Fill in the employee details below</div>
    </div>

    <form id="employee-form" class="grid grid-cols-12 gap-4 gap-y-5">
        <!-- Profile Selection -->
        <div class="col-span-12">
            <h3 class="font-medium text-base mb-3">1. Profile Information</h3>
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Select Existing Profile</label>
                    <select id="profile-id" class="form-select">
                        <option value="">-- Select Profile --</option>
                    </select>
                    <div class="text-xs text-slate-500 mt-1">Select an existing user profile to link to this employee
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Or Create New Profile</label>
                    <a href="<?php echo home_url('/admin/users/add'); ?>" class="btn btn-outline-secondary w-full"
                        target="_blank">
                        <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i>
                        Create New User Profile
                    </a>
                    <div class="text-xs text-slate-500 mt-1">Opens in new tab</div>
                </div>
            </div>
        </div>

        <!-- Employment Details -->
        <div class="col-span-12 border-t pt-5">
            <h3 class="font-medium text-base mb-3">2. Employment Details</h3>
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Employee ID *</label>
                    <input type="text" id="employee-id" class="form-control" placeholder="e.g. EMP001" required>
                    <div class="text-xs text-slate-500 mt-1">Unique employee identifier</div>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Employment Type *</label>
                    <select id="employment-type" class="form-select" required>
                        <option value="">-- Select Type --</option>
                        <option value="staff">Staff</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                        <option value="consultant">Consultant</option>
                        <option value="management">Management</option>
                    </select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Position/Job Title</label>
                    <input type="text" id="position" class="form-control" placeholder="e.g. Software Engineer">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Organization *</label>
                    <select id="organization-id" class="form-select" required>
                        <option value="">-- Select Organization --</option>
                    </select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Department *</label>
                    <select id="department-id" class="form-select" required>
                        <option value="">-- Select Department --</option>
                    </select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Team</label>
                    <select id="team-id" class="form-select">
                        <option value="">-- Select Team --</option>
                    </select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Manager</label>
                    <select id="manager-id" class="form-select">
                        <option value="">-- Select Manager --</option>
                    </select>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Join Date</label>
                    <input type="date" id="join-date" class="form-control">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Employment Status</label>
                    <select id="employment-status" class="form-select">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Additional Information -->
        <div class="col-span-12 border-t pt-5">
            <h3 class="font-medium text-base mb-3">3. Additional Information (Optional)</h3>
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">National ID</label>
                    <input type="text" id="national-id" class="form-control" placeholder="National ID Number">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Tax ID</label>
                    <input type="text" id="tax-id" class="form-control" placeholder="Tax ID Number">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Pension ID</label>
                    <input type="text" id="pension-id" class="form-control" placeholder="Pension ID Number">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Work Email</label>
                    <input type="email" id="work-email" class="form-control" placeholder="employee@company.com">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Work Phone</label>
                    <input type="tel" id="work-phone" class="form-control" placeholder="+234-xxx-xxxx">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Probation End Date</label>
                    <input type="date" id="probation-end-date" class="form-control">
                </div>

                <div class="col-span-12 md:col-span-6">
                    <label class="form-label">Contract End Date</label>
                    <input type="date" id="contract-end-date" class="form-control">
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="col-span-12 flex justify-end gap-2 border-t pt-5">
            <a href="<?php echo home_url('/hr/employees'); ?>" class="btn btn-outline-secondary w-24">Cancel</a>
            <button type="submit" id="btn-save" class="btn btn-primary w-32">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Employee
            </button>
        </div>
    </form>
</div>

<script>
    (function ($) {
        'use strict';

        const API = {
            employees: '/wp-json/api/v1/hr/employees',
            profiles: '/wp-json/api/v1/hr/profiles',
            organizations: '/wp-json/api/v1/organizations',
            groups: '/wp-json/api/v1/groups'
        };

        // State
        const state = {
            profiles: [],
            organizations: [],
            departments: [],
            teams: [],
            managers: [],
            saving: false
        };

        // --- INIT ---
        async function init() {
            await Promise.all([
                loadProfiles(),
                loadOrganizations(),
                loadGroups('department'),
                loadGroups('team')
            ]);
            bindEvents();
        }

        // --- LOAD DATA ---
        async function loadProfiles() {
            try {
                const res = await window.ApiClient.get(API.profiles);
                state.profiles = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                renderProfileSelect();
                renderManagerSelect();
            } catch (e) {
                console.warn('Profiles load failed', e);
            }
        }

        async function loadOrganizations() {
            try {
                const res = await window.ApiClient.get(API.organizations);
                state.organizations = res.data || [];
                renderOrganizationSelect();
            } catch (e) {
                console.warn('Organizations load failed', e);
            }
        }

        async function loadGroups(type) {
            try {
                const res = await window.ApiClient.get(`${API.groups}?type=${type}`);
                const data = res.data?.data || res.data || [];

                if (type === 'department') {
                    state.departments = data;
                    renderDepartmentSelect();
                } else {
                    state.teams = data;
                    renderTeamSelect();
                }
            } catch (e) {
                console.warn(`${type}s load failed`, e);
            }
        }

        // --- RENDER ---
        function renderProfileSelect() {
            const $select = $('#profile-id');
            $select.find('option:not(:first)').remove();

            state.profiles.forEach(profile => {
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
                $select.append(`<option value="${profile.id}">${name} (${profile.email})</option>`);
            });
        }

        function renderManagerSelect() {
            const $select = $('#manager-id');
            $select.find('option:not(:first)').remove();

            state.profiles.forEach(profile => {
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
                $select.append(`<option value="${profile.id}">${name}</option>`);
            });
        }

        function renderOrganizationSelect() {
            const $select = $('#organization-id');
            $select.find('option:not(:first)').remove();

            state.organizations.forEach(org => {
                $select.append(`<option value="${org.id}">${org.name}</option>`);
            });
        }

        function renderDepartmentSelect() {
            const $select = $('#department-id');
            $select.find('option:not(:first)').remove();

            state.departments.forEach(dept => {
                $select.append(`<option value="${dept.id}">${dept.name}</option>`);
            });
        }

        function renderTeamSelect() {
            const $select = $('#team-id');
            $select.find('option:not(:first)').remove();

            state.teams.forEach(team => {
                $select.append(`<option value="${team.id}">${team.name}</option>`);
            });
        }

        // --- FORM HANDLING ---
        function getFormData() {
            return {
                profile_id: $('#profile-id').val(),
                employee_id: $('#employee-id').val().trim(),
                employment_type: $('#employment-type').val(),
                position: $('#position').val().trim() || null,
                organization_id: $('#organization-id').val() || null,
                department_id: $('#department-id').val() || null,
                team_id: $('#team-id').val() || null,
                manager_id: $('#manager-id').val() || null,
                join_date: $('#join-date').val() || null,
                employment_status: $('#employment-status').val(),
                national_id: $('#national-id').val().trim() || null,
                tax_id: $('#tax-id').val().trim() || null,
                pension_id: $('#pension-id').val().trim() || null,
                work_email: $('#work-email').val().trim() || null,
                work_phone: $('#work-phone').val().trim() || null,
                probation_end_date: $('#probation-end-date').val() || null,
                contract_end_date: $('#contract-end-date').val() || null
            };
        }

        function validateForm(data) {
            if (!data.profile_id) {
                showError('Please select a profile');
                return false;
            }
            if (!data.employee_id) {
                showError('Employee ID is required');
                return false;
            }
            if (!data.employment_type) {
                showError('Employment Type is required');
                return false;
            }
            if (!data.organization_id) {
                showError('Organization is required');
                return false;
            }
            if (!data.department_id) {
                showError('Department is required');
                return false;
            }
            return true;
        }

        async function saveEmployee(e) {
            e.preventDefault();

            if (state.saving) return;

            const data = getFormData();
            if (!validateForm(data)) return;

            state.saving = true;
            $('#btn-save').prop('disabled', true).html('<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Saving...');

            try {
                const res = await window.ApiClient.post(API.employees, data);

                showSuccess('Employee created successfully! Redirecting...');

                // Redirect to employee directory after 1.5 seconds
                setTimeout(() => {
                    window.location.href = '/hr/employees';
                }, 1500);
            } catch (err) {
                console.error(err);
                showError(err.message || 'Failed to create employee');
                state.saving = false;
                $('#btn-save').prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Employee');
                if (window.lucide) window.lucide.createIcons();
            }
        }

        // --- HELPERS ---
        function showError(message) {
            $('#network-err').removeClass('hidden').find('span').text(message);
            $('#success-msg').addClass('hidden');
            $('html, body').animate({ scrollTop: 0 }, 300);
        }

        function showSuccess(message) {
            $('#success-msg').removeClass('hidden').find('span').text(message);
            $('#network-err').addClass('hidden');
            $('html, body').animate({ scrollTop: 0 }, 300);
        }

        // --- EVENTS ---
        function bindEvents() {
            $('#employee-form').on('submit', saveEmployee);
        }

        // --- START ---
        $(function () {
            init();
        });

    })(jQuery);
</script>

<?php get_footer(); ?>