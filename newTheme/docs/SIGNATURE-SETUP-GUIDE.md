# Signature Setup Guide - Fix "Box with X" Issue

## 🎯 **Problem:**
Logo shows but signatures show as "box with X" = **Signature PNG files are missing**

---

## ✅ **Solution: Create Signature Files**

### **Quick Fix (3 steps):**

#### **Step 1: Verify Current State**
```bash
cd /Users/olalekan/Projects/stanforteedge/portal/newTheme
php verify-signatures.php
```

This will show which files are missing.

---

#### **Step 2: Create Placeholder Signatures**
```bash
php create-placeholder-signatures.php
```

This creates all 10 required signature PNG files automatically.

---

#### **Step 3: Test PDF**
1. Go to Payment Voucher or Request form
2. Fill out and generate PDF
3. Signatures should now appear!

---

## 📋 **Why Logo Works But Signatures Don't:**

### **Logo Code (WORKING):**
```php
$logo_path = get_template_directory() . '/assets/images/logo.png';
if (file_exists($logo_path)) {  // ✓ File exists
    $logo_base64 = base64_encode(file_get_contents($logo_path));
    $logo_html = 'data:image/png;base64,' . $logo_base64;
}
```

### **Signature Code (NOT WORKING):**
```php
$filePath = $signaturePath . 'prepared-by.png';
if (file_exists($filePath)) {  // ✗ File doesn't exist
    $signatures['prepared_by'] = 'data:image/png;base64,' . base64_encode(file_get_contents($filePath));
} else {
    $signatures['prepared_by'] = '';  // Empty = box with X
}
```

**The structure is identical!** The only difference is:
- ✓ Logo file exists: `/assets/images/logo.png`
- ✗ Signature files don't exist: `/assets/images/signatures/*.png`

---

## 📁 **Required Files:**

All files must be in:
```
/newTheme/assets/images/signatures/
```

**File list:**
1. `prepared-by.png` - Oyinkansola Aje (Accountant)
2. `coo.png` - Olalekan Owonikoko (COO)
3. `ed.png` - Olusola Owonikoko (ED)
4. `account-officer.png` - Oyinkansola Aje
5. `received-by.png` - Received By
6. `team-lead-administration.png`
7. `team-lead-it.png`
8. `team-lead-programs.png`
9. `team-lead-communications.png`
10. `team-lead-operations.png`

---

## 🔍 **Check Debug Logs:**

After generating a PDF, check WordPress debug log:

```bash
tail -f /Users/olalekan/Projects/stanforteedge/portal/plugin/wp-content/debug.log
```

You'll see:
```
✗ Signature missing: /path/to/newTheme/assets/images/signatures/prepared-by.png
✗ Signature missing: /path/to/newTheme/assets/images/signatures/coo.png
✗ Signature missing: /path/to/newTheme/assets/images/signatures/ed.png
...
```

After creating files:
```
✓ Signature loaded: prepared-by.png
✓ Signature loaded: coo.png
✓ Signature loaded: ed.png
...
```

---

## 🎨 **Replace Placeholders with Real Signatures:**

Once placeholder signatures are working, replace them with real ones:

### **Method 1: Scan Physical Signatures**
1. Sign on white paper with black pen
2. Scan at 300 DPI
3. Open in image editor (Photoshop/GIMP/Photopea)
4. Crop to signature only
5. Remove background (make transparent or white)
6. Resize to 200x80 pixels
7. Save as PNG
8. Upload to `/assets/images/signatures/`

### **Method 2: Digital Signature**
1. Use tablet/iPad with stylus
2. Sign in signature app
3. Export as PNG
4. Resize to 200x80 pixels
5. Upload to `/assets/images/signatures/`

### **Method 3: Online Tools**
- **Remove background:** remove.bg
- **Edit images:** photopea.com (free Photoshop)
- **Create signature:** canva.com

---

## 📊 **File Specifications:**

```
Format:     PNG
Size:       200x80 pixels (width x height)
Background: Transparent or white
Color:      Black or dark blue ink
File size:  Under 100KB
DPI:        150-300 (for print quality)
```

---

## ✅ **Verification Checklist:**

Run verification script:
```bash
php verify-signatures.php
```

Expected output:
```
=== Signature Files Verification ===

Checking directory: /path/to/signatures/

✓ Directory exists

✓ Found: prepared-by.png (200x80px, 2.5KB)
✓ Found: coo.png (200x80px, 2.5KB)
✓ Found: ed.png (200x80px, 2.5KB)
✓ Found: account-officer.png (200x80px, 2.5KB)
✓ Found: received-by.png (200x80px, 2.5KB)
✓ Found: team-lead-administration.png (200x80px, 2.5KB)
✓ Found: team-lead-it.png (200x80px, 2.5KB)
✓ Found: team-lead-programs.png (200x80px, 2.5KB)
✓ Found: team-lead-communications.png (200x80px, 2.5KB)
✓ Found: team-lead-operations.png (200x80px, 2.5KB)

=== Summary ===
Total required: 10
Found: 10 ✓
Missing: 0 ✗
Invalid: 0 ⚠

✓ All signature files are present and valid!
```

---

## 🚀 **Quick Commands:**

```bash
# Navigate to theme folder
cd /Users/olalekan/Projects/stanforteedge/portal/newTheme

# Verify signatures
php verify-signatures.php

# Create placeholders
php create-placeholder-signatures.php

# Check files
ls -lh assets/images/signatures/

# View debug log
tail -f ../plugin/wp-content/debug.log
```

---

## 🎯 **Expected Result:**

### **Before (Box with X):**
```
[✓] COO: Olalekan Owonikoko    04 Dec 2024
    [X] ← Box with X
```

### **After (Signature Shows):**
```
[✓] COO: Olalekan Owonikoko    04 Dec 2024
    Olalekan Owonikoko ← Signature text/image
```

---

## 💡 **Pro Tips:**

1. **Test with placeholders first** - Make sure the system works
2. **Replace one at a time** - Easier to troubleshoot
3. **Keep backups** - Save original signature files
4. **Use consistent sizing** - All signatures same dimensions
5. **Optimize file size** - Compress to under 100KB

---

## ✅ **Summary:**

**The code is correct!** Logo and signatures use identical base64 encoding.

**The issue:** Signature PNG files don't exist yet.

**The fix:** Run `php create-placeholder-signatures.php`

**Then:** Replace placeholders with real signature scans.

**Done!** 🎉
