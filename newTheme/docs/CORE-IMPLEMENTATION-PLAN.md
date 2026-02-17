# Core Request System Implementation Plan

## 🎯 **Goal:**
Build the integrated Request & Approval system alongside the temporary system without disruption.

---

## 📋 **Implementation Strategy**

### **Principle: Zero Disruption**
- ✅ Temporary system stays untouched
- ✅ New core system in separate namespace
- ✅ Different routes/endpoints
- ✅ Different frontend pages
- ✅ Can run both simultaneously
- ✅ Migrate when ready

---

## 📁 **File Structure**

### **Frontend (Theme):**
```
/newTheme/templates/pages/
├── payment-voucher-form.php          ← Temporary (keep as-is)
├── request-pdf-form.php              ← Temporary (keep as-is)
├── requests/                         ← NEW: Core system
│   ├── create-request.php            ← Create new request
│   ├── my-requests.php               ← List user's requests
│   ├── request-detail.php            ← View/edit request
│   ├── approvals.php                 ← Approval dashboard
│   └── components/
│       ├── request-form.php          ← Reusable form component
│       ├── approval-card.php         ← Approval UI component
│       └── request-items-table.php   ← Items table component
```

### **Backend (Plugin):**
```
/plugin/Core/Requests/
├── Controllers/
│   ├── RequestController.php         ← Existing (add new methods)
│   └── ApprovalController.php        ← NEW: Approval actions
├── Services/
│   ├── RequestService.php            ← Existing (already good)
│   └── RequestWorkflowAdapter.php    ← Existing (already good)
├── Routes/
│   ├── routes.php                    ← Add new core routes
│   └── approvals.php                 ← NEW: Approval routes
└── Models/
    ├── RequestInstance.php           ← Existing (already good)
    ├── RequestItem.php               ← Existing (already good)
    └── RequestType.php               ← Existing (already good)
```

---

## 🔄 **Phase-by-Phase Implementation**

### **Phase 1: Backend API (Week 1)**

#### **Day 1-2: Request CRUD Endpoints**
```
POST   /api/v1/core-requests              ← Create request
GET    /api/v1/core-requests              ← List requests
GET    /api/v1/core-requests/{id}         ← Get single request
PUT    /api/v1/core-requests/{id}         ← Update request
DELETE /api/v1/core-requests/{id}         ← Delete request
POST   /api/v1/core-requests/{id}/submit  ← Submit for approval
```

**Note:** Using `/core-requests` to avoid conflict with temporary `/requests`

#### **Day 3-4: Approval Endpoints**
```
GET    /api/v1/core-requests/{id}/approvals        ← Get approval status
POST   /api/v1/core-requests/{id}/approve          ← Approve request
POST   /api/v1/core-requests/{id}/reject           ← Reject request
GET    /api/v1/core-requests/pending-approvals     ← My pending approvals
GET    /api/v1/core-requests/{id}/history          ← Approval history
```

#### **Day 5: PDF Generation**
```
GET    /api/v1/core-requests/{id}/pdf              ← Generate PDF from DB
GET    /api/v1/core-requests/{id}/payment-voucher  ← Generate PV from DB
```

---

### **Phase 2: Frontend Pages (Week 2)**

#### **Day 1-2: Create Request Page**
**File:** `/templates/pages/requests/create-request.php`

Features:
- Select request type (dropdown)
- Dynamic form based on request type
- Add/remove items
- Save as draft
- Submit for approval
- Real-time validation

#### **Day 3: My Requests Page**
**File:** `/templates/pages/requests/my-requests.php`

Features:
- List all user's requests
- Filter by status (draft, submitted, approved, rejected)
- Search by request number
- Quick actions (view, edit, delete)
- Status badges

#### **Day 4: Request Detail Page**
**File:** `/templates/pages/requests/request-detail.php`

Features:
- View request details
- Edit if draft
- View approval flow
- Download PDF
- Add comments
- View history

#### **Day 5: Approvals Dashboard**
**File:** `/templates/pages/requests/approvals.php`

Features:
- Pending approvals for current user
- Approve/reject actions
- Add approval comments
- View request details
- Bulk approve

---

### **Phase 3: Integration & Testing (Week 3)**

#### **Day 1-2: Workflow Integration**
- Connect approvals to WorkflowInstance
- Test approval flow
- Verify notifications
- Check permissions

#### **Day 3-4: PDF Integration**
- Generate PDFs from RequestInstance
- Pull approvals from WorkflowHistory
- Use real approver names
- Test signature display

#### **Day 5: End-to-End Testing**
- Create request → Submit → Approve → PDF
- Test all request types
- Verify audit trail
- Check edge cases

---

## 🎨 **Frontend Architecture**

### **Page Routing:**
```
/requests/create          → create-request.php
/requests/my-requests     → my-requests.php
/requests/{id}            → request-detail.php
/requests/approvals       → approvals.php
```

### **Component Structure:**
```javascript
// Reusable components
RequestForm
  ├─ RequestTypeSelector
  ├─ RequestItemsTable
  │   ├─ ItemRow
  │   └─ AddItemButton
  └─ SubmitButton

ApprovalCard
  ├─ ApproverInfo
  ├─ ApprovalStatus
  └─ ApprovalActions
```

---

## 🔧 **Backend Architecture**

### **New Methods in RequestController:**

```php
// Core system methods (separate from temporary)
public function createCoreRequest($request)
public function getCoreRequests($request)
public function getCoreRequest($request)
public function updateCoreRequest($request)
public function deleteCoreRequest($request)
public function submitCoreRequest($request)
public function generateCoreRequestPdf($request)
```

