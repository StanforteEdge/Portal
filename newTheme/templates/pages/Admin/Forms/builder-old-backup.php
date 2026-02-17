<?php

/**
 * Template Name: Admin: Forms - Builder Adv
 * Description: Create and manage dynamic forms with advanced features
 */

$pageTitle = 'Form Builder';
$breadcrumb = [
    ['name' => 'Admin', 'url' => home_url('/admin')],
    ['name' => 'Forms']
];
$activeMenu = 'admin-forms';

get_header();

?>

<div class="container mx-auto px-4 py-8">

    <!-- Page Header -->
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">Advanced Form Builder</h1>
            <p class="text-gray-500 mt-1">Create dynamic forms with conditional logic, assessments, and validations</p>
        </div>
        <button id="btn-create-form" class="btn btn-primary">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
            New Form
        </button>
    </div>

    <!-- Forms Grid -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions
                    </th>
                </tr>
            </thead>
            <tbody id="forms-table-body" class="bg-white divide-y divide-gray-200">
                <!-- Populated via JS -->
            </tbody>
        </table>
        <div id="loading-state" class="p-8 text-center text-gray-500">
            Loading forms...
        </div>
    </div>
</div>

<!-- Advanced Form Builder Template -->
<script type="text/html" id="tpl-form-builder">
    <form id="form-builder-form">
        <input type="hidden" id="form-id">

        <!-- Tabs Navigation -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8">
                <button type="button" class="tab-btn active" data-tab="basic">Basic Info</button>
                <button type="button" class="tab-btn" data-tab="sections">Sections</button>
                <button type="button" class="tab-btn" data-tab="fields">Form Fields</button>
                <button type="button" class="tab-btn" data-tab="conditions">Conditions</button>
                <button type="button" class="tab-btn" data-tab="workflow">Workflow</button>
                <button type="button" class="tab-btn" data-tab="scoring">Assessment/Scoring</button>
            </nav>
        </div>

        <!-- Tab: Basic Info -->
        <div class="tab-content active" data-tab-content="basic">
            <h3 class="text-lg font-semibold mb-4">Basic Information</h3>

            <div class="mb-4">
                <label class="form-label">Form Name *</label>
                <input type="text" class="form-control" id="form-name" placeholder="e.g., IT Support Ticket" required>
            </div>

            <div class="mb-4">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="form-description" rows="2" placeholder="What is this form for?"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="form-label">Module *</label>
                    <select class="form-control" id="form-module" required>
                        <option value="general">General</option>
                        <option value="finance">Finance</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div class="flex items-end">
                    <label class="flex items-center">
                        <input type="checkbox" id="form-is-active" class="form-checkbox mr-2" checked>
                        <span class="text-sm font-medium">Active</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Tab: Sections -->
        <div class="tab-content" data-tab-content="sections">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-lg font-semibold">Form Sections</h3>
                    <p class="text-sm text-gray-500">Group related fields together</p>
                </div>
                <button type="button" class="btn btn-sm btn-primary" id="btn-add-section">
                    <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                    Add Section
                </button>
            </div>

            <div id="sections-container" class="space-y-3 mb-6">
                <!-- Sections added dynamically -->
            </div>

            <div class="bg-blue-50 p-4 rounded text-sm">
                <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                <strong>Tip:</strong> Sections help organize long forms. Fields can be assigned to sections in the "Form Fields" tab.
            </div>
        </div>

        <!-- Tab: Form Fields -->
        <div class="tab-content" data-tab-content="fields">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Form Fields</h3>
                <button type="button" class="btn btn-sm btn-primary" id="btn-add-field">
                    <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                    Add Field
                </button>
            </div>

            <div id="fields-container" class="space-y-3">
                <!-- Fields added dynamically -->
            </div>
        </div>

        <!-- Tab: Conditional Logic -->
        <div class="tab-content" data-tab-content="conditions">
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-2">Conditional Logic</h3>
                <p class="text-sm text-gray-600">Control when fields are shown or hidden based on user input.</p>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div class="flex items-start">
                    <i data-lucide="info" class="w-5 h-5 text-blue-600 mr-3 mt-0.5"></i>
                    <div class="text-sm text-blue-900">
                        <strong>How it works:</strong> Select a field below and add conditions. The field will only be visible when all conditions are met.
                    </div>
                </div>
            </div>

            <div id="conditional-fields-list" class="space-y-4">
                <!-- Populated dynamically with fields that have conditions -->
            </div>
        </div>

        <!-- Tab: Workflow -->
        <div class="tab-content" data-tab-content="workflow">
            <h3 class="text-lg font-semibold mb-4">Workflow Settings</h3>

            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="form-workflow-enabled" class="form-checkbox mr-2">
                    <span class="font-medium">Enable Workflow (Tickets, Assignments)</span>
                </label>
            </div>

            <div id="workflow-settings" class="hidden">
                <div class="mb-4">
                    <label class="form-label">Workflow Statuses (comma-separated)</label>
                    <input type="text" class="form-control" id="workflow-statuses" placeholder="e.g., open, in_progress, resolved, closed">
                    <div class="text-xs text-gray-500 mt-1">Default: submitted</div>
                </div>
            </div>
        </div>

        <!-- Tab: Assessment/Scoring -->
        <div class="tab-content" data-tab-content="scoring">
            <h3 class="text-lg font-semibold mb-4">Assessment & KPI Settings</h3>

            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="form-enable-scoring" class="form-checkbox mr-2">
                    <span class="font-medium">Enable Scoring (Assessments, KPIs)</span>
                </label>
            </div>

            <div id="scoring-settings" class="hidden space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Maximum Score</label>
                        <input type="number" class="form-control" id="scoring-max-score" placeholder="100">
                    </div>
                    <div>
                        <label class="form-label">Pass Threshold (%)</label>
                        <input type="number" class="form-control" id="scoring-pass-threshold" placeholder="70" min="0" max="100">
                    </div>
                </div>

                <div class="bg-blue-50 p-4 rounded">
                    <p class="text-sm text-blue-800">
                        <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                        Set individual field scores in the "Form Fields" tab
                    </p>
                </div>
            </div>
        </div>
    </form>
