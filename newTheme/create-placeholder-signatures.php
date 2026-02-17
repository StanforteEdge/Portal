<?php
/**
 * Create Placeholder Signature Images
 * 
 * This script creates simple placeholder signature images for testing.
 * Run this file once to create all required signature files.
 * 
 * Usage: php create-placeholder-signatures.php
 */

// Define signature directory
$signatureDir = __DIR__ . '/assets/images/signatures/';

// Create directory if it doesn't exist
if (!is_dir($signatureDir)) {
    mkdir($signatureDir, 0755, true);
    echo "✓ Created directory: $signatureDir\n";
}

// Define signatures to create
$signatures = [
    'prepared-by.png' => 'Oyinkansola Aje',
    'coo.png' => 'Olalekan Owonikoko',
    'ed.png' => 'Olusola Owonikoko',
    'account-officer.png' => 'Oyinkansola Aje',
    'received-by.png' => 'Received By',
    'team-lead-administration.png' => 'Team Lead - Admin',
    'team-lead-it.png' => 'Team Lead - IT',
    'team-lead-programs.png' => 'Team Lead - Programs',
    'team-lead-communications.png' => 'Team Lead - Comms',
    'team-lead-operations.png' => 'Team Lead - Ops'
];

echo "\n=== Creating Placeholder Signatures ===\n\n";

foreach ($signatures as $filename => $text) {
    $filepath = $signatureDir . $filename;
    
    // Create a simple signature image using GD
    $width = 200;
    $height = 80;
    
    // Create image
    $image = imagecreatetruecolor($width, $height);
    
    // Set colors
    $white = imagecolorallocate($image, 255, 255, 255);
    $black = imagecolorallocate($image, 0, 0, 0);
    $blue = imagecolorallocate($image, 0, 51, 102); // Dark blue
    
    // Fill background with white
    imagefill($image, 0, 0, $white);
    
    // Add text (signature style)
    $font = 3; // Built-in font
    $textWidth = imagefontwidth($font) * strlen($text);
    $textHeight = imagefontheight($font);
    $x = ($width - $textWidth) / 2;
    $y = ($height - $textHeight) / 2;
    
    // Draw text in italic style (simulate signature)
    imagestring($image, $font, $x, $y, $text, $blue);
    
    // Add a line under the text (signature underline)
    imageline($image, $x, $y + $textHeight + 2, $x + $textWidth, $y + $textHeight + 2, $blue);
    
    // Save as PNG
    if (imagepng($image, $filepath)) {
        echo "✓ Created: $filename ($text)\n";
    } else {
        echo "✗ Failed: $filename\n";
    }
    
    // Free memory
    imagedestroy($image);
}

echo "\n=== Summary ===\n";
echo "Location: $signatureDir\n";
echo "Files created: " . count($signatures) . "\n";
echo "\nNext steps:\n";
echo "1. Check the files in: $signatureDir\n";
echo "2. Generate a PDF to test\n";
echo "3. Replace placeholder images with real signature scans\n";
echo "\n✓ Done!\n\n";
?>
