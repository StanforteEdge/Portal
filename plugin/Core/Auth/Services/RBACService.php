<?php
namespace App\Core\Auth\Services;

use \WP_Error;
use App\Core\Auth\Models\Role;
use App\Core\Auth\Models\Permission;
use App\Core\Auth\Models\UserRole;
use App\Core\Auth\Models\RolePermission;

class RBACService
{
    // ==================== ROLE METHODS ====================

    /**
     * Get all custom roles with user counts
     * 
     * @return array List of roles with user_count field
     */
    public static function getAllRoles()
    {
        global $wpdb;
        $roles = Role::getAllWithUserCounts();

        // Eager load permissions for all roles
        $query = "
            SELECT rp.role_id, p.*
            FROM {$wpdb->prefix}sta_role_permissions rp
            JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
        ";
        $all_permissions = $wpdb->get_results($query);

        // Group permissions by role_id
        $permissions_by_role = [];
        foreach ($all_permissions as $perm) {
            $role_id = $perm->role_id;
            unset($perm->role_id); // Clean up
            $permissions_by_role[$role_id][] = $perm;
        }

        // Attach to roles
        foreach ($roles as $role) {
            $role->permissions = isset($permissions_by_role[$role->id]) ? $permissions_by_role[$role->id] : [];
        }

        return $roles;
    }

    /**
     * Get role by ID
     * 
     * @param int $id Role ID
     * @return object|null Role data or null if not found
     */
    public static function getRoleById($id)
    {
        $roleModel = new Role();
        return $roleModel->find($id);
    }

    /**
     * Get role by name
     * 
     * @param string $name Role name
     * @return object|null Role data or null if not found
     */
    public static function getRoleByName($name)
    {
        $roleModel = new Role();
        return $roleModel->findBy('name', $name);
    }

    /**
     * Create a new role
     * 
     * @param array $data Role data (name, description)
     * @return int|WP_Error Role ID on success, WP_Error on failure
     */
    /**
     * Create a new role
     * 
     * @param array $data Role data (name, description, permissions)
     * @return int|WP_Error Role ID on success, WP_Error on failure
     */
    public static function createRole($data)
    {
        // Validate required fields
        if (empty($data['name'])) {
            return new WP_Error('missing_name', 'Role name is required');
        }

        // Check if role already exists
        if (self::getRoleByName($data['name'])) {
            return new WP_Error('role_exists', 'Role with this name already exists');
        }

        // Generate slug if not provided
        $slug = !empty($data['slug']) ? $data['slug'] : self::generateSlug($data['name']);

        $roleModel = new Role();
        $role_data = [
            'id' => wp_generate_uuid4(),
            'name' => sanitize_text_field($data['name']),
            'slug' => sanitize_title($slug),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ];

        $result = $roleModel->create($role_data);

        if (!$result) {
            return new WP_Error('db_error', 'Failed to insert role');
        }

        // Assign permissions if provided
        if (!empty($data['permissions']) && is_array($data['permissions'])) {
            foreach ($data['permissions'] as $permission_id) {
                self::assignPermissionToRole($role_data['id'], $permission_id);
            }
        }

        return $roleModel->find($role_data['id']);
    }

