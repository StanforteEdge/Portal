# Email Integration Module - Integration Notes

## Overview
This document outlines how the Email Integration Module integrates with the core Stanfort Edge Portal systems, dependencies, and implementation guidelines.

## Core System Dependencies

### 1. User Management System

#### Required Integration Points
```php
// Access user profile information
$user = $this->userService->getUser($userId);

// Check user permissions for email features
$canSendEmail = $this->permissionService->userCan($userId, 'send_emails');
$canManageAccounts = $this->permissionService->userCan($userId, 'manage_email_accounts');
```

#### User Profile Extensions
The Email module extends user profiles with email account information:
```php
$userProfile = [
    'basic_info' => [...],
    'email_accounts' => [
        [
            'id' => 'uuid',
            'email_address' => 'user@company.com',
            'provider' => 'google',
            'is_primary' => true,
            'last_sync' => '2025-01-15T10:30:00Z'
        ]
    ]
];
```

### 2. File Storage System

#### Attachment Integration
Email attachments are stored using the FileStorage system:
```php
// Store email attachment
$attachment = $this->fileStorage->storeAttachment([
    'filename' => 'document.pdf',
    'content' => $attachmentContent,
    'content_type' => 'application/pdf',
    'entity_type' => 'email_attachment',
    'entity_id' => $emailMessageId
]);

// Retrieve attachment for download
$attachment = $this->fileStorage->getFile($attachmentId);
```

#### File Upload Handling
When users compose emails with attachments:
```php
// Handle file upload through FileStorage
$uploadResult = $this->fileStorage->handleUpload($uploadedFile, [
    'entity_type' => 'email_draft',
    'entity_id' => $draftId,
    'temporary' => true // Mark as temporary until email is sent
]);

// Move to permanent storage when email is sent
$this->fileStorage->makePermanent($uploadResult['file_id'], [
    'entity_type' => 'email_attachment',
    'entity_id' => $sentEmailId
]);
```

### 3. Notification System

#### Email-Related Notifications
The Email module integrates with the Notification system for email-related alerts:
```php
// Notify user of new email
$this->notificationService->sendTemplateNotification(
    'new_email_received',
    [
        'sender' => $email->from_name,
        'subject' => $email->subject,
        'email_count' => $unreadCount
    ],
    $userId,
    'info',
    [
        'link' => "/emails/{$email->id}",
        'notifiable_type' => 'email',
        'notifiable_id' => $email->id
    ]
);

// Notify of email sending failure
$this->notificationService->sendNotification([
    'user_id' => $userId,
    'type' => 'error',
    'title' => 'Email Sending Failed',
    'message' => 'Your email could not be sent. Please try again.',
    'link' => '/emails/compose',
    'data' => ['error_details' => $errorMessage]
]);
```

#### Email Template Integration
Use the Notification system's template engine for email-specific templates:
```php
// Create email-specific notification template
$this->notificationTemplateService->createTemplate([
    'name' => 'email_signature_update',
    'subject' => 'Email Signature Updated',
    'content' => 'Your email signature has been successfully updated.',
    'type' => 'success',
    'variables' => ['old_signature', 'new_signature', 'updated_by']
]);
```

### 4. Audit Trail System

#### Email Activity Logging
All email activities are logged through the Audit system:
```php
// Log email account connection
$this->auditService->logActivity([
    'user_id' => $userId,
    'action' => 'email_account_connected',
    'entity_type' => 'email_account',
    'entity_id' => $accountId,
    'details' => [
        'provider' => $providerType,
        'email_address' => $emailAddress
    ],
    'ip_address' => $this->getClientIP(),
    'user_agent' => $this->getUserAgent()
]);

// Log email sent
$this->auditService->logActivity([
    'user_id' => $userId,
    'action' => 'email_sent',
    'entity_type' => 'email_message',
    'entity_id' => $messageId,
    'details' => [
        'to' => $recipients,
        'subject' => $subject,
        'has_attachments' => !empty($attachments)
    ]
]);
```

## Module Initialization

### 1. Service Registration
The Email module registers its services with the core system:
```php
// In module initialization
class EmailIntegrationModule {
    public static function init() {
        // Register email services
        Container::register('emailService', EmailService::class);
        Container::register('googleEmailProvider', GoogleProvider::class);
        Container::register('microsoftEmailProvider', MicrosoftProvider::class);

        // Register event listeners
        EventManager::listen('user.deleted', [self::class, 'onUserDeleted']);
        EventManager::listen('file.uploaded', [self::class, 'onFileUploaded']);

        // Register cron jobs
        CronManager::schedule('email_sync', '*/15 * * * *', [EmailSyncService::class, 'syncAllAccounts']);
    }

    public static function onUserDeleted($userId) {
        // Clean up user's email accounts and data
        EmailAccount::deleteByUserId($userId);
    }
}
```

