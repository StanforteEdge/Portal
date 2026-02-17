# Email Integration Module - Technical Specification

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Portal    │────│  Email Module    │────│ Email Providers │
│                 │    │                  │    │                 │
│ • User Interface│    │ • Email Service  │    │ • Gmail API     │
│ • API Endpoints │    │ • Account Mgmt   │    │ • Microsoft     │
│ • Authentication │    │ • Message Sync   │    │ • Outlook      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   Core Systems      │
                    │                     │
                    │ • User Management   │
                    │ • File Storage      │
                    │ • Notifications     │
                    │ • Audit Logging     │
                    └─────────────────────┘
```

### 1.2 Module Components

#### Core Classes
```php
// Main service
EmailIntegration\EmailService

// Provider implementations
EmailIntegration\Providers\GoogleProvider
EmailIntegration\Providers\MicrosoftProvider
EmailIntegration\Providers\EmailProviderInterface

// Controllers
EmailIntegration\Controllers\EmailController
EmailIntegration\Controllers\AccountController
EmailIntegration\Controllers\FolderController

// Models
EmailIntegration\Models\EmailAccount
EmailIntegration\Models\EmailMessage
EmailIntegration\Models\EmailAttachment
EmailIntegration\Models\EmailFolder
```

## 2. Database Design

### 2.1 Email Accounts Table
```sql
CREATE TABLE sta_email_accounts (
    id CHAR(36) PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    provider_type ENUM('google', 'microsoft') NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    account_name VARCHAR(100),

    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    -- Configuration
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency INT DEFAULT 15, -- minutes
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'idle',

    -- Metadata
    provider_data JSON, -- Additional provider-specific data
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES wp_users(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_email (user_id, email_address),
    INDEX idx_provider_type (provider_type),
    INDEX idx_user_id (user_id),
    INDEX idx_active (is_active)
);
```

### 2.2 Email Messages Table
```sql
CREATE TABLE sta_email_messages (
    id CHAR(36) PRIMARY KEY,
    account_id CHAR(36) NOT NULL,
    external_id VARCHAR(255) NOT NULL, -- Provider's message ID

    -- Message content
    subject VARCHAR(1000),
    body TEXT,
    body_html TEXT,
    snippet TEXT,

    -- Participants
    from_address VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    to_addresses JSON,
    cc_addresses JSON,
    bcc_addresses JSON,

    -- Message metadata
    sent_at TIMESTAMP,
    received_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    labels JSON, -- Provider-specific labels/tags

    -- Folder/organization
    folder_id CHAR(36),
    thread_id VARCHAR(255), -- For conversation threading

    -- Attachments
    has_attachments BOOLEAN DEFAULT FALSE,
    attachment_count INT DEFAULT 0,

    -- System metadata
    message_size INT, -- Size in bytes
    sync_status VARCHAR(50) DEFAULT 'synced',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES sta_email_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES sta_email_folders(id) ON DELETE SET NULL,
    INDEX idx_account_id (account_id),
    INDEX idx_external_id (external_id),
    INDEX idx_folder_id (folder_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_received_at (received_at),
    INDEX idx_is_read (is_read),
    INDEX idx_thread_id (thread_id),
    UNIQUE KEY unique_account_external (account_id, external_id)
);
```

### 2.3 Email Attachments Table
```sql
CREATE TABLE sta_email_attachments (
    id CHAR(36) PRIMARY KEY,
    message_id CHAR(36) NOT NULL,
    external_id VARCHAR(255), -- Provider's attachment ID

    -- File information
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size INT, -- Size in bytes
    content_id VARCHAR(255), -- For inline attachments

    -- Storage information
    storage_path VARCHAR(500), -- Path in FileStorage system
    file_hash VARCHAR(64), -- For deduplication

    -- Metadata
    is_inline BOOLEAN DEFAULT FALSE,
    download_url VARCHAR(1000), -- Temporary download URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES sta_email_messages(id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id),
    INDEX idx_external_id (external_id),
    INDEX idx_content_id (content_id)
);
```

### 2.4 Email Folders Table
```sql
CREATE TABLE sta_email_folders (
    id CHAR(36) PRIMARY KEY,
    account_id CHAR(36) NOT NULL,
    external_id VARCHAR(255), -- Provider's folder ID

    -- Folder information
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    folder_type ENUM('inbox', 'sent', 'drafts', 'trash', 'archive', 'custom') DEFAULT 'custom',

    -- Hierarchy
    parent_id CHAR(36),
    path VARCHAR(1000), -- Full path for nested folders

    -- Statistics
    message_count INT DEFAULT 0,
    unread_count INT DEFAULT 0,

    -- Synchronization
    sync_token VARCHAR(255), -- Provider's sync token
    last_sync_at TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES sta_email_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES sta_email_folders(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_external_id (external_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_folder_type (folder_type)
);
```

## 3. API Design

### 3.1 Email Management Endpoints

#### Send Email
```http
POST /api/v1/emails/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": "uuid",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Email Subject",
  "body": "Email content in HTML or plain text",
  "body_type": "html|text",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content",
      "content_type": "application/pdf"
    }
  ],
  "priority": "normal",
  "save_to_sent": true
}
```

#### Get Emails
```http
GET /api/v1/emails?account_id={uuid}&folder=inbox&page=1&per_page=50&q=subject:meeting
Authorization: Bearer {token}
```

Response:
```json
{
  "emails": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "subject": "Meeting Tomorrow",
      "from": {"email": "sender@example.com", "name": "John Doe"},
      "to": [{"email": "recipient@example.com"}],
      "sent_at": "2025-01-15T10:30:00Z",
      "is_read": false,
      "has_attachments": true,
      "snippet": "Hi, just a reminder about our meeting tomorrow at 2 PM..."
    }
  ],
  "pagination": {
    "total": 1250,
    "per_page": 50,
    "current_page": 1,
    "last_page": 25
  }
}
```

### 3.2 Account Management Endpoints

#### Connect Email Account
```http
POST /api/v1/email-accounts/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "google|microsoft",
  "authorization_code": "oauth-code"
}
```

#### Get Connected Accounts
```http
GET /api/v1/email-accounts
Authorization: Bearer {token}
```

Response:
```json
{
  "accounts": [
    {
      "id": "uuid",
      "email_address": "user@company.com",
      "provider": "google",
      "account_name": "Work Email",
      "is_active": true,
      "last_sync_at": "2025-01-15T10:30:00Z",
      "sync_status": "success"
    }
  ]
}
```

## 4. Provider Integration

### 4.1 Google Workspace Integration

#### Required Scopes
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.compose
```

