(function($) {
    'use strict';

    if (!$ || !window.ApiClient) {
        console.error('Required dependencies missing');
        return;
    }

    const API = {
        roles: '/wp-json/api/v1/admin/rbac/roles',
        permissions: '/wp-json/api/v1/admin/rbac/permissions',
        rolePermissions: (id) => `/wp-json/api/v1/admin/rbac/roles/${id}/permissions`,
        deleteRole: (id) => `/wp-json/api/v1/admin/rbac/roles/${id}`
    };

    let state = {
        roles: [],
        permissions: [],
        rolePermissions: {},
        currentRole: null
    };

    function safeEscapeHtml(text) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(text);
        }

        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function withDebounce(handler, wait) {
        if (typeof window.debounce === 'function') {
            return window.debounce(handler, wait);
        }

        return handler;
    }

    // Initialize
    $(document).ready(function() {
        loadData();
        bindEvents();
    });

    function bindEvents() {
        console.log('Binding events...'); // DEBUG
        $('#btn-create-role, #btn-create-first-role').on('click', openCreateModal);
        $('#btn-refresh-matrix').on('click', renderPermissionMatrix);
        $('#search-input').on('input', withDebounce(filterRoles, 300));
        $('#filter-status').on('change', filterRoles);
        
        // Permissions management
        $('#btn-manage-permissions').on('click', openPermissionsModal);
        
        // Use Event Delegation for dynamic modal buttons
        $(document).on('click', '#btn-save-role', saveRole);
        $(document).on('click', '#btn-create-permission', openCreatePermissionModal);
        $(document).on('click', '#btn-save-permission', savePermission);
        
        // Dynamic search in permissions modal
        $(document).on('input', '#search-permissions', withDebounce(filterPermissions, 300));

        // Debug logging for delegation
        console.log('Binding permission table events to #permissions-table-body', $('#permissions-table-body').length);
        $(document).on('click', '[data-action="edit-permission"]', (e) => {
            console.log('Edit permission clicked', e.currentTarget);
            editPermission(e);
        });
        $(document).on('click', '[data-action="delete-permission"]', (e) => {
             console.log('Delete permission clicked', e.currentTarget);
             deletePermission(e);
        });
        
        // Delegate events for dynamic content
        console.log('Binding roles table events to #roles-table-body', $('#roles-table-body').length);
        $('#roles-table-body').on('click', '[data-action="view"]', (e) => {
            console.log('View role clicked', $(e.currentTarget).data('id'));
            viewRole(e);
        });
        $('#roles-table-body').on('click', '[data-action="edit"]', (e) => {
            console.log('Edit role clicked', $(e.currentTarget).data('id'));
            editRole(e);
        });
        $('#roles-table-body').on('click', '[data-action="delete"]', (e) => {
            console.log('Delete role clicked', $(e.currentTarget).data('id'));
            deleteRole(e);
        });
    }

    async function loadData() {
        try {
            await Promise.all([
                loadRoles(),
                loadPermissions()
            ]);
            
            updateStats();
            renderPermissionMatrix();
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load data', 'error');
        }
    }

    async function loadRoles() {
        const response = await window.ApiClient.get(API.roles);
        state.roles = response.data?.data || [];
        renderRoles();
    }

    async function loadPermissions() {
        const response = await window.ApiClient.get(API.permissions);
        state.permissions = response.data?.data || [];
    }

    function renderRoles() {
        const $tbody = $('#roles-table-body');
        const $emptyState = $('#empty-state');
        
        if (!state.roles.length) {
            $tbody.html('');
            $emptyState.removeClass('hidden');
            return;
        }
        
        $emptyState.addClass('hidden');
        
        const html = state.roles.map(role => `
            <tr>
                <td>
                    <div class="font-medium capitalize">${safeEscapeHtml(role.name)}</div>
                </td>
                <td>
                    <div class="text-slate-500 text-sm">${safeEscapeHtml(role.description || 'No description')}</div>
                </td>
                <td class="text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100">
                        ${role.user_count || 0}
                    </span>
                </td>
                <td class="text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        ${role.permission_count || 0}
                    </span>
                </td>
                <td class="table-report__action">
                    <div class="flex justify-center items-center gap-2">
                        <a href="javascript:;" class="flex items-center text-primary" data-action="view" data-id="${role.id}">
                            <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                        </a>
                        <a href="javascript:;" class="flex items-center text-info" data-action="edit" data-id="${role.id}">
                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                        </a>
                        <a href="javascript:;" class="flex items-center text-danger" data-action="delete" data-id="${role.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                        </a>
                    </div>
                </td>
            </tr>
        `).join('');
        
        $tbody.html(html);
        
        // Re-initialize lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function updateStats() {
        const totalRoles = state.roles.length;
        const activeRoles = state.roles.filter(r => r.status !== 'inactive').length;
        const totalUsers = state.roles.reduce((sum, r) => sum + (parseInt(r.user_count) || 0), 0);
        const totalPermissions = state.permissions.length;
        
        $('#stat-total-roles').text(totalRoles);
        $('#stat-active-roles').text(activeRoles);
        $('#stat-assigned-users').text(totalUsers);
        $('#stat-total-permissions').text(totalPermissions);
    }

    async function renderPermissionMatrix() {
        const $matrix = $('#permission-matrix');
        
        if (!state.roles.length || !state.permissions.length) {
            $matrix.html('<p class="text-slate-500 text-center py-8">No data available</p>');
            return;
        }
        
        let html = '<table class="table table-sm"><thead><tr><th>Permission</th>';
        state.roles.forEach(role => {
            html += `<th class="text-center">${safeEscapeHtml(role.name)}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        state.permissions.forEach(permission => {
            html += `<tr><td class="font-medium"><code class="text-sm">${safeEscapeHtml(permission.name)}</code></td>`;
            state.roles.forEach(role => {
                const rolePerms = role.permissions || [];
                const hasPermission = rolePerms.some(p => p.id === permission.id);
                html += `<td class="text-center">
                    ${hasPermission 
                        ? '<i data-lucide="check" class="w-4 h-4 text-success mx-auto"></i>' 
                        : '<i data-lucide="minus" class="w-4 h-4 text-slate-300 mx-auto"></i>'}
                </td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        $matrix.html(html);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // --- Dynamic Content Helpers ---
    function getTemplateContent(templateId) {
        // Look for template in DOM (script type="text/html" or template tags)
        const template = document.getElementById(templateId);
        if (template) {
            return template.innerHTML;
        }
        
        console.error(`Template #${templateId} not found in DOM.`);
        return `<div class="p-4 text-danger">Template ${templateId} not found</div>`;
    }

    function openCreateModal() {
        state.currentRole = null;
        
        const footer = `
            <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary mr-2">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-save-role">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Role
            </button>
        `;

        window.showModal({
            title: 'Create Role',
            body: getTemplateContent('tpl-role-form'),
            footer: footer,
            size: 'modal-lg'
        });

        // Populate/Reset Form
        const $modal = $('[data-modal-body]');
        $modal.find('#role-id').val('');
        $modal.find('#role-name').val('');
        $modal.find('#role-description').val('');
        renderPermissionCheckboxes([]);
        
        if (window.lucide) window.lucide.createIcons();
    }

    async function editRole(e) {
        const roleId = $(e.currentTarget).data('id');
        const role = state.roles.find(r => r.id == roleId);
        
        if (!role) return;
        
        state.currentRole = role;

        const footer = `
            <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary mr-2">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-save-role">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Role
            </button>
        `;

        window.showModal({
            title: 'Edit Role',
            body: getTemplateContent('tpl-role-form'),
            footer: footer,
            size: 'modal-lg'
        });

        // Populate Data
        const $modal = $('[data-modal-body]');
        $modal.find('#role-id').val(role.id);
        $modal.find('#role-name').val(role.name);
        $modal.find('#role-description').val(role.description || '');
        
        const rolePerms = role.permissions || [];
        renderPermissionCheckboxes(rolePerms);

        if (window.lucide) window.lucide.createIcons();
    }

    function renderPermissionCheckboxes(selectedPermissions) {
        const selectedIds = selectedPermissions.map(p => p.id);
        
        const html = state.permissions.map(permission => `
            <div class="form-check">
                <input 
                    type="checkbox" 
                    class="form-check-input" 
                    id="perm-${permission.id}" 
                    value="${permission.id}"
                    ${selectedIds.includes(permission.id) ? 'checked' : ''}
                >
                <label class="form-check-label" for="perm-${permission.id}">
                    ${safeEscapeHtml(permission.name)}
                    ${permission.description ? `<span class="text-slate-500 text-xs ml-2">${safeEscapeHtml(permission.description)}</span>` : ''}
                </label>
            </div>
        `).join('');
        
        // Use proper selector context
        $('[data-modal-body]').find('#permissions-list').html(html || '<p class="text-slate-500 text-sm">No permissions available</p>');
    }

    async function saveRole() {
        console.log('Save role clicked/triggered');
        // Scope selectors to the modal body to be safe
        const $modal = $('[data-modal-body]');
        const roleId = $modal.find('#role-id').val();
        const name = $modal.find('#role-name').val().trim();
        const description = $modal.find('#role-description').val().trim();
        const permissions = [];
        
        $modal.find('#permissions-list input:checked').each(function() {
            permissions.push($(this).val());
        });
        
        console.log('Role Data:', { roleId, name, description, permissionsCount: permissions.length });

        if (!name) {
            if (window.showToast) window.showToast('Role name is required', 'error');
            return;
        }
        
        try {
            const data = { name, description, permissions };
            
            if (roleId) {
                await window.ApiClient.put(`${API.roles}/${roleId}`, data);
                if (window.showToast) window.showToast('Role updated successfully', 'success');
            } else {
                await window.ApiClient.post(API.roles, data);
                if (window.showToast) window.showToast('Role created successfully', 'success');
            }
            
            window.hideModal();
            await loadData();
            
        } catch (error) {
            console.error('Failed to save role:', error);
            if (window.showToast) window.showToast('Failed to save role', 'error');
        }
    }

    async function viewRole(e) {
        const roleId = $(e.currentTarget).data('id');
        const role = state.roles.find(r => r.id == roleId);
        
        if (!role) {
            console.error('Role not found in state:', roleId);
            return;
        }
        
        let rolePerms = role.permissions || [];
        
        const html = `
            <div class="space-y-4">
                <div>
                    <div class="text-xs text-slate-500 uppercase">Role Name</div>
                    <div class="font-medium mt-1">${safeEscapeHtml(role.name)}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Description</div>
                    <div class="mt-1">${safeEscapeHtml(role.description || 'No description')}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Assigned Users</div>
                    <div class="mt-1">${role.user_count || 0}</div>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase">Permissions (${rolePerms.length})</div>
                    <div class="mt-2 space-y-1">
                        ${rolePerms.length ? rolePerms.map(p => `
                            <div class="flex items-center">
                                <i data-lucide="check" class="w-3 h-3 text-success mr-2"></i>
                                <span class="text-sm">${safeEscapeHtml(p.name)}</span>
                            </div>
                        `).join('') : '<span class="text-slate-500 text-sm">No permissions assigned</span>'}
                    </div>
                </div>
            </div>
        `;
        
        window.showModal({
            title: 'Role Details',
            body: html,
            footer: '<button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary">Close</button>',
            size: 'modal-md'
        });
        
        if (window.lucide) window.lucide.createIcons();
    }

    async function deleteRole(e) {
        console.log('Delete role clicked');
        const roleId = $(e.currentTarget).data('id');
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        const confirmed = await window.showConfirmation({
            title: 'Delete Role',
            message: `Do you really want to delete the role "${safeEscapeHtml(role.name)}"?<br>This process cannot be undone.`,
            confirmText: 'Delete',
            confirmType: 'danger'
        });

        if (confirmed) {
            try {
                await window.ApiClient.delete(API.deleteRole(roleId));
                if (window.showToast) window.showToast('Role deleted successfully', 'success');
                await loadData();
            } catch (error) {
                console.error('Failed to delete role:', error);
                if (window.showToast) window.showToast('Failed to delete role', 'error');
            }
        }
    }

    function filterRoles() {
        const search = $('#search-input').val().toLowerCase();
        const status = $('#filter-status').val();
        
        let filtered = state.roles;
        
        if (search) {
            filtered = filtered.filter(role => 
                role.name.toLowerCase().includes(search) || 
                (role.description && role.description.toLowerCase().includes(search))
            );
        }
        
        if (status) {
            filtered = filtered.filter(role => 
                status === 'active' ? role.status !== 'inactive' : role.status === 'inactive'
            );
        }
        
        // Update display with filtered roles
        const originalRoles = state.roles;
        state.roles = filtered;
        renderRoles();
        state.roles = originalRoles;
    }

    // ==================== PERMISSIONS MANAGEMENT ====================
    
    function openPermissionsModal() {
        window.showModal({
            title: 'Manage Permissions',
            body: getTemplateContent('tpl-permissions-management'),
            size: 'modal-xl',
            footer: '' // No main footer action, logic is inside
        });

        renderPermissionsTable();
        if (window.lucide) window.lucide.createIcons();
    }

    function renderPermissionsTable() {
        // Scope to standard modal just in case
        const $tbody = $('[data-modal-body]').find('#permissions-table-body');
        
        if (!state.permissions.length) {
            $tbody.html('<tr><td colspan="5" class="text-center py-4 text-slate-500">No permissions found</td></tr>');
            return;
        }
        
        const html = state.permissions.map(permission => `
            <tr>
                <td>
                    <div class="font-medium">${safeEscapeHtml(permission.name)}</div>
                </td>
                <td>
                    <code class="text-sm">${safeEscapeHtml(permission.slug || permission.name)}</code>
                </td>
                <td>
                    <span class="badge badge-secondary">${safeEscapeHtml(permission.module || 'N/A')}</span>
                </td>
                <td>
                    <div class="text-slate-500 text-sm">${safeEscapeHtml(permission.description || 'No description')}</div>
                </td>
                <td class="table-report__action">
                    <div class="flex justify-center items-center gap-2">
                        <a href="javascript:;" class="flex items-center text-info" data-action="edit-permission" data-id="${permission.id}">
                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                        </a>
                        <a href="javascript:;" class="flex items-center text-danger" data-action="delete-permission" data-id="${permission.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                        </a>
                    </div>
                </td>
            </tr>
        `).join('');
        
        $tbody.html(html);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function openCreatePermissionModal() {
        const footer = `
            <button type="button" class="btn btn-outline-secondary mr-auto" id="btn-back-permissions">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back
            </button>
            <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary mr-2">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-save-permission">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Permission
            </button>
        `;

        window.showModal({
            title: 'Create Permission',
            body: getTemplateContent('tpl-permission-form'),
            footer: footer,
            size: 'modal-md'
        });

        // Handle Back Button
        setTimeout(() => {
             $('#btn-back-permissions').on('click', openPermissionsModal);
        }, 50);

        const $modal = $('[data-modal-body]');
        $modal.find('#permission-id').val('');
        $modal.find('#permission-name').val('');
        $modal.find('#permission-slug').val('');
        $modal.find('#permission-module').val('');
        $modal.find('#permission-description').val('');
        
        if (window.lucide) window.lucide.createIcons();
    }

    async function savePermission() {
        const $modal = $('[data-modal-body]');
        const permissionId = $modal.find('#permission-id').val();
        const name = $modal.find('#permission-name').val().trim();
        const slug = $modal.find('#permission-slug').val().trim();
        const module = $modal.find('#permission-module').val().trim();
        const description = $modal.find('#permission-description').val().trim();
        
        if (!name) {
            if (window.showToast) window.showToast('Permission name is required', 'error');
            return;
        }
        
        if (!slug) {
            if (window.showToast) window.showToast('Slug is required', 'error');
            return;
        }
        
        // Check slug uniqueness
        const existingPermission = state.permissions.find(p => 
            p.slug === slug && p.id != permissionId
        );
        if (existingPermission) {
            if (window.showToast) window.showToast('Slug must be unique. This slug is already in use.', 'error');
            return;
        }
        
        try {
            const data = { name, slug, description };
            if (module) {
                data.module = module;
            }
            
            if (permissionId) {
                await window.ApiClient.put(`${API.permissions}/${permissionId}`, data);
                if (window.showToast) window.showToast('Permission updated successfully', 'success');
            } else {
                await window.ApiClient.post(API.permissions, data);
                 if (window.showToast) window.showToast('Permission created successfully', 'success');
            }
            
            // Reload permissions globally
            await loadPermissions();
            
            // Return to Management View
            openPermissionsModal();
            
        } catch (error) {
            console.error('Failed to save permission:', error);
            // Check if error is due to duplicate slug from backend
            if (error.response?.data?.message?.includes('slug') || error.response?.data?.message?.includes('unique')) {
                if (window.showToast) window.showToast('Slug must be unique. This slug is already in use.', 'error');
            } else {
                if (window.showToast) window.showToast('Failed to save permission', 'error');
            }
        }
    }

    function editPermission(e) {
        const permissionId = $(e.currentTarget).data('id');
        const permission = state.permissions.find(p => p.id == permissionId);
        
        if (!permission) return;
        
        const footer = `
             <button type="button" class="btn btn-outline-secondary mr-auto" id="btn-back-permissions">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back
            </button>
            <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary mr-2">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-save-permission">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Permission
            </button>
        `;

        window.showModal({
            title: 'Edit Permission',
            body: getTemplateContent('tpl-permission-form'),
            footer: footer,
            size: 'modal-md'
        });

         // Handle Back Button
        setTimeout(() => {
             $('#btn-back-permissions').on('click', openPermissionsModal);
        }, 50);

        const $modal = $('[data-modal-body]');
        $modal.find('#permission-id').val(permission.id);
        $modal.find('#permission-name').val(permission.name);
        $modal.find('#permission-slug').val(permission.slug || permission.name);
        $modal.find('#permission-module').val(permission.module || '');
        $modal.find('#permission-description').val(permission.description || '');

        if (window.lucide) window.lucide.createIcons();
    }

    async function deletePermission(e) {
        const permissionId = $(e.currentTarget).data('id');
        const permission = state.permissions.find(p => p.id == permissionId);
        if (!permission) return;

        const confirmed = await window.showConfirmation({
            title: 'Delete Permission',
            message: `Do you really want to delete the permission "${escapeHtml(permission.name)}"?<br>This process cannot be undone.`,
            confirmText: 'Delete',
            confirmType: 'danger'
        });

        if (confirmed) {
            try {
                await window.ApiClient.delete(`${API.permissions}/${permissionId}`);
                showToast('Permission deleted successfully', 'success');
                
                await loadPermissions();
                // If we are still in the modal (unlikely due to how delete confirmation works, mostly fine), refresh table
                renderPermissionsTable();
                renderPermissionMatrix();
            } catch (error) {
                console.error('Failed to delete permission:', error);
                showToast('Failed to delete permission', 'error');
            }
        }
    }

    function filterPermissions() {
        const search = $('[data-modal-body]').find('#search-permissions').val().toLowerCase();
        
        if (!search) {
            renderPermissionsTable();
            return;
        }
        
        const filtered = state.permissions.filter(permission => 
            permission.name.toLowerCase().includes(search) ||
            (permission.description && permission.description.toLowerCase().includes(search))
        );
        
        const $tbody = $('[data-modal-body]').find('#permissions-table-body');
        
        if (!filtered.length) {
            $tbody.html('<tr><td colspan="3" class="text-center py-4 text-slate-500">No permissions found</td></tr>');
            return;
        }
        
        const html = filtered.map(permission => `
            <tr>
                <td>
                    <code class="text-sm font-medium">${safeEscapeHtml(permission.name)}</code>
                </td>
                <td>
                    <div class="text-slate-500 text-sm">${safeEscapeHtml(permission.description || 'No description')}</div>
                </td>
                <td class="table-report__action">
                    <div class="flex justify-center items-center gap-2">
                        <a href="javascript:;" class="flex items-center text-info" data-action="edit-permission" data-id="${permission.id}">
                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                        </a>
                        <a href="javascript:;" class="flex items-center text-danger" data-action="delete-permission" data-id="${permission.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                        </a>
                    </div>
                </td>
            </tr>
        `).join('');
        
        $tbody.html(html);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

})(jQuery);
