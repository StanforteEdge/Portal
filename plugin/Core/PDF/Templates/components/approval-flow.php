<?php
/**
 * PDF Approval Flow Component
 * 
 * Usage:
 * <?php echo PdfTemplateEngine::component('approval-flow', [
 *     'title' => 'Approval History',
 *     'approvals' => [
 *         [
 *             'step' => 'Team Lead Approval',
 *             'name' => 'John Doe',
 *             'action' => 'approved',
 *             'date' => '2024-12-01',
 *             'signature' => $signatureBase64,
 *             'comment' => 'Approved for processing'
 *         ]
 *     ]
 * ]); ?>
 */

use App\Core\PDF\Services\PdfTemplateEngine;

$title = $title ?? 'Approval History';
$approvals = $approvals ?? [];
?>

<div class="approval-flow">
    <?php if ($title): ?>
        <h3 style="margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">
            <?php echo PdfTemplateEngine::escape($title); ?>
        </h3>
    <?php endif; ?>
    
    <?php if (!empty($approvals)): ?>
        <?php foreach ($approvals as $approval): ?>
            <div class="approval-step" style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #4CAF50;">
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <?php if (($approval['action'] ?? '') === 'approved'): ?>
                        <span style="color: #4CAF50; font-size: 16px; margin-right: 10px;">✓</span>
                    <?php elseif (($approval['action'] ?? '') === 'rejected'): ?>
                        <span style="color: #f44336; font-size: 16px; margin-right: 10px;">✗</span>
                    <?php else: ?>
                        <span style="color: #FFC107; font-size: 16px; margin-right: 10px;">⏱</span>
                    <?php endif; ?>
                    
                    <strong><?php echo PdfTemplateEngine::escape($approval['step'] ?? 'Step'); ?></strong>
                </div>
                
                <div style="margin-left: 26px;">
                    <?php if (!empty($approval['name'])): ?>
                        <div style="margin-bottom: 3px;">
                            <strong>Name:</strong> <?php echo PdfTemplateEngine::escape($approval['name']); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($approval['date'])): ?>
                        <div style="margin-bottom: 3px; font-size: 11px; color: #666;">
                            <strong>Date:</strong> <?php echo PdfTemplateEngine::formatDate($approval['date'], 'M d, Y H:i'); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($approval['comment'])): ?>
                        <div style="margin-top: 5px; font-style: italic; color: #555;">
                            "<?php echo PdfTemplateEngine::escape($approval['comment']); ?>"
                        </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($approval['signature'])): ?>
                        <div style="margin-top: 5px;">
                            <img src="<?php echo $approval['signature']; ?>" alt="Signature" style="max-width: 100px; max-height: 40px;">
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    <?php else: ?>
        <p style="color: #999; font-style: italic;">No approval history available</p>
    <?php endif; ?>
</div>
