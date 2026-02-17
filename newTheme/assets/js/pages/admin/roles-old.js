(function (window, $) {
    'use strict';

    if (!$ || !window.ApiClient) {
        console.error('Required dependencies for admin roles page are missing.');
        return;
    }

    const ENDPOINTS = {
        roles: '/wp-json/api/v1/admin/rbac/roles',
        permissions: '/wp-json/api/v1/admin/rbac/permissions',
        rolePermissions: function (id) {
            return '/wp-json/api/v1/admin/rbac/roles/' + id + '/permissions';
        },
        deleteRole: function (id) {
            return '/wp-json/api/v1/admin/rbac/roles/' + id;
        },
        assignPermission: function (id) {
            return '/wp-json/api/v1/admin/rbac/roles/' + id + '/permissions';
        },
        removePermission: function (id, permissionId) {
            return '/wp-json/api/v1/admin/rbac/roles/' + id + '/permissions/' + permissionId;
        }
    };

    const state = {
        rawRoles: [],
        roles: [],
        permissions: [],
        rolePermissions: {},
        filters: {
            search: '',
            hierarchy: '',
            status: ''
        },
        pagination: {
            page: 1,
            perPage: 10
        },
        meta: {
            total: 0,
            totalPages: 1
        },
        selection: new Set(),
        isLoading: false
    };

    const $tableBody = $('#roles-data-table [data-table-body]');
    const $pagination = $('#roles-pagination');
    const $paginationInfo = $('#roles-pagination-info');
    const $emptyState = $('#roles-empty-state');

    const $metrics = {
        total: $('#total-roles [data-metrics-value]'),
        active: $('#active-roles [data-metrics-value]'),
        avgPermissions: $('#avg-permissions [data-metrics-value]'),
        unassigned: $('#unassigned-roles [data-metrics-value]')
    };

    const $filterBar = $('#roles-filter-bar');
    const $searchInput = $filterBar.find('[data-filter-search]');
    const $hierarchyFilter = $filterBar.find('[data-filter-hierarchy]');
    const $statusFilter = $filterBar.find('[data-filter-status]');

    const $actionToolbar = $('#roles-action-toolbar');
    const $bulkArchive = $('#bulk-archive');
    const $bulkDuplicate = $('#bulk-duplicate');
    const $bulkPermissions = $('#bulk-permissions');

    const $matrixContainer = $('#permission-matrix-table');
    const $matrixEmpty = $matrixContainer.find('[data-matrix-empty]');
    const $hierarchyContainer = $('#role-hierarchy-visual');
    const $hierarchyEmpty = $hierarchyContainer.find('[data-hierarchy-empty]');

    const templates = {
        row: document.getElementById('role-row-template'),
        matrix: document.getElementById('permission-matrix-template'),
        hierarchyNode: document.getElementById('hierarchy-node-template')
    };

    function debounce(fn, delay) {
        let timer;
        return function () {
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(null, args);
            }, delay);
        };
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        if (isLoading) {
            const skeleton = $('#roles-data-table').find('[data-skeleton-row]').prop('outerHTML') || '';
            $tableBody.html(skeleton.repeat(5));
            $emptyState.addClass('hidden');
        }
    }

    function fetchAll() {
        setLoading(true);
        fetchRoles()
            .then(fetchPermissions)
            .then(function () {
                updateMetrics();
                renderPermissionMatrix();
                renderHierarchy();
            })
            .catch(handleError)
            .finally(function () {
                state.isLoading = false;
            });
    }

    function fetchRoles() {
        return window.ApiClient.get(ENDPOINTS.roles).then(function (response) {
            // API returns {success: true, data: {data: [roles]}}
            const rolesData = response.data?.data || response.data || [];
            state.rawRoles = Array.isArray(rolesData) ? rolesData : [];
            applyFilters();
            return Promise.all(state.roles.map(function (role) {
                return fetchRolePermissions(role.id);
            }));
        });
    }

    function fetchPermissions() {
        return window.ApiClient.get(ENDPOINTS.permissions).then(function (response) {
            // API returns {success: true, data: {data: [permissions]}}
            const permissionsData = response.data?.data || response.data || [];
            state.permissions = Array.isArray(permissionsData) ? permissionsData : [];
        });
    }

    function fetchRolePermissions(roleId) {
        if (!roleId || state.rolePermissions[roleId]) {
            return Promise.resolve(state.rolePermissions[roleId] || []);
        }

        return window.ApiClient.get(ENDPOINTS.rolePermissions(roleId)).then(function (response) {
            console.log('Role permissions response for', roleId, ':', response);
            const permissions = Array.isArray(response.data) ? response.data : (response.data ? Object.values(response.data) : response) || [];
            state.rolePermissions[roleId] = permissions;
            return permissions;
        }).catch(function () {
            state.rolePermissions[roleId] = [];
            return [];
        });
    }

    function applyFilters() {
        const searchTerm = state.filters.search.toLowerCase();
        const hierarchy = state.filters.hierarchy;
        const status = state.filters.status;

        const filtered = state.rawRoles.filter(function (role) {
            let matchesSearch = true;
            if (searchTerm) {
                matchesSearch = (role.name || '').toLowerCase().includes(searchTerm) || (role.description || '').toLowerCase().includes(searchTerm);
            }

            let matchesHierarchy = true;
            if (hierarchy) {
                const level = (role.hierarchy_level || role.level || '').toString().toLowerCase();
                matchesHierarchy = level.includes(hierarchy.replace('-tier', ''));
            }

            let matchesStatus = true;
            if (status) {
                const roleStatus = (role.status || 'active').toLowerCase();
                matchesStatus = roleStatus === status;
            }

            return matchesSearch && matchesHierarchy && matchesStatus;
        });

        state.meta.total = filtered.length;
        state.meta.totalPages = Math.max(1, Math.ceil(filtered.length / state.pagination.perPage));

        const start = (state.pagination.page - 1) * state.pagination.perPage;
        const end = start + state.pagination.perPage;
        state.roles = filtered.slice(start, end);

        renderTable();
        renderPagination();
        updateToolbar();
        updateEmptyState();
    }

    function renderTable() {
        if (!state.roles.length) {
            $tableBody.empty();
            return;
        }

        const rows = state.roles.map(renderRow);
        $tableBody.html(rows.join(''));
        refreshIcons();
    }

    function renderRow(role) {
        if (!templates.row) {
            return '';
        }

        const clone = templates.row.content.cloneNode(true);
        const $row = $(clone).find('[data-role-row]');

        $row.attr('data-role-id', role.id);
        $row.find('[data-role-select]').data('role-id', role.id).prop('checked', state.selection.has(role.id));
        $row.find('[data-role-name]').text(role.name || '—');
        $row.find('[data-role-description]').text(role.description || __('No description provided'));
        $row.find('[data-role-user-count]').text((role.user_count || 0).toLocaleString());
        $row.find('[data-role-permission-count]').text((role.permission_count || (state.rolePermissions[role.id] || []).length).toLocaleString());

        const hierarchy = role.hierarchy_label || role.hierarchy_level || role.level || '—';
        $row.find('[data-role-hierarchy]').text(hierarchy);

        $row.find('[data-role-view]').data('role-id', role.id);
        $row.find('[data-role-archive]').data('role-id', role.id);

        return $('<div>').append($row).html();
    }

    function renderPagination() {
        if (state.meta.totalPages <= 1) {
            $pagination.html('');
            $paginationInfo.text(state.meta.total ? __('Showing all roles') : '');
            return;
        }

        const currentPage = state.pagination.page;
        const totalPages = state.meta.totalPages;

        const buttons = [];
        buttons.push(paginationButton('&laquo;', 1, currentPage === 1));
        buttons.push(paginationButton('&lsaquo;', Math.max(1, currentPage - 1), currentPage === 1));

        const windowSize = 2;
        let start = Math.max(1, currentPage - windowSize);
        let end = Math.min(totalPages, currentPage + windowSize);
        if (currentPage <= windowSize) {
            end = Math.min(totalPages, 1 + windowSize * 2);
        }
        if (currentPage + windowSize >= totalPages) {
            start = Math.max(1, totalPages - windowSize * 2);
        }

        for (let page = start; page <= end; page++) {
            buttons.push(paginationButton(page, page, false, page === currentPage));
        }

        buttons.push(paginationButton('&rsaquo;', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
        buttons.push(paginationButton('&raquo;', totalPages, currentPage === totalPages));

        $pagination.html(buttons.join(''));

        const startIdx = (currentPage - 1) * state.pagination.perPage + 1;
        const endIdx = Math.min(state.meta.total, currentPage * state.pagination.perPage);
        $paginationInfo.text(__('Showing') + ' ' + startIdx + ' - ' + endIdx + ' ' + __('of') + ' ' + state.meta.total + ' ' + __('roles'));
    }

    function paginationButton(label, page, disabled, isCurrent) {
        const classes = ['btn', 'btn-outline-secondary', 'w-9', 'h-9'];
        if (isCurrent) {
            classes.push('btn-primary');
        }
        if (disabled) {
            classes.push('disabled');
        }
        return '<button type="button" class="' + classes.join(' ') + '" data-page="' + page + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';
    }

    function updateEmptyState() {
        if (!state.roles.length && !state.isLoading) {
            $emptyState.removeClass('hidden');
        } else {
            $emptyState.addClass('hidden');
        }
    }

    function updateToolbar() {
        const hasSelection = state.selection.size > 0;
        $bulkArchive.prop('disabled', !hasSelection);
        $bulkDuplicate.prop('disabled', !hasSelection);
        $bulkPermissions.prop('disabled', !hasSelection);
    }

    function updateMetrics() {
        const totalRoles = state.rawRoles.length;
        const activeRoles = state.rawRoles.filter(function (role) {
            return (role.status || 'active').toLowerCase() === 'active';
        }).length;
        const unassignedRoles = state.rawRoles.filter(function (role) {
            return (role.user_count || 0) === 0;
        }).length;

        let totalPermissions = 0;
        let permissionCounts = 0;
        state.rawRoles.forEach(function (role) {
            const count = role.permission_count || (state.rolePermissions[role.id] || []).length;
            totalPermissions += count;
            if (count > 0) {
                permissionCounts += 1;
            }
        });
        const average = permissionCounts ? (totalPermissions / permissionCounts) : 0;

        setMetric($metrics.total, totalRoles);
        setMetric($metrics.active, activeRoles);
        setMetric($metrics.unassigned, unassignedRoles);
        setMetric($metrics.avgPermissions, average.toFixed(1));
    }

    function setMetric($el, value) {
        if (!$el.length) {
            return;
        }
        if (value === null || value === undefined || value === '') {
            $el.html('<span class="inline-flex h-6 w-16 rounded bg-slate-200 animate-pulse"></span>');
        } else {
            $el.text(value);
        }
    }

    function renderPermissionMatrix() {
        const roles = state.rawRoles;
        if (!roles.length || !state.permissions.length || !templates.matrix) {
            $matrixContainer.find('table').remove();
            $matrixEmpty.removeClass('hidden');
            return;
        }

        const clone = templates.matrix.content.cloneNode(true);
        const $matrix = $(clone);
        const $headerRow = $matrix.find('[data-matrix-header]');
        const $body = $matrix.find('[data-matrix-body]');

        $headerRow.append('<th class="whitespace-nowrap text-left px-3 py-2">' + __('Permission') + '</th>');
        roles.forEach(function (role) {
            $headerRow.append('<th class="whitespace-nowrap text-center px-3 py-2">' + escapeHtml(role.name || '—') + '</th>');
        });

        state.permissions.forEach(function (permission) {
            const row = $('<tr class="odd:bg-slate-50">');
            row.append('<td class="px-3 py-2 text-sm font-medium">' + escapeHtml(permission.name || permission.slug || '—') + '</td>');

            roles.forEach(function (role) {
                const rolePerms = state.rolePermissions[role.id] || [];
                const hasPermission = rolePerms.some(function (item) {
                    return item.id === permission.id || item.name === permission.name || item.slug === permission.slug;
                });
                const icon = hasPermission ? '<i data-lucide="check" class="w-4 h-4 text-success"></i>' : '<i data-lucide="minus" class="w-4 h-4 text-slate-400"></i>';
                row.append('<td class="px-3 py-2 text-center">' + icon + '</td>');
            });

            $body.append(row);
        });

        $matrixContainer.find('table').remove();
        $matrixContainer.append($matrix);
        $matrixEmpty.addClass('hidden');
        refreshIcons();
    }

    function renderHierarchy() {
        if (!templates.hierarchyNode || !state.rawRoles.length) {
            $hierarchyContainer.find('[data-hierarchy-node]').remove();
            $hierarchyEmpty.removeClass('hidden');
            return;
        }

        const tree = buildHierarchyTree();
        if (!tree.length) {
            $hierarchyContainer.find('[data-hierarchy-node]').remove();
            $hierarchyEmpty.removeClass('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        tree.forEach(function (node) {
            fragment.appendChild(renderHierarchyNode(node));
        });

        $hierarchyContainer.empty().append(fragment);
        $hierarchyEmpty.addClass('hidden');
    }

    function buildHierarchyTree() {
        const nodes = {};
        const roots = [];

        state.rawRoles.forEach(function (role) {
            const node = {
                id: role.id,
                label: role.name || '—',
                children: [],
                parentId: role.parent_id || role.parent || null
            };
            nodes[role.id] = node;
        });

        Object.values(nodes).forEach(function (node) {
            if (node.parentId && nodes[node.parentId]) {
                nodes[node.parentId].children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    function renderHierarchyNode(node) {
        const clone = templates.hierarchyNode.content.cloneNode(true);
        const $node = $(clone).find('[data-hierarchy-node]');
        $node.find('[data-node-label]').text(node.label);

        const $children = $node.find('[data-node-children]');
        if (node.children && node.children.length) {
            node.children.forEach(function (child) {
                $children.append(renderHierarchyNode(child));
            });
        } else {
            $children.remove();
        }

        return $node.get(0);
    }

    function escapeHtml(value) {
        return $('<div>').text(value || '').html();
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function __(text) {
        return window.wp && window.wp.i18n ? window.wp.i18n.__(text, 'stanforte') : text;
    }

    function handleError(error) {
        console.error(error);
        if (window.showNotification && window.showNotification.error) {
            const message = (error && error.responseJSON && error.responseJSON.message) || __('An unexpected error occurred');
            window.showNotification.error(message);
        }
    }

    function handleSearchInput() {
        state.filters.search = $searchInput.val().trim();
        state.pagination.page = 1;
        applyFilters();
    }

    function handleFilterChange() {
        state.filters.hierarchy = $hierarchyFilter.val();
        state.filters.status = $statusFilter.val();
        state.pagination.page = 1;
        applyFilters();
    }

    function handlePaginationClick(event) {
        const page = Number($(event.currentTarget).data('page'));
        if (!Number.isNaN(page) && page !== state.pagination.page) {
            state.pagination.page = page;
            applyFilters();
        }
    }

    function handleSelectionChange(event) {
        const $checkbox = $(event.currentTarget);
        const roleId = $checkbox.data('role-id');
        if (!roleId) {
            return;
        }
        if ($checkbox.is(':checked')) {
            state.selection.add(roleId);
        } else {
            state.selection.delete(roleId);
        }
        updateToolbar();
    }

    function handleSelectAll(event) {
        const checked = $(event.currentTarget).is(':checked');
        state.selection.clear();
        $tableBody.find('[data-role-select]').prop('checked', checked);
        if (checked) {
            state.roles.forEach(function (role) {
                state.selection.add(role.id);
            });
        }
        updateToolbar();
    }

    function handleViewRole(event) {
        const roleId = $(event.currentTarget).data('role-id');
        const role = state.rawRoles.find(function (item) {
            return item.id === roleId;
        });
        if (!role) {
            return;
        }

        fetchRolePermissions(role.id).then(function () {
            populateRoleDetailModal(role);
        });
    }

    function populateRoleDetailModal(role) {
        const $content = $('#role-detail-content');
        if (!$content.length) {
            return;
        }

        const permissions = state.rolePermissions[role.id] || [];
        const rows = [
            detailRow(__('Role Name'), role.name),
            detailRow(__('Description'), role.description || __('No description provided')),
            detailRow(__('Status'), (role.status || 'Active')),
            detailRow(__('Assigned Users'), (role.user_count || 0).toLocaleString()),
            detailRow(__('Permissions'), permissions.length ? permissions.map(function (item) { return item.name || item.slug || item.id; }).join(', ') : __('No permissions assigned'))
        ];

        $content.html(rows.join(''));
    }

    function detailRow(label, value) {
        return '<div><div class="text-xs text-slate-500">' + escapeHtml(label) + '</div><div class="text-sm mt-1">' + escapeHtml(value || '—') + '</div></div>';
    }

    function handleArchiveRole(event) {
        const roleId = $(event.currentTarget).data('role-id');
        if (!roleId) {
            return;
        }

        window.ApiClient.delete(ENDPOINTS.deleteRole(roleId)).then(function () {
            if (window.showNotification && window.showNotification.success) {
                window.showNotification.success(__('Role archived successfully'));
            }
            fetchAll();
        }).catch(handleError);
    }

    function handleBulkAction(action) {
        if (!state.selection.size) {
            return;
        }

        if (action === 'archive') {
            const promises = Array.from(state.selection).map(function (roleId) {
                return window.ApiClient.delete(ENDPOINTS.deleteRole(roleId));
            });

            Promise.all(promises).then(function () {
                if (window.showNotification && window.showNotification.success) {
                    window.showNotification.success(__('Selected roles archived successfully'));
                }
                state.selection.clear();
                fetchAll();
            }).catch(handleError);
        } else if (action === 'duplicate') {
            if (window.showNotification && window.showNotification.info) {
                window.showNotification.info(__('Role duplication is not yet available.'));
            }
        } else if (action === 'sync-permissions') {
            $('#role-bulk-modal').attr('data-action', 'sync-permissions');
            $('#role-bulk-summary').html('<p>' + state.selection.size + ' ' + __('roles selected for permission synchronization.') + '</p>');
        }
    }

    function handleBulkConfirm() {
        const $modal = $('#role-bulk-modal');
        const action = $modal.attr('data-action');
        if (action === 'sync-permissions') {
            if (window.showNotification && window.showNotification.success) {
                window.showNotification.success(__('Permissions synchronized for selected roles. (Simulated)'));
            }
            $modal.removeAttr('data-action');
        }
    }

    function bindEvents() {
        $searchInput.on('input', debounce(handleSearchInput, 300));
        $hierarchyFilter.on('change', handleFilterChange);
        $statusFilter.on('change', handleFilterChange);

        $pagination.on('click', 'button[data-page]', handlePaginationClick);

        $tableBody.on('change', '[data-role-select]', handleSelectionChange);
        $actionToolbar.on('change', '[data-bulk-toggle]', handleSelectAll);

        $tableBody.on('click', '[data-role-view]', handleViewRole);
        $tableBody.on('click', '[data-role-archive]', handleArchiveRole);

        $('#add-role-btn, #empty-create-role').on('click', function () {
            $('#role-wizard-modal').attr('data-stage', 'details');
            $('#role-wizard-content').html('<p class="text-slate-500">' + __('Role wizard UI coming soon.') + '</p>');
        });

        $('#refresh-role-matrix').on('click', function () {
            renderPermissionMatrix();
        });

        $('#export-permission-matrix').on('click', function () {
            if (window.showNotification && window.showNotification.info) {
                window.showNotification.info(__('Export functionality coming soon.'));
            }
        });

        $('#toggle-matrix-view').on('click', function () {
            $matrixContainer.toggleClass('hidden');
        });

        $('#expand-hierarchy').on('click', function () {
            $hierarchyContainer.toggleClass('hidden');
        });

        $bulkArchive.on('click', function () {
            handleBulkAction('archive');
        });
        $bulkDuplicate.on('click', function () {
            handleBulkAction('duplicate');
        });
        $bulkPermissions.on('click', function () {
            handleBulkAction('sync-permissions');
        });

        $('#role-bulk-confirm').on('click', handleBulkConfirm);
    }

    $(document).ready(function () {
        bindEvents();
        fetchAll();
    });

})(window, window.jQuery);
