<?php

/**
 * Template Name: Admin: Groups & Teams
 * Description: Manage system groups (Departments, Teams, Committees)
 */

$pageTitle = 'Groups & Teams Management';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Groups & Teams']
];
$activeMenu = 'admin-settings-groups';

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Groups, Teams & Departments
    </h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <button id="btn-create-group" class="btn btn-primary shadow-md mr-2">New Group</button>
    </div>
</div>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- Filters -->
    <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
        <div class="flex items-center mr-4">
            <label class="mr-2 text-slate-500 whitespace-nowrap">Filter Type:</label>
            <select id="filter-type" class="form-select w-40 box">
                <option value="">All Types</option>
                <option value="department">Departments</option>
                <option value="team">Teams</option>
                <option value="committee">Committees</option>
                <option value="general">General</option>
            </select>
        </div>
        <div class="flex items-center mr-4">
            <label class="mr-2 text-slate-500 whitespace-nowrap">Organization:</label>
            <select id="filter-org" class="form-select w-56 box">
                <option value="">All Organizations</option>
                <!-- Populated via JS -->
            </select>
        </div>
        <div class="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto">
            <div class="w-56 relative text-slate-500">
                <input type="text" id="search-input" class="form-control w-56 box pr-10" placeholder="Search groups...">
                <i data-lucide="search" class="w-4 h-4 absolute my-auto inset-y-0 right-0 mr-3"></i>
            </div>
        </div>
    </div>

    <!-- Groups Table -->
    <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
        <table class="table table-report -mt-2">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">GROUP NAME</th>
                    <th class="text-center whitespace-nowrap">TYPE</th>
                    <th class="whitespace-nowrap">ORGANIZATION</th>
                    <th class="text-center whitespace-nowrap">MEMBERS</th>
                    <th class="text-center whitespace-nowrap">STATUS</th>
                    <th class="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="groups-table-body">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading groups...
        </div>
        <div id="empty-state" class="hidden p-8 text-center text-gray-500">
            No groups found. Create one to get started.
        </div>
    </div>
</div>

