# Request System Pages - User Guide

## 📄 **Page Breakdown**

---

## 1️⃣ **create-request.php** - Create New Request

### **Purpose:**
Form to create a new request (Petty Cash, Expense Reimbursement, etc.)

### **Who Uses It:**
- ✅ **All Staff** - Anyone can create a request

### **What It Does:**
```
1. User selects request type (dropdown)
   - Petty Cash Request
   - Expense Reimbursement
   - Purchase Request
   - Payment Voucher
   - etc.

2. Form appears based on type selected
   - Different fields per request type
   - Dynamic form generation

3. User fills in details:
   - Purpose/Description
   - Team/Department
   - Add items (description + amount)
   - Attach files (optional)
   - Total amount calculated automatically

4. User can:
   - Save as Draft (come back later)
   - Submit for Approval (starts workflow)
```

### **Example Flow:**
```
Staff Member (John) needs petty cash:
1. Goes to /requests/create
2. Selects "Petty Cash Request"
3. Fills form:
   - Purpose: "Office supplies"
   - Team: "Administration"
   - Items:
     * Printer paper - ₦5,000
     * Pens - ₦2,000
   - Total: ₦7,000
4. Clicks "Submit for Approval"
5. Request sent to Team Lead
```

---

## 2️⃣ **my-requests.php** - My Requests List

### **Purpose:**
Dashboard showing all requests created by the logged-in user

### **Who Uses It:**
- ✅ **All Staff** - View their own requests

### **What It Shows:**
```
┌─────────────────────────────────────────────────────┐
│ My Requests                          [+ New Request]│
├─────────────────────────────────────────────────────┤
│ Filters: [All] [Draft] [Pending] [Approved] [Rejected]│
│ Search: [________________]                          │
├─────────────────────────────────────────────────────┤
│ REQ-00123  Petty Cash Request    ₦7,000   Pending  │
│ 01 Dec 2024                                         │
│ [View] [Edit] [Delete]                              │
├─────────────────────────────────────────────────────┤
│ REQ-00122  Expense Reimbursement ₦15,000  Approved │
│ 28 Nov 2024                                         │
│ [View] [Download PDF]                               │
├─────────────────────────────────────────────────────┤
│ REQ-00121  Purchase Request      ₦50,000  Draft    │
│ 25 Nov 2024                                         │
│ [Edit] [Submit] [Delete]                            │
└─────────────────────────────────────────────────────┘
```

### **Features:**
- Filter by status (Draft, Pending, Approved, Rejected)
- Search by request number or description
- Quick actions per request
- Status badges with colors
- Pagination for many requests

### **Example Flow:**
```
Staff Member (John) checks his requests:
1. Goes to /requests/my-requests
2. Sees all his requests
3. Filters to "Pending" to see what's waiting
4. Clicks "View" on REQ-00123 to check approval status
```

---

## 3️⃣ **request-detail.php** - View/Edit Request

### **Purpose:**
Detailed view of a single request with full information and approval flow

### **Who Uses It:**
- ✅ **Request Creator** - View/edit their request
- ✅ **Approvers** - View request to approve/reject
- ✅ **Accountant** - View approved requests

### **What It Shows:**
```
┌─────────────────────────────────────────────────────┐
│ Request #REQ-00123                    Status: Pending│
├─────────────────────────────────────────────────────┤
│ Request Details:                                    │
│ Type: Petty Cash Request                            │
│ Created by: John Doe                                │
│ Date: 01 Dec 2024                                   │
│ Team: Administration                                │
│ Purpose: Office supplies                            │
├─────────────────────────────────────────────────────┤
│ Items:                                              │
│ 1. Printer paper          ₦5,000                    │
│ 2. Pens                   ₦2,000                    │
│                                                     │
│ Total Amount: ₦7,000                                │
├─────────────────────────────────────────────────────┤
│ Approval Flow:                                      │
│ ✓ Request Sent           01 Dec 2024 10:00 AM      │
│ ⏳ Team Lead (Pending)    Waiting...                │
│ ⏸ Account Officer        Not started               │
│ ⏸ COO                    Not started               │
├─────────────────────────────────────────────────────┤
│ Actions:                                            │
│ [Download PDF] [Add Comment] [Cancel Request]      │
└─────────────────────────────────────────────────────┘
```

### **Different Views by Role:**

#### **If you're the Creator:**
- View all details
- See approval progress
- Add comments
- Cancel if still pending
- Download PDF when approved

#### **If you're an Approver:**
- View request details
- See approval history
- **[Approve] [Reject]** buttons
- Add approval comment

