<?php
/**
 * PDF Signature Block Component
 * 
 * Usage:
 * <?php echo PdfTemplateEngine::component('signature-block', [
 *     'signers' => [
 *         [
 *             'label' => 'Prepared By',
 *             'name' => 'John Doe',
 *             'signature' => $signatureBase64,
 *             'date' => '2024-12-01'
 *         ]
 *     ]
 * ]); ?>
 */

use App\Core\PDF\Services\PdfTemplateEngine;

$signers = $signers ?? [];
?>

<div class="signature-block">
    <?php foreach ($signers as $signer): ?>
        <div class="signature-item">
            <?php if (!empty($signer['label'])): ?>
                <div class="signature-label">
                    <?php echo PdfTemplateEngine::escape($signer['label']); ?>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($signer['signature'])): ?>
                <div class="signature-img-container">
                    <img src="<?php echo $signer['signature']; ?>" alt="Signature" class="signature-img">
                </div>
            <?php else: ?>
                <div style="height: 50px; border-bottom: 1px solid #333; margin: 10px 0;"></div>
            <?php endif; ?>
            
            <?php if (!empty($signer['name'])): ?>
                <div class="signature-name">
                    <strong><?php echo PdfTemplateEngine::escape($signer['name']); ?></strong>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($signer['date'])): ?>
                <div class="signature-date">
                    Date: <?php echo PdfTemplateEngine::formatDate($signer['date']); ?>
                </div>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>
