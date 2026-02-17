# System Architecture Review & Recommendations

## 🎯 **Your Questions Answered**

---

## ✅ **Q1: Can accountant create Payment Voucher from within the request?**

**Answer: YES! That's exactly the design.**

### **How it Works:**

```
Accountant opens Request #REQ-00123
    ↓
Clicks "Payment Voucher" tab
    ↓
Sees: [Create Payment Voucher] button
    ↓
Fills PV form:
- Amount (can be partial)
- Payment method
- Funding source (if co-funded)
- Which items to pay for
    ↓
Clicks "Create"
    ↓
PV-00456 created and linked to REQ-00123
    ↓
Accountant can now mark as paid
```

**UI Flow:**
```
/requests/{id}
  ├─ Tab: Request Details (everyone)
  ├─ Tab: Payment Vouchers (accountant creates here)
  └─ Tab: Retirement (requester submits here)
```

---

## ✅ **Q2: Is this what "Disbursement" was trying to do?**

**Answer: YES, EXACTLY!**

### **What You Currently Have:**

Looking at your `RequestController.php`, I see:
- `disbursement_items` field
- Disbursement tracking in PDF
- Disbursement vs Retirement comparison
- Unreleased funds calculation

### **What "Disbursement" Means:**

```
Request (Approved)
    ↓
Disbursement (Money Released) ← This is Payment Voucher!
    ↓
Retirement (Receipts Submitted)
```

**Disbursement = Payment Voucher**

They're the same concept, just different names!

---

## 📊 **Current System Analysis**

### **What You Already Have:**

```
✅ Request system (sta_request_instances)
✅ Request items (sta_request_items)
✅ Workflow system (sta_workflow_instances)
✅ Approval tracking (sta_workflow_history)
✅ Disbursement concept in PDF
```

### **What's Missing:**

```
❌ Payment Voucher table (sta_payment_vouchers)
❌ Retirement table (sta_retirements)
❌ Receipt attachments (sta_retirement_receipts)
❌ Funding source tracking
❌ Partial payment tracking
```

---

## 🔧 **What Needs to Change**

### **1. Database Schema (New Tables)**

#### **Add Payment Voucher Table:**

```sql
CREATE TABLE sta_payment_vouchers (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,
    voucher_number VARCHAR(20) UNIQUE,
    
    -- Payment details
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date DATE,
    payee_name VARCHAR(255),
    
    -- Partial payment tracking
    is_partial_payment BOOLEAN DEFAULT FALSE,
    payment_sequence INT DEFAULT 1,
    total_payment_count INT DEFAULT 1,
    
    -- Co-funding tracking
    funding_source VARCHAR(100),
    account_code VARCHAR(50),
    program_id CHAR(36),
    percentage DECIMAL(5,2),
    
    -- Item-level tracking (which items this PV covers)
    items_covered JSON,
    
    -- Status
    status VARCHAR(32) DEFAULT 'pending',
    
    -- Approvals
    prepared_by BIGINT UNSIGNED,
    approved_by BIGINT UNSIGNED,
    prepared_date DATE,
    approved_date DATE,
    
    -- Audit
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES sta_request_instances(id) ON DELETE CASCADE,
    INDEX idx_request (request_id),
    INDEX idx_status (status),
    INDEX idx_voucher_number (voucher_number)
);

-- Track which items are covered by which PV
CREATE TABLE sta_payment_voucher_items (
    id CHAR(36) PRIMARY KEY,
    payment_voucher_id CHAR(36) NOT NULL,
    request_item_id CHAR(36) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    FOREIGN KEY (payment_voucher_id) REFERENCES sta_payment_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (request_item_id) REFERENCES sta_request_items(id) ON DELETE CASCADE,
    INDEX idx_pv (payment_voucher_id),
    INDEX idx_item (request_item_id)
);
```

#### **Add Retirement Table:**

```sql
CREATE TABLE sta_retirements (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,
    payment_voucher_id CHAR(36),
    
    -- Retirement details
    retired_by BIGINT UNSIGNED NOT NULL,
    retired_date DATE NOT NULL,
    total_receipts_amount DECIMAL(15,2) NOT NULL,
    balance_returned DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(32) DEFAULT 'pending',
    verified_by BIGINT UNSIGNED,
    verified_date DATE,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES sta_request_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_voucher_id) REFERENCES sta_payment_vouchers(id) ON DELETE SET NULL,
    INDEX idx_request (request_id),
    INDEX idx_pv (payment_voucher_id),
    INDEX idx_status (status)
);

-- Receipt attachments
CREATE TABLE sta_retirement_receipts (
    id CHAR(36) PRIMARY KEY,
    retirement_id CHAR(36) NOT NULL,
    file_id CHAR(36) NOT NULL,
    description VARCHAR(255),
    amount DECIMAL(15,2),
    receipt_date DATE,
    vendor_name VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (retirement_id) REFERENCES sta_retirements(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES sta_files(id) ON DELETE CASCADE,
    INDEX idx_retirement (retirement_id)
);
```