#### Authentication Flow
1. User clicks "Connect Google Account"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Receive authorization code
5. Exchange code for access/refresh tokens
6. Store encrypted tokens in database

#### Email Synchronization
- Use Gmail API `messages.list` with sync tokens
- Fetch message metadata first, then full content on demand
- Handle pagination and rate limiting
- Update local database with changes

### 4.2 Microsoft 365 Integration

#### Required Permissions
```
Mail.Read
Mail.Send
Mail.ReadWrite
User.Read
```

#### Authentication Flow
1. User clicks "Connect Microsoft Account"
2. Redirect to Microsoft OAuth consent screen
3. User grants permissions
4. Receive authorization code
5. Exchange code for access token
6. Store encrypted tokens in database

#### Email Synchronization
- Use Microsoft Graph API `/me/messages`
- Support delta queries for efficient sync
- Handle folder organization
- Support shared mailboxes

## 5. Security Implementation

### 5.1 Token Encryption
```php
class TokenEncryption {
    private static $key = 'your-encryption-key';

    public static function encrypt($data) {
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt(
            json_encode($data),
            'AES-256-CBC',
            self::$key,
            0,
            $iv
        );
        return base64_encode($iv . $encrypted);
    }

    public static function decrypt($encryptedData) {
        $data = base64_decode($encryptedData);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        $decrypted = openssl_decrypt(
            $encrypted,
            'AES-256-CBC',
            self::$key,
            0,
            $iv
        );
        return json_decode($decrypted, true);
    }
}
```

