<?php

/**
 * Template Name: Finance: Settings - Requests
 * Description: Manage finance request types and schemas
 */

$pageTitle = 'Request Settings';
$breadcrumb = [
    ['name' => 'Settings', 'url' => home_url('/finance/settings')],
    ['name' => 'Request Settings']
];
$activeMenu = 'finance-settings-requests';

get_header();
?>

<div class="container mx-auto px-4 py-8">

    <!-- Page Header -->
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">Request Settings</h1>
            <p class="text-gray-500 mt-1">Configure request domains and custom forms</p>
        </div>
    </div>

    <!-- Tabs -->
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <ul class="nav nav-link-tabs" role="tablist">
            <li id="types-tab" class="nav-item flex-1 active" role="presentation">
                <button data-tw-toggle="pill" data-tw-target="#types-content" class="nav-link w-full py-2 active"
                    role="tab" aria-controls="types-content" aria-selected="true">
                    Request Types
                </button>
            </li>
            <li id="groups-tab" class="nav-item flex-1" role="presentation">
                <button data-tw-toggle="pill" data-tw-target="#groups-content" class="nav-link w-full py-2" role="tab"
                    aria-controls="groups-content" aria-selected="false">
                    Request Domains (Groups)
                </button>
            </li>
        </ul>
    </div>

    <div class="tab-content">
        <!-- Types Tab -->
        <div id="types-content" class="tab-pane active" role="tabpanel" aria-labelledby="types-tab">
            <div class="intro-y box p-5">
                <div class="flex items-center justify-between mb-4 pb-4 border-b">
                    <h3 class="text-lg font-medium">Request Types</h3>
                    <button id="btn-create-request-type" class="btn btn-primary">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> New Request Type
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="table table-report mt-2">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">NAME</th>
                                <th class="whitespace-nowrap">PREFIX</th>
                                <th class="whitespace-nowrap">STATUS</th>
                                <th class="whitespace-nowrap">LIMIT</th>
                                <th class="text-center whitespace-nowrap">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="types-table-body">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
                <div id="loading-state" class="p-8 text-center text-gray-500">
                    Loading request types...
                </div>
                <div id="empty-state" class="p-8 text-center text-gray-500 hidden">
                    No request types found. Create your first one!
                </div>
            </div>
        </div>

        <!-- Groups Tab -->
        <div id="groups-content" class="tab-pane" role="tabpanel" aria-labelledby="groups-tab">
            <div class="intro-y box p-5">
                <div class="flex items-center justify-between mb-4 pb-4 border-b">
                    <h3 class="text-lg font-medium">Request Domains (Groups)</h3>
                    <button id="btn-create-group" class="btn btn-primary">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> New Domain
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="table table-report mt-2">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">NAME</th>
                                <th class="whitespace-nowrap">CODE</th>
                                <th class="whitespace-nowrap">DESCRIPTION</th>
                                <th class="whitespace-nowrap">TYPES</th>
                                <th class="text-center whitespace-nowrap">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="groups-table-body">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
                <div id="groups-loading-state" class="p-8 text-center text-gray-500">
                    Loading groups...
                </div>
                <div id="groups-empty-state" class="p-8 text-center text-gray-500 hidden">
                    No request domains found.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- TEMPLATES (Inlined for reliability) -->