---

### **2. Update Request Status Flow**

#### **Current Status:**
```
draft → submitted → approved
```

#### **New Status (Enhanced):**
```
draft
  ↓
submitted
  ↓
approved
  ↓
payment_pending (PV created but not paid)
  ↓
partially_paid (some PVs paid)
  ↓
fully_paid (all PVs paid)
  ↓
pending_retirement (awaiting receipts)
  ↓
partially_retired (some items retired)
  ↓
fully_retired (all items retired)
  ↓
closed
```

#### **Update RequestInstance Model:**

```php
// Add to fillable
protected $fillable = [
    // ... existing fields
    'payment_status',
    'retirement_status',
    'total_paid',
    'total_retired',
];

// Add methods
public function getPaymentVouchers()
{
    $pvModel = new PaymentVoucher();
    return $pvModel->where('request_id', $this->id)->get();
}

public function getRetirements()
{
    $retirementModel = new Retirement();
    return $retirementModel->where('request_id', $this->id)->get();
}

public function getTotalPaid()
{
    $pvModel = new PaymentVoucher();
    return $pvModel->where('request_id', $this->id)
                   ->where('status', 'paid')
                   ->sum('amount');
}

public function getTotalRetired()
{
    $retirementModel = new Retirement();
    return $retirementModel->where('request_id', $this->id)
                           ->where('status', 'verified')
                           ->sum('total_receipts_amount');
}

public function getRemainingBalance()
{
    return $this->total_amount - $this->getTotalPaid();
}

public function getUnretiredAmount()
{
    return $this->getTotalPaid() - $this->getTotalRetired();
}
```

---

### **3. New Models Needed**

#### **PaymentVoucher Model:**

```php
<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;

class PaymentVoucher extends BaseModel
{
    protected $table = 'sta_payment_vouchers';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'request_id',
        'voucher_number',
        'amount',
        'payment_method',
        'payment_date',
        'payee_name',
        'is_partial_payment',
        'payment_sequence',
        'funding_source',
        'account_code',
        'items_covered',
        'status',
        'prepared_by',
        'approved_by',
        'created_by'
    ];
    
    protected $casts = [
        'items_covered' => 'array',
        'amount' => 'decimal:2',
        'is_partial_payment' => 'boolean',
        'payment_date' => 'date',
    ];
    
    public function getRequest()
    {
        return $this->belongsTo(RequestInstance::class, 'request_id');
    }
    
    public function getItems()
    {
        $pvItemModel = new PaymentVoucherItem();
        return $pvItemModel->where('payment_voucher_id', $this->id)->get();
    }
    
    public static function generateVoucherNumber()
    {
        global $wpdb;
        $year = date('Y');
        $prefix = "PV-{$year}-";
        
        $lastNumber = $wpdb->get_var($wpdb->prepare(
            "SELECT voucher_number FROM {$wpdb->prefix}sta_payment_vouchers 
             WHERE voucher_number LIKE %s 
             ORDER BY voucher_number DESC LIMIT 1",
            $prefix . '%'
        ));
        
        if ($lastNumber) {
            $number = (int)substr($lastNumber, -4) + 1;
        } else {
            $number = 1;
        }
        
        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
```

#### **Retirement Model:**

```php
<?php

namespace App\Core\Requests\Models;

use App\Utils\BaseModel;

class Retirement extends BaseModel
{
    protected $table = 'sta_retirements';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'request_id',
        'payment_voucher_id',
        'retired_by',
        'retired_date',
        'total_receipts_amount',
        'balance_returned',
        'status',
        'verified_by',
        'verified_date',
        'notes'
    ];
    
    protected $casts = [
        'total_receipts_amount' => 'decimal:2',
        'balance_returned' => 'decimal:2',
        'retired_date' => 'date',
        'verified_date' => 'date',
    ];
    
    public function getRequest()
    {
        return $this->belongsTo(RequestInstance::class, 'request_id');
    }
    
    public function getPaymentVoucher()
    {
        return $this->belongsTo(PaymentVoucher::class, 'payment_voucher_id');
    }
    
    public function getReceipts()
    {
        $receiptModel = new RetirementReceipt();
        return $receiptModel->where('retirement_id', $this->id)->get();
    }
}
```

---

### **4. New Services Needed**

#### **PaymentVoucherService:**

