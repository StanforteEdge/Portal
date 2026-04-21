# Attendance & HR Features Implementation Plan

> **FOR AGENTIC WORKERS:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Implement 4 features: (1) Attendance time 12-hour + next day flag, (2) Policy overrides editable/deletable, (3) Slide-over static panel, (4) Add employee search existing first.

**Architecture:** 4 independent features that can be implemented in parallel or sequence. Each modifies standalone files.

**Tech Stack:** React, TypeScript, Tailwind,existing API clients (policyApi, userApi, hrApi).

---

## Feature 1: Attendance Time Format (12-hour + next day)

### Task 1A: Add formatTimeNextDay function

**Files:**
- Modify: `apps/pwa/src/shared/lib/format-utils.ts`

- [ ] **Step 1: Read existing format-utils.ts**

```bash
Read apps/pwa/src/shared/lib/format-utils.ts
```

- [ ] **Step 2: Add formatTimeNextDay function**

Add after `formatTime` function:

```typescript
export const formatTimeNextDay = (
  date: string | Date | null | undefined,
  referenceDate?: string | Date | null | undefined
): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  
  const refD = referenceDate
    ? (typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate)
    : d;
  const isSameDay = refD && !isNaN(refD.getTime())
    ? d.toDateString() === refD.toDateString()
    : true;
  
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  
  if (isSameDay || !refD || isNaN(refD.getTime())) {
    return timeStr;
  }
  
  // Check if clock-out is on a later date than reference
  const refDay = new Date(refD).toDateString();
  const currDay = d.toDateString();
  if (currDay !== refDay && d > refD) {
    return `${timeStr} +1 Day`;
  }
  
  return timeStr;
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/lib/format-utils.ts
git commit -m "feat: add formatTimeNextDay for next day indicator"
```

### Task 1B: Update StaffAttendanceSlideOver

**Files:**
- Modify: `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx:85-100`
- Test: View attendance slide-over in browser

- [ ] **Step 1: Read StaffAttendanceSlideOver.tsx**

Locate the table cells rendering clock-in and clock-out times.

- [ ] **Step 2: Update imports and cell rendering**

Change import:
```typescript
import { formatDate, formatTime, formatTimeNextDay, formatDuration } from "@/shared/lib/format-utils";
```

Update clock-out cell:
```typescript
<TableCell>{formatTimeNextDay(row.last_out_at, row.first_in_at)}</TableCell>
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx
git commit -m "feat: show +1 Day for clock-out next day"
```

### Task 1C: Update EmployeeAttendanceTab

**Files:**
- Modify: `apps/pwa/src/modules/hr/employees/tabs/EmployeeAttendanceTab.tsx`
- Test: View employee attendance tab

- [ ] **Step 1: Read EmployeeAttendanceTab.tsx**

Locate similar clock-in/clock-out cells around lines 80-90.

- [ ] **Step 2: Update import and cells**

Update clock-out cell to use `formatTimeNextDay(last_out_at, first_in_at)`.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/tabs/EmployeeAttendanceTab.tsx
git commit -m "feat: show +1 Day on employee attendance tab"
```

---

## Feature 2: Policy Overrides Editable & Deletable

### Task 2A: Update AttendanceOverrideSlideOver

**Files:**
- Modify: `apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx`
- Test: Edit an existing override

- [ ] **Step 1: Read AttendanceOverrideSlideOver.tsx**

Find disabled attributes around line 103, 111, 118, 125.

- [ ] **Step 2: Remove disabled attributes**

Remove:
```typescript
disabled={!!policy}
```
From scopeType select (line 103), organization select (line 111), team select (line 118), user select (line 125), priority field.

- [ ] **Step 3: Add scope change handler**

Add state to track if scope type changed:
```typescript
const [scopeTypeChanged, setScopeTypeChanged] = useState(false);
```

Add onChange for scopeType:
```typescript
onChange={(e) => {
  setScopeType(e.target.value as ScopeType);
  setScopeTypeChanged(true);
  setScopeId("");
}}
```

- [ ] **Step 4: Modify submit handler for scope change**

In handleSubmit, check if scope changed:
```typescript
const isScopeChanged = scopeTypeChanged || 
  (policy && (policy.scope_type !== scopeType || policy.scope_id !== scopeId));