<!-- Request Type Form Template -->
<script type="text/html" id="tpl-request-type-form">
    <form id="request-type-modal-form" onsubmit="return false;">
        <input type="hidden" id="request-type-id">

        <div class="mb-4">
            <label class="form-label">Name *</label>
            <input type="text" class="form-control" id="request-type-name" placeholder="e.g., Travel Reimbursement" required>
        </div>

        <div class="mb-4">
            <label class="form-label">Domain (Group) *</label>
            <select class="form-control" id="request-type-group-id" required>
                <option value="">Select Domain...</option>
                <!-- Populated via JS -->
            </select>
        </div>

        <div class="mb-4">
            <label class="form-label">Code Prefix *</label>
            <input type="text" class="form-control" id="request-type-prefix" placeholder="e.g., TRV" required>
            <div class="text-xs text-slate-500 mt-1">Used for request numbering: TRV-2024-0001</div>
        </div>

        <div class="mb-4">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="request-type-description" rows="2" placeholder="Describe this request type..."></textarea>
        </div>

        <div class="mb-4">
            <label class="form-label">Storage Strategy</label>
            <select class="form-control" id="request-type-storage-type">
                <option value="form">Form-Driven (Default)</option>
                <option value="special">Specialized Service (L3)</option>
                <option value="bypass">Module Bypass (L4)</option>
            </select>
            <div class="text-xs text-slate-500 mt-1">
                How should data for this request be stored?
            </div>
        </div>

        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <label class="form-label">Form *</label>
                <button type="button" id="btn-quick-create-form" class="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                    <i data-lucide="plus-circle" class="w-4 h-4 mr-1"></i>
                    Create New Form
                </button>
            </div>
            <select class="form-control" id="request-type-form-id" required>
                <option value="">Select a form...</option>
                <!-- Populated via JS from sta_forms -->
            </select>
            <div class="text-xs text-slate-500 mt-1">
                Form defines what data to collect
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="mb-4">
                <label class="form-label">Approval Limit (₦)</label>
                <input type="number" class="form-control" id="request-type-approval-limit" placeholder="50000" step="0.01">
                <div class="text-xs text-slate-500 mt-1">Requests above this require approval</div>
            </div>

            <div class="mb-4 flex items-end">
                <label class="flex items-center">
                    <input type="checkbox" id="request-type-active" class="form-checkbox mr-2" checked>
                    <span class="text-sm font-medium text-gray-700">Active</span>
                </label>
            </div>
        </div>

        <div class="border-t border-slate-200 pt-4 mt-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-semibold">Approval Workflow</h3>
                <button type="button" id="btn-add-workflow-step" class="btn btn-sm btn-outline-primary">
                    <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Step
                </button>
            </div>
            <div id="workflow-steps-container" class="space-y-3">
                <!-- Populated via JS -->
            </div>
            <div id="workflow-empty-state" class="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300 text-slate-500 text-sm">
                No approval steps defined. Request will be auto-approved (if limit allows) or require basic manager approval.
            </div>
        </div>
    </form>
</script>

<!-- Request Group Form Template -->
<script type="text/html" id="tpl-group-form">
    <form id="group-modal-form" onsubmit="return false;">
        <input type="hidden" id="group-id">
        <div class="mb-4">
            <label class="form-label">Name *</label>
            <input type="text" class="form-control" id="group-name" placeholder="e.g., Financial" required>
        </div>
        <div class="mb-4">
            <label class="form-label">Code *</label>
            <input type="text" class="form-control" id="group-code" placeholder="e.g., finance" required>
            <div class="text-xs text-slate-500 mt-1">Unique identifier (lowercase, no spaces)</div>
        </div>
        <div class="mb-4">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="group-description" rows="3" placeholder="Describe this request domain..."></textarea>
        </div>
        <div class="mb-4">
            <label class="flex items-center">
                <input type="checkbox" id="group-active" class="form-checkbox mr-2" checked>
                <span class="text-sm font-medium text-gray-700">Active</span>
            </label>
        </div>
    </form>
</script>

<!-- Group Footer Template -->
<script type="text/html" id="tpl-group-footer">
    <button type="button" class="btn btn-outline-secondary mr-2" data-tw-dismiss="modal">Cancel</button>
    <button type="button" class="btn btn-primary" id="btn-save-group">
        <i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Domain
    </button>
</script>