### **New ApprovalController:**

```php
public function getPendingApprovals($request)
public function approveRequest($request)
public function rejectRequest($request)
public function getApprovalHistory($request)
public function addApprovalComment($request)
```

---

## 📊 **Data Flow**

### **Create Request Flow:**
```
User fills form
    ↓
POST /api/v1/core-requests
    ↓
RequestController.createCoreRequest()
    ↓
RequestService.createRequest()
    ↓
RequestInstance saved (status: 'draft')
    ↓
Return request_id
    ↓
Redirect to /requests/{id}
```

### **Submit Request Flow:**
```
User clicks "Submit"
    ↓
POST /api/v1/core-requests/{id}/submit
    ↓
RequestController.submitCoreRequest()
    ↓
RequestService.submitRequest()
    ↓
RequestWorkflowAdapter.createApprovalWorkflow()
    ↓
WorkflowInstance created
    ↓
Notify first approver
    ↓
Request status: 'submitted'
```

### **Approval Flow:**
```
Approver views pending
    ↓
GET /api/v1/core-requests/pending-approvals
    ↓
Approver clicks "Approve"
    ↓
POST /api/v1/core-requests/{id}/approve
    ↓
ApprovalController.approveRequest()
    ↓
RequestWorkflowAdapter.processWorkflowAction()
    ↓
WorkflowInstance.moveToNextStep()
    ↓
WorkflowHistory records approval
    ↓
Notify next approver or complete
```

---

## 🚀 **Implementation Order**

### **Week 1: Backend Foundation**

**Day 1:**
- [ ] Create ApprovalController.php
- [ ] Add core request routes
- [ ] Implement createCoreRequest()
- [ ] Test request creation

**Day 2:**
- [ ] Implement getCoreRequests()
- [ ] Implement getCoreRequest()
- [ ] Implement updateCoreRequest()
- [ ] Test CRUD operations

**Day 3:**
- [ ] Implement submitCoreRequest()
- [ ] Test workflow creation
- [ ] Verify notifications

**Day 4:**
- [ ] Implement approveRequest()
- [ ] Implement rejectRequest()
- [ ] Test approval flow

**Day 5:**
- [ ] Implement generateCoreRequestPdf()
- [ ] Test PDF with real data
- [ ] Verify signatures

---

### **Week 2: Frontend Pages**

**Day 1:**
- [ ] Create create-request.php
- [ ] Build request form
- [ ] Add item management
- [ ] Test form submission

**Day 2:**
- [ ] Create my-requests.php
- [ ] Build requests list
- [ ] Add filters/search
- [ ] Test pagination

**Day 3:**
- [ ] Create request-detail.php
- [ ] Display request info
- [ ] Show approval flow
- [ ] Add PDF download

**Day 4:**
- [ ] Create approvals.php
- [ ] List pending approvals
- [ ] Add approve/reject UI
- [ ] Test approval actions

**Day 5:**
- [ ] Build reusable components
- [ ] Add loading states
- [ ] Improve UX
- [ ] Polish UI

---

### **Week 3: Integration**

**Day 1-2:**
- [ ] Connect all endpoints
- [ ] Test complete flow
- [ ] Fix bugs

**Day 3-4:**
- [ ] Add notifications
- [ ] Implement permissions
- [ ] Add audit logging

**Day 5:**
- [ ] Final testing
- [ ] Documentation
- [ ] Demo preparation

---

## 🎯 **Success Criteria**

### **Backend:**
- ✅ All CRUD endpoints working
- ✅ Workflow integration complete
- ✅ PDF generation from database
- ✅ Proper error handling
- ✅ Permission checks in place

### **Frontend:**
- ✅ All pages functional
- ✅ Forms validate correctly
- ✅ UI is responsive
- ✅ Loading states work
- ✅ Error messages clear

### **Integration:**
- ✅ End-to-end flow works
- ✅ Approvals update correctly
- ✅ PDFs show real data
- ✅ Audit trail complete
- ✅ No bugs in happy path

---

## 🔒 **Safety Measures**

### **Namespace Separation:**
```php
// Temporary system
POST /api/v1/requests/generate-pv
POST /api/v1/requests/generate-pdf

// Core system
POST /api/v1/core-requests
GET  /api/v1/core-requests/{id}/pdf
```

### **Route Isolation:**
```php
// In routes.php
// Temporary routes (existing)
register_rest_route('api/v1', '/requests/generate-pv', [...]);

// Core routes (new)
register_rest_route('api/v1', '/core-requests', [...]);
```

### **Frontend Separation:**
```
/payment-voucher-form.php  ← Temporary (untouched)
/requests/create-request.php ← Core (new)
```

---

## 📈 **Migration Strategy (Future)**

### **Phase 1: Parallel Running**
- Both systems work
- Users can choose
- Gradual adoption

### **Phase 2: Data Migration**
- Export temporary data
- Import to core system
- Verify integrity

### **Phase 3: Deprecation**
- Redirect temporary to core
- Archive old code
- Remove temporary system

---

## ✅ **Next Steps**

### **Immediate:**
1. Create folder structure
2. Set up routes
3. Create ApprovalController
4. Implement first endpoint

### **This Week:**
1. Complete backend API
2. Test all endpoints
3. Document API

### **Next Week:**
1. Build frontend pages
2. Connect to API
3. Test user flows

---

## 🎉 **Timeline**

**Week 1:** Backend API complete
**Week 2:** Frontend pages complete
**Week 3:** Integration & testing complete

**Total:** 3 weeks to full core system

**Temporary system:** Continues working throughout! 🚀