if (isScopeChanged && policy?.id) {
  await policyApi.deletePolicy(policy.id);
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx
git commit -m "feat: enable scope type editing for policy overrides"
```

### Task 2B: Add delete button to overrides table

**Files:**
- Modify: `apps/pwa/src/modules/hr/settings/AttendanceSettingsTab.tsx`
- Test: Delete an override from table

- [ ] **Step 1: Read AttendanceSettingsTab.tsx**

Locate table cells around line 169-184.

- [ ] **Step 2: Add delete handler**

```typescript
const handleDelete = async (id: string) => {
  if (!window.confirm("Delete this override?")) return;
  try {
    await policyApi.deletePolicy(id);
    showToast({ tone: "success", title: "Deleted", message: "Override removed." });
    await load();
  } catch {
    showToast({ tone: "danger", title: "Error", message: "Failed to delete." });
  }
};
```

- [ ] **Step 3: Add delete button to table**

```tsx
<TableCell>
  <Button variant="ghost" size="sm" onClick={() => setEditingPolicy(row)}>
    Edit
  </Button>
  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="ml-2 text-danger">
    Delete
  </Button>
</TableCell>
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/hr/settings/AttendanceSettingsTab.tsx
git commit -m "feat: add delete capability for policy overrides"
```

---

## Feature 3: Slide-over Static Panel

### Task 3A: Update SlideOver base component

**Files:**
- Modify: `apps/pwa/src/shared/components/ui/SlideOver.tsx`

- [ ] **Step 1: Read SlideOver.tsx**

- [ ] **Step 2: Apply layout fixes**

Update container:
```typescript
<div className="fixed bottom-0 right-0 w-full max-w-md flex flex-col bg-white shadow-xl">
```
(Note: Use `bottom-0` instead of `inset-y-0` for simpler anchoring)

Update panel:
```typescript
export function SlideOverPanel({ children }: SlideOverPanelProps) {
  return <div className="flex flex-col min-h-0 h-full">{children}</div>;
}
```

Update content:
```typescript
export function SlideOverContent({ children, className = "" }: SlideOverContentProps) {
  return <div className={`flex-1 min-h-0 overflow-y-auto ${className}`}>{children}</div>;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/components/ui/SlideOver.tsx
git commit -m "fix: slide-over static positioning and scrolling"
```

### Task 3B: Update AttendanceOverrideSlideOver

**Files:**
- Modify: `apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx`

- [ ] **Step 1: Read file, find container**

Line ~84.

- [ ] **Step 2: Apply layout fixes**

```typescript
<div className="fixed bottom-0 right-0 w-full max-w-lg flex flex-col bg-white shadow-xl">
```

Add `top-16` if positioning below header is needed:
```typescript
<div className="fixed top-16 bottom-0 right-0 w-full max-w-lg flex flex-col bg-white shadow-xl">
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx
git commit -m "fix: static slide-over panel positioning"
```

### Task 3C: Update StaffAttendanceSlideOver

**Files:**
- Modify: `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx`

- [ ] **Step 1: Read file, find container**

Line ~49.

- [ ] **Step 2: Apply similar layout fix**

```typescript
<div className="fixed top-16 bottom-0 right-0 w-full max-w-2xl flex flex-col bg-white shadow-xl">
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx
git commit -m "fix: static attendance slide-over panel"
```

---

## Feature 4: Add Employee Search Existing Users

### Task 4A: Modify HrEmployeeCreatePage with search

**Files:**
- Modify: `apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx`
- Test: Add new employee with search flow

- [ ] **Step 1: Read HrEmployeeCreatePage.tsx**

- [ ] **Step 2: Add search state and imports**

```typescript
import { userApi } from "@/shared/lib/core";
import type { User } from "@stanforte/shared";

const [searchStep, setSearchStep] = useState<"search" | "request" | "select">("search");
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<User[]>([]);
const [searching, setSearching] = useState(false);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
```

- [ ] **Step 3: Add search function**

```typescript
const handleSearch = async () => {
  if (!searchQuery.trim()) return;
  setSearching(true);
  try {
    const results = await userApi.searchUsers(searchQuery.trim());
    setSearchResults(results);
  } catch {
    setSearchResults([]);
  } finally {
    setSearching(false);
  }
};
```

- [ ] **Step 4: Add search UI before form**

Add search step UI:
```tsx
{searchStep === "search" && (
  <SectionCard title="Search Existing User">
    <TextField
      label="Search by email or name"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search..."
    />
    <Button onClick={() => void handleSearch()} disabled={searching}>
      {searching ? "Searching..." : "Search"}
    </Button>
    {searchResults.length > 0 && (
      <div>
        {searchResults.map(user => (
          <div key={user.id} onClick={() => { setSelectedUser(user); setSearchStep("select"); }}>
            {user.name} ({user.email})
          </div>
        ))}
      </div>
    )}
    {searchQuery && searchResults.length === 0 && !searching && (
      <Button onClick={() => setSearchStep("request")}>
        Request Admin to Create User
      </Button>
    )}
  </SectionCard>
)}
```

- [ ] **Step 5: Add request admin flow**

```tsx
{searchStep === "request" && (
  <SectionCard title="Request Admin">
    <TextField label="First Name" value={firstName} onChange={...} />
    <TextField label="Last Name" value={lastName} onChange={...} />
    <TextField label="Email" type="email" value={email} onChange={...} />
    {/* Request admin instead of create */}
    <Button onClick={() => {
      await hrApi.requestUserCreation({ first_name: firstName, last_name: lastName, email: email, ... });
      showToast({ tone: "success", title: "Request Sent", message: "Admin will review." });
      navigate("/hr/employees");
    }}>
      Submit Request
    </Button>
  </SectionCard>
)}
```

- [ ] **Step 6: Update existing form for selected user**

When user selected:
- Auto-populate name and email (read-only)
- Allow editing job title, org, type, date
- Create employee directly (user exists)

- [ ] **Step 7: Add userApi method if needed**

Check if `userApi.searchUsers` exists. If not, add to API.

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx
git commit -m "feat: add search flow for creating employees"
```

---

## Verification Commands

After implementing each feature:

```bash
# Build check
npm run build 2>&1 | head -50

# Type check
npm run typecheck 2>&1 | head -30

# Lint
npm run lint 2>&1 | head -30
```

---

## Plan Complete

**4 specs written:**
- `2026-04-21-attendance-time-format-spec.md`
- `2026-04-21-policy-overrides-spec.md`
- `2026-04-21-slideover-static-spec.md`
- `2026-04-21-add-employee-search-spec.md`

**Files to modify:**
- `apps/pwa/src/shared/lib/format-utils.ts`
- `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx`
- `apps/pwa/src/modules/hr/employees/tabs/EmployeeAttendanceTab.tsx`
- `apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx`
- `apps/pwa/src/modules/hr/settings/AttendanceSettingsTab.tsx`
- `apps/pwa/src/shared/components/ui/SlideOver.tsx`
- `apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx`