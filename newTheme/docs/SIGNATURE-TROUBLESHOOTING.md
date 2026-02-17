# Signature Images Not Showing - Troubleshooting Guide

## ❌ **Problem: Seeing Box with X instead of Signatures**

This means the signature image files don't exist or can't be loaded.

---

## 🔍 **Quick Diagnosis:**

The signature files are being looked for in:
```
/newTheme/assets/images/signatures/
```

**Required files:**
1. `prepared-by.png` - Accountant signature
2. `coo.png` - COO signature
3. `ed.png` - ED signature
4. `account-officer.png` - Account Officer signature
5. `team-lead-administration.png`
6. `team-lead-it.png`
7. `team-lead-programs.png`
8. `team-lead-communications.png`
9. `team-lead-operations.png`

---

## ✅ **Solution Steps:**

### **Step 1: Check if Folder Exists**

Run this in terminal:
```bash
ls -la /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/
```

**If folder doesn't exist:**
```bash
mkdir -p /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/
```

---

### **Step 2: Check File Permissions**

```bash
chmod 755 /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/
```

---

### **Step 3: Create Test Signature Files**

You have two options:

#### **Option A: Use Real Signatures**
1. Scan or photograph actual signatures
2. Convert to PNG format
3. Make transparent background
4. Resize to 200x80 pixels
5. Save as black/dark blue ink
6. Name files exactly as listed above
7. Upload to `/newTheme/assets/images/signatures/`

#### **Option B: Create Placeholder Text Images (for testing)**

Create simple text-based placeholders using ImageMagick:

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/

# Create placeholder signatures
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Oyinkansola Aje" prepared-by.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Olalekan Owonikoko" coo.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Olusola Owonikoko" ed.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Account Officer" account-officer.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Team Lead - Admin" team-lead-administration.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Team Lead - IT" team-lead-it.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Team Lead - Programs" team-lead-programs.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Team Lead - Comms" team-lead-communications.png
convert -size 200x80 xc:white -pointsize 20 -fill black -gravity center -annotate +0+0 "Team Lead - Ops" team-lead-operations.png
```

**Don't have ImageMagick?** Install it:
```bash
brew install imagemagick
```

---

### **Step 4: Verify Files Were Created**

```bash
ls -lh /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/
```

You should see:
```
-rw-r--r--  prepared-by.png
-rw-r--r--  coo.png
-rw-r--r--  ed.png
-rw-r--r--  account-officer.png
-rw-r--r--  team-lead-administration.png
-rw-r--r--  team-lead-it.png
-rw-r--r--  team-lead-programs.png
-rw-r--r--  team-lead-communications.png
-rw-r--r--  team-lead-operations.png
```

---

### **Step 5: Test PDF Generation**

1. Go to Payment Voucher form
2. Fill out form
3. Generate PDF
4. Check if signatures appear

---

## 🐛 **Debug: Check What's Being Loaded**

Add this temporary debug code to see what's happening:

**File:** `/plugin/Core/Requests/Controllers/RequestController.php`

**After line 545, add:**
```php
// DEBUG: Log signature loading
error_log('Signature Path: ' . $signaturePath);
error_log('Checking file: ' . $filePath);
if (file_exists($filePath)) {
    error_log('✓ File exists: ' . $filename);
} else {
    error_log('✗ File missing: ' . $filename);
}
```

Then check your error log:
```bash
tail -f /path/to/wordpress/wp-content/debug.log
```

---

## 📋 **Signature File Specifications:**

### **Format:**
- **Type:** PNG
- **Background:** Transparent (or white)
- **Size:** 200x80 pixels (width x height)
- **Color:** Black or dark blue ink
- **File size:** Under 100KB each

### **Quality:**
- **DPI:** 150-300 for print quality
- **Compression:** PNG-8 or PNG-24
- **Transparency:** Alpha channel supported

---

## 🎨 **Creating Real Signatures:**

### **Method 1: Scan**
1. Sign on white paper with black pen
2. Scan at 300 DPI
3. Open in Photoshop/GIMP
4. Remove background (make transparent)
5. Resize to 200x80px
6. Save as PNG

### **Method 2: Digital Signature**
1. Use iPad/tablet with stylus
2. Sign in signature app
3. Export as PNG
4. Resize to 200x80px
5. Ensure transparent background

### **Method 3: Online Tools**
- Use websites like:
  - remove.bg (remove background)
  - photopea.com (free Photoshop alternative)
  - canva.com (create signature)

---

## ✅ **Quick Test Files**

Create a simple test file to verify the path is correct:

```bash
# Create a simple red square as test
convert -size 200x80 xc:red /Users/olalekan/Projects/stanforteedge/portal/newTheme/assets/images/signatures/test.png
```

Then temporarily change one signature filename in the code to `test.png` and see if it shows.

---

## 🔍 **Common Issues:**

### **Issue 1: Wrong Path**
```
Error: /assets/images/signatures/ not found
```
**Solution:** Check `get_template_directory()` returns correct path

### **Issue 2: File Permissions**
```
Error: Permission denied
```
**Solution:** 
```bash
chmod 644 /path/to/signatures/*.png
```

### **Issue 3: File Format**
```
Error: Invalid image format
```
**Solution:** Ensure files are actual PNG, not renamed JPG

### **Issue 4: File Size Too Large**
```
Error: Memory limit exceeded
```
**Solution:** Compress images to under 100KB each

---

## 📊 **Verification Checklist:**

- [ ] Folder `/newTheme/assets/images/signatures/` exists
- [ ] Folder has correct permissions (755)
- [ ] All 9 PNG files are present
- [ ] Files are actual PNG format (not renamed)
- [ ] Files are under 100KB each
- [ ] Files are 200x80 pixels (or similar ratio)
- [ ] Files have read permissions (644)
- [ ] WordPress can access the files
- [ ] No PHP errors in error log

---

## 🚀 **After Fixing:**

Once signature files are in place:
1. Clear browser cache
2. Regenerate PDF
3. Signatures should appear
4. Replace placeholder signatures with real ones

---

## 💡 **Pro Tip:**

Create a `README.txt` in the signatures folder:
```
Signature Image Requirements:
- Format: PNG
- Size: 200x80 pixels
- Background: Transparent
- Color: Black/Dark Blue
- Max file size: 100KB
- Names must match exactly (lowercase, hyphens)
```

---

## ✅ **Expected Result:**

After adding signature files, you should see actual signature images instead of the box with X.

**Test with placeholder images first, then replace with real signatures!** 🎉
