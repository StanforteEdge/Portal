# HR Settings & Onboarding Implementation Design

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Migration and enhancement of HR Settings and Onboarding modules.

---

## 1. Overview
The goal is to migrate and improve the HR Settings and Onboarding functionality from the old PWA to the new UI. This includes advanced Attendance/Leave policy management, geofenced office locations, and form-based onboarding assignments.

## 2. Architecture & Layout
*   **Route:** `/hr/settings`
*   **Navigation:** A vertical side-navigation menu inside the HR Module.
    *   **Attendance**
    *   **Leave Management**
    *   **Office Locations**
*   **Structure:** Each section uses horizontal tabs (e.g., "General", "Overrides") to keep the UI clean.

## 3. Detailed Features

### 3.1 Attendance Settings
*   **Global Config**:
    *   Work Hours (Start/End).
    *   Grace Period (Minutes).
    *   Clock-in windows (Future/Past limit).
    *   **Weekly Schedule**: A custom DayPicker component (M-S) to toggle Onsite vs Remote days.
*   **Overrides**:
    *   Scope: Organization, Team, Staff Type, or User.
    *   Priority-based system: Higher priority overrides lower ones.
    *   Target picker: Integrated selection based on the chosen scope.

### 3.2 Leave Management
*   **Default Settings**: Select the default leave request type for the system.
*   **Request Type Registry**:
    *   Create/Edit leave types.
    *   **Rules Engine**:
        *   `entitled_days`: Numeric.
        *   `max_carryover`: Numeric.
        *   `allow_half_day`: Boolean toggle.
        *   `requires_attachment`: Boolean (e.g., medical reports).
        *   `min_notice_days`: Numeric notice period validation.
*   **Validation**: Hard validation on submission, with a "Save as Draft" option if requirements aren't met yet.

### 3.3 Office Locations (Geofencing)
*   Table view of active geofences.
*   Form fields: Name, Address, Latitude, Longitude, Radius (meters).
*   Multi-organization assignment.

## 4. API & Data
*   **Endpoints**: Reuse existing `/hr/employees/..`, `/policies`, and `/hr/attendance/locations`.
*   **Data Models**:
    *   `AttendanceConfig`: JSON object containing hours and schedule.
    *   `LeaveRule`: JSON schema stored within the Leave Request Type metadata.
    *   `OfficeLocation`: Standard entity with coordinates.

## 5. UI/UX Priorities
*   **Visual Excellence**: Use the shared `@stanforte/shared` component library.
*   **Mobile Responsive**: Ensure the side-nav collapses or turns into a top-scrollable bar on mobile.
*   **Icons**: Use Google Material Symbols (Clock, Beach Access, Location On).

---

## 6. Self-Review
*   **Placeholder scan**: None.
*   **Internal consistency**: Navigation pattern matches the rest of the PWA.
*   **Scope check**: Focused purely on HR Settings. Onboarding is acknowledged as the next module to implement.
