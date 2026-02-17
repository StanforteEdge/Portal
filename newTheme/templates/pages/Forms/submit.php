<?php
/**
 * Template Name: Forms: Submit Form
 * Description: User-facing form submission page
 */

// Get form ID from URL parameter
$formId = $_GET['form_id'] ?? null;

if (!$formId) {
    wp_redirect(home_url('/forms/available'));
    exit;
}

$pageTitle = 'Submit Form';
$breadcrumb = [
    ['name' => 'Forms', 'url' => home_url('/forms/available')],
    ['name' => 'Submit Form']
];
$activeMenu = 'forms';

get_header();
\App\Helpers\PageHelper::checkPageAccess('auth.authenticated');
?>

<div class="container mx-auto px-4 py-8">
    <div id="loading-state" class="text-center py-12">
        <div class="text-gray-500">Loading form...</div>
    </div>

    <div id="form-container" class="hidden max-w-3xl mx-auto">
        <!-- Form Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800" id="form-title"></h1>
            <p class="text-gray-600 mt-2" id="form-description"></p>
        </div>

        <!-- Form Fields -->
        <div class="bg-white rounded-lg shadow p-6">
            <form id="submission-form">
                <div id="fields-container" class="space-y-6">
                    <!-- Fields populated dynamically -->
                </div>

                <div class="flex gap-3 mt-8 pt-6 border-t">
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="send" class="w-4 h-4 mr-2"></i>
                        Submit Form
                    </button>
                    <a href="<?php echo home_url('/forms/available'); ?>" class="btn btn-outline-secondary">
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        const formId = '<?php echo esc_js($formId); ?>';
        const API = {
            getForm: `/wp-json/api/v1/forms/${formId}`,
            submit: `/wp-json/api/v1/forms/${formId}/submit`
        };
        const nonce = '<?php echo wp_create_nonce("wp_rest"); ?>';

        function loadForm() {
            $.ajax({
                url: API.getForm,
                method: 'GET',
                headers: { 'X-WP-Nonce': nonce },
                success: function (response) {
                    if (response.success && response.data) {
                        renderForm(response.data.form, response.data.fields);
                    } else {
                        showError('Form not found');
                    }
                },
                error: function () {
                    showError('Error loading form');
                }
            });
        }

        function renderForm(form, fields) {
            $('#loading-state').hide();
            $('#form-container').removeClass('hidden');

            // Set form info
            $('#form-title').text(form.name);
            $('#form-description').text(form.description || '');

            // Render fields
            let fieldsHtml = '';
            fields.forEach(field => {
                fieldsHtml += renderField(field);
            });

            $('#fields-container').html(fieldsHtml);
            lucide.createIcons();
        }

        function renderField(field) {
            const requiredLabel = field.is_required ? '<span class="text-red-500">*</span>' : '';
            const requiredAttr = field.is_required ? 'required' : '';

            let inputHtml = '';

            switch (field.field_type) {
                case 'text':
                    inputHtml = `<input type="text" class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>`;
                    break;
                case 'textarea':
                    inputHtml = `<textarea class="form-control" id="field-${field.field_key}" name="${field.field_key}" rows="4" ${requiredAttr}></textarea>`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>`;
                    break;
                case 'date':
                    inputHtml = `<input type="date" class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>`;
                    break;
                case 'datetime':
                    inputHtml = `<input type="datetime-local" class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>`;
                    break;
                case 'select':
                    const options = field.field_options || [];
                    let optionsHtml = '<option value="">Select...</option>';
                    options.forEach(opt => {
                        optionsHtml += `<option value="${opt}">${opt}</option>`;
                    });
                    inputHtml = `<select class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>${optionsHtml}</select>`;
                    break;
                case 'checkbox':
                    inputHtml = `<input type="checkbox" class="form-checkbox" id="field-${field.field_key}" name="${field.field_key}" value="1">`;
                    break;
                case 'file':
                    inputHtml = `<input type="file" class="form-control" id="field-${field.field_key}" name="${field.field_key}" ${requiredAttr}>`;
                    break;
            }

            return `
            <div class="form-field">
                <label class="form-label" for="field-${field.field_key}">
                    ${field.field_label} ${requiredLabel}
                </label>
                ${inputHtml}
            </div>
        `;
        }

        function submitForm(e) {
            e.preventDefault();

            // Collect form data
            const formData = {};
            $('#fields-container .form-field').each(function () {
                const input = $(this).find('input, select, textarea');
                const fieldName = input.attr('name');

                if (input.attr('type') === 'checkbox') {
                    formData[fieldName] = input.is(':checked');
                } else if (input.attr('type') === 'file') {
                    // Handle file upload separately
                    // TODO: Upload file first, then submit with URL
                    formData[fieldName] = '';
                } else {
                    formData[fieldName] = input.val();
                }
            });

            // Submit
            $.ajax({
                url: API.submit,
                method: 'POST',
                contentType: 'application/json',
                headers: { 'X-WP-Nonce': nonce },
                data: JSON.stringify(formData),
                success: function (response) {
                    if (response.success) {
                        window.showToast('Form submitted successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '<?php echo home_url('/forms/my-submissions'); ?>';
                        }, 1500);
                    } else {
                        window.showToast(response.message || 'Error submitting form', 'error');
                    }
                },
                error: function (xhr) {
                    window.showToast('Error: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                }
            });
        }

        function showError(message) {
            $('#loading-state').html(`<p class="text-red-500">${message}</p>`);
        }

        // Initialize
        $(document).ready(function () {
            $('#submission-form').on('submit', submitForm);
            loadForm();
        });

    })(jQuery);
</script>

<?php get_footer(); ?>