<?php

/**
 * Template Name: Admin: Forms - Builder
 * Description: Full-page form builder for creating and editing forms
 */

$pageTitle = 'Form Builder';
$breadcrumb = [
    ['name' => 'Forms', 'url' => home_url('/admin/forms')],
    ['name' => 'Builder']
];
$activeMenu = 'admin-forms-builder';

get_header();
?>


<div class="container mx-auto px-4 py-6">
    <!-- Page Header -->
    <div class="intro-y flex items-center justify-between h-10">
        <h2 class="text-lg font-medium truncate mr-5" id="page-title">Create New Form</h2>
        <div class="flex gap-2">
            <a href="<?php echo home_url('/admin/forms'); ?>" class="btn btn-secondary">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
                Back to Forms
            </a>
            <button id="btn-preview-form" type="button" class="btn btn-outline-primary">
                <i data-lucide="eye" class="w-4 h-4 mr-2"></i>
                Preview
            </button>
            <button id="btn-save-form" class="btn btn-primary">
                <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                Save Form
            </button>
        </div>
    </div>

    <!-- Form Builder -->
    <div class="intro-y box mt-3 p-5">
        <form id="form-builder-form">
            <input type="hidden" id="form-id">

            <!-- Tabs Navigation -->
            <ul class="nav nav-boxed-tabs" role="tablist">
                <li id="basic-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2 active" data-tw-toggle="pill" data-tw-target="#basic"
                        type="button" role="tab" aria-controls="basic" aria-selected="true">
                        Basic Info
                    </button>
                </li>
                <li id="sections-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#sections" type="button"
                        role="tab" aria-controls="sections" aria-selected="false">
                        Sections
                    </button>
                </li>
                <li id="fields-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#fields" type="button"
                        role="tab" aria-controls="fields" aria-selected="false">
                        Fields
                    </button>
                </li>
                <li id="conditions-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#conditions"
                        type="button" role="tab" aria-controls="conditions" aria-selected="false">
                        Conditions
                    </button>
                </li>
                <li id="workflow-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#workflow" type="button"
                        role="tab" aria-controls="workflow" aria-selected="false">
                        Workflow
                    </button>
                </li>
                <li id="storage-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#storage" type="button"
                        role="tab" aria-controls="storage" aria-selected="false">
                        Storage Strategy
                    </button>
                </li>
                <li id="scoring-tab" class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#scoring" type="button"
                        role="tab" aria-controls="scoring" aria-selected="false">
                        Assessment
                    </button>
                </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content mt-5">
                <!-- Tab: Basic Info -->
                <div id="basic" class="tab-pane leading-relaxed active" role="tabpanel" aria-labelledby="basic-tab">
                    <h3 class="text-lg font-medium mb-4">Basic Information</h3>

                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="form-label">Form Name *</label>
                            <input type="text" class="form-control" id="form-name" placeholder="e.g., IT Support Ticket"
                                required>
                        </div>

                        <div>
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="form-description" rows="3"
                                placeholder="What is this form for?"></textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Module *</label>
                                <select class="form-control" id="form-module" required>
                                    <option value="general">General</option>
                                    <option value="finance">Finance</option>
                                    <option value="hr">HR</option>
                                    <option value="admin">Admin</option>
                                    <option value="academy">Academy</option>
                                </select>
                            </div>

                            <div class="flex items-center">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="form-is-active" class="form-check-input" checked>
                                    <span class="ml-2">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Sections -->
                <div id="sections" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="sections-tab">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="text-lg font-medium">Form Sections</h3>
                            <p class="text-slate-500 text-sm mt-1">Group related fields together</p>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-add-section">
                            <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                            Add Section
                        </button>
                    </div>

                    <div id="sections-container" class="space-y-3">
                        <!-- Sections added dynamically -->
                    </div>
                </div>

                <!-- Tab: Form Fields -->
                <div id="fields" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="fields-tab">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium">Form Fields</h3>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-add-field">
                            <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                            Add Field
                        </button>
                    </div>

                    <div id="fields-container" class="space-y-3">
                        <!-- Fields added dynamically -->
                    </div>
                </div>

                <!-- Tab: Conditions -->
                <div id="conditions" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="conditions-tab">
                    <div class="mb-4">
                        <h3 class="text-lg font-medium mb-2">Conditional Logic</h3>
                        <p class="text-slate-500 text-sm">Control field visibility based on other field values
                        </p>
                    </div>

                    <div id="conditional-fields-list" class="space-y-3">
                        <!-- Populated when fields have conditions -->
                    </div>
                </div>

                <!-- Tab: Workflow -->
                <div id="workflow" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="workflow-tab">
                    <h3 class="text-lg font-medium mb-4">Workflow Settings</h3>

                    <label class="flex items-center mb-4">
                        <input type="checkbox" id="form-workflow-enabled" class="form-check-input mr-2">
                        <span>Enable Workflow (Tickets, Assignments)</span>
                    </label>

                    <div id="workflow-settings" class="hidden">
                        <label class="form-label">Workflow Statuses (comma-separated)</label>
                        <input type="text" class="form-control" id="workflow-statuses"
                            placeholder="open, in_progress, resolved, closed">
                    </div>
                </div>

                <!-- Tab: Storage Strategy -->
                <div id="storage" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="storage-tab">
                    <h3 class="text-lg font-medium mb-4">Storage Strategy</h3>
                    <p class="text-slate-500 text-sm mb-6">Define how form data should be persisted in the database.</p>

                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <label class="form-label font-semibold">Storage Type</label>
                            <div class="flex flex-col sm:flex-row gap-4 mt-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" name="storage_type" value="default" class="form-check-input" checked>
                                    <div class="ml-2">
                                        <div class="font-medium">Default (EAV)</div>
                                        <div class="text-xs text-slate-500">Flexible storage in standard form tables</div>
                                    </div>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" name="storage_type" value="custom" class="form-check-input">
                                    <div class="ml-2">
                                        <div class="font-medium">Custom Table (L2)</div>
                                        <div class="text-xs text-slate-500">Directly map fields to a specific DB table</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Custom Table Settings -->
                        <div id="custom-storage-settings" class="hidden border-t pt-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label class="form-label">Target Database Table</label>
                                    <select id="target-table" class="form-control">
                                        <option value="">Select a table...</option>
                                        <!-- Populated via API -->
                                    </select>
                                    <p class="text-xs text-slate-500 mt-1">Table must exist and start with 'sta_'</p>
                                </div>
                                <div class="flex items-end">
                                    <button type="button" id="btn-refresh-tables" class="btn btn-outline-secondary w-full">
                                        <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i> Refresh Tables
                                    </button>
                                </div>
                            </div>

                            <div id="mapping-container" class="hidden">
                                <h4 class="font-medium mb-3">Field Mapping</h4>
                                <p class="text-xs text-slate-500 mb-4 italic">Map your form fields to table columns. Unmapped fields will not be saved to the custom table.</p>

                                <div class="overflow-x-auto">
                                    <table class="table table-sm border">
                                        <thead class="bg-slate-50">
                                            <tr>
                                                <th class="w-1/2">Form Field (Key)</th>
                                                <th class="w-1/2">Database Column</th>
                                            </tr>
                                        </thead>
                                        <tbody id="mapping-table-body">
                                            <!-- Dynamically populated rows -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Assessment/Scoring -->
                <div id="scoring" class="tab-pane leading-relaxed" role="tabpanel" aria-labelledby="scoring-tab">
                    <h3 class="text-lg font-medium mb-4">Assessment & Scoring</h3>

                    <label class="flex items-center mb-4">
                        <input type="checkbox" id="form-enable-scoring" class="form-check-input mr-2">
                        <span>Enable Scoring (Assessments, KPIs)</span>
                    </label>

                    <div id="scoring-settings" class="hidden grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Maximum Score</label>
                            <input type="number" class="form-control" id="scoring-max-score" placeholder="100">
                        </div>
                        <div>
                            <label class="form-label">Pass Threshold (%)</label>
                            <input type="number" class="form-control" id="scoring-pass-threshold" placeholder="70">
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>