</script>

<!-- Advanced Field Template -->
<script type="text/html" id="tpl-field-row">
    <div class="field-row border border-gray-200 rounded-lg bg-white" data-field-index="{{index}}">
        <!-- Field Header -->
        <div class="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-move drag-handle">
            <div class="flex items-center gap-2">
                <i data-lucide="grip-vertical" class="w-5 h-5 text-gray-400"></i>
                <span class="font-medium field-preview-label">New Field</span>
                <span class="text-xs text-gray-500 field-preview-type"></span>
            </div>
            <div class="flex gap-2">
                <button type="button" class="text-gray-600 hover:text-gray-900 btn-toggle-field" title="Expand/Collapse">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                </button>
                <button type="button" class="text-red-600 hover:text-red-900 btn-remove-field" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>

        <!-- Field Body (Collapsible) -->
        <div class="field-body p-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="form-label text-xs">Field Label *</label>
                    <input type="text" class="form-control form-control-sm field-label" placeholder="e.g., Issue Description" required>
                </div>
                <div>
                    <label class="form-label text-xs">Field Key *</label>
                    <input type="text" class="form-control form-control-sm field-key" placeholder="e.g., issue_description" required>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="form-label text-xs">Field Type *</label>
                    <select class="form-control form-control-sm field-type">
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="select">Select Dropdown</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="rating">Rating (Stars)</option>
                        <option value="range">Range Slider</option>
                        <option value="file">File Upload</option>
                        <option value="email">Email</option>
                        <option value="url">URL</option>
                        <option value="phone">Phone</option>
                    </select>
                </div>
                <div>
                    <label class="form-label text-xs">Field Width</label>
                    <select class="form-control form-control-sm field-width">
                        <option value="full">Full (100%)</option>
                        <option value="lg">Large (75%)</option>
                        <option value="md">Medium (50%)</option>
                        <option value="sm">Small (25%)</option>
                    </select>
                </div>
                <div class="flex items-end gap-3">
                    <label class="flex items-center">
                        <input type="checkbox" class="field-required mr-1">
                        <span class="text-xs">Required</span>
                    </label>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="form-label text-xs">Placeholder</label>
                    <input type="text" class="form-control form-control-sm field-placeholder" placeholder="Enter placeholder text">
                </div>
                <div>
                    <label class="form-label text-xs">Help Text</label>
                    <input type="text" class="form-control form-control-sm field-help-text" placeholder="Helpful hint for user">
                </div>
            </div>

            <!-- Section Assignment -->
            <div class="mb-4">
                <label class="form-label text-xs">Section Assignment</label>
                <select class="form-control form-control-sm field-section">
                    <option value="">No Section (Root Level)</option>
                    <!-- Populated dynamically from sections -->
                </select>
            </div>

            <!-- Hidden: Conditional Rules Storage -->
            <input type="hidden" class="field-conditional-rules" value="">

            <!-- Options (for select/radio) -->
            <div class="field-options-container hidden mb-4">
                <label class="form-label text-xs">Options (comma-separated)</label>
                <input type="text" class="form-control form-control-sm field-options" placeholder="Option 1, Option 2, Option 3">
            </div>

            <!-- Range/Number Config -->
            <div class="field-number-config hidden mb-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label text-xs">Minimum Value</label>
                        <input type="number" class="form-control form-control-sm field-min-value">
                    </div>
                    <div>
                        <label class="form-label text-xs">Maximum Value</label>
                        <input type="number" class="form-control form-control-sm field-max-value">
                    </div>
                </div>
            </div>

            <!-- Scoring -->
            <div class="mb-4">
                <label class="form-label text-xs">Score Value (for assessments)</label>
                <input type="number" class="form-control form-control-sm field-score" placeholder="0" min="0">
            </div>

            <!-- Conditional Logic -->
            <div class="border-t border-gray-200 pt-4 mt-4">
                <button type="button" class="text-sm text-blue-600 hover:text-blue-700 flex items-center btn-add-condition">
                    <i data-lucide="git-branch" class="w-4 h-4 mr-1"></i>
                    Add Conditional Rule
                </button>

                <div class="field-conditionals mt-3 space-y-2 hidden">
                    <div class="bg-blue-50 p-3 rounded text-sm">
                        <div class="grid grid-cols-4 gap-2">
                            <div>
                                <select class="form-control form-control-sm condition-field">
                                    <option value="">Select field...</option>
                                    <!-- Populated dynamically -->
                                </select>
                            </div>
                            <div>
                                <select class="form-control form-control-sm condition-operator">
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                    <option value="contains">Contains</option>
                                </select>
                            </div>
                            <div>
                                <input type="text" class="form-control form-control-sm condition-value" placeholder="Value">
                            </div>
                            <div>
                                <button type="button" class="btn btn-sm btn-outline-danger btn-remove-condition">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-xs text-blue-700 mt-2">
                            Show this field when condition is met
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</script>

