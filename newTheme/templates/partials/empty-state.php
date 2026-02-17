<?php
/**
 * Empty State Partial
 *
 * Renders an empty state block with optional icon, title, message, and action button(s).
 * Supported $args keys:
 * - icon (string|null) => lucide icon name
 * - title (string, required)
 * - message (string|null)
 * - actions (array) => action HTML strings rendered below message
 */

$title = $args['title'] ?? '';

if (empty($title)) {
    return;
}

$message = $args['message'] ?? '';
$icon = $args['icon'] ?? null;
$actions = $args['actions'] ?? [];
?>
<div class="intro-y box p-10 text-center" data-component="empty-state">
    <?php if ($icon) : ?>
        <div class="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-slate-100 dark:bg-darkmode-400">
            <i data-lucide="<?php echo esc_attr($icon); ?>" class="w-8 h-8 text-slate-400"></i>
        </div>
    <?php endif; ?>
    <div class="text-lg font-medium mt-6">
        <?php echo esc_html($title); ?>
    </div>
    <?php if (!empty($message)) : ?>
        <div class="text-slate-500 mt-3">
            <?php echo esc_html($message); ?>
        </div>
    <?php endif; ?>
    <?php if (!empty($actions)) : ?>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <?php foreach ($actions as $action) : ?>
                <?php echo $action; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>