    /**
     * Update a role
     * 
     * @param int $id Role ID
     * @param array $data Updated role data (name, description, permissions)
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function updateRole($id, $data)
    {
        $roleModel = new Role();

        // Check if role exists
        $role = $roleModel->find($id);
        if (!$role) {
            return new WP_Error('role_not_found', 'Role not found');
        }

        // Check for name conflicts (if name is being changed)
        if (!empty($data['name']) && $data['name'] !== $role->name) {
            if (self::getRoleByName($data['name'])) {
                return new WP_Error('role_exists', 'Role with this name already exists');
            }
        }

        $update_data = ['updated_at' => current_time('mysql')];

        if (!empty($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
        }

        if (!empty($data['slug'])) {
            $update_data['slug'] = sanitize_title($data['slug']);
        } elseif (!empty($data['name'])) {
            // Auto-generate slug if name changed but slug not provided
            $update_data['slug'] = sanitize_title(self::generateSlug($data['name']));
        }

        if (isset($data['description'])) {
            $update_data['description'] = sanitize_textarea_field($data['description']);
        }

        $result = $roleModel->update($id, $update_data);

        if (!$result) {
            // Even if update failed (e.g. no changes), we might still want to update permissions
            // But usually db->update returns false only on error or no change. 
            // We'll proceed to permission update regardless if it's just "no change".
            // However, typical DB wrappers return false on error. 
            // Assuming strict error checking here might be tricky if "no change" = false.
            // Let's assume we proceed if not explicitly an error.
        }

        // Update permissions if provided
        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $current_permissions = self::getRolePermissions($id);
            $current_ids = array_map(function ($p) {
                return $p->id;
            }, $current_permissions);
            $new_ids = $data['permissions'];

            // Calculate adds and removes
            $to_add = array_diff($new_ids, $current_ids);
            $to_remove = array_diff($current_ids, $new_ids);

            foreach ($to_add as $perm_id) {
                self::assignPermissionToRole($id, $perm_id);
            }

            foreach ($to_remove as $perm_id) {
                self::removePermissionFromRole($id, $perm_id);
            }
        }

        return true;
    }

    /**
     * Delete a role
     * 
     * @param int $id Role ID
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function deleteRole($id)
    {
        $roleModel = new Role();

        // Check if role exists
        $role = $roleModel->find($id);
        if (!$role) {
            return new WP_Error('role_not_found', 'Role not found');
        }

        // Check if role is assigned to any users
        $users_with_role = UserRole::getUsersWithRole($id);

        if ($users_with_role > 0) {
            return new WP_Error('role_in_use', 'Cannot delete role that is assigned to users');
        }

        // Delete role permissions first
        $rolePermissionModel = new RolePermission();
        $rolePermissionModel->deleteWhere(['role_id' => $id]);

        // Delete the role
        $result = $roleModel->delete($id);

        if (!$result) {
            return new WP_Error('db_error', 'Failed to delete role');
        }

        return true;
    }

    // ==================== PERMISSION METHODS ====================

    /**
     * Get all permissions
     * 
     * @return array List of permissions
     */
    public static function getAllPermissions()
    {
        $permissionModel = new Permission();
        return $permissionModel->all();
    }

    /**
     * Get permission by ID
     * 
     * @param int $id Permission ID
     * @return object|null Permission data or null if not found
     */
    public static function getPermissionById($id)
    {
        $permissionModel = new Permission();
        return $permissionModel->find($id);
    }

    /**
     * Get permission by name
     * 
     * @param string $name Permission name
     * @return object|null Permission data or null if not found
     */
    public static function getPermissionByName($name)
    {
        $permissionModel = new Permission();
        return $permissionModel->findBy('name', $name);
    }

