# Payment Voucher System - Setup Instructions

## ✅ What's Been Created:

### 1. **Payment Voucher Form**
- Location: `/newTheme/templates/pages/payment-voucher-form.php`
- Features:
  - Voucher number and date
  - Payee information
  - Payment details with auto-convert amount to words
  - Payment method selection (Cash/Transfer/Cheque)
  - Approval checkboxes (Account Officer, COO, ED optional)
  - Remarks field
  - Generate PV button

### 2. **PDF Generator**
- Location: `/plugin/Core/Requests/Controllers/RequestController.php`
- Method: `generatePaymentVoucher()`
- Features:
  - Professional PV layout matching your template
  - Embedded signatures (when available)
  - Unicode support (₦ symbol)
  - Auto-formatted dates and amounts

### 3. **API Endpoint**
- URL: `/wp-json/api/v1/requests/generate-pv`
- Method: POST
- Authentication: Public (no auth required for now)

### 4. **Signature System**
- Location: `/newTheme/assets/images/signatures/`
- Hardcoded signature images
- Auto-embedded in PDFs when approvals are checked

---

## 📋 **Next Steps:**

### **Step 1: Add Signature Images**

Place PNG signature images in `/newTheme/assets/images/signatures/`:

**Required files:**
- `account-officer.png`
- `coo.png`
- `ed.png`
- `prepared-by.png`
- `received-by.png` (optional - for payee signature)

**Image specs:**
- Format: PNG with transparent background
- Size: 200x80 pixels recommended
- Color: Black or dark blue ink
- Max file size: 100KB

### **Step 2: Create WordPress Page**

1. Go to WordPress Admin → Pages → Add New
2. Title: "Payment Voucher"
3. Template: Select "Payment Voucher Form"
4. Publish

### **Step 3: Test the System**

1. Visit the Payment Voucher page
2. Fill in the form
3. Click "Generate Payment Voucher"
4. PDF should download with:
   - All form data
   - Signatures (if images are uploaded)
   - Proper formatting

---

## 🔄 **What's Still Pending:**

### **Request Form Enhancements** (Next Phase):
1. Add signature fields to existing request form
2. Add dates to disbursement items
3. Add dates to approval checkmarks
4. Add team lead mapping
5. Update Request PDF to include signatures

---

## 🎯 **Usage:**

### **Payment Voucher Workflow:**
1. User fills PV form
2. Enters voucher number (e.g., PV/2024/001)
3. Adds payee details and amount
4. Selects payment method
5. Checks approval boxes
6. Clicks "Generate Payment Voucher"
7. PDF downloads with embedded signatures

### **Voucher Numbering:**
Suggested format: `PV/YEAR/NUMBER`
- Example: PV/2024/001, PV/2024/002, etc.

---

## 🔐 **Security Notes:**

1. Signature images should be:
   - Stored securely
   - Access restricted to authorized personnel
   - Not committed to public repositories

2. Consider adding authentication to the PV form later:
   - Currently public (`__return_true` permission)
   - Can be changed to require login/permissions

---

## 📞 **Support:**

If you encounter issues:
1. Check error logs for PDF generation errors
2. Verify signature images exist and are readable
3. Test with simple data first
4. Check browser console for JavaScript errors

---

## ✨ **Features:**

✅ Auto-convert amount to words (₦60,100 → "Sixty Thousand One Hundred Naira Only")
✅ Dynamic payment details (show only for Transfer/Cheque)
✅ Optional ED approval
✅ Professional PDF layout matching template
✅ Embedded logo and signatures
✅ Unicode support (₦ symbol)
✅ Responsive form design
