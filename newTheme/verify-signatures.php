<?php
/**
 * Verify Signature Files
 * 
 * This script checks if all required signature files exist and are valid.
 * 
 * Usage: php verify-signatures.php
 */

// Define signature directory
$signatureDir = __DIR__ . '/assets/images/signatures/';

// Required signature files
$requiredFiles = [
    'prepared-by.png',
    'coo.png',
    'ed.png',
    'account-officer.png',
    'received-by.png',
    'team-lead-administration.png',
    'team-lead-it.png',
    'team-lead-programs.png',
    'team-lead-communications.png',
    'team-lead-operations.png'
];

echo "\n=== Signature Files Verification ===\n\n";
echo "Checking directory: $signatureDir\n\n";

// Check if directory exists
if (!is_dir($signatureDir)) {
    echo "✗ ERROR: Directory does not exist!\n";
    echo "  Run: mkdir -p $signatureDir\n\n";
    exit(1);
}

echo "✓ Directory exists\n\n";

// Check each file
$missing = [];
$found = [];
$invalid = [];

foreach ($requiredFiles as $filename) {
    $filepath = $signatureDir . $filename;
    
    if (!file_exists($filepath)) {
        $missing[] = $filename;
        echo "✗ Missing: $filename\n";
    } else {
        // Check if it's a valid image
        $imageInfo = @getimagesize($filepath);
        if ($imageInfo === false) {
            $invalid[] = $filename;
            echo "⚠ Invalid: $filename (not a valid image)\n";
        } else {
            $found[] = $filename;
            $size = filesize($filepath);
            $sizeKB = round($size / 1024, 2);
            echo "✓ Found: $filename ({$imageInfo[0]}x{$imageInfo[1]}px, {$sizeKB}KB)\n";
        }
    }
}

// Summary
echo "\n=== Summary ===\n";
echo "Total required: " . count($requiredFiles) . "\n";
echo "Found: " . count($found) . " ✓\n";
echo "Missing: " . count($missing) . " ✗\n";
echo "Invalid: " . count($invalid) . " ⚠\n";

if (count($missing) > 0) {
    echo "\n=== Missing Files ===\n";
    foreach ($missing as $file) {
        echo "  - $file\n";
    }
    echo "\nTo create placeholder files, run:\n";
    echo "  php create-placeholder-signatures.php\n";
}

if (count($invalid) > 0) {
    echo "\n=== Invalid Files ===\n";
    foreach ($invalid as $file) {
        echo "  - $file\n";
    }
    echo "\nThese files exist but are not valid images.\n";
    echo "Please replace them with proper PNG files.\n";
}

if (count($missing) === 0 && count($invalid) === 0) {
    echo "\n✓ All signature files are present and valid!\n";
    echo "You can now generate PDFs with signatures.\n";
}

echo "\n";
?>