<!-- Section Template -->
<script type="text/html" id="tpl-section-row">
    <div class="section-row border border-gray-200 rounded-lg bg-white" data-section-index="{{index}}">
        <div class="flex items-center justify-between p-3 bg-gray-50 border-b cursor-move section-drag-handle">
            <div class="flex items-center gap-2">
                <i data-lucide="grip-vertical" class="w-5 h-5 text-gray-400"></i>
                <span class="font-medium section-preview-title">New Section</span>
            </div>
            <div class="flex gap-2">
                <button type="button" class="text-gray-600 hover:text-gray-900 btn-toggle-section" title="Expand/Collapse">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                </button>
                <button type="button" class="text-red-600 hover:text-red-900 btn-remove-section" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>

        <div class="section-body p-4">
            <div class="mb-4">
                <label class="form-label text-xs">Section Title *</label>
                <input type="text" class="form-control form-control-sm section-title" placeholder="e.g., Personal Information" required>
            </div>

            <div class="mb-4">
                <label class="form-label text-xs">Section Description</label>
                <textarea class="form-control form-control-sm section-description" rows="2" placeholder="Optional description"></textarea>
            </div>

            <div class="flex gap-6">
                <label class="flex items-center">
                    <input type="checkbox" class="section-collapsible mr-2">
                    <span class="text-sm">Collapsible</span>
                </label>

                <label class="flex items-center">
                    <input type="checkbox" class="section-repeatable mr-2">
                    <span class="text-sm">Repeatable</span>
                </label>
            </div>
        </div>
    </div>
