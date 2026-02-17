<?php

namespace App\Core\User\Services;

use App\Core\User\Models\User;
use App\Core\Auth\Services\RBACService;
use WP_Error;
use WP_User;
use WP_REST_Response;
use stdClass;

class UserService
{
    /**
     * Get profile by WordPress user ID with additional user data
     * 
     * @param int $wpUserId WordPress user ID
     * @return object|null User profile data or null if not found
     */
    public static function getProfileByWpUserId(int $wpUserId): ?object
    {
        $user = new User();
        $profile = $user->findByWpUserId($wpUserId);

        if (!$profile) {
            return null;
        }

        return self::hydrateProfile($profile);
    }

    /**
     * Get profile by ID with additional user data
     * 
     * @param int $id Profile ID
     * @return object|null User profile data or null if not found
     */
    public static function getProfileById(int $id): ?object
    {
        $user = new User();
        $profile = $user->find($id);

        if (!$profile) {
            return null;
        }

        return self::hydrateProfile($profile);
    }

    /**
     * Shared method to attach enterprise relationships to a profile
     */
    private static function hydrateProfile(object $profile): object
    {
        // Get WordPress user data if available
        if (!empty($profile->wp_user_id)) {
            $wpUser = get_userdata($profile->wp_user_id);
            if ($wpUser) {
                $profile->user_email = $wpUser->user_email;
                $profile->roles = $wpUser->roles;
                $profile->user_registered = $wpUser->user_registered;
            }
        }

        // Get custom RBAC roles
        $rbacService = new \App\Core\Auth\Services\RBACService();
        $profile->rbac_roles = $rbacService->getUserRoles($profile->id);

        // Inject Organizations
        $orgService = new \App\Core\Organization\Services\OrganizationService();
        $profile->organizations = $orgService->getMyOrganizations($profile);

        // Inject Teams (Groups of type 'team')
        $groupResult = GroupService::getUserGroups($profile->id, 'team');
        $profile->teams = $groupResult['success'] ? $groupResult['groups'] : [];

        // Inject Departments (Groups of type 'department')
        $deptResult = GroupService::getUserGroups($profile->id, 'department');
        $profile->departments = $deptResult['success'] ? $deptResult['groups'] : [];

        return $profile;
    }

    /**
     * Get all users with pagination and filtering
     */
    public static function getAllUsers(
        array $filters = [],
        array $order = ['id' => 'DESC'],
        int $page = 1,
        int $perPage = 20
    ): array {
        $user = new User();

        if (!empty($filters)) {
            foreach ($filters as $field => $value) {
                if ($field === 'search') {
                    $user->search($value);
                } else {
                    $user->where($field, $value);
                }
            }
        }

        foreach ($order as $field => $direction) {
            $user->orderBy($field, $direction);
        }

        return $user->paginate($perPage, $page);
    }

    /**
     * Create a new user with WordPress account and profile
     */
    public static function createUser(array $userData)
    {
        $required = ['username', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($userData[$field])) {
                return new WP_Error('missing_field', sprintf('Missing required field: %s', $field), ['status' => 400]);
            }
        }

        if (!is_email($userData['email'])) {
            return new WP_Error('invalid_email', 'Invalid email address', ['status' => 400]);
        }

        $user = new User();
        if ($user->findByUsername($userData['username'])) {
            return new WP_Error('username_exists', 'Username already exists', ['status' => 409]);
        }

        if (email_exists($userData['email'])) {
            return new WP_Error('email_exists', 'Email already in use', ['status' => 409]);
        }

        $userLogin = sanitize_user($userData['username'], true);
        $userEmail = sanitize_email($userData['email']);
        $userPass = $userData['password'];
        $firstName = sanitize_text_field($userData['first_name'] ?? '');
        $lastName = sanitize_text_field($userData['last_name'] ?? '');
        $role = $userData['role'] ?? 'subscriber';

        $userId = wp_insert_user([
            'user_login' => $userLogin,
            'user_email' => $userEmail,
            'user_pass' => $userPass,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $role
        ]);

        if (is_wp_error($userId)) {
            return $userId;
        }

        $profileData = [
            'wp_user_id' => $userId,
            'username' => $userLogin,
            'email' => $userEmail,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'status' => 'active'
        ];

        if (!empty($userData['profile']) && is_array($userData['profile'])) {
            $profileData = array_merge($profileData, $userData['profile']);
        }

        $user = new User();
        $profile = $user->create($profileData);

        if (!$profile) {
            wp_delete_user($userId);
            return new WP_Error('profile_creation_failed', 'Failed to create user profile', ['status' => 500]);
        }

        return self::getProfileById($profile->id);
    }

    /**
     * Update an existing user and their profile
     */
    public static function updateUser(int $id, array $data)
    {
        $user = new User();
        $profile = $user->find($id);
        if (!$profile) {
            return new WP_Error('not_found', 'User not found', ['status' => 404]);
        }

        if (empty($profile->wp_user_id)) {
            $updated = $user->update($id, $data);
            if ($updated === false) {
                return new WP_Error('update_failed', 'Failed to update profile', ['status' => 500]);
            }
            return self::getProfileById($id);
        }

        $wpUserData = [];
        $wpFields = ['email', 'first_name', 'last_name', 'role'];
        foreach ($wpFields as $field) {
            if (array_key_exists($field, $data)) {
                $wpUserData[$field] = $data[$field];
            }
        }

        if (!empty($wpUserData)) {
            $wpUserData['ID'] = $profile->wp_user_id;
            $result = wp_update_user($wpUserData);
            if (is_wp_error($result)) {
                return $result;
            }
        }

        if (!empty($data)) {
            $updated = $user->update($id, $data);
            if ($updated === false) {
                return new WP_Error('update_failed', 'Failed to update profile', ['status' => 500]);
            }
        }

        return self::getProfileById($id);
    }

    /**
     * Delete a user and their WordPress account
     */
    public static function deleteUser(int $id, bool $deleteWpUser = true)
    {
        $user = new User();
        $profile = $user->find($id);
        if (!$profile) {
            return new WP_Error('not_found', 'User not found', ['status' => 404]);
        }

        if ($deleteWpUser && !empty($profile->wp_user_id)) {
            if (!function_exists('wp_delete_user')) {
                require_once(ABSPATH . 'wp-admin/includes/user.php');
            }
            if (!wp_delete_user($profile->wp_user_id)) {
                return new WP_Error('wp_user_delete_failed', 'Failed to delete WordPress user', ['status' => 500]);
            }
        }

        $deleted = $user->delete($id);
        if (!$deleted) {
            return new WP_Error('delete_failed', 'Failed to delete user profile', ['status' => 500]);
        }

        return true;
    }

    public static function getUserRoles($user_id)
    {
        return RBACService::getUserRoles($user_id);
    }

    public static function assignRole($user_id, $role_name)
    {
        if (is_numeric($role_name)) {
            return RBACService::assignRoleToUser($user_id, (int) $role_name);
        }
        $role = RBACService::getRoleByName($role_name);
        if (!$role) {
            return new WP_Error('role_not_found', 'Role not found');
        }
        return RBACService::assignRole($user_id, $role->id);
    }

    public static function removeRole($user_id, $role_name)
    {
        if (is_numeric($role_name)) {
            return RBACService::removeRole($user_id, (int) $role_name);
        }
        $role = RBACService::getRoleByName($role_name);
        if (!$role) {
            return new WP_Error('role_not_found', 'Role not found');
        }
        return RBACService::removeRole($user_id, $role->id);
    }

    public static function getTotalUsers()
    {
        return (new User())->count();
    }
}