### 2. Route Registration
Email routes are registered with the core routing system:
```php
// Register email routes
Route::group(['prefix' => 'api/v1', 'middleware' => ['auth']], function() {
    // Email management routes
    Route::apiResource('emails', EmailController::class);
    Route::post('emails/{id}/send', [EmailController::class, 'send']);
    Route::post('emails/{id}/reply', [EmailController::class, 'reply']);

    // Account management routes
    Route::apiResource('email-accounts', AccountController::class);
    Route::post('email-accounts/connect', [AccountController::class, 'connect']);
    Route::post('email-accounts/{id}/sync', [AccountController::class, 'sync']);

    // Folder management routes
    Route::get('email-folders', [FolderController::class, 'index']);
    Route::post('email-folders', [FolderController::class, 'store']);
});
```

### 3. Permission Registration
Email-specific permissions are registered with the RBAC system:
```php
// Register email permissions
PermissionManager::registerPermissions([
    'view_emails' => 'View email messages',
    'send_emails' => 'Send emails',
    'manage_email_accounts' => 'Connect and manage email accounts',
    'delete_emails' => 'Delete email messages',
    'manage_email_folders' => 'Create and manage email folders'
]);

// Assign default roles
RoleManager::assignDefaultPermissions('user', [
    'view_emails',
    'send_emails'
]);

RoleManager::assignDefaultPermissions('admin', [
    'view_emails',
    'send_emails',
    'manage_email_accounts',
    'delete_emails',
    'manage_email_folders'
]);
```

## Database Integration

### 1. Migration Strategy
Email module includes its own migrations that run during module activation:
```php
// Migration files are stored in Modules/EmailIntegration/Database/Migrations/
$emailMigrations = [
    'Migration_1_0_12_EmailAccounts.php',
    'Migration_1_0_13_EmailMessages.php',
    'Migration_1_0_14_EmailAttachments.php',
    'Migration_1_0_15_EmailFolders.php'
];

// Run migrations when module is activated
foreach ($emailMigrations as $migration) {
    MigrationRunner::run($migration);
}
```

### 2. Data Relationships
Email data integrates with core system data:
```sql
-- Link email accounts to users
ALTER TABLE sta_email_accounts
ADD CONSTRAINT fk_email_accounts_user_id
FOREIGN KEY (user_id) REFERENCES wp_users(ID);

-- Link email attachments to FileStorage
ALTER TABLE sta_email_attachments
ADD CONSTRAINT fk_email_attachments_file_id
FOREIGN KEY (file_id) REFERENCES sta_files(id);
```

## Configuration Integration

### 1. Module Configuration
Email settings are integrated into the core configuration system:
```php
// config/modules/email.php
return [
    'enabled' => env('EMAIL_MODULE_ENABLED', true),
    'providers' => [
        'google' => [
            'client_id' => env('GOOGLE_CLIENT_ID'),
            'client_secret' => env('GOOGLE_CLIENT_SECRET'),
            'redirect_uri' => env('GOOGLE_REDIRECT_URI')
        ],
        'microsoft' => [
            'client_id' => env('MICROSOFT_CLIENT_ID'),
            'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
            'redirect_uri' => env('MICROSOFT_REDIRECT_URI'),
            'tenant_id' => env('MICROSOFT_TENANT_ID')
        ]
    ],
    'sync' => [
        'interval' => env('EMAIL_SYNC_INTERVAL', 15), // minutes
        'batch_size' => env('EMAIL_SYNC_BATCH_SIZE', 50),
        'max_retries' => env('EMAIL_SYNC_MAX_RETRIES', 3)
    ],
    'storage' => [
        'max_attachment_size' => env('EMAIL_MAX_ATTACHMENT_SIZE', 25 * 1024 * 1024), // 25MB
        'allowed_extensions' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png', 'gif']
    ]
];
```

### 2. Environment Variables
Required environment variables for email integration:
```bash
# Google Workspace Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://portal.company.com/auth/google/callback

# Microsoft 365 Configuration
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://portal.company.com/auth/microsoft/callback
MICROSOFT_TENANT_ID=your_tenant_id

# Email Module Settings
EMAIL_MODULE_ENABLED=true
EMAIL_SYNC_INTERVAL=15
EMAIL_SYNC_BATCH_SIZE=50
EMAIL_MAX_ATTACHMENT_SIZE=26214400
```

## Event Integration

### 1. Core System Events
The Email module listens to and emits core system events:
```php
// Listen to user events
EventManager::listen('user.created', function($userId) {
    // Send welcome email or setup default email account
    EmailService::sendWelcomeEmail($userId);
});

EventManager::listen('user.deleted', function($userId) {
    // Clean up email data
    EmailAccount::deleteByUserId($userId);
    EmailMessage::deleteByUserId($userId);
});

// Emit email-specific events
EventManager::emit('email.received', [
    'user_id' => $userId,
    'message_id' => $messageId,
    'sender' => $senderEmail
]);

EventManager::emit('email.sent', [
    'user_id' => $userId,
    'message_id' => $messageId,
    'recipients' => $recipients
]);
```

### 2. Workflow Integration
Email events can trigger workflow processes:
```php
// Trigger workflow when important email is received
EventManager::listen('email.received', function($eventData) {
    $email = EmailMessage::find($eventData['message_id']);

    // Check if email is from important sender
    if (self::isImportantSender($email->from_address)) {
        // Trigger approval workflow
        WorkflowService::startWorkflow('important_email_review', [
            'email_id' => $email->id,
            'user_id' => $eventData['user_id']
        ]);
    }
});
```

