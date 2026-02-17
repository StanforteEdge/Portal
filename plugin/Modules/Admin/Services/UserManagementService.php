<?php
namespace App\Modules\Admin\Services;

use App\Core\User\Services\UserService;
use App\Core\User\Models\User;
use App\Modules\Admin\Models\AdminUser;
use WP_Error;

/**
 * User Management Service
 *
 * Handles admin-specific user management operations in the Admin Module.
 * Acts as a wrapper around UserService with additional admin business logic.
 * 
 * All methods are static per API unification plan standards.
 * Services return raw data or WP_Error - no WP_REST_Response.
 * Per unification plan: Services use Models for data access, no direct DB queries.
 */
class UserManagementService
{

    /**
     * Get user by ID with admin fields
     *
     * @param int $userId User ID
     * @return object|null User data or null
     */
    public static function getUser($userId)
    {
        // Use AdminUser model for admin-specific user retrieval
        $adminUser = new AdminUser();
        $user = $adminUser->getWithAdminFields((int) $userId);

        return $user;
    }

    /**
     * Get users list with admin filters - supports ALL user types and roles
     *
     * @param array $filters Search and filter parameters
     * @param array $order Order by parameters
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Users list with all types and roles
     */
    public static function getUsers($filters = [], $order = ['created_at' => 'desc'], $page = 1, $perPage = 15)
    {
        // Enhanced filters for admin - support ALL user types and statuses
        $adminFilters = self::buildAdminFilters($filters);

        // Check if advanced admin filters require AdminUser model
        $hasAdvancedFilters = isset($adminFilters['team_id']) || isset($adminFilters['has_team']) || isset($adminFilters['role']);

        if ($hasAdvancedFilters) {
            // Use AdminUser model for complex queries with JOINs
            $users = AdminUser::searchWithAdminFilters($adminFilters, $order, (int) $page, (int) $perPage);
        } else {
            // Use Core UserService for simple queries
            $users = UserService::getAllUsers($adminFilters, $order, (int) $page, (int) $perPage);
        }

        // Add comprehensive admin-specific fields using AdminUser model methods
        if (isset($users['data']) && is_array($users['data'])) {
            foreach ($users['data'] as &$user) {
                // Support ALL user types
                $user->user_type_display = self::getUserTypeDisplay($user->type ?? 'other');
                $user->status_display = self::getUserStatusDisplay($user->status ?? 'active');

                // Get comprehensive role and team information via AdminUser model
                $user->teams = AdminUser::getUserTeams($user->id);
                $user->primary_team = AdminUser::getPrimaryTeam($user->id);
                $user->roles = AdminUser::getUserRoles($user->id);

                // Derived fields for admin interface
                $user->teams_count = count($user->teams);
                $user->roles_count = count($user->roles);
                $user->is_active = ($user->status === 'active');
                $user->can_login = ($user->wp_user_id && $user->is_active);
            }
        }

        return $users;
    }

    /**
     * Create new user - supports ALL user types and roles
     *
     * @param array $userData User data
     * @param int $createdBy ID of user creating this user
     * @return mixed New user ID or UserService result
     */
    public static function createUser($userData, $createdBy = null)
    {
        // Enhanced validation for ALL user types
        $validation = self::validateUserDataForAllTypes($userData);
        if (!$validation['valid']) {
            return new WP_Error(
                'validation_failed',
                $validation['message'] ?? 'User data validation failed',
                ['status' => 400, 'errors' => $validation['errors'] ?? []]
            );
        }

        // Ensure we support ALL user types
        $supportedTypes = ['staff', 'client', 'vendor', 'partner', 'admin', 'other'];
        if (!in_array($userData['type'] ?? 'staff', $supportedTypes, true)) {
            return new WP_Error(
                'invalid_user_type',
                'Invalid user type provided',
                ['status' => 400, 'type' => $userData['type'] ?? null]
            );
        }

        // Use core UserService for user creation
        $result = UserService::createUser($userData);

        // Return WP_Error or user object (per unification plan)
        return $result;
    }

    /**
     * Update user
     *
     * @param int $userId User ID
     * @param array $userData Updated user data
     * @param int $updatedBy ID of user making the update
     * @return mixed UserService result
     */
    public static function updateUser($userId, $userData, $updatedBy = null)
    {
        // Validate user data with admin-specific rules
        $validation = self::validateUserDataForAllTypes($userData, false);
        if (!$validation['valid']) {
            return new WP_Error(
                'validation_failed',
                $validation['message'] ?? 'User data validation failed',
                ['status' => 400, 'errors' => $validation['errors'] ?? []]
            );
        }

        // Use core UserService for user update
        $result = UserService::updateUser((int) $userId, $userData);

        // Return WP_Error or user object (per unification plan)
        return $result;
    }

    /**
     * Delete user
     *
     * @param int $userId User ID
     * @param int $deletedBy ID of user performing deletion
     * @return mixed UserService result
     */
    public static function deleteUser($userId, $deletedBy = null)
    {
        // Use core UserService for user deletion
        $result = UserService::deleteUser((int) $userId, true);

        // Return WP_Error or boolean (per unification plan)
        return $result;
    }

    /**
     * Assign user to team
     *
     * @param int $userId User ID
     * @param int $teamId Team ID
     * @param string $role User role in team
     * @param bool $isPrimary Whether this is primary team
     * @param int $assignedBy ID of user making assignment
     * @return bool Success status
     */
    public static function assignUserToTeam($userId, $teamId, $role = 'member', $isPrimary = false, $assignedBy = null)
    {
        // Use AdminUser model method for team assignment
        $result = AdminUser::assignToTeam($userId, $teamId, $role, $isPrimary, $assignedBy);

        if ($result === false) {
            return new WP_Error(
                'team_assignment_failed',
                'Failed to assign user to team',
                ['status' => 500]
            );
        }

        return true;
    }

