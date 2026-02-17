# Time & Attendance System Specifications

## System Overview

The Time & Attendance Management System is a WordPress-based solution that combines daily attendance tracking with comprehensive time-off management. It uses a team-based structure for organization and approvals.

## Core Components

### 1. Teams Structure
```sql
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}teams` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    lead_id BIGINT,  -- References employee_profiles.id
    parent_team_id BIGINT,  -- For sub-teams
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (parent_team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}team_members` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    UNIQUE KEY unique_team_employee (team_id, employee_id)
);
```

### 2. Employee Management
```sql
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_profiles` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wp_user_id BIGINT NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    position VARCHAR(100),
    employment_type ENUM('staff', 'contract', 'intern', 'consultant', 'management') NOT NULL,
    role ENUM('basic', 'team_lead', 'accountant', 'hr', 'admin', 'system') NOT NULL DEFAULT 'basic',
    reporting_to BIGINT,
    join_date DATE,
    employment_status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wp_user_id) REFERENCES {$wpdb->users}(ID)
);
```

### 3. Attendance & Time Off
```sql
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}attendance_records` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave', 'hybrid', 'holiday') NOT NULL,
    check_in DATETIME,
    check_out DATETIME,
    work_mode ENUM('office', 'hybrid', 'travel') DEFAULT 'office',
    location_in VARCHAR(255),
    location_out VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    UNIQUE KEY unique_employee_date (employee_id, date)
);

CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}time_off_requests` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    request_type ENUM('leave', 'hybrid', 'travel') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    work_plan TEXT,
    contact_info TEXT,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    current_approver_level INT NOT NULL DEFAULT 1,
    approved_by BIGINT,
    approval_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (approved_by) REFERENCES employee_profiles(id)
);

CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}leave_balances` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'study') NOT NULL,
    year INT NOT NULL,
    total_days INT NOT NULL,
    used_days INT DEFAULT 0,
    pending_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type, year)
);
```

### 4. Approval System
```sql
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}approval_hierarchy` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id BIGINT,
    level INT NOT NULL,  -- 1: Team Lead, 2: HR, 3: COO, 4: ED
    approver_id BIGINT,
    backup_approver_id BIGINT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (approver_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (backup_approver_id) REFERENCES employee_profiles(id)
);
```

## Business Rules

### 1. Employment Types
- Staff: Regular full-time employees
- Contract: Fixed-term employees
- Intern: Temporary training position
- Consultant: External professional service
- Management: Senior leadership positions

### 2. Roles & Permissions
- Basic: Default employee role
- Team Lead: Team management
- Accountant: Financial access
- HR: Employee management
- Admin: System management
- System: Technical administration

### 3. Approval Workflows
1. Standard Flow: Employee -> Team Lead -> HR
2. Management Flow: Management -> COO -> ED
3. Special Cases:
   - Leave > 5 days: COO approval
   - Study leave: ED approval
   - Sick leave > 3 days: HR verification
   - Hybrid work: Team Lead + HR

### 4. Permission Matrix
```php
const PERMISSIONS = [
    // Attendance
    'attendance.view.own' => ['basic', 'team_lead', 'accountant', 'hr', 'admin', 'system'],
    'attendance.view.team' => ['team_lead', 'hr', 'admin', 'system'],
    'attendance.view.all' => ['hr', 'admin', 'system'],
    
    // Approvals
    'requests.approve.team' => ['team_lead', 'hr', 'admin', 'system'],
    'requests.approve.override' => ['hr', 'admin', 'system'],
    
    // Reports
    'reports.view.team' => ['team_lead', 'hr', 'admin', 'system'],
    'reports.view.financial' => ['accountant', 'hr', 'admin', 'system'],
    'reports.view.all' => ['hr', 'admin', 'system'],
    
    // System
    'system.manage.employees' => ['hr', 'admin', 'system'],
    'system.manage.policies' => ['hr', 'admin', 'system'],
    'system.manage.technical' => ['system']
];
```

## Integration Points

### 1. WordPress Integration
- Uses WordPress user system for authentication
- Custom tables with `$wpdb->prefix`
- WordPress template system
- WordPress REST API endpoints

### 2. Frontend Integration
- Tailwind CSS for styling
- FullCalendar for calendar views
- AJAX for real-time updates
- Chart.js for data visualization

### 3. External Systems
- Email notifications via wp_mail()
- Location services for check-in/out
- Optional Slack notifications
