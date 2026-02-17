# Payment Scenarios: Partial Payments & Split Payments

## 🎯 **Real-World Payment Scenarios**

---

## 📋 **Scenario 1: Partial Item Payment**

### **Problem:**
Request has multiple items, but accountant pays for only some items.

### **Example:**
```
Request #REQ-00123 (Approved for ₦50,000)
Items:
1. Laptop - ₦40,000
2. Mouse - ₦5,000
3. Keyboard - ₦5,000

Accountant wants to pay for Laptop only (₦40,000)
Mouse and Keyboard will be paid later
```

---

### **Solution: Multiple Payment Vouchers per Request**

#### **Database Design:**
```sql
-- One request can have MULTIPLE payment vouchers
sta_payment_vouchers
- id (PV-00456)
- request_id (REQ-00123)
- amount (₦40,000)  ← Partial amount
- items_covered (JSON: [1])  ← Which items

sta_payment_voucher_items
- id
- payment_voucher_id (PV-00456)
- request_item_id (Item 1: Laptop)
- amount (₦40,000)
```

#### **How it Works:**

**Step 1: First Payment**
```
Accountant creates PV-00456:
- Request: REQ-00123
- Items selected: Laptop (₦40,000)
- Amount: ₦40,000
- Status: "Partial Payment"

Request status: "Partially Paid"
Remaining: ₦10,000 (Mouse + Keyboard)
```

**Step 2: Second Payment (Later)**
```
Accountant creates PV-00457:
- Request: REQ-00123
- Items selected: Mouse + Keyboard (₦10,000)
- Amount: ₦10,000
- Status: "Final Payment"

Request status: "Fully Paid"
Remaining: ₦0
```

---

### **UI Design:**

```
┌─────────────────────────────────────────────────────┐
│ Request #REQ-00123          Status: Partially Paid  │
├─────────────────────────────────────────────────────┤
│ [Request] [Payment Vouchers] [Retirement]           │
├─────────────────────────────────────────────────────┤
│ TAB: Payment Vouchers                               │
│                                                     │
│ Total Approved: ₦50,000                             │
│ Total Paid: ₦40,000                                 │
│ Remaining: ₦10,000                                  │
│                                                     │
│ Payment Vouchers:                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ PV-00456  02 Dec 2024  ₦40,000  Paid        │   │
│ │ Items: Laptop                               │   │
│ │ [View] [Download PDF]                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Unpaid Items:                                       │
│ ☐ Mouse - ₦5,000                                    │
│ ☐ Keyboard - ₦5,000                                 │
│                                                     │
│ [Create Payment Voucher for Selected Items]        │
└─────────────────────────────────────────────────────┘
```

---

### **Workflow:**

```
Request approved (₦50,000)
    ↓
Accountant: "I'll pay for laptop first"
    ↓
Create PV-00456 (₦40,000)
    ↓
Request status: "Partially Paid"
    ↓
Later: Accountant creates PV-00457 (₦10,000)
    ↓
Request status: "Fully Paid"
```

---

## 💰 **Scenario 2: Percentage-Based Partial Payment**

### **Problem:**
Request is ₦500,000, but accountant wants to pay 70% now, 30% later.

### **Example:**
```
Request #REQ-00123 (Approved for ₦500,000)
Purpose: Equipment purchase

Accountant: "I'll pay 70% now (₦350,000)"
Remaining 30% (₦150,000) will be paid later
```

---

### **Solution A: Single Request, Multiple Payment Vouchers**

**Recommended for most cases**

#### **How it Works:**

**Step 1: First Payment (70%)**
```
Accountant creates PV-00456:
- Request: REQ-00123
- Amount: ₦350,000 (70%)
- Payment type: "Partial Payment"
- Reason: "Initial payment - 70%"
- Status: "Paid"

Request status: "Partially Paid"
Amount paid: ₦350,000
Remaining: ₦150,000
```

**Step 2: Second Payment (30%)**
```
Accountant creates PV-00457:
- Request: REQ-00123
- Amount: ₦150,000 (30%)
- Payment type: "Final Payment"
- Reason: "Balance payment - 30%"
- Status: "Paid"

Request status: "Fully Paid"
Amount paid: ₦500,000
Remaining: ₦0
```

---

### **Solution B: Split Request (Not Recommended)**

**Only if payments are months apart or different purposes**

```
Original Request REQ-00123 (₦500,000)
    ↓
Accountant: "Split this into two requests"
    ↓
REQ-00123A (₦350,000) - Immediate
REQ-00123B (₦150,000) - Later
```

