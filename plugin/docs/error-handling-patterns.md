# Exception-Based Error Handling Patterns

## Overview

This document outlines the standardized error handling patterns for the Stanforte Edge portal plugin. The system uses an exception-based approach where Services throw exceptions for error conditions, and Controllers catch these exceptions to format appropriate HTTP responses.

## Core Principles

1. **Services handle business logic and throw exceptions for errors**
2. **Controllers handle HTTP response formatting and exception catching**
3. **Models throw exceptions for data-related errors**
4. **All exceptions are caught and converted to standardized JSON responses**

## Architecture Layers

### 1. Service Layer (Business Logic)

Services are responsible for business logic and should throw exceptions for any error conditions. They should NOT handle HTTP response formatting.

#### Patterns

**✅ DO: Throw exceptions for business errors**
```php
class AuthService
{
    public static function resetPassword(string $token, string $newPassword): array
    {
        $tokenModel = new Token();
        $hash = hash('sha256', $token);
        $row = $tokenModel->where('token_hash', $hash)
                         ->where('type', 'reset')
                         ->where('expires_at', '>', gmdate('Y-m-d H:i:s'))
                         ->first();

        if (!$row) {
            throw new \Exception('Invalid or expired token', 400);
        }

        wp_set_password($newPassword, $row->user_id);
        $tokenModel->delete($row->id);

        return ['user_id' => $row->user_id];
    }
}
```

**❌ DON'T: Return success/failure arrays**
```php
// Avoid this pattern
return ['success' => false, 'message' => 'Invalid token'];
```

#### Exception Types by Category

| Exception Type | HTTP Status | Use Case |
|---------------|-------------|----------|
| `\Exception` | 400 | General validation errors |
| `\InvalidArgumentException` | 400 | Invalid input parameters |
| `\RuntimeException` | 500 | System/runtime errors |
| `\LogicException` | 500 | Code logic errors |
| `AuthenticationException` | 401 | Authentication failures |
| `AuthorizationException` | 403 | Permission denied |
| `ValidationException` | 422 | Data validation failures |
| `NotFoundException` | 404 | Resource not found |

### 2. Controller Layer (HTTP Response)

Controllers catch exceptions from Services and format them into standardized HTTP responses using BaseController methods.

#### Patterns

**✅ DO: Use try/catch blocks**
```php
class AuthController extends BaseController
{
    public function resetPassword(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $token = $request->get_param('token');
            $newPassword = $request->get_param('new_password');

            // Input validation
            if (empty($token) || empty($newPassword)) {
                throw new \InvalidArgumentException('Token and new password are required', 400);
            }

            $result = AuthService::resetPassword($token, $newPassword);
            return static::success($result, 200);

        } catch (\Exception $e) {
            return static::error(
                'reset_error',
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }
}
```

**❌ DON'T: Check success flags**
```php
// Avoid this pattern
$result = AuthService::someMethod();
if ($result['success']) {
    return static::success($result['data']);
} else {
    return static::error($result['message']);
}
```

### 3. Model Layer (Data Access)

Models handle database operations and should throw exceptions for data-related errors.

#### Patterns

**✅ DO: Throw exceptions for database errors**
```php
class User extends BaseModel
{
    public function findActiveUser(int $userId): ?array
    {
        $user = $this->where('id', $userId)
                    ->where('status', 'active')
                    ->first();

        if (!$user) {
            throw new NotFoundException("Active user with ID {$userId} not found", 404);
        }

        return $user;
    }

    public function createUser(array $data): int
    {
        // Validate required fields
        if (empty($data['email']) || empty($data['password'])) {
            throw new ValidationException('Email and password are required', 422);
        }

        // Check for duplicate email
        $existing = $this->where('email', $data['email'])->first();
        if ($existing) {
            throw new ValidationException('Email already exists', 422);
        }

        return $this->insert($data);
    }
}
```

**❌ DON'T: Return false/null for errors**
```php
// Avoid this pattern
public function findActiveUser(int $userId): ?array
{
    $user = $this->where('id', $userId)->where('status', 'active')->first();
    return $user; // What if query fails? No error indication
}
```

## Custom Exception Classes

Create custom exception classes for domain-specific errors:

```php
// Core/Exceptions/AuthenticationException.php
class AuthenticationException extends \Exception
{
    public function __construct(string $message = "Authentication failed", int $code = 401)
    {
        parent::__construct($message, $code);
    }
}

// Core/Exceptions/AuthorizationException.php
class AuthorizationException extends \Exception
{
    public function __construct(string $message = "Access denied", int $code = 403)
    {
        parent::__construct($message, $code);
    }
}

// Core/Exceptions/ValidationException.php
class ValidationException extends \Exception
{
    public function __construct(string $message = "Validation failed", int $code = 422)
    {
        parent::__construct($message, $code);
    }
}

// Core/Exceptions/NotFoundException.php
class NotFoundException extends \Exception
{
    public function __construct(string $message = "Resource not found", int $code = 404)
    {
        parent::__construct($message, $code);
    }
}
```

## Error Response Format

All errors are formatted consistently using BaseController methods:

### Success Response
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "email": "user@example.com"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "reset_error",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

## HTTP 200 + Success Scenarios

In some cases, an API endpoint might complete successfully (HTTP 200) but the business operation results in a negative outcome. These scenarios should be distinguished from actual errors.

### When to Use HTTP 200 with success=false

1. **Authentication Status Checks**
   ```php
   // GET /api/v1/auth/status
   public function getStatus()
   {
       $userId = get_current_user_id();
       
       if (!$userId) {
           return static::success([
               'authenticated' => false,
               'message' => 'User is not logged in'
           ], 200);
       }
       
       $user = get_userdata($userId);
       return static::success([
           'authenticated' => true,
           'user' => [
               'id' => $userId,
               'email' => $user->user_email
           ]
       ], 200);
   }
   ```

2. **Business Logic Outcomes**
   - Payment processing (approved/declined)
   - Form validation results
   - Availability checks
   - Duplicate detection

### Response Structure

```json
{
  "success": true,
  "data": {
    "operation_successful": false,
    "reason": "Insufficient funds",
    "details": {
      "current_balance": 50,
      "required_amount": 100
    }
  }
}
```

### Key Differences from Errors

| Scenario | HTTP Status | `success` | `data.operation_successful` | Use Case |
|----------|-------------|-----------|----------------------------|-----------|
| Success | 200 | true | true | Operation completed successfully |
| Business Failure | 200 | true | false | Operation completed but with negative result |
| Client Error | 4xx | false | N/A | Invalid request |
| Server Error | 5xx | false | N/A | Server-side failure |

### Implementation Example

```php
// Service Layer
public static function processPayment($amount, $userId)
{
    $balance = self::getUserBalance($userId);
    
    if ($balance < $amount) {
        return [
            'operation_successful' => false,
            'reason' => 'Insufficient funds',
            'details' => [
                'current_balance' => $balance,
                'required_amount' => $amount
            ]
        ];
    }
    
    // Process payment...
    return ['operation_successful' => true, 'transaction_id' => 'txn_123'];
}

// Controller
public function handlePayment($request)
{
    try {
        $result = PaymentService::processPayment(
            $request->get_param('amount'),
            get_current_user_id()
        );
        
        return static::success($result, 200);
        
    } catch (\Exception $e) {
        return static::error('payment_error', $e->getMessage(), 500);
    }
}
```

## Best Practices

### 1. Exception Naming
- Use descriptive exception names that indicate the error type
- Include relevant context in exception messages
- Use appropriate HTTP status codes

### 2. Exception Chaining
```php
try {
    $user = $userModel->findActiveUser($userId);
} catch (NotFoundException $e) {
    throw new AuthorizationException("Cannot access user: " . $e->getMessage(), 403, $e);
}
```

### 3. Logging
Always log exceptions for debugging:
```php
} catch (\Exception $e) {
    error_log("AuthController::resetPassword error: " . $e->getMessage());
    return static::error('reset_error', 'Password reset failed', 500);
}
```

### 4. Input Validation
Validate inputs in Controllers before calling Services:
```php
public function updateUser(\WP_REST_Request $request): \WP_REST_Response
{
    try {
        $userId = $request->get_param('user_id');
        $data = $request->get_param('data');

        if (!$userId || !is_numeric($userId)) {
            throw new \InvalidArgumentException('Valid user ID is required', 400);
        }

        if (empty($data) || !is_array($data)) {
            throw new \InvalidArgumentException('User data is required', 400);
        }

        $result = UserService::updateUser($userId, $data);
        return static::success($result);

    } catch (\Exception $e) {
        return static::error('update_error', $e->getMessage(), $e->getCode() ?: 400);
    }
}
```

### 5. Database Transaction Handling
Use exceptions with database transactions:
```php
public static function transferFunds(int $fromUserId, int $toUserId, float $amount): array
{
    try {
        $this->db->beginTransaction();

        // Debit from user
        $this->debitAccount($fromUserId, $amount);

        // Credit to user
        $this->creditAccount($toUserId, $amount);

        $this->db->commit();

        return ['transaction_id' => $this->lastInsertId()];

    } catch (\Exception $e) {
        $this->db->rollback();
        throw new \RuntimeException('Transfer failed: ' . $e->getMessage(), 500, $e);
    }
}
```

## Migration Guide

### From Success/Failure Arrays to Exceptions

**Before:**
```php
// Service
return ['success' => false, 'message' => 'Invalid token'];

// Controller
if (!$result['success']) {
    return static::error('error', $result['message'], 400);
}
```

**After:**
```php
// Service
throw new \Exception('Invalid token', 400);

// Controller
} catch (\Exception $e) {
    return static::error('error', $e->getMessage(), $e->getCode() ?: 400);
}
```

## Benefits of This Pattern

1. **Clean Separation of Concerns**: Services focus on business logic, Controllers on HTTP
2. **Consistent Error Handling**: All errors follow the same format
3. **Better Debugging**: Full stack traces and detailed error messages
4. **Maintainable Code**: No repetitive success/failure checking
5. **Testable Services**: Services can be unit tested without HTTP concerns

## AI Development Assistant Prompt

When working on the Stanforte Edge portal, use this prompt to ensure consistency with our architecture:

```
You are assisting with development for the Stanforte Edge portal. Follow these guidelines:

1. **Architecture**:
   - Follow the modular route loading system (rest-api.php loads module routes)
   - Use custom RBAC system with sta_* tables for permissions
   - Follow the exception-based error handling pattern
   - Maintain JWT authentication flow

2. **File Structure**:
   - Controllers: Core/{Module}/Controllers/{Name}Controller.php
   - Services: Core/{Module}/Services/{Name}Service.php
   - Models: Core/{Module}/Models/{Name}.php
   - Routes: Core/{Module}/Routes/{routes|Admin}.php

3. **Coding Standards**:
   - Controllers: camelCase methods, handle HTTP responses
   - Services: Business logic, throw exceptions
   - Models: Data access, extend BaseModel
   - Use type hints and return types
   - Document all methods with PHPDoc
   - Follow PSR-12 standards

4. **Error Handling**:
   - Services throw exceptions for errors
   - Controllers catch and format errors
   - Use appropriate HTTP status codes
   - Return consistent response formats

5. **Security**:
   - Validate all inputs
   - Use prepared statements
   - Implement proper permission checks
   - Never expose sensitive data

When implementing a new feature, provide:
1. Controller with endpoint definitions
2. Service with business logic
3. Model if new database interaction is needed
4. Route registration
5. Unit tests
6. Documentation updates

For modifications, first analyze the existing code structure and maintain consistency.
```

## Testing Considerations

When testing Services, expect exceptions to be thrown:
```php
class AuthServiceTest extends TestCase
{
    public function testResetPasswordWithInvalidToken()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid or expired token');
        $this->expectExceptionCode(400);

        AuthService::resetPassword('invalid-token', 'newpassword123');
    }
}
```

For Controller testing, test both success and error responses:
```php
class AuthControllerTest extends TestCase
{
    public function testResetPasswordSuccess()
    {
        // Mock successful service call
        $response = $this->controller->resetPassword($request);
        $this->assertEquals(200, $response->get_status());
    }

    public function testResetPasswordError()
    {
        // Mock service exception
        $response = $this->controller->resetPassword($request);
        $this->assertEquals(400, $response->get_status());
    }
}
```