```php
<?php

namespace App\Core\Requests\Services;

use App\Core\Requests\Models\PaymentVoucher;
use App\Core\Requests\Models\RequestInstance;

class PaymentVoucherService
{
    /**
     * Create payment voucher from approved request
     */
    public static function createPaymentVoucher($requestId, $data, $userId)
    {
        // Validate request is approved
        $request = RequestInstance::find($requestId);
        if (!$request || $request->status !== 'approved') {
            return ['success' => false, 'error' => 'Request not approved'];
        }
        
        // Validate amount doesn't exceed remaining balance
        $remainingBalance = $request->getRemainingBalance();
        if ($data['amount'] > $remainingBalance) {
            return ['success' => false, 'error' => 'Amount exceeds remaining balance'];
        }
        
        // Generate voucher number
        $voucherNumber = PaymentVoucher::generateVoucherNumber();
        
        // Create payment voucher
        $pv = new PaymentVoucher([
            'id' => wp_generate_uuid4(),
            'request_id' => $requestId,
            'voucher_number' => $voucherNumber,
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'] ?? 'cash',
            'payee_name' => $data['payee_name'] ?? $request->getCreator()->display_name,
            'is_partial_payment' => $data['amount'] < $request->total_amount,
            'funding_source' => $data['funding_source'] ?? null,
            'account_code' => $data['account_code'] ?? null,
            'items_covered' => $data['items_covered'] ?? [],
            'status' => 'pending',
            'created_by' => $userId
        ]);
        
        if (!$pv->save()) {
            return ['success' => false, 'error' => 'Failed to create payment voucher'];
        }
        
        // Update request status
        $request->status = 'payment_pending';
        $request->save();
        
        return [
            'success' => true,
            'payment_voucher' => $pv,
            'voucher_number' => $voucherNumber
        ];
    }
    
    /**
     * Mark payment voucher as paid
     */
    public static function markAsPaid($pvId, $userId)
    {
        $pv = PaymentVoucher::find($pvId);
        if (!$pv) {
            return ['success' => false, 'error' => 'Payment voucher not found'];
        }
        
        $pv->status = 'paid';
        $pv->payment_date = date('Y-m-d');
        $pv->approved_by = $userId;
        $pv->approved_date = date('Y-m-d');
        $pv->save();
        
        // Update request payment status
        $request = $pv->getRequest();
        $totalPaid = $request->getTotalPaid();
        
        if ($totalPaid >= $request->total_amount) {
            $request->status = 'fully_paid';
        } else {
            $request->status = 'partially_paid';
        }
        $request->save();
        
        return ['success' => true, 'payment_voucher' => $pv];
    }
}
```

---

### **5. New Migration Needed**

Create: `Migration_1_2_2_PaymentVoucherAndRetirement.php`

