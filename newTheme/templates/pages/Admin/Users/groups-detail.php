<?php

/**
 * Template Name: Admin: Groups & Teams - Edit
 * Description: Edit a group and manage its members
 */

$groupId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

$pageTitle = 'Group Edit';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Groups & Teams', 'url' => home_url('/admin/groups')],
    ['name' => 'Group Edit']
];
$activeMenu = 'admin-groups-edit';
$requiredPermissions = ['manage_groups'];

get_header();
?>

<div class="intro-y flex flex-col sm:flex-row items-center mt-8">
    <h2 class="text-lg font-medium mr-auto" id="group-page-title">
        Group View
    </h2>
    <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
        <a href="<?php echo esc_url(home_url('/admin/groups')); ?>" class="btn btn-outline-secondary mr-2">
            Back to Groups
        </a>
        <button id="btn-save-group" class="btn btn-primary shadow-md">Save Changes</button>
    </div>
</div>

<?php if (!$groupId): ?>
    <div class="intro-y box p-5 mt-5">
        <p class="text-danger">
            No group selected. Please open this page with a <code>?group_id=ID</code> query parameter.
        </p>
    </div>
    <?php get_footer();
    return; ?>
<?php endif; ?>

<div class="grid grid-cols-12 gap-6 mt-5" data-group-id="<?php echo (int) $groupId; ?>">
    <!-- Group Details -->
    <div class="intro-y col-span-12 lg:col-span-5">
        <div class="box p-5">
            <h3 class="font-medium mb-4">Group Details</h3>
            <form id="group-form" onsubmit="return false;">
                <div class="mb-3">
                    <label class="form-label">Name *</label>
                    <input type="text" class="form-control" id="group-name" required placeholder="e.g. Finance Team">
                </div>

                <div class="mb-3">
                    <label class="form-label">Type</label>
                    <select class="form-select" id="group-type">
                        <option value="department">Department</option>
                        <option value="team">Team</option>
                        <option value="committee">Committee</option>
                        <option value="general">General</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label">Organization</label>
                    <select class="form-select" id="group-org-id">
                        <option value="">None (Global)</option>
                        <!-- Populated via JS -->
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label">Parent Group</label>
                    <select class="form-select" id="group-parent-id">
                        <option value="">None</option>
                        <!-- Populated via JS -->
                    </select>
                    <div class="text-xs text-slate-500 mt-1">Optional: e.g. Department → Team</div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="group-description" rows="3"
                        placeholder="What does this group do?"></textarea>
                </div>

                <div class="mb-3">
                    <label class="cursor-pointer flex items-center">
                        <input type="checkbox" id="group-active" class="form-checkbox border" checked>
                        <span class="ml-2">Active</span>
                    </label>
                </div>
            </form>
        </div>
    </div>

    <!-- Members -->
    <div class="intro-y col-span-12 lg:col-span-7">
        <div class="box p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium">Members</h3>
                <div class="flex space-x-2">
                    <button id="btn-bulk-remove" class="btn btn-outline-danger btn-sm hidden">
                        Remove Selected
                    </button>
                    <button id="btn-add-member" class="btn btn-primary btn-sm">
                        Add Members
                    </button>
                </div>
            </div>

            <div class="mb-3">
                <input type="text" id="member-filter" class="form-control w-64"
                    placeholder="Filter by name or email...">
            </div>

            <div class="overflow-auto">
                <table class="table table-report">
                    <thead>
                        <tr>
                            <th class="w-10 text-center">
                                <input type="checkbox" id="select-all-members" class="form-check-input">
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th class="text-center">Role</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="members-table-body">
                        <!-- Populated via JS -->
                    </tbody>
                </table>
                <div id="members-loading" class="p-4 text-center text-slate-500">
                    Loading members...
                </div>
                <div id="members-empty" class="hidden p-4 text-center text-slate-500">
                    No members found. Add someone to get started.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Members Modal -->
