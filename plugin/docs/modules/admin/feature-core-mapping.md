# Admin Module - Feature-Core Mapping

## Overview
This document maps Admin Module features to existing Core systems, ensuring seamless integration and avoiding duplication of functionality. The Admin Module extends rather than replaces existing Core capabilities.

## Feature-Core Integration Matrix

### 1. User Management Features

| Feature | Core System | Integration Method | Extension Points |
|---------|-------------|-------------------|------------------|
| **User Onboarding** | `Core/User` | Extends `User` model | Custom fields, workflows |
| **Profile Management** | `Core/User` | Uses `sta_profiles` table | Admin-specific fields |
| **User Search** | `Core/User` | Leverages `search()` method | Custom search filters |
| **Bulk Operations** | `Core/User` + `Core/FileStorage` | CSV processing + file upload | Import validation rules |
| **User Lifecycle** | `Core/User` + `Core/Workflow` | Status changes + approval workflows | Custom lifecycle states |

### 2. Team Management Features

| Feature | Core System | Integration Method | Extension Points |
|---------|-------------|-------------------|------------------|
| **Team Creation** | `Core/User/Models/Group` | Uses `sta_groups` table | Team-specific metadata |
| **Hierarchy Management** | `Core/User/Models/Group` | Parent-child relationships | Team structure validation |
| **User Assignment** | `Core/User/Models/GroupUser` | Membership management | Bulk assignment logic |
| **Team Leads** | `Core/User/Models/Group` | Role-based permissions | Leadership designation |
| **Team Analytics** | `Core/User/Services/GroupService` | Reporting integration | Custom analytics queries |

### 3. Program Management Features

| Feature | Core System | Integration Method | Extension Points |
|---------|-------------|-------------------|------------------|
| **Program Creation** | `Core/User/Models/Group` | Extended group functionality | Program-specific fields |
| **Program Hierarchies** | `Core/User/Models/Group` | Parent-child relationships | Program structure logic |
| **User Enrollment** | `Core/User/Models/GroupUser` | Membership management | Enrollment workflows |
| **Progress Tracking** | `Core/User/Services/GroupService` | Activity logging | Custom progress metrics |
| **Program Analytics** | `Core/Reporting` | Reporting integration | Program-specific reports |

### 4. Access Control Features

| Feature | Core System | Integration Method | Extension Points |
|---------|-------------|-------------------|------------------|
| **Role Management** | `Core/Auth/Models/Role` | Uses `sta_roles` table | Admin role definitions |
| **Permission Management** | `Core/Auth/Models/Permission` | Uses `sta_permissions` table | Granular admin permissions |
| **Role Assignment** | `Core/Auth/Models/UserRole` | Uses `sta_user_roles` table | Bulk assignment logic |
| **Security Policies** | `Core/Auth/Middleware/AuthMiddleware` | Leverages existing middleware | Custom security rules |
| **Audit Logging** | `Core/Audit` | Uses existing audit system | Admin action logging |

### 5. System Administration Features

| Feature | Core System | Integration Method | Extension Points |
|---------|-------------|-------------------|------------------|
| **System Settings** | `Core/Config` | Configuration management | Admin-specific settings |
| **Notification Management** | `Core/Notification` | Template management | Admin notification templates |
| **Backup & Recovery** | `Core/Backup` | Backup system integration | Admin-controlled backups |
| **System Monitoring** | `Core/Monitoring` | Monitoring integration | Admin dashboard metrics |
| **Integration Management** | `Core/Api` | API management | External system connections |

## Detailed Integration Architecture

### User Management Integration

#### Core/User System Extensions
```php
// Extended User model for Admin functionality
class AdminUser extends CoreUser {
    protected $adminFields = [
        'employee_id',
        'department',
        'manager_id',
        'hire_date',
        'termination_date'
    ];

    // Admin-specific methods
    public function getTeamMemberships() {
        return $this->getGroupMemberships('team');
    }

    public function getProgramEnrollments() {
        return $this->getGroupMemberships('program');
    }
}
```

#### Integration with Core/Auth
```php
// Extended authentication for admin features
class AdminAuth extends CoreAuth {
    public function hasAdminPermission($permission) {
        // Check admin-specific permissions
        return $this->user->hasPermission($permission, 'admin');
    }

    public function canManageUsers() {
        return $this->hasAdminPermission('user.management');
    }
}
```

### Team Management Integration

#### Core/Group System Extensions
```php
// Extended Group model for Team functionality
class AdminTeam extends CoreGroup {
    const TYPE_TEAM = 'team';

    protected $teamFields = [
        'team_lead_user_id',
        'department_id',
        'budget_code',
        'location'
    ];

    public function getTeamLead() {
        return $this->getUserByRole('team_lead');
    }

    public function getDepartment() {
        return $this->getParentGroup('department');
    }
}
```

### Workflow Integration

#### Admin Workflow Extensions
```php
// Admin-specific workflow configurations
class AdminWorkflow extends CoreWorkflow {
    public function createUserOnboardingWorkflow($userData) {
        return $this->createWorkflow([
            'name' => 'User Onboarding: ' . $userData['name'],
            'entity_type' => 'user',
            'entity_id' => $userData['id'],
            'config' => $this->getOnboardingConfig()
        ]);
    }

    public function createTeamCreationWorkflow($teamData) {
        return $this->createWorkflow([
            'name' => 'Team Creation: ' . $teamData['name'],
            'entity_type' => 'team',
            'entity_id' => $teamData['id'],
            'config' => $this->getTeamCreationConfig()
        ]);
    }
}
```

## Database Integration