```php
<?php

namespace App\Database\Migrations;

class Migration_1_2_2_PaymentVoucherAndRetirement
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();
        
        // Payment Vouchers table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_payment_vouchers` (
            id CHAR(36) PRIMARY KEY,
            request_id CHAR(36) NOT NULL,
            voucher_number VARCHAR(20) UNIQUE,
            amount DECIMAL(15,2) NOT NULL,
            payment_method VARCHAR(50),
            payment_date DATE,
            payee_name VARCHAR(255),
            is_partial_payment BOOLEAN DEFAULT FALSE,
            payment_sequence INT DEFAULT 1,
            total_payment_count INT DEFAULT 1,
            funding_source VARCHAR(100),
            account_code VARCHAR(50),
            program_id CHAR(36),
            percentage DECIMAL(5,2),
            items_covered JSON,
            status VARCHAR(32) DEFAULT 'pending',
            prepared_by BIGINT UNSIGNED,
            approved_by BIGINT UNSIGNED,
            prepared_date DATE,
            approved_date DATE,
            created_by BIGINT UNSIGNED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES {$wpdb->prefix}sta_request_instances(id) ON DELETE CASCADE,
            INDEX idx_request (request_id),
            INDEX idx_status (status),
            INDEX idx_voucher_number (voucher_number)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Payment Voucher Items table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_payment_voucher_items` (
            id CHAR(36) PRIMARY KEY,
            payment_voucher_id CHAR(36) NOT NULL,
            request_item_id CHAR(36) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_voucher_id) REFERENCES {$wpdb->prefix}sta_payment_vouchers(id) ON DELETE CASCADE,
            FOREIGN KEY (request_item_id) REFERENCES {$wpdb->prefix}sta_request_items(id) ON DELETE CASCADE,
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_item (request_item_id)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Retirements table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_retirements` (
            id CHAR(36) PRIMARY KEY,
            request_id CHAR(36) NOT NULL,
            payment_voucher_id CHAR(36),
            retired_by BIGINT UNSIGNED NOT NULL,
            retired_date DATE NOT NULL,
            total_receipts_amount DECIMAL(15,2) NOT NULL,
            balance_returned DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(32) DEFAULT 'pending',
            verified_by BIGINT UNSIGNED,
            verified_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES {$wpdb->prefix}sta_request_instances(id) ON DELETE CASCADE,
            FOREIGN KEY (payment_voucher_id) REFERENCES {$wpdb->prefix}sta_payment_vouchers(id) ON DELETE SET NULL,
            INDEX idx_request (request_id),
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_status (status)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Retirement Receipts table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_retirement_receipts` (
            id CHAR(36) PRIMARY KEY,
            retirement_id CHAR(36) NOT NULL,
            file_id CHAR(36) NOT NULL,
            description VARCHAR(255),
            amount DECIMAL(15,2),
            receipt_date DATE,
            vendor_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (retirement_id) REFERENCES {$wpdb->prefix}sta_retirements(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES {$wpdb->prefix}sta_files(id) ON DELETE CASCADE,
            INDEX idx_retirement (retirement_id)
        ) $charset_collate;";
        dbDelta($sql);
        
        error_log('Stanforte Edge: Payment Voucher and Retirement tables created');
    }
    
    public static function down()
    {
        global $wpdb;
        
        $tables = [
            'sta_retirement_receipts',
            'sta_retirements',
            'sta_payment_voucher_items',
            'sta_payment_vouchers'
        ];
        
        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }
}
```

---

## 🎯 **Adaptability Considerations**

### **1. Modular Design**
✅ **Already Good!** Your system is modular:
- Separate Request, Workflow, FileStorage modules
- Clean separation of concerns
- Easy to extend

### **2. Flexible Approval Flows**
✅ **Already Good!** You have:
- JSON-based approval flow configuration
- Dynamic workflow engine
- Role-based approvers

### **3. What to Add for More Adaptability:**

#### **A. Configurable Payment Rules**
```php
// In RequestType model
'payment_rules' => [
    'allow_partial_payments' => true,
    'allow_co_funding' => true,
    'require_retirement' => true,
    'retirement_deadline_days' => 30,
    'auto_approve_under' => 5000
]
```

#### **B. Custom Fields per Request Type**
```php
// Already have form_schema in RequestType
// Can add payment_schema for PV customization
'payment_schema' => [
    'fields' => [
        'bank_account' => ['type' => 'text', 'required' => true],
        'vendor_tin' => ['type' => 'text', 'required' => false]
    ]
]
```

#### **C. Pluggable Payment Methods**
```php
// Payment method registry
class PaymentMethodRegistry
{
    private static $methods = [
        'cash' => CashPaymentHandler::class,
        'bank_transfer' => BankTransferHandler::class,
        'cheque' => ChequePaymentHandler::class,
        'mobile_money' => MobileMoneyHandler::class
    ];
    
    public static function register($code, $handler)
    {
        self::$methods[$code] = $handler;
    }
}
```

---

## ✅ **Summary: What Needs to Change**

### **Database:**
1. ✅ Add `sta_payment_vouchers` table
2. ✅ Add `sta_payment_voucher_items` table
3. ✅ Add `sta_retirements` table
4. ✅ Add `sta_retirement_receipts` table
5. ✅ Update `sta_request_instances` with payment/retirement status fields

### **Models:**
1. ✅ Create `PaymentVoucher` model
2. ✅ Create `PaymentVoucherItem` model
3. ✅ Create `Retirement` model
4. ✅ Create `RetirementReceipt` model
5. ✅ Update `RequestInstance` model with new methods

### **Services:**
1. ✅ Create `PaymentVoucherService`
2. ✅ Create `RetirementService`
3. ✅ Update `RequestService` with payment/retirement logic

### **Controllers:**
1. ✅ Update `RequestController` with PV endpoints
2. ✅ Create `PaymentVoucherController` (optional, can be in RequestController)
3. ✅ Create `RetirementController` (optional)

### **Frontend:**
1. ✅ Add Payment Voucher tab to request detail page
2. ✅ Add Retirement tab to request detail page
3. ✅ Update request list to show payment status

### **Migration:**
1. ✅ Create `Migration_1_2_2_PaymentVoucherAndRetirement.php`
2. ✅ Run migration

---

## 🚀 **Your System is Already Great!**

**What you have:**
- ✅ Solid request system
- ✅ Flexible workflow engine
- ✅ Modular architecture
- ✅ Good separation of concerns

**What to add:**
- ✅ Payment Voucher tables and models
- ✅ Retirement tracking
- ✅ Enhanced status flow

**Your core is perfect. Just extend it!** 🎉