</script>

<style>
    .tab-btn {
        padding: 0.75rem 1rem;
        font-weight: 500;
        color: #6b7280;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }

    .tab-btn.active {
        color: #2563eb;
        border-bottom-color: #2563eb;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .field-body.collapsed {
        display: none;
    }

    #fields-container .field-row {
        transition: all 0.2s;
    }

    #fields-container .field-row.dragging {
        opacity: 0.5;
    }
</style>

<script>
    (function($) {
        'use strict';

        const API = {
            list: '/wp-json/api/v1/forms',
            create: '/wp-json/api/v1/forms',
            update: (id) => `/wp-json/api/v1/forms/${id}`,
            delete: (id) => `/wp-json/api/v1/forms/${id}`
        };
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';
        let fieldIndex = 0;
        let allFields = []; // For conditional logic
        let sectionIndex = 0;
        let allSections = []; // For field-to-section assignment

        function bindEvents() {
            $('#btn-create-form').on('click', openCreateModal);

            $('#forms-table-body').on('click', '[data-action="edit-form"]', function() {
                const formId = $(this).data('id');
                openEditModal(formId);
            });

            $('#forms-table-body').on('click', '[data-action="delete-form"]', function() {
                const formId = $(this).data('id');
                deleteForm(formId);
            });
        }

        function openCreateModal() {
            fieldIndex = 0;
            allFields = [];
            const content = getTemplateContent('tpl-form-builder');
            const footer = '<button type="button" class="btn btn-outline-secondary mr-2" data-tw-dismiss="modal">Cancel</button><button type="button" class="btn btn-primary" id="btn-save-form"><i data-lucide="save" class="w-4 h-4 mr-2"></i> Save Form</button>';

            window.showModal({
                title: 'Create New Form',
                content: content,
                footer: footer,
                size: 'xl',
                onShown: function() {
                    initializeFormBuilder();
                    lucide.createIcons();
                }
            });
        }

        function initializeFormBuilder() {
            // Tab switching
            $('.tab-btn').on('click', function() {
                const tab = $(this).data('tab');
                $('.tab-btn').removeClass('active');
                $('.tab-content').removeClass('active');
                $(this).addClass('active');
                $(`.tab-content[data-tab-content="${tab}"]`).addClass('active');
            });

            // Workflow toggle
            $('#form-workflow-enabled').on('change', function() {
                $('#workflow-settings').toggleClass('hidden', !this.checked);
            });

            // Scoring toggle
            $('#form-enable-scoring').on('change', function() {
                $('#scoring-settings').toggleClass('hidden', !this.checked);
            });

            // Add field button
            $('#btn-add-field').on('click', addField);

            // Add section button
            $('#btn-add-section').on('click', addSection);

            // Remove section (delegation)
            $('#sections-container').on('click', '.btn-remove-section', function() {
                $(this).closest('.section-row').remove();
                updateSectionsList();
            });

            // Toggle section body
            $('#sections-container').on('click', '.btn-toggle-section', function() {
                $(this).closest('.section-row').find('.section-body').toggleClass('collapsed');
                const icon = $(this).find('i');
                icon.attr('data-lucide', icon.attr('data-lucide') === 'chevron-down' ? 'chevron-up' : 'chevron-down');
                lucide.createIcons();
            });

            // Update preview on title change
            $('#sections-container').on('input', '.section-title', function() {
                const $row = $(this).closest('.section-row');
                const title = $(this).val() || 'New Section';
                $row.find('.section-preview-title').text(title);
                updateSectionsList();
            });

            // Remove field (delegation)
            $('#fields-container').on('click', '.btn-remove-field', function() {
                $(this).closest('.field-row').remove();
                updateFieldsList();
            });

            // Toggle field body
            $('#fields-container').on('click', '.btn-toggle-field', function() {
                $(this).closest('.field-row').find('.field-body').toggleClass('collapsed');
                const icon = $(this).find('i');
                icon.attr('data-lucide', icon.attr('data-lucide') === 'chevron-down' ? 'chevron-up' : 'chevron-down');
                lucide.createIcons();
            });

            // Field type change - show/hide options
            $('#fields-container').on('change', '.field-type', function() {
                const $row = $(this).closest('.field-row');
                const type = $(this).val();

                // Show/hide options for select/radio
                $row.find('.field-options-container').toggleClass('hidden', !['select', 'radio'].includes(type));

                // Show/hide number config
                $row.find('.field-number-config').toggleClass('hidden', !['number', 'range'].includes(type));

                updateFieldPreview($row);
            });

            // Update preview on label/type change
            $('#fields-container').on('input', '.field-label, .field-type', function() {
                const $row = $(this).closest('.field-row');
                updateFieldPreview($row);
            });

            // Conditional logic
            $('#fields-container').on('click', '.btn-add-condition', function() {
                const $row = $(this).closest('.field-row');
                $row.find('.field-conditionals').removeClass('hidden');
                updateConditionalFieldsList($row);
            });

            $('#fields-container').on('click', '.btn-remove-condition', function() {
                $(this).closest('.field-conditionals').addClass('hidden');
            });

            //Save button
            $('#btn-save-form').on('click', saveForm);

            // Make fields sortable (drag-drop)
            initDragDrop();

            // Add initial field
            addField();
        }

        function addField() {
            const template = getTemplateContent('tpl-field-row');
            const html = template.replace(/{{index}}/g, fieldIndex);
            $('#fields-container').append(html);
            fieldIndex++;
            updateFieldsList();
            lucide.createIcons();
        }

        function updateFieldPreview($row) {
            const label = $row.find('.field-label').val() || 'New Field';
            const type = $row.find('.field-type').val() || 'text';
            $row.find('.field-preview-label').text(label);
            $row.find('.field-preview-type').text(`(${type})`);
        }

        function updateFieldsList() {
            allFields = [];
            $('.field-row').each(function() {
                const key = $(this).find('.field-key').val();
                const label = $(this).find('.field-label').val();
                if (key) {
                    allFields.push({
                        key,
                        label
                    });
                }
            });
        }

        function addSection() {
            const template = getTemplateContent('tpl-section-row');
            const html = template.replace(/{{index}}/g, sectionIndex);
            $('#sections-container').append(html);
            sectionIndex++;
            updateSectionsList();
            lucide.createIcons();
        }

        function updateSectionsList() {
            allSections = [];
            $('.section-row').each(function() {
                const title = $(this).find('.section-title').val();
                const index = $(this).data('section-index');
                if (title) {
                    allSections.push({
                        index,
                        title
                    });
                }
            });

            // Update section dropdown in ALL field rows
            updateAllFieldSectionDropdowns();
        }

        function updateAllFieldSectionDropdowns() {
            $('.field-row').each(function() {
                const $select = $(this).find('.field-section');
                const currentValue = $select.val();

                $select.html('<option value="">No Section (Root Level)</option>');
                allSections.forEach(section => {
                    const selected = currentValue == section.index ? 'selected' : '';
                    $select.append(`<option value="${section.index}" ${selected}>${section.title}</option>`);
                });
            });
        }

        // Conditional Logic Functions
        function populateConditionalLogicTab() {
            const $container = $('#conditional-fields-list');
            $container.empty();

            $('.field-row').each(function() {
                const fieldLabel = $(this).find('.field-label').val();
                const fieldKey = $(this).find('.field-key').val();
                const conditionsJson = $(this).find('.field-conditional-rules').val();

                if (!fieldKey) return;

                const $fieldCard = $(`
                    <div class="border border-gray-200 rounded-lg p-4 bg-white">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="font-semibold">${fieldLabel || fieldKey}</h4>
                            <button type="button" class="btn btn-sm btn-secondary btn-add-condition" data-field="${fieldKey}">
                                <i data-lucide="plus" class="w-3 h-3 mr-1"></i>
                                Add Condition
                            </button>
                        </div>
                        <div class="conditions-list" data-field="${fieldKey}">
                            ${conditionsJson ? renderConditions(JSON.parse(conditionsJson), fieldKey) : '<p class="text-sm text-gray-500">No conditions set. This field is always visible.</p>'}
                        </div>
                    </div>
                `);

                $container.append($fieldCard);
            });

            lucide.createIcons();
        }

        function renderConditions(rules, fieldKey) {
            if (!rules || !rules.conditions || rules.conditions.length === 0) {
                return '<p class="text-sm text-gray-500">No conditions set. This field is always visible.</p>';
            }

            let html = '<div class="space-y-2">';
            rules.conditions.forEach((cond, idx) => {
                html += `
                    <div class="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                        <span class="text-gray-600">Show when</span>
                        <strong>${cond.field}</strong>
                        <span class="text-gray-600">${cond.operator}</span>
                        <strong class="text-blue-600">"${cond.value}"</strong>
                        <button type="button" class="ml-auto text-red-600 hover:text-red-800 btn-remove-condition" data-field="${fieldKey}" data-index="${idx}">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }

        function addConditionDialog(targetFieldKey) {
            const otherFields = allFields.filter(f => f.key !== targetFieldKey);

            if (otherFields.length === 0) {
                alert('No other fields available to create conditions.');
                return;
            }

            const fieldOptions = otherFields.map(f => `<option value="${f.key}">${f.label}</option>`).join('');

            const html = `
                <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center condition-modal">
                    <div class="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 class="text-lg font-bold mb-4">Add Condition</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Show this field when:</label>
                                <select class="form-control condition-field">${fieldOptions}</select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Is:</label>
                                <select class="form-control condition-operator">
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="not_empty">Is Not Empty</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Value:</label>
                                <input type="text" class="form-control condition-value" placeholder="Enter value">
                            </div>
                        </div>
                        <div class="flex gap-2 mt-6">
                            <button type="button" class="btn btn-primary btn-save-condition" data-target="${targetFieldKey}">Save</button>
                            <button type="button" class="btn btn-secondary btn-cancel-condition">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(html);
        }

        // Event: Switch to Conditions tab
        $(document).on('click', '[data-tab="conditions"]', function() {
            populateConditionalLogicTab();
        });

        // Event: Add Condition
        $('#conditional-fields-list').on('click', '.btn-add-condition', function() {
            const fieldKey = $(this).data('field');
            addConditionDialog(fieldKey);
        });

        // Save Condition
        $(document).on('click', '.btn-save-condition', function() {
            const targetField = $(this).data('target');
            const condField = $('.condition-field').val();
            const operator = $('.condition-operator').val();
            const value = $('.condition-value').val();

            const $fieldRow = $(`.field-row`).filter(function() {
                return $(this).find('.field-key').val() === targetField;
            });

            const $rulesInput = $fieldRow.find('.field-conditional-rules');
            let rules = $rulesInput.val() ? JSON.parse($rulesInput.val()) : {
                action: 'show',
                logic: 'AND',
                conditions: []
            };

            rules.conditions.push({
                field: condField,
                operator,
                value
            });
            $rulesInput.val(JSON.stringify(rules));

            $('.condition-modal').remove();
            populateConditionalLogicTab();
        });

        $(document).on('click', '.btn-cancel-condition', function() {
            $('.condition-modal').remove();
        });

        // Remove Condition
        $('#conditional-fields-list').on('click', '.btn-remove-condition', function() {
            const fieldKey = $(this).data('field');
            const index = $(this).data('index');

            const $fieldRow = $(`.field-row`).filter(function() {
                return $(this).find('.field-key').val() === fieldKey;
            });

            const $rulesInput = $fieldRow.find('.field-conditional-rules');
            let rules = JSON.parse($rulesInput.val());
            rules.conditions.splice(index, 1);
            $rulesInput.val(JSON.stringify(rules));

            populateConditionalLogicTab();
        });

        function updateConditionalFieldsList($currentRow) {
            const $select = $currentRow.find('.condition-field');
            const currentKey = $currentRow.find('.field-key').val();

            $select.html('<option value="">Select field...</option>');
            allFields.forEach(field => {
                if (field.key !== currentKey) { // Don't allow self-reference
                    $select.append(`<option value="${field.key}">${field.label}</option>`);
                }
            });
        }

        function initDragDrop() {
            // Simple drag-drop implementation
            let draggedElement = null;

            $('#fields-container').on('dragstart', '.drag-handle', function(e) {
                draggedElement = $(this).closest('.field-row');
                draggedElement.addClass('dragging');
            });

            $('#fields-container').on('dragend', '.drag-handle', function(e) {
                if (draggedElement) {
                    draggedElement.removeClass('dragging');
                    draggedElement = null;
                }
            });

            $('#fields-container').on('dragover', '.field-row', function(e) {
                e.preventDefault();
                if (draggedElement && draggedElement[0] !== this) {
                    const bounding = this.getBoundingClientRect();
                    const offset = e.originalEvent.clientY - bounding.top;
                    if (offset > bounding.height / 2) {
                        $(this).after(draggedElement);
                    } else {
                        $(this).before(draggedElement);
                    }
                }
            });

            // Make drag handles draggable
            $('#fields-container').on('mousedown', '.drag-handle', function() {
                $(this).closest('.field-row').attr('draggable', 'true');
            });
        }

        function saveForm() {
            const formId = $('#form-id').val();
            const isEdit = !!formId;

            // Collect basic data
            const formData = {
                name: $('#form-name').val(),
                description: $('#form-description').val(),
                module: $('#form-module').val(),
                is_active: $('#form-is-active').is(':checked'),
                workflow_enabled: $('#form-workflow-enabled').is(':checked')
            };

            // Workflow statuses
            if (formData.workflow_enabled) {
                const statuses = $('#workflow-statuses').val();
                if (statuses) {
                    formData.workflow_statuses = statuses.split(',').map(s => s.trim());
                }
            }

            // Scoring settings
            const enableScoring = $('#form-enable-scoring').is(':checked');
            if (enableScoring) {
                formData.scoring_settings = {
                    max_score: parseInt($('#scoring-max-score').val()) || 100,
                    pass_threshold: parseInt($('#scoring-pass-threshold').val()) || 70
                };
            }

            // Collect sections
            const sections = [];
            $('.section-row').each(function(index) {
                const sectionData = {
                    section_title: $(this).find('.section-title').val(),
                    section_description: $(this).find('.section-description').val() || null,
                    is_collapsible: $(this).find('.section-collapsible').is(':checked'),
                    is_repeatable: $(this).find('.section-repeatable').is(':checked'),
                    display_order: index
                };

                if (sectionData.section_title) {
                    sections.push(sectionData);
                }
            });

            formData.sections = sections;

            // Collect fields
            const fields = [];
            $('.field-row').each(function(index) {
                const $row = $(this);
                const fieldType = $row.find('.field-type').val();

                const fieldData = {
                    field_label: $row.find('.field-label').val(),
                    field_key: $row.find('.field-key').val(),
                    field_type: fieldType,
                    field_width: $row.find('.field-width').val() || 'full',
                    is_required: $row.find('.field-required').is(':checked'),
                    field_placeholder: $row.find('.field-placeholder').val() || null,
                    help_text: $row.find('.field-help-text').val() || null,
                    field_score: parseInt($row.find('.field-score').val()) || null,
                    section_id: $row.find('.field-section').val() || null,
                    conditional_rules: $row.find('.field-conditional-rules').val() || null,
                    display_order: index
                };

                // Options for select/radio
                if (['select', 'radio'].includes(fieldType)) {
                    const options = $row.find('.field-options').val();
                    if (options) {
                        fieldData.field_options = options.split(',').map(o => o.trim());
                    }
                }

                // Min/Max for number/range
                if (['number', 'range'].includes(fieldType)) {
                    fieldData.min_value = parseFloat($row.find('.field-min-value').val()) || null;
                    fieldData.max_value = parseFloat($row.find('.field-max-value').val()) || null;
                }

                // Conditional rules
                if (!$row.find('.field-conditionals').hasClass('hidden')) {
                    const condField = $row.find('.condition-field').val();
                    const condOp = $row.find('.condition-operator').val();
                    const condVal = $row.find('.condition-value').val();

                    if (condField && condVal) {
                        fieldData.conditional_rules = {
                            show_if: {
                                field_key: condField,
                                operator: condOp,
                                value: condVal
                            }
                        };
                    }
                }

                if (fieldData.field_label && fieldData.field_key) {
                    fields.push(fieldData);
                }
            });

            formData.fields = fields;

            // Validate
            if (!formData.name || fields.length === 0) {
                window.showToast('Please provide form name and at least one field', 'error');
                return;
            }

            // API call
            const url = isEdit ? API.update(formId) : API.create;
            const method = isEdit ? 'PUT' : 'POST';

            $.ajax({
                url: url,
                method: method,
                contentType: 'application/json',
                headers: {
                    'X-WP-Nonce': nonce
                },
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        window.showToast(isEdit ? 'Form updated successfully' : 'Form created successfully', 'success');
                        window.hideModal();
                        loadForms();
                    } else {
                        window.showToast(response.message || 'Error saving form', 'error');
                    }
                },
                error: function(xhr) {
                    window.showToast('Error: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                }
            });
        }

        function loadForms() {
            $('#loading-state').show();
            $('#forms-table-body').empty();

            $.ajax({
                url: API.list,
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce
                },
                success: function(response) {
                    $('#loading-state').hide();
                    if (response.success && response.data) {
                        renderForms(response.data);
                    }
                },
                error: function(xhr) {
                    $('#loading-state').html('<p class="text-red-500">Error loading forms</p>');
                }
            });
        }

        function renderForms(forms) {
            if (forms.length === 0) {
                $('#forms-table-body').html('<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No forms found. Create your first form!</td></tr>');
                return;
            }

            let html = '';
            forms.forEach(form => {
                const statusBadge = form.is_active ?
                    '<span class="badge badge-success">Active</span>' :
                    '<span class="badge badge-secondary">Inactive</span>';

                const typeBadge = form.workflow_enabled ?
                    '<span class="badge badge-info">Workflow</span>' :
                    '<span class="badge badge-secondary">Simple</span>';

                html += `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">${form.name}</div>
                    <div class="text-sm text-gray-500">${form.description || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge badge-primary">${form.module}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${typeBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-500">${form.field_count || 0} fields</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" data-action="edit-form" data-id="${form.id}">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" data-action="delete-form" data-id="${form.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
            });

            $('#forms-table-body').html(html);
            lucide.createIcons();
        }

        function deleteForm(formId) {
            window.showConfirmation({
                title: 'Delete Form',
                message: 'Are you sure you want to delete this form? This action cannot be undone.',
                confirmText: 'Delete',
                confirmClass: 'btn-danger',
                onConfirm: function() {
                    $.ajax({
                        url: API.delete(formId),
                        method: 'DELETE',
                        headers: {
                            'X-WP-Nonce': nonce
                        },
                        success: function(response) {
                            if (response.success) {
                                window.showToast('Form deleted successfully', 'success');
                                loadForms();
                            } else {
                                window.showToast(response.message || 'Error deleting form', 'error');
                            }
                        }
                    });
                }
            });
        }

        function getTemplateContent(templateId) {
            const template = document.getElementById(templateId);
            return template ? template.innerHTML : '';
        }

        function openEditModal(formId) {
            window.showToast('Edit functionality coming soon!', 'info');
        }

        // Initialize on page load
        $(document).ready(function() {
            bindEvents();
            loadForms();
        });

    })(jQuery);
</script>

<?php get_footer(); ?>