**Problems with this approach:**
- ❌ Loses original approval context
- ❌ Requires re-approval
- ❌ Confusing audit trail
- ❌ More administrative work

---

### **Recommendation: Use Solution A**

**Why?**
- ✅ Single approval covers full amount
- ✅ Clear audit trail
- ✅ Flexible payment schedule
- ✅ Easy to track remaining balance

---

### **UI Design:**

```
┌─────────────────────────────────────────────────────┐
│ Request #REQ-00123          Status: Partially Paid  │
├─────────────────────────────────────────────────────┤
│ [Request] [Payment Vouchers] [Retirement]           │
├─────────────────────────────────────────────────────┤
│ TAB: Payment Vouchers                               │
│                                                     │
│ Total Approved: ₦500,000                            │
│ Total Paid: ₦350,000 (70%)                          │
│ Remaining: ₦150,000 (30%)                           │
│                                                     │
│ Payment Schedule:                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ PV-00456  02 Dec 2024  ₦350,000  Paid       │   │
│ │ Type: Partial Payment (70%)                 │   │
│ │ [View] [Download PDF]                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Remaining Balance: ₦150,000 (30%)           │   │
│ │ [Create Payment Voucher for Balance]        │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🔀 **Scenario 3: Split Payment from Multiple Accounts**

### **Problem:**
Payment comes from two different program accounts (co-sharing).

### **Example:**
```
Request #REQ-00123 (Approved for ₦100,000)
Purpose: Training workshop

Payment split:
- 60% from "Education Program" (₦60,000)
- 40% from "Capacity Building Program" (₦40,000)
```

---

### **Solution: Single Request, Multiple Payment Vouchers (One per Account)**

#### **Database Design:**
```sql
sta_payment_vouchers
- id (PV-00456)
- request_id (REQ-00123)
- amount (₦60,000)
- funding_source ("Education Program")
- account_code ("ACC-001")
- percentage (60%)

sta_payment_vouchers
- id (PV-00457)
- request_id (REQ-00123)
- amount (₦40,000)
- funding_source ("Capacity Building Program")
- account_code ("ACC-002")
- percentage (40%)
```

---

### **How it Works:**

**Step 1: Define Split During PV Creation**
```
Accountant creates first PV:

PV-00456:
- Request: REQ-00123
- Amount: ₦60,000 (60%)
- Funding Source: "Education Program"
- Account: ACC-001
- Payment Type: "Co-funded (1 of 2)"
- Status: "Paid"
```

**Step 2: Create Second PV**
```
Accountant creates second PV:

PV-00457:
- Request: REQ-00123
- Amount: ₦40,000 (40%)
- Funding Source: "Capacity Building Program"
- Account: ACC-002
- Payment Type: "Co-funded (2 of 2)"
- Status: "Paid"

Request status: "Fully Paid"
Total paid: ₦100,000 from 2 sources
```

---

### **UI Design:**

```
┌─────────────────────────────────────────────────────┐
│ Request #REQ-00123          Status: Fully Paid      │
├─────────────────────────────────────────────────────┤
│ [Request] [Payment Vouchers] [Retirement]           │
├─────────────────────────────────────────────────────┤
│ TAB: Payment Vouchers                               │
│                                                     │
│ Total Approved: ₦100,000                            │
│ Total Paid: ₦100,000 (100%)                         │
│ Funding Sources: 2                                  │
│                                                     │
│ Payment Breakdown:                                  │
│ ┌─────────────────────────────────────────────┐   │
│ │ PV-00456  02 Dec 2024  ₦60,000  Paid        │   │
│ │ Source: Education Program (60%)             │   │
│ │ Account: ACC-001                            │   │
│ │ [View] [Download PDF]                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ PV-00457  02 Dec 2024  ₦40,000  Paid        │   │
│ │ Source: Capacity Building Program (40%)     │   │
│ │ Account: ACC-002                            │   │
│ │ [View] [Download PDF]                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Download Combined Payment Report]                 │
└─────────────────────────────────────────────────────┘
```

---

### **Advanced: Co-funding Setup During Request**

**Option: Define split at request creation**

```
┌─────────────────────────────────────────────────────┐
│ Create Request                                      │
├─────────────────────────────────────────────────────┤
│ Purpose: Training workshop                          │
│ Total Amount: ₦100,000                              │
│                                                     │
│ Funding Split:                                      │
│ ☑ This request is co-funded                         │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Source 1: Education Program                 │   │
│ │ Amount: ₦60,000 (60%)                       │   │
│ │ Account: ACC-001                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Source 2: Capacity Building Program         │   │
│ │ Amount: ₦40,000 (40%)                       │   │
│ │ Account: ACC-002                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [+ Add Funding Source]                              │
│                                                     │
│ Total: ₦100,000 ✓                                   │
└─────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Approvers see funding split upfront
- ✅ Budget checked against multiple accounts
- ✅ Accountant knows split before payment
- ✅ Automatic PV creation for each source

