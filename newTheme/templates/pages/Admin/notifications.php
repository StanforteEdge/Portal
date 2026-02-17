<?php
/* Template Name: Admin: Notifications */

$pageTitle = 'Notification Center';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/admin')],
    ['name' => 'Notifications']
];
$activeMenu = 'admin-notifications';

wp_enqueue_script(
    'stanforte-admin-notifications',
    get_template_directory_uri() . '/assets/js/pages/admin/notifications.js',
    ['jquery', 'stanforte-data-client'],
    filemtime(get_template_directory() . '/assets/js/pages/admin/notifications.js'),
    true
);

get_header();

ob_start();
?>
<select class="form-select box min-w-[160px]" data-filter-channel>
    <option value=""><?php esc_html_e('All Channels', 'stanforte'); ?></option>
    <option value="email"><?php esc_html_e('Email', 'stanforte'); ?></option>
    <option value="sms"><?php esc_html_e('SMS', 'stanforte'); ?></option>
    <option value="in_app"><?php esc_html_e('In-App', 'stanforte'); ?></option>
</select>
<?php
$channelFilter = ob_get_clean();

ob_start();
?>
<select class="form-select box min-w-[160px]" data-filter-status>
    <option value=""><?php esc_html_e('All Statuses', 'stanforte'); ?></option>
    <option value="active"><?php esc_html_e('Active', 'stanforte'); ?></option>
    <option value="draft"><?php esc_html_e('Draft', 'stanforte'); ?></option>
    <option value="archived"><?php esc_html_e('Archived', 'stanforte'); ?></option>
</select>
<?php
$statusFilter = ob_get_clean();

ob_start();
?>
<button type="button" class="btn btn-primary" id="create-template-btn">
    <i data-lucide="file-plus" class="w-4 h-4 mr-2"></i>
    <?php esc_html_e('New Template', 'stanforte'); ?>
</button>
<button type="button" class="btn btn-outline-secondary" id="send-notification-btn">
    <i data-lucide="send" class="w-4 h-4 mr-2"></i>
    <?php esc_html_e('Send Notification', 'stanforte'); ?>
</button>
<?php
$primaryActions = ob_get_clean();

ob_start();
?>
<tr class="intro-x animate-pulse" data-skeleton-row>
    <td>
        <div class="form-check">
            <input class="form-check-input" type="checkbox" disabled>
        </div>
    </td>
    <td>
        <div class="bg-slate-200 h-4 w-36 rounded animate-pulse"></div>
        <div class="bg-slate-200 h-3 w-48 rounded mt-2 animate-pulse"></div>
    </td>
    <td>
        <div class="bg-slate-200 h-4 w-20 rounded mx-auto animate-pulse"></div>
    </td>
    <td>
        <div class="bg-slate-200 h-4 w-20 rounded mx-auto animate-pulse"></div>
    </td>
    <td>
        <div class="bg-slate-200 h-4 w-24 rounded mx-auto animate-pulse"></div>
    </td>
    <td class="text-center">
        <span class="bg-slate-200 h-4 w-20 inline-block rounded animate-pulse"></span>
    </td>
</tr>
<?php
$tableSkeleton = ob_get_clean();

ob_start();
?>
<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" id="notifications-pagination-container">
    <div id="notifications-pagination-info" class="text-slate-500 text-sm"></div>
    <div class="flex items-center gap-2" id="notifications-pagination"></div>
</div>
<?php
$tableFooter = ob_get_clean();
?>