    /**
     * Create a new permission
     * 
     * @param array $data Permission data (name, description)
     * @return int|WP_Error Permission ID on success, WP_Error on failure
     */
    public static function createPermission($data)
    {
        // Validate required fields
        if (empty($data['name'])) {
            return new WP_Error('missing_name', 'Permission name is required');
        }

        if (empty($data['slug'])) {
            return new WP_Error('missing_slug', 'Permission slug is required');
        }

        // Check if permission with this name already exists
        if (self::getPermissionByName($data['name'])) {
            return new WP_Error('permission_exists', 'Permission with this name already exists');
        }

        // Check if permission with this slug already exists
        global $wpdb;
        $table = $wpdb->prefix . 'sta_permissions';
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE slug = %s",
            $data['slug']
        ));

        if ($existing) {
            return new WP_Error('slug_exists', 'Permission with this slug already exists');
        }

        $permissionModel = new Permission();
        $permission_data = [
            'name' => sanitize_text_field($data['name']),
            'slug' => sanitize_text_field($data['slug']),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ];

        // Add module if provided
        if (!empty($data['module'])) {
            $permission_data['module'] = sanitize_text_field($data['module']);
        }

        $result = $permissionModel->insert($permission_data);

        if (!$result) {
            return new WP_Error('db_error', 'Failed to create permission');
        }

        return $permissionModel->find($result);
    }

    /**
     * Update a permission
     * 
     * @param int $id Permission ID
     * @param array $data Updated permission data
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function updatePermission($id, $data)
    {
        $permissionModel = new Permission();

        // Check if permission exists
        $permission = $permissionModel->find($id);
        if (!$permission) {
            return new WP_Error('permission_not_found', 'Permission not found');
        }

        // Check for name conflicts (if name is being changed)
        if (!empty($data['name']) && $data['name'] !== $permission->name) {
            if (self::getPermissionByName($data['name'])) {
                return new WP_Error('permission_exists', 'Permission with this name already exists');
            }
        }

        // Check for slug conflicts (if slug is being changed)
        if (!empty($data['slug']) && $data['slug'] !== $permission->slug) {
            global $wpdb;
            $table = $wpdb->prefix . 'sta_permissions';
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE slug = %s AND id != %d",
                $data['slug'],
                $id
            ));

            if ($existing) {
                return new WP_Error('slug_exists', 'Permission with this slug already exists');
            }
        }

        $update_data = ['updated_at' => current_time('mysql')];

        if (!empty($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
        }

        if (!empty($data['slug'])) {
            $update_data['slug'] = sanitize_text_field($data['slug']);
        }

        if (isset($data['description'])) {
            $update_data['description'] = sanitize_textarea_field($data['description']);
        }

        if (isset($data['module'])) {
            $update_data['module'] = !empty($data['module']) ? sanitize_text_field($data['module']) : null;
        }

        $result = $permissionModel->update($id, $update_data);

        if (!$result) {
            return new WP_Error('db_error', 'Failed to update permission');
        }

        return true;
    }

    /**
     * Delete a permission
     * 
     * @param int $id Permission ID
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function deletePermission($id)
    {
        $permissionModel = new Permission();

        // Check if permission exists
        $permission = $permissionModel->find($id);
        if (!$permission) {
            return new WP_Error('permission_not_found', 'Permission not found');
        }

        // Check if permission is in use by any roles
        $in_use = RolePermission::getRoleCountForPermission($id);

        if ($in_use > 0) {
            return new WP_Error('permission_in_use', 'Cannot delete permission that is assigned to roles');
        }

        $result = $permissionModel->delete($id);

        if (!$result) {
            return new WP_Error('db_error', 'Failed to delete permission');
        }

        return true;
    }

    // ==================== ROLE-PERMISSION RELATIONSHIP METHODS ====================

    /**
     * Get permissions for a role
     * 
     * @param int $role_id Role ID
     * @return array List of permissions
     */
    public static function getRolePermissions($role_id)
    {
        // Check if role exists
        $role = (new Role())->find($role_id);
        if (!$role) {
            return [];
        }

        // Get full permission objects for this role
        return Role::getPermissionsForRole($role_id) ?: [];
    }

    /**
     * Assign permission to role
     * 
     * @param int $role_id Role ID
     * @param int $permission_id Permission ID
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function assignPermissionToRole($role_id, $permission_id)
    {
        global $wpdb;

        // Check if role exists
        if (!self::getRoleById($role_id)) {
            return new WP_Error('role_not_found', 'Role not found');
        }

        // Check if permission exists
        if (!self::getPermissionById($permission_id)) {
            return new WP_Error('permission_not_found', 'Permission not found');
        }

        // Check if already assigned
        $already_assigned = RolePermission::roleHasPermission($role_id, $permission_id);

        if ($already_assigned) {
            return new WP_Error('already_assigned', 'Permission already assigned to role');
        }

        // Assign permission
        $rolePermissionModel = new RolePermission();
        $result = $rolePermissionModel->create([
            'role_id' => $role_id,
            'permission_id' => $permission_id
        ]);

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to assign permission to role');
        }

        return true;
    }

    /**
     * Remove permission from role
     * 
     * @param int $role_id Role ID
     * @param int $permission_id Permission ID
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function removePermissionFromRole($role_id, $permission_id)
    {
        $rolePermissionModel = new RolePermission();
        $result = $rolePermissionModel->deleteWhere([
            'role_id' => $role_id,
            'permission_id' => $permission_id
        ]);

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to remove permission from role');
        }

        if ($result === 0) {
            return new WP_Error('not_assigned', 'Permission was not assigned to this role');
        }

        return true;
    }

    // ==================== USER-ROLE RELATIONSHIP METHODS ====================

    /**
     * Assign a role to a user (organization-aware)
     * 
     * @param int $profile_id Profile ID
     * @param string $role_id Role ID
     * @param string|null $organization_id Organization ID (null = group-level role)
     * @param bool $is_primary Whether this is the user's primary role
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function assignRoleToUser($profile_id, $role_id, $organization_id = null, $is_primary = false)
    {
        global $wpdb;

        // Check if role exists
        if (!self::getRoleById($role_id)) {
            return new WP_Error('role_not_found', 'Role not found');
        }

        // Check if already assigned
        $already_assigned = UserRole::userHasRole($profile_id, $role_id, $organization_id);

        if ($already_assigned) {
            return new WP_Error('already_assigned', 'Role already assigned to user for this organization');
        }

        // Assign role
        $userRoleModel = new UserRole();
        $result = $userRoleModel->create([
            'id' => wp_generate_uuid4(),
            'profile_id' => $profile_id,
            'role_id' => $role_id,
            'organization_id' => $organization_id,
            'is_primary_role' => $is_primary ? 1 : 0,
            'assigned_at' => current_time('mysql'),
            'created_at' => current_time('mysql')
        ]);

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to assign role to user');
        }

        return true;
    }

    /**
     * Remove role from user (organization-aware)
     * 
     * @param int $profile_id Profile ID
     * @param string $role_id Role ID
     * @param string|null $organization_id Organization ID (null = group-level role)
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function removeRoleFromUser($profile_id, $role_id, $organization_id = null)
    {
        global $wpdb;

        $userRoleModel = new UserRole();
        $where = [
            'profile_id' => $profile_id,
            'role_id' => $role_id
        ];

        // Add organization filter if specified
        if ($organization_id === null) {
            // Remove only group-level role
            $where['organization_id'] = null;
        } else {
            $where['organization_id'] = $organization_id;
        }

        $result = $userRoleModel->deleteWhere($where);

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to remove role from user');
        }

        if ($result === 0) {
            return new WP_Error('not_assigned', 'Role was not assigned to this user for this organization');
        }

        return true;
    }

    /**
     * Get all roles for a user
     * 
     * @param int $user_id User ID
     * @return array List of role slugs (strings)
     */
    public static function getUserRoles($user_id)
    {
        $results = Role::getUserRoleSlugs($user_id);

        error_log('[RBACService] getUserRoles for user_id: ' . $user_id . ', Found: ' . json_encode($results));

        return $results ?: [];
    }

    // ==================== PERMISSION CHECK METHODS ====================

    /**
     * Check if user has a specific permission (organization-aware)
     * 
     * @param int $profile_id Profile ID (not WordPress user ID)
     * @param string $permission_name Permission name
     * @param string|null $organization_id Organization ID to check permission for (null = check group-level only)
     * @return bool True if user has permission, false otherwise
     */
    public static function userHasPermission($profile_id, $permission_name, $organization_id = null)
    {
        global $wpdb;

        // 1. Check for Super Admin Role ('administrator')
        // Administrators have implicit access to EVERYTHING.
        $admin_query = "
            SELECT COUNT(*)
            FROM {$wpdb->prefix}sta_user_roles ur
            JOIN {$wpdb->prefix}sta_roles r ON ur.role_id = r.id
            WHERE ur.profile_id = %d
              AND r.slug = 'administrator'
        ";
        $is_admin = $wpdb->get_var($wpdb->prepare($admin_query, $profile_id));

        if ($is_admin > 0) {
            return true;
        }

        if ($organization_id === null) {
            // Check for group-level permission only (backward compatible)
            $query = "
                SELECT COUNT(*) 
                FROM {$wpdb->prefix}sta_user_roles ur
                JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
                JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
                WHERE ur.profile_id = %d 
                  AND p.name = %s
                  AND ur.organization_id IS NULL
            ";

            $count = $wpdb->get_var($wpdb->prepare($query, $profile_id, $permission_name));
        } else {
            // Check for org-specific permission OR group-level permission
            $query = "
                SELECT COUNT(*) 
                FROM {$wpdb->prefix}sta_user_roles ur
                JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
                JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
                WHERE ur.profile_id = %d 
                  AND p.name = %s
                  AND (ur.organization_id IS NULL OR ur.organization_id = %s)
            ";

            $count = $wpdb->get_var($wpdb->prepare($query, $profile_id, $permission_name, $organization_id));
        }

        return $count > 0;
    }

    /**
     * Get all permissions for a user (optionally scoped to organization)
     * 
     * @param int $profile_id Profile ID
     * @param string|null $organization_id Organization ID filter
     * @return array List of permission names
     */
    public static function getUserPermissions($profile_id, $organization_id = null)
    {
        global $wpdb;

        if ($organization_id === null) {
            // Get all permissions (group-level + all org-specific)
            $query = "
                SELECT DISTINCT p.name
                FROM {$wpdb->prefix}sta_user_roles ur
                JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
                JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
                WHERE ur.profile_id = %d
            ";

            return $wpdb->get_col($wpdb->prepare($query, $profile_id)) ?: [];
        } else {
            // Get permissions for specific organization
            $query = "
                SELECT DISTINCT p.name
                FROM {$wpdb->prefix}sta_user_roles ur
                JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
                JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
                WHERE ur.profile_id = %d
                  AND (ur.organization_id IS NULL OR ur.organization_id = %s)
            ";

            return $wpdb->get_col($wpdb->prepare($query, $profile_id, $organization_id)) ?: [];
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Generate a slug from a name
     * 
     * @param string $name Name to convert to slug
     * @return string Generated slug
     */
    private static function generateSlug($name)
    {
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '_', $slug);
        $slug = trim($slug, '_');
        return $slug;
    }
}