<!-- Preview Modal -->
<div id="form-preview-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Form Preview</h2>
                <button type="button" class="btn-close" data-tw-dismiss="modal" aria-label="Close">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="modal-body">
                <div id="preview-content" class="p-5">
                    <!-- Dynamic form preview will be rendered here -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-tw-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<!-- Field Template -->
<script type="text/html" id="tpl-field">
    <div class="field-row box p-4" data-index="{{index}}">
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <i data-lucide="grip-vertical" class="w-5 h-5 text-slate-400 cursor-move"></i>
                <span class="font-medium field-label-preview">New Field</span>
            </div>
            <div class="flex gap-2">
                <button type="button" class="btn btn-sm btn-secondary btn-toggle-field">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger btn-remove-field">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>

        <div class="field-body">
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="form-label text-xs">Label *</label>
                    <input type="text" class="form-control form-control-sm field-label" required>
                </div>
                <div>
                    <label class="form-label text-xs">Key *</label>
                    <input type="text" class="form-control form-control-sm field-key" required>
                </div>
            </div>

            <div class="grid grid-cols-4 gap-3 mb-3">
                <div>
                    <label class="form-label text-xs">Type</label>
                    <select class="form-control form-control-sm field-type">
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="radio">Radio</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="file">File Upload</option>
                    </select>
                </div>
                <div>
                    <label class="form-label text-xs">Width</label>
                    <select class="form-control form-control-sm field-width">
                        <option value="12">Full</option>
                        <option value="6">Half</option>
                        <option value="4">Third</option>
                        <option value="8">2/3</option>
                        <option value="3">Quarter</option>
                    </select>
                </div>
                <div>
                    <label class="form-label text-xs">Section</label>
                    <select class="form-control form-control-sm field-section">
                        <option value="">No Section</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <label class="flex items-center">
                        <input type="checkbox" class="field-required mr-1">
                        <span class="text-xs">Required</span>
                    </label>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="form-label text-xs">Placeholder</label>
                    <input type="text" class="form-control form-control-sm field-placeholder" placeholder="e.g., Enter your name">
                </div>
                <div>
                    <label class="form-label text-xs">Help Text</label>
                    <input type="text" class="form-control form-control-sm field-help-text" placeholder="Optional description">
                </div>
            </div>

            <input type="hidden" class="field-conditional-rules">
            <div class="field-options hidden mb-3">
                <label class="form-label text-xs">Options (comma-separated)</label>
                <input type="text" class="form-control form-control-sm field-options-value">
            </div>
        </div>
    </div>