<script type="text/html" id="tpl-workflow-step">
    <div class="workflow-step-row flex items-start gap-3 bg-slate-50 p-3 rounded border border-slate-200 relative group">
        <div class="flex-1 grid grid-cols-12 gap-3">
            <div class="col-span-5">
                <label class="block text-xs font-medium text-slate-500 mb-1">Approver Role</label>
                <select class="form-control form-control-sm step-role" required>
                    <option value="">Select Role...</option>
                    <!-- Roles will be populated here -->
                </select>
            </div>
            <div class="col-span-4">
                <label class="block text-xs font-medium text-slate-500 mb-1">Action</label>
                <select class="form-control form-control-sm step-action">
                    <option value="approve">Approve</option>
                    <option value="review">Review</option>
                    <option value="clear">Clear (Finance)</option>
                </select>
            </div>
            <div class="col-span-3">
                <label class="block text-xs font-medium text-slate-500 mb-1">Min Amount</label>
                <input type="number" class="form-control form-control-sm step-min-amount" placeholder="0">
            </div>
        </div>
        <button type="button" class="btn-remove-step text-slate-400 hover:text-red-500 mt-6">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    </div>
</script>


<!-- Request Type Footer Template -->
<script type="text/html" id="tpl-request-type-footer">
    <button type="button" class="btn btn-outline-secondary mr-2" data-tw-dismiss="modal">Cancel</button>
    <button type="button" class="btn btn-primary" id="btn-save-request-type">
        <i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Request Type
    </button>
</script>

