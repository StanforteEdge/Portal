<?php

/**
 * Template Name: Admin: Organizations
 * Description: Manage system organizations (Group, Ventures)
 */

$pageTitle = 'Organization Management';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Organizations']
];
$activeMenu = 'admin-settings-organizations';
$requiredPermissions = ['settings.manage'];

get_header();
// \App\Helpers\PageHelper::checkPageAccess('settings.manage');
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Organizations
    </h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <button id="btn-create-org" class="btn btn-primary shadow-md mr-2">New Organization</button>
    </div>
</div>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap justify-between items-center mt-2">
        <div class="hidden md:block text-slate-500">Manage the Group and Ventures structure</div>
        <div class="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0">
            <div class="w-56 relative text-slate-500">
                <input type="text" class="form-control w-56 box pr-10" placeholder="Search...">
                <i data-lucide="search" class="w-4 h-4 absolute my-auto inset-y-0 right-0 mr-3"></i>
            </div>
        </div>
    </div>

    <!-- Organizations Table -->
    <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
        <table class="table table-report -mt-2">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">NAME</th>
                    <th class="whitespace-nowrap">CODE</th>
                    <th class="text-center whitespace-nowrap">TYPE</th>
                    <th class="whitespace-nowrap">PARENT ORGANIZATION</th>
                    <th class="text-center whitespace-nowrap">STATUS</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="orgs-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading organizations...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No organizations found. Create one to get started.
        </div>
    </div>
</div>

