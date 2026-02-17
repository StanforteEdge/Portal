# Time & Attendance System UI Specifications

## Page Structure

### 1. Employee Dashboard
```
/attendance/dashboard
├── Check-in/out Section
│   ├── Current status
│   ├── Work mode selector
│   └── Location capture
│
├── Calendar View
│   ├── Personal schedule
│   ├── Team schedule (read-only)
│   └── Upcoming time-off
│
└── Quick Actions
    ├── Request time-off
    ├── View history
    └── Team overview
```

### 2. Team Lead Dashboard
```
/attendance/team-lead
├── Team Overview
│   ├── Present/Absent count
│   ├── On leave count
│   └── Hybrid work count
│
├── Calendar View
│   ├── Team schedule
│   ├── Pending requests
│   └── Approved time-off
│
└── Request Management
    ├── Pending approvals
    ├── Recent actions
    └── Team reports
```

### 3. HR Dashboard
```
/attendance/hr
├── Company Overview
│   ├── Attendance statistics
│   ├── Leave statistics
│   └── Hybrid work stats
│
├── Management
│   ├── Employee profiles
│   ├── Team management
│   └── Policy settings
│
└── Reports & Analytics
    ├── Custom reports
    ├── Export data
    └── Audit logs
```

## Component Specifications

### 1. Calendar Component
- Uses FullCalendar
- Color-coded events
- Drag-drop disabled
- Responsive design
- Team view support

### 2. Request Forms
```html
<!-- Time Off Request -->
<form class="space-y-4">
    <div class="request-type-tabs">
        <!-- Leave Request Tab -->
        <div class="tab active">
            <select name="leave_type">
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Study Leave</option>
            </select>
        </div>
        
        <!-- Hybrid Work Tab -->
        <div class="tab">
            <textarea name="work_plan" 
                      placeholder="Describe your work plan...">
            </textarea>
        </div>
    </div>
    
    <div class="date-range">
        <input type="date" name="start_date">
        <input type="date" name="end_date">
    </div>
    
    <div class="reason">
        <textarea name="reason" 
                  placeholder="Reason for request...">
        </textarea>
    </div>
    
    <button type="submit">Submit Request</button>
</form>
```

### 3. Dashboard Cards
```html
<!-- Status Card -->
<div class="card">
    <div class="card-header">
        <h3>Team Status</h3>
    </div>
    <div class="card-body">
        <div class="status-item">
            <span class="label">Present</span>
            <span class="count">15</span>
        </div>
        <div class="status-item">
            <span class="label">On Leave</span>
            <span class="count">3</span>
        </div>
        <div class="status-item">
            <span class="label">Hybrid</span>
            <span class="count">5</span>
        </div>
    </div>
</div>
```

## Navigation Structure

### 1. Main Navigation
- Dashboard
- Team Management
- Requests
- Reports
- Settings

### 2. Quick Actions
- Check In/Out
- New Request
- View Schedule
- Team Overview

### 3. Context Menus
- Profile Settings
- Notifications
- Help & Support
- Logout

## UI Guidelines

### 1. Color Scheme
```css
:root {
    /* Primary Colors */
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #3b82f6;
    
    /* Status Colors */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    
    /* Neutral Colors */
    --text: #1f2937;
    --text-light: #6b7280;
    --background: #ffffff;
    --background-alt: #f3f4f6;
}
```

### 2. Typography
```css
/* Headings */
h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Body Text */
body {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.5;
}
```

### 3. Spacing
```css
/* Standard Spacing */
.space-y-4 > * + * { margin-top: 1rem; }
.space-x-4 > * + * { margin-left: 1rem; }

/* Padding */
.p-4 { padding: 1rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
```

### 4. Components
```css
/* Cards */
.card {
    background: var(--background);
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 1rem;
}

/* Buttons */
.btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

/* Forms */
.form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--text-light);
    border-radius: 0.375rem;
}
```

## Responsive Design

### 1. Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 2. Layout Adjustments
- Single column on mobile
- Two columns on tablet
- Three columns on desktop
- Responsive navigation menu
- Collapsible sidebars

### 3. Touch Optimization
- Minimum tap target size: 44px
- Touch-friendly inputs
- Swipe gestures for mobile
- Mobile-optimized forms
