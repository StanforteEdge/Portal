# Integration Guide: Request & Approval System with Core Workflow

## 🎯 **Overview**

You have a **complete Request & Approval system** already built! Here's how to integrate the temporary PDF generation with the existing core system.

---

## 📊 **Current Architecture**

### **Database Tables:**
```
sta_request_groups          → Request categories (Financial, HR, etc.)
sta_request_types           → Types of requests (Petty Cash, Leave, etc.)
sta_request_instances       → Actual request submissions
sta_request_items           → Line items in requests
sta_workflow_instances      → Approval workflow instances
sta_workflow_steps          → Approval steps
sta_workflow_history        → Approval history/audit trail
```

### **Models:**
- `RequestGroup` - Groups requests by category
- `RequestType` - Defines request types with approval flows
- `RequestInstance` - Individual request submissions
- `RequestItem` - Items within a request
- `WorkflowInstance` - Approval workflow
- `WorkflowStep` - Individual approval steps
- `WorkflowHistory` - Approval audit trail

### **Services:**
- `RequestService` - Business logic for requests
- `RequestWorkflowAdapter` - Connects requests to workflow engine
- `WorkflowService` - Manages workflow execution

---

## 🔄 **How the System Works Now**

### **1. Request Submission Flow:**
```
User creates request
    ↓
RequestService.createRequest()
    ↓
RequestInstance saved (status: 'draft')
    ↓
User submits request
    ↓
RequestService.submitRequest()
    ↓
RequestWorkflowAdapter.createApprovalWorkflow()
    ↓
WorkflowInstance created
    ↓
Request status: 'submitted'
```

### **2. Approval Flow:**
```
Approver receives notification
    ↓
RequestWorkflowAdapter.processWorkflowAction()
    ↓
WorkflowInstance.moveToNextStep()
    ↓
WorkflowHistory records approval
    ↓
If final step → Request status: 'approved'
If rejected → Request status: 'rejected'
```

---

## 🎯 **Integration Strategy**

### **Phase 1: Connect PDF Generation to Request System**

Instead of temporary hardcoded forms, pull data from `RequestInstance`:

**Current (Temporary):**
```php
// Hardcoded form data
$formData = [
    'voucher_number' => $_POST['voucher_number'],
    'payee_name' => $_POST['payee_name'],
    // ...
];
```

**Integrated:**
```php
// Load from database
$requestInstance = new RequestInstance();
$request = $requestInstance->find($requestId);

$formData = [
    'request_number' => $request->getFormattedRequestNumber(),
    'created_by' => $request->getCreator()->display_name,
    'team' => $request->data['team'] ?? '',
    'items' => $request->getItems(),
    'total_amount' => $request->total_amount,
    // ...
];
```

---

### **Phase 2: Connect Approvals to Workflow**

**Current (Temporary):**
```php
// Hardcoded approvals
$approvals = [
    'sent' => $_POST['sent'] ?? false,
    'team_lead' => $_POST['team_lead'] ?? false,
    'account_officer' => $_POST['account_officer'] ?? false,
    'coo' => $_POST['coo'] ?? false,
    'ed' => $_POST['ed'] ?? false,
];
```

**Integrated:**
```php
// Load from workflow history
$workflowInstance = $request->getWorkflowInstance();
$history = $workflowInstance->getHistory();

$approvals = [
    'sent' => $request->status !== 'draft',
    'sent_date' => $request->created_at,
    'team_lead' => self::isStepApproved($history, 'team_lead'),
    'team_lead_date' => self::getStepApprovalDate($history, 'team_lead'),
    'account_officer' => self::isStepApproved($history, 'account_officer'),
    'account_officer_date' => self::getStepApprovalDate($history, 'account_officer'),
    'coo' => self::isStepApproved($history, 'coo'),
    'coo_date' => self::getStepApprovalDate($history, 'coo'),
    'ed' => self::isStepApproved($history, 'ed'),
    'ed_date' => self::getStepApprovalDate($history, 'ed'),
];
```

---

## 💻 **Implementation Steps**

### **Step 1: Add Helper Methods to RequestController**

Add these methods to extract approval data from workflow:

```php
/**
 * Check if a workflow step is approved
 */
private static function isStepApproved($history, $stepRole)
{
    foreach ($history as $record) {
        $config = json_decode($record->config ?? '{}', true);
        if (isset($config['role']) && $config['role'] === $stepRole) {
            return $record->action === 'approve';
        }
    }
    return false;
}

/**
 * Get approval date for a workflow step
 */
private static function getStepApprovalDate($history, $stepRole)
{
    foreach ($history as $record) {
        $config = json_decode($record->config ?? '{}', true);
        if (isset($config['role']) && $config['role'] === $stepRole) {
            return $record->created_at;
        }
    }
    return null;
}

/**
 * Get approver name for a workflow step
 */
private static function getStepApprover($history, $stepRole)
{
    foreach ($history as $record) {
        $config = json_decode($record->config ?? '{}', true);
        if (isset($config['role']) && $config['role'] === $stepRole) {
            $user = new \App\Core\User\Models\User();
            $approver = $user->find($record->performed_by);
            return $approver ? $approver->display_name : 'Unknown';
        }
    }
    return null;
}
```

