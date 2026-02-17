<?php
/**
 * Detail Modal Partial
 *
 * Provides a reusable modal shell using the theme's Tailwind + Lucide styles.
 * Supported $args keys:
 * - id (string, required)
 * - title (string, optional)
 * - body (string|callable|null)
 * - footer (string|callable|null)
 * - size (string|null) -> additional width classes
 */

if (empty($args['id'])) {
    return;
}

$id = esc_attr($args['id']);
$title = $args['title'] ?? '';
$body = $args['body'] ?? '';
$footer = $args['footer'] ?? '';
$size = trim('max-w-3xl ' . ($args['size'] ?? ''));
?>
<div class="modal" id="<?php echo $id; ?>" data-component="detail-modal" aria-hidden="true" data-tw-backdrop="static"
    tabindex="-1">
    <div class="modal-dialog <?php echo esc_attr($size); ?>">
        <div class="modal-content">
            <div class="modal-header ">
                <h2 class="font-medium text-base mr-auto" data-modal-title>
                    <?php echo esc_html($title); ?>
                </h2>
                <div class="cursor-pointer" data-modal-dismiss>
                    <i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
                </div>
            </div>
            <div class="modal-body space-y-5" data-modal-body>
                <?php if (is_callable($body)): ?>
                    <?php call_user_func($body); ?>
                <?php else: ?>
                    <?php echo $body; ?>
                <?php endif; ?>
            </div>
            <div class="modal-footer flex items-center justify-between" data-modal-footer>
                <?php if (is_callable($footer)): ?>
                    <?php call_user_func($footer); ?>
                <?php else: ?>
                    <?php echo $footer; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>