## Error Handling Integration

### 1. Centralized Error Handling
Email errors are handled through the core error handling system:
```php
try {
    $result = $emailProvider->sendEmail($emailData);
} catch (AuthenticationException $e) {
    // Handle OAuth token issues
    ErrorHandler::logError('Email authentication failed', [
        'user_id' => $userId,
        'provider' => $providerType,
        'error' => $e->getMessage()
    ]);

    // Attempt token refresh
    $this->refreshOAuthToken($accountId);

} catch (RateLimitException $e) {
    // Handle API rate limiting
    ErrorHandler::logError('Email API rate limit exceeded', [
        'user_id' => $userId,
        'provider' => $providerType,
        'retry_after' => $e->getRetryAfter()
    ]);

    // Schedule retry
    QueueManager::scheduleRetry($this, 'sendEmail', $emailData, $e->getRetryAfter());

} catch (\Exception $e) {
    // Generic error handling
    ErrorHandler::logError('Email operation failed', [
        'user_id' => $userId,
        'operation' => 'send_email',
        'error' => $e->getMessage()
    ]);

    // Notify user of failure
    NotificationService::sendNotification([
        'user_id' => $userId,
        'type' => 'error',
        'title' => 'Email Delivery Failed',
        'message' => 'Your email could not be delivered. Please try again.'
    ]);
}
```

### 2. Monitoring Integration
Email module integrates with core monitoring systems:
```php
// Track email metrics
MetricsCollector::increment('emails.sent', ['provider' => $providerType]);
MetricsCollector::increment('emails.failed', ['provider' => $providerType, 'error_type' => $errorType]);

// Log performance metrics
PerformanceMonitor::recordTiming('email_sync', $syncDuration);
PerformanceMonitor::recordTiming('email_send', $sendDuration);
```

## Testing Integration

### 1. Mock Services for Testing
The Email module provides mock services for testing:
```php
class MockEmailProvider implements EmailProviderInterface {
    public function sendEmail($to, $subject, $body, $options = []) {
        // Log email instead of actually sending
        TestLogger::logEmailSent([
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'options' => $options
        ]);

        return ['message_id' => 'mock_' . uniqid()];
    }

    public function getEmails($folder = 'INBOX', $limit = 50) {
        // Return mock email data
        return [
            [
                'id' => 'mock_email_1',
                'subject' => 'Test Email',
                'from' => 'test@example.com',
                'body' => 'This is a test email'
            ]
        ];
    }
}
```

### 2. Integration Test Setup
Tests verify integration with core systems:
```php
class EmailIntegrationTest extends TestCase {
    public function testEmailTriggersNotification() {
        // Test that email reception triggers notification
        $emailData = ['from' => 'sender@example.com', 'subject' => 'Test'];
        $this->emailService->processIncomingEmail($emailData);

        // Verify notification was created
        $this->assertDatabaseHas('sta_notifications', [
            'user_id' => $this->testUserId,
            'type' => 'email_received'
        ]);
    }

    public function testEmailAttachmentStoredInFileSystem() {
        // Test that email attachments are stored in FileStorage
        $attachmentData = ['filename' => 'test.pdf', 'content' => 'mock content'];
        $emailId = $this->emailService->saveEmailWithAttachment($attachmentData);

        // Verify file was stored
        $this->assertDatabaseHas('sta_files', [
            'entity_type' => 'email_attachment',
            'entity_id' => $emailId
        ]);
    }
}
```

## Deployment Integration

### 1. Module Activation
When the Email module is activated:
```php
// Run database migrations
MigrationRunner::runModuleMigrations('EmailIntegration');

// Register permissions
PermissionManager::registerModulePermissions('EmailIntegration');

// Set up cron jobs
CronManager::registerModuleJobs('EmailIntegration');

// Initialize OAuth applications
OAuthManager::registerApplications([
    'google_email' => [
        'client_id' => Config::get('modules.email.providers.google.client_id'),
        'client_secret' => Config::get('modules.email.providers.google.client_secret'),
        'scopes' => ['gmail.readonly', 'gmail.send']
    ]
]);
```

### 2. Module Deactivation
When the Email module is deactivated:
```php
// Stop sync jobs
CronManager::unregisterModuleJobs('EmailIntegration');

// Revoke OAuth tokens
OAuthManager::revokeModuleTokens('EmailIntegration');

// Optional: Keep data or clean up
if (Config::get('modules.email.cleanup_on_deactivation')) {
    EmailAccount::deactivateAll();
    EmailMessage::archiveOldMessages();
}
```

## Summary

The Email Integration Module is designed to seamlessly integrate with all core Stanfort Edge Portal systems:

- **User Management**: Leverages user profiles and permissions
- **File Storage**: Uses existing file management for attachments
- **Notifications**: Integrates with notification system for alerts
- **Audit Trail**: Logs all email activities for compliance
- **Workflow**: Can trigger workflows based on email events
- **RBAC**: Uses existing permission system for access control

This modular approach ensures the Email system enhances rather than complicates the core portal functionality.