---

### **Step 2: Update PDF Generation Endpoints**

**Current endpoint:**
```php
POST /wp-json/api/v1/requests/generate-pv
Body: { voucher_number, payee_name, items, ... }
```

**New endpoint:**
```php
GET /wp-json/api/v1/requests/{request_id}/pdf
```

**Implementation:**
```php
public function generateRequestPdf($request)
{
    $requestId = $request->get_param('request_id');
    
    // Load request from database
    $requestInstance = new RequestInstance();
    $requestData = $requestInstance->find($requestId);
    
    if (!$requestData) {
        return new \WP_Error('not_found', 'Request not found', ['status' => 404]);
    }
    
    // Check permissions
    if (!$this->canUserViewRequest($requestData, get_current_user_id())) {
        return new \WP_Error('forbidden', 'Access denied', ['status' => 403]);
    }
    
    // Get workflow approvals
    $approvals = $this->getRequestApprovals($requestData);
    
    // Get request items
    $items = $requestData->getItems();
    
    // Build form data for PDF
    $formData = [
        'request_number' => $requestData->getFormattedRequestNumber(),
        'date_created' => $requestData->created_at,
        'created_by' => $requestData->getCreator()->display_name,
        'team' => $requestData->data['team'] ?? '',
        'purpose' => $requestData->data['purpose'] ?? '',
        'items' => $items,
        'total_amount' => $requestData->total_amount,
        'status' => $requestData->status,
    ];
    
    // Generate PDF
    return $this->generatePdfFromForm($formData, $approvals);
}
```

---

### **Step 3: Add Approval Data Extraction**

```php
/**
 * Get approval data from workflow history
 */
private function getRequestApprovals($request)
{
    $approvals = [
        'sent' => false,
        'team_lead' => false,
        'account_officer' => false,
        'coo' => false,
        'ed' => false,
    ];
    
    // Check if request is submitted
    if ($request->status !== 'draft') {
        $approvals['sent'] = true;
        $approvals['sent_date'] = $request->created_at;
    }
    
    // Get workflow instance
    $workflowInstance = $request->getWorkflowInstance();
    if (!$workflowInstance) {
        return $approvals;
    }
    
    // Get approval history
    $history = $workflowInstance->getHistory();
    
    // Extract approvals from history
    foreach ($history as $record) {
        $step = $record->getFromStep();
        if (!$step) continue;
        
        $config = json_decode($step->config ?? '{}', true);
        $role = $config['role'] ?? '';
        
        if ($record->action === 'approve') {
            $approvals[$role] = true;
            $approvals[$role . '_date'] = $record->created_at;
            $approvals[$role . '_by'] = $record->performed_by;
        }
    }
    
    return $approvals;
}
```

---

### **Step 4: Update Routes**

**File:** `/plugin/Core/Requests/Routes/routes.php`

```php
// Generate PDF for a request
register_rest_route('api/v1', '/requests/(?P<request_id>[a-f0-9-]+)/pdf', [
    'methods' => 'GET',
    'callback' => [RequestController::class, 'generateRequestPdf'],
    'permission_callback' => [RequestController::class, 'checkAuth'],
    'args' => [
        'request_id' => [
            'required' => true,
            'validate_callback' => function($param) {
                return is_string($param);
            }
        ]
    ]
]);

// Generate Payment Voucher PDF
register_rest_route('api/v1', '/requests/(?P<request_id>[a-f0-9-]+)/payment-voucher', [
    'methods' => 'GET',
    'callback' => [RequestController::class, 'generatePaymentVoucherPdf'],
    'permission_callback' => [RequestController::class, 'checkAuth'],
]);
```

---

### **Step 5: Update Frontend Forms**

**Current (Temporary):**
```javascript
// Submit form data to generate PDF
fetch('/wp-json/api/v1/requests/generate-pv', {
    method: 'POST',
    body: JSON.stringify(formData)
});
```

**Integrated:**
```javascript
// First, create/update request
const requestResponse = await fetch('/wp-json/api/v1/requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
});

const { request_id } = await requestResponse.json();

// Then, generate PDF from saved request
window.open(`/wp-json/api/v1/requests/${request_id}/pdf`, '_blank');
```

---

## 🎨 **Signature Integration**

### **Current (Hardcoded Names):**
```php
$accountantName = 'Oyinkansola Aje';
$cooName = 'Olalekan Owonikoko';
$edName = 'Olusola Owonikoko';
```

