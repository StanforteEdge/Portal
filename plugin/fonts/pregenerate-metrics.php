<?php
/**
 * Pre-generate Arial Unicode MS font metrics for Dompdf
 * This eliminates PHP warnings by ensuring font metrics exist before PDF generation
 */

require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$fontDir = __DIR__;
$fontFile = $fontDir . '/ARIALUNI.ttf';

if (!file_exists($fontFile)) {
    die("❌ Font file not found: $fontFile\n");
}

echo "🔧 Pre-generating Arial Unicode MS font metrics...\n";
echo "Font file: $fontFile\n\n";

try {
    // Configure Dompdf with Arial font
    $options = new Options();
    $options->set('fontDir', $fontDir);
    $options->set('fontCache', $fontDir);
    $options->set('defaultFont', 'arial');

    $dompdf = new Dompdf($options);

    // Create a test HTML to trigger font metrics generation
    $testHtml = '<html><body><p style="font-family: arial;">₦ ✓ Testing Arial Unicode MS</p></body></html>';

    $dompdf->loadHtml($testHtml);
    $dompdf->setPaper('a4', 'portrait');

    // This will generate the font metrics
    $dompdf->render();

    echo "✅ Font metrics generated successfully!\n";
    echo "✅ Arial Unicode MS is ready for use\n";

    // Check if metrics files were created
    $metricsFiles = glob($fontDir . '/arial*.ufm*');
    echo "📁 Generated metrics files:\n";
    foreach ($metricsFiles as $file) {
        echo "   - " . basename($file) . "\n";
    }

} catch (Exception $e) {
    echo "❌ Error generating metrics: " . $e->getMessage() . "\n";
    echo "📋 Try running the script with proper permissions\n";
}
