# Generic PDF Generation System - Proposal

## 🎯 **Goal:**
Create a reusable PDF generation system in Core that can be used by:
- Requests module
- Finance module (Payment Vouchers, Invoices)
- HR module (Payslips, Letters, Certificates)
- Any other module that needs PDF generation

---

## 📊 **Current State:**

### **What Exists:**
1. ✅ **Core/Document** - Document management (not PDF generation)
2. ✅ **Temporary PDF in Requests** - Form-based PDF generation
   - `generatePdfFromForm()` - Request PDF
   - `generatePaymentVoucher()` - PV PDF
   - Uses Dompdf library
   - **DO NOT TOUCH** (temporary system)

### **What's Missing:**
- ❌ Generic PDF generation service
- ❌ Template system for PDFs
- ❌ Reusable PDF components

---

## 🏗️ **Proposed Architecture:**

```
Core/PDF/                          ← NEW: Generic PDF System
├── Services/
│   ├── PdfService.php            ← Main PDF generation service
│   └── PdfTemplateEngine.php     ← Template rendering
├── Templates/
│   ├── base.php                  ← Base PDF template
│   ├── components/
│   │   ├── header.php            ← Reusable header
│   │   ├── footer.php            ← Reusable footer
│   │   ├── table.php             ← Reusable table
│   │   ├── signature-block.php   ← Reusable signatures
│   │   └── approval-flow.php     ← Reusable approval section
│   └── layouts/
│       ├── letter.php            ← Letter layout
│       ├── invoice.php           ← Invoice layout
│       └── report.php            ← Report layout
└── Traits/
    └── GeneratesPdf.php          ← Trait for models

Modules use Core/PDF:
├── Requests/
│   └── Templates/
│       └── request-pdf.php       ← Request-specific template
├── Finance/
│   └── Templates/
│       ├── payment-voucher.php   ← PV template
│       ├── invoice.php           ← Invoice template
│       └── receipt.php           ← Receipt template
└── HR/
    └── Templates/
        ├── payslip.php           ← Payslip template
        └── certificate.php       ← Certificate template
```

---

## 🎨 **Design Principles:**

### **1. Separation of Concerns:**
```
Core/PDF/           ← Generic PDF engine
    ↓ (used by)
Modules/            ← Module-specific templates
```

### **2. Template-Based:**
```php
// Modules provide templates
$pdf = PdfService::generate([
    'template' => 'requests/request-pdf',
    'data' => $requestData,
    'layout' => 'letter'
]);
```

### **3. Component-Based:**
```php
// Reusable components
<?php PdfComponents::header($logo, $title); ?>
<?php PdfComponents::table($items); ?>
<?php PdfComponents::signatureBlock($approvers); ?>
<?php PdfComponents::footer($pageNumber); ?>
```

---

## 📋 **Implementation Plan:**

### **Step 1: Create Core/PDF Structure**
```bash
mkdir -p Core/PDF/{Services,Templates/{components,layouts},Traits}
```

### **Step 2: Create PdfService**
```php
// Core/PDF/Services/PdfService.php

class PdfService
{
    /**
     * Generate PDF from template
     */
    public static function generate($config)
    {
        // 1. Load template
        // 2. Render with data
        // 3. Generate PDF
        // 4. Return PDF or save to file
    }
    
    /**
     * Generate and download PDF
     */
    public static function download($config, $filename)
    {
        // Generate and force download
    }
    
    /**
     * Generate and save PDF
     */
    public static function save($config, $path)
    {
        // Generate and save to file system
    }
    
    /**
     * Generate and return base64
     */
    public static function toBase64($config)
    {
        // Generate and return base64 string
    }
}
```

### **Step 3: Create Template Engine**
```php
// Core/PDF/Services/PdfTemplateEngine.php

class PdfTemplateEngine
{
    /**
     * Render template with data
     */
    public static function render($template, $data)
    {
        // Load template file
        // Pass data to template
        // Return rendered HTML
    }
    
    /**
     * Load component
     */
    public static function component($name, $data)
    {
        // Load reusable component
    }
    
    /**
     * Apply layout
     */
    public static function layout($layout, $content)
    {
        // Wrap content in layout
    }
}
```

### **Step 4: Create Reusable Components**

#### **Header Component:**
```php
// Core/PDF/Templates/components/header.php

<div class="pdf-header">
    <?php if ($logo): ?>
        <img src="<?= $logo ?>" alt="Logo" class="logo">
    <?php endif; ?>
    <h1><?= $title ?></h1>
    <?php if ($subtitle): ?>
        <p class="subtitle"><?= $subtitle ?></p>
    <?php endif; ?>
</div>
```

#### **Table Component:**
```php
// Core/PDF/Templates/components/table.php

<table class="pdf-table">
    <thead>
        <tr>
            <?php foreach ($columns as $col): ?>
                <th><?= $col['label'] ?></th>
            <?php endforeach; ?>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($rows as $row): ?>
            <tr>
                <?php foreach ($columns as $col): ?>
                    <td><?= $row[$col['key']] ?></td>
                <?php endforeach; ?>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
```

#### **Signature Block Component:**
```php
// Core/PDF/Templates/components/signature-block.php

<div class="signature-block">
    <?php foreach ($signers as $signer): ?>
        <div class="signature-item">
            <div class="signature-label"><?= $signer['label'] ?></div>
            <div class="signature-name"><?= $signer['name'] ?></div>
            <?php if ($signer['signature']): ?>
                <img src="<?= $signer['signature'] ?>" class="signature-img">
            <?php endif; ?>
            <div class="signature-date"><?= $signer['date'] ?></div>
        </div>
    <?php endforeach; ?>
</div>
```

