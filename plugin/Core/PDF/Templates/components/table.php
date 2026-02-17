<?php
/**
 * PDF Table Component
 * 
 * Usage:
 * <?php echo PdfTemplateEngine::component('table', [
 *     'columns' => [
 *         ['key' => 'description', 'label' => 'Description'],
 *         ['key' => 'amount', 'label' => 'Amount', 'align' => 'right']
 *     ],
 *     'rows' => $items,
 *     'showTotal' => true,
 *     'totalLabel' => 'Total',
 *     'totalKey' => 'amount'
 * ]); ?>
 */

use App\Core\PDF\Services\PdfTemplateEngine;

$columns = $columns ?? [];
$rows = $rows ?? [];
$showTotal = $showTotal ?? false;
$totalLabel = $totalLabel ?? 'Total';
$totalKey = $totalKey ?? null;
$tableClass = $tableClass ?? 'pdf-table';
?>

<table class="<?php echo $tableClass; ?>">
    <?php if (!empty($columns)): ?>
        <thead>
            <tr>
                <?php foreach ($columns as $col): ?>
                    <th style="text-align: <?php echo $col['align'] ?? 'left'; ?>">
                        <?php echo PdfTemplateEngine::escape($col['label']); ?>
                    </th>
                <?php endforeach; ?>
            </tr>
        </thead>
    <?php endif; ?>
    
    <tbody>
        <?php if (!empty($rows)): ?>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <?php foreach ($columns as $col): ?>
                        <td style="text-align: <?php echo $col['align'] ?? 'left'; ?>">
                            <?php 
                            $value = $row[$col['key']] ?? '';
                            
                            // Apply formatter if specified
                            if (isset($col['formatter']) && is_callable($col['formatter'])) {
                                $value = $col['formatter']($value, $row);
                            }
                            
                            echo PdfTemplateEngine::escape($value);
                            ?>
                        </td>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
        <?php else: ?>
            <tr>
                <td colspan="<?php echo count($columns); ?>" style="text-align: center; color: #999;">
                    No items
                </td>
            </tr>
        <?php endif; ?>
    </tbody>
    
    <?php if ($showTotal && $totalKey && !empty($rows)): ?>
        <tfoot>
            <tr style="font-weight: bold; background-color: #f5f5f5;">
                <td colspan="<?php echo count($columns) - 1; ?>" style="text-align: right;">
                    <?php echo PdfTemplateEngine::escape($totalLabel); ?>:
                </td>
                <td style="text-align: right;">
                    <?php 
                    $total = array_sum(array_column($rows, $totalKey));
                    echo PdfTemplateEngine::escape(number_format($total, 2));
                    ?>
                </td>
            </tr>
        </tfoot>
    <?php endif; ?>
</table>
