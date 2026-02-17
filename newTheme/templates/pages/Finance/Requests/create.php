<?php

/**
 * Template Name: Finance: Requests - New
 * Description: Specialized form for financial requests with Org/Team/Project lookups
 */

$pageTitle = 'New Finance Request';
$breadcrumb = [
    ['name' => 'Finance', 'url' => home_url('/finance')],
    ['name' => 'Requests', 'url' => home_url('/finance/requests')],
    ['name' => 'New Request']
];
$activeMenu = 'finance-requests-new';

get_header();
\App\Helpers\PageHelper::checkPageAccess('finance.create_requests');
?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-5xl mx-auto">

        <!-- Header -->
        <div class="mb-8 flex flex-row justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">New Finance Request</h1>
                <p class="text-gray-500 mt-1">Submit a financial request for approval</p>
            </div>
            <a href="/finance/requests" class="btn btn-outline-primary">← Back to List</a>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8 relative">
            <div id="form-alert" class="hidden p-4 rounded-md mb-6"></div>

            <form id="financeRequestForm" class="space-y-8">
                <!-- 1. Structural Selection (Enterprise Relationships) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div>
                        <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Organization *</label>
                        <select id="organization_id" name="organization_id" class="form-select w-full" required>
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Team / Department *</label>
                        <select id="team_id" name="team_id" class="form-select w-full" required>
                            <option value="">Select Team</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Project *</label>
                        <select id="project_id" name="project_id" class="form-select w-full" required>
                            <option value="">Select Project</option>
                        </select>
                    </div>
                </div>

                <!-- 2. Request Type & Core Fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Request Type *</label>
                        <select id="request_type_id" name="request_type_id" class="form-select w-full" required>
                            <option value="">Select Type...</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Due Date *</label>
                        <input type="date" name="due_date" class="form-input w-full" required>
                    </div>
                </div>

                <div>
                    <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Purpose / Description *</label>
                    <textarea name="purpose" class="form-input w-full" rows="2" placeholder="Describe the reason for this request..." required></textarea>
                </div>

                <!-- 3. Dynamic Fields Container (From Form Builder) -->
                <div id="dynamic-fields-container" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-l-4 border-primary-500 bg-primary-50 hidden">
                    <!-- Populated via JS based on Request Type -->
                </div>

                <!-- 4. Line Items (Standard for Finance) -->
                <div class="border-t border-slate-200 pt-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-slate-800">Request Items / Breakdown</h2>
                        <button type="button" id="add-item-btn" class="btn btn-sm btn-outline-primary">
                            <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Item
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100">
                                    <th class="p-3 text-xs font-bold uppercase text-slate-600 border">Description</th>
                                    <th class="p-3 text-xs font-bold uppercase text-slate-600 border w-24 text-center">Qty</th>
                                    <th class="p-3 text-xs font-bold uppercase text-slate-600 border w-40 text-right">Unit Price (₦)</th>
                                    <th class="p-3 text-xs font-bold uppercase text-slate-600 border w-40 text-right">Total (₦)</th>
                                    <th class="p-3 text-xs font-bold uppercase text-slate-600 border w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody id="items-body">
                                <!-- Rows added via JS -->
                            </tbody>
                            <tfoot>
                                <tr class="bg-slate-50 font-bold">
                                    <td colspan="3" class="p-3 text-right border uppercase text-slate-600">Grand Total</td>
                                    <td id="grand-total-display" class="p-3 text-right border text-xl text-primary-700 font-black">₦0.00</td>
                                    <td class="border"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- 5. Attachments -->
                <div class="border-t border-slate-200 pt-6">
                    <label class="form-label block text-sm font-semibold text-slate-700 mb-1">Supporting Documents (Optional)</label>
                    <input type="file" name="attachments[]" class="form-control w-full" multiple>
                    <p class="text-xs text-slate-500 mt-1">Upload receipts, invoices, or quotes (PDF, PNG, JPG)</p>
                </div>

                <!-- 6. Footer Actions -->
                <div class="border-t border-slate-200 pt-8 flex justify-end gap-4">
                    <button type="button" onclick="history.back()" class="btn btn-secondary px-8">Cancel</button>
                    <button type="submit" id="submitBtn" class="btn btn-primary px-10 py-3 text-lg">
                        <span id="btnText">Submit Request</span>
                        <div id="btnSpinner" class="hidden ml-2 spinner-border spinner-border-sm"></div>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('financeRequestForm');
        const orgSelect = document.getElementById('organization_id');
        const teamSelect = document.getElementById('team_id');
        const projectSelect = document.getElementById('project_id');
        const typeSelect = document.getElementById('request_type_id');
        const itemsBody = document.getElementById('items-body');
        const dynamicContainer = document.getElementById('dynamic-fields-container');

        let lookupData = null;
        let requestTypes = [];

        // --- 1. Initialization & Data Loading ---
        async function init() {
            try {
                const token = localStorage.getItem('jwt_token');
                const headers = {
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Fetch everything in one call
                const [lookupRes, typesRes] = await Promise.all([
                    fetch('/wp-json/api/v1/finance/lookup-data', {
                        headers
                    }).then(r => r.json()),
                    fetch('/wp-json/api/v1/finance/requests/types', {
                        headers
                    }).then(r => r.json())
                ]);

                if (lookupRes.success) {
                    lookupData = lookupRes.data;
                    populateInitialDropdowns();
                }

                if (typesRes.success) {
                    requestTypes = typesRes.data;
                    populateTypes();
                }

                // Add first item row
                addItemRow();
                lucide.createIcons();

            } catch (e) {
                console.error('Initialization failed', e);
                showAlert('error', 'Failed to load form data. Please refresh.');
            }
        }

        function populateInitialDropdowns() {
            // Populate Organizations
            lookupData.profile.organizations.forEach(org => {
                const opt = new Option(org.name, org.id);
                orgSelect.add(opt);
            });

            // Auto-select if only one
            if (lookupData.profile.organizations.length === 1) {
                orgSelect.value = lookupData.profile.organizations[0].id;
                handleOrgChange();
            }

            // Populate Projects (Global)
            lookupData.global.projects.forEach(p => {
                projectSelect.add(new Option(p.name, p.id));
            });
        }

        function populateTypes() {
            requestTypes.forEach(t => {
                typeSelect.add(new Option(t.name, t.id));
            });
        }

        // --- 2. Event Handlers (Cascading Logic) ---
        orgSelect.addEventListener('change', handleOrgChange);

        function handleOrgChange() {
            const orgId = orgSelect.value;
            teamSelect.innerHTML = '<option value="">Select Team</option>';

            if (!orgId) return;

            // Filter global teams by org_id
            const filteredTeams = lookupData.global.teams.filter(t => t.organization_id == orgId);
            filteredTeams.forEach(t => {
                teamSelect.add(new Option(t.name, t.id));
            });

            // Auto-select if user belongs to exactly one team in this org
            const userTeamsInOrg = lookupData.profile.teams.filter(t => t.organization_id == orgId);
            if (userTeamsInOrg.length === 1) {
                teamSelect.value = userTeamsInOrg[0].id;
            }
        }

        typeSelect.addEventListener('change', function() {
            const type = requestTypes.find(t => t.id == this.value);
            dynamicContainer.innerHTML = '';
            dynamicContainer.classList.add('hidden');

            if (type && type.form_schema) {
                const schema = typeof type.form_schema === 'string' ? JSON.parse(type.form_schema) : type.form_schema;
                if (Array.isArray(schema) && schema.length > 0) {
                    dynamicContainer.classList.remove('hidden');
                    schema.forEach(field => {
                        const div = document.createElement('div');
                        div.innerHTML = `
                        <label class="block text-sm font-medium text-slate-700 mb-1">${field.label}${field.required ? ' *' : ''}</label>
                        ${field.type === 'textarea' ? 
                            `<textarea name="custom_data[${field.name}]" class="form-input w-full" rows="3" ${field.required ? 'required' : ''}></textarea>` :
                            `<input type="${field.type}" name="custom_data[${field.name}]" class="form-input w-full" ${field.required ? 'required' : ''}>`
                        }
                    `;
                        dynamicContainer.appendChild(div);
                    });
                }
            }
        });

        // --- 3. Line Items Logic ---
        document.getElementById('add-item-btn').addEventListener('click', addItemRow);

        function addItemRow() {
            const row = document.createElement('tr');
            const index = itemsBody.rows.length;
            row.innerHTML = `
            <td class="p-2 border"><input type="text" name="items[${index}][description]" class="form-input w-full text-sm" placeholder="Item description" required></td>
            <td class="p-2 border"><input type="number" name="items[${index}][quantity]" class="form-input w-full text-sm text-center qty-input" value="1" min="1" required></td>
            <td class="p-2 border"><input type="number" name="items[${index}][amount]" class="form-input w-full text-sm text-right price-input" placeholder="0.00" min="0" step="0.01" required></td>
            <td class="p-3 border text-right font-medium row-total">₦0.00</td>
            <td class="p-2 border text-center">
                <button type="button" class="text-red-500 hover:text-red-700 remove-item-btn"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
            itemsBody.appendChild(row);
            lucide.createIcons();
            attachRowEvents(row);
        }

        function attachRowEvents(row) {
            const inputs = row.querySelectorAll('.qty-input, .price-input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                    const price = parseFloat(row.querySelector('.price-input').value) || 0;
                    const total = qty * price;
                    row.querySelector('.row-total').textContent = formatCurrency(total);
                    calculateGrandTotal();
                });
            });

            row.querySelector('.remove-item-btn').addEventListener('click', () => {
                if (itemsBody.rows.length > 1) {
                    row.remove();
                    calculateGrandTotal();
                }
            });
        }

        function calculateGrandTotal() {
            let grandTotal = 0;
            itemsBody.querySelectorAll('tr').forEach(row => {
                const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                const price = parseFloat(row.querySelector('.price-input').value) || 0;
                grandTotal += (qty * price);
            });
            document.getElementById('grand-total-display').textContent = formatCurrency(grandTotal);
        }

        function formatCurrency(val) {
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN'
            }).format(val);
        }

        // --- 4. Submission ---
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(true);

            const formData = new FormData(form);
            const payload = {
                request_type_id: formData.get('request_type_id'),
                organization_id: formData.get('organization_id'),
                team_id: formData.get('team_id'),
                project_id: formData.get('project_id'),
                due_date: formData.get('due_date'),
                purpose: formData.get('purpose'),
                data: {}, // For custom fields
                items: []
            };

            // Capture Custom Fields
            formData.forEach((value, key) => {
                if (key.startsWith('custom_data[')) {
                    const fieldName = key.match(/\[(.*?)\]/)[1];
                    payload.data[fieldName] = value;
                }
            });

            // Capture Line Items
            itemsBody.querySelectorAll('tr').forEach(row => {
                payload.items.push({
                    description: row.querySelector('input[name*="[description]"]').value,
                    quantity: parseInt(row.querySelector('.qty-input').value),
                    amount: parseFloat(row.querySelector('.price-input').value)
                });
            });

            try {
                const token = localStorage.getItem('jwt_token');
                const res = await fetch('/wp-json/api/v1/finance/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();
                if (result.success) {
                    window.location.href = `/finance/requests/view?id=${result.request.id}&success=1`;
                } else {
                    showAlert('error', result.message || 'Submission failed');
                }
            } catch (err) {
                showAlert('error', 'Network error. Please check your connection.');
            } finally {
                setLoading(false);
            }
        });

        function setLoading(val) {
            document.getElementById('submitBtn').disabled = val;
            document.getElementById('btnSpinner').classList.toggle('hidden', !val);
            document.getElementById('btnText').textContent = val ? 'Submitting...' : 'Submit Request';
        }

        function showAlert(type, msg) {
            const alert = document.getElementById('form-alert');
            alert.className = `p-4 rounded-md mb-6 ${type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`;
            alert.textContent = msg;
            alert.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        init();
    });
</script>

<?php get_footer(); ?>
