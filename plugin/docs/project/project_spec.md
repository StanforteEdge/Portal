# Project Specification

## 1. Core Modules & Data Models

### User Management (`Core/User`)
-   **Model**: `User` (`sta_profiles`)
    -   Links to `wp_users` via `wp_user_id`.
    -   Key fields: `username`, `email`, `first_name`, `last_name`, `type` (staff, student, etc.).
-   **Service**: `UserService`
    -   Handles profile creation, WP user synchronization, and role assignment.

### Authentication (`Core/Auth`)
-   **Service**: `RBACService`
    -   Tables: `sta_roles`, `sta_permissions`, `sta_model_has_roles`.
-   **Middleware**: `AuthMiddleware` verifies JWT tokens.

### Common Infrastructure
-   **FileStorage**: Manages uploads (Local/S3).
-   **Notifications**: Internal system notifications (`sta_notifications`).
-   **Forms**: Dynamic form builder (`sta_forms`, `sta_form_submissions`).

## 2. API Patterns

### Controller Template
```php
use App\Utils\BaseController;

class MyController extends BaseController {
    public static function index($request) {
        try {
            $data = MyService::getData();
            return self::success($data);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }
}
```

### Route Registration (`Routes/rest-api.php`)
```php
register_rest_route('api/v1', '/my-endpoint', [
    'methods' => 'GET',
    'callback' => [MyController::class, 'index'],
    'permission_callback' => [AuthMiddleware::class, 'isAuthenticated']
]);
```

## 3. Database Schema Standards
-   **Prefix**: `sta_` (handled by `BaseModel`).
-   **Common Columns**:
    -   `id` (BigInt, Primary, AI)
    -   `uuid` (String, frequently used for public IDs)
    -   `created_at` (Datetime)
    -   `updated_at` (Datetime)
    -   `deleted_at` (Datetime, nullable)

## 4. Frontend Integration

### Script Loading
-   **Global Object**: `wpApiSettings` available in JS.
    -   `root`: API Root URL.
    -   `nonce`: WP REST Nonce.
-   **Auth Client**: `window.AuthUtils`.
    -   `checkAuthAndGetUser(cb)`: Verifies session.
    -   `getAuthToken()`: Returns raw JWT.

### Page Template Structure
-   Located in `newTheme/templates/`.
-   Must include header/footer:
```php
<?php
/* Template Name: My Page */
get_header();
?>
<div id="app"></div>
<?php get_footer(); ?>
```

## 5. Domain Modules (Business Logic)
-   **Admin**: System management (Users, Settings).
-   **Finance**: Wallet management, Transactions, Paystack integration.
-   **HR**: Employee management, Leave requests, Organogram.
