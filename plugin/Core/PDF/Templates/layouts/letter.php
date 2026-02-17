<?php
/**
 * Letter Layout for PDFs
 * 
 * Standard letter layout with header, content, and footer
 */

use App\Core\PDF\Services\PdfService;

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><?php echo $title ?? 'Document'; ?></title>
    <?php echo PdfService::getDefaultStyles(); ?>
</head>
<body>
    <div class="pdf-container" style="padding: 20px;">
        <?php echo $layoutContent; ?>
    </div>
</body>
</html>
