<?php

/**
 * Template Name: Admin: Taxonomies
 * Description: Manage system taxonomies and their terms
 */

$pageTitle = 'Taxonomy Management';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Taxonomies']
];
$activeMenu = 'admin-taxonomies';
$requiredRoles = ['administrator', 'admin'];

get_header();

?>

<!-- NETWORK ERROR DEBUG -->
<div id="network-err" class="hidden mb-4 alert alert-danger">
    <strong>API Error:</strong> <span id="network-err-msg"></span>
</div>

<!-- VIEW: TAXONOMY LIST -->
<div id="view-taxonomies">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">
            Taxonomies
        </h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <button id="btn-create-tax" class="btn btn-primary shadow-md mr-2">New Taxonomy</button>
        </div>
    </div>

    <div class="intro-y flex flex-col sm:flex-row items-center justify-between mt-2 mb-4 px-1 gap-2">
        <div class="alert alert-primary-soft show flex items-center mb-2" role="alert">
            <i data-lucide="info" class="w-4 h-4 mr-2"></i>
            <div>
                <strong>Taxonomies</strong> are organizational folders (e.g., Expense Categories, Projects).
                Click "Terms" to manage the items within each taxonomy.
            </div>
        </div>
        <!-- Filter/Search -->
        <div class="w-56 relative text-slate-500">
            <input type="text" class="form-control w-56 box pr-10" placeholder="Search...">
            <i data-lucide="search" class="w-4 h-4 absolute my-auto inset-y-0 right-0 mr-3"></i>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- TABLE -->
        <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
            <table class="table table-report -mt-2">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">NAME</th>
                        <th class="whitespace-nowrap">SLUG</th>
                        <th class="text-center whitespace-nowrap">TYPE</th>
                        <th class="text-center whitespace-nowrap">ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="tax-table-body">
                    <!-- Populated via JS -->
                </tbody>
            </table>
            <div id="tax-loading" class="p-8 text-center text-gray-500">Loading taxonomies...</div>
            <div id="tax-empty" class="hidden p-8 text-center text-gray-500">No taxonomies found.</div>
        </div>
    </div>
</div>

<!-- VIEW: TERMS LIST (Detail) -->
<div id="view-terms" class="hidden">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <div class="mr-auto flex items-center gap-2">
            <button id="btn-back-tax" class="btn btn-secondary mr-2"> <i data-lucide="arrow-left"
                    class="w-4 h-4 mr-2"></i> Back </button>
            <h2 class="text-lg font-medium">
                Manage Terms: <span id="current-tax-name" class="text-primary"></span>
            </h2>
        </div>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0 gap-2">
            <button id="btn-refresh-terms" class="btn btn-secondary shadow-md"> <i data-lucide="refresh-cw"
                    class="w-4 h-4"></i> </button>
            <button id="btn-create-term" class="btn btn-primary shadow-md">New Term</button>
        </div>
    </div>
    <div class="intro-y mt-2 mb-5 px-1">
        <p class="text-gray-500" id="current-tax-desc"></p>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- TABLE -->
        <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
            <table class="table table-report -mt-2">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">NAME</th>
                        <th class="whitespace-nowrap">SLUG</th>
                        <th class="whitespace-nowrap">DETAILS</th>
                        <th class="text-center whitespace-nowrap">STATUS</th>
                        <th class="text-center whitespace-nowrap">ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="terms-table-body">
                    <!-- Populated via JS -->
                </tbody>
            </table>
            <div id="terms-loading" class="p-8 text-center text-gray-500 hidden">Loading terms...</div>
            <div id="terms-empty" class="hidden p-8 text-center text-gray-500">No terms found. Create one to get
                started.</div>
        </div>
    </div>
</div>


<!-- STATIC MODALS -->