    /**
     * Remove user from team
     *
     * @param int $userId User ID
     * @param int $teamId Team ID
     * @param int $removedBy ID of user performing removal
     * @return bool Success status
     */
    public static function removeUserFromTeam($userId, $teamId, $removedBy = null)
    {
        // Use AdminUser model method for team removal
        $result = AdminUser::removeFromTeam($userId, $teamId);

        if ($result === false) {
            return new WP_Error(
                'team_removal_failed',
                'Failed to remove user from team',
                ['status' => 500]
            );
        }

        return true;
    }

    /**
     * Get user teams
     *
     * @param int $userId User ID
     * @return array Teams list
     */
    public static function getUserTeams($userId)
    {
        // Use AdminUser model method
        return AdminUser::getUserTeams($userId);
    }

    /**
     * Build comprehensive admin filters for ALL user types and criteria
     * Only returns valid database column filters
     *
     * @param array $filters Input filters
     * @return array Enhanced filters (only valid DB columns)
     */
    private static function buildAdminFilters($filters)
    {
        // Valid database columns for sta_profiles table
        $validColumns = [
            'search',      // Special: handled by User model's search() method
            'type',        // User type
            'status',      // User status
            'wp_user_id',  // WordPress user ID
            'username',    // Username
            'email',       // Email
            'first_name',  // First name
            'last_name',   // Last name
            'phone',       // Phone
            'gender',      // Gender
            'nationality', // Nationality
            'state',       // State
            'lga',         // LGA
            // Advanced filters for AdminUser model
            'team_id',     // Filter by team
            'has_team',    // Has any team
            'role',        // Filter by RBAC role
        ];

        // Filter to only valid columns
        $adminFilters = array_filter(
            $filters,
            function ($key) use ($validColumns) {
                return in_array($key, $validColumns, true);
            },
            ARRAY_FILTER_USE_KEY
        );

        // Drop empty-string and null values so we don't query e.g. status = ''
        $adminFilters = array_filter(
            $adminFilters,
            static function ($v) {
                return $v !== '' && $v !== null;
            }
        );

        return $adminFilters;
    }

    /**
     * Get display name for user type
     *
     * @param string $type User type
     * @return string Display name
     */
    private static function getUserTypeDisplay($type)
    {
        $typeMap = [
            'staff' => 'Staff Member',
            'client' => 'Client',
            'vendor' => 'Vendor',
            'partner' => 'Partner',
            'admin' => 'Administrator',
            'other' => 'Other'
        ];

        return $typeMap[$type] ?? 'Unknown';
    }

    /**
     * Get display name for user status
     *
     * @param string $status User status
     * @return string Display name
     */
    private static function getUserStatusDisplay($status)
    {
        $statusMap = [
            'active' => 'Active',
            'inactive' => 'Inactive',
            'suspended' => 'Suspended',
            'pending' => 'Pending Activation'
        ];

        return $statusMap[$status] ?? 'Unknown';
    }

    /**
     * Enhanced validation for ALL user types
     *
     * @param array $userData User data to validate
     * @param bool $isNew Whether this is for new user creation
     * @return array Validation result with 'valid', 'message', and 'errors' keys
     */
    private static function validateUserDataForAllTypes($userData, $isNew = true)
    {
        $errors = [];

        // Basic validation (required for all types)
        if ($isNew) {
            $requiredFields = ['username', 'email'];
            foreach ($requiredFields as $field) {
                if (empty($userData[$field])) {
                    $errors[$field] = ucfirst($field) . ' is required';
                }
            }

            // Validate email format
            if (!empty($userData['email']) && !filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Invalid email format';
            }

            // Validate username format (alphanumeric, underscore, dash)
            if (!empty($userData['username']) && !preg_match('/^[a-zA-Z0-9_-]+$/', $userData['username'])) {
                $errors['username'] = 'Username can only contain letters, numbers, underscores, and dashes';
            }
        }

        // Type-specific validation
        $userType = $userData['type'] ?? 'staff';

        switch ($userType) {
            case 'staff':
                // Staff users require additional validation
                if ($isNew && (empty($userData['first_name']) || empty($userData['last_name']))) {
                    if (empty($userData['first_name'])) {
                        $errors['first_name'] = 'First name is required for staff users';
                    }
                    if (empty($userData['last_name'])) {
                        $errors['last_name'] = 'Last name is required for staff users';
                    }
                }
                break;

            case 'client':
            case 'vendor':
            case 'partner':
                // Business users may need company information
                // This is optional but can be validated if required
                break;

            case 'admin':
                // Admin users require additional security validation
                if ($isNew && empty($userData['security_clearance'])) {
                    $errors['security_clearance'] = 'Security clearance is required for admin users';
                }
                break;

            default:
                // Other types have minimal requirements
                break;
        }

        // Validate phone format if provided
        if (!empty($userData['phone'])) {
            $phone = preg_replace('/\D/', '', $userData['phone']);
            if (strlen($phone) < 10) {
                $errors['phone'] = 'Phone number must be at least 10 digits';
            }
        }

        return [
            'valid' => empty($errors),
            'message' => empty($errors) ? 'Validation passed' : 'Validation failed',
            'errors' => $errors
        ];
    }
    /**
     * Get user counts for dashboard
     * 
     * @return array Total and active user counts
     */
    public static function getUserCounts()
    {
        return [
            'total' => UserService::getTotalUsers(),
            'active' => UserService::getTotalUsers() // For now using total as proxy for active, update when active logic exists
        ];
    }
}