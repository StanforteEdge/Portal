<?php
/**
 * Data Table Partial
 *
 * Provides a responsive table shell with slots for header and body content.
 * Supported $args keys:
 * - id (string, optional) DOM identifier
 * - headers (array) => each header entry ['label' => string, 'class' => string|null]
 * - body (callable|string|null) => rendered rows or skeleton placeholder
 * - footer (string|null) => optional footer (pagination, etc.)
 */

$id = $args['id'] ?? 'data-table-' . wp_unique_id();
$headers = $args['headers'] ?? [];
$body = $args['body'] ?? '';
$footer = $args['footer'] ?? '';
?>
<div class="intro-y col-span-12 overflow-auto lg:overflow-visible" id="<?php echo esc_attr($id); ?>" data-component="data-table">
    <table class="table table-report -mt-2">
        <?php if (!empty($headers)) : ?>
            <thead>
                <tr>
                    <?php foreach ($headers as $header) :
                        $label = esc_html($header['label'] ?? '');
                        $class = esc_attr($header['class'] ?? '');
                    ?>
                        <th class="whitespace-nowrap <?php echo $class; ?>" scope="col"><?php echo $label; ?></th>
                    <?php endforeach; ?>
                </tr>
            </thead>
        <?php endif; ?>
        <tbody data-table-body>
            <?php if (is_callable($body)) : ?>
                <?php call_user_func($body); ?>
            <?php else : ?>
                <?php echo $body; ?>
            <?php endif; ?>
        </tbody>
    </table>
    <?php if (!empty($footer)) : ?>
        <div class="mt-5" data-table-footer>
            <?php echo $footer; ?>
        </div>
    <?php endif; ?>
</div>
