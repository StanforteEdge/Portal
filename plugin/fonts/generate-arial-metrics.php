<?php
/**
 * Generate font metrics for Arial Unicode MS
 * Run this once to install the font for Dompdf
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

$fontDir = __DIR__;
$fontFile = $fontDir . '/ARIALUNI.ttf';

if (!file_exists($fontFile)) {
    die("❌ Font file not found: $fontFile\n");
}

echo "🔧 Generating font metrics for Arial Unicode MS...\n";
echo "Font file: $fontFile\n";
echo "Font directory: $fontDir\n\n";

// Update the installed-fonts.json file (Dompdf's font registry)
$installedFonts = $fontDir . '/installed-fonts.json';
$fonts = [];

if (file_exists($installedFonts)) {
    $fonts = json_decode(file_get_contents($installedFonts), true) ?: [];
}

// Register Arial font family
$fonts['arial'] = [
    'normal' => 'ARIALUNI.ttf',
    'bold' => 'ARIALUNI.ttf',      // Use same file for bold
    'italic' => 'ARIALUNI.ttf',    // Use same file for italic
    'bold_italic' => 'ARIALUNI.ttf' // Use same file for bold italic
];

file_put_contents($installedFonts, json_encode($fonts, JSON_PRETTY_PRINT));
echo "✅ Updated installed fonts registry: $installedFonts\n";

// Remove the old incorrect metrics file if it exists
$oldMetricsFile = $fontDir . '/arial_normal_.ufm.json';
if (file_exists($oldMetricsFile)) {
    unlink($oldMetricsFile);
    echo "✅ Removed old metrics file\n";
}

echo "\n🎉 Arial Unicode MS is now installed!\n";
echo "You can now use: font-family: 'Arial' in your PDFs\n";
echo "\nNote: Dompdf will auto-generate font metrics on first use.\n";