<div class="intro-y space-y-10">
    <?php
    get_template_part('templates/partials/metrics-cards', null, [
        'cards' => [
            [
                'id' => 'total-notifications',
                'title' => __('Total Sent', 'stanforte'),
                'helper' => __('Across all delivery channels', 'stanforte'),
                'icon' => 'send'
            ],
            [
                'id' => 'delivery-rate',
                'title' => __('Delivery Rate', 'stanforte'),
                'helper' => __('Successful deliveries in the last 24h', 'stanforte'),
                'icon' => 'activity'
            ],
            [
                'id' => 'engagement-rate',
                'title' => __('Engagement Rate', 'stanforte'),
                'helper' => __('Opens & clicks across channels', 'stanforte'),
                'icon' => 'chart-line'
            ],
            [
                'id' => 'active-alerts',
                'title' => __('Active Alerts', 'stanforte'),
                'helper' => __('Automated alert workflows', 'stanforte'),
                'icon' => 'bell-ring'
            ]
        ]
    ]);

    get_template_part('templates/partials/filter-bar', null, [
        'id' => 'notifications-filter-bar',
        'search' => [
            'placeholder' => __('Search templates or events', 'stanforte')
        ],
        'filters' => [
            ['content' => $channelFilter],
            ['content' => $statusFilter]
        ],
        'actions' => [$primaryActions]
    ]);

    get_template_part('templates/partials/action-toolbar', null, [
        'id' => 'notifications-action-toolbar',
        'bulk' => ['label' => __('Select all templates', 'stanforte')],
        'actions' => [
            '<button type="button" class="btn btn-outline-secondary btn-sm" id="bulk-activate" disabled><i data-lucide="toggle-right" class="w-4 h-4 mr-2"></i>' . esc_html__('Activate', 'stanforte') . '</button>',
            '<button type="button" class="btn btn-outline-secondary btn-sm" id="bulk-deactivate" disabled><i data-lucide="toggle-left" class="w-4 h-4 mr-2"></i>' . esc_html__('Deactivate', 'stanforte') . '</button>',
            '<button type="button" class="btn btn-outline-secondary btn-sm" id="bulk-duplicate" disabled><i data-lucide="copy" class="w-4 h-4 mr-2"></i>' . esc_html__('Duplicate', 'stanforte') . '</button>'
        ]
    ]);

    get_template_part('templates/partials/data-table', null, [
        'id' => 'notifications-data-table',
        'headers' => [
            ['label' => '', 'class' => 'w-12'],
            ['label' => __('Template', 'stanforte')],
            ['label' => __('Channel', 'stanforte'), 'class' => 'text-center'],
            ['label' => __('Status', 'stanforte'), 'class' => 'text-center'],
            ['label' => __('Updated', 'stanforte'), 'class' => 'text-center'],
            ['label' => __('Actions', 'stanforte'), 'class' => 'text-center']
        ],
        'body' => $tableSkeleton,
        'footer' => $tableFooter
    ]);
    ?>

    <div id="notifications-empty-state" class="hidden">
        <?php
        get_template_part('templates/partials/empty-state', null, [
            'icon' => 'mail-warning',
            'title' => __('No notification templates found', 'stanforte'),
            'message' => __('Adjust your filters or create a new template to get started.', 'stanforte'),
            'actions' => [
                '<button type="button" class="btn btn-primary" id="empty-create-template"><i data-lucide="file-plus" class="w-4 h-4 mr-2"></i>' . esc_html__('New Template', 'stanforte') . '</button>'
            ]
        ]);
        ?>
    </div>

    <div class="grid grid-cols-12 gap-6" id="notification-overview">
        <div class="col-span-12 xl:col-span-8 intro-y box p-5">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-medium"><?php esc_html_e('Delivery Performance', 'stanforte'); ?></h3>
                    <p class="text-slate-500 text-sm"><?php esc_html_e('Track delivery success and engagement across the last 7 days.', 'stanforte'); ?></p>
                </div>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="refresh-overview">
                    <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
                    <?php esc_html_e('Refresh', 'stanforte'); ?>
                </button>
            </div>
            <div class="mt-6" id="delivery-chart">
                <div class="flex items-center justify-center py-10 text-slate-500" data-overview-empty>
                    <?php esc_html_e('Overview data will appear once statistics are loaded.', 'stanforte'); ?>
                </div>
            </div>
        </div>
        <div class="col-span-12 xl:col-span-4 intro-y box p-5">
            <h3 class="text-lg font-medium"><?php esc_html_e('Recent Notifications', 'stanforte'); ?></h3>
            <p class="text-slate-500 text-sm mb-4"><?php esc_html_e('Quick view of the latest notifications and their statuses.', 'stanforte'); ?></p>
            <div id="recent-notifications" class="space-y-4">
                <div class="flex items-center justify-center py-10 text-slate-500" data-recent-empty>
                    <?php esc_html_e('Recent notifications will load after fetching data.', 'stanforte'); ?>
                </div>
            </div>
        </div>
    </div>

    <div class="intro-y box p-5" id="channel-configuration">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h3 class="text-lg font-medium"><?php esc_html_e('Delivery Channels', 'stanforte'); ?></h3>
                <p class="text-slate-500 text-sm"><?php esc_html_e('Manage channel credentials, delivery windows, and opt-out handling.', 'stanforte'); ?></p>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="test-channels">
                <i data-lucide="zap" class="w-4 h-4 mr-2"></i>
                <?php esc_html_e('Run Channel Tests', 'stanforte'); ?>
            </button>
        </div>
        <form id="channel-settings-form" class="mt-6 space-y-8">
            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12 md:col-span-6">
                    <h4 class="text-base font-medium mb-3"><?php esc_html_e('Email', 'stanforte'); ?></h4>
                    <label class="form-label" for="email_from_name"><?php esc_html_e('From Name', 'stanforte'); ?></label>
                    <input type="text" class="form-control" id="email_from_name" name="email_from_name">
                    <label class="form-label mt-4" for="email_from_address"><?php esc_html_e('From Address', 'stanforte'); ?></label>
                    <input type="email" class="form-control" id="email_from_address" name="email_from_address">
                    <div class="form-check form-switch mt-4">
                        <input type="checkbox" class="form-check-input" id="email_tracking" name="email_tracking">
                        <label class="form-check-label" for="email_tracking"><?php esc_html_e('Enable open & click tracking', 'stanforte'); ?></label>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                    <h4 class="text-base font-medium mb-3"><?php esc_html_e('SMS', 'stanforte'); ?></h4>
                    <label class="form-label" for="sms_sender_id"><?php esc_html_e('Sender ID', 'stanforte'); ?></label>
                    <input type="text" class="form-control" id="sms_sender_id" name="sms_sender_id">
                    <label class="form-label mt-4" for="sms_rate_limit"><?php esc_html_e('Rate Limit (per minute)', 'stanforte'); ?></label>
                    <input type="number" class="form-control" id="sms_rate_limit" name="sms_rate_limit" min="1" step="1">
                    <div class="form-check form-switch mt-4">
                        <input type="checkbox" class="form-check-input" id="sms_opt_out" name="sms_opt_out">
                        <label class="form-check-label" for="sms_opt_out"><?php esc_html_e('Enable STOP keyword opt-out', 'stanforte'); ?></label>
                    </div>
                </div>
                <div class="col-span-12">
                    <h4 class="text-base font-medium mb-3"><?php esc_html_e('In-App', 'stanforte'); ?></h4>
                    <label class="form-label" for="inapp_retention"><?php esc_html_e('Retention (days)', 'stanforte'); ?></label>
                    <input type="number" class="form-control" id="inapp_retention" name="inapp_retention" min="1" step="1">
                    <div class="form-check form-switch mt-4">
                        <input type="checkbox" class="form-check-input" id="inapp_push_enabled" name="inapp_push_enabled">
                        <label class="form-check-label" for="inapp_push_enabled"><?php esc_html_e('Send push notifications to mobile app', 'stanforte'); ?></label>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <div class="intro-y box p-5" id="user-preferences">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h3 class="text-lg font-medium"><?php esc_html_e('User Preferences', 'stanforte'); ?></h3>
                <p class="text-slate-500 text-sm"><?php esc_html_e('Review segmentation and opt-out rules applied across notifications.', 'stanforte'); ?></p>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="sync-preferences">
                <i data-lucide="cloud-sync" class="w-4 h-4 mr-2"></i>
                <?php esc_html_e('Sync Preferences', 'stanforte'); ?>
            </button>
        </div>
        <div class="mt-6" id="preferences-summary">
            <div class="flex items-center justify-center py-10 text-slate-500" data-preferences-empty>
                <?php esc_html_e('Preference data will load after fetching settings.', 'stanforte'); ?>
            </div>
        </div>
    </div>