---

## 📊 **Database Schema Updates**

### **Enhanced Payment Voucher Table:**

```sql
CREATE TABLE sta_payment_vouchers (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,
    voucher_number VARCHAR(20) UNIQUE,
    
    -- Payment details
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date DATE,
    
    -- Partial payment tracking
    is_partial_payment BOOLEAN DEFAULT FALSE,
    payment_sequence INT DEFAULT 1,
    total_payment_count INT DEFAULT 1,
    
    -- Co-funding tracking
    funding_source VARCHAR(100),
    account_code VARCHAR(50),
    program_id CHAR(36),
    percentage DECIMAL(5,2),
    
    -- Item-level tracking
    items_covered JSON,  -- Array of request_item_ids
    
    -- Status
    status VARCHAR(32) DEFAULT 'pending',
    
    -- Audit
    created_by BIGINT UNSIGNED,
    approved_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES sta_request_instances(id),
    INDEX idx_request (request_id),
    INDEX idx_status (status)
);

-- Track which items are covered by which PV
CREATE TABLE sta_payment_voucher_items (
    id CHAR(36) PRIMARY KEY,
    payment_voucher_id CHAR(36) NOT NULL,
    request_item_id CHAR(36) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    FOREIGN KEY (payment_voucher_id) REFERENCES sta_payment_vouchers(id),
    FOREIGN KEY (request_item_id) REFERENCES sta_request_items(id)
);
```

---

## 🔄 **Request Status Flow (Updated)**

```
draft
  ↓
submitted
  ↓
approved
  ↓
payment_pending (PV created but not paid)
  ↓
partially_paid (Some PVs paid, some pending)
  ↓
fully_paid (All PVs paid)
  ↓
pending_retirement (Awaiting receipts)
  ↓
partially_retired (Some items retired)
  ↓
fully_retired (All items retired)
  ↓
closed
```

---

## 📋 **Summary of Solutions**

### **Scenario 1: Partial Item Payment**
**Solution:** Multiple PVs, each covering specific items
```
Request (3 items)
  ├─ PV-001 (Item 1)
  └─ PV-002 (Items 2 & 3)
```

### **Scenario 2: Percentage Payment**
**Solution:** Multiple PVs for same items, different amounts
```
Request (₦500K)
  ├─ PV-001 (70% = ₦350K)
  └─ PV-002 (30% = ₦150K)
```

### **Scenario 3: Co-funded Payment**
**Solution:** Multiple PVs from different funding sources
```
Request (₦100K)
  ├─ PV-001 (60% from Program A)
  └─ PV-002 (40% from Program B)
```

---

## ✅ **Best Practices**

### **1. Always Link PVs to Request**
- Never create standalone PV
- Always reference original request
- Maintains audit trail

### **2. Track Payment Progress**
- Show total approved
- Show total paid
- Show remaining balance
- Clear percentage indicators

### **3. Allow Flexibility**
- Accountant can split as needed
- Can combine scenarios (partial + co-funded)
- Easy to add more PVs later

### **4. Clear Documentation**
- Each PV explains what it covers
- Funding source clearly stated
- Payment sequence numbered

### **5. Retirement Flexibility**
- Can retire per PV
- Can retire all at once
- Receipts linked to specific PVs

---

## 🎯 **Recommended Implementation**

### **Phase 1: Basic (Week 3)**
- One request → One PV
- Simple flow

### **Phase 2: Partial Payments (Week 4)**
- One request → Multiple PVs
- Item-level tracking
- Percentage tracking

### **Phase 3: Co-funding (Week 5)**
- Funding source tracking
- Account code integration
- Program-level reporting

---

## 💡 **Key Principle**

**One Request, Multiple Payment Vouchers**

This handles ALL scenarios:
- ✅ Partial item payment
- ✅ Percentage payment
- ✅ Co-funded payment
- ✅ Combinations of above

**Simple, flexible, auditable!** 🚀