</script>

<!-- Section Template -->
<script type="text/html" id="tpl-section">
    <div class="section-row box p-4" data-index="{{index}}">
        <div class="flex items-center justify-between mb-3">
            <input type="text" class="form-control section-title" placeholder="Section Title" required>
            <button type="button" class="btn btn-sm btn-danger btn-remove-section">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
        <textarea class="form-control section-description" rows="2" placeholder="Section description (optional)"></textarea>
    </div>
</script>

<script>
    jQuery(document).ready(function($) {
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';
        const urlParams = new URLSearchParams(window.location.search);
        const formId = urlParams.get('id');

        let fieldIndex = 0;
        let sectionIndex = 0;

        // Load existing form if ID provided
        if (formId) {
            $('#page-title').text('Edit Form');
            $('#form-id').val(formId);
            loadForm(formId);
        }

        function loadForm(id) {
            $.ajax({
                url: `/wp-json/api/v1/forms/${id}`,
                headers: {
                    'X-WP-Nonce': nonce
                },
                success: function(response) {
                    if (response.success && response.data) {
                        populateForm(response.data);
                    }
                }
            });
        }

        function populateForm(data) {
            const form = data.form;
            $('#form-name').val(form.name);
            $('#form-description').val(form.description);
            $('#form-module').val(form.module);
            $('#form-is-active').prop('checked', form.is_active);

            // Populate Storage Strategy
            if (form.storage_type === 'custom') {
                $(`input[name="storage_type"][value="custom"]`).prop('checked', true);
                $('#custom-storage-settings').removeClass('hidden');
                if (form.target_table) {
                    loadTables(form.target_table);
                    // Mapping will be loaded by loadColumns called inside loadTables
                }
            } else {
                $(`input[name="storage_type"][value="default"]`).prop('checked', true);
            }

            // Load sections
            if (data.sections) {
                data.sections.forEach(section => {
                    addSection(section);
                });
            }

            // Load fields
            if (data.fields) {
                data.fields.forEach(field => {
                    addField(field);
                });
            }

            // If custom storage and mapping exists, we might need to wait for columns to load
            // The loadColumns function handles renderMappingTable(existingMapping)
            if (form.storage_type === 'custom' && form.column_mapping) {
                const checkColumnsLoaded = setInterval(() => {
                    if (availableColumns.length > 0) {
                        renderMappingTable(form.column_mapping);
                        clearInterval(checkColumnsLoaded);
                    }
                }, 100);
            }
        }

        // Add Field
        $('#btn-add-field').on('click', () => addField());

        function addField(data = null) {
            const template = $('#tpl-field').html();
            const html = template.replace(/{{index}}/g, fieldIndex++);
            const $field = $(html);

            if (data) {
                $field.find('.field-label').val(data.field_label || data.label);
                $field.find('.field-key').val(data.field_key || data.key);
                $field.find('.field-type').val(data.field_type || data.type);
                $field.find('.field-section').val(data.section_id || '');
                $field.find('.field-required').prop('checked', data.is_required);
                if (data.field_options || data.options) $field.find('.field-options-value').val(data.field_options || data.options);
                if (data.conditional_rules) $field.find('.field-conditional-rules').val(JSON.stringify(data.conditional_rules));
            }

            $('#fields-container').append($field);
            lucide.createIcons();
        }

        // Remove Field
        $('#fields-container').on('click', '.btn-remove-field', function() {
            $(this).closest('.field-row').remove();
        });

        // Toggle Field Body
        $('#fields-container').on('click', '.btn-toggle-field', function() {
            $(this).closest('.field-row').find('.field-body').toggle();
        });

        // Update field preview
        $('#fields-container').on('input', '.field-label', function() {
            const label = $(this).val() || 'New Field';
            $(this).closest('.field-row').find('.field-label-preview').text(label);
        });

        // Show/hide options for select/radio
        $('#fields-container').on('change', '.field-type', function() {
            const type = $(this).val();
            const $row = $(this).closest('.field-row');
            $row.find('.field-options').toggleClass('hidden', !['select', 'radio'].includes(type));
        });

        // Add Section
        $('#btn-add-section').on('click', () => addSection());

        function addSection(data = null) {
            const template = $('#tpl-section').html();
            const html = template.replace(/{{index}}/g, sectionIndex++);
            const $section = $(html);

            if (data) {
                $section.find('.section-title').val(data.title);
                $section.find('.section-description').val(data.description);
            }

            $('#sections-container').append($section);
            updateSectionDropdowns();
            lucide.createIcons();
        }

        // Remove Section
        $('#sections-container').on('click', '.btn-remove-section', function() {
            $(this).closest('.section-row').remove();
            updateSectionDropdowns();
        });

        // Update section dropdowns in fields
        $('#sections-container').on('input', '.section-title', updateSectionDropdowns);

        function updateSectionDropdowns() {
            const sections = [];
            $('.section-row').each(function() {
                const index = $(this).data('index');
                const title = $(this).find('.section-title').val();
                if (title) sections.push({
                    index,
                    title
                });
            });

            $('.field-section').each(function() {
                const current = $(this).val();
                $(this).html('<option value="">No Section</option>');
                sections.forEach(s => {
                    const selected = current == s.index ? 'selected' : '';
                    $(this).append(`<option value="${s.index}" ${selected}>${s.title}</option>`);
                });
            });
        }

        // Workflow toggle
        $('#form-workflow-enabled').on('change', function() {
            $('#workflow-settings').toggleClass('hidden', !this.checked);
        });

        // Scoring toggle
        $('#form-enable-scoring').on('change', function() {
            $('#scoring-settings').toggleClass('hidden', !this.checked);
        });

        // Storage Strategy Logic
        $('input[name="storage_type"]').on('change', function() {
            const isCustom = $(this).val() === 'custom';
            $('#custom-storage-settings').toggleClass('hidden', !isCustom);
            if (isCustom) {
                loadTables();
            }
        });

        $('#btn-refresh-tables').on('click', loadTables);

        $('#target-table').on('change', function() {
            const table = $(this).val();
            if (table) {
                loadColumns(table);
            } else {
                $('#mapping-container').addClass('hidden');
                $('#mapping-table-body').empty();
            }
        });

        function loadTables(selectedTable = null) {
            const $btn = $('#btn-refresh-tables');
            const originalHtml = $btn.html();
            $btn.html('<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Loading...').prop('disabled', true);
            lucide.createIcons();

            $.ajax({
                url: '/wp-json/api/v1/forms/schema/tables',
                headers: {
                    'X-WP-Nonce': nonce
                },
                success: function(response) {
                    if (response.success) {
                        const $select = $('#target-table');
                        $select.empty().append('<option value="">Select a table...</option>');
                        response.data.forEach(table => {
                            const selected = selectedTable === table ? 'selected' : '';
                            $select.append(`<option value="${table}" ${selected}>${table}</option>`);
                        });
                        if (selectedTable) {
                            loadColumns(selectedTable);
                        }
                    }
                },
                complete: function() {
                    $btn.html(originalHtml).prop('disabled', false);
                    lucide.createIcons();
                }
            });
        }

        let availableColumns = [];

        function loadColumns(table, existingMapping = null) {
            $.ajax({
                url: `/wp-json/api/v1/forms/schema/tables/${table}/columns`,
                headers: {
                    'X-WP-Nonce': nonce
                },
                success: function(response) {
                    if (response.success) {
                        availableColumns = response.data;
                        renderMappingTable(existingMapping);
                        $('#mapping-container').removeClass('hidden');
                    }
                }
            });
        }

        function renderMappingTable(existingMapping = null) {
            const fields = collectFields();
            const $tbody = $('#mapping-table-body');
            $tbody.empty();

            if (fields.length === 0) {
                $tbody.append('<tr><td colspan="2" class="text-center py-4 text-slate-500 italic">No form fields defined yet. Add fields in the "Fields" tab first.</td></tr>');
                return;
            }

            fields.forEach(field => {
                const fieldKey = field.field_key;
                const fieldLabel = field.field_label || fieldKey;
                if (!fieldKey) return;

                const selectedCol = existingMapping ? existingMapping[fieldKey] : '';

                let optionsHtml = '<option value="">-- Don\'t Map --</option>';
                availableColumns.forEach(col => {
                    const selected = selectedCol === col.Field ? 'selected' : '';
                    optionsHtml += `<option value="${col.Field}" ${selected}>${col.Field} (${col.Type})</option>`;
                });

                const rowHtml = `
                    <tr>
                        <td class="align-middle">
                            <div class="font-medium">${fieldLabel}</div>
                            <div class="text-xs text-slate-500">${fieldKey}</div>
                        </td>
                        <td>
                            <select class="form-control form-control-sm column-mapping" data-field="${fieldKey}">
                                ${optionsHtml}
                            </select>
                        </td>
                    </tr>
                `;
                $tbody.append(rowHtml);
            });
        }

        // Re-render mapping table when switching to storage tab
        $('[data-tw-target="#storage"]').on('click', function() {
            if ($('input[name="storage_type"]:checked').val() === 'custom' && $('#target-table').val()) {
                // Get existing mapping from current UI before re-rendering
                const currentMapping = collectMapping();
                renderMappingTable(currentMapping);
            }
        });

        function collectMapping() {
            const mapping = {};
            $('.column-mapping').each(function() {
                const field = $(this).data('field');
                const col = $(this).val();
                if (col) mapping[field] = col;
            });
            return mapping;
        }

        // Save Form
        $('#btn-save-form').on('click', saveForm);

        function saveForm() {
            const formData = {
                name: $('#form-name').val(),
                description: $('#form-description').val(),
                module: $('#form-module').val(),
                is_active: $('#form-is-active').is(':checked') ? 1 : 0,
                storage_type: $('input[name="storage_type"]:checked').val(),
                target_table: $('#target-table').val(),
                column_mapping: collectMapping(),
                sections: collectSections(),
                fields: collectFields()
            };

            const url = formId ? `/wp-json/api/v1/forms/${formId}` : '/wp-json/api/v1/forms';
            const method = formId ? 'PUT' : 'POST';

            $.ajax({
                url: url,
                method: method,
                headers: {
                    'X-WP-Nonce': nonce
                },
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        alert('Form saved successfully!');
                        window.location.href = '<?php echo home_url('/admin/forms'); ?>';
                    }
                },
                error: function() {
                    alert('Error saving form');
                }
            });
        }

        function collectSections() {
            const sections = [];
            $('.section-row').each(function(order) {
                sections.push({
                    title: $(this).find('.section-title').val(),
                    description: $(this).find('.section-description').val(),
                    order: order
                });
            });
            return sections;
        }

        function collectFields() {
            const fields = [];
            $('.field-row').each(function(order) {
                const type = $(this).find('.field-type').val();
                fields.push({
                    field_label: $(this).find('.field-label').val(),
                    field_key: $(this).find('.field-key').val(),
                    field_type: type,
                    section_id: $(this).find('.field-section').val() || null,
                    is_required: $(this).find('.field-required').is(':checked') ? 1 : 0,
                    field_options: ['select', 'radio'].includes(type) ? $(this).find('.field-options-value').val() : null,
                    conditional_rules: $(this).find('.field-conditional-rules').val() || null,
                    display_order: order
                });
            });
            return fields;
        }

        lucide.createIcons();
    });
</script>

<?php get_footer(); ?>