### Existing Tables Used
```sql
-- Core system tables leveraged by Admin Module
sta_profiles           -- User profiles (extended)
sta_groups            -- Teams and programs (extended)
sta_group_users       -- Team/program memberships
sta_roles             -- User roles (extended)
sta_permissions       -- System permissions (extended)
sta_user_roles        -- Role assignments
sta_workflows         -- Admin workflows
sta_workflow_steps    -- Workflow steps
sta_notifications     -- Admin notifications
sta_notification_templates -- Notification templates
sta_audit_logs        -- Admin action audit trails
```

### Admin-Specific Extensions
```sql
-- Optional admin-specific tables (if needed)
CREATE TABLE IF NOT EXISTS sta_admin_settings (
    id CHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'json', 'boolean', 'number'),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sta_user_imports (
    id CHAR(36) PRIMARY KEY,
    filename VARCHAR(255),
    total_records INT,
    processed_records INT,
    failed_records INT,
    status ENUM('processing', 'completed', 'failed'),
    import_errors TEXT,
    imported_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
```

## API Integration

### Extended Core APIs
```
Core/User APIs (Extended):
POST   /api/v1/users/bulk-import     # Admin bulk import
PUT    /api/v1/users/{id}/admin      # Admin profile updates
DELETE /api/v1/users/{id}/admin      # Admin user deactivation

Core/Groups APIs (Extended):
POST   /api/v1/groups/teams          # Team creation
PUT    /api/v1/groups/{id}/members   # Bulk member management
POST   /api/v1/groups/programs       # Program creation

Core/Auth APIs (Extended):
POST   /api/v1/admin/roles           # Admin role management
PUT    /api/v1/admin/permissions     # Permission management
```

### New Admin APIs
```
Admin-Specific APIs:
GET    /api/v1/admin/dashboard       # Admin dashboard
POST   /api/v1/admin/users/import    # User import
GET    /api/v1/admin/teams/report    # Team reports
POST   /api/v1/admin/system/backup   # System backup
GET    /api/v1/admin/audit/logs      # Audit logs
```

## Notification Integration

### Extended Core Notifications
```php
// Leverage existing notification templates
$adminNotifications = [
    'user_onboarding_complete' => [
        'template' => 'core.user.welcome',
        'channels' => ['email', 'in_app']
    ],
    'team_membership_changed' => [
        'template' => 'core.group.membership',
        'channels' => ['email', 'in_app']
    ],
    'admin_action_performed' => [
        'template' => 'admin.action',
        'channels' => ['email', 'in_app', 'audit']
    ]
];
```

## Security Integration

### Extended Core Security
```php
// Leverage existing security middleware
$adminSecurity = [
    'permissions' => [
        'user.create' => 'admin.user.create',
        'user.delete' => 'admin.user.delete',
        'team.manage' => 'admin.team.manage'
    ],
    'audit' => [
        'log_actions' => true,
        'sensitive_fields' => ['password', 'salary', 'personal_info'],
        'retention_days' => 2555
    ]
];
```

## Reporting Integration

### Extended Core Reporting
```php
// Leverage existing reporting system
$adminReports = [
    'user_activity' => [
        'data_source' => 'sta_profiles',
        'filters' => ['status' => 'active'],
        'metrics' => ['total_users', 'new_users', 'active_users']
    ],
    'team_utilization' => [
        'data_source' => 'sta_groups',
        'filters' => ['type' => 'team'],
        'metrics' => ['total_teams', 'avg_team_size', 'utilization_rate']
    ],
    'admin_actions' => [
        'data_source' => 'sta_audit_logs',
        'filters' => ['module' => 'admin'],
        'metrics' => ['total_actions', 'failed_actions', 'avg_response_time']
    ]
];
```

## Implementation Benefits

### ✅ Integration Advantages
- **Unified Architecture**: Single system for all user/team management
- **Consistent Security**: Same security model across all modules
- **Shared Resources**: Common database connections and caching
- **Unified Monitoring**: Single monitoring and logging system

### ✅ Development Efficiency
- **Reuse Existing Code**: Leverage proven Core functionality
- **Faster Development**: Focus on admin-specific features only
- **Easier Testing**: Test against established Core components
- **Simplified Maintenance**: Single codebase to maintain

### ✅ User Experience
- **Consistent Interface**: Same look and feel across modules
- **Unified Navigation**: Seamless movement between admin functions
- **Shared Data**: Real-time data consistency across systems
- **Integrated Workflows**: Cross-module workflow capabilities

### ✅ Scalability & Performance
- **Proven Scalability**: Core systems designed for growth
- **Optimized Performance**: Core optimizations benefit admin functions
- **Resource Efficiency**: Shared resources reduce overhead
- **Caching Benefits**: Unified caching strategy

## Migration Strategy

### Phase 1: Core Integration (Week 1)
1. ✅ Map existing admin functions to Core systems
2. ✅ Identify extension points in Core models
3. ✅ Plan database schema extensions
4. ✅ Design API extensions

### Phase 2: Feature Development (Week 2-3)
1. ✅ Implement user management extensions
2. ✅ Build team management interfaces
3. ✅ Create program management features
4. ✅ Develop admin-specific workflows

### Phase 3: Integration Testing (Week 4)
1. ✅ Test Core system integrations
2. ✅ Validate data consistency
3. ✅ Performance testing with Core systems
4. ✅ Security testing and validation

### Phase 4: Deployment & Training (Week 5)
1. ✅ Deploy admin extensions
2. ✅ Migrate existing admin data
3. ✅ Train administrators on new system
4. ✅ Go-live support and monitoring

This feature-core mapping ensures the Admin Module integrates seamlessly with existing Core systems while providing comprehensive administrative capabilities.
