# Hardcoded Names Configuration Guide

## ✅ **Where to Update Hardcoded Names**

All hardcoded names for signatures are configured in **ONE LOCATION** for easy management.

---

## 📍 **Location:**

**File:** `/plugin/Core/Requests/Controllers/RequestController.php`

**Line Numbers:** Around **578-581**

---

## 🔧 **How to Update:**

### **1. Payment Voucher Approvers**

Find this section in `buildPaymentVoucherHtml()` method:

```php
// Hardcoded approver names
$accountOfficerName = 'John Doe'; // Replace with actual Account Officer name
$cooName = 'Jane Smith'; // Replace with actual COO name
$edName = 'Robert Johnson'; // Replace with actual ED name
```

**Update these three lines with the actual names:**

```php
// Hardcoded approver names
$accountOfficerName = 'Actual Account Officer Name';
$cooName = 'Actual COO Name';
$edName = 'Actual ED Name';
```

---

### **2. Request Form Team Leads**

Team lead names are already configured in the same file around **line 923-930**:

```php
// Team lead names mapping
$teamLeadNames = [
    'Administration' => 'Team Lead - Administration',
    'IT' => 'Team Lead - IT',
    'Programs' => 'Team Lead - Programs',
    'Communications' => 'Team Lead - Communications',
    'Operations' => 'Team Lead - Operations'
];
```

**Update with actual team lead names:**

```php
// Team lead names mapping
$teamLeadNames = [
    'Administration' => 'John Smith',
    'IT' => 'Sarah Johnson',
    'Programs' => 'Michael Brown',
    'Communications' => 'Emily Davis',
    'Operations' => 'David Wilson'
];
```

---

## 📋 **Complete List of Names to Configure:**

### **Payment Voucher (PV):**
1. **Account Officer** - Line ~579
2. **COO** - Line ~580
3. **ED (Executive Director)** - Line ~581

### **Request Form:**
4. **Team Lead - Administration** - Line ~925
5. **Team Lead - IT** - Line ~926
6. **Team Lead - Programs** - Line ~927
7. **Team Lead - Communications** - Line ~928
8. **Team Lead - Operations** - Line ~929

### **Both Forms:**
9. **Account Officer** (Request) - Uses same signature as PV
10. **COO** (Request) - Uses same signature as PV
11. **ED** (Request) - Uses same signature as PV

---

## 🎯 **What Happens After Update:**

### **Payment Voucher PDF:**
```
┌─────────────────────────────────────┐
│ Approved By (Account Officer):      │
│ John Doe                            │
│ [Signature Image]                   │
│ Signature                           │
├─────────────────────────────────────┤
│ Approved By (COO):                  │
│ Jane Smith                          │
│ [Signature Image]                   │
│ Signature                           │
└─────────────────────────────────────┘
```

### **Request Form PDF:**
```
┌─────────────────────────────────────┐
│ [✓] Team Lead - IT    09 Apr 2024   │
│ Sarah Johnson                        │
│ [Signature Image]                    │
├─────────────────────────────────────┤
│ [✓] Account Officer   10 Apr 2024   │
│ John Doe                             │
│ [Signature Image]                    │
└─────────────────────────────────────┘
```

---

## 🔐 **Signature Files Required:**

Make sure these signature PNG files exist in `/newTheme/assets/images/signatures/`:

### **Payment Voucher:**
- `account-officer.png`
- `coo.png`
- `ed.png`
- `prepared-by.png`
- `received-by.png`

### **Request Form:**
- `team-lead-administration.png`
- `team-lead-it.png`
- `team-lead-programs.png`
- `team-lead-communications.png`
- `team-lead-operations.png`
- `account-officer.png` (shared)
- `coo.png` (shared)
- `ed.png` (shared)

---

## 📝 **Quick Update Steps:**

1. **Open file:** `/plugin/Core/Requests/Controllers/RequestController.php`

2. **Find Payment Voucher names** (around line 578):
   ```php
   $accountOfficerName = 'Your Name Here';
   $cooName = 'Your Name Here';
   $edName = 'Your Name Here';
   ```

3. **Find Request Team Lead names** (around line 923):
   ```php
   $teamLeadNames = [
       'Administration' => 'Your Name Here',
       'IT' => 'Your Name Here',
       // ... etc
   ];
   ```

4. **Save file**

5. **Test both PDFs** to verify names appear correctly

---

## ⚠️ **Important Notes:**

1. **One Location** - All PV names are in one place (lines 578-581)
2. **Team Leads** - Different names for each team (lines 923-930)
3. **Signatures Match Names** - Ensure signature files match the person's name
4. **Case Sensitive** - File names are case-sensitive on Linux servers
5. **No Database** - These are hardcoded, not stored in database

---

## 🎨 **Name Display Format:**

### **Payment Voucher:**
- Shows name **above** signature box
- Format: `Full Name` (e.g., "John Doe")

### **Request Form:**
- Shows name **in approval box**
- Format: `Role - Team` or `Full Name` (e.g., "Team Lead - IT" or "Sarah Johnson")

---

## ✅ **Checklist:**

- [ ] Update Account Officer name (PV)
- [ ] Update COO name (PV)
- [ ] Update ED name (PV)
- [ ] Update Team Lead - Administration name (Request)
- [ ] Update Team Lead - IT name (Request)
- [ ] Update Team Lead - Programs name (Request)
- [ ] Update Team Lead - Communications name (Request)
- [ ] Update Team Lead - Operations name (Request)
- [ ] Upload all signature PNG files
- [ ] Test Payment Voucher PDF
- [ ] Test Request Form PDF
- [ ] Verify names and signatures match

---

## 🚀 **You're All Set!**

After updating the names in `RequestController.php` (lines 578-581 and 923-930), both PDFs will display the correct hardcoded names with their corresponding signature images.

**No form changes needed** - names are automatically pulled from the controller! 🎉