<!-- Organization Modal -->
<div id="modal-org" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg"> <!-- modal-lg for potentially more fields -->
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="modal-org-title">Organization</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <form id="org-form" onsubmit="return false;" class="col-span-12 grid grid-cols-12 gap-4 gap-y-3">
                    <input type="hidden" id="org-id">

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="org-name" required
                            placeholder="e.g. Stanforte Edge">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Code *</label>
                        <input type="text" class="form-control" id="org-code" required placeholder="e.g. SFE">
                        <div class="text-xs text-slate-500 mt-1">Unique identifier/prefix</div>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Type</label>
                        <select class="form-select" id="org-type">
                            <option value="venture">Venture</option>
                            <option value="group">Group</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6" id="parent-field-container">
                        <label class="form-label">Parent Organization</label>
                        <select class="form-select" id="org-parent-id">
                            <option value="">None</option>
                            <!-- Populated via JS -->
                        </select>
                    </div>

                    <div class="col-span-12">
                        <label class="cursor-pointer flex items-center">
                            <input type="checkbox" id="org-active" class="form-checkbox border" checked>
                            <span class="ml-2">Active</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal"
                    class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" id="btn-save-org" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        const API = {
            organizations: '/wp-json/api/v1/organizations'
        };

        let state = {
            organizations: []
        };

        // Helper: Get Modal
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

        async function init() {
            await loadOrganizations();
        }

        async function loadOrganizations() {
            $('#loading-state').removeClass('hidden');
            $('#orgs-table-body').empty();
            $('#empty-state').addClass('hidden');

            try {
                const res = await window.ApiClient.get(API.organizations + '?show_inactive=1');
                state.organizations = res.data || [];
                renderTable();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
                $('#loading-state').text('Error loading data');
            }
        }

        function renderTable() {
            const $tbody = $('#orgs-table-body');
            const $loading = $('#loading-state');
            const $empty = $('#empty-state');

            $loading.addClass('hidden');

            if (state.organizations.length === 0) {
                $empty.removeClass('hidden');
                return;
            }

            $empty.addClass('hidden');

            // Sort: Group first, then Ventures
            const sorted = [...state.organizations].sort((a, b) => {
                if (a.organization_type === b.organization_type) return a.name.localeCompare(b.name);
                return a.organization_type === 'group' ? -1 : 1;
            });

            const rows = sorted.map(org => {
                const parent = state.organizations.find(o => o.id === org.parent_organization_id);

                const typeBadge = org.organization_type === 'group' ?
                    '<span class="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary uppercase">Group</span>' :
                    '<span class="px-2 py-1 text-xs font-medium rounded bg-pending/10 text-pending uppercase">Venture</span>';

                const activeHtml = org.is_active ?
                    `<div class="flex items-center justify-center text-success"> <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Active </div>` :
                    `<div class="flex items-center justify-center text-danger"> <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Inactive </div>`;

                return `
                <tr class="intro-x">
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="font-medium whitespace-nowrap">${org.name}</div>
                    </td>
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                         <div class="text-slate-500 text-xs font-mono">${org.code}</div>
                    </td>
                    <td class="text-center first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        ${typeBadge}
                    </td>
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="text-slate-500">${parent ? parent.name : '-'}</div>
                    </td>
                    <td class="w-40 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        ${activeHtml}
                    </td>
                    <td class="table-report__action w-56 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 cursor-pointer btn-edit-org" data-id="${org.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer btn-delete-org" data-id="${org.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `
            }).join('');

            $tbody.html(rows);
            if (window.lucide) window.lucide.createIcons();
        }

        function openModal(org = null) {
            $('#org-form')[0].reset();
            $('#org-id').val('');
            $('#modal-org-title').text(org ? 'Edit Organization' : 'New Organization');

            // Populate Parents Dropdown (exclude self)
            const $parentSelect = $('#org-parent-id');
            $parentSelect.empty().append('<option value="">None</option>');

            state.organizations.forEach(o => {
                if (org && o.id === org.id) return; // Cannot be own parent
                // Allow all parents, or maybe just Groups? Let's allow all for flexibility.
                $parentSelect.append(`<option value="${o.id}">${o.name}</option>`);
            });

            if (org) {
                $('#org-id').val(org.id);
                $('#org-name').val(org.name);
                $('#org-code').val(org.code);
                $('#org-type').val(org.organization_type);
                $('#org-parent-id').val(org.parent_organization_id);
                $('#org-active').prop('checked', !!org.is_active);
            }

            getModal('#modal-org').show();
        }

        async function saveOrg() {
            const id = $('#org-id').val();
            const data = {
                name: $('#org-name').val().trim(),
                code: $('#org-code').val().trim(),
                organization_type: $('#org-type').val(),
                parent_organization_id: $('#org-parent-id').val() || null,
                is_active: $('#org-active').is(':checked') ? 1 : 0
            };

            if (!data.name || !data.code) {
                showToast('Name and Code are required', 'error');
                return;
            }

            try {
                if (id) {
                    await window.ApiClient.put(`${API.organizations}/${id}`, data);
                    showToast('Organization updated', 'success');
                } else {
                    await window.ApiClient.post(API.organizations, data);
                    showToast('Organization created', 'success');
                }
                getModal('#modal-org').hide();
                loadOrganizations();
            } catch (err) {
                console.error(err);
                const msg = err.responseJSON?.message || 'Failed to save organization';
                showToast(msg, 'error');
            }
        }

        async function deleteOrg(id) {
            if (!confirm('Are you sure you want to delete this organization? This might affect existing data.')) return;

            try {
                await window.ApiClient.delete(`${API.organizations}/${id}`);
                showToast('Organization deleted', 'success');
                loadOrganizations();
            } catch (err) {
                console.error(err);
                showToast('Failed to delete organization', 'error');
            }
        }

        // Bindings
        $(function () {
            init();

            $('#btn-create-org').on('click', () => openModal());
            $('#btn-save-org').on('click', saveOrg);

            $(document).on('click', '.btn-edit-org', function () {
                const id = $(this).data('id');
                const org = state.organizations.find(o => o.id == id);
                openModal(org);
            });

            $(document).on('click', '.btn-delete-org', function () {
                deleteOrg($(this).data('id'));
            });
        });

    })(jQuery);
</script>

<?php get_footer(); ?>