</div>

<?php
get_template_part('templates/partials/detail-modal', null, [
    'id' => 'notification-template-modal',
    'title' => __('Notification Template', 'stanforte'),
    'body' => '<div id="notification-template-content" class="space-y-5"></div>',
    'footer' => '<div class="flex items-center gap-3 ml-auto"><button type="button" class="btn btn-outline-secondary" data-modal-dismiss>' . esc_html__('Cancel', 'stanforte') . '</button><button type="button" class="btn btn-primary" id="notification-template-save">' . esc_html__('Save Template', 'stanforte') . '</button></div>'
]);

get_template_part('templates/partials/detail-modal', null, [
    'id' => 'notification-send-modal',
    'title' => __('Send Notification', 'stanforte'),
    'body' => '<div id="notification-send-content" class="space-y-5"></div>',
    'footer' => '<div class="flex items-center gap-3 ml-auto"><button type="button" class="btn btn-outline-secondary" data-modal-dismiss>' . esc_html__('Cancel', 'stanforte') . '</button><button type="button" class="btn btn-primary" id="notification-send-confirm">' . esc_html__('Send Now', 'stanforte') . '</button></div>'
]);

get_template_part('templates/partials/detail-modal', null, [
    'id' => 'notification-bulk-modal',
    'title' => __('Confirm Bulk Action', 'stanforte'),
    'body' => '<div class="space-y-4 text-left"><p class="text-slate-600">' . esc_html__('Review the templates impacted by this bulk update.', 'stanforte') . '</p><div id="notification-bulk-summary" class="bg-slate-50 p-4 rounded-md"></div></div>',
    'footer' => '<div class="flex items-center gap-3 ml-auto"><button type="button" class="btn btn-outline-secondary" data-modal-dismiss>' . esc_html__('Cancel', 'stanforte') . '</button><button type="button" class="btn btn-danger" id="notification-bulk-confirm">' . esc_html__('Confirm', 'stanforte') . '</button></div>'
]);
?>

