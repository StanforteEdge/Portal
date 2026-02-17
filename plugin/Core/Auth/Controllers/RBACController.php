<?php
namespace App\Core\Auth\Controllers;

use \WP_REST_Request;
use \WP_REST_Response;
use App\Core\Auth\Services\RBACService;
use App\Utils\BaseController;
class RBACController extends BaseController
{
    // ==================== ROLE METHODS ====================
    
    /**
     * Get all roles
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listRoles(WP_REST_Request $request)
    {
        try {
            $roles = RBACService::getAllRoles();
            
            return static::success(['data' => array_map(function($role) {
                return (array) $role;
            }, $roles)], 200);
            
        } catch (\Exception $e) {
            error_log('Error listing roles: ' . $e->getMessage());
            return static::error('roles_error', 'Failed to retrieve roles', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get role by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRole(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Role ID is required', 400);
            }
            
            $role = RBACService::getRoleById($id);
            if (!$role) {
                return static::error('not_found', 'Role not found', 404);
            }
            
            return static::success(['data' => (array) $role], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting role: ' . $e->getMessage());
            return static::error('role_error', 'Failed to retrieve role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create new role
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createRole(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data['name'])) {
                return static::error('bad_request', 'Role name is required', 400);
            }
            
            $result = RBACService::createRole($data);
            
            if (is_wp_error($result)) {
                return static::error('role_create_error', $result->get_error_message(), 400);
            }
            
            return static::success(['data' => (array) $result], 201);
            
        } catch (\Exception $e) {
            error_log('Error creating role: ' . $e->getMessage());
            return static::error('role_create_error', 'Failed to create role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update role
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateRole(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Role ID is required', 400);
            }
            
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for update', 400);
            }
            
            $result = RBACService::updateRole($id, $data);
            
            if (is_wp_error($result)) {
                return static::error('role_update_error', $result->get_error_message(), 400);
            }
            
            $role = RBACService::getRoleById($id);
            
            return static::success(['data' => (array) $role], 200);
            
        } catch (\Exception $e) {
            error_log('Error updating role: ' . $e->getMessage());
            return static::error('role_update_error', 'Failed to update role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete role
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteRole(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Role ID is required', 400);
            }
            
            $result = RBACService::deleteRole($id);
            
            if (is_wp_error($result)) {
                return static::error('role_delete_error', $result->get_error_message(), 400);
            }
            
            return static::success(null, 204);
            
        } catch (\Exception $e) {
            error_log('Error deleting role: ' . $e->getMessage());
            return static::error('role_delete_error', 'Failed to delete role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== PERMISSION METHODS ====================
    
    /**
     * Get all permissions
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listPermissions(WP_REST_Request $request)
    {
        try {
            $permissions = RBACService::getAllPermissions();
            
            return static::success(['data' => array_map(function($permission) {
                return (array) $permission;
            }, $permissions)], 200);
            
        } catch (\Exception $e) {
            error_log('Error listing permissions: ' . $e->getMessage());
            return static::error('permissions_error', 'Failed to retrieve permissions', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get permission by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getPermission(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Permission ID is required', 400);
            }
            
            $permission = RBACService::getPermissionById($id);
            if (!$permission) {
                return static::error('not_found', 'Permission not found', 404);
            }
            
            return static::success(['data' => (array) $permission], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting permission: ' . $e->getMessage());
            return static::error('permission_error', 'Failed to retrieve permission', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create new permission
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createPermission(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data['name'])) {
                return static::error('bad_request', 'Permission name is required', 400);
            }
            
            $result = RBACService::createPermission($data);
            
            if (is_wp_error($result)) {
                return static::error('permission_create_error', $result->get_error_message(), 400);
            }
            
            $permission = RBACService::getPermissionById($result);
            
            return static::success(['data' => (array) $permission], 201);
            
        } catch (\Exception $e) {
            error_log('Error creating permission: ' . $e->getMessage());
            return static::error('permission_create_error', 'Failed to create permission', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update permission
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updatePermission(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Permission ID is required', 400);
            }
            
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for update', 400);
            }
            
            $result = RBACService::updatePermission($id, $data);
            
            if (is_wp_error($result)) {
                return static::error('permission_update_error', $result->get_error_message(), 400);
            }
            
            $permission = RBACService::getPermissionById($id);
            
            return static::success(['data' => (array) $permission], 200);
            
        } catch (\Exception $e) {
            error_log('Error updating permission: ' . $e->getMessage());
            return static::error('permission_update_error', 'Failed to update permission', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete permission
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deletePermission(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Permission ID is required', 400);
            }
            
            $result = RBACService::deletePermission($id);
            
            if (is_wp_error($result)) {
                return static::error('permission_delete_error', $result->get_error_message(), 400);
            }
            
            return static::success(null, 204);
            
        } catch (\Exception $e) {
            error_log('Error deleting permission: ' . $e->getMessage());
            return static::error('permission_delete_error', 'Failed to delete permission', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== ROLE-PERMISSION RELATIONSHIP METHODS ====================
    
    /**
     * Get role permissions
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getRolePermissions(WP_REST_Request $request)
    {
        try {
            $id = (string) $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Role ID is required', 400);
            }
            
            $permissions = RBACService::getRolePermissions($id);
            
            return static::success(['data' => array_map(function($permission) {
                return (array) $permission;
            }, $permissions)], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting role permissions: ' . $e->getMessage());
            return static::error('role_permissions_error', 'Failed to retrieve role permissions', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Assign permission to role
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function assignPermissionToRole(WP_REST_Request $request)
    {
        try {
            $role_id = (string) $request->get_param('id');
            $permission_id = (string) $request->get_param('permission_id');
            
            if (empty($role_id) || empty($permission_id)) {
                return static::error('bad_request', 'Role ID and permission ID are required', 400);
            }
            
            $result = RBACService::assignPermissionToRole($role_id, $permission_id);
            
            if (is_wp_error($result)) {
                return static::error('role_permission_assign_error', $result->get_error_message(), 400);
            }
            
            return static::success(['data' => ['success' => true]], 200);
            
        } catch (\Exception $e) {
            error_log('Error assigning permission to role: ' . $e->getMessage());
            return static::error('role_permission_assign_error', 'Failed to assign permission to role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Remove permission from role
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function removePermissionFromRole(WP_REST_Request $request)
    {
        try {
            $role_id = (string) $request->get_param('id');
            $permission_id = (string) $request->get_param('permission_id');
            
            if (empty($role_id) || empty($permission_id)) {
                return static::error('bad_request', 'Role ID and permission ID are required', 400);
            }
            
            $result = RBACService::removePermissionFromRole($role_id, $permission_id);
            
            if (is_wp_error($result)) {
                return static::error('role_permission_remove_error', $result->get_error_message(), 400);
            }
            
            return static::success(['data' => ['success' => true]], 200);
            
        } catch (\Exception $e) {
            error_log('Error removing permission from role: ' . $e->getMessage());
            return static::error('role_permission_remove_error', 'Failed to remove permission from role', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
}
