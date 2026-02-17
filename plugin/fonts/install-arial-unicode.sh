#!/bin/bash

# Arial Unicode MS Font Installation Script
# This script helps locate and copy Arial Unicode MS font

echo "🔍 Searching for Arial Unicode MS font..."

# Check common locations
FONT_LOCATIONS=(
    "/Library/Fonts/Arial Unicode.ttf"
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
    "$HOME/Library/Fonts/Arial Unicode.ttf"
    "/usr/share/fonts/truetype/msttcorefonts/ARIALUNI.TTF"
)

FOUND=false

for location in "${FONT_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        echo "✅ Found Arial Unicode MS at: $location"
        echo "📋 Copying to plugin fonts directory..."
        cp "$location" "./ARIALUNI.TTF"
        chmod 644 "./ARIALUNI.TTF"
        echo "✅ Installation complete!"
        FOUND=true
        break
    fi
done

if [ "$FOUND" = false ]; then
    echo "❌ Arial Unicode MS not found on this system."
    echo ""
    echo "📥 Please download Arial Unicode MS manually:"
    echo "   1. From Windows: C:\\Windows\\Fonts\\ARIALUNI.TTF"
    echo "   2. From Mac: /Library/Fonts/Arial Unicode.ttf"
    echo "   3. Copy to: $(pwd)/ARIALUNI.TTF"
    echo ""
    echo "⚠️  Note: Ensure you have proper licensing for Arial Unicode MS"
    echo "🔄 Fallback: System will use DejaVu Sans (free, Unicode-enabled)"
fi
