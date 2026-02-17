# Project Summary: Stanforte Edge Portal

> [!NOTE]
> This project is a hybrid Single Page Application (SPA) / Multi-Page Application (MPA) built on top of WordPress. It uses a custom plugin (`stanforte-edge-core`) for business logic and a custom theme (`newTheme`) for presentation.

## Architecture Overview

The system follows a **Modular Monolith** architecture:
-   **Backend**: A custom PHP framework embedded within a WordPress plugin. It uses a Service-Repository pattern (lightweight) with `Controllers`, `Services`, and `Models`.
-   **Frontend**: A jQuery + Tailwind CSS powered frontend. It relies heavily on AJAX for data fetching (JWT Auth) while using WordPress for initial page routing and template rendering.
-   **Database**: Custom tables (`sta_*`) alongside standard WordPress tables (`wp_users`, `wp_options`).

## Directory Structure

### 1. Backend Plugin (`/plugin/`)
The core logic resides here, avoiding `functions.php` clutter.
-   **`Core/`**: Reusable platform capabilities (User, Auth, FileStorage, Notification, etc.).
-   **`Modules/`**: Domain-specific business logic (Admin, Finance, HR).
-   **`Database/`**: Migrations for custom tables.
-   **`Utils/`**: Base classes (`BaseModel`, `BaseController`) and helpers.
-   **`Routes/`**: Centralized REST API route definitions.

### 2. Frontend Theme (`/newTheme/`)
Handles the view layer.
-   **`templates/`**: Custom page templates mapped by WordPress "Template Name".
-   **`templates/pages/`**: Organized by domain (`Admin/`, `Finance/`, `General/`) with RBAC-driven partials (e.g., `dashboard-section.php`).
-   **`assets/js/`**: Modular JavaScript. `auth/auth.js` handles JWT.
-   **`functions.php`**: Enqueues scripts and auto-registers templates.

## Key Technical Decisions

### Authentication & RBAC
-   **Hybrid Auth**: Uses **JWT** (`localStorage`) for API requests and **Cookies** (`user_roles`) for PHP-side page access control.
-   **RBAC**: Custom Role-Based Access Control system (`RBACService`) using `sta_roles` and `sta_permissions`, not standard WP Roles.

### Database Abstraction
-   **`BaseModel`**: A custom ORM wrapper around `$wpdb`.
    -   Supports `find`, `where`, `create`, `update`, `delete`.
    -   Handles Soft Deletes (`deleted_at`).
    -   Manages timestamps (`created_at`, `updated_at`).

### API Design
-   **REST API**: Custom endpoints under `/wp-json/api/v1/`.
-   **Responses**: Unified standard via `BaseController::success()` and `error()`.

## Development Standards
1.  **Controllers**: extend `BaseController`. Handle HTTP inputs/outputs.
2.  **Services**: Handle business logic. Throw Exceptions on error.
3.  **Models**: extend `BaseModel`. Map to `sta_*` tables.
4.  **Frontend**: Use `AuthUtils` for API calls to ensure Authorization headers are attached.
