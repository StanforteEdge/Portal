# Add Employee - Search Existing Users Specification

> **Feature:** When adding a new employee, first search for existing users before creating new.

**Goal:** HR staff must search existing users before adding an employee. If user not found, HR can request admin to create the user (pending status).

---

## Background

**Current State:**
- HR fills in name, email, job title directly
- Creates employee and sends invite
- No search for existing user account

**Desired Behavior:**
- Step 1: Search by email or name
- Step 2a: If found → select user → convert to employee (no duplicate)
- Step 2b: If not found → option to "Request Admin to create user" (creates pending record)
- HR cannot directly create new user accounts (admin-only)

---

## Requirements

### 1. Search Flow
- Initial screen: Search input field
- Query: Search by email or name
- Results: Show list of matching users (if any)
- No results: Show "No users found" + "Request Admin" option

### 2. Select Existing User
- Click to select a found user
- Auto-populate: name, email from user record
- HR fills remaining: job title, organization, hire date, employment type
- Status: Employee created directly (user already exists)

### 3. Request Admin (No User Found)
- Form fields: Full name, email, job title, organization, employment type, hire date, note
- Creates: Pending user record with status "pending_invite"
- Admin sees: Pending requests in admin queue
- Admin action: Approve → sends invite, or reject

### 4. Status Tracking
- New employee record: Already active (user existed) OR pending (user doesn't exist yet)
- Pending flows to admin for approval

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx` | Add search flow, pending option |

---

## UI Flow

```
┌─────────────────────────────┐
│  Step 1: Search User       │
│  [_______________] Search   │
│                             │
│  Results:                  │
│  ○ John Doe (john@...)     │
│    Software Engineer      │
│  ○ Jane Smith (jane@...)   │
│    Product Manager      │
│                             │
│  No results found?         │
│  [Request Admin to Create]  │
└─────────────────────────────┘
          │
          ▼ (if no results)
┌─────────────────────────────┐
│  Step 2: Request Admin     │
│  Name: [_______________]   │
│  Email: [_______________]   │
│  Job Title: [___________]  │
│  Org: [Select...]         │
│  Type: [Select...]        │
│  Note: [optional]        │
│                             │
│  [Cancel]  [Submit]       │
└─────────────────────────────┘
          │
          ▼ (select existing)
┌─────────────────────────────┐
│  Step 2: Create Employee  │
│  Name: John Doe (readonly) │
│  Email: john@... (readonly)│
│  Job Title: [___________] │
│  Org: [Select...]        │
│  Type: [Select...]      │
│  Hire Date: [____]      │
│                             │
│  [Cancel]  [Create]    │
└─────────────────────────────┘
```

---

## API Requirements

```typescript
// Search existing users
userApi.searchUsers(query: string): Promise<User[]>

// Create pending request (new user)
hrApi.requestUserCreation(data: {
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  organization_id?: string;
  employment_type?: string;
  hire_date?: string;
  note?: string;
}): Promise<{ request_id: string }>
```

---

## Acceptance Criteria

1. Page loads with search input as first step
2. Searching shows matching users (if any)
3. "No results" shows "Request Admin" option
4. Selecting a user populates form, proceeds to create employee
5. "Request Admin" shows form to create pending record
6. Pending record has proper status for admin queue
7. HR cannot skip search step

---

## Edge Cases

- **User already is employee:** Show message "User is already an employee"
- **Multiple search results:** Show list, HR selects correct one
- **Search empty:** Show message, don't proceed
- **Network error:** Show error, allow retry