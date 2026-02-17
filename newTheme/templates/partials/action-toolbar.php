<?php
/**
 * Action Toolbar Partial
 *
 * Provides a flexible action bar with bulk selection checkbox and action buttons.
 * Supported $args keys:
 * - id (string, optional) unique identifier
 * - bulk (array|null) => ['label' => string]
 * - actions (array) => buttons or dropdown HTML strings
 * - extra (string|null) => additional HTML rendered on the right
 */

$id = $args['id'] ?? 'action-toolbar-' . wp_unique_id();
$bulk = $args['bulk'] ?? null;
$actions = $args['actions'] ?? [];
$extra = $args['extra'] ?? null;
?>
<div class="intro-y flex flex-wrap items-center justify-between gap-3 mt-5" id="<?php echo esc_attr($id); ?>" data-component="action-toolbar">
    <div class="flex items-center gap-3" data-toolbar-left>
        <?php if ($bulk) : ?>
            <label class="flex items-center">
                <input type="checkbox" class="form-check-input" data-bulk-toggle>
                <span class="ml-2 text-slate-600 text-sm" data-bulk-label><?php echo esc_html($bulk['label'] ?? __('Select all', 'stanforte')); ?></span>
            </label>
        <?php endif; ?>

        <?php if (!empty($actions)) : ?>
            <div class="flex items-center gap-2" data-toolbar-actions>
                <?php foreach ($actions as $action) : ?>
                    <?php echo $action; ?>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if ($extra) : ?>
        <div data-toolbar-extra>
            <?php echo $extra; ?>
        </div>
    <?php endif; ?>
</div>
