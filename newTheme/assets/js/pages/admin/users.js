(function($) {
    'use strict';

    if (!$ || !window.ApiClient) {
        console.error('Required dependencies missing');
        return;
    }

    const API = {
        users: '/wp-json/api/v1/admin/users',
        roles: '/wp-json/api/v1/admin/rbac/roles',
        updateUser: (id) => `/wp-json/api/v1/admin/users/${id}`
    };

    let state = {
        users: [],
        roles: [],
        filters: {
            search: '',
            status: '',
            role: ''
        }
    };
    let currentUserId = null;

    const formatDateDisplay = (value) => (window.formatDateTime ? window.formatDateTime(value) : (function(val) {
        if (!val) {
            return '—';
        }
        const d = new Date(val);
        return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
    })(value));

    // Initialize
    $(document).ready(function() {
        loadData();
        bindEvents();
    });

    function bindEvents() {
        $('#user-search-input').on('input', window.debounce(filterChanged, 300));
        $('#user-filter-status').on('change', filterChanged);
        $('#user-filter-role').on('change', filterChanged);

        $('#users-table-body').on('click', '[data-action="view"]', viewUser);
        $('#users-table-body').on('click', '[data-action="edit"]', editUser);
        $('#users-table-body').on('click', '[data-action="deactivate"]', deactivateUser);

        // Add user modal triggers
        $('#add-user-btn').on('click', openCreateUserModal);
        $('#empty-add-user-btn').on('click', openCreateUserModal);
        $('#btn-save-user').on('click', saveUserFromModal);
    }

    async function loadData() {
        try {
            await Promise.all([
                loadUsers(),
                loadRoles()
            ]);
            updateStats();
        } catch (error) {
            console.error('Failed to load users page data:', error);
            if (window.showToast) window.showToast('Failed to load users', 'error');
        }
    }

    async function loadUsers() {
        const params = { page: 1, per_page: 50 };
        if (state.filters.search) params.search = state.filters.search;
        if (state.filters.status) params.status = state.filters.status;
        if (state.filters.role) params.role = state.filters.role;

        const res = await window.ApiClient.get(API.users, params);
        console.log('rawdata: ', res);
        state.users = Array.isArray(res.data) ? res.data : [];
        state.meta = res.meta || {};
        renderUsers();
        updateStats();
    }

    async function loadRoles() {
        try {
            const response = await window.ApiClient.get(API.roles);
            console.log(response);
            state.roles = response.data?.data || response.data || [];
            renderRoleFilter();
            renderCreateRoleSelect();
        } catch (e) {
            // Non-blocking
            state.roles = [];
        }
    }

    function renderRoleFilter() {
        const $role = $('#user-filter-role');
        if (!$role.length) return;
        const options = ['<option value="">All Roles</option>']
            .concat((state.roles || []).map(r => `<option value="${(r.slug || r.id || '').toString()}">${window.escapeHtml ? window.escapeHtml(r.name || r.slug || 'Role') : (r.name || r.slug || 'Role')}</option>`));
        $role.html(options.join(''));
    }

    function renderCreateRoleSelect() {
        const $role = $('#create-user-role');
        if (!$role.length) return;
        const options = ['<option value="">Select role</option>']
            .concat((state.roles || []).map(r => `<option value="${(r.slug || r.id || '').toString()}">${window.escapeHtml ? window.escapeHtml(r.name || r.slug || 'Role') : (r.name || r.slug || 'Role')}</option>`));
        $role.html(options.join(''));
    }

    function openCreateUserModal() {
        currentUserId = null; // Reset for create mode
        
        // Use global showModal with template
        window.showModal({
            title: 'Add User',
            body: window.UserTemplates['tpl-user-form'],
            footer: window.UserTemplates['tpl-user-footer'],
            size: 'modal-lg' // Add User form has grid columns so needs width
        });
        
        // Reset form
        $('#user-form')[0]?.reset();
        $('#create-password').prop('required', true);
        
        // Initialize/Populate
        renderCreateRoleSelect();
        
        // No need to manually show, showModal does it.
    }

    function editUser(e) {
        const id = $(e.currentTarget).data('id');
        const user = state.users.find(u => String(u.id) === String(id));
        if (!user) return;

        currentUserId = id;

        window.showModal({
            title: 'Edit User',
            body: window.UserTemplates['tpl-user-form'],
            footer: window.UserTemplates['tpl-user-footer'],
            size: 'modal-lg'
        });

        // Populate Form
        const $modal = $('#standard-modal');
        $modal.find('#create-username').val(user.username || '');
        $modal.find('#create-email').val(user.email || '');
        $modal.find('#create-first-name').val(user.first_name || '');
        $modal.find('#create-last-name').val(user.last_name || '');
        
        // Handle Role
        renderCreateRoleSelect();
        // Wait for select to populate then set value
        setTimeout(() => {
             // Assuming single role for now or primary role
             const roleId = user.roles && user.roles.length ? (user.roles[0].id || user.roles[0].slug || user.roles[0]) : '';
             $modal.find('#create-user-role').val(roleId);
        }, 0);

        // Password is optional for edit
        $modal.find('#create-password').prop('required', false).attr('placeholder', 'Leave blank to keep current password');
    }

    async function saveUserFromModal(e) {
        // Prevent multiple clicks if binding issues (though .off() or unique ID helps)
        e.preventDefault();
        
        const $btn = $('#btn-save-user');
        const originalHtml = $btn.html();
        
        // Important: search within the visible modal to be safe, or just by ID since ID is unique in DOM at a time
        const $modal = $('#standard-modal'); 
        
        try {
            const username = $modal.find('#create-username').val().trim();
            const email = $modal.find('#create-email').val().trim();
            const password = $modal.find('#create-password').val().trim();
            const first_name = $modal.find('#create-first-name').val().trim();
            const last_name = $modal.find('#create-last-name').val().trim();
            const role = $modal.find('#create-user-role').val().trim();

            // Validation
            if (!username || !email) {
                if (window.showToast) window.showToast('Username and Email are required', 'error');
                return;
            }
            // Password required only for create
            if (!currentUserId && !password) {
                 if (window.showToast) window.showToast('Password is required for new users', 'error');
                 return;
            }

            const payload = { username, email };
            if (password) payload.password = password;
            if (first_name) payload.first_name = first_name;
            if (last_name) payload.last_name = last_name;
            if (role) payload.role = role;

            $btn.prop('disabled', true).html('<i class="w-4 h-4 mr-2 animate-spin" data-lucide="loader"></i> Saving...');

            if (currentUserId) {
                // Update
                await window.ApiClient.put(API.updateUser(currentUserId), payload);
                if (window.showToast) window.showToast('User updated successfully', 'success');
            } else {
                // Create
                await window.ApiClient.post(API.users, payload);
                if (window.showToast) window.showToast('User created successfully', 'success');
            }

            window.hideModal(); // Use global helper

            await loadUsers();
            updateStats();
        } catch (err) {
            console.error('Failed to save user:', err);
            if (window.showToast) window.showToast('Failed to save user', 'error');
        } finally {
            $btn.prop('disabled', false).html(originalHtml);
            if (window.lucide) window.lucide.createIcons();
        }
    }

    function renderUsers() {
        console.log('users: ', state.users);
        
        const $tbody = $('#users-table-body');
        const $empty = $('#users-empty-state');

        if (!state.users.length) {
            $tbody.html('');
            $empty.removeClass('hidden');
            return;
        }
        $empty.addClass('hidden');

        const rows = state.users.map(user => `
            <tr>
                <td>
                    <div class="flex items-center">
                        <div class="w-10 h-10 image-fit zoom-in mr-4">
                            <img src="${window.escapeHtml(user.avatar || user.profile_photo_url || '/wp-content/uploads/2025/07/user.jpg')}" class="rounded-full" alt="Avatar">
                        </div>
                        <div>
                            <div class="font-medium">${window.escapeHtml(user.full_name || ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.username || '—')}</div>
                            <div class="text-slate-500 text-xs mt-1">${window.escapeHtml(user.email || '—')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="flex flex-wrap gap-2">
                        ${(user.roles || []).map(r => `<span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">${window.escapeHtml(r.display_name || r.name || r)}</span>`).join('') || '<span class="text-xs text-slate-500">—</span>'}
                    </div>
                </td>
                <td class="text-center">${renderStatus(user.status)}</td>
                <td class="text-center text-xs text-slate-500">${window.escapeHtml(formatDateDisplay(user.last_login_at || user.last_login || user.updated_at) || '—')}</td>
                <td class="table-report__action">
                    <div class="flex justify-center items-center gap-2">
                        <a href="javascript:;" class="flex items-center text-primary" data-action="view" data-id="${user.id}">
                            <i data-lucide="eye" class="w-4 h-4 mr-1"></i>
                        </a>
                        <a href="javascript:;" class="flex items-center text-info" data-action="edit" data-id="${user.id}">
                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i>
                        </a>
                        <a href="javascript:;" class="flex items-center text-danger" data-action="deactivate" data-id="${user.id}">
                            <i data-lucide="shield-off" class="w-4 h-4 mr-1"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `).join('');

        $tbody.html(rows);

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function updateStats() {
        const total = state.users.length;
        const active = state.users.filter(u => (u.status || '').toLowerCase() === 'active').length;
        const pending = state.users.filter(u => (u.status || '').toLowerCase() === 'pending').length;
        const inactive = total - active - pending;

        $('#stat-total-users').text(total);
        $('#stat-active-users').text(active);
        $('#stat-pending-users').text(pending);
        $('#stat-inactive-users').text(inactive);
    }

    function filterChanged() {
        state.filters.search = ($('#user-search-input').val() || '').trim();
        state.filters.status = $('#user-filter-status').val() || '';
        state.filters.role = $('#user-filter-role').val() || '';
        loadUsers().catch(err => {
            console.error(err);
            if (window.showToast) window.showToast('Failed to apply filters', 'error');
        });
    }

    function renderStatus(status) {
        const s = (status || 'unknown').toLowerCase();
        const cls = s === 'active' ? 'text-success' : s === 'pending' ? 'text-warning' : 'text-danger';
        const label = s === 'active' ? 'Active' : s === 'pending' ? 'Pending' : 'Inactive';
        return `<div class="flex items-center justify-center ${cls}"><i data-lucide="circle" class="w-3 h-3 mr-2"></i>${label}</div>`;
    }

    function viewUser(e) {
        const id = $(e.currentTarget).data('id');
        const user = state.users.find(u => String(u.id) === String(id));
        if (!user) return;

        const html = `
            <div class="space-y-4">
                <div>
                    <div class="text-xs text-slate-500 uppercase">Full Name</div>
                    <div class="font-medium mt-1">${window.escapeHtml(user.full_name || ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.username || '—')}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Email</div>
                    <div class="mt-1">${window.escapeHtml(user.email || '—')}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Role(s)</div>
                    <div class="mt-1 flex gap-1 flex-wrap">
                        ${(user.roles || []).map(r => `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 border border-slate-200">${window.escapeHtml(r.display_name || r.name || r)}</span>`).join('') || '<span class="text-slate-500 text-sm">No roles assigned</span>'}
                    </div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Status</div>
                    <div class="mt-1">${window.escapeHtml((user.status || 'Unknown'))}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Last Login</div>
                    <div class="mt-1">${window.escapeHtml(formatDateDisplay(user.last_login_at || user.last_login || user.updated_at) || '—')}</div>
                </div>
            </div>
        `;

        window.showModal({
            title: 'User Details',
            body: html,
            footer: '<button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary">Close</button>',
            size: 'modal-md'
        });
        
        if (window.lucide) window.lucide.createIcons();
    }

    async function deactivateUser(e) {
        const id = $(e.currentTarget).data('id');
        const user = state.users.find(u => String(u.id) === String(id));
        if (!user) return;

        const confirmed = window.showConfirmation
            ? await window.showConfirmation({
                title: 'Deactivate User',
                message: `Deactivate ${user.full_name || user.email || 'this user'}?`,
                confirmText: 'Deactivate',
                confirmType: 'danger'
            })
            : window.confirm('Deactivate this user?');

        if (!confirmed) return;

        try {
            await window.ApiClient.patch(API.updateUser(id), { status: 'inactive' });
            if (window.showToast) window.showToast('User deactivated', 'success');
            await loadUsers();
            updateStats();
        } catch (err) {
            console.error('Failed to deactivate user:', err);
            if (window.showToast) window.showToast('Failed to deactivate user', 'error');
        }
    }

})(window.jQuery);