<!-- Group Modal -->
<div id="modal-group" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="modal-group-title">Manage Group</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <form id="group-form" onsubmit="return false;" class="col-span-12 grid grid-cols-12 gap-4 gap-y-3">
                    <input type="hidden" id="group-id">

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="group-name" required placeholder="e.g. Finance Team">
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Type *</label>
                        <select class="form-select" id="group-type" required>
                            <option value="department">Department</option>
                            <option value="team">Team</option>
                            <option value="committee">Committee</option>
                            <option value="general">General Group</option>
                        </select>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Belongs to Organization</label>
                        <select class="form-select" id="group-org-id">
                            <option value="">None (Global)</option>
                            <!-- Populated via JS -->
                        </select>
                        <div class="text-xs text-slate-500 mt-1">Scope this group to a specific venture</div>
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="form-label">Parent Group</label>
                        <select class="form-select" id="group-parent-id">
                            <option value="">None</option>
                            <!-- Populated via JS -->
                        </select>
                    </div>

                    <div class="col-span-12">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="group-description" rows="2" placeholder="What does this group do?"></textarea>
                    </div>

                    <div class="col-span-12">
                        <label class="cursor-pointer flex items-center">
                            <input type="checkbox" id="group-active" class="form-checkbox border" checked>
                            <span class="ml-2">Active</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" id="btn-save-group" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const API = {
            groups: '/wp-json/api/v1/groups',
            organizations: '/wp-json/api/v1/organizations'
        };

        let state = {
            groups: [],
            organizations: []
        };

        function getModal(idSelector) {
            const el = document.querySelector(idSelector);
            if (window.tailwind && window.tailwind.Modal) {
                return window.tailwind.Modal.getOrCreateInstance(el);
            }
            return {
                show: () => $(idSelector).addClass('show').css('display', 'block'),
                hide: () => $(idSelector).removeClass('show').css('display', 'none')
            };
        }

        async function init() {
            await Promise.all([
                loadOrganizations(),
                loadGroups()
            ]);
            populateSelects();
        }

        async function loadOrganizations() {
            try {
                const res = await window.ApiClient.get(API.organizations);
                state.organizations = res.data || [];
            } catch (err) {
                console.error('Failed to load organizations', err);
            }
        }

        async function loadGroups() {
            $('#loading-state').removeClass('hidden');
            $('#groups-table-body').empty();

            const type = $('#filter-type').val();
            const orgId = $('#filter-org').val();
            const search = $('#search-input').val();

            let url = API.groups + '?per_page=100';
            if (type) url += `&type=${type}`;
            if (orgId) url += `&organization_id=${orgId}`;
            if (search) url += `&search=${search}`;

            try {
                const res = await window.ApiClient.get(url);
                state.groups = res.data || [];
                renderTable();
            } catch (err) {
                console.error(err);
                $('#loading-state').text('Error loading groups');
            }
        }

        function populateSelects() {
            const $filterOrg = $('#filter-org');
            const $modalOrg = $('#group-org-id');

            const orgOptions = state.organizations.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
            $filterOrg.append(orgOptions);
            $modalOrg.append(orgOptions);
        }

        function renderTable() {
            const $tbody = $('#groups-table-body');
            $('#loading-state').addClass('hidden');

            if (state.groups.length === 0) {
                $('#empty-state').removeClass('hidden');
                return;
            }

            $('#empty-state').addClass('hidden');

            const rows = state.groups.map(group => {
                const org = state.organizations.find(o => o.id == group.organization_id);

                const typeClasses = {
                    department: 'bg-primary/10 text-primary',
                    team: 'bg-success/10 text-success',
                    committee: 'bg-warning/10 text-warning',
                    general: 'bg-slate-100 text-slate-600'
                };
                const badgeClass = typeClasses[group.type] || typeClasses.general;

                return `
                <tr class="intro-x cursor-pointer hover:bg-slate-50" data-group-id="${group.id}">
                    <td>
                        <div class="font-medium whitespace-nowrap">${group.name}</div>
                        <div class="text-slate-500 text-xs mt-0.5">${group.description || 'No description'}</div>
                    </td>
                    <td class="text-center">
                        <span class="px-2 py-1 text-xs font-medium rounded uppercase ${badgeClass}">${group.type}</span>
                    </td>
                    <td>
                        <div class="text-slate-600">${org ? org.name : '<span class="text-slate-400 italic">Global</span>'}</div>
                    </td>
                    <td class="text-center">
                        <div class="font-bold text-primary">${group.members_count || 0}</div>
                    </td>
                    <td>
                        <div class="flex items-center justify-center ${group.is_active ? 'text-success' : 'text-danger'}">
                            <i data-lucide="${group.is_active ? 'check-square' : 'x-square'}" class="w-4 h-4 mr-2"></i>
                            ${group.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 cursor-pointer btn-edit-group" data-id="${group.id}" onclick="event.stopPropagation()">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer btn-delete-group" data-id="${group.id}" onclick="event.stopPropagation()">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            $tbody.html(rows);
            if (window.lucide) window.lucide.createIcons();
        }

        function openModal(group = null) {
            $('#group-form')[0].reset();
            $('#group-id').val('');
            $('#modal-group-title').text(group ? 'Edit Group' : 'New Group');

            // Populate Parent Select (exclude self)
            const $parentSelect = $('#group-parent-id');
            $parentSelect.empty().append('<option value="">None</option>');
            state.groups.forEach(g => {
                if (group && g.id == group.id) return;
                $parentSelect.append(`<option value="${g.id}">${g.name} (${g.type})</option>`);
            });

            if (group) {
                $('#group-id').val(group.id);
                $('#group-name').val(group.name);
                $('#group-type').val(group.type);
                $('#group-org-id').val(group.organization_id || '');
                $('#group-parent-id').val(group.parent_id || '');
                $('#group-description').val(group.description);
                $('#group-active').prop('checked', !!group.is_active);
            }

            getModal('#modal-group').show();
        }

        async function saveGroup() {
            const id = $('#group-id').val();
            const data = {
                name: $('#group-name').val().trim(),
                type: $('#group-type').val(),
                organization_id: $('#group-org-id').val() || null,
                parent_id: $('#group-parent-id').val() || null,
                description: $('#group-description').val().trim(),
                is_active: $('#group-active').is(':checked') ? 1 : 0
            };

            if (!data.name) {
                showToast('Group name is required', 'error');
                return;
            }

            try {
                if (id) {
                    await window.ApiClient.put(`${API.groups}/${id}`, data);
                    showToast('Group updated successfully', 'success');
                } else {
                    await window.ApiClient.post(API.groups, data);
                    showToast('Group created successfully', 'success');
                }
                getModal('#modal-group').hide();
                loadGroups();
            } catch (err) {
                showToast(err.responseJSON?.message || 'Failed to save group', 'error');
            }
        }

        // Bindings
        $(function() {
            init();
            $('#btn-create-group').on('click', () => openModal());
            $('#btn-save-group').on('click', saveGroup);
            $('#filter-type, #filter-org').on('change', loadGroups);
            $('#search-input').on('keyup', debounce(loadGroups, 500));

            // Navigate to group detail page on row click
            $(document).on('click', '#groups-table-body tr[data-group-id]', function() {
                const groupId = $(this).data('group-id');
                window.location.href = '/admin/groups/group/?id=' + groupId;
            });

            $(document).on('click', '.btn-edit-group', function() {
                const id = $(this).data('id');
                const group = state.groups.find(g => g.id == id);
                openModal(group);
            });

            $(document).on('click', '.btn-delete-group', function() {
                const id = $(this).data('id');
                if (confirm('Are you sure you want to delete this group?')) {
                    window.ApiClient.delete(`${API.groups}/${id}`).then(() => {
                        showToast('Group deleted', 'success');
                        loadGroups();
                    });
                }
            });
        });

        function debounce(func, wait) {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, arguments), wait);
            };
        }

    })(jQuery);
</script>

<?php get_footer(); ?>