#### **Approval Flow Component:**
```php
// Core/PDF/Templates/components/approval-flow.php

<div class="approval-flow">
    <h3>Approval History</h3>
    <?php foreach ($approvals as $approval): ?>
        <div class="approval-step">
            <span class="approval-icon">✓</span>
            <span class="approval-role"><?= $approval['role'] ?></span>
            <span class="approval-name"><?= $approval['name'] ?></span>
            <span class="approval-date"><?= $approval['date'] ?></span>
            <?php if ($approval['signature']): ?>
                <img src="<?= $approval['signature'] ?>" class="approval-signature">
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>
```

---

## 🔧 **Usage Examples:**

### **Example 1: Request PDF (Generic)**
```php
// In RequestController.php

public static function generateRequestPdf(WP_REST_Request $request)
{
    $requestId = $request->get_param('id');
    
    // Get request data from database
    $requestInstance = new RequestInstance();
    $requestData = $requestInstance->find($requestId);
    
    // Get approval history
    $workflowInstance = $requestData->getWorkflowInstance();
    $approvals = $workflowInstance->getHistory();
    
    // Generate PDF using Core/PDF
    $pdf = PdfService::generate([
        'template' => 'requests/request-pdf',
        'layout' => 'letter',
        'data' => [
            'request' => $requestData,
            'items' => $requestData->getItems(),
            'approvals' => $approvals,
            'creator' => $requestData->getCreator()
        ],
        'options' => [
            'orientation' => 'portrait',
            'size' => 'A4'
        ]
    ]);
    
    return PdfService::download($pdf, "Request-{$requestData->request_number}.pdf");
}
```

### **Example 2: Payment Voucher PDF (Finance Module)**
```php
// In Modules/Finance/Controllers/PaymentVoucherController.php

public static function generatePdf(WP_REST_Request $request)
{
    $pvId = $request->get_param('id');
    
    // Get PV data from database
    $pv = PaymentVoucher::find($pvId);
    $requestData = $pv->getRequest();
    
    // Generate PDF using Core/PDF
    $pdf = PdfService::generate([
        'template' => 'finance/payment-voucher',
        'layout' => 'invoice',
        'data' => [
            'voucher' => $pv,
            'request' => $requestData,
            'items' => $pv->getItems(),
            'prepared_by' => $pv->getPreparedBy(),
            'approved_by' => $pv->getApprovedBy()
        ]
    ]);
    
    return PdfService::download($pdf, "PV-{$pv->voucher_number}.pdf");
}
```

### **Example 3: HR Payslip (HR Module)**
```php
// In Modules/HR/Controllers/PayrollController.php

public static function generatePayslip(WP_REST_Request $request)
{
    $payslipId = $request->get_param('id');
    
    // Get payslip data
    $payslip = Payslip::find($payslipId);
    
    // Generate PDF using Core/PDF
    $pdf = PdfService::generate([
        'template' => 'hr/payslip',
        'layout' => 'letter',
        'data' => [
            'employee' => $payslip->getEmployee(),
            'period' => $payslip->period,
            'earnings' => $payslip->getEarnings(),
            'deductions' => $payslip->getDeductions(),
            'net_pay' => $payslip->net_pay
        ]
    ]);
    
    return PdfService::download($pdf, "Payslip-{$payslip->period}.pdf");
}
```

---

## 🎯 **Benefits:**

### **1. Reusability:**
- ✅ Write once, use everywhere
- ✅ Consistent PDF styling across modules
- ✅ Shared components (header, footer, signatures)

### **2. Maintainability:**
- ✅ Update component once, affects all PDFs
- ✅ Centralized PDF logic
- ✅ Easy to debug

### **3. Flexibility:**
- ✅ Modules can customize templates
- ✅ Multiple layouts available
- ✅ Easy to add new PDF types

### **4. Separation:**
- ✅ Core provides engine
- ✅ Modules provide templates
- ✅ No duplication

---

## 📊 **Migration Strategy:**

### **Phase 1: Build Core/PDF (Week 1 Day 4)**
- Create PdfService
- Create PdfTemplateEngine
- Create base components
- Create base layouts

### **Phase 2: Migrate Request PDF (Week 1 Day 4)**
- Create request template using Core/PDF
- Update RequestController to use PdfService
- Test with database data
- **Keep temporary system untouched**

### **Phase 3: Finance Module (Week 2)**
- Create PV template
- Create Invoice template
- Use Core/PDF for all finance PDFs

### **Phase 4: Other Modules (Future)**
- HR payslips
- HR certificates
- Reports
- Invoices

---

## 🔒 **Safety Measures:**

### **Temporary System:**
```
✅ Keep generatePdfFromForm() - Untouched
✅ Keep generatePaymentVoucher() - Untouched
✅ Keep buildPdfHtml() - Untouched
✅ Keep buildPaymentVoucherHtml() - Untouched
```

### **New System:**
```
✅ Core/PDF/ - NEW
✅ generateRequestPdf() - NEW (uses Core/PDF)
✅ Separate routes - NEW
```

**Both systems run in parallel!**

---

## ✅ **Recommendation:**

**YES, build the generic PDF system!**

### **Why:**
1. **Reusable** - All modules benefit
2. **Maintainable** - Single source of truth
3. **Scalable** - Easy to add new PDF types
4. **Professional** - Consistent branding
5. **Future-proof** - Ready for HR, Finance, etc.

### **Implementation:**
- Day 4: Build Core/PDF foundation
- Day 4: Migrate Request PDF to use it
- Week 2: Use for Finance module
- Future: Use for all modules

---

## 🚀 **Next Steps:**

1. Create `Core/PDF/` structure
2. Implement `PdfService`
3. Create base components
4. Create request template
5. Test with real data

**Ready to build?** 🎉
