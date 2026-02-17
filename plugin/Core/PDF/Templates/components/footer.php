<?php
/**
 * PDF Footer Component
 * 
 * Usage:
 * <?php echo PdfTemplateEngine::component('footer', [
 *     'text' => 'Generated on ' . date('M d, Y'),
 *     'pageNumber' => true
 * ]); ?>
 */

use App\Core\PDF\Services\PdfTemplateEngine;

$text = $text ?? 'Generated on ' . date('M d, Y');
$pageNumber = $pageNumber ?? false;
$companyName = $companyName ?? get_bloginfo('name');
?>

<div class="pdf-footer">
    <?php if ($text): ?>
        <p><?php echo PdfTemplateEngine::escape($text); ?></p>
    <?php endif; ?>
    
    <?php if ($companyName): ?>
        <p style="margin-top: 5px;">
            &copy; <?php echo date('Y'); ?> <?php echo PdfTemplateEngine::escape($companyName); ?>. All rights reserved.
        </p>
    <?php endif; ?>
    
    <?php if ($pageNumber): ?>
        <script type="text/php">
            if (isset($pdf)) {
                $text = "Page {PAGE_NUM} of {PAGE_COUNT}";
                $size = 10;
                $font = $fontMetrics->getFont("Arial");
                $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
                $x = ($pdf->get_width() - $width) / 2;
                $y = $pdf->get_height() - 35;
                $pdf->page_text($x, $y, $text, $font, $size);
            }
        </script>
    <?php endif; ?>
</div>
