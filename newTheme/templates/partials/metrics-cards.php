<?php
/**
 * Metrics Cards Partial
 *
 * Renders a responsive grid of summary metrics with optional icons and trend indicators.
 * Accepts an array of cards via $args['cards'] where each card supports the keys:
 * - id (string, required)
 * - title (string, required)
 * - value (string|null)
 * - helper (string|null)
 * - icon (string|null, lucide icon name)
 * - trend (array|null) => ['direction' => 'up'|'down', 'value' => string]
 */

$cards = $args['cards'] ?? [];

if (empty($cards)) {
    return;
}
?>
<div class="grid grid-cols-12 gap-6 mt-5" data-component="metrics-cards">
    <?php foreach ($cards as $card) :
        $card_id = esc_attr($card['id']);
        $title = esc_html($card['title'] ?? '');
        $value = $card['value'] ?? null;
        $helper = $card['helper'] ?? null;
        $icon = $card['icon'] ?? null;
        $trend = $card['trend'] ?? null;
    ?>
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y" data-card-id="<?php echo $card_id; ?>">
            <div class="box p-5">
                <div class="flex items-center">
                    <div class="mr-auto">
                        <div class="text-slate-500 text-sm font-medium">
                            <?php echo $title; ?>
                        </div>
                        <div class="text-2xl font-medium leading-6 mt-3" data-metrics-value>
                            <?php if ($value !== null) : ?>
                                <?php echo esc_html($value); ?>
                            <?php else : ?>
                                <span class="inline-flex h-6 w-24 rounded bg-slate-200 animate-pulse"></span>
                            <?php endif; ?>
                        </div>
                        <?php if ($helper) : ?>
                            <div class="text-xs text-slate-500 mt-2" data-metrics-helper><?php echo esc_html($helper); ?></div>
                        <?php else : ?>
                            <div class="text-xs text-slate-500 mt-2 hidden" data-metrics-helper></div>
                        <?php endif; ?>
                    </div>
                    <?php if ($icon) : ?>
                        <i data-lucide="<?php echo esc_attr($icon); ?>" class="w-6 h-6 text-slate-400"></i>
                    <?php endif; ?>
                </div>
                <?php if (is_array($trend) && !empty($trend['value'])) :
                    $direction = $trend['direction'] ?? 'up';
                    $is_up = $direction === 'up';
                ?>
                    <div class="flex items-center mt-4 text-xs" data-metrics-trend>
                        <div class="flex items-center <?php echo $is_up ? 'text-success' : 'text-danger'; ?>">
                            <i data-lucide="<?php echo $is_up ? 'trending-up' : 'trending-down'; ?>" class="w-4 h-4 mr-1"></i>
                            <span><?php echo esc_html($trend['value']); ?></span>
                        </div>
                        <?php if (!empty($trend['label'])) : ?>
                            <span class="text-slate-500 ml-2"><?php echo esc_html($trend['label']); ?></span>
                        <?php endif; ?>
                    </div>
                <?php else : ?>
                    <div class="flex items-center mt-4 text-xs hidden" data-metrics-trend></div>
                <?php endif; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>