### 5.2 Permission Checks
```php
class EmailPermissions {
    public static function canAccessAccount($userId, $accountId) {
        $account = EmailAccount::find($accountId);
        return $account && $account->user_id == $userId;
    }

    public static function canSendFromAccount($userId, $accountId) {
        $account = EmailAccount::find($accountId);
        return $account && $account->user_id == $userId && $account->is_active;
    }
}
```

## 6. Synchronization Strategy

### 6.1 Background Sync Process
```php
class EmailSyncService {
    public static function syncAccount($accountId) {
        $account = EmailAccount::find($accountId);

        // Update sync status
        $account->update($accountId, [
            'sync_status' => 'running',
            'last_sync_at' => current_time('mysql')
        ]);

        try {
            // Get appropriate provider
            $provider = self::getProvider($account->provider_type);

            // Sync folders
            self::syncFolders($provider, $account);

            // Sync messages
            self::syncMessages($provider, $account);

            // Update sync status
            $account->update($accountId, [
                'sync_status' => 'success'
            ]);

        } catch (\Exception $e) {
            // Log error and update sync status
            error_log('Email sync failed for account ' . $accountId . ': ' . $e->getMessage());
            $account->update($accountId, [
                'sync_status' => 'error'
            ]);
        }
    }
}
```

### 6.2 Sync Scheduling
- Use WordPress cron for scheduled sync
- Configurable sync intervals per account
- Manual sync triggers from UI
- Background processing for large email volumes

## 7. Performance Optimization

### 7.1 Caching Strategy
- Cache frequently accessed emails
- Cache account metadata
- Cache folder structures
- Implement cache invalidation

### 7.2 Database Optimization
- Proper indexing on frequently queried columns
- Partitioning for large email tables
- Archive old emails to separate tables
- Optimize queries with proper joins

### 7.3 API Rate Limiting
- Respect provider API limits
- Implement exponential backoff
- Queue requests during high load
- Monitor API usage and quotas

## 8. Error Handling and Logging

### 8.1 Error Categories
- **Authentication Errors**: Token expiry, permission issues
- **Network Errors**: API timeouts, connectivity issues
- **Rate Limiting**: Provider quota exceeded
- **Data Errors**: Invalid email format, missing attachments

### 8.2 Logging Strategy
```php
class EmailLogger {
    public static function logSync($accountId, $action, $data = []) {
        error_log(sprintf(
            '[EMAIL_SYNC] Account: %s, Action: %s, Data: %s',
            $accountId,
            $action,
            json_encode($data)
        ));
    }

    public static function logError($accountId, $error, $context = []) {
        error_log(sprintf(
            '[EMAIL_ERROR] Account: %s, Error: %s, Context: %s',
            $accountId,
            $error,
            json_encode($context)
        ));
    }
}
```

## 9. Testing Strategy

### 9.1 Unit Tests
- Test email provider implementations
- Test token encryption/decryption
- Test permission checks
- Test data validation

### 9.2 Integration Tests
- Test OAuth flows
- Test email send/receive
- Test synchronization processes
- Test error handling scenarios

### 9.3 End-to-End Tests
- Complete email workflows
- Multi-provider scenarios
- Performance under load
- Error recovery scenarios

## 10. Deployment and Maintenance

### 10.1 Deployment Checklist
- [ ] OAuth applications configured for each provider
- [ ] Database migrations executed
- [ ] SSL certificates installed
- [ ] Cron jobs configured for sync
- [ ] File permissions set correctly
- [ ] Environment variables configured

### 10.2 Monitoring and Alerts
- Sync success/failure rates
- API quota usage
- Email delivery statistics
- Performance metrics
- Error rate monitoring

### 10.3 Maintenance Tasks
- Regular token refresh validation
- Database cleanup of old emails
- Log rotation and archiving
- Performance optimization reviews
