(function (window, $) {
    'use strict';

    if (!$ || !window.ApiClient) {
        console.error('Required dependencies for admin notifications page are missing.');
        return;
    }

    const ENDPOINTS = {
        templates: '/wp-json/api/v1/admin/notifications/templates',
        stats: '/wp-json/api/v1/admin/notifications/stats',
        overview: '/wp-json/api/v1/admin/notifications/overview',
        recent: '/wp-json/api/v1/admin/notifications/recent',
        channels: '/wp-json/api/v1/admin/notifications/channels',
        preferences: '/wp-json/api/v1/admin/notifications/preferences',
        send: '/wp-json/api/v1/admin/notifications/send',
        bulk: '/wp-json/api/v1/admin/notifications/templates/bulk',
        templateById: function (id) {
            return '/wp-json/api/v1/admin/notifications/templates/' + id;
        }
    };

    const state = {
        filters: {
            search: '',
            channel: '',
            status: ''
        },
        pagination: {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0
        },
        templates: [],
        stats: {},
        overview: [],
        recent: [],
        channels: {},
        preferences: null,
        selection: new Set(),
        isLoading: false,
        isSavingChannels: false,
        channelsDirty: false
    };

    const $table = $('#notifications-data-table');
    const $tableBody = $table.find('[data-table-body]');
    const $pagination = $('#notifications-pagination');
    const $paginationInfo = $('#notifications-pagination-info');
    const $emptyState = $('#notifications-empty-state');
    const $filterBar = $('#notifications-filter-bar');
    const $actionToolbar = $('#notifications-action-toolbar');
    const $bulkActivate = $('#bulk-activate');
    const $bulkDeactivate = $('#bulk-deactivate');
    const $bulkDuplicate = $('#bulk-duplicate');
    const $createTemplateBtn = $('#create-template-btn, #empty-create-template');
    const $sendNotificationBtn = $('#send-notification-btn');

    const $metrics = {
        total: $('#total-notifications [data-metrics-value]'),
        deliveryRate: $('#delivery-rate [data-metrics-value]'),
        engagement: $('#engagement-rate [data-metrics-value]'),
        alerts: $('#active-alerts [data-metrics-value]')
    };

    const $deliveryChart = $('#delivery-chart');
    const $recentContainer = $('#recent-notifications');
    const $preferencesSummary = $('#preferences-summary');
    const $channelForm = $('#channel-settings-form');

    const templates = {
        row: document.getElementById('notification-row-template'),
        recent: document.getElementById('recent-notification-item-template')
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
            const skeletonRow = $table.find('[data-skeleton-row]').first().prop('outerHTML') || '';
            $tableBody.html(skeletonRow.repeat(5));
            $emptyState.addClass('hidden');
        }
    }

    function refreshIcons() {
        if (window.refreshIcons) {
            window.refreshIcons();
        }
    }

    function formatPercent(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '—';
        }
        return parseFloat(value).toFixed(1) + '%';
    }

    function formatDateTime(value) {
        if (!value) {
            return '—';
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    }

    function handleError(error) {
        console.error('Notifications admin error', error);
        if (window.showNotification && window.showNotification.error) {
            const message = (error && error.message) || 'Something went wrong while processing the request.';
            window.showNotification.error(message);
        }
    }

    function fetchAll() {
        setLoading(true);
        const promises = [
            fetchTemplates(),
            fetchStats(),
            fetchOverview(),
            fetchRecent(),
            fetchChannels(),
            fetchPreferences()
        ];

        return Promise.all(promises)
            .catch(handleError)
            .finally(function () {
                state.isLoading = false;
            });
    }

    function fetchTemplates() {
        const params = {
            search: state.filters.search,
            channel: state.filters.channel,
            status: state.filters.status,
            page: state.pagination.page,
            per_page: state.pagination.perPage
        };

        return window.ApiClient.get(ENDPOINTS.templates, params).then(function (response) {
            const data = response.data || response || {};
            const templatesList = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
            const meta = response.meta || data.meta || {};

            state.templates = templatesList;
            state.pagination.total = meta.total || templatesList.length;
            state.pagination.totalPages = meta.total_pages || Math.max(1, Math.ceil(state.pagination.total / state.pagination.perPage));
            state.selection.clear();

            renderTable();
            renderPagination();
            updateToolbar();
            updateEmptyState();
        });
    }

    function fetchStats() {
        return window.ApiClient.get(ENDPOINTS.stats).then(function (response) {
            const stats = response.data || response || {};
            state.stats = stats;
            updateMetrics();
        }).catch(function () {
            state.stats = {};
            updateMetrics();
        });
    }

    function fetchOverview() {
        return window.ApiClient.get(ENDPOINTS.overview).then(function (response) {
            const overview = response.data || response || [];
            state.overview = Array.isArray(overview) ? overview : [];
            renderOverview();
        }).catch(function () {
            state.overview = [];
            renderOverview();
        });
    }

    function fetchRecent() {
        return window.ApiClient.get(ENDPOINTS.recent).then(function (response) {
            const recent = response.data || response || [];
            state.recent = Array.isArray(recent) ? recent : [];
            renderRecent();
        }).catch(function () {
            state.recent = [];
            renderRecent();
        });
    }

    function fetchChannels() {
        return window.ApiClient.get(ENDPOINTS.channels).then(function (response) {
            const channels = response.data || response || {};
            state.channels = channels;
            populateChannelForm();
        }).catch(function () {
            state.channels = {};
            populateChannelForm();
        });
    }

    function fetchPreferences() {
        return window.ApiClient.get(ENDPOINTS.preferences).then(function (response) {
            const preferences = response.data || response || {};
            state.preferences = preferences;
            renderPreferences();
        }).catch(function () {
            state.preferences = null;
            renderPreferences();
        });
    }

    function updateMetrics() {
        const stats = state.stats || {};
        $metrics.total.text(stats.total_sent != null ? stats.total_sent.toLocaleString() : '—');
        $metrics.deliveryRate.text(formatPercent(stats.delivery_rate));
        $metrics.engagement.text(formatPercent(stats.engagement_rate));
        $metrics.alerts.text(stats.active_alerts != null ? stats.active_alerts : '—');
    }

    function renderOverview() {
        const data = state.overview;
        if (!data.length) {
            $deliveryChart.find('[data-overview-empty]').removeClass('hidden');
            $deliveryChart.find('[data-chart-container]').remove();
            return;
        }

        $deliveryChart.find('[data-overview-empty]').addClass('hidden');

        const labels = [];
        const deliverySeries = [];
        const engagementSeries = [];

        data.forEach(function (item) {
            labels.push(item.label || item.date || '');
            deliverySeries.push(item.delivery_rate != null ? Number(item.delivery_rate) : 0);
            engagementSeries.push(item.engagement_rate != null ? Number(item.engagement_rate) : 0);
        });

        const chartHtml = '<div data-chart-container>' +
            '<canvas id="notifications-overview-chart" height="220"></canvas>' +
            '</div>';

        $deliveryChart.find('[data-chart-container]').remove();
        $deliveryChart.append(chartHtml);

        if (window.renderLineChart) {
            window.renderLineChart('notifications-overview-chart', {
                labels: labels,
                datasets: [
                    {
                        label: 'Delivery Rate',
                        data: deliverySeries,
                        borderColor: '#1E9FFF'
                    },
                    {
                        label: 'Engagement Rate',
                        data: engagementSeries,
                        borderColor: '#A855F7'
                    }
                ]
            });
        }
    }

    function renderRecent() {
        const container = $recentContainer;
        const items = state.recent;
        container.empty();

        if (!items.length) {
            const empty = $('<div class="flex items-center justify-center py-10 text-slate-500" data-recent-empty></div>')
                .text(window.stanforteTranslations?.notifications?.recentEmpty || 'Recent notifications will load after fetching data.');
            container.append(empty);
            return;
        }

        items.slice(0, 6).forEach(function (item) {
            if (!templates.recent || !templates.recent.content) {
                return;
            }
            const row = templates.recent.content.cloneNode(true, true);
            const titleEl = row.querySelector('[data-recent-title]');
            const metaEl = row.querySelector('[data-recent-meta]');

            if (titleEl) {
                titleEl.textContent = item.title || item.template_name || 'Notification';
            }
            if (metaEl) {
                const channel = (item.channel || '').toUpperCase();
                const status = (item.status || 'pending').replace('_', ' ');
                metaEl.textContent = channel + ' • ' + status + ' • ' + formatDateTime(item.sent_at || item.updated_at);
            }
            container.append(row);
        });

        refreshIcons();
    }

    function populateChannelForm() {
        const data = state.channels || {};
        Object.keys(data).forEach(function (key) {
            const $field = $channelForm.find('[name="' + key + '"]');
            if (!$field.length) {
                return;
            }
            const value = data[key];
            if ($field.attr('type') === 'checkbox') {
                $field.prop('checked', Boolean(value));
            } else {
                $field.val(value);
            }
        });
        state.channelsDirty = false;
    }

    function renderPreferences() {
        const container = $preferencesSummary;
        container.empty();

        if (!state.preferences) {
            const empty = $('<div class="flex items-center justify-center py-10 text-slate-500" data-preferences-empty></div>')
                .text(window.stanforteTranslations?.notifications?.preferencesEmpty || 'Preference data will load after fetching settings.');
            container.append(empty);
            return;
        }

        const summary = state.preferences.summary || [];
        if (!summary.length) {
            const empty = $('<div class="flex items-center justify-center py-10 text-slate-500" data-preferences-empty></div>')
                .text('No preferences found for the selected filters.');
            container.append(empty);
            return;
        }

        const list = $('<div class="grid grid-cols-12 gap-4"></div>');
        summary.forEach(function (item) {
            const card = $(
                '<div class="col-span-12 md:col-span-4">' +
                '    <div class="box p-5 border border-slate-200">' +
                '        <h4 class="text-sm font-medium mb-1"></h4>' +
                '        <p class="text-2xl font-semibold"></p>' +
                '        <p class="text-xs text-slate-500 mt-2"></p>' +
                '    </div>' +
                '</div>'
            );
            card.find('h4').text(item.label || 'Preference');
            card.find('p').eq(0).text(item.value != null ? item.value : '—');
            card.find('p').eq(1).text(item.description || '');
            list.append(card);
        });
        container.append(list);
    }

    function renderTable() {
        if (!state.templates.length) {
            $tableBody.empty();
            return;
        }

        const rows = state.templates.map(renderRow);
        $tableBody.html(rows.join(''));
        refreshIcons();
    }

    function renderRow(item) {
        if (!templates.row || !templates.row.content) {
            return '';
        }

        const clone = templates.row.content.cloneNode(true, true);
        const row = clone.querySelector('tr[data-notification-row]');
        const checkbox = row.querySelector('[data-notification-select]');
        const nameEl = row.querySelector('[data-notification-name]');
        const descEl = row.querySelector('[data-notification-description]');
        const channelEl = row.querySelector('[data-notification-channel]');
        const statusEl = row.querySelector('[data-notification-status]');
        const updatedEl = row.querySelector('[data-notification-updated]');
        const editBtn = row.querySelector('[data-notification-edit]');
        const archiveBtn = row.querySelector('[data-notification-archive]');

        row.dataset.notificationId = item.id;

        if (checkbox) {
            checkbox.dataset.notificationId = item.id;
            checkbox.checked = state.selection.has(item.id);
        }
        if (nameEl) {
            nameEl.textContent = item.name || item.template_name || 'Untitled Template';
        }
        if (descEl) {
            descEl.textContent = item.description || item.event || '';
        }
        if (channelEl) {
            channelEl.textContent = (item.channel || '—').toUpperCase();
        }
        if (statusEl) {
            const status = (item.status || 'draft').toLowerCase();
            statusEl.innerHTML = '<span class="badge ' + badgeClass(status) + '">' + status.replace('_', ' ') + '</span>';
        }
        if (updatedEl) {
            updatedEl.textContent = formatDateTime(item.updated_at || item.created_at);
        }
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                openTemplateModal(item);
            });
        }
        if (archiveBtn) {
            archiveBtn.addEventListener('click', function () {
                confirmArchive(item);
            });
        }

        return row.outerHTML;
    }

    function badgeClass(status) {
        switch (status) {
            case 'active':
                return 'bg-success text-white';
            case 'archived':
                return 'bg-slate-300 text-slate-700';
            case 'draft':
            default:
                return 'bg-warning text-slate-800';
        }
    }

    function renderPagination() {
        const current = state.pagination.page;
        const totalPages = state.pagination.totalPages;

        const infoText = state.pagination.total
            ? 'Showing ' + ((current - 1) * state.pagination.perPage + 1) + ' - ' +
            Math.min(current * state.pagination.perPage, state.pagination.total) +
            ' of ' + state.pagination.total
            : 'No records to display';
        $paginationInfo.text(infoText);

        if (totalPages <= 1) {
            $pagination.empty();
            return;
        }

        const pages = buildPaginationRange(current, totalPages);
        const fragment = $(document.createDocumentFragment());
        pages.forEach(function (page) {
            const btn = $('<button type="button" class="btn btn-outline-secondary btn-sm"></button>');
            btn.text(page.label);
            if (page.disabled) {
                btn.prop('disabled', true);
            }
            if (page.active) {
                btn.addClass('btn-primary text-white');
            }
            btn.on('click', function () {
                if (page.disabled || page.active) {
                    return;
                }
                state.pagination.page = page.value;
                fetchTemplates().catch(handleError);
            });
            fragment.append(btn);
        });
        $pagination.empty().append(fragment);
    }

    function buildPaginationRange(current, total) {
        const pages = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i += 1) {
                pages.push({ value: i, label: String(i), active: i === current });
            }
            return pages;
        }

        pages.push({ value: current - 1, label: 'Prev', disabled: current === 1 });

        const start = Math.max(1, current - 1);
        const end = Math.min(total, current + 1);

        if (start > 1) {
            pages.push({ value: 1, label: '1', active: current === 1 });
            if (start > 2) {
                pages.push({ value: null, label: '…', disabled: true });
            }
        }

        for (let i = start; i <= end; i += 1) {
            pages.push({ value: i, label: String(i), active: i === current });
        }

        if (end < total) {
            if (end < total - 1) {
                pages.push({ value: null, label: '…', disabled: true });
            }
            pages.push({ value: total, label: String(total), active: current === total });
        }

        pages.push({ value: current + 1, label: 'Next', disabled: current === total });
        return pages;
    }

    function updateToolbar() {
        const hasSelection = state.selection.size > 0;
        $bulkActivate.prop('disabled', !hasSelection);
        $bulkDeactivate.prop('disabled', !hasSelection);
        $bulkDuplicate.prop('disabled', !hasSelection);
    }

    function updateEmptyState() {
        if (state.templates.length) {
            $emptyState.addClass('hidden');
            $table.removeClass('hidden');
        } else {
            $emptyState.removeClass('hidden');
            $table.addClass('hidden');
        }
    }

    function openTemplateModal(template) {
        const $modal = $('#notification-template-modal');
        const $content = $('#notification-template-content');
        $content.empty();

        const form = $('<form class="space-y-5"></form>');
        form.append(buildInputField('Template Name', 'name', template?.name || template?.template_name || '', true));
        form.append(buildTextareaField('Description', 'description', template?.description || '', 'Describe the event or use case for this notification.'));
        form.append(buildSelectField('Channel', 'channel', ['email', 'sms', 'in_app'], template?.channel || 'email'));
        form.append(buildTextareaField('Subject / Title', 'subject', template?.subject || '', 'Used for email or push notifications.'));
        form.append(buildTextareaField('Content', 'content', template?.content || '', 'Supports merge tags like {{user.name}}.'));        
        form.append(buildCheckboxField('Localized variants', 'is_localized', Boolean(template?.is_localized), 'Enable multi-language templates.'));

        $content.append(form);
        $modal.data('template-id', template?.id || null);
        window.Tailwind?.Modal?.getInstance($modal[0])?.show();
    }

    function buildInputField(label, name, value, required) {
        const $wrapper = $('<div></div>');
        const $label = $('<label class="form-label"></label>').text(label);
        const $input = $('<input type="text" class="form-control" />').attr('name', name).val(value || '');
        if (required) {
            $input.prop('required', true);
        }
        $wrapper.append($label, $input);
        return $wrapper;
    }

    function buildTextareaField(label, name, value, helper) {
        const $wrapper = $('<div></div>');
        const $label = $('<label class="form-label"></label>').text(label);
        const $textarea = $('<textarea class="form-control" rows="4"></textarea>').attr('name', name).val(value || '');
        $wrapper.append($label, $textarea);
        if (helper) {
            $wrapper.append($('<p class="text-xs text-slate-500 mt-1"></p>').text(helper));
        }
        return $wrapper;
    }

    function buildSelectField(label, name, options, selected) {
        const $wrapper = $('<div></div>');
        const $label = $('<label class="form-label"></label>').text(label);
        const $select = $('<select class="form-select"></select>').attr('name', name);
        options.forEach(function (option) {
            const $opt = $('<option></option>').attr('value', option).text(option.toUpperCase());
            if (option === selected) {
                $opt.prop('selected', true);
            }
            $select.append($opt);
        });
        $wrapper.append($label, $select);
        return $wrapper;
    }

    function buildCheckboxField(label, name, checked, helper) {
        const $wrapper = $('<div class="form-check form-switch"></div>');
        const $input = $('<input type="checkbox" class="form-check-input" />').attr('name', name).prop('checked', Boolean(checked));
        const $label = $('<label class="form-check-label"></label>').attr('for', name).text(label);
        $wrapper.append($input, $label);
        if (helper) {
            $wrapper.append($('<p class="text-xs text-slate-500 mt-1"></p>').text(helper));
        }
        return $wrapper;
    }

    function collectTemplateFormData() {
        const $form = $('#notification-template-content form');
        const data = {};
        $form.serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        $form.find('input[type="checkbox"]').each(function () {
            const $checkbox = $(this);
            data[$checkbox.attr('name')] = $checkbox.is(':checked');
        });
        return data;
    }

    function handleTemplateSave() {
        const $modal = $('#notification-template-modal');
        const templateId = $modal.data('template-id');
        const payload = collectTemplateFormData();
        const request = templateId
            ? window.ApiClient.put(ENDPOINTS.templateById(templateId), payload)
            : window.ApiClient.post(ENDPOINTS.templates, payload);

        request
            .then(function (response) {
                if (window.showNotification?.success) {
                    window.showNotification.success(response.message || 'Template saved successfully.');
                }
                window.Tailwind?.Modal?.getInstance($modal[0])?.hide();
                return fetchTemplates();
            })
            .catch(handleError);
    }

    function confirmArchive(template) {
        const $modal = $('#notification-bulk-modal');
        const $summary = $('#notification-bulk-summary');
        $summary.html('<p>' + (template.name || template.template_name || 'Template') + '</p>');
        $modal.data('action', 'archive-single');
        $modal.data('template-id', template.id);
        window.Tailwind?.Modal?.getInstance($modal[0])?.show();
    }

    function handleBulkAction(action) {
        if (state.selection.size === 0) {
            return;
        }
        const $modal = $('#notification-bulk-modal');
        const $summary = $('#notification-bulk-summary');
        const labels = Array.from(state.selection).map(function (id) {
            const item = state.templates.find(function (template) { return template.id === id; });
            return '<li>' + (item?.name || item?.template_name || ('Template #' + id)) + '</li>';
        }).join('');
        $summary.html('<ul class="list-disc pl-5 space-y-1">' + labels + '</ul>');
        $modal.data('action', action);
        $modal.removeData('template-id');
        window.Tailwind?.Modal?.getInstance($modal[0])?.show();
    }

    function handleBulkConfirm() {
        const $modal = $('#notification-bulk-modal');
        const action = $modal.data('action');
        if (!action) {
            return;
        }
        let payload;
        if (action === 'archive-single') {
            const templateId = $modal.data('template-id');
            payload = { ids: [templateId], action: 'archive' };
        } else {
            payload = {
                ids: Array.from(state.selection),
                action: action
            };
        }

        window.ApiClient.post(ENDPOINTS.bulk, payload)
            .then(function (response) {
                if (window.showNotification?.success) {
                    window.showNotification.success(response.message || 'Bulk action completed successfully.');
                }
                state.selection.clear();
                updateToolbar();
                window.Tailwind?.Modal?.getInstance($modal[0])?.hide();
                return fetchTemplates();
            })
            .catch(handleError);
    }

    function handleSelectionChange(id, isSelected) {
        if (isSelected) {
            state.selection.add(id);
        } else {
            state.selection.delete(id);
        }
        updateToolbar();
    }

    function handleSelectAllChange(isSelected) {
        if (isSelected) {
            state.templates.forEach(function (item) {
                state.selection.add(item.id);
            });
        } else {
            state.selection.clear();
        }
        $tableBody.find('[data-notification-select]').prop('checked', isSelected);
        updateToolbar();
    }

    function openSendModal() {
        const $modal = $('#notification-send-modal');
        const $content = $('#notification-send-content');
        $content.html(
            '<form class="space-y-5">' +
                '    <div>' +
                '        <label class="form-label">Select Template</label>' +
                '        <select class="form-select" name="template_id" required></select>' +
                '    </div>' +
                '    <div>' +
                '        <label class="form-label">Target Segment</label>' +
                '        <input type="text" class="form-control" name="segment" placeholder="All users">' +
                '    </div>' +
                '    <div>' +
                '        <label class="form-label">Scheduled Time</label>' +
                '        <input type="datetime-local" class="form-control" name="scheduled_at">' +
                '    </div>' +
                '    <div class="form-check form-switch">' +
                '        <input type="checkbox" class="form-check-input" id="send_test" name="send_test">' +
                '        <label class="form-check-label" for="send_test">Send as test notification</label>' +
                '    </div>' +
            '</form>'
        );

        const $select = $content.find('select[name="template_id"]');
        state.templates.forEach(function (item) {
            const option = $('<option></option>').attr('value', item.id).text(item.name || item.template_name || 'Template');
            $select.append(option);
        });

        window.Tailwind?.Modal?.getInstance($modal[0])?.show();
    }

    function collectSendFormData() {
        const $form = $('#notification-send-content form');
        const data = {};
        $form.serializeArray().forEach(function (item) {
            data[item.name] = item.value;
        });
        $form.find('input[type="checkbox"]').each(function () {
            const $checkbox = $(this);
            data[$checkbox.attr('name')] = $checkbox.is(':checked');
        });
        return data;
    }

    function handleSendConfirm() {
        const $modal = $('#notification-send-modal');
        const payload = collectSendFormData();
        window.ApiClient.post(ENDPOINTS.send, payload)
            .then(function (response) {
                if (window.showNotification?.success) {
                    window.showNotification.success(response.message || 'Notification scheduled successfully.');
                }
                window.Tailwind?.Modal?.getInstance($modal[0])?.hide();
                fetchRecent();
            })
            .catch(handleError);
    }

    function saveChannelSettings() {
        if (state.isSavingChannels) {
            return;
        }
        state.isSavingChannels = true;

        const payload = {};
        $channelForm.serializeArray().forEach(function (item) {
            payload[item.name] = item.value;
        });
        $channelForm.find('input[type="checkbox"]').each(function () {
            const $checkbox = $(this);
            payload[$checkbox.attr('name')] = $checkbox.is(':checked');
        });

        window.ApiClient.put(ENDPOINTS.channels, payload)
            .then(function (response) {
                if (window.showNotification?.success) {
                    window.showNotification.success(response.message || 'Delivery channels updated.');
                }
                state.channelsDirty = false;
            })
            .catch(handleError)
            .finally(function () {
                state.isSavingChannels = false;
            });
    }

    function bindEvents() {
        const $searchInput = $filterBar.find('[data-filter-search]');
        const debouncedSearch = debounce(function (event) {
            state.filters.search = event.target.value;
            state.pagination.page = 1;
            fetchTemplates().catch(handleError);
        }, 300);
        $searchInput.on('input', debouncedSearch);

        $filterBar.find('[data-filter-channel]').on('change', function () {
            state.filters.channel = $(this).val();
            state.pagination.page = 1;
            fetchTemplates().catch(handleError);
        });

        $filterBar.find('[data-filter-status]').on('change', function () {
            state.filters.status = $(this).val();
            state.pagination.page = 1;
            fetchTemplates().catch(handleError);
        });

        $table.on('change', '[data-notification-select]', function () {
            const id = $(this).data('notification-id');
            handleSelectionChange(id, $(this).is(':checked'));
        });

        $actionToolbar.find('[data-bulk-toggle]').on('change', function () {
            handleSelectAllChange($(this).is(':checked'));
        });

        $bulkActivate.on('click', function () {
            handleBulkAction('activate');
        });
        $bulkDeactivate.on('click', function () {
            handleBulkAction('deactivate');
        });
        $bulkDuplicate.on('click', function () {
            handleBulkAction('duplicate');
        });

        $('#notification-template-save').on('click', handleTemplateSave);
        $('#notification-bulk-confirm').on('click', handleBulkConfirm);
        $('#notification-send-confirm').on('click', handleSendConfirm);

        $createTemplateBtn.on('click', function () {
            openTemplateModal();
        });
        $sendNotificationBtn.on('click', openSendModal);
        $('#empty-create-template').on('click', openTemplateModal);

        $('#refresh-overview').on('click', function () {
            fetchStats();
            fetchOverview();
        });

        $('#test-channels').on('click', function () {
            saveChannelSettings();
        });

        $('#sync-preferences').on('click', function () {
            fetchPreferences();
        });

        $channelForm.on('change input', function () {
            state.channelsDirty = true;
        });

        $(document).on('hide.tw.modal', '#notification-template-modal', function () {
            $('#notification-template-content').empty();
        });
    }

    $(document).ready(function () {
        bindEvents();
        fetchAll();
    });

})(window, window.jQuery);