<div id="modal-members" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Members</h2>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Search Users</label>
                    <input type="text" id="user-search-input" class="form-control" value=""
                        placeholder="Search by name or email...">
                </div>

                <div class="mb-3">
                    <label class="form-label">Role in Group</label>
                    <select id="new-member-role" class="form-select w-48">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                </div>

                <div class="overflow-auto max-h-80">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="w-10 text-center">
                                    <input type="checkbox" id="select-all-search-results" class="form-check-input">
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody id="user-search-results">
                            <!-- Filled via JS -->
                        </tbody>
                    </table>
                    <div id="user-search-empty" class="hidden p-4 text-center text-slate-500">
                        Type to search for users...
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal"
                    class="btn btn-outline-secondary w-20 mr-1">
                    Cancel
                </button>
                <button type="button" id="btn-add-selected-users"
                    class="btn btn-primary w-32">
                    Add Selected
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    (function($) {
        'use strict';

        const GROUP_ID = <?php echo (int) $groupId; ?>;

        const API = {
            groups: '/wp-json/api/v1/groups',
            organizations: '/wp-json/api/v1/organizations',
            groupMembers: (id) => `/wp-json/api/v1/groups/${id}/members`,
            bulkAdd: (id) => `/wp-json/api/v1/groups/${id}/bulk-add-users`,
            bulkRemove: (id) => `/wp-json/api/v1/groups/${id}/bulk-remove-users`,
            adminUsers: '/wp-json/api/v1/admin/users'
        };

        let state = {
            group: null,
            organizations: [],
            allGroups: [],
            members: [],
            filteredMembers: [],
            searchResults: []
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
            if (!GROUP_ID) {
                return;
            }

            try {
                await Promise.all([
                    loadGroup(),
                    loadOrganizations(),
                    loadAllGroups(),
                    loadMembers()
                ]);
            } catch (e) {
                console.error(e);
                showToast('Failed to load group data', 'error');
            }

            bindEvents();
        }

        async function loadGroup() {
            const res = await window.ApiClient.get(`${API.groups}/${GROUP_ID}`);
            state.group = res.data;
            fillGroupForm();
        }

        async function loadOrganizations() {
            try {
                const res = await window.ApiClient.get(API.organizations + '?show_inactive=1');
                state.organizations = res.data || [];
                fillOrganizationSelect();
            } catch (e) {
                console.error('Failed to load organizations', e);
            }
        }

        async function loadAllGroups() {
            try {
                const res = await window.ApiClient.get(API.groups + '?per_page=100');
                state.allGroups = res.data || [];
                fillParentGroupSelect();
            } catch (e) {
                console.error('Failed to load groups', e);
            }
        }

        async function loadMembers() {
            $('#members-loading').removeClass('hidden');
            $('#members-empty').addClass('hidden');
            $('#members-table-body').empty();

            try {
                const res = await window.ApiClient.get(API.groupMembers(GROUP_ID));
                state.members = res.data || [];
                state.filteredMembers = state.members;
                renderMembersTable();
            } catch (e) {
                console.error('Failed to load members', e);
                $('#members-loading').text('Error loading members');
            }
        }

        function fillGroupForm() {
            if (!state.group) return;
            $('#group-name').val(state.group.name || '');
            $('#group-type').val(state.group.type || 'general');
            $('#group-description').val(state.group.description || '');
            $('#group-active').prop('checked', !!state.group.is_active);

            if (state.group.organization_id) {
                $('#group-org-id').val(state.group.organization_id);
            }
            if (state.group.parent_id) {
                $('#group-parent-id').val(state.group.parent_id);
            }

            $('#group-page-title').text(`Group: ${state.group.name || 'Detail'}`);
        }

        function fillOrganizationSelect() {
            const $select = $('#group-org-id');
            state.organizations.forEach(org => {
                $select.append(
                    `<option value="${org.id}">${org.name}</option>`
                );
            });
        }

        function fillParentGroupSelect() {
            const $select = $('#group-parent-id');
            state.allGroups.forEach(g => {
                if (g.id === GROUP_ID) return;
                $select.append(
                    `<option value="${g.id}">${g.name} (${g.type})</option>`
                );
            });
        }

        function renderMembersTable() {
            const $tbody = $('#members-table-body');
            const $loading = $('#members-loading');
            const $empty = $('#members-empty');

            $loading.addClass('hidden');
            $tbody.empty();

            if (!state.filteredMembers.length) {
                $empty.removeClass('hidden');
                $('#btn-bulk-remove').addClass('hidden');
                return;
            }

            $empty.addClass('hidden');

            const rows = state.filteredMembers.map(member => {
                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username || 'Unknown';
                const email = member.email || '';
                const role = member.group_role || member.role || 'member'; // depends on how you expose it

                return `
                <tr>
                    <td class="text-center">
                        <input type="checkbox" class="member-checkbox form-check-input"
                               data-user-id="${member.id}">
                    </td>
                    <td>
                        <div class="font-medium">${fullName}</div>
                    </td>
                    <td>
                        <div class="text-slate-500 text-xs">${email}</div>
                    </td>
                    <td class="text-center">
                        <span class="px-2 py-1 text-xs font-medium rounded bg-slate-100">
                            ${role}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-outline-danger btn-xs btn-remove-member"
                                data-user-id="${member.id}">
                            Remove
                        </button>
                    </td>
                </tr>
            `;
            }).join('');

            $tbody.html(rows);
            $('#btn-bulk-remove').toggleClass('hidden', !state.filteredMembers.length);
        }

        async function saveGroup() {
            if (!state.group) return;

            const payload = {
                name: $('#group-name').val().trim(),
                type: $('#group-type').val(),
                description: $('#group-description').val().trim(),
                organization_id: $('#group-org-id').val() || null,
                parent_id: $('#group-parent-id').val() || null,
                is_active: $('#group-active').is(':checked') ? 1 : 0
            };

            if (!payload.name) {
                showToast('Group name is required', 'error');
                return;
            }

            try {
                await window.ApiClient.put(`${API.groups}/${GROUP_ID}`, payload);
                showToast('Group updated successfully', 'success');
                await loadGroup();
            } catch (e) {
                console.error(e);
                const msg = e.responseJSON?.message || 'Failed to update group';
                showToast(msg, 'error');
            }
        }

        // --- Members: Add/Remove ---

        function openAddMembersModal() {
            $('#user-search-input').val('');
            $('#user-search-results').empty();
            $('#user-search-empty').removeClass('hidden').text('Type to search for users...');
            getModal('#modal-members').show();
        }

        async function searchUsers(term) {
            console.log('searchUsers called with term:', term);

            if (!term || term.length < 2) {
                $('#user-search-results').empty();
                $('#user-search-empty').removeClass('hidden').text('Type at least 2 characters to search...');
                return;
            }

            $('#user-search-empty').addClass('hidden');
            $('#user-search-results').html(
                '<tr><td colspan="4" class="text-center text-slate-500 p-4">Searching...</td></tr>'
            );

            try {
                const url = `${API.adminUsers}?search=${encodeURIComponent(term)}&per_page=20`;
                console.log('Fetching:', url);
                const res = await window.ApiClient.get(url);
                console.log('Search response:', res);
                const users = res.data || [];
                state.searchResults = users;
                renderUserSearchResults();
            } catch (e) {
                console.error('Search error:', e);
                $('#user-search-results').html(
                    '<tr><td colspan="4" class="text-center text-danger p-4">Error searching users</td></tr>'
                );
            }
        }

        function renderUserSearchResults() {
            const $tbody = $('#user-search-results');

            if (!state.searchResults.length) {
                $tbody.html(
                    '<tr><td colspan="4" class="text-center text-slate-500 p-4">No users found</td></tr>'
                );
                return;
            }

            const rows = state.searchResults.map(user => {
                const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Unknown';
                const email = user.email || '';
                const type = user.type || 'staff';

                return `
                <tr>
                    <td class="text-center">
                        <input type="checkbox" class="search-user-checkbox form-check-input"
                               data-user-id="${user.id}">
                    </td>
                    <td>${fullName}</td>
                    <td>${email}</td>
                    <td>${type}</td>
                </tr>
            `;
            }).join('');

            $tbody.html(rows);
        }

        async function addSelectedUsers() {
            const selected = [];
            $('.search-user-checkbox:checked').each(function() {
                selected.push(parseInt($(this).data('user-id'), 10));
            });

            if (!selected.length) {
                showToast('Select at least one user to add', 'error');
                return;
            }

            const role = $('#new-member-role').val() || 'member';

            try {
                await window.ApiClient.post(API.bulkAdd(GROUP_ID), {
                    user_ids: selected,
                    role
                });
                showToast('Members added successfully', 'success');
                getModal('#modal-members').hide();
                await loadMembers();
            } catch (e) {
                console.error(e);
                const msg = e.responseJSON?.message || 'Failed to add members';
                showToast(msg, 'error');
            }
        }

        async function removeSingleMember(userId) {
            if (!confirm('Remove this member from the group?')) return;

            try {
                await window.ApiClient.post(API.bulkRemove(GROUP_ID), {
                    user_ids: [userId]
                });
                showToast('Member removed', 'success');
                await loadMembers();
            } catch (e) {
                console.error(e);
                showToast('Failed to remove member', 'error');
            }
        }

        async function bulkRemoveSelected() {
            const selected = [];
            $('.member-checkbox:checked').each(function() {
                selected.push(parseInt($(this).data('user-id'), 10));
            });

            if (!selected.length) {
                showToast('No members selected', 'error');
                return;
            }

            if (!confirm('Remove selected members from this group?')) return;

            try {
                await window.ApiClient.post(API.bulkRemove(GROUP_ID), {
                    user_ids: selected
                });
                showToast('Members removed', 'success');
                await loadMembers();
            } catch (e) {
                console.error(e);
                showToast('Failed to remove members', 'error');
            }
        }

        function filterMembers(term) {
            term = (term || '').toLowerCase();
            if (!term) {
                state.filteredMembers = state.members;
            } else {
                state.filteredMembers = state.members.filter(m => {
                    const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username || '';
                    const email = m.email || '';
                    return fullName.toLowerCase().includes(term) || email.toLowerCase().includes(term);
                });
            }
            renderMembersTable();
        }

        function debounce(fn, wait) {
            let t;
            return function() {
                const args = arguments;
                clearTimeout(t);
                t = setTimeout(() => fn.apply(null, args), wait);
            };
        }

        function bindEvents() {
            $('#btn-save-group').on('click', saveGroup);
            $('#btn-add-member').on('click', openAddMembersModal);
            $('#btn-add-selected-users').on('click', addSelectedUsers);
            $('#btn-bulk-remove').on('click', bulkRemoveSelected);

            console.log('Binding keyup event to #user-search-input');
            $('#user-search-input').on('keyup', debounce(function() {
                const term = $('#user-search-input').val();
                console.log('Keyup detected, term:', term);
                searchUsers(term);
            }, 400));

            $('#member-filter').on('keyup', debounce(function() {
                filterMembers($(this).val());
            }, 300));

            $('#select-all-members').on('change', function() {
                const checked = $(this).is(':checked');
                $('.member-checkbox').prop('checked', checked);
            });

            $('#select-all-search-results').on('change', function() {
                const checked = $(this).is(':checked');
                $('.search-user-checkbox').prop('checked', checked);
            });

            $(document).on('click', '.btn-remove-member', function() {
                const userId = $(this).data('user-id');
                removeSingleMember(userId);
            });

            $(document).on('change', '.member-checkbox', function() {
                const anyChecked = $('.member-checkbox:checked').length > 0;
                $('#btn-bulk-remove').toggleClass('hidden', !anyChecked);
            });
        }

        $(init);

    })(jQuery);
</script>

<?php get_footer(); ?>