#### **If you're just viewing:**
- Read-only view
- No action buttons

---

## 4️⃣ **approvals.php** - Approval Dashboard

### **Purpose:**
Dashboard for approvers to see all requests waiting for their approval

### **Who Uses It:**
- ✅ **Team Leads** - Approve team requests
- ✅ **Account Officer** - Approve financial requests
- ✅ **COO** - Final approval
- ✅ **ED** - High-value approvals

### **What It Shows:**
```
┌─────────────────────────────────────────────────────┐
│ Pending Approvals                         (5 items) │
├─────────────────────────────────────────────────────┤
│ Filters: [All] [Petty Cash] [Expenses] [Purchases]  │
│ Sort by: [Date] [Amount] [Requester]               │
├─────────────────────────────────────────────────────┤
│ REQ-00123  Petty Cash Request                       │
│ Requested by: John Doe (Administration)             │
│ Amount: ₦7,000                                      │
│ Date: 01 Dec 2024                                   │
│ Purpose: Office supplies                            │
│ [View Details] [Approve] [Reject]                   │
├─────────────────────────────────────────────────────┤
│ REQ-00124  Expense Reimbursement                    │
│ Requested by: Jane Smith (Programs)                 │
│ Amount: ₦15,000                                     │
│ Date: 01 Dec 2024                                   │
│ Purpose: Training materials                         │
│ [View Details] [Approve] [Reject]                   │
├─────────────────────────────────────────────────────┤
│ REQ-00125  Purchase Request                         │
│ Requested by: Mike Johnson (IT)                     │
│ Amount: ₦50,000                                     │
│ Date: 30 Nov 2024                                   │
│ Purpose: Network equipment                          │
│ [View Details] [Approve] [Reject]                   │
└─────────────────────────────────────────────────────┘
```

### **Features:**
- See only requests waiting for YOUR approval
- Filter by request type
- Sort by date, amount, or requester
- Quick approve/reject
- Bulk actions (approve multiple at once)
- Add approval comments

---

## 👥 **User Journeys by Role**

---

### **🧑 STAFF MEMBER (Regular Employee)**

#### **Scenario: Need petty cash for office supplies**

**Step 1: Create Request**
```
1. Login to portal
2. Go to "Requests" menu → "Create Request"
3. Select "Petty Cash Request"
4. Fill form:
   - Purpose: "Office supplies"
   - Team: "Administration"
   - Add items
5. Click "Submit for Approval"
```

**Step 2: Track Request**
```
1. Go to "My Requests"
2. See REQ-00123 status: "Pending"
3. Click "View" to see approval progress
4. Wait for notifications
```

**Step 3: Get Approval**
```
1. Receive email: "Your request has been approved"
2. Go to request detail
3. Click "Download PDF"
4. Take PDF to accountant for payment
```

---

### **👔 TEAM LEAD**

#### **Scenario: Approve team member's request**

**Step 1: Check Pending Approvals**
```
1. Login to portal
2. See notification: "3 pending approvals"
3. Go to "Approvals" page
4. See list of requests from team members
```

**Step 2: Review Request**
```
1. Click "View Details" on REQ-00123
2. See:
   - Who requested it (John Doe)
   - What it's for (Office supplies)
   - Amount (₦7,000)
   - Items breakdown
3. Verify it's legitimate
```

**Step 3: Approve or Reject**
```
If approved:
1. Click "Approve"
2. Add comment: "Approved for office use"
3. Request moves to next approver (Account Officer)
4. John gets notification

If rejected:
1. Click "Reject"
2. Add reason: "Please use existing supplies first"
3. Request marked as rejected
4. John gets notification
```

---

### **💰 ACCOUNT OFFICER (Accountant)**

#### **Scenario: Approve financial requests**

**Step 1: Check Pending**
```
1. Login to portal
2. Go to "Approvals" page
3. See requests that passed Team Lead approval
4. Filter by amount or type
```

**Step 2: Review Financials**
```
1. Click "View Details" on REQ-00123
2. Check:
   - Budget availability
   - Amount is reasonable
   - Items are itemized
   - Team Lead approved
3. Verify calculations
```

**Step 3: Approve**
```
1. Click "Approve"
2. Add comment: "Budget available, approved"
3. Request moves to COO
4. Requester gets notification
```

**Step 4: Process Payment (After COO Approval)**
```
1. Go to "My Approvals" → "Approved"
2. Filter: "Fully Approved"
3. Click request
4. Download PDF
5. Process payment
6. Mark as paid in system
```

---

### **🎯 COO (Chief Operating Officer)**

