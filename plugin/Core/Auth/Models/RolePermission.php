<?php
namespace App\Core\Auth\Models;

use App\Utils\BaseModel;

class RolePermission extends BaseModel
{
    protected $table = 'sta_role_permissions';
    protected $primaryKey = ['role_id', 'permission_id'];
    
    protected $fillable = [
        'role_id',
        'permission_id'
    ];
    
    /**
     * Check if role has permission
     */
    public static function roleHasPermission($role_id, $permission_id)
    {
        global $wpdb;
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sta_role_permissions WHERE role_id = %s AND permission_id = %s",
            $role_id,
            $permission_id
        ));
        
        return $count > 0;
    }
    
    /**
     * Get permissions count for role
     */
    public static function getPermissionCountForRole($role_id)
    {
        global $wpdb;
        
        return $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sta_role_permissions WHERE role_id = %s",
            $role_id
        ));
    }
    
    /**
     * Get roles count for permission
     */
    public static function getRoleCountForPermission($permission_id)
    {
        global $wpdb;
        
        return $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sta_role_permissions WHERE permission_id = %s",
            $permission_id
        ));
    }

}