<!-- Taxonomy Modal -->
<div id="modal-tax" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="modal-tax-title">Taxonomy</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <form id="tax-form" onsubmit="return false;" class="col-span-12 grid grid-cols-12 gap-4 gap-y-3">
                    <input type="hidden" id="tax-id">
                    <div class="col-span-12">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="tax-name" required placeholder="e.g. Project Types">
                    </div>
                    <div class="col-span-12">
                        <label class="form-label">Slug *</label>
                        <input type="text" class="form-control" id="tax-slug" required placeholder="Auto-generated from name (editable)">
                        <div class="text-xs text-slate-500 mt-1">Unique key (lowercase, hyphens) - auto-generated but editable</div>
                    </div>
                    <div class="col-span-12">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="tax-desc" rows="3"></textarea>
                    </div>
                    <div class="col-span-12">
                        <label class="cursor-pointer flex items-center">
                            <input type="checkbox" id="tax-hierarchical" class="form-checkbox border">
                            <span class="ml-2">Hierarchical (allows sub-terms)</span>
                        </label>
                    </div>
                    <div id="sys-warning" class="hidden col-span-12 alert alert-warning-soft flex items-center">
                        <i data-lucide="alert-triangle" class="w-4 h-4 mr-2"></i>
                        System Taxonomy: Editing slug is disabled.
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal"
                    class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" id="btn-save-tax" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>

<!-- Term Modal -->
<div id="modal-term" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="modal-term-title">Term</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <form id="term-form" onsubmit="return false;" class="col-span-12 grid grid-cols-12 gap-4 gap-y-3">
                    <input type="hidden" id="term-id">
                    <div class="col-span-12">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="term-name" required>
                    </div>
                    <div class="col-span-12">
                        <label class="form-label">Slug</label>
                        <input type="text" class="form-control" id="term-slug" placeholder="Auto-generated from name (editable)">
                        <div class="text-xs text-slate-500 mt-1">Leave blank for auto-generation, or customize</div>
                    </div>
                    <div class="col-span-12" id="parent-container">
                        <label class="form-label">Parent Term</label>
                        <select id="term-parent" class="form-select">
                            <option value="">None</option>
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="term-desc" rows="2"></textarea>
                    </div>

                    <div class="col-span-12 border-t pt-4 mt-2">
                        <h4 class="font-medium mb-3 text-sm uppercase text-gray-500">Associations & Settings</h4>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6">
                                <label class="form-label">Organization</label>
                                <select id="meta-org" class="form-select">
                                    <option value="">All Organizations</option>
                                </select>
                            </div>
                            <div class="col-span-12 md:col-span-3">
                                <label class="form-label">Sort Order</label>
                                <input type="number" id="term-sort-order" class="form-control" value="0" min="0">
                                <div class="text-xs text-slate-500 mt-1">Lower numbers appear first</div>
                            </div>
                            <div class="col-span-12 md:col-span-3 flex items-end">
                                <label class="cursor-pointer flex items-center mb-2">
                                    <input type="checkbox" id="term-active" class="form-checkbox border" checked>
                                    <span class="ml-2">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal"
                    class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" id="btn-save-term" class="btn btn-primary w-20">Save Term</button>
            </div>
        </div>
    </div>
</div>



