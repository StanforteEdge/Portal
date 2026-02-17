<?php
/**
 * Check the internal name of Arial Unicode MS font
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

use FontLib\Font;

$fontFile = __DIR__ . '/ARIALUNI.ttf';

if (!file_exists($fontFile)) {
    die("❌ Font file not found: $fontFile\n");
}

echo "📖 Reading font metadata from: $fontFile\n\n";

try {
    $font = Font::load($fontFile);
    $font->parse();
    
    echo "Font Information:\n";
    echo "================\n";
    echo "Full Name:    " . $font->getFontFullName() . "\n";
    echo "Family Name:  " . $font->getFontFamily() . "\n";
    echo "Subfamily:    " . $font->getFontSubfamily() . "\n";
    echo "PostScript:   " . $font->getFontPostscriptName() . "\n";
    echo "Weight:       " . $font->getFontWeight() . "\n";
    
    echo "\n✅ Use this name in CSS: font-family: '" . $font->getFontFamily() . "';\n";
    echo "✅ Or in Dompdf options: defaultFont: '" . strtolower($font->getFontFamily()) . "'\n";
    
} catch (Exception $e) {
    echo "❌ Error reading font: " . $e->getMessage() . "\n";
}
