# Attendance Time Format Specification

> **Feature:** 12-hour time format with next day indicator for attendance clock-out times that extend beyond the clock-in day.

**Goal:** Display clock-in and clock-out times in 12-hour format where clock-out times that occur after midnight (next day) are visually marked to distinguish them from times on the same day.

---

## Background

**Current State:**
- `formatUtils.formatTime()` returns times in 12-hour format (e.g., "12:00 PM")
- No way to know if clock-out is on a different day than clock-in
- Both first_in_at and last_out_at display as "12:00 PM" - ambiguous when shift spans midnight

**Desired Behavior:**
- Clock-out beyond clock-in day should show "+1 Day" flag
- Example: Clock-in 9:00 PM, Clock-out 5:00 AM next day → "5:00 AM +1 Day"

---

## Requirements

### 1. Time Format Function
- Function name: `formatTimeNextDay(date: string | Date, referenceDate?: string | Date)`
- Returns: `"h:mm A +1 Day"` if time is on different day than reference
- Returns: `"h:mm A"` if same day as reference
- Reference defaults to date being formatted (self-referential)
- Uses existing locale (`en-GB` or browser-detected locale)

### 2. UI Updates
- Update `StaffAttendanceSlideOver.tsx` clock-out column to use `formatTimeNextDay(last_out_at, first_in_at)`
- Update `EmployeeAttendanceTab.tsx` clock-out column to use `formatTimeNextDay(last_out_at, first_in_at)`

### 3. Visual Design
- "+1 Day" shown in small text: `text-xs font-medium text-slate-500`
- Placed inline after time: `"9:00 AM +1 Day"`

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/pwa/src/shared/lib/format-utils.ts` | Add `formatTimeNextDay()` export |
| `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx` | Use new formatter |
| `apps/pwa/src/modules/hr/employees/tabs/EmployeeAttendanceTab.tsx` | Use new formatter |

---

## Acceptance Criteria

1. Clock-out time same day as clock-in → shows only time (e.g., "5:00 PM")
2. Clock-out time next day after clock-in → shows time + flag (e.g., "5:00 AM +1 Day")
3. Missing clock-out → shows dash "-"
4. Both time columns (clock-in, clock-out) use 12-hour format
5. Existing functionality unchanged when no reference date provided

---

## Edge Cases

- **No clock-in time:** Use clock-out's own date as reference (no flag shown)
- **Missing clock-out time:** Return "-" unchanged
- **Same calendar day but past midnight (e.g., clock-in 11pm, clock-out 1am same date):** This is actually next day - use proper date comparison