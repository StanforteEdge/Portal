# Employee Management System Specifications

## Database Schema

### 1. Core Employee Data
```sql
-- Employee profiles (extends WordPress users)
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_profiles` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wp_user_id BIGINT NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    other_names VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') NOT NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed'),
    nationality VARCHAR(50),
    national_id VARCHAR(50),
    tax_id VARCHAR(50),
    pension_id VARCHAR(50),
    employment_type ENUM('staff', 'contract', 'intern', 'consultant', 'management') NOT NULL,
    role ENUM('basic', 'team_lead', 'accountant', 'hr', 'admin', 'system') NOT NULL DEFAULT 'basic',
    position VARCHAR(100),
    join_date DATE,
    end_date DATE,
    employment_status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wp_user_id) REFERENCES {$wpdb->users}(ID)
);

-- Contact Information
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_contacts` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    contact_type ENUM('email', 'phone', 'address') NOT NULL,
    contact_value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id)
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}emergency_contacts` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id)
);
```

### 2. Professional Information
```sql
-- Skills and Qualifications
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_skills` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
    years_experience INT,
    is_verified BOOLEAN DEFAULT false,
    verified_by BIGINT,
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (verified_by) REFERENCES employee_profiles(id)
);

-- Employment History
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employment_history` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    responsibilities TEXT,
    reference_name VARCHAR(100),
    reference_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id)
);

-- Education and Certifications
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_education` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    institution VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100),
    start_date DATE,
    end_date DATE,
    grade VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id)
);
```

### 3. Document Management
```sql
-- Document Categories
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}document_categories` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}employee_documents` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    document_name VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    version INT DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    uploaded_by BIGINT NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (category_id) REFERENCES document_categories(id),
    FOREIGN KEY (uploaded_by) REFERENCES employee_profiles(id)
);
```

### 4. Disability & Accommodation
```sql
-- Disability Information
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}disability_information` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    disability_type VARCHAR(100) NOT NULL,
    description TEXT,
    onset_date DATE,
    is_permanent BOOLEAN DEFAULT true,
    medical_documentation_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id),
    FOREIGN KEY (medical_documentation_id) REFERENCES employee_documents(id)
);

-- Accommodation Requirements
CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}accommodation_requirements` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    disability_id BIGINT NOT NULL,
    requirement_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('requested', 'approved', 'implemented', 'declined') NOT NULL,
    approved_by BIGINT,
    approved_at DATETIME,
    implementation_notes TEXT,
    review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disability_id) REFERENCES disability_information(id),
    FOREIGN KEY (approved_by) REFERENCES employee_profiles(id)
);
```

## Business Rules

### 1. Data Privacy
- Personal information access restricted to HR and authorized personnel
- Document access logged and audited
- Sensitive information encrypted
- GDPR compliance measures

### 2. Document Management
- Required documents must be uploaded within 30 days of joining
- Document versions maintained
- Automatic notifications for expiring documents
- Secure document storage and access

### 3. Data Validation
- Required fields must be completed
- Document size and type restrictions
- Data format validation
- Duplicate check for unique fields

## Integration Points

### 1. WordPress Integration
- User authentication
- File uploads
- Email notifications
- Role management

### 2. External Systems
- Document storage service
- Email service
- SMS notifications
- Data backup system

## Security Measures

### 1. Access Control
```php
const PERMISSIONS = [
    // Profile Access
    'profile.view.own' => ['basic', 'team_lead', 'accountant', 'hr', 'admin', 'system'],
    'profile.view.team' => ['team_lead', 'hr', 'admin', 'system'],
    'profile.view.all' => ['hr', 'admin', 'system'],
    'profile.edit.own' => ['basic', 'team_lead', 'accountant', 'hr', 'admin', 'system'],
    'profile.edit.all' => ['hr', 'admin', 'system'],
    
    // Document Access
    'documents.view.own' => ['basic', 'team_lead', 'accountant', 'hr', 'admin', 'system'],
    'documents.view.team' => ['team_lead', 'hr', 'admin', 'system'],
    'documents.view.all' => ['hr', 'admin', 'system'],
    'documents.upload' => ['hr', 'admin', 'system'],
    'documents.delete' => ['hr', 'admin', 'system'],
    
    // System Access
    'system.manage.categories' => ['hr', 'admin', 'system'],
    'system.manage.settings' => ['admin', 'system'],
    'system.view.logs' => ['admin', 'system']
];
```

### 2. Data Protection
- Encryption at rest
- Secure file storage
- Access logging
- Regular backups
