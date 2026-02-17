# Modular Architecture: Core vs Modules

## 🎯 **Your Current Architecture (Perfect!)**

```
/plugin/
├── Core/                           ← REUSABLE FOUNDATION
│   ├── Requests/                   ← Generic request system
│   ├── Workflow/                   ← Generic approval engine
│   ├── FileStorage/                ← File management
│   ├── Notification/               ← Notifications
│   ├── Auth/                       ← Authentication
│   └── User/                       ← User management
│
└── Modules/                        ← SPECIFIC IMPLEMENTATIONS
    ├── Finance/                    ← Financial operations
    ├── HR/                         ← HR operations
    │   ├── Attendance/
    │   └── Employee/
    └── Admin/                      ← Admin operations
```

---

## ✅ **YES! Your Design is Correct**

### **Core/Requests = Generic Request System**
- Handles ANY type of request
- Provides base functionality
- Module-agnostic
- Reusable across all modules

### **Modules/Finance = Specific Implementation**
- Uses Core/Requests
- Adds finance-specific features
- Extends with Payment Vouchers
- Adds retirement tracking

---

## 🏗️ **Recommended Architecture**

### **CORE (Foundation Layer)**

#### **Core/Requests - Generic Request System**
```
Core/Requests/
├── Models/
│   ├── RequestGroup.php           ← Generic groups (FIN, HR, IT)
│   ├── RequestType.php            ← Generic types
│   ├── RequestInstance.php        ← Generic request
│   └── RequestItem.php            ← Generic items
├── Services/
│   ├── RequestService.php         ← CRUD operations
│   └── RequestWorkflowAdapter.php ← Workflow integration
├── Controllers/
│   └── RequestController.php      ← Base endpoints
└── Routes/
    └── routes.php                 ← Base routes
```

**What it does:**
- ✅ Create/read/update/delete requests
- ✅ Submit for approval
- ✅ Track status
- ✅ Workflow integration
- ✅ File attachments
- ✅ Comments/notes

