# Install Arial Unicode MS for Dompdf

## Problem
Dompdf cannot use fonts without font metrics files (.ufm.json). Even though ARIALUNI.ttf exists, Dompdf doesn't see it.

## Solution
Run the font metrics generator script **on your server**.

## Installation Steps

### 1. Upload the font file (if not already done)
```bash
# Make sure ARIALUNI.ttf is in the fonts directory
ls -la /home/stanforteedge/domains/staff.stanforteedge.com/public_html/wp-content/plugins/stanforte/fonts/ARIALUNI.ttf
```

### 2. Run the metrics generator script
```bash
cd /home/stanforteedge/domains/staff.stanforteedge.com/public_html/wp-content/plugins/stanforte/fonts
php generate-arial-metrics.php
```

### 3. Pre-generate font metrics (IMPORTANT!)
```bash
cd /home/stanforteedge/domains/staff.stanforteedge.com/public_html/wp-content/plugins/stanforte/fonts
php pregenerate-metrics.php
```

This step is **crucial** - it generates the actual font metrics files that eliminate PHP warnings.

**Note:** Both scripts must be run on your server, not locally, as they need access to the theme's vendor autoloader.

### 4. Verify the metrics file was created
```bash
ls -la arial*.ufm*
ls -la installed-fonts.json
```

### 5. Set proper permissions
```bash
chmod 644 ARIALUNI.ttf
chmod 644 arial*.ufm*
chmod 644 installed-fonts.json
chmod 755 .
```

### 6. Test PDF generation
Generate a PDF and check the logs. You should see:
```
Available font families in Dompdf: ..., arial
Arial font family found!
PDF Font Used: Arial Unicode MS
```
**And no PHP warnings!**

## Expected Files After Installation
- `ARIALUNI.ttf` - The font file (23MB)
- `arial_normal.ufm` or `arial_normal.ufm.json` - Font metrics (generated automatically)
- `installed-fonts.json` - Font registry

## Troubleshooting

If Arial still doesn't appear:
1. Check file permissions (web server must be able to read)
2. Clear any Dompdf cache
3. Restart PHP-FPM if using it
4. Check error logs for font loading errors
5. **Make sure to run `pregenerate-metrics.php`** - this is the key step!