### **Integrated (From User Profiles):**
```php
/**
 * Get approver name from workflow history
 */
private static function getApproverName($history, $role)
{
    foreach ($history as $record) {
        $step = $record->getFromStep();
        $config = json_decode($step->config ?? '{}', true);
        
        if (($config['role'] ?? '') === $role) {
            $user = new User();
            $approver = $user->find($record->performed_by);
            return $approver ? $approver->display_name : 'Unknown';
        }
    }
    
    // Fallback to hardcoded if not yet approved
    return self::getDefaultApproverName($role);
}

/**
 * Get default approver name (fallback)
 */
private static function getDefaultApproverName($role)
{
    $defaults = [
        'account_officer' => 'Oyinkansola Aje',
        'coo' => 'Olalekan Owonikoko',
        'ed' => 'Olusola Owonikoko',
    ];
    
    return $defaults[$role] ?? 'Unknown';
}
```

---

## 📋 **Migration Path**

### **Phase 1: Keep Both Systems (Current)**
- ✅ Temporary forms work for testing
- ✅ Core system handles actual approvals
- ✅ PDF generation is separate

### **Phase 2: Hybrid Approach**
- ✅ Use temporary forms to create requests
- ✅ Save to database via RequestService
- ✅ Generate PDF from database
- ✅ Approvals update workflow

### **Phase 3: Full Integration**
- ✅ Remove temporary forms
- ✅ Use core request forms
- ✅ PDF generation from RequestInstance
- ✅ All approvals via WorkflowInstance
- ✅ Audit trail in WorkflowHistory

---

## 🚀 **Benefits of Full Integration**

### **1. Single Source of Truth**
- All request data in database
- No duplicate entry
- Consistent data across system

### **2. Audit Trail**
- Complete approval history
- Who approved when
- Comments and notes
- Cannot be tampered with

### **3. Workflow Flexibility**
- Different approval flows per request type
- Conditional approvals based on amount
- Parallel approvals
- Escalation rules

### **4. Reporting**
- Query requests by status
- Approval metrics
- Processing time analytics
- Bottleneck identification

### **5. Notifications**
- Auto-notify approvers
- Reminder emails
- Status updates
- Escalation alerts

---

## 📊 **Example: Full Integration Flow**

```php
// 1. User submits request via form
$requestService = new RequestService();
$result = $requestService->createRequest([
    'request_type_id' => 'petty-cash-uuid',
    'created_by' => get_current_user_id(),
    'data' => [
        'purpose' => 'Office supplies',
        'team' => 'Administration'
    ],
    'items' => [
        ['description' => 'Printer paper', 'amount' => 5000],
        ['description' => 'Pens', 'amount' => 2000]
    ]
]);

$requestId = $result['request_id'];

// 2. Submit for approval
$requestService->submitRequest($requestId, get_current_user_id());
// → Creates WorkflowInstance
// → Notifies first approver (Team Lead)

// 3. Team Lead approves
$workflowAdapter = new RequestWorkflowAdapter();
$workflowAdapter->processWorkflowAction($requestId, 'approve', $teamLeadId, 'Approved');
// → Moves to next step
// → Notifies Account Officer

// 4. Account Officer approves
$workflowAdapter->processWorkflowAction($requestId, 'approve', $accountOfficerId, 'Approved');
// → Moves to COO

// 5. COO approves
$workflowAdapter->processWorkflowAction($requestId, 'approve', $cooId, 'Approved');
// → Request status: 'approved'
// → Workflow status: 'completed'

// 6. Generate final PDF with all approvals
$controller = new RequestController();
$pdf = $controller->generateRequestPdf(['request_id' => $requestId]);
// → PDF shows all approvers with dates
// → Signatures from workflow history
// → Complete audit trail
```

---

## ✅ **Next Steps**

### **Immediate (Keep Current System Working):**
1. ✅ Fix signature file permissions
2. ✅ Upload signature images
3. ✅ Test PDF generation
4. ✅ Verify approval display

### **Short Term (Start Integration):**
1. Add helper methods to extract workflow data
2. Create new endpoint: `GET /requests/{id}/pdf`
3. Update PDF generation to use RequestInstance
4. Test with existing requests in database

### **Medium Term (Full Integration):**
1. Remove temporary form endpoints
2. Update frontend to use core request system
3. Implement approval notifications
4. Add reporting dashboard

### **Long Term (Enhancements):**
1. Mobile app for approvals
2. Email notifications with approve/reject links
3. Bulk approval interface
4. Advanced reporting and analytics

---

## 🎯 **Summary**

**You already have a complete request and approval system!**

The temporary PDF forms were just for testing. Now you can:

1. **Keep the PDF generation code** (it's good!)
2. **Connect it to RequestInstance** (pull data from DB)
3. **Use WorkflowHistory for approvals** (real approval data)
4. **Remove hardcoded names** (use actual approvers)

**The architecture is solid. Just connect the pieces!** 🎉