<script>
    (function($) {
        'use strict';

        // Config
        const API = {
            taxonomies: '/wp-json/api/v1/taxonomies',
            terms: '/wp-json/api/v1/taxonomy/terms',
            orgs: '/wp-json/api/v1/organizations'
        };

        // State
        const state = {
            taxonomies: [],
            currentTaxId: null,
            terms: [],
            orgs: []
        };

        // --- HELPERS ---

        function slugify(text) {
            return text
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-') // Replace spaces with -
                .replace(/[^\w\-]+/g, '') // Remove all non-word chars
                .replace(/\-\-+/g, '-') // Replace multiple - with single -
                .replace(/^-+/, '') // Trim - from start of text
                .replace(/-+$/, ''); // Trim - from end of text
        }

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

        // --- INIT ---
        async function init() {
            await loadOrgs();
            await loadTaxonomies();
        }

        // --- LOAD DATA ---
        async function loadOrgs() {
            try {
                const res = await window.ApiClient.get(API.orgs);
                state.orgs = res.data?.data || res.data || [];
            } catch (e) {
                console.warn('Orgs load failed', e);
            }
        }

        async function loadTaxonomies() {
            $('#tax-loading').show();
            $('#tax-table-body').empty();
            $('#tax-empty').hide();

            try {
                const res = await window.ApiClient.get(API.taxonomies);
                state.taxonomies = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                renderTaxonomies();
            } catch (err) {
                console.error(err);
                $('#network-err').removeClass('hidden').find('span').text(err.message || 'Failed to load taxonomies');
            } finally {
                $('#tax-loading').hide();
            }
        }

        async function loadTerms(taxId) {
            $('#terms-loading').removeClass('hidden');
            $('#terms-table-body').empty();
            $('#terms-empty').addClass('hidden');

            try {
                const res = await window.ApiClient.get(`${API.taxonomies}/${taxId}/terms`);
                state.terms = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                renderTerms();
            } catch (err) {
                console.error(err);
                showToast('Failed to load terms', 'error');
            } finally {
                $('#terms-loading').addClass('hidden');
            }
        }

        // --- RENDER ---
        function renderTaxonomies() {
            const $tbody = $('#tax-table-body');
            $tbody.empty();

            if (state.taxonomies.length === 0) {
                $('#tax-empty').show();
                return;
            }

            state.taxonomies.forEach(tax => {
                const sysBadge = tax.is_system ?
                    '<span class="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary mr-1">System</span>' : '';
                const hierBadge = tax.hierarchical ?
                    '<span class="px-2 py-1 text-xs font-medium rounded bg-pending/10 text-pending">Hierarchical</span>' :
                    '<span class="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-500">Flat</span>';

                const html = `
                <tr class="intro-x">
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="font-medium whitespace-nowrap">${tax.name}</div>
                        <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5">${tax.description || ''}</div>
                    </td>
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="bg-slate-100 dark:bg-darkmode-400/70 border border-slate-200 dark:border-darkmode-400 text-slate-500 px-2 py-1 rounded text-xs w-fit">
                             ${tax.slug}
                        </div>
                    </td>
                    <td class="text-center first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        ${sysBadge}
                        ${hierBadge}
                    </td>
                    <td class="table-report__action w-56 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 text-primary btn-manage-terms cursor-pointer" data-id="${tax.id}">
                                <i data-lucide="list" class="w-4 h-4 mr-1"></i> Terms
                            </a>
                            <a class="flex items-center mr-3 cursor-pointer btn-edit-tax" data-id="${tax.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer btn-delete-tax" data-id="${tax.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `;

                $tbody.append(html);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function renderTerms() {
            const $tbody = $('#terms-table-body');
            $tbody.empty();

            if (state.terms.length === 0) {
                $('#terms-empty').removeClass('hidden');
                return;
            }

            state.terms.forEach(term => {
                const meta = (typeof term.meta === 'string' ? JSON.parse(term.meta) : term.meta) || {};
                const orgName = meta.organization_id ?
                    (state.orgs.find(o => o.id == meta.organization_id)?.name || 'Unknown Org') :
                    '-';

                const activeHtml = term.is_active ?
                    `<div class="flex items-center justify-center text-success"> <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Active </div>` :
                    `<div class="flex items-center justify-center text-danger"> <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Inactive </div>`;

                const row = `
                <tr class="intro-x">
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="font-medium whitespace-nowrap">
                            ${term.parent_id ? '<span class="text-slate-400 mr-1">↳</span> ' : ''}${term.name}
                        </div>
                    </td>
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="text-slate-500 text-xs">${term.slug}</div>
                    </td>
                    <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="flex flex-col gap-1">
                            ${orgName !== '-' ? `<span class="text-xs bg-slate-100 rounded px-2 py-0.5 w-fit text-slate-500">Org: ${orgName}</span>` : ''}
                        </div>
                    </td>
                    <td class="w-40 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        ${activeHtml}
                    </td>
                    <td class="table-report__action w-56 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3 cursor-pointer btn-edit-term" data-id="${term.id}">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                            <a class="flex items-center text-danger cursor-pointer btn-delete-term" data-id="${term.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                            </a>
                        </div>
                    </td>
                </tr>
            `;
                $tbody.append(row);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        // --- ACTIONS ---

        function switchView(view) {
            if (view === 'terms') {
                $('#view-taxonomies').addClass('hidden');
                $('#view-terms').removeClass('hidden');
            } else {
                $('#view-terms').addClass('hidden');
                $('#view-taxonomies').removeClass('hidden');
                state.currentTaxId = null;
            }
        }

        function manageTerms(taxId) {
            const tax = state.taxonomies.find(t => t.id == taxId);
            if (!tax) return;
            state.currentTaxId = taxId;
            $('#current-tax-name').text(tax.name);
            $('#current-tax-desc').text(tax.description);
            switchView('terms');
            loadTerms(taxId);
        }

        // --- MODAL HANDLERS ---

        function openTaxModal(tax = null) {
            $('#tax-form')[0].reset();
            $('#tax-id').val('');
            $('#sys-warning').addClass('hidden');
            $('#tax-slug').prop('readonly', false).removeClass('bg-gray-100 cursor-not-allowed');
            $('#modal-tax-title').text(tax ? 'Edit Taxonomy' : 'New Taxonomy');

            if (tax) {
                $('#tax-id').val(tax.id);
                $('#tax-name').val(tax.name);
                $('#tax-slug').val(tax.slug);
                $('#tax-desc').val(tax.description);
                $('#tax-hierarchical').prop('checked', !!tax.hierarchical);

                if (tax.is_system) {
                    $('#sys-warning').removeClass('hidden');
                    $('#tax-slug').prop('readonly', true).addClass('bg-gray-100 cursor-not-allowed');
                }
            }
            getModal('#modal-tax').show();
        }

        function openTermModal(term = null) {
            $('#term-form')[0].reset();
            $('#term-id').val('');
            $('#parent-container').show();
            $('#modal-term-title').text(term ? 'Edit Term' : 'New Term');

            // Populate Orgs
            const $orgSel = $('#meta-org');
            $orgSel.empty().append('<option value="">All Organizations</option>');
            state.orgs.forEach(o => $orgSel.append(`<option value="${o.id}">${o.name}</option>`));

            // Populate Parents
            const $parentSel = $('#term-parent');
            $parentSel.empty().append('<option value="">None</option>');
            const currentTax = state.taxonomies.find(t => t.id == state.currentTaxId);

            if (currentTax && currentTax.hierarchical) {
                state.terms.forEach(t => {
                    if (term && t.id == term.id) return;
                    $parentSel.append(`<option value="${t.id}">${t.name}</option>`);
                });
            } else {
                $('#parent-container').hide();
            }

            if (term) {
                $('#term-id').val(term.id);
                $('#term-name').val(term.name);
                $('#term-slug').val(term.slug);
                $('#term-desc').val(term.description);
                $('#term-parent').val(term.parent_id);
                $('#term-sort-order').val(term.sort_order || 0);
                $('#term-active').prop('checked', !!term.is_active);
                const meta = typeof term.meta === 'string' ? JSON.parse(term.meta) : (term.meta || {});
                $('#meta-org').val(meta.organization_id);
            }
            getModal('#modal-term').show();
        }

        // --- SAVE / DELETE ---

        async function saveTax() {
            const id = $('#tax-id').val();
            const data = {
                name: $('#tax-name').val().trim(),
                slug: $('#tax-slug').val().trim(),
                description: $('#tax-desc').val().trim(),
                hierarchical: $('#tax-hierarchical').is(':checked') ? 1 : 0
            };

            if (!data.name || !data.slug) {
                showToast('Name and Slug are required', 'error');
                return;
            }

            try {
                console.log('Saving taxonomy:', data);
                let result;
                if (id) {
                    result = await window.ApiClient.put(`${API.taxonomies}/${id}`, data);
                } else {
                    result = await window.ApiClient.post(API.taxonomies, data);
                }
                console.log('Save result:', result);

                getModal('#modal-tax').hide();
                showToast('Taxonomy saved', 'success');
                await loadTaxonomies();
            } catch (e) {
                console.error('Save error:', e);
                const errorMsg = e.responseJSON?.message || e.message || 'Save failed';
                showToast(errorMsg, 'error');
            }
        }

        async function deleteTax(id) {
            if (!confirm('Delete taxonomy? This deletes all terms.')) return;
            try {
                await window.ApiClient.delete(`${API.taxonomies}/${id}`);
                showToast('Deleted', 'success');
                loadTaxonomies();
            } catch (e) {
                showToast('Delete failed', 'error');
            }
        }

        async function saveTerm() {
            const id = $('#term-id').val();
            const data = {
                taxonomy_id: state.currentTaxId,
                name: $('#term-name').val().trim(),
                slug: $('#term-slug').val().trim(),
                description: $('#term-desc').val().trim(),
                parent_id: $('#term-parent').val() || null,
                sort_order: parseInt($('#term-sort-order').val()) || 0,
                is_active: $('#term-active').is(':checked') ? 1 : 0,
                meta: JSON.stringify({
                    organization_id: $('#meta-org').val()
                })
            };

            if (!data.name) {
                showToast('Name required', 'error');
                return;
            }

            try {
                console.log('Saving term:', data);
                let result;
                if (id) {
                    result = await window.ApiClient.put(`${API.terms}/${id}`, data);
                } else {
                    result = await window.ApiClient.post(API.terms, data);
                }
                console.log('Term save result:', result);

                getModal('#modal-term').hide();
                showToast('Term saved', 'success');
                await loadTerms(state.currentTaxId);
            } catch (e) {
                console.error('Term save error:', e);
                const errorMsg = e.responseJSON?.message || e.message || 'Save failed';
                showToast(errorMsg, 'error');
            }
        }

        async function deleteTerm(id) {
            if (!confirm('Delete term?')) return;
            try {
                await window.ApiClient.delete(`${API.terms}/${id}`);
                showToast('Deleted', 'success');
                loadTerms(state.currentTaxId);
            } catch (e) {
                showToast('Delete failed', 'error');
            }
        }

        // --- BINDINGS ---
        $(function() {
            init();

            // Auto-generate slug from taxonomy name
            $('#tax-name').on('input', function() {
                if (!$('#tax-id').val() && !$('#tax-slug').prop('readonly')) {
                    $('#tax-slug').val(slugify($(this).val()));
                }
            });

            // Auto-generate slug from term name
            $('#term-name').on('input', function() {
                if (!$('#term-id').val()) {
                    $('#term-slug').val(slugify($(this).val()));
                }
            });

            $('#btn-create-tax').on('click', (e) => {
                e.preventDefault();
                openTaxModal();
            });

            $('#btn-create-term').on('click', (e) => {
                e.preventDefault();
                openTermModal();
            });

            $('#btn-back-tax').on('click', () => switchView('list'));
            $('#btn-refresh-terms').on('click', () => loadTerms(state.currentTaxId));

            $(document).on('click', '.btn-manage-terms', function() {
                manageTerms($(this).data('id'));
            });
            $(document).on('click', '.btn-edit-tax', function() {
                const t = state.taxonomies.find(x => x.id == $(this).data('id'));
                openTaxModal(t);
            });
            $(document).on('click', '.btn-delete-tax', function() {
                deleteTax($(this).data('id'));
            });
            $('#btn-save-tax').on('click', saveTax);

            $(document).on('click', '.btn-edit-term', function() {
                const t = state.terms.find(x => x.id == $(this).data('id'));
                openTermModal(t);
            });
            $(document).on('click', '.btn-delete-term', function() {
                deleteTerm($(this).data('id'));
            });
            $('#btn-save-term').on('click', saveTerm);
        });

    })(jQuery);
</script>

<?php get_footer(); ?>