<template id="notification-row-template">
    <tr class="intro-x" data-notification-row>
        <td>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" data-notification-select>
            </div>
        </td>
        <td>
            <div class="font-medium" data-notification-name></div>
            <div class="text-xs text-slate-500 mt-1" data-notification-description></div>
        </td>
        <td class="text-center" data-notification-channel></td>
        <td class="text-center" data-notification-status></td>
        <td class="text-center text-xs text-slate-500" data-notification-updated></td>
        <td class="table-report__action w-48">
            <div class="flex justify-center items-center gap-3">
                <a href="javascript:;" class="flex items-center text-primary" data-notification-edit data-tw-toggle="modal" data-tw-target="#notification-template-modal">
                    <i data-lucide="edit" class="w-4 h-4 mr-1"></i>
                    <?php esc_html_e('Edit', 'stanforte'); ?>
                </a>
                <a href="javascript:;" class="flex items-center text-danger" data-notification-archive>
                    <i data-lucide="archive" class="w-4 h-4 mr-1"></i>
                    <?php esc_html_e('Archive', 'stanforte'); ?>
                </a>
            </div>
        </td>
    </tr>
</template>

<template id="recent-notification-item-template">
    <div class="flex items-start">
        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
            <i data-lucide="bell-ring" class="w-5 h-5"></i>
        </div>
        <div>
            <div class="text-sm font-medium" data-recent-title></div>
            <div class="text-xs text-slate-500 mt-1" data-recent-meta></div>
        </div>
    </div>
</template>

<?php get_footer(); ?>
