<?php
/**
 * Filter Bar Partial
 *
 * Renders a responsive toolbar with search and filter slots.
 * Supported $args keys:
 * - id (string, optional) DOM identifier
 * - search (array|null) => ['placeholder' => string, 'value' => string|null]
 * - filters (array) => each filter is ['content' => string] rendered inline
 * - actions (array) => action buttons rendered right-aligned
 */

$id = $args['id'] ?? 'filter-bar-' . wp_unique_id();
$search = $args['search'] ?? null;
$filters = $args['filters'] ?? [];
$actions = $args['actions'] ?? [];
?>
<div class="intro-y flex flex-wrap items-center gap-3 mt-5" id="<?php echo esc_attr($id); ?>" data-component="filter-bar">
    <?php if ($search) : ?>
        <div class="relative text-slate-500 flex-1 min-w-[220px] sm:w-auto">
            <input type="text"
                   class="form-control box pr-10"
                   placeholder="<?php echo esc_attr($search['placeholder'] ?? 'Search...'); ?>"
                   value="<?php echo esc_attr($search['value'] ?? ''); ?>"
                   data-filter-search>
            <i class="w-4 h-4 absolute my-auto inset-y-0 mr-3 right-0" data-lucide="search"></i>
        </div>
    <?php endif; ?>

    <?php if (!empty($filters)) : ?>
        <div class="flex flex-wrap items-center gap-3" data-filter-controls>
            <?php foreach ($filters as $filter) : ?>
                <div class="min-w-[140px]">
                    <?php echo $filter['content']; ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <?php if (!empty($actions)) : ?>
        <div class="ml-auto flex items-center gap-2" data-filter-actions>
            <?php foreach ($actions as $action) : ?>
                <?php echo $action; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>