#### **Scenario: Final approval**

**Step 1: Review High-Level Requests**
```
1. Login to portal
2. Go to "Approvals" page
3. See requests that passed Team Lead + Account Officer
4. Focus on high-value or strategic requests
```

**Step 2: Final Review**
```
1. Click "View Details" on REQ-00123
2. See complete approval history:
   - Team Lead approved ✓
   - Account Officer approved ✓
3. Review purpose and amount
4. Check alignment with strategy
```

**Step 3: Final Approval**
```
1. Click "Approve"
2. Add comment: "Final approval granted"
3. Request status: "Approved"
4. PDF can now be generated
5. All parties notified
```

---

### **👑 ED (Executive Director)**

#### **Scenario: Approve high-value requests**

**Only sees requests above certain threshold (e.g., ₦100,000)**

**Step 1: Check High-Value Approvals**
```
1. Login to portal
2. Go to "Approvals" page
3. See only requests above ₦100,000
4. These already passed all other approvers
```

**Step 2: Strategic Review**
```
1. Click "View Details" on REQ-00150
2. Amount: ₦500,000
3. Purpose: "New equipment purchase"
4. See all previous approvals
5. Review strategic importance
```

**Step 3: Final Decision**
```
1. Click "Approve" or "Reject"
2. Add executive comment
3. Request completed
4. All parties notified
```

---

## 🔄 **Complete Workflow Example**

### **Scenario: John needs ₦7,000 for office supplies**

```
Day 1 - 10:00 AM: John creates request
    ↓
    Goes to /requests/create
    Fills form, submits
    Request #REQ-00123 created
    Status: "Submitted"
    ↓
Day 1 - 10:01 AM: Team Lead notified
    ↓
    Email: "New request from John Doe"
    Goes to /requests/approvals
    Sees REQ-00123
    ↓
Day 1 - 11:00 AM: Team Lead approves
    ↓
    Clicks "Approve"
    Adds comment: "Approved"
    Status: "Pending Account Officer"
    ↓
Day 1 - 11:01 AM: Account Officer notified
    ↓
    Email: "New request for approval"
    Goes to /requests/approvals
    Sees REQ-00123
    ↓
Day 1 - 2:00 PM: Account Officer approves
    ↓
    Clicks "Approve"
    Adds comment: "Budget available"
    Status: "Pending COO"
    ↓
Day 1 - 2:01 PM: COO notified
    ↓
    Email: "New request for final approval"
    Goes to /requests/approvals
    Sees REQ-00123
    ↓
Day 2 - 9:00 AM: COO approves
    ↓
    Clicks "Approve"
    Adds comment: "Final approval"
    Status: "Approved"
    ↓
Day 2 - 9:01 AM: John notified
    ↓
    Email: "Your request has been approved!"
    Goes to /requests/my-requests
    Clicks "Download PDF"
    ↓
Day 2 - 10:00 AM: John gets payment
    ↓
    Takes PDF to accountant
    Receives ₦7,000
    Request marked as "Paid"
```

---

## 📊 **Page Access by Role**

| Page | Staff | Team Lead | Account Officer | COO | ED |
|------|-------|-----------|-----------------|-----|-----|
| create-request.php | ✅ | ✅ | ✅ | ✅ | ✅ |
| my-requests.php | ✅ | ✅ | ✅ | ✅ | ✅ |
| request-detail.php | ✅ | ✅ | ✅ | ✅ | ✅ |
| approvals.php | ❌ | ✅ | ✅ | ✅ | ✅ |

**Note:** Everyone can create requests and view their own. Only approvers see the approvals dashboard.

---

## 🎯 **Key Features**

### **For Requesters:**
- ✅ Easy request creation
- ✅ Track approval progress
- ✅ Download PDF when approved
- ✅ Edit drafts
- ✅ Cancel pending requests

### **For Approvers:**
- ✅ See only relevant approvals
- ✅ Quick approve/reject
- ✅ Add comments
- ✅ View complete history
- ✅ Bulk actions

### **For Everyone:**
- ✅ Email notifications
- ✅ Real-time status updates
- ✅ Complete audit trail
- ✅ Mobile-friendly
- ✅ Search and filter

---

## 🚀 **Summary**

**4 Simple Pages:**

1. **create-request.php** → Make a new request
2. **my-requests.php** → See all my requests
3. **request-detail.php** → View one request in detail
4. **approvals.php** → Approve requests (approvers only)

**Everyone uses pages 1-3. Only approvers use page 4.**

**Simple, clean, efficient!** 🎉
