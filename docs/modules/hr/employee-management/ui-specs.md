# Employee Management System UI Specifications

## Page Structure

### 1. Staff Management (HR/Admin)
```
/staff
├── Directory
│   ├── Staff List
│   ├── Quick Filters
│   └── Bulk Actions
│
├── Add Employee
│   ├── Personal Information
│   ├── Employment Details
│   └── System Access
│
└── Documents
    ├── Document Categories
    ├── Upload Manager
    └── Document Status
```

### 2. Personal Profile
```
/profile
├── Overview
│   ├── Personal Information
│   ├── Contact Details
│   └── Emergency Contacts
│
├── Documents
│   ├── Required Documents
│   ├── Certifications
│   └── Upload History
│
├── Skills
│   ├── Technical Skills
│   ├── Soft Skills
│   └── Certifications
│
├── History
│   ├── Employment History
│   ├── Positions Held
│   └── References
│
└── Education
    ├── Academic History
    ├── Professional Training
    └── Continuing Education
```

## Component Specifications

### 1. Staff Directory
```html
<!-- Staff List Component -->
<div class="staff-directory">
    <div class="filters">
        <div class="search-box">
            <input type="text" placeholder="Search staff...">
        </div>
        
        <div class="filter-options">
            <select name="department">
                <option value="">All Departments</option>
            </select>
            
            <select name="status">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
    </div>
    
    <div class="staff-list">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Populated dynamically -->
            </tbody>
        </table>
    </div>
</div>
```

### 2. Employee Form
```html
<!-- Employee Form Component -->
<form class="employee-form">
    <div class="form-section">
        <h3>Personal Information</h3>
        
        <div class="form-row">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="first_name" required>
            </div>
            
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="last_name" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" name="phone">
            </div>
        </div>
    </div>
    
    <div class="form-section">
        <h3>Employment Details</h3>
        
        <div class="form-row">
            <div class="form-group">
                <label>Position</label>
                <input type="text" name="position" required>
            </div>
            
            <div class="form-group">
                <label>Department</label>
                <select name="department" required>
                    <!-- Populated dynamically -->
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Employment Type</label>
                <select name="employment_type" required>
                    <option value="staff">Staff</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                    <option value="consultant">Consultant</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Join Date</label>
                <input type="date" name="join_date" required>
            </div>
        </div>
    </div>
</form>
```

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
    --info: #3b82f6;
    
    /* Neutral Colors */
    --text: #1f2937;
    --text-light: #6b7280;
    --background: #ffffff;
    --background-alt: #f3f4f6;
    --border: #e5e7eb;
}
```

### 2. Typography
```css
/* Headings */
h1 { 
    font-size: 2rem; 
    font-weight: 700;
    color: var(--text);
}

h2 { 
    font-size: 1.5rem; 
    font-weight: 600;
    color: var(--text);
}

h3 { 
    font-size: 1.25rem; 
    font-weight: 600;
    color: var(--text);
}

/* Body Text */
body {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text);
}
```

### 3. Form Styles
```css
/* Form Elements */
.form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border);
    borgin-top: 1rem;
}

.wp-list-table th {
    text-align: left;
    padding: 1rem;
    background: var(--background-alt);
    font-weight: 600;
}der-radius: 0.375rem;
    transition: border-color 0.2s;
}

.form-input:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light);
}
```

### 4. Table Styles
```css
/* Table Elements */
.wp-list-table {
    border-collapse: collapse;
    width: 100%;
    mar
