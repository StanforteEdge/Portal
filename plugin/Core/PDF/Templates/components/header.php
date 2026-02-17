<?php
/**
 * PDF Header Component
 * 
 * Usage:
 * <?php echo PdfTemplateEngine::component('header', [
 *     'logo' => $logoBase64,
 *     'title' => 'Request Form',
 *     'subtitle' => 'Request #REQ-2024-0001'
 * ]); ?>
 */

use App\Core\PDF\Services\PdfTemplateEngine;

$logo = $logo ?? '';
$title = $title ?? '';
$subtitle = $subtitle ?? '';
?>

<div class="pdf-header">
    <?php if ($logo): ?>
        <img src="<?php echo $logo; ?>" alt="Logo" class="logo">
    <?php endif; ?>
    
    <?php if ($title): ?>
        <h1><?php echo PdfTemplateEngine::escape($title); ?></h1>
    <?php endif; ?>
    
    <?php if ($subtitle): ?>
        <p class="subtitle"><?php echo PdfTemplateEngine::escape($subtitle); ?></p>
    <?php endif; ?>
</div>
