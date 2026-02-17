(function ($) {
    'use strict';

    // Config
    const API = {
        employees: '/wp-json/api/v1/hr/employees',
        contacts: '/wp-json/api/v1/contacts',
        profiles: '/wp-json/api/v1/hr/profiles',
        organizations: '/wp-json/api/v1/organizations',
        groups: '/wp-json/api/v1/groups'
    };

    // State
    const state = {
        employeeId: null,
        employee: null,
        profile: null,
        contacts: [],
        organizations: [],
        departments: [],
        teams: [],
        managers: [],
        saving: false
    };

    // --- INIT ---
    async function init() {
        state.employeeId = $('#employee-id').val();
        if (!state.employeeId) {
            window.location.href = '/hr/employees';
            return;
        }

        await Promise.all([
            loadOrganizations(),
            loadGroups('department'),
            loadGroups('team'),
            loadManagers(),
            loadEmployee()
        ]);
        bindEvents();
    }

    // --- LOAD DATA ---
    async function loadEmployee() {
        try {
            const res = await window.ApiClient.get(`${API.employees}/${state.employeeId}`);
            state.employee = res.data.employee_data;
            state.profile = res.data.profile;
            state.contacts = res.data.contacts || [];

            renderEmployee();
            renderProfile();
            renderContacts();

            $('#loading-state').addClass('hidden');
            $('#employee-content').removeClass('hidden');
        } catch (err) {
            console.error(err);
            showError(err.message || 'Failed to load employee');
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

    async function loadManagers() {
        try {
            const res = await window.ApiClient.get(API.profiles);
            state.managers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            renderManagerSelect();
        } catch (e) {
            console.warn('Managers load failed', e);
        }
    }

    // --- RENDER ---
    function renderEmployee() {
        const emp = state.employee;
        const profile = state.profile;

        // Set employee name in header
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
        $('#employee-name').text(name);

        // Populate employment form
        $('#emp-employee-id').val(emp.employee_id);
        $('#emp-employment-type').val(emp.employment_type);
        $('#emp-position').val(emp.position || '');
        $('#emp-organization-id').val(emp.organization_id || '');
        $('#emp-department-id').val(emp.department_id || '');
        $('#emp-team-id').val(emp.team_id || '');
        $('#emp-manager-id').val(emp.manager_id || '');
        $('#emp-join-date').val(emp.join_date || '');
        $('#emp-employment-status').val(emp.employment_status);
        $('#emp-national-id').val(emp.national_id || '');
        $('#emp-tax-id').val(emp.tax_id || '');
        $('#emp-pension-id').val(emp.pension_id || '');
        $('#emp-work-email').val(emp.work_email || '');
        $('#emp-work-phone').val(emp.work_phone || '');
        $('#emp-probation-end-date').val(emp.probation_end_date || '');
        $('#emp-contract-end-date').val(emp.contract_end_date || '');
    }

    function renderProfile() {
        const profile = state.profile;
        const html = `
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">First Name</label>
                <div class="font-medium">${profile.first_name || '-'}</div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">Last Name</label>
                <div class="font-medium">${profile.last_name || '-'}</div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">Email</label>
                <div class="font-medium">${profile.email || '-'}</div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">Phone</label>
                <div class="font-medium">${profile.phone || '-'}</div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">Date of Birth</label>
                <div class="font-medium">${profile.date_of_birth || '-'}</div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <label class="form-label text-slate-500">Gender</label>
                <div class="font-medium">${profile.gender || '-'}</div>
            </div>
            <div class="col-span-12">
                <label class="form-label text-slate-500">Address</label>
                <div class="font-medium">${profile.address || '-'}</div>
            </div>
        `;
        $('#profile-info').html(html);
        $('#link-edit-profile').attr('href', `/admin/users/edit/${profile.id}`);
    }

    function renderContacts() {
        const $list = $('#contacts-list');
        $list.empty();

        if (state.contacts.length === 0) {
            $('#contacts-empty').removeClass('hidden');
            return;
        }

        $('#contacts-empty').addClass('hidden');

        state.contacts.forEach(contact => {
            const primaryBadge = contact.is_primary ? 
                '<span class="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary ml-2">Primary</span>' : '';
            
            const html = `
                <div class="border rounded-lg p-4 mb-3">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="font-medium text-base">${contact.name}${primaryBadge}</div>
                            <div class="text-slate-500 text-sm mt-1">
                                <div><strong>Relationship:</strong> ${contact.relationship || '-'}</div>
                                <div><strong>Phone:</strong> ${contact.phone || '-'}</div>
                                ${contact.email ? `<div><strong>Email:</strong> ${contact.email}</div>` : ''}
                                ${contact.address ? `<div><strong>Address:</strong> ${contact.address}</div>` : ''}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary btn-edit-contact" data-id="${contact.id}">
                                <i data-lucide="edit" class="w-3 h-3"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete-contact" data-id="${contact.id}">
                                <i data-lucide="trash-2" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            $list.append(html);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    function renderOrganizationSelect() {
        const $select = $('#emp-organization-id');
        $select.find('option:not(:first)').remove();

        state.organizations.forEach(org => {
            $select.append(`<option value="${org.id}">${org.name}</option>`);
        });
    }

    function renderDepartmentSelect() {
        const $select = $('#emp-department-id');
        $select.find('option:not(:first)').remove();

        state.departments.forEach(dept => {
            $select.append(`<option value="${dept.id}">${dept.name}</option>`);
        });
    }

    function renderTeamSelect() {
        const $select = $('#emp-team-id');
        $select.find('option:not(:first)').remove();

        state.teams.forEach(team => {
            $select.append(`<option value="${team.id}">${team.name}</option>`);
        });
    }

    function renderManagerSelect() {
        const $select = $('#emp-manager-id');
        $select.find('option:not(:first)').remove();

        state.managers.forEach(manager => {
            const name = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.username;
            $select.append(`<option value="${manager.id}">${name}</option>`);
        });
    }

    // --- FORM HANDLING ---
    async function saveEmployment(e) {
        e.preventDefault();
        
        if (state.saving) return;

        const data = {
            employee_id: $('#emp-employee-id').val().trim(),
            employment_type: $('#emp-employment-type').val(),
            position: $('#emp-position').val().trim() || null,
            organization_id: $('#emp-organization-id').val() || null,
            department_id: $('#emp-department-id').val() || null,
            team_id: $('#emp-team-id').val() || null,
            manager_id: $('#emp-manager-id').val() || null,
            join_date: $('#emp-join-date').val() || null,
            employment_status: $('#emp-employment-status').val(),
            national_id: $('#emp-national-id').val().trim() || null,
            tax_id: $('#emp-tax-id').val().trim() || null,
            pension_id: $('#emp-pension-id').val().trim() || null,
            work_email: $('#emp-work-email').val().trim() || null,
            work_phone: $('#emp-work-phone').val().trim() || null,
            probation_end_date: $('#emp-probation-end-date').val() || null,
            contract_end_date: $('#emp-contract-end-date').val() || null
        };

        state.saving = true;
        const $btn = $('#employment-form button[type="submit"]');
        $btn.prop('disabled', true).html('<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Saving...');

        try {
            await window.ApiClient.put(`${API.employees}/${state.employeeId}`, data);
            showSuccess('Employment details updated successfully!');
            await loadEmployee();
        } catch (err) {
            console.error(err);
            showError(err.message || 'Failed to update employee');
        } finally {
            state.saving = false;
            $btn.prop('disabled', false).html('<i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Changes');
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // --- CONTACT MODAL ---
    function getModal(idSelector) {
        const el = document.querySelector(idSelector);
        if (window.tailwind && window.tailwind.Modal) {
            return window.tailwind.Modal.getOrCreateInstance(el);
        }
        return {
            show: () => $(idSelector).addClass('show').css('display', 'block'),
            hide: () => {
                const instance = window.tailwind ? window.tailwind.Modal.getInstance(el) : null;
                if (instance) instance.hide();
                else $('[data-tw-dismiss="modal"]').click();
            }
        };
    }

    function openContactModal(contact = null) {
        $('#contact-form')[0].reset();
        $('#contact-id').val('');
        $('#modal-contact-title').text(contact ? 'Edit Emergency Contact' : 'Add Emergency Contact');

        if (contact) {
            $('#contact-id').val(contact.id);
            $('#contact-name').val(contact.name);
            $('#contact-relationship').val(contact.relationship || '');
            $('#contact-phone').val(contact.phone || '');
            $('#contact-email').val(contact.email || '');
            $('#contact-address').val(contact.address || '');
            $('#contact-primary').prop('checked', !!contact.is_primary);
        }

        getModal('#modal-contact').show();
    }

    async function saveContact() {
        const id = $('#contact-id').val();
        const data = {
            entity_type: 'employee',
            entity_id: state.profile.id,
            contact_type: 'emergency',
            name: $('#contact-name').val().trim(),
            relationship: $('#contact-relationship').val().trim(),
            phone: $('#contact-phone').val().trim(),
            email: $('#contact-email').val().trim() || null,
            address: $('#contact-address').val().trim() || null,
            is_primary: $('#contact-primary').is(':checked')
        };

        if (!data.name || !data.relationship || !data.phone) {
            showError('Name, relationship, and phone are required');
            return;
        }

        try {
            if (id) {
                await window.ApiClient.put(`${API.contacts}/${id}`, data);
            } else {
                await window.ApiClient.post(API.contacts, data);
            }

            getModal('#modal-contact').hide();
            showSuccess('Contact saved successfully!');
            await loadEmployee();
        } catch (err) {
            console.error(err);
            showError(err.message || 'Failed to save contact');
        }
    }

    async function deleteContact(id) {
        if (!confirm('Delete this emergency contact?')) return;

        try {
            await window.ApiClient.delete(`${API.contacts}/${id}`);
            showSuccess('Contact deleted successfully!');
            await loadEmployee();
        } catch (err) {
            console.error(err);
            showError(err.message || 'Failed to delete contact');
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
        $('#employment-form').on('submit', saveEmployment);
        $('#btn-add-contact').on('click', () => openContactModal());
        $('#btn-save-contact').on('click', saveContact);
        
        $(document).on('click', '.btn-edit-contact', function() {
            const id = $(this).data('id');
            const contact = state.contacts.find(c => c.id == id);
            if (contact) openContactModal(contact);
        });

        $(document).on('click', '.btn-delete-contact', function() {
            const id = $(this).data('id');
            deleteContact(id);
        });
    }

    // --- START ---
    $(function() {
        init();
    });

})(jQuery);