**What it DOESN'T do:**
- ❌ Payment processing (that's Finance module)
- ❌ Leave balance calculation (that's HR module)
- ❌ Asset tracking (that's IT module)

---

### **MODULES (Implementation Layer)**

#### **Modules/Finance - Financial Operations**

```
Modules/Finance/
├── Models/
│   ├── PaymentVoucher.php         ← Finance-specific
│   ├── Retirement.php             ← Finance-specific
│   ├── Budget.php                 ← Finance-specific
│   ├── Account.php                ← Finance-specific
│   └── Transaction.php            ← Finance-specific
├── Services/
│   ├── PaymentVoucherService.php  ← Extends RequestService
│   ├── RetirementService.php      ← Finance logic
│   ├── BudgetService.php          ← Budget tracking
│   └── AccountingService.php      ← Accounting logic
├── Controllers/
│   ├── PaymentVoucherController.php
│   ├── RetirementController.php
│   └── BudgetController.php
├── Routes/
│   └── routes.php                 ← Finance routes
└── Traits/
    └── FinancialRequestTrait.php  ← Extends RequestInstance
```

**How it uses Core/Requests:**
```php
// Finance module EXTENDS core functionality
class PaymentVoucherService
{
    public static function createFromRequest($requestId)
    {
        // Use Core RequestService to get request
        $request = RequestInstance::find($requestId);
        
        // Add finance-specific logic
        $pv = new PaymentVoucher([
            'request_id' => $requestId,
            'amount' => $request->total_amount,
            // Finance-specific fields
        ]);
        
        return $pv;
    }
}
```

---

#### **Modules/HR - HR Operations**

```
Modules/HR/
├── Employee/
│   ├── Models/
│   │   └── Employee.php
│   └── Services/
│       └── EmployeeService.php
├── Attendance/
│   ├── Models/
│   │   └── Attendance.php
│   └── Services/
│       └── AttendanceService.php
└── Leave/                         ← NEW: Uses Core/Requests
    ├── Models/
    │   ├── LeaveBalance.php       ← HR-specific
    │   ├── LeavePolicy.php        ← HR-specific
    │   └── LeaveType.php          ← HR-specific
    ├── Services/
    │   └── LeaveService.php       ← Extends RequestService
    └── Controllers/
        └── LeaveController.php
```

**How it uses Core/Requests:**
```php
// HR module EXTENDS core functionality
class LeaveService
{
    public static function createLeaveRequest($data, $userId)
    {
        // Use Core RequestService
        $result = RequestService::createRequest([
            'request_type_id' => 'leave-request-type-id',
            'data' => $data
        ], $userId);
        
        // Add HR-specific logic
        if ($result['success']) {
            self::deductLeaveBalance($userId, $data['days']);
            self::notifyTeam($userId, $data['dates']);
        }
        
        return $result;
    }
}
```

---

## 🔗 **How Modules Extend Core**

### **Pattern 1: Composition (Recommended)**

**Module uses Core as a service:**

```php
// In Modules/Finance/Services/PaymentVoucherService.php

namespace App\Modules\Finance\Services;

use App\Core\Requests\Models\RequestInstance;
use App\Core\Requests\Services\RequestService;
use App\Modules\Finance\Models\PaymentVoucher;

class PaymentVoucherService
{
    /**
     * Create PV from approved request
     */
    public static function createFromRequest($requestId, $data, $userId)
    {
        // 1. Get request from Core
        $request = RequestInstance::find($requestId);
        
        // 2. Validate using Core service
        if ($request->status !== 'approved') {
            return ['success' => false, 'error' => 'Not approved'];
        }
        
        // 3. Add Finance-specific logic
        $pv = new PaymentVoucher([
            'request_id' => $requestId,
            'voucher_number' => self::generateVoucherNumber(),
            'amount' => $data['amount'],
            'funding_source' => $data['funding_source'],
            'account_code' => $data['account_code']
        ]);
        
        $pv->save();
        
        // 4. Update request status (Core model)
        $request->status = 'payment_pending';
        $request->save();
        
        return ['success' => true, 'payment_voucher' => $pv];
    }
}
```

---

### **Pattern 2: Traits (For Model Extension)**

**Add finance-specific methods to RequestInstance:**

```php
// In Modules/Finance/Traits/FinancialRequestTrait.php

namespace App\Modules\Finance\Traits;

use App\Modules\Finance\Models\PaymentVoucher;
use App\Modules\Finance\Models\Retirement;

trait FinancialRequestTrait
{
    /**
     * Get payment vouchers for this request
     */
    public function getPaymentVouchers()
    {
        $pvModel = new PaymentVoucher();
        return $pvModel->where('request_id', $this->id)->get();
    }
    
    /**
     * Get total paid amount
     */
    public function getTotalPaid()
    {
        $pvModel = new PaymentVoucher();
        return $pvModel->where('request_id', $this->id)
                       ->where('status', 'paid')
                       ->sum('amount');
    }
    
    /**
     * Get retirements for this request
     */
    public function getRetirements()
    {
        $retirementModel = new Retirement();
        return $retirementModel->where('request_id', $this->id)->get();
    }
    
    /**
     * Check if request needs retirement
     */
    public function needsRetirement()
    {
        return $this->getTotalPaid() > 0 && 
               $this->status === 'fully_paid';
    }
}
```

**Use trait in RequestInstance:**

```php
// In Core/Requests/Models/RequestInstance.php

namespace App\Core\Requests\Models;

use App\Modules\Finance\Traits\FinancialRequestTrait;

class RequestInstance extends BaseModel
{
    use FinancialRequestTrait; // Add finance methods
    
    // ... existing code
}
```

---

### **Pattern 3: Hooks/Events (For Loose Coupling)**

**Core fires events, modules listen:**

```php
// In Core/Requests/Services/RequestService.php

public static function submitRequest($requestId, $userId)
{
    // ... submit logic
    
    // Fire event
    do_action('request_submitted', $requestId, $userId);
    
    return $result;
}
```

```php
// In Modules/Finance/FinanceModule.php

class FinanceModule
{
    public static function init()
    {
        // Listen to core events
        add_action('request_submitted', [self::class, 'onRequestSubmitted'], 10, 2);
        add_action('request_approved', [self::class, 'onRequestApproved'], 10, 2);
    }
    
    public static function onRequestApproved($requestId, $userId)
    {
        $request = RequestInstance::find($requestId);
        
        // Only handle financial requests
        if ($request->getGroup()->code === 'FIN') {
            // Auto-create payment voucher placeholder
            PaymentVoucherService::createPlaceholder($requestId);
        }
    }
}
```

---

## 📊 **Database Architecture**

### **Core Tables (Generic):**
```sql
sta_request_groups          ← Generic groups
sta_request_types           ← Generic types
sta_request_instances       ← Generic requests
sta_request_items           ← Generic items
sta_workflow_instances      ← Generic workflows
sta_workflow_history        ← Generic approvals
```

### **Finance Module Tables:**
```sql
sta_finance_payment_vouchers     ← Finance-specific
sta_finance_payment_voucher_items
sta_finance_retirements
sta_finance_retirement_receipts
sta_finance_budgets
sta_finance_accounts
sta_finance_transactions
```

### **HR Module Tables:**
```sql
sta_hr_leave_balances       ← HR-specific
sta_hr_leave_policies
sta_hr_leave_types
sta_hr_employees
sta_hr_attendance
```

**Note:** Finance and HR tables REFERENCE core tables via foreign keys!

```sql
-- Finance table references Core
CREATE TABLE sta_finance_payment_vouchers (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,  ← Links to Core
    -- Finance-specific fields
    FOREIGN KEY (request_id) REFERENCES sta_request_instances(id)
);
```

---

## 🎯 **Recommended Structure for Payment Vouchers**

### **Option A: Payment Voucher in Finance Module (RECOMMENDED)**

```
Core/Requests/              ← Generic request system
    ↓ (used by)
Modules/Finance/            ← Payment Voucher here
    ├── PaymentVoucher
    ├── Retirement
    └── Budget
```

**Why?**
- ✅ Payment Voucher is finance-specific
- ✅ Not all requests need payment vouchers (e.g., Leave requests)
- ✅ Keeps Core clean and reusable
- ✅ Finance module owns financial logic

---

### **Option B: Payment Voucher in Core (Alternative)**

```
Core/Requests/
    ├── RequestInstance     ← Generic
    ├── PaymentVoucher      ← Generic payment tracking
    └── Retirement          ← Generic retirement
        ↓ (extended by)
Modules/Finance/
    ├── FinancialPaymentVoucher  ← Finance-specific extensions
    └── BudgetTracking
```

**Why?**
- ✅ Other modules might need payment tracking (IT equipment, etc.)
- ✅ Generic payment concept
- ❌ But adds complexity to Core

---

## 🚀 **Recommended Implementation**

### **Phase 1: Keep Core Clean**

**Core/Requests stays generic:**
- Request creation
- Approval workflow
- Status tracking
- File attachments

**Modules/Finance adds specifics:**
- Payment Vouchers
- Retirement
- Budget tracking
- Accounting integration

---

### **Phase 2: Module Structure**

```
Modules/Finance/
├── Models/
│   ├── PaymentVoucher.php
│   ├── PaymentVoucherItem.php
│   ├── Retirement.php
│   ├── RetirementReceipt.php
│   ├── Budget.php
│   └── Account.php
├── Services/
│   ├── PaymentVoucherService.php
│   ├── RetirementService.php
│   └── BudgetService.php
├── Controllers/
│   ├── PaymentVoucherController.php
│   └── RetirementController.php
├── Routes/
│   └── routes.php
├── Migrations/
│   └── Migration_Finance_1_0_0_PaymentVoucherTables.php
└── FinanceModule.php          ← Module initializer
```

---

### **Phase 3: Module Initialization**

```php
// In Modules/Finance/FinanceModule.php

namespace App\Modules\Finance;

class FinanceModule
{
    public static function init()
    {
        // Register routes
        self::registerRoutes();
        
        // Listen to core events
        self::registerHooks();
        
        // Add finance methods to RequestInstance
        self::extendCoreModels();
    }
    
    private static function registerRoutes()
    {
        // Load finance routes
        require_once __DIR__ . '/Routes/routes.php';
    }
    
    private static function registerHooks()
    {
        // Listen to request approval
        add_action('request_approved', function($requestId) {
            $request = \App\Core\Requests\Models\RequestInstance::find($requestId);
            
            // Only for financial requests
            if ($request->getGroup()->code === 'FIN') {
                // Create PV placeholder
                \App\Modules\Finance\Services\PaymentVoucherService::createPlaceholder($requestId);
            }
        });
    }
    
    private static function extendCoreModels()
    {
        // Add finance methods to RequestInstance
        // (via trait or dynamic methods)
    }
}
```

```php
// In plugin main file or Init.php
FinanceModule::init();
```

---

## 📋 **Module Registration**

### **Update Routes Loader:**

```php
// In Routes/rest-api.php

$moduleRoutes = [
    // Core routes
    'Core/Auth/Routes/routes.php',
    'Core/Auth/Routes/Admin.php',
    'Core/Requests/Routes/routes.php',        ← Core requests
    
    // Module routes
    'Modules/Finance/Routes/routes.php',      ← Finance module
    'Modules/HR/Routes/routes.php',           ← HR module
    'Modules/Admin/Routes/routes.php',
];
```

---

## ✅ **Benefits of This Architecture**

### **1. Reusability**
```
Core/Requests used by:
- Finance (Payment Vouchers)
- HR (Leave Requests)
- IT (Equipment Requests)
- Admin (General Requests)
```

### **2. Separation of Concerns**
```
Core = Generic functionality
Modules = Specific implementations
```

### **3. Maintainability**
```
Bug in request system? Fix in Core
Bug in payment voucher? Fix in Finance module
```

### **4. Scalability**
```
Add new module? Just extend Core
No need to modify Core
```

### **5. Testability**
```
Test Core independently
Test modules independently
Clear boundaries
```

---

## 🎯 **Summary**

### **Your Architecture is PERFECT!**

**Core/Requests:**
- ✅ Generic request system
- ✅ Reusable across modules
- ✅ Handles approval workflow
- ✅ Module-agnostic

**Modules/Finance:**
- ✅ Uses Core/Requests
- ✅ Adds Payment Vouchers
- ✅ Adds Retirement
- ✅ Finance-specific logic

**Modules/HR:**
- ✅ Uses Core/Requests
- ✅ Adds Leave Balance
- ✅ Adds Leave Policies
- ✅ HR-specific logic

---

## 🚀 **Implementation Plan**

### **Step 1: Create Finance Module Structure**
```bash
mkdir -p Modules/Finance/{Models,Services,Controllers,Routes,Migrations}
```

### **Step 2: Create Payment Voucher in Finance Module**
```
Modules/Finance/Models/PaymentVoucher.php
Modules/Finance/Services/PaymentVoucherService.php
Modules/Finance/Controllers/PaymentVoucherController.php
```

### **Step 3: Link to Core Requests**
```php
// PaymentVoucher references RequestInstance
FOREIGN KEY (request_id) REFERENCES sta_request_instances(id)
```

### **Step 4: Extend Core with Traits**
```php
// RequestInstance uses FinancialRequestTrait
use App\Modules\Finance\Traits\FinancialRequestTrait;
```

### **Step 5: Register Finance Module**
```php
// In Init.php or main plugin file
FinanceModule::init();
```

---

## 💡 **Key Principle**

**Core provides the foundation. Modules build on it.**

```
Core/Requests = Foundation (generic)
    ↓
Modules/Finance = Building (specific)
    ↓
Modules/HR = Building (specific)
    ↓
Modules/IT = Building (specific)
```

**No duplication. Maximum reusability. Clean architecture.** 🎉