<script>
    (function ($) {
        'use strict';
        const API = {
            list: '/wp-json/api/v1/requests/types?include_inactive=true',
            create: '/wp-json/api/v1/requests/types',
            update: (id) => `/wp-json/api/v1/requests/types/${id}`,
            delete: (id) => `/wp-json/api/v1/requests/types/${id}`,
            groups: {
                list: '/wp-json/api/v1/requests/groups?include_inactive=true',
                create: '/wp-json/api/v1/requests/groups',
                update: (id) => `/wp-json/api/v1/requests/groups/${id}`,
                delete: (id) => `/wp-json/api/v1/requests/groups/${id}`
            },
            forms: '/wp-json/api/v1/forms',
            roles: '/wp-json/api/v1/admin/rbac/roles'
        };

        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';
        let state = {
            requestTypes: [],
            groups: [],
            roles: [],
            forms: []
        };

        function getTemplate(name) {
            const el = document.getElementById(name);
            return el ? el.innerHTML : `<div class="p-4 text-danger">Template ${name} not found</div>`;
        }

        // --- Core Data Loading ---

        async function loadAllData() {
            try {
                const [typesRes, groupsRes, rolesRes, formsRes] = await Promise.all([
                    window.ApiClient.get(API.list),
                    window.ApiClient.get(API.groups.list),
                    window.ApiClient.get(API.roles),
                    window.ApiClient.get(API.forms)
                ]);

                state.requestTypes = typesRes.data?.data || typesRes.data || [];
                state.groups = groupsRes.data?.data || groupsRes.data || [];
                state.roles = rolesRes.data?.data || rolesRes.data || [];
                state.forms = formsRes.data?.data || formsRes.data || [];

                renderTable();
                renderGroupsTable();
            } catch (err) {
                console.error('Failed to load settings data:', err);
                window.showToast('Failed to load settings data', 'error');
            }
        }

        // --- Request Types Logic ---

        function renderTable() {
            const $tbody = $('#types-table-body');
            const $empty = $('#empty-state');
            const $loading = $('#loading-state');

            if ($loading) $loading.addClass('hidden');

            if (!state.requestTypes.length) {
                $tbody.html('');
                if ($empty) $empty.removeClass('hidden');
                return;
            }
            if ($empty) $empty.addClass('hidden');

            const rows = state.requestTypes.map(rt => `
                <tr class="intro-x">
                    <td class="whitespace-nowrap font-medium">
                        ${rt.name}
                        <div class="text-slate-500 text-xs mt-0.5">${rt.group?.name || 'No Domain'}</div>
                    </td>
                    <td class="whitespace-nowrap">${rt.code_prefix}</td>
                    <td class="whitespace-nowrap">
                        <div class="flex items-center ${rt.is_active ? 'text-success' : 'text-danger'}">
                            <i data-lucide="${rt.is_active ? 'check-square' : 'x-square'}" class="w-4 h-4 mr-2"></i>
                            ${rt.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </td>
                    <td class="whitespace-nowrap">₦${parseFloat(rt.approval_limit || 0).toLocaleString()}</td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 text-primary cursor-pointer" href="javascript:;" data-action="edit-request-type" data-id="${rt.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer" href="javascript:;" data-action="delete-request-type" data-id="${rt.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `).join('');
            $tbody.html(rows);
            if (window.lucide) window.lucide.createIcons();
        }

        async function openCreateModal() {
            window.showModal({
                title: 'Create Request Type',
                body: getTemplate('tpl-request-type-form'),
                footer: getTemplate('tpl-request-type-footer'),
                size: 'modal-lg'
            });

            const $m = $('[data-modal-body]');
            populateGroupDropdown($m.find('#request-type-group-id'));
            populateFormDropdown($m.find('#request-type-form-id'));

            $m.find('#request-type-active').prop('checked', true);
        }

        async function openEditModal(e) {
            const id = $(e.currentTarget).data('id');
            const rt = state.requestTypes.find(r => r.id == id);
            if (!rt) return;

            window.showModal({
                title: 'Edit Request Type',
                body: getTemplate('tpl-request-type-form'),
                footer: getTemplate('tpl-request-type-footer'),
                size: 'modal-lg'
            });

            const $m = $('[data-modal-body]');
            populateGroupDropdown($m.find('#request-type-group-id'), rt.group_id);
            populateFormDropdown($m.find('#request-type-form-id'), rt.form_id);

            $m.find('#request-type-id').val(rt.id);
            $m.find('#request-type-name').val(rt.name);
            $m.find('#request-type-prefix').val(rt.code_prefix);
            $m.find('#request-type-description').val(rt.description || '');
            $m.find('#request-type-storage-type').val(rt.storage_type || 'form');
            $m.find('#request-type-active').prop('checked', rt.is_active);
            $m.find('#request-type-approval-limit').val(rt.approval_limit || '');

            if (rt.approval_flow_json) {
                const flow = typeof rt.approval_flow_json === 'string' ? JSON.parse(rt.approval_flow_json) : rt.approval_flow_json;
                if (flow && flow.steps) {
                    flow.steps.forEach(step => addWorkflowStep(step));
                }
            }
        }

        function populateGroupDropdown($select, selectedId = null) {
            $select.html('<option value="">Select Domain...</option>');
            state.groups.forEach(g => {
                const selected = g.id === selectedId ? 'selected' : '';
                $select.append(`<option value="${g.id}" ${selected}>${g.name}</option>`);
            });
        }

        function populateFormDropdown($select, selectedId = null) {
            $select.html('<option value="">Select a form...</option>');
            state.forms.forEach(f => {
                const selected = f.id === selectedId ? 'selected' : '';
                $select.append(`<option value="${f.id}" ${selected}>${f.name}</option>`);
            });
        }

        async function deleteRequestType(e) {
            const id = $(e.currentTarget).data('id');
            const confirmed = await window.showConfirmation({
                title: 'Delete Request Type',
                message: 'Are you sure you want to delete this request type?',
                confirmText: 'Delete',
                confirmType: 'danger'
            });
            if (!confirmed) return;

            try {
                await window.ApiClient.delete(API.delete(id));
                window.showToast('Request type deleted', 'success');
                await loadAllData();
            } catch (err) {
                window.showToast(err.responseJSON?.message || 'Delete failed', 'error');
            }
        }

        async function saveRequestType() {
            const $m = $('[data-modal-body]');
            const id = $m.find('#request-type-id').val();

            const data = {
                name: $m.find('#request-type-name').val().trim(),
                group_id: $m.find('#request-type-group-id').val(),
                code_prefix: $m.find('#request-type-prefix').val().trim(),
                description: $m.find('#request-type-description').val().trim(),
                storage_type: $m.find('#request-type-storage-type').val(),
                form_id: $m.find('#request-type-form-id').val(),
                is_active: $m.find('#request-type-active').is(':checked') ? 1 : 0,
                approval_limit: parseFloat($m.find('#request-type-approval-limit').val()) || 0,
                approval_flow_json: collectWorkflow()
            };

            if (!data.name || !data.code_prefix || !data.group_id) {
                window.showToast('Name, Domain and Prefix are required', 'error');
                return;
            }

            try {
                if (id) {
                    await window.ApiClient.post(API.update(id), data);
                    window.showToast('Request type updated', 'success');
                } else {
                    await window.ApiClient.post(API.create, data);
                    window.showToast('Request type created', 'success');
                }
                window.hideModal();
                await loadAllData();
            } catch (err) {
                console.error(err);
                window.showToast(err.responseJSON?.message || 'Failed to save request type', 'error');
            }
        }

        // --- Request Domains (Groups) Logic ---

        function renderGroupsTable() {
            const $tbody = $('#groups-table-body');
            const $empty = $('#groups-empty-state');
            const $loading = $('#groups-loading-state');

            if ($loading) $loading.addClass('hidden');

            if (!state.groups.length) {
                $tbody.html('');
                if ($empty) $empty.removeClass('hidden');
                return;
            }
            if ($empty) $empty.addClass('hidden');

            const rows = state.groups.map(g => `
                <tr class="intro-x">
                    <td class="whitespace-nowrap font-medium">${g.name}</td>
                    <td class="whitespace-nowrap">${g.code}</td>
                    <td class="text-slate-500">${g.description || '-'}</td>
                    <td class="whitespace-nowrap">${g.request_types_count || 0} types</td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 text-primary cursor-pointer" href="javascript:;" data-action="edit-group" data-id="${g.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer" href="javascript:;" data-action="delete-group" data-id="${g.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `).join('');
            $tbody.html(rows);
            if (window.lucide) window.lucide.createIcons();
        }

        function openCreateGroupModal() {
            window.showModal({
                title: 'Create Request Domain',
                body: getTemplate('tpl-group-form'),
                footer: getTemplate('tpl-group-footer'),
                size: 'modal-md'
            });
        }

        function openEditGroupModal(e) {
            const id = $(e.currentTarget).data('id');
            const g = state.groups.find(group => group.id == id);
            if (!g) return;

            window.showModal({
                title: 'Edit Request Domain',
                body: getTemplate('tpl-group-form'),
                footer: getTemplate('tpl-group-footer'),
                size: 'modal-md'
            });

            const $m = $('[data-modal-body]');
            $m.find('#group-id').val(g.id);
            $m.find('#group-name').val(g.name);
            $m.find('#group-code').val(g.code);
            $m.find('#group-description').val(g.description || '');
            $m.find('#group-active').prop('checked', g.is_active);
        }

        async function saveGroup() {
            const $m = $('[data-modal-body]');
            const id = $m.find('#group-id').val();

            const data = {
                name: $m.find('#group-name').val().trim(),
                code: $m.find('#group-code').val().trim(),
                description: $m.find('#group-description').val().trim(),
                is_active: $m.find('#group-active').is(':checked') ? 1 : 0
            };

            if (!data.name || !data.code) {
                window.showToast('Name and Code are required', 'error');
                return;
            }

            try {
                if (id) {
                    await window.ApiClient.post(API.groups.update(id), data);
                    window.showToast('Domain updated', 'success');
                } else {
                    await window.ApiClient.post(API.groups.create, data);
                    window.showToast('Domain created', 'success');
                }
                window.hideModal();
                await loadAllData();
            } catch (err) {
                window.showToast(err.responseJSON?.message || 'Failed to save domain', 'error');
            }
        }

        async function deleteGroup(e) {
            const id = $(e.currentTarget).data('id');
            const confirmed = await window.showConfirmation({
                title: 'Delete Domain',
                message: 'Are you sure? This will fail if there are request types in this domain.',
                confirmText: 'Delete',
                confirmType: 'danger'
            });
            if (!confirmed) return;

            try {
                await window.ApiClient.delete(API.groups.delete(id));
                window.showToast('Domain deleted', 'success');
                await loadAllData();
            } catch (err) {
                window.showToast(err.responseJSON?.message || 'Delete failed', 'error');
            }
        }

        // --- Shared Workflow Logic ---

        function addWorkflowStep(data = null) {
            const $container = $('#workflow-steps-container');
            const $empty = $('#workflow-empty-state');
            if ($empty) $empty.addClass('hidden');

            const template = getTemplate('tpl-workflow-step');
            const $row = $(template);

            const $roleSelect = $row.find('.step-role');
            state.roles.forEach(role => {
                const selected = (data && data.role === role.slug) ? 'selected' : '';
                $roleSelect.append(`<option value="${role.slug}" ${selected}>${role.name}</option>`);
            });

            if (data) {
                $row.find('.step-action').val(data.action || 'approve');
                $row.find('.step-min-amount').val(data.min_amount || 0);
            }

            $container.append($row);
            if (window.lucide) window.lucide.createIcons();
        }

        function collectWorkflow() {
            const steps = [];
            $('.workflow-step-row').each(function () {
                const $row = $(this);
                const role = $row.find('.step-role').val();
                if (role) {
                    steps.push({
                        role: role,
                        action: $row.find('.step-action').val(),
                        min_amount: parseFloat($row.find('.step-min-amount').val()) || 0
                    });
                }
            });
            return {
                steps
            };
        }

        // --- Event Bindings ---

        function bindEvents() {
            // Types
            $('#btn-create-request-type').on('click', openCreateModal);
            $(document).on('click', '[data-action="edit-request-type"]', openEditModal);
            $(document).on('click', '[data-action="delete-request-type"]', deleteRequestType);
            $(document).on('click', '#btn-save-request-type', saveRequestType);
            $(document).on('click', '#btn-add-workflow-step', () => addWorkflowStep());

            // Groups
            $('#btn-create-group').on('click', openCreateGroupModal);
            $(document).on('click', '[data-action="edit-group"]', openEditGroupModal);
            $(document).on('click', '[data-action="delete-group"]', deleteGroup);
            $(document).on('click', '#btn-save-group', saveGroup);

            // General
            $(document).on('click', '#btn-quick-create-form', function () {
                window.location.href = '<?php echo home_url("/admin/forms/builder"); ?>';
            });

            $(document).on('click', '.btn-remove-step', function () {
                $(this).closest('.workflow-step-row').remove();
                if ($('.workflow-step-row').length === 0) {
                    $('#workflow-empty-state').removeClass('hidden');
                }
            });
        }

        $(function () {
            loadAllData();
            bindEvents();
        });
    })(jQuery);
</script>

<template id="field-row-template">
    <div class="field-row bg-gray-50 p-3 rounded border border-gray-200 relative group">
        <button type="button" onclick="removeField(this)"
            class="absolute top-2 right-2 text-gray-400 hover:text-red-500">&times;</button>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <input type="text" placeholder="Field Label (e.g. Payee)"
                class="field-label text-sm rounded border-gray-300 w-full" oninput="updateFieldName(this)">
            <select class="field-type text-sm rounded border-gray-300 w-full">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="textarea">Text Area</option>
            </select>
        </div>
        <div class="flex items-center gap-4">
            <label class="flex items-center text-xs text-gray-600">
                <input type="checkbox" class="field-required rounded border-gray-300 mr-1"> Required
            </label>
            <input type="hidden" class="field-name"> <!-- Auto-generated slug -->
        </div>
    </div>
</template>

<?php get_